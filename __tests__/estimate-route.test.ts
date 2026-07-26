import { describe, it, expect, vi, beforeEach } from 'vitest';

// Jay decision 7 follow-up (2026-07-22). lib/cost is mocked so the test does
// not need the ZIP database (DATABASE_URL blocker, shippingcow/control-plane/CURRENT_STATE.md).

const MONEY_KEY = /(cost|price|savings|estimate|per_pkg)/i;

const ANALYSIS = {
  current_zone: 7, current_distance: 2450, current_billable_139: 96.4,
  current_cost: 81.25,
  sc_warehouse: 'CA', sc_zone: 4, sc_distance: 40, sc_billable_225: 85,
  sc_cost: 60.125,
  inbound_warehouse_distance: 32.5, units_per_pallet: 8,
  inbound_cost_per_unit: 3.31,
  savings_per_package: 21.125, zone_improvement: 3,
};

vi.mock('@/lib/cost', () => ({
  analyzeShipment: vi.fn(async () => ANALYSIS),
  calculateBillableWeight: vi.fn(() => 85),
}));

const getCurrentUser = vi.fn();
vi.mock('@/lib/auth', () => ({ getCurrentUser }));

const isRateLimited = vi.fn(() => false);
vi.mock('@/lib/rate-limit', () => ({ isRateLimited }));

async function postRaw() {
  const { POST } = await import('@/app/api/calculator/estimate/route');
  return POST(new Request('http://localhost/api/calculator/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      length: 30, width: 24, height: 20, weight: 85,
      monthly_volume: 500, origin_zip: '08901', dest_zip: '90210',
    }),
  }));
}

async function post() {
  return (await postRaw()).json();
}

describe('POST /api/calculator/estimate — payload by session state', () => {
  beforeEach(() => { getCurrentUser.mockReset(); });

  it('unauthenticated: exact key set, no money, no 225-derived weight', async () => {
    getCurrentUser.mockResolvedValue(null);
    const json = await post();
    expect(Object.keys(json).sort()).toEqual([
      'bill139', 'bill166', 'current_billable_139', 'current_distance_miles',
      'current_zone', 'dim139', 'dim166', 'sc_distance_miles', 'sc_warehouse',
      'sc_zone', 'zone_improvement',
    ]);
    expect(Object.keys(json).filter((k) => MONEY_KEY.test(k))).toEqual([]);
    for (const banned of ['sc_billable_225', 'dim225', 'bill225']) {
      expect(json[banned]).toBeUndefined();
    }
  });

  it('unauthenticated: no known dollar VALUE survives', async () => {
    getCurrentUser.mockResolvedValue(null);
    // Numeric tokens, not substrings — a substring scan gives false hits.
    const flat = JSON.stringify(await post());
    const nums = new Set((flat.match(/-?\d+(\.\d+)?/g) || []).map(Number));
    const dollars = [81.25, 60.125, 60.13, 3.31, 21.125, 21.13, 126750];
    expect(dollars.filter((d) => nums.has(d))).toEqual([]);
  });

  it('unauthenticated: the zone facts DimCalculator renders are intact', async () => {
    getCurrentUser.mockResolvedValue(null);
    const json = await post();
    expect(json.current_zone).toBe(7);
    expect(json.sc_zone).toBe(4);
    expect(json.sc_warehouse).toBe('CA');
    expect(json.current_distance_miles).toBe(2450);
    expect(json.zone_improvement).toBe(3);
  });

  it('authenticated: full estimate is preserved', async () => {
    getCurrentUser.mockResolvedValue({ id: 1, email: 'a@b.co' });
    const json = await post();
    expect(json.sc_cost_per_pkg).toBe(60.13);
    expect(json.inbound_cost_per_unit).toBe(3.31);
    expect(json.savings_per_pkg).toBe(21.13);
    expect(json.sc_billable_225).toBe(85);
  });

  it('fails closed: session lookup error redacts', async () => {
    getCurrentUser.mockRejectedValue(new Error('DATABASE_URL missing'));
    const json = await post();
    expect(json.sc_cost_per_pkg).toBeUndefined();
    expect(json.annual_savings).toBeUndefined();
  });

  it('returns 429 when the IP is rate-limited', async () => {
    getCurrentUser.mockResolvedValue(null);
    isRateLimited.mockReturnValueOnce(true);
    const res = await postRaw();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
  });
});
