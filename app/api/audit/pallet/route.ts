import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { palletInboundCost } from '@/lib/pallet';

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

    return NextResponse.json({
      success: true,
      origin_zip,
      sku_count: skus.length,
      results: results.filter((r) => r !== null),
      totals: {
        total_pallet_cost: Math.round(totalPalletCost * 100) / 100,
        total_units_per_pallet: totalUnitsPerPallet,
        avg_cost_per_unit: results.length > 0
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
