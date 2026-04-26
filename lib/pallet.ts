import {
  DIM_DIVISOR_SHIPPINGCOW,
  PALLET_MAX_VOLUME_CUIN,
  INBOUND_FEES,
  STORAGE_PER_CBF_MONTH,
  LTL_COST_PER_MILE,
} from './constants';
import { haversineDistance, WAREHOUSES } from './zone';
import { getShippingRate, getHandlingFee, calculateStorageCBF, calculateBillableWeight } from './cost';
import { getZipCoords } from './db';

/**
 * Calculate how many units of a given size fit on a standard pallet
 * Tests all 3 orientations and returns the best result
 */
export function unitsPerPallet(length: number, width: number, height: number): number {
  const unitVolume = length * width * height;

  // Test all 3 orientations
  const orientations = [
    { l: length, w: width, h: height },
    { l: length, w: height, h: width },
    { l: width, w: height, h: length },
  ];

  let bestFit = 0;

  for (const orient of orientations) {
    // Volume constraint: max units by volume
    const unitsByVolume = Math.floor(PALLET_MAX_VOLUME_CUIN / unitVolume);

    // Physical fit constraint: pallet is 48×40 inches, max height 72 inches
    const unitsPerLayer = Math.floor(48 / orient.l) * Math.floor(40 / orient.w);
    const layers = Math.floor(72 / orient.h);
    const unitsByFit = unitsPerLayer * layers;

    // Take the tighter constraint
    const units = Math.min(unitsByVolume, unitsByFit);
    if (units > bestFit) {
      bestFit = units;
    }
  }

  return Math.max(1, bestFit); // At least 1 unit
}

/**
 * SKU type for pallet calculations
 */
export type SKU = {
  name?: string;
  length: number;
  width: number;
  height: number;
  weight: number;
};

/**
 * Pallet inbound cost breakdown
 */
export type PalletInboundCost = {
  sku: SKU;
  closest_warehouse: string;
  warehouse_city: string;
  warehouse_state: string;
  trucking_distance_miles: number;
  trucking_cost: number;
  units_per_pallet: number;
  inbound_receiving: number;

  per_unit: {
    storage_monthly: number;
    handling: number;
    shipping: number;
    carrier: string;
    total: number;
  };

  pallet_total: number;
  cost_per_unit_all_in: number;

  note: string;
};

/**
 * Calculate the full inbound cost for a pallet of SKUs
 */
export async function palletInboundCost(
  origin_zip: string,
  sku: SKU
): Promise<PalletInboundCost | null> {
  // Get origin coordinates
  const originCoords = await getZipCoords(origin_zip);
  if (!originCoords) {
    return null; // Origin ZIP not found
  }

  // Find closest warehouse
  let closestWarehouse = WAREHOUSES[0];
  let closestDistance = Infinity;

  for (const wh of WAREHOUSES) {
    const whCoords = await getZipCoords(wh.zip);
    if (!whCoords) continue;

    const distance = haversineDistance(
      originCoords.lat,
      originCoords.lng,
      whCoords.lat,
      whCoords.lng
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestWarehouse = wh;
    }
  }

  // If all warehouse coord lookups failed, fall back to median US distance (matches lib/zone.ts)
  const trucking_distance_miles = isFinite(closestDistance) ? closestDistance : 1200;
  const trucking_cost = trucking_distance_miles * LTL_COST_PER_MILE;

  // Units per pallet
  const units_per_pallet = unitsPerPallet(sku.length, sku.width, sku.height);

  // Inbound receiving (1 pallet)
  const inbound_receiving = INBOUND_FEES.pallet_putaway;

  // Per-unit costs
  const storage_monthly = calculateStorageCBF(sku.length, sku.width, sku.height) * STORAGE_PER_CBF_MONTH;

  const handling = getHandlingFee(sku.length, sku.width, sku.height, sku.weight);

  // Shipping: use DIM 225 billable weight
  const billable_225 = calculateBillableWeight(
    sku.length,
    sku.width,
    sku.height,
    sku.weight,
    DIM_DIVISOR_SHIPPINGCOW
  );
  const shippingRate = getShippingRate(billable_225);

  const per_unit_total = handling + shippingRate.rate + storage_monthly;
  const pallet_total = trucking_cost + inbound_receiving + per_unit_total * units_per_pallet;
  const cost_per_unit_all_in = pallet_total / units_per_pallet;

  return {
    sku,
    closest_warehouse: closestWarehouse.label,
    warehouse_city: closestWarehouse.city,
    warehouse_state: closestWarehouse.state,
    trucking_distance_miles: Math.round(trucking_distance_miles * 10) / 10,
    trucking_cost,
    units_per_pallet,
    inbound_receiving,

    per_unit: {
      storage_monthly,
      handling,
      shipping: shippingRate.rate,
      carrier: shippingRate.carrier,
      total: per_unit_total,
    },

    pallet_total,
    cost_per_unit_all_in,

    note: 'Trucking cost is estimated at $2.50/mile. Actual quote will be confirmed within 24 hours of your inquiry.',
  };
}
