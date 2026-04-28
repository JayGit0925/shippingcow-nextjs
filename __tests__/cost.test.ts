import { describe, it, expect } from 'vitest';
import { calculateBillableWeight, getShippingRate, getHandlingFee, calculateStorageCBF } from '../lib/cost';
import { DIM_DIVISOR_STANDARD, DIM_DIVISOR_SHIPPINGCOW } from '../lib/constants';

describe('calculateBillableWeight', () => {
  it('returns actual weight when heavier than DIM', () => {
    // 12x12x12 box = 1728 / 139 = 12.4 lbs DIM. 30 lbs actual → 30
    const result = calculateBillableWeight(12, 12, 12, 30, DIM_DIVISOR_STANDARD);
    expect(result).toBe(30);
  });

  it('returns DIM weight when larger than actual', () => {
    // 24x18x12 = 5184 / 139 = 37.3 lbs DIM. 25 lbs actual → 37.3
    const result = calculateBillableWeight(24, 18, 12, 25, DIM_DIVISOR_STANDARD);
    expect(result).toBeCloseTo(37.3, 1);
  });

  it('DIM 225 gives lower billable than DIM 139', () => {
    const bill139 = calculateBillableWeight(24, 18, 12, 25, 139);
    const bill225 = calculateBillableWeight(24, 18, 12, 25, 225);
    expect(bill225).toBeLessThan(bill139);
  });

  it('negative dimensions clamp to reasonable values', () => {
    const result = calculateBillableWeight(-1, -1, -1, 10, 139);
    expect(result).toBe(10); // DIM would be negative, so actual wins
  });
});

describe('getShippingRate', () => {
  it('handles 0 or negative weight', () => {
    expect(getShippingRate(0).rate).toBe(0);
    expect(getShippingRate(-5).rate).toBe(0);
  });

  it('GoFo for 1-20 lbs', () => {
    const result = getShippingRate(5);
    expect(result.carrier).toBe('GoFo');
    expect(result.rate).toBeGreaterThan(0);
  });

  it('FedEx for 21-49 lbs', () => {
    const result = getShippingRate(30);
    expect(result.carrier).toBe('FedEx');
    expect(result.rate).toBeGreaterThan(0);
  });

  it('FedEx Heavy for 50-149 lbs', () => {
    const result = getShippingRate(75);
    expect(result.carrier).toBe('FedEx Heavy');
    expect(result.rate).toBeGreaterThan(0);
  });

  it('caps at 149 lbs', () => {
    const result = getShippingRate(200);
    expect(result.carrier).toContain('capped');
  });
});

describe('getHandlingFee', () => {
  it('small/light packages have a handling fee', () => {
    const fee = getHandlingFee(10, 8, 4, 3);
    expect(fee).toBeGreaterThan(0);
    expect(fee).toBeLessThan(20); // Should not be extreme
  });

  it('heavy items (>80 lbs) charged per pound', () => {
    // 30x24x18 DIM=12960/200=64.8, actual=90, billable=90
    // HANDLING_HEAVY_PER_LB * 90 = rate
    const fee = getHandlingFee(30, 24, 18, 90);
    expect(fee).toBeGreaterThan(0);
    // Verify it's above the max-tier handling fee (heavier = per-lb pricing)
    const lightFee = getHandlingFee(30, 24, 18, 40);
    expect(fee).toBeGreaterThan(lightFee);
  });
});

describe('calculateStorageCBF', () => {
  it('converts cubic inches to cubic feet', () => {
    // 12x12x12 = 1728 cu in = 1 cu ft
    const result = calculateStorageCBF(12, 12, 12);
    expect(result).toBe(1);
  });

  it('handles typical box', () => {
    const result = calculateStorageCBF(24, 18, 12);
    expect(result).toBe(3); // 5184 / 1728 = 3
  });
});
