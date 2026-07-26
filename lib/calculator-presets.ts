// Bulky-item presets for the DIM calculator (PRD A-2 / TSK-WEB-06).
// One click seeds l/w/h/weight with a typical big-and-bulky SKU so a visitor
// sees the phantom-weight problem without measuring anything.
//
// Bounds contract: every preset must satisfy the estimate API's zod schema
// (l/w/h <= 120 in, weight <= 500 lb) and must be DIM-heavy at ÷139
// (dim weight > actual weight) so the callout is never zero.
// __tests__/calculator-presets.test.ts enforces both.

export type CalcPreset = {
  id: string;
  label: string;
  length: number;
  width: number;
  height: number;
  weight: number;
};

export const CALC_PRESETS: readonly CalcPreset[] = [
  { id: "office-chair", label: "🪑 Office chair", length: 27, width: 26, height: 39, weight: 55 },
  { id: "gas-grill", label: "🍖 Gas grill", length: 48, width: 26, height: 48, weight: 95 },
  { id: "bed-frame", label: "🛏 Bed frame", length: 82, width: 30, height: 11, weight: 110 },
  { id: "treadmill", label: "🏃 Treadmill", length: 80, width: 34, height: 16, weight: 145 },
  { id: "rooftop-tent", label: "⛺ Rooftop tent", length: 56, width: 48, height: 14, weight: 140 },
  { id: "kayak", label: "🛶 Kayak", length: 110, width: 20, height: 14, weight: 65 },
] as const;
