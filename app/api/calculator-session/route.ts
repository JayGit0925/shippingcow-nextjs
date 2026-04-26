import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveCalculatorSession } from '@/lib/db';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_3PL,
  DIM_DIVISOR_SHIPPINGCOW,
  ESTIMATED_COST_PER_LB,
} from '@/lib/constants';

async function fireHighValueAlert(data: {
  length: number; width: number; height: number;
  actual_weight: number; monthly_volume: number; annualSavings: number;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const text = [
    `🐄 *High-value calculator session* — $${Math.round(data.annualSavings).toLocaleString()}/yr potential`,
    `Dims: ${data.length}×${data.width}×${data.height} in | Weight: ${data.actual_weight} lbs | Volume: ${data.monthly_volume}/mo`,
  ].join('\n');

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

const bodySchema = z.object({
  session_id:     z.string().optional(),
  length:         z.number().positive().max(120),
  width:          z.number().positive().max(120),
  height:         z.number().positive().max(120),
  actual_weight:  z.number().positive().max(500),
  monthly_volume: z.number().int().min(1).max(100000),
});

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || record.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const { session_id, length, width, height, actual_weight, monthly_volume } = parsed.data;
  const vol = length * width * height;

  const dim139 = vol / DIM_DIVISOR_STANDARD;
  const dim166 = vol / DIM_DIVISOR_3PL;
  const dim225 = vol / DIM_DIVISOR_SHIPPINGCOW;

  const bill139 = Math.max(actual_weight, dim139);
  const bill225 = Math.max(actual_weight, dim225);

  const savingsPerPkg  = (bill139 - bill225) * ESTIMATED_COST_PER_LB;
  const annualSavings  = savingsPerPkg * monthly_volume * 12;

  try {
    const session = await saveCalculatorSession({
      session_id,
      inputs: { length, width, height, actual_weight, monthly_volume },
      dim_weight_139:      Math.round(dim139 * 100) / 100,
      dim_weight_166:      Math.round(dim166 * 100) / 100,
      dim_weight_225:      Math.round(dim225 * 100) / 100,
      billable_weight_139: Math.round(bill139 * 100) / 100,
      billable_weight_225: Math.round(bill225 * 100) / 100,
      savings_per_package: Math.round(savingsPerPkg * 100) / 100,
      annual_savings:      Math.round(annualSavings * 100) / 100,
    });

    // Alert on high-value sessions (>$25K annual savings)
    if (annualSavings >= 25000) {
      fireHighValueAlert({ length, width, height, actual_weight, monthly_volume, annualSavings }).catch(
        (e) => console.error('[calculator-session] alert error:', e)
      );
    }

    return NextResponse.json({ id: session.id });
  } catch (err) {
    // Non-fatal — calculator still works even if DB save fails
    console.error('[calculator-session] save error:', err);
    return NextResponse.json({ id: null });
  }
}
