// NJ Warehouse (08901) — Location 1 exact rate tables

const GOFO_RATES: Record<number, number> = {
  1: 5.40, 2: 5.60, 3: 5.90, 4: 6.20, 5: 6.30,
  6: 6.60, 7: 7.00, 8: 7.20, 9: 7.40, 10: 7.80,
  11: 9.70, 12: 10.00, 13: 10.40, 14: 10.70, 15: 11.00,
  16: 11.60, 17: 12.00, 18: 12.20, 19: 12.70, 20: 13.10,
};

const FEDEX_GROUND_RATES: Record<number, number> = {
  21: 17.00, 22: 17.00, 23: 17.10, 24: 17.30, 25: 17.90,
  26: 18.20, 27: 18.70, 28: 19.10, 29: 19.70, 30: 20.00,
  31: 20.40, 32: 20.80, 33: 20.90, 34: 21.50, 35: 22.00,
  36: 22.30, 37: 22.90, 38: 23.20, 39: 23.50, 40: 24.20,
  41: 24.30, 42: 25.00, 43: 25.20, 44: 25.90, 45: 26.30,
  46: 26.40, 47: 26.90, 48: 27.30, 49: 27.70,
};

const FEDEX_HEAVY_RATES: Record<number, number> = {
  50: 35.10, 51: 35.50, 52: 35.90, 53: 36.30, 54: 36.70,
  55: 37.10, 56: 37.50, 57: 37.90, 58: 38.30, 59: 38.70,
  60: 39.10, 61: 39.50, 62: 39.90, 63: 40.30, 64: 40.70,
  65: 41.10, 66: 41.50, 67: 41.90, 68: 42.30, 69: 42.70,
  70: 43.10, 71: 43.50, 72: 43.90, 73: 44.30, 74: 44.70,
  75: 45.10, 76: 45.50, 77: 45.90, 78: 46.30, 79: 46.70,
  80: 47.10, 81: 47.50, 82: 47.90, 83: 48.30, 84: 48.70,
  85: 49.10, 86: 49.50, 87: 49.90, 88: 50.30, 89: 50.70,
  90: 51.10, 91: 51.80, 92: 52.40, 93: 53.10, 94: 53.80,
  95: 54.40, 96: 55.10, 97: 55.70, 98: 56.40, 99: 57.10,
  100: 57.70, 101: 58.40, 102: 59.00, 103: 59.70, 104: 60.40,
  105: 61.00, 106: 61.70, 107: 62.30, 108: 63.00, 109: 63.70,
  110: 64.30, 111: 65.00, 112: 65.60, 113: 66.30, 114: 67.00,
  115: 67.60, 116: 68.30, 117: 68.90, 118: 69.60, 119: 70.30,
  120: 70.90, 121: 71.60, 122: 72.20, 123: 72.90, 124: 73.60,
  125: 74.20, 126: 74.60, 127: 74.60, 128: 74.60, 129: 74.60,
  130: 74.60, 131: 74.60, 132: 74.60, 133: 74.60, 134: 74.60,
  135: 74.60, 136: 74.60, 137: 74.60, 138: 74.60, 139: 74.60,
  140: 74.60, 141: 74.60, 142: 74.60, 143: 74.60, 144: 74.60,
  145: 74.60, 146: 74.60, 147: 74.60, 148: 74.60, 149: 74.60,
};

export const INBOUND_FEES = {
  container_20gp: 384,
  container_40gp: 480,
  container_45hq: 540,
  pallet_putaway: 12,
  carton_putaway: 2.40,
};

// Price cliffs where carrier tier changes — warn if within 1 lb
const PRICE_CLIFFS = [10, 20, 49];

export function getCarrierName(weight: number): 'GOFO' | 'FedEx Ground' | 'FedEx Heavy' {
  const w = Math.ceil(weight);
  if (w <= 20) return 'GOFO';
  if (w <= 49) return 'FedEx Ground';
  return 'FedEx Heavy';
}

export function getLastMileRate(weight: number): { price: number; carrier: string } {
  const w = Math.ceil(weight);
  const carrier = getCarrierName(w);

  if (w <= 20) return { price: GOFO_RATES[w] ?? GOFO_RATES[20], carrier };
  if (w <= 49) return { price: FEDEX_GROUND_RATES[w] ?? FEDEX_GROUND_RATES[49], carrier };
  if (w <= 149) return { price: FEDEX_HEAVY_RATES[w] ?? FEDEX_HEAVY_RATES[149], carrier };

  // Over 149 lbs — use max heavy rate
  return { price: FEDEX_HEAVY_RATES[149], carrier: 'FedEx Heavy' };
}

export function getHandlingFee(weight: number): number {
  if (weight <= 1) return 1.00;
  if (weight <= 5) return 1.50;
  if (weight <= 10) return 2.10;
  if (weight <= 30) return 2.70;
  if (weight <= 50) return 3.60;
  if (weight <= 80) return 5.50;
  return weight * 0.10;
}

export function getTotalOrderCost(weight: number): number {
  return getLastMileRate(weight).price + getHandlingFee(weight);
}

export function getPriceCliffWarning(weight: number): string | null {
  const w = Math.ceil(weight);
  for (const cliff of PRICE_CLIFFS) {
    if (w === cliff) {
      const nextRate = getLastMileRate(cliff + 1);
      const currentRate = getLastMileRate(cliff);
      const jump = nextRate.price - currentRate.price;
      return `Weight is exactly at a pricing cliff (${cliff} lbs). Shipping at ${cliff + 1} lbs costs $${jump.toFixed(2)} more and switches to ${nextRate.carrier}.`;
    }
    if (w === cliff - 1) {
      const nextRate = getLastMileRate(cliff + 1);
      const currentRate = getLastMileRate(cliff - 1);
      const jump = nextRate.price - currentRate.price;
      return `Weight is 1 lb below a pricing cliff. At ${cliff + 1} lbs, cost jumps $${jump.toFixed(2)} to ${nextRate.carrier}.`;
    }
  }
  return null;
}
