import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveCalculatorSession } from '@/lib/db';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_3PL,
  DIM_DIVISOR_SHIPPINGCOW,
  ESTIMATED_COST_PER_LB,
} from '@/lib/constants';

const bodySchema = z.object({
  session_id:     z.string().optional(),
  length:         z.number().positive(),
  width:          z.number().positive(),
  height:         z.number().positive(),
  actual_weight:  z.number().positive(),
  monthly_volume: z.number().int().min(1),
});

export async function POST(req: Request) {
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
    return NextResponse.json({ id: session.id });
  } catch (err) {
    // Non-fatal — calculator still works even if DB save fails
    console.error('[calculator-session] save error:', err);
    return NextResponse.json({ id: null });
  }
}
