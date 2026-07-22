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

/**
 * True when the caller holds a valid session. Fails CLOSED: any error reading
 * the session (e.g. the known DATABASE_URL blocker in website/ISSUES.md) is
 * treated as unauthenticated, so an outage redacts more, never less.
 */
export async function hasDashboardSession(): Promise<boolean> {
  try {
    const { getCurrentUser } = await import('./auth');
    return (await getCurrentUser()) !== null;
  } catch {
    return false;
  }
}
