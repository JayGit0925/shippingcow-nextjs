import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  saveChatMessage,
  upsertChatSession,
  incrementSessionMessageCount,
  updateSessionQualification,
  markSessionSlackNotified,
  getChatSession,
  logChatEvent,
  getRecentChatMessages,
} from '@/lib/db';
import { CHAT_SYSTEM_PROMPT } from '@/lib/constants';
import { retrieveChunks, buildKbContext } from '@/lib/chat-kb';
import { sendLeadNotification } from '@/lib/notify';
import type { QualifyResult } from '@/lib/types';

const messageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages:             z.array(messageSchema).min(1).max(50),
  session_id:           z.string().optional(),
  page_url:             z.string().optional(),
  lead_id:              z.string().uuid().optional(),
  opener_variant:       z.string().optional(),
  calculator_context:   z.record(z.unknown()).optional(),
});

const RATE_LIMIT = 500;

const QUALIFY_PROMPT = `You are an ICP scoring engine for a B2B logistics company.
Score this user message for sales qualification. Reply with valid JSON only, no markdown.

ICP: e-commerce sellers shipping 50lb+ goods, 200+ shipments/month, $50K+/mo spend.

Fields:
- score: 0–100 (100 = perfect ICP, ready to convert)
- intent: "pricing" | "support" | "browsing" | "ready_to_buy"
- capture_ready: true if score>70 OR user asked for pricing/quote OR message count >= 3
- needs_human: true if user says "talk to human", "speak to someone", "call", "sales team", "demo"`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }

  const { messages, session_id, page_url, lead_id, opener_variant, calculator_context } = parsed.data;
  const lastUserMsg = messages.filter((m) => m.role === 'user').at(-1);

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({
      content: "Hi! I'm the ShippingCow AI 🐄 Chat isn't configured yet — add OPENROUTER_API_KEY to enable me. In the meantime, submit an inquiry and our team will reach out within one business day.",
    });
  }

  // Upsert session (non-blocking, don't fail request)
  let currentSession = null;
  if (session_id) {
    try {
      await upsertChatSession({ session_id, opener_variant, calculator_context });
      currentSession = await getChatSession(session_id);
    } catch (e) {
      console.error('[chat] session upsert error:', e);
    }
  }

  // Rate limit check
  if (currentSession && currentSession.message_count >= RATE_LIMIT) {
    return NextResponse.json({
      content: "You've mooooved through 500 messages — that's a record! 🐄 Start a fresh chat below, or email us at hello@shippingcow.ai.",
      rate_limited: true,
    });
  }

  // Build KB context from last user message
  const kbQuery = lastUserMsg?.content || '';
  const kbChunks = await retrieveChunks(kbQuery);
  const kbContext = buildKbContext(kbChunks);

  // Build calculator context string if available
  let calcContextStr = '';
  const calcCtx = calculator_context ?? currentSession?.calculator_context;
  if (calcCtx && Object.keys(calcCtx).length > 0) {
    calcContextStr = `\n\n--- USER CONTEXT ---\nThis user just ran the DIM calculator with these inputs: ${JSON.stringify(calcCtx)}. Reference this naturally if relevant.\n--- END CONTEXT ---`;
  }

  const systemPrompt = CHAT_SYSTEM_PROMPT + kbContext + calcContextStr;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Parallel: Sonnet reply + Haiku scoring
    const isFirstMessage = (currentSession?.message_count ?? 0) === 0;

    const [replyRes, qualifyResponse] = await Promise.all([
      fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://shippingcow.ai',
          'X-Title': 'ShippingCow',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            ...parsed.data.messages,
          ],
        }),
      }),
      lastUserMsg && process.env.ANTHROPIC_API_KEY
        ? client.messages.create({
            model:      'claude-haiku-4-5-20251001',
            max_tokens: 100,
            system:     QUALIFY_PROMPT,
            messages:   [{ role: 'user', content: lastUserMsg.content }],
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const replyData = await replyRes.json();
    const content = replyData.choices?.[0]?.message?.content ?? '';
    if (!content) {
      console.error('[chat] OpenRouter error:', JSON.stringify(replyData));
      throw new Error('Empty response from DeepSeek');
    }

    // Parse qualify result
    let qualify: QualifyResult = { score: 0, intent: 'browsing', capture_ready: false, needs_human: false };
    if (qualifyResponse) {
      try {
        const raw = qualifyResponse.content[0]?.type === 'text' ? qualifyResponse.content[0].text : '{}';
        qualify = JSON.parse(raw.trim());
      } catch {
        // Haiku scoring failed silently — non-blocking
      }
    }

    // Server-side capture_ready override — Haiku doesn't know message count
    const msgCount = currentSession?.message_count ?? 0;
    if (msgCount >= 2 || qualify.score >= 70) {
      qualify.capture_ready = true;
    }

    // Persist messages + update session (non-blocking)
    if (session_id && lastUserMsg) {
      Promise.all([
        saveChatMessage({ session_id, role: 'user',      content: lastUserMsg.content, page_url, lead_id }),
        saveChatMessage({ session_id, role: 'assistant', content,                       page_url, lead_id }),
        incrementSessionMessageCount(session_id),
        updateSessionQualification({ session_id, qualified_score: qualify.score }),
        isFirstMessage ? logChatEvent({ session_id, event_type: 'first_message', metadata: { page_url } }) : Promise.resolve(),
      ]).catch((e) => console.error('[chat] DB persist error:', e));
    }

    // Slack handoff — fire if needed (non-blocking)
    if (session_id && (qualify.needs_human || qualify.score >= 85)) {
      maybeSlackHandoff({
        session_id,
        page_url: page_url ?? '',
        messages: parsed.data.messages,
        qualified_score: qualify.score,
        email: currentSession?.email ?? null,
        slack_notified_at: currentSession?.slack_notified_at ?? null,
        trigger: qualify.needs_human ? 'human_requested' : 'score_threshold',
      });
    }

    return NextResponse.json({
      content,
      qualify,
      capture_ready: qualify.capture_ready,
    });
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Chat service unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}

async function maybeSlackHandoff(params: {
  session_id: string;
  page_url: string;
  messages: { role: string; content: string }[];
  qualified_score: number;
  email: string | null;
  slack_notified_at: string | null;
  trigger: 'human_requested' | 'score_threshold' | 'email_captured';
}) {
  if (params.slack_notified_at) return; // Already pinged
  try {
    const ok = await sendLeadNotification({
      session_id:      params.session_id,
      page_url:        params.page_url,
      email:           params.email,
      qualified_score: params.qualified_score,
      last_messages:   params.messages.slice(-5),
      trigger:         params.trigger,
    });
    if (ok) {
      await markSessionSlackNotified(params.session_id);
      await logChatEvent({
        session_id: params.session_id,
        event_type: 'handoff_slack',
        metadata: { trigger: params.trigger, score: params.qualified_score },
      });
    }
  } catch (e) {
    console.error('[chat] slack handoff error:', e);
  }
}

// Separate endpoint: email capture from widget
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    session_id: z.string(),
    email:      z.string().email(),
    page_url:   z.string().optional(),
    messages:   z.array(messageSchema).optional(),
    qualified_score: z.number().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { session_id, email, page_url, messages, qualified_score } = parsed.data;

  try {
    // Session ownership check: must exist, must be recent, must not already have an email
    const existing = await getChatSession(session_id);
    if (!existing) {
      return NextResponse.json({ error: 'Unknown session' }, { status: 404 });
    }
    if (existing.email) {
      return NextResponse.json({ error: 'Email already captured' }, { status: 409 });
    }
    const ageMs = Date.now() - new Date(existing.first_seen).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    await updateSessionQualification({ session_id, email, qualified_score: qualified_score ?? 0 });

    await logChatEvent({
      session_id,
      event_type: 'email_captured',
      metadata: { email, page_url },
    });

    // Slack ping on email capture
    const session = await getChatSession(session_id);
    if (!session?.slack_notified_at) {
      const recentMsgs = messages ?? await getRecentChatMessages(session_id, 5);
      await sendLeadNotification({
        session_id,
        page_url: page_url ?? '',
        email,
        qualified_score: session?.qualified_score ?? 0,
        last_messages: recentMsgs,
        trigger: 'email_captured',
      });
      await markSessionSlackNotified(session_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat] email capture error:', err);
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }
}
