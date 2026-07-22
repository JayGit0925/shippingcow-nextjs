import { describe, it, expect, vi, beforeEach } from 'vitest';

// Jay decision 7 follow-up (2026-07-22): /api/audit is the biggest
// prospect-facing payload. The audit ID is emailed to the prospect, so holding
// the ID is NOT authentication — an ID-bearing request with no session gets
// the redacted row. lib/db is mocked: the DATABASE_URL blocker in
// shippingcow/control-plane/CURRENT_STATE.md means no real database is reachable here.

const MONEY_KEY = /(cost|price|savings|_fees|per_pkg)/i;

const REPORT = {
  total_shipments: 2,
  total_packages: 10,
  current_zone_distribution: { 7: 10 },
  current_zone_percentages: { 7: 100 },
  sc_zone_distribution: { 4: 10 },
  sc_zone_percentages: { 4: 100 },
  total_current_cost: 812.5,
  total_sc_cost: 601.25,
  total_inbound_fees: 33.1,
  total_handling_fees: 44.2,
  total_last_mile_fees: 523.95,
  total_savings: 211.25,
  savings_percentage: 26.0,
  avg_savings_per_package: 21.125,
  avg_billable_weight_139: 96.4,
  avg_billable_weight_225: 85.0,
  dim_weight_reduction_pct: 11.8,
  shipments_zone_improved: 2,
  shipments_within_zone_5: 2,
  pct_within_zone_5: 100,
  avg_zone_before: 7,
  avg_zone_after: 4,
  warehouse_distribution: { NJ: 2, TX: 0, CA: 0 },
  unmatched_count: 0,
  shipment_details: [{
    origin_zip: '08901', dest_zip: '90210',
    length: 30, width: 24, height: 20, weight: 85, quantity: 5,
    current_zone: 7, current_distance: 2450, current_billable_139: 96.4,
    current_cost: 81.25,
    sc_warehouse: 'CA', sc_zone: 4, sc_distance: 40, sc_billable_225: 85,
    sc_cost: 60.125,
    inbound_warehouse_distance: 32.5, units_per_pallet: 8,
    inbound_cost_per_unit: 3.31,
    savings_per_package: 21.125, zone_improvement: 3,
  }],
};

const ROW = {
  id: 'aaaa-bbbb', row_count: 2, created_at: '2026-07-22T00:00:00Z',
  lead_id: null, input_data: { shipment_count: 2 },
  total_savings: 211.25,
  report_data: REPORT,
};

const getAudit = vi.fn();
vi.mock('@/lib/db', () => ({ getAudit, saveAudit: vi.fn(async () => 'aaaa-bbbb') }));

const getCurrentUser = vi.fn();
vi.mock('@/lib/auth', () => ({ getCurrentUser }));

async function get() {
  const { GET } = await import('@/app/api/audit/route');
  const res = await GET(new Request('http://localhost/api/audit?id=aaaa-bbbb'));
  return res.json();
}

function allKeys(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) { v.forEach((x) => allKeys(x, out)); return out; }
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) { out.push(k); allKeys(val, out); }
  }
  return out;
}

describe('GET /api/audit — payload by session state', () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    // Default: anonymous. An undefined return must also read as anonymous —
    // hasDashboardSession() uses a truthy check for exactly that reason.
    getCurrentUser.mockResolvedValue(null);
    getAudit.mockReset();
    getAudit.mockResolvedValue(ROW);
  });

  it('unauthenticated (holds the emailed ID): exact key set, no money', async () => {
    const json = await get();
    expect(Object.keys(json).sort()).toEqual([
      'created_at', 'id', 'input_data', 'lead_id', 'report_data', 'row_count',
    ]);
    expect(Object.keys(json.report_data).sort()).toEqual([
      'avg_billable_weight_139', 'avg_billable_weight_225', 'avg_zone_after',
      'avg_zone_before', 'current_zone_distribution', 'current_zone_percentages',
      'dim_weight_reduction_pct', 'pct_within_zone_5', 'sc_zone_distribution',
      'sc_zone_percentages', 'shipment_details', 'shipments_within_zone_5',
      'shipments_zone_improved', 'total_packages', 'total_shipments',
      'unmatched_count', 'warehouse_distribution',
    ]);
    expect(Object.keys(json.report_data.shipment_details[0]).sort()).toEqual([
      'current_billable_139', 'current_distance', 'current_zone', 'dest_zip',
      'height', 'inbound_warehouse_distance', 'length', 'origin_zip', 'quantity',
      'sc_billable_225', 'sc_distance', 'sc_warehouse', 'sc_zone',
      'units_per_pallet', 'weight', 'width', 'zone_improvement',
    ]);
    expect(allKeys(json).filter((k) => MONEY_KEY.test(k))).toEqual([]);
  });

  it('unauthenticated: no known dollar VALUE survives anywhere', async () => {
    // Compare numeric TOKENS, not substrings: "26" also occurs inside the
    // created_at timestamp "2026-07-22", which is not a dollar.
    const flat = JSON.stringify(await get());
    const nums = new Set((flat.match(/-?\d+(\.\d+)?/g) || []).map(Number));
    const dollars = [812.5, 601.25, 33.1, 44.2, 523.95, 211.25, 21.125, 81.25, 60.125, 3.31];
    expect(dollars.filter((d) => nums.has(d))).toEqual([]);
  });

  it('authenticated: full row is preserved', async () => {
    getCurrentUser.mockResolvedValue({ id: 1, email: 'a@b.co' });
    const json = await get();
    expect(json.total_savings).toBe(211.25);
    expect(json.report_data.savings_percentage).toBe(26.0);
    expect(json.report_data.shipment_details[0].sc_cost).toBe(60.125);
  });

  it('fails closed: session lookup error redacts', async () => {
    getCurrentUser.mockRejectedValue(new Error('DATABASE_URL missing'));
    const json = await get();
    expect(json.total_savings).toBeUndefined();
    expect(json.report_data.total_savings).toBeUndefined();
  });

  it('fails closed: an undefined session return redacts', async () => {
    getCurrentUser.mockResolvedValue(undefined);
    const json = await get();
    expect(json.total_savings).toBeUndefined();
    expect(json.report_data.savings_percentage).toBeUndefined();
  });

  it('the report the customer still sees keeps its defensible facts', async () => {
    const json = await get();
    expect(json.report_data.avg_billable_weight_139).toBe(96.4);
    expect(json.report_data.pct_within_zone_5).toBe(100);
    expect(json.report_data.shipment_details[0].current_billable_139).toBe(96.4);
    expect(json.report_data.shipment_details[0].units_per_pallet).toBe(8);
  });
});
