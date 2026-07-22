import { describe, it, expect, vi, beforeEach } from 'vitest';

// End-to-end proof of Jay decision 7 (2026-07-22) at the HTTP boundary:
// the same request returns physical facts only without a session, and the full
// breakdown with one. lib/pallet is mocked so the test does not need the
// database (the DATABASE_URL blocker in shippingcow/control-plane/CURRENT_STATE.md).

const FULL = {
  sku: { name: 'Grill', length: 30, width: 24, height: 20, weight: 85 },
  closest_warehouse: 'New Brunswick',
  warehouse_city: 'New Brunswick',
  warehouse_state: 'NJ',
  trucking_distance_miles: 32.5,
  trucking_cost: 13,
  units_per_pallet: 8,
  inbound_receiving: 25,
  per_unit: { storage_monthly: 1.2, handling: 3.4, shipping: 9.9, carrier: 'FDX', total: 14.5 },
  pallet_total: 154,
  cost_per_unit_all_in: 19.25,
};

vi.mock('@/lib/pallet', () => ({
  palletInboundCost: vi.fn(async () => FULL),
}));

const getCurrentUser = vi.fn();
vi.mock('@/lib/auth', () => ({ getCurrentUser }));

const BODY = {
  origin_zip: '08901',
  skus: [{ name: 'Grill', length: 30, width: 24, height: 20, weight: 85 }],
};

async function post() {
  const { POST } = await import('@/app/api/audit/pallet/route');
  const req = new Request('http://localhost/api/audit/pallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(BODY),
  });
  const res = await POST(req as never);
  return res.json();
}

describe('/api/audit/pallet payload by session state', () => {
  beforeEach(() => { getCurrentUser.mockReset(); });

  it('unauthenticated: no currency anywhere in the response', async () => {
    getCurrentUser.mockResolvedValue(null);
    const json = await post();
    const flat = JSON.stringify(json);
    expect(Object.keys(json.results[0]).sort()).toEqual([
      'closest_warehouse', 'sku', 'trucking_distance_miles',
      'units_per_pallet', 'warehouse_city', 'warehouse_state',
    ]);
    expect(Object.keys(json.totals)).toEqual(['total_units_per_pallet']);
    for (const banned of ['trucking_cost', 'inbound_receiving', 'per_unit', 'pallet_total', 'cost_per_unit_all_in', 'total_pallet_cost', 'avg_cost_per_unit']) {
      expect(flat).not.toContain(banned);
    }
    // and none of the dollar VALUES survive either
    for (const v of [13, 25, 1.2, 3.4, 9.9, 14.5, 154, 19.25]) {
      expect(flat).not.toContain(`:${v}`);
    }
  });

  it('authenticated: full breakdown is preserved', async () => {
    getCurrentUser.mockResolvedValue({ id: 1, email: 'a@b.co' });
    const json = await post();
    expect(json.results[0].pallet_total).toBe(154);
    expect(json.results[0].per_unit.total).toBe(14.5);
    expect(json.totals.total_pallet_cost).toBe(154);
  });

  it('fails closed: a session lookup error redacts rather than exposes', async () => {
    getCurrentUser.mockRejectedValue(new Error('DATABASE_URL missing'));
    const json = await post();
    expect(json.results[0].pallet_total).toBeUndefined();
    expect(json.totals.total_pallet_cost).toBeUndefined();
  });
});
