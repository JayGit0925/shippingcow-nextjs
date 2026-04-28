import { NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeShipment, calculateBillableWeight } from '@/lib/cost';
import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_3PL,
  DIM_DIVISOR_SHIPPINGCOW,
  ESTIMATED_COST_PER_LB,
} from '@/lib/constants';

const schema = z.object({
  length: z.number().positive().max(120),
  width: z.number().positive().max(120),
  height: z.number().positive().max(120),
  weight: z.number().positive().max(500),
  monthly_volume: z.number().int().min(1).max(100000),
  origin_zip: z.string().regex(/^\d{5}$/, 'Origin ZIP must be 5 digits'),
  dest_zip: z.string().regex(/^\d{5}$/, 'Destination ZIP must be 5 digits'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { length, width, height, weight, monthly_volume, origin_zip, dest_zip } = parsed.data;

    // Run the real cost engine
    const analysis = await analyzeShipment({
      origin_zip,
      dest_zip,
      length,
      width,
      height,
      weight,
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Could not estimate for those ZIP codes. Try different locations.' },
        { status: 400 }
      );
    }

    // DIM weight comparison (same math as client-side, for reference)
    const vol = length * width * height;
    const dim139 = vol / DIM_DIVISOR_STANDARD;
    const dim166 = vol / DIM_DIVISOR_3PL;
    const dim225 = vol / DIM_DIVISOR_SHIPPINGCOW;
    const bill139 = Math.max(weight, dim139);
    const bill166 = Math.max(weight, dim166);
    const bill225 = Math.max(weight, dim225);

    // Annual savings using real cost engine
    const annual_savings = analysis.savings_per_package * monthly_volume * 12;

    // Old $0.45/lb estimate for comparison
    const lbs_saved = bill139 - bill225;
    const old_estimate_per_pkg = lbs_saved * ESTIMATED_COST_PER_LB;
    const old_estimate_annual = old_estimate_per_pkg * monthly_volume * 12;

    return NextResponse.json({
      // Zone info
      current_zone: analysis.current_zone,
      current_distance_miles: analysis.current_distance,
      sc_warehouse: analysis.sc_warehouse,
      sc_zone: analysis.sc_zone,
      sc_distance_miles: analysis.sc_distance,
      zone_improvement: analysis.zone_improvement,

      // Billable weights
      current_billable_139: Math.round(analysis.current_billable_139 * 10) / 10,
      sc_billable_225: Math.round(analysis.sc_billable_225 * 10) / 10,

      // Real costs
      current_cost_per_pkg: Math.round(analysis.current_cost * 100) / 100,
      sc_cost_per_pkg: Math.round(analysis.sc_cost * 100) / 100,
      inbound_cost_per_unit: Math.round(analysis.inbound_cost_per_unit * 100) / 100,
      savings_per_pkg: Math.round(analysis.savings_per_package * 100) / 100,
      annual_savings: Math.round(annual_savings),

      // DIM reference
      dim139: Math.round(dim139 * 10) / 10,
      dim166: Math.round(dim166 * 10) / 10,
      dim225: Math.round(dim225 * 10) / 10,
      bill139: Math.round(bill139 * 10) / 10,
      bill166: Math.round(bill166 * 10) / 10,
      bill225: Math.round(bill225 * 10) / 10,

      // Old estimate for comparison
      old_estimate_per_pkg: Math.round(old_estimate_per_pkg * 100) / 100,
      old_estimate_annual: Math.round(old_estimate_annual),
    });
  } catch (err) {
    console.error('[calculator-estimate]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
