import { describe, it, expect } from 'vitest';
import { redactPalletResult, redactAllocResult } from '../lib/redact';

// Jay decision 7 (2026-07-22): an unauthenticated caller receives no dollar
// field derived from DIM_DIVISOR_SHIPPINGCOW / ESTIMATED_COST_PER_LB /
// ZONE_RATE_MULTIPLIER / LTL_COST_PER_MILE. These tests fail if anyone
// re-adds one to a public payload.

// `total_pallets` (a count) must NOT match; `total_pallet_cost` must.
const CURRENCY_KEY = /(cost|price|_rate|savings|per_pkg|receiving|per_unit)/i;

function collectKeys(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) { v.forEach((x) => collectKeys(x, out)); return out; }
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) { out.push(k); collectKeys(val, out); }
  }
  return out;
}

const palletFull = {
  sku: { name: 'A', length: 12, width: 10, height: 8, weight: 25 },
  closest_warehouse: 'NJ', warehouse_city: 'New Brunswick', warehouse_state: 'NJ',
  trucking_distance_miles: 32.5, trucking_cost: 13, units_per_pallet: 40,
  inbound_receiving: 25,
  per_unit: { storage_monthly: 1.2, handling: 3.4, shipping: 9.9, carrier: 'X', total: 14.5 },
  pallet_total: 618, cost_per_unit_all_in: 15.45,
};

const allocFull = {
  origin_zip: '08901', label: null, total_units: 1000, total_pallets: 25,
  total_inbound_ltl_cost: 400, total_monthly_savings: 900, total_annual_savings: 10800,
  errors: [],
  warehouses: [{
    warehouse: 'NJ', warehouse_zip: '08901', total_units: 1000, total_pallets: 25,
    inbound_distance_miles: 32.5, inbound_ltl_cost: 400, weighted_savings_per_pkg: 0.9,
    skus: [{
      sku: 'S1', label: 'Grill', warehouse: 'NJ', units: 1000, pallets: 25,
      units_per_pallet: 40, inbound_distance_miles: 32.5, inbound_cost_total: 400,
      outbound_cost_per_pkg: 18.2, outbound_savings_per_pkg: 0.9,
      outbound_monthly_savings: 900, outbound_annual_savings: 10800,
    }],
  }],
};

describe('public payload redaction', () => {
  it('pallet: strips every currency-bearing key', () => {
    const keys = collectKeys(redactPalletResult(palletFull as never));
    expect(keys.filter((k) => CURRENCY_KEY.test(k))).toEqual([]);
  });

  it('pallet: keeps the physical facts', () => {
    const r = redactPalletResult(palletFull as never);
    expect(r.units_per_pallet).toBe(40);
    expect(r.trucking_distance_miles).toBe(32.5);
    expect(r.closest_warehouse).toBe('NJ');
  });

  it('allocation: strips every currency-bearing key at all three levels', () => {
    const keys = collectKeys(redactAllocResult(allocFull as never));
    expect(keys.filter((k) => CURRENCY_KEY.test(k))).toEqual([]);
  });

  it('allocation: keeps units, pallets and miles', () => {
    const r = redactAllocResult(allocFull as never);
    expect(r.total_pallets).toBe(25);
    expect(r.warehouses[0].inbound_distance_miles).toBe(32.5);
    expect(r.warehouses[0].skus[0].units_per_pallet).toBe(40);
  });

  it('no numeric value in a redacted payload equals a known dollar amount', () => {
    const dollars = [13, 25, 1.2, 3.4, 9.9, 14.5, 618, 15.45, 400, 900, 10800, 18.2, 0.9];
    const json = JSON.stringify([redactPalletResult(palletFull as never), redactAllocResult(allocFull as never)]);
    const nums = (json.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    // 25 legitimately appears as unit weight and pallet count; exclude the
    // physical fields' values from the comparison by checking the dollar-only set.
    const dollarOnly = dollars.filter((d) => ![25, 40, 32.5, 1000].includes(d));
    expect(nums.filter((n) => dollarOnly.includes(n))).toEqual([]);
  });
});
