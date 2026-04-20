import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_SHIPPINGCOW,
  GOFO_RATES,
  FEDEX_RATES,
  FEDEX_HEAVY_RATES,
  HANDLING_DIM_DIVISOR,
  HANDLING_TIERS,
  HANDLING_HEAVY_PER_LB,
} from './constants';
import { estimateZone, smartRoute } from './zone';

/**
 * Get the shipping rate for a given billable weight
 * Determines carrier (GoFo, FedEx, or FedEx Heavy) based on weight
 */
export function getShippingRate(billable_weight: number): {
  carrier: string;
  rate: number;
} {
  const weight = Math.ceil(billable_weight); // Round UP to nearest integer

  if (weight <= 0) {
    return { carrier: 'none', rate: 0 };
  }

  if (weight <= 20) {
    const rate = GOFO_RATES[weight];
    return { carrier: 'GoFo', rate: rate || GOFO_RATES[20] };
  }

  if (weight <= 49) {
    const rate = FEDEX_RATES[weight];
    return { carrier: 'FedEx', rate: rate || FEDEX_RATES[49] };
  }

  if (weight <= 149) {
    const rate = FEDEX_HEAVY_RATES[weight];
    return { carrier: 'FedEx Heavy', rate: rate || FEDEX_HEAVY_RATES[149] };
  }

  // Above 149 lbs, cap at the 149 lb rate
  return { carrier: 'FedEx Heavy (capped)', rate: FEDEX_HEAVY_RATES[149] };
}

/**
 * Calculate handling fee based on billable weight (using DIM divisor 200)
 */
export function getHandlingFee(
  length: number,
  width: number,
  height: number,
  actual_weight: number
): number {
  const dim_weight = (length * width * height) / HANDLING_DIM_DIVISOR;
  const billable = Math.max(actual_weight, dim_weight);

  // Above 80 lbs: charge per pound
  if (billable > 80) {
    return billable * HANDLING_HEAVY_PER_LB;
  }

  // Find the tier
  for (const tier of HANDLING_TIERS) {
    if (billable <= tier.maxWeight) {
      return tier.fee;
    }
  }

  // Fallback (shouldn't reach here)
  return HANDLING_TIERS[HANDLING_TIERS.length - 1].fee;
}

/**
 * Calculate storage volume in cubic feet
 */
export function calculateStorageCBF(
  length: number,
  width: number,
  height: number
): number {
  const volume_cuin = length * width * height;
  const volume_cbf = volume_cuin / 1728; // 1 cubic foot = 1728 cubic inches
  return volume_cbf;
}

/**
 * Shipment analysis result
 */
export type ShipmentAnalysis = {
  // Current state (from origin ZIP, DIM 139)
  current_zone: number;
  current_distance: number;
  current_billable_139: number;
  current_cost: number;

  // ShippingCow state (best warehouse, DIM 225)
  sc_warehouse: string;
  sc_zone: number;
  sc_distance: number;
  sc_billable_225: number;
  sc_cost: number; // includes handling + shipping

  // Savings
  savings_per_package: number;
  zone_improvement: number;
};

/**
 * Analyze a single shipment row using real rate cards
 */
export async function analyzeShipment(row: {
  origin_zip: string;
  dest_zip: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity?: number;
  current_cost?: number;
}): Promise<ShipmentAnalysis | null> {
  // Estimate current state (origin → destination, DIM 139)
  const currentZoneData = await estimateZone(row.origin_zip, row.dest_zip);
  if (!currentZoneData) {
    return null; // One or both ZIPs not found
  }

  const current_billable_139 = calculateBillableWeight(
    row.length,
    row.width,
    row.height,
    row.weight,
    DIM_DIVISOR_STANDARD
  );

  // Current cost using approximate zone rate
  const approximateRateByZone = {
    2: 0.32, 3: 0.36, 4: 0.42, 5: 0.50, 6: 0.58, 7: 0.67, 8: 0.78,
  };
  const approxRate = approximateRateByZone[currentZoneData.zone as keyof typeof approximateRateByZone] || 0.78;
  const current_cost = current_billable_139 * approxRate;

  // Estimate ShippingCow state (best warehouse → destination, DIM 225)
  const routing = await smartRoute(row.dest_zip);

  const sc_zone = routing.zone;
  const sc_distance = routing.distance_miles;

  const sc_billable_225 = calculateBillableWeight(
    row.length,
    row.width,
    row.height,
    row.weight,
    DIM_DIVISOR_SHIPPINGCOW
  );

  // ShippingCow cost using real rate card
  const shippingRate = getShippingRate(sc_billable_225);
  const handlingFee = getHandlingFee(row.length, row.width, row.height, row.weight);
  const sc_cost = shippingRate.rate + handlingFee;

  const savings_per_package = current_cost - sc_cost;
  const zone_improvement = currentZoneData.zone - sc_zone;

  return {
    current_zone: currentZoneData.zone,
    current_distance: currentZoneData.distance_miles,
    current_billable_139,
    current_cost,

    sc_warehouse: routing.best_warehouse,
    sc_zone,
    sc_distance,
    sc_billable_225,
    sc_cost,

    savings_per_package,
    zone_improvement,
  };
}

/**
 * Calculate billable weight (max of actual or dimensional weight)
 */
export function calculateBillableWeight(
  length: number,
  width: number,
  height: number,
  actual_weight: number,
  dim_divisor: number
): number {
  const dim_weight = (length * width * height) / dim_divisor;
  return Math.max(actual_weight, dim_weight);
}
