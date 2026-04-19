import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

const SYSTEM_PROMPT = `You are the ShippingCow AI assistant — a friendly, concise expert on e-commerce
fulfillment and shipping cost optimization. ShippingCow helps online sellers (Amazon, Shopify, WooCommerce,
and others) reduce shipping costs by routing orders through the best carrier and service level for each
package.

When answering:
- Be helpful, direct, and use plain language.
- Focus on actionable advice around shipping costs, carrier selection, zone skipping, dimensional weight,
  and fulfillment strategy.
- If asked about ShippingCow pricing or features, encourage the user to visit /inquiry or check /pricing.
- Keep responses under 200 words unless a detailed breakdown is truly needed.
- Never make up specific rate data — recommend the user run a real quote instead.`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request' },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      content:
        "Hi! I'm the ShippingCow AI 🐄 Chat isn't configured yet — add ANTHROPIC_API_KEY to your environment to enable me. In the meantime, submit an inquiry and our team will reach out within one business day.",
    });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: parsed.data.messages,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    if (!content) throw new Error('Empty response');

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Chat service unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
