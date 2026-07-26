import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { analyzeShipment, type ShipmentAnalysis, getHandlingFee } from '@/lib/cost';
import { saveAudit, getAudit } from '@/lib/db';
import { hasDashboardSession, redactAuditReport, redactAuditRow } from '@/lib/redact';

const shipmentSchema = z.object({
  origin_zip: z.string().regex(/^\d{5}$/, 'Origin ZIP must be 5 digits'),
  dest_zip: z.string().regex(/^\d{5}$/, 'Destination ZIP must be 5 digits'),
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  weight: z.number().positive('Weight must be positive'),
  quantity: z.number().int().positive().default(1),
  current_cost: z.number().nonnegative().optional(),
});

const bodySchema = z.object({
  shipments: z.array(shipmentSchema).min(1).max(1000),
});

export type AuditRequest = z.infer<typeof bodySchema>;
export type AuditShipment = z.infer<typeof shipmentSchema>;

export type AuditReport = {
  total_shipments: number;
  total_packages: number;

  // Zone distribution
  current_zone_distribution: Record<number, number>;
  current_zone_percentages: Record<number, number>;
  sc_zone_distribution: Record<number, number>;
  sc_zone_percentages: Record<number, number>;

  // Cost summary — INTERNAL SHAPE. This type describes the report as computed
  // and as stored in `audits.report_data`. Every field below is stripped from
  // the HTTP response for unauthenticated callers (lib/redact.ts, Jay decision
  // 7, 2026-07-22), so client code must not assume they are present at runtime.
  total_current_cost: number;
  total_sc_cost: number;
  total_inbound_fees: number;
  total_handling_fees: number;
  total_last_mile_fees: number;
  total_savings: number;
  savings_percentage: number;
  avg_savings_per_package: number;

  // DIM impact
  avg_billable_weight_139: number;
  avg_billable_weight_225: number;
  dim_weight_reduction_pct: number;

  // Smart routing impact
  shipments_zone_improved: number;
  shipments_within_zone_5: number;
  pct_within_zone_5: number;
  avg_zone_before: number;
  avg_zone_after: number;

  // Warehouse split
  warehouse_distribution: Record<string, number>;

  // Per-shipment details
  shipment_details: Array<ShipmentAnalysis & {
    origin_zip: string;
    dest_zip: string;
    length: number;
    width: number;
    height: number;
    weight: number;
    quantity: number;
  }>;

  // Metadata
  unmatched_count: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const audit = await getAudit(id);
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Jay 2026-07-22 (decision 7): the audit ID is emailed to the prospect, so
    // possession of the ID is NOT authentication. Without a dashboard session
    // every dollar field is stripped from the row and from report_data.
    // The rendered report already shows none of them (f80bf2f).
    const authed = await hasDashboardSession();
    if (!authed) {
      return NextResponse.json(redactAuditRow(audit as unknown as Record<string, unknown>));
    }

    return NextResponse.json(audit);
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit get]', err);
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const error = parsed.error.issues[0];
      return NextResponse.json(
        { error: error?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { shipments } = parsed.data;
    const shipment_details: AuditReport['shipment_details'] = [];
    let unmatched_count = 0;

    // Analyze each shipment
    for (const shipment of shipments) {
      const analysis = await analyzeShipment(shipment);

      if (!analysis) {
        unmatched_count++;
        continue;
      }

      shipment_details.push({
        ...analysis,
        origin_zip: shipment.origin_zip,
        dest_zip: shipment.dest_zip,
        length: shipment.length,
        width: shipment.width,
        height: shipment.height,
        weight: shipment.weight,
        quantity: shipment.quantity || 1,
      });
    }

    // Aggregate results
    const total_shipments = shipment_details.length;
    const total_packages = shipment_details.reduce((sum, s) => sum + (s.quantity || 1), 0);

    if (total_shipments === 0) {
      return NextResponse.json(
        { error: 'No valid shipments found. Check that all ZIPs exist in our database.' },
        { status: 400 }
      );
    }

    // Zone distributions
    const current_zone_distribution: Record<number, number> = {};
    const sc_zone_distribution: Record<number, number> = {};
    let total_current_cost = 0;
    let total_sc_cost = 0;
    let total_inbound_fees = 0;
    let total_handling_fees = 0;
    let total_last_mile_fees = 0;
    let shipments_zone_improved = 0;
    let shipments_within_zone_5 = 0;
    let sum_current_zone = 0;
    let sum_sc_zone = 0;
    let sum_billable_139 = 0;
    let sum_billable_225 = 0;
    const warehouse_distribution: Record<string, number> = { NJ: 0, TX: 0, CA: 0 };

    for (const detail of shipment_details) {
      const qty = detail.quantity || 1;

      // Cost aggregates
      total_current_cost += detail.current_cost * qty;
      total_sc_cost += detail.sc_cost * qty;

      // Break down SC cost into components
      const handlingFee = getHandlingFee(detail.length, detail.width, detail.height, detail.weight);
      const inboundFee = detail.inbound_cost_per_unit || 0;
      total_inbound_fees += inboundFee * qty;
      total_handling_fees += handlingFee * qty;
      total_last_mile_fees += (detail.sc_cost - inboundFee - handlingFee) * qty;

      // Zone improvements
      if (detail.zone_improvement > 0) {
        shipments_zone_improved++;
      }
      if (detail.sc_zone <= 5) {
        shipments_within_zone_5++;
      }

      // Accumulate for averages
      sum_current_zone += detail.current_zone * qty;
      sum_sc_zone += detail.sc_zone * qty;
      sum_billable_139 += detail.current_billable_139 * qty;
      sum_billable_225 += detail.sc_billable_225 * qty;

      // Zone distributions
      current_zone_distribution[detail.current_zone] =
        (current_zone_distribution[detail.current_zone] || 0) + qty;
      sc_zone_distribution[detail.sc_zone] =
        (sc_zone_distribution[detail.sc_zone] || 0) + qty;

      // Warehouse distribution
      warehouse_distribution[detail.sc_warehouse] = (warehouse_distribution[detail.sc_warehouse] ?? 0) + 1;
    }

    const total_savings = total_current_cost - total_sc_cost;
    const savings_percentage = total_current_cost > 0 ? (total_savings / total_current_cost) * 100 : 0;
    const avg_savings_per_package = total_packages > 0 ? total_savings / total_packages : 0;

    const avg_billable_weight_139 = total_packages > 0 ? sum_billable_139 / total_packages : 0;
    const avg_billable_weight_225 = total_packages > 0 ? sum_billable_225 / total_packages : 0;
    const dim_weight_reduction_pct =
      avg_billable_weight_139 > 0 ? ((avg_billable_weight_139 - avg_billable_weight_225) / avg_billable_weight_139) * 100 : 0;

    const avg_zone_before = total_packages > 0 ? sum_current_zone / total_packages : 0;
    const avg_zone_after = total_packages > 0 ? sum_sc_zone / total_packages : 0;
    const pct_within_zone_5 = total_shipments > 0 ? (shipments_within_zone_5 / total_shipments) * 100 : 0;

    // Calculate zone percentages
    const current_zone_percentages: Record<number, number> = {};
    const sc_zone_percentages: Record<number, number> = {};

    for (let zone = 2; zone <= 8; zone++) {
      current_zone_percentages[zone] =
        total_packages > 0 ? ((current_zone_distribution[zone] || 0) / total_packages) * 100 : 0;
      sc_zone_percentages[zone] =
        total_packages > 0 ? ((sc_zone_distribution[zone] || 0) / total_packages) * 100 : 0;
    }

    const report: AuditReport = {
      total_shipments,
      total_packages,

      current_zone_distribution,
      current_zone_percentages,
      sc_zone_distribution,
      sc_zone_percentages,

      total_current_cost,
      total_sc_cost,
      total_inbound_fees,
      total_handling_fees,
      total_last_mile_fees,
      total_savings,
      savings_percentage,
      avg_savings_per_package,

      avg_billable_weight_139,
      avg_billable_weight_225,
      dim_weight_reduction_pct,

      shipments_zone_improved,
      shipments_within_zone_5,
      pct_within_zone_5,
      avg_zone_before,
      avg_zone_after,

      warehouse_distribution,

      shipment_details,
      unmatched_count,
    };

    // Save to database — the STORED report keeps every dollar field. Internal
    // values are unchanged (Jay decision 6); only the response is redacted.
    let auditId: string | null = null;
    try {
      auditId = await saveAudit({
        input_data: { shipment_count: shipments.length, sample: shipments.slice(0, 3) },
        report_data: report,
        row_count: total_shipments,
        total_savings: Math.round(total_savings * 100) / 100,
      });
    } catch (dbErr) {
      Sentry.captureException(dbErr);
      console.error('[audit] DB save error:', dbErr);
      // Still return the report even if DB save fails
    }

    // Same rule as the GET: a fresh audit run is an anonymous prospect until
    // proven otherwise, so the response carries no dollars (decision 7).
    const authed = await hasDashboardSession();
    const payload = authed ? report : redactAuditReport(report as unknown as Record<string, unknown>);

    return NextResponse.json(auditId ? { ...payload, id: auditId } : payload);
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit]', err);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
