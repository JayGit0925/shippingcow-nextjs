/**
 * Inbound Allocation Engine
 * 
 * Given an origin ZIP + multiple SKUs + destination distribution,
 * computes optimal pallet distribution across 3 warehouses,
 * inbound trucking costs, and projected outbound savings.
 */

import { getZipCoords } from './db';
import { analyzeShipment } from './cost';
import { haversineDistance, WAREHOUSES } from './zone';
import { LTL_COST_PER_MILE, PALLET_MAX_VOLUME_CBM } from './constants';

// ─── Types ───────────────────────────────────────────────────────

export type AllocItem = {
  sku: string;
  label: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  qty: number;          // total monthly units
};

export type DestDist = {
  zip: string;
  pct: number;          // fraction (0–1), e.g. 0.6 = 60%
};

export type AllocInput = {
  origin_zip: string;
  items: AllocItem[];
  destinations: DestDist[];
  label?: string;
};

export type SkuWhRow = {
  sku: string;
  label: string;
  warehouse: string;
  units: number;
  pallets: number;
  units_per_pallet: number;
  inbound_distance_miles: number;
  inbound_cost_total: number;
  outbound_cost_per_pkg: number;
  outbound_savings_per_pkg: number;
  outbound_monthly_savings: number;
  outbound_annual_savings: number;
};

export type WhSummary = {
  warehouse: string;
  warehouse_zip: string;
  total_units: number;
  total_pallets: number;
  inbound_distance_miles: number;
  inbound_ltl_cost: number;
  weighted_savings_per_pkg: number;
  skus: SkuWhRow[];
};

export type AllocResult = {
  origin_zip: string;
  label: string | null;
  total_units: number;
  total_pallets: number;
  total_inbound_ltl_cost: number;
  total_monthly_savings: number;
  total_annual_savings: number;
  warehouses: WhSummary[];
  errors: string[];
};

// ─── Math ─────────────────────────────────────────────────────────

function unitsPerPallet(l: number, w: number, h: number): number {
  const cbm = (l * w * h) / 61_023.7;
  return Math.max(1, Math.floor(PALLET_MAX_VOLUME_CBM / cbm));
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Main Engine ─────────────────────────────────────────────────

export async function allocateInbound(input: AllocInput): Promise<AllocResult> {
  const { origin_zip, items, destinations, label } = input;
  const errors: string[] = [];

  // Validate distribution
  const totalPct = destinations.reduce((s, d) => s + d.pct, 0);
  if (Math.abs(totalPct - 1.0) > 0.02) {
    errors.push(`Destination % sum to ${(totalPct * 100).toFixed(0)}%, expected 100%`);
  }

  // Get origin coords once (used for all inbound distance calcs)
  const originCoords = await getZipCoords(origin_zip);
  if (!originCoords) {
    errors.push(`Origin ZIP "${origin_zip}" not found in database`);
    return {
      origin_zip, label: label || null,
      total_units: 0, total_pallets: 0,
      total_inbound_ltl_cost: 0, total_monthly_savings: 0,
      total_annual_savings: 0, warehouses: [], errors,
    };
  }

  // Build warehouse coords lookup
  const whCoords = new Map(WAREHOUSES.map(w => [w.name, { lat: w.lat, lng: w.lng }]));

  // For each (SKU × dest) → find best warehouse + compute costs
  const rows: SkuWhRow[] = [];

  for (const item of items) {
    const upp = unitsPerPallet(item.length, item.width, item.height);

    for (const dest of destinations) {
      const destQty = Math.round(item.qty * dest.pct);
      if (destQty < 1) continue;

      // Run full analysis to get best warehouse + savings
      const analysis = await analyzeShipment({
        origin_zip,
        dest_zip: dest.zip,
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
      });

      if (!analysis) {
        errors.push(`Skipped ${item.sku} → ${dest.zip}: ZIP not found`);
        continue;
      }

      // Compute inbound distance from origin → assigned warehouse
      const wh = whCoords.get(analysis.sc_warehouse);
      const inboundMiles = wh
        ? r2(haversineDistance(originCoords.lat, originCoords.lng, wh.lat, wh.lng))
        : analysis.inbound_warehouse_distance;

      const pallets = Math.ceil(destQty / upp);
      const inboundCostTotal = r2((inboundMiles * LTL_COST_PER_MILE / upp) * destQty); // total monthly
      const monthlySavings = r2(analysis.savings_per_package * destQty);
      const annualSavings = r2(monthlySavings * 12);

      rows.push({
        sku: item.sku,
        label: item.label,
        warehouse: analysis.sc_warehouse,
        units: destQty,
        pallets,
        units_per_pallet: upp,
        inbound_distance_miles: inboundMiles,
        inbound_cost_total: inboundCostTotal,
        outbound_cost_per_pkg: r2(analysis.sc_cost),
        outbound_savings_per_pkg: r2(analysis.savings_per_package),
        outbound_monthly_savings: monthlySavings,
        outbound_annual_savings: annualSavings,
      });
    }
  }

  // Group by warehouse
  const byWh = new Map<string, SkuWhRow[]>();
  for (const r of rows) {
    const arr = byWh.get(r.warehouse) || [];
    arr.push(r);
    byWh.set(r.warehouse, arr);
  }

  let grandPallets = 0;
  let grandLTL = 0;
  let grandMonthly = 0;
  let grandAnnual = 0;
  const warehouses: WhSummary[] = [];

  for (const [name, skus] of byWh) {
    const whInfo = WAREHOUSES.find(w => w.name === name)!;
    const totalUnits = skus.reduce((s, r) => s + r.units, 0);
    const totalPallets = skus.reduce((s, r) => s + r.pallets, 0);
    const totalLTL = skus.reduce((s, r) => s + r.inbound_cost_total, 0);
    const monthlySavings = skus.reduce((s, r) => s + r.outbound_monthly_savings, 0);
    const annualSavings = skus.reduce((s, r) => s + r.outbound_annual_savings, 0);
    const maxInboundDist = Math.max(...skus.map(r => r.inbound_distance_miles));
    const weightedSavings = totalUnits > 0
      ? skus.reduce((s, r) => s + r.outbound_savings_per_pkg * r.units, 0) / totalUnits
      : 0;

    grandPallets += totalPallets;
    grandLTL += totalLTL;
    grandMonthly += monthlySavings;
    grandAnnual += annualSavings;

    warehouses.push({
      warehouse: name,
      warehouse_zip: whInfo.zip,
      total_units: totalUnits,
      total_pallets: totalPallets,
      inbound_distance_miles: r2(maxInboundDist),
      inbound_ltl_cost: r2(totalLTL),
      weighted_savings_per_pkg: r2(weightedSavings),
      skus,
    });
  }

  return {
    origin_zip,
    label: label || null,
    total_units: items.reduce((s, i) => s + i.qty, 0),
    total_pallets: grandPallets,
    total_inbound_ltl_cost: r2(grandLTL),
    total_monthly_savings: r2(grandMonthly),
    total_annual_savings: r2(grandAnnual),
    warehouses,
    errors,
  };
}
