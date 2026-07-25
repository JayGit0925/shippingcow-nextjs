import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { palletInboundCost } from '@/lib/pallet';
import { hasDashboardSession, redactPalletResult } from '@/lib/redact';

// Validation schema for pallet calculator request
const PalletRequestSchema = z.object({
  origin_zip: z.string().min(5).max(5),
  skus: z.array(
    z.object({
      name: z.string().optional(),
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
      weight: z.number().positive(),
    })
  ).min(1).max(100),
});

type PalletRequest = z.infer<typeof PalletRequestSchema>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const parsed = PalletRequestSchema.parse(body);
    const { origin_zip, skus } = parsed as PalletRequest;

    // Calculate cost for each SKU
    const results = await Promise.all(
      skus.map(async (sku) => {
        const costBreakdown = await palletInboundCost(origin_zip, sku);
        return costBreakdown;
      })
    );

    // Aggregate results
    const totalPalletCost = results.reduce((sum, r) => (r ? sum + r.pallet_total : sum), 0);
    const totalUnitsPerPallet = results.reduce((sum, r) => (r ? sum + r.units_per_pallet : sum), 0);
    const found = results.filter((r) => r !== null) as NonNullable<typeof results[number]>[];

    // Jay 2026-07-22 (decision 7): prospects get physical facts only. Every
    // dollar field here descends from LTL_COST_PER_MILE or from
    // getShippingRate(billable_225), i.e. DIM_DIVISOR_SHIPPINGCOW.
    // Authenticated dashboard callers still receive the full breakdown.
    const authed = await hasDashboardSession();

    if (!authed) {
      return NextResponse.json({
        success: true,
        origin_zip,
        sku_count: skus.length,
        results: found.map(redactPalletResult),
        totals: {
          total_units_per_pallet: totalUnitsPerPallet,
        },
      });
    }

    return NextResponse.json({
      success: true,
      origin_zip,
      sku_count: skus.length,
      results: found,
      totals: {
        total_pallet_cost: Math.round(totalPalletCost * 100) / 100,
        total_units_per_pallet: totalUnitsPerPallet,
        avg_cost_per_unit: totalUnitsPerPallet > 0
          ? Math.round((totalPalletCost / totalUnitsPerPallet) * 100) / 100
          : 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
