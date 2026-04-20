import {
  DIM_DIVISOR_STANDARD,
  DIM_DIVISOR_SHIPPINGCOW,
  HANDLING_FEE,
  LAST_MILE_FEE,
  ZONE_RATES,
} from './constants';
import { estimateZone, smartRoute } from './zone';

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

/**
 * Calculate shipping cost for a given billable weight and zone
 */
export function calculateShipmentCost(billable_weight: number, zone: number): number {
  const rate = ZONE_RATES[zone] || 0.78; // Default to zone 8 if zone not found
  return billable_weight * rate;
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
  sc_cost: number; // includes handling + last-mile

  // Savings
  savings_per_package: number;
  zone_improvement: number;
};

/**
 * Analyze a single shipment row
 * @param row Shipment data with origin/dest ZIPs, dimensions, weight
 * @returns Full analysis including current costs and ShippingCow savings
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
  const current_cost = calculateShipmentCost(current_billable_139, currentZoneData.zone);

  // Estimate ShippingCow state (best warehouse → destination, DIM 225)
  const routing = await smartRoute(row.dest_zip);

  // Get warehouse coordinates for distance calculation
  const sc_zone = routing.zone;
  const sc_distance = routing.distance_miles;

  const sc_billable_225 = calculateBillableWeight(
    row.length,
    row.width,
    row.height,
    row.weight,
    DIM_DIVISOR_SHIPPINGCOW
  );
  const sc_base_cost = calculateShipmentCost(sc_billable_225, sc_zone);
  const sc_cost = sc_base_cost + HANDLING_FEE + LAST_MILE_FEE;

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
