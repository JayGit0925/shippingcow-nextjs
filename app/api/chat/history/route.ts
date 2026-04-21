import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getChatSessionByEmail, getRecentChatMessages } from '@/lib/db';

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ summary: null });

  const session = await getChatSessionByEmail(parsed.data.email).catch(() => null);
  if (!session) return NextResponse.json({ summary: null });

  const messages = await getRecentChatMessages(session.session_id, 20).catch(() => []);
  if (messages.length < 2) return NextResponse.json({ summary: null });

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ summary: null });

  try {
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Visitor' : 'Bot'}: ${m.content}`)
      .join('\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system:     'Summarize this chat in 1–2 sentences. Focus on what the user sells, their shipping pain, and any numbers mentioned. Plain text only.',
      messages:   [{ role: 'user', content: transcript }],
    });

    const summary = res.content[0]?.type === 'text' ? res.content[0].text : null;
    return NextResponse.json({ summary, prior_session_id: session.session_id });
  } catch {
    return NextResponse.json({ summary: null });
  }
}
