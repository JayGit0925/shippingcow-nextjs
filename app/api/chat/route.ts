import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Message } from '@/lib/types';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
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

  const litellmUrl = process.env.LITELLM_URL;
  if (!litellmUrl) {
    // Graceful fallback so the chat widget still works in dev without a key
    return NextResponse.json({
      content:
        "Hi! I'm the ShippingCow AI. Chat is not configured yet — set LITELLM_URL in .env.local to enable me. In the meantime, feel free to submit an inquiry and our team will reach out.",
    });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.LITELLM_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.LITELLM_API_KEY}`;
  }

  try {
    const upstream = await fetch(`${litellmUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: process.env.LITELLM_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...parsed.data.messages,
        ] satisfies Message[],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[chat] LiteLLM error:', upstream.status, text);
      throw new Error(`Upstream ${upstream.status}`);
    }

    const data = await upstream.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    if (!content) throw new Error('Empty response from LiteLLM');

    return NextResponse.json({ content });
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Chat service unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
