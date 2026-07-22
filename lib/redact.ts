/**
 * Prospect-facing payload redaction.
 *
 * Jay, 2026-07-22 (decisions 6 + 7, grill-lock_control-plane-and-growth):
 * DIM_DIVISOR_SHIPPINGCOW (225), ESTIMATED_COST_PER_LB, ZONE_RATE_MULTIPLIER and
 * LTL_COST_PER_MILE are internal working values pending reconciliation of
 * 221 vs 285 vs 225. No unauthenticated caller receives a dollar figure derived
 * from any of them — not on screen, and not in the JSON behind the screen.
 *
 * Rule applied here, deliberately blunt: an unauthenticated response carries
 * ZERO dollar-denominated fields. Not a rounded one, not a partial component.
 * A single surviving dollar plus the physical facts we do return (units/pallet,
 * inbound miles, customer's own dims) is enough to solve for a per-unit rate,
 * so the only safe cut line is "no currency at all". Physical quantities stay:
 * they come from the customer's own input or from public geography.
 *
 * Authenticated callers (valid `sc_session` cookie -> dashboard) get the full
 * object unchanged. Internal paths — Slack, lead records, DB writes, the audit
 * lead row — do not pass through this module and are unaffected.
 *
 * Do not add a currency field to a *Public type without a logged decision in
 * shippingcow/context/decisions/.
 */

// ── /api/audit/pallet ────────────────────────────────────────────

export type PalletResultPublic = {
  sku: unknown;
  closest_warehouse: string;
  warehouse_city: string;
  warehouse_state: string;
  trucking_distance_miles: number;
  units_per_pallet: number;
};

/**
 * Drops: trucking_cost (LTL_COST_PER_MILE), inbound_receiving,
 * per_unit.* in full — including per_unit.shipping, which is
 * getShippingRate(billable_225) and therefore the 225-derived rate itself —
 * pallet_total and cost_per_unit_all_in.
 */
export function redactPalletResult(r: {
  sku: unknown;
  closest_warehouse: string;
  warehouse_city: string;
  warehouse_state: string;
  trucking_distance_miles: number;
  units_per_pallet: number;
}): PalletResultPublic {
  return {
    sku: r.sku,
    closest_warehouse: r.closest_warehouse,
    warehouse_city: r.warehouse_city,
    warehouse_state: r.warehouse_state,
    trucking_distance_miles: r.trucking_distance_miles,
    units_per_pallet: r.units_per_pallet,
  };
}

// ── /api/allocation ──────────────────────────────────────────────

type AllocSkuLike = {
  sku: string;
  label: string;
  warehouse: string;
  units: number;
  pallets: number;
  units_per_pallet: number;
  inbound_distance_miles: number;
};

type AllocWhLike = {
  warehouse: string;
  warehouse_zip: string;
  total_units: number;
  total_pallets: number;
  inbound_distance_miles: number;
  skus: AllocSkuLike[];
};

export type AllocResultPublic = {
  origin_zip: string;
  label: string | null;
  total_units: number;
  total_pallets: number;
  warehouses: AllocWhLike[];
  errors: string[];
};

/**
 * Drops: total_inbound_ltl_cost, total_monthly_savings, total_annual_savings,
 * per-warehouse inbound_ltl_cost and weighted_savings_per_pkg, and per-SKU
 * inbound_cost_total (LTL_COST_PER_MILE), outbound_cost_per_pkg (225-derived),
 * outbound_savings_per_pkg / _monthly_ / _annual_ (ZONE_RATE_MULTIPLIER and
 * ESTIMATED_COST_PER_LB).
 */
export function redactAllocResult(result: {
  origin_zip: string;
  label: string | null;
  total_units: number;
  total_pallets: number;
  warehouses: Array<AllocWhLike>;
  errors: string[];
}): AllocResultPublic {
  return {
    origin_zip: result.origin_zip,
    label: result.label,
    total_units: result.total_units,
    total_pallets: result.total_pallets,
    warehouses: result.warehouses.map((wh) => ({
      warehouse: wh.warehouse,
      warehouse_zip: wh.warehouse_zip,
      total_units: wh.total_units,
      total_pallets: wh.total_pallets,
      inbound_distance_miles: wh.inbound_distance_miles,
      skus: wh.skus.map((s) => ({
        sku: s.sku,
        label: s.label,
        warehouse: s.warehouse,
        units: s.units,
        pallets: s.pallets,
        units_per_pallet: s.units_per_pallet,
        inbound_distance_miles: s.inbound_distance_miles,
      })),
    })),
    errors: result.errors,
  };
}

// ── /api/audit  (GET ?id= and POST) ──────────────────────────────
//
// Nature of this endpoint differs from the pallet one: the audit ID is emailed
// to the prospect, so HOLDING THE ID IS NOT AUTHENTICATION. An ID-bearing
// request with no session takes the redacted path. Nothing changes on screen —
// f80bf2f already removed every one of these from the rendered report — this
// only closes the devtools/Network read.

/** Currency-bearing keys on the AuditReport aggregate. */
const AUDIT_REPORT_MONEY_KEYS = [
  'total_current_cost',
  'total_sc_cost',
  'total_inbound_fees',
  'total_handling_fees',
  'total_last_mile_fees',
  'total_savings',
  'savings_percentage',
  'avg_savings_per_package',
] as const;

/** Currency-bearing keys on each ShipmentAnalysis row. */
const AUDIT_DETAIL_MONEY_KEYS = [
  'current_cost',
  'sc_cost',
  'inbound_cost_per_unit',
  'savings_per_package',
] as const;

function omit<T extends Record<string, unknown>>(obj: T, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k)) out[k] = v;
  }
  return out;
}

/**
 * Strips every dollar figure from an AuditReport, at both the aggregate level
 * and inside each shipment_details row.
 *
 * Deliberately KEPT: avg_billable_weight_225, sc_billable_225 and
 * dim_weight_reduction_pct. These are pounds and a weight ratio, not money,
 * and the rendered report shows the 225 billable weight by design (approved
 * copy: "Under ShippingCow it becomes X lbs"). They do let a determined reader
 * solve for the divisor — see the note in the handoff; that is decision-8
 * territory (constants treated as burned), not a dollar leak, and changing it
 * would change shipped copy. Not mine to decide.
 */
export function redactAuditReport(report: Record<string, unknown>): Record<string, unknown> {
  const out = omit(report, AUDIT_REPORT_MONEY_KEYS);
  const details = report.shipment_details;
  if (Array.isArray(details)) {
    out.shipment_details = details.map((d) =>
      d && typeof d === 'object' ? omit(d as Record<string, unknown>, AUDIT_DETAIL_MONEY_KEYS) : d
    );
  }
  return out;
}

/**
 * Redacts a stored audit row from `getAudit()`. `SELECT *` also returns the
 * `total_savings` column alongside the JSONB, so that is dropped too.
 */
export function redactAuditRow(row: Record<string, unknown>): Record<string, unknown> {
  const out = omit(row, ['total_savings']);
  const report = row.report_data;
  if (report && typeof report === 'object') {
    out.report_data = redactAuditReport(report as Record<string, unknown>);
  }
  return out;
}

// ── /api/calculator/estimate ─────────────────────────────────────

export type EstimatePublic = {
  current_zone: number;
  current_distance_miles: number;
  sc_warehouse: string;
  sc_zone: number;
  sc_distance_miles: number;
  zone_improvement: number;
  current_billable_139: number;
  dim139: number;
  dim166: number;
  bill139: number;
  bill166: number;
};

/**
 * Allowlist, not a denylist: this endpoint returned SEVEN dollar fields
 * (current_cost_per_pkg, sc_cost_per_pkg, inbound_cost_per_unit,
 * savings_per_pkg, annual_savings, old_estimate_per_pkg, old_estimate_annual),
 * and the only consumer — components/DimCalculator.tsx — renders none of them.
 * It reads zone, distance and warehouse only.
 *
 * Also dropped for unauthenticated callers: `sc_billable_225`, `dim225` and
 * `bill225`. Not money, but each one divided into the submitted volume yields
 * DIM_DIVISOR_SHIPPINGCOW exactly, and nothing on this page displays them.
 * Zero UI impact, one less way to read 225 (decision 7).
 */
export function redactEstimate(full: Record<string, unknown>): EstimatePublic {
  return {
    current_zone: full.current_zone as number,
    current_distance_miles: full.current_distance_miles as number,
    sc_warehouse: full.sc_warehouse as string,
    sc_zone: full.sc_zone as number,
    sc_distance_miles: full.sc_distance_miles as number,
    zone_improvement: full.zone_improvement as number,
    current_billable_139: full.current_billable_139 as number,
    dim139: full.dim139 as number,
    dim166: full.dim166 as number,
    bill139: full.bill139 as number,
    bill166: full.bill166 as number,
  };
}

/**
 * True when the caller holds a valid session. Fails CLOSED: any error reading
 * the session (e.g. the known DATABASE_URL blocker in shippingcow/control-plane/CURRENT_STATE.md) is
 * treated as unauthenticated, so an outage redacts more, never less.
 */
export async function hasDashboardSession(): Promise<boolean> {
  try {
    const { getCurrentUser } = await import('./auth');
    // Truthy check, not `!== null`: an undefined return (no row, changed
    // signature) must read as unauthenticated, not as a session.
    return Boolean(await getCurrentUser());
  } catch {
    return false;
  }
}
