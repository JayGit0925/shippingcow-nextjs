import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveChatMessage } from '@/lib/db';
import { CHAT_SYSTEM_PROMPT } from '@/lib/constants';

const messageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages:   z.array(messageSchema).min(1).max(50),
  session_id: z.string().optional(),
  page_url:   z.string().optional(),
  lead_id:    z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }

  const { messages, session_id, page_url, lead_id } = parsed.data;
  const lastUserMsg = messages.filter((m) => m.role === 'user').at(-1);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content:
        "Hi! I'm the ShippingCow AI 🐄 Chat isn't configured yet — add ANTHROPIC_API_KEY to enable me. In the meantime, submit an inquiry and our team will reach out within one business day.",
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 500,
      system:     CHAT_SYSTEM_PROMPT,
      messages:   parsed.data.messages,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    if (!content) throw new Error('Empty response');

    // Persist both turns — non-blocking, don't fail the HTTP response if DB is down
    if (session_id && lastUserMsg) {
      Promise.all([
        saveChatMessage({ session_id, role: 'user',      content: lastUserMsg.content, page_url, lead_id }),
        saveChatMessage({ session_id, role: 'assistant', content,                       page_url, lead_id }),
      ]).catch((e) => console.error('[chat] DB save error:', e));
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Chat service unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
