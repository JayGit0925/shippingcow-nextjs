import { describe, it, expect } from "vitest";
import { CALC_PRESETS } from "@/lib/calculator-presets";

// Bounds come from the zod schema in app/api/calculator/estimate/route.ts —
// a preset outside them would 400 the moment ZIPs are entered.
describe("CALC_PRESETS", () => {
  it("has at least 4 presets", () => {
    expect(CALC_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it("every preset fits the estimate API input bounds", () => {
    for (const p of CALC_PRESETS) {
      expect(p.length).toBeGreaterThan(0);
      expect(p.length).toBeLessThanOrEqual(120);
      expect(p.width).toBeGreaterThan(0);
      expect(p.width).toBeLessThanOrEqual(120);
      expect(p.height).toBeGreaterThan(0);
      expect(p.height).toBeLessThanOrEqual(120);
      expect(p.weight).toBeGreaterThan(0);
      expect(p.weight).toBeLessThanOrEqual(500);
    }
  });

  it("every preset is DIM-relevant: dim weight at ÷139 exceeds actual weight", () => {
    // Presets exist to show the phantom-weight problem; a preset whose DIM
    // weight is below its actual weight would render a zero callout.
    for (const p of CALC_PRESETS) {
      const dim139 = (p.length * p.width * p.height) / 139;
      expect(dim139).toBeGreaterThan(p.weight);
    }
  });

  it("ids are unique and labels non-empty", () => {
    const ids = CALC_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of CALC_PRESETS) {
      expect(p.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains no dollar or divisor copy in labels", () => {
    for (const p of CALC_PRESETS) {
      expect(p.label).not.toMatch(/\$|225|285|221/);
    }
  });
});
