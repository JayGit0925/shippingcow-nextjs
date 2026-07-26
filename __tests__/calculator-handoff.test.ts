import { describe, it, expect } from "vitest";
import { buildInquiryHref, buildCalcContext } from "@/lib/calculator-handoff";

const BASE = { length: 48, width: 26, height: 48, weight: 95, volume: 200 };

describe("buildInquiryHref", () => {
  it("carries dims, weight and volume", () => {
    expect(buildInquiryHref(BASE)).toBe("/inquiry?l=48&w=26&h=48&weight=95&vol=200");
  });

  it("appends ZIPs only when both are 5-digit", () => {
    expect(buildInquiryHref({ ...BASE, originZip: "08901", destZip: "90210" })).toBe(
      "/inquiry?l=48&w=26&h=48&weight=95&vol=200&origin_zip=08901&dest_zip=90210"
    );
  });

  it.each([
    { originZip: "089", destZip: "90210" },
    { originZip: "08901", destZip: "" },
    { originZip: undefined, destZip: "90210" },
  ])("omits ZIP params when a ZIP is missing or partial (%j)", (zips) => {
    const href = buildInquiryHref({ ...BASE, ...zips });
    expect(href).toBe("/inquiry?l=48&w=26&h=48&weight=95&vol=200");
  });
});

describe("buildCalcContext", () => {
  const MONEY_KEY = /(cost|price|savings|estimate|per_pkg|225)/i;

  it("contains dims, volume and published-divisor weights only", () => {
    const ctx = buildCalcContext(BASE);
    expect(ctx.length).toBe(48);
    expect(ctx.monthly_volume).toBe(200);
    expect(typeof ctx.bill139).toBe("number");
    expect(typeof ctx.dim166).toBe("number");
    for (const k of Object.keys(ctx)) {
      expect(k).not.toMatch(MONEY_KEY);
    }
  });

  it("copies only allowlisted zone fields and drops money even if present", () => {
    const hostileZone = {
      current_zone: 8,
      sc_zone: 4,
      zone_improvement: 4,
      sc_warehouse: "NJ",
      current_distance_miles: 2400,
      sc_distance_miles: 300,
      // fields an authed session could see — must NEVER be copied through:
      sc_cost_per_pkg: 9.12,
      annual_savings: 50000,
      savings_per_pkg: 4.5,
      dim225: 30.1,
      bill225: 95,
      sc_billable_225: 95,
    };
    const ctx = buildCalcContext({ ...BASE, originZip: "08901", destZip: "90210" }, hostileZone);
    expect(ctx.sc_warehouse).toBe("NJ");
    expect(ctx.zone_improvement).toBe(4);
    const json = JSON.stringify(ctx);
    expect(json).not.toMatch(/cost|savings|225/i);
    for (const k of Object.keys(ctx)) {
      expect(k).not.toMatch(MONEY_KEY);
    }
  });

  it("no known dollar value from the hostile zone survives serialization", () => {
    const ctx = buildCalcContext(BASE, { annual_savings: 50000, savings_per_pkg: 4.5 });
    const nums = JSON.stringify(ctx).match(/-?\d+(\.\d+)?/g) ?? [];
    expect(nums).not.toContain("50000");
    expect(nums).not.toContain("4.5");
  });

  it("handles null zone", () => {
    const ctx = buildCalcContext(BASE, null);
    expect(ctx.sc_warehouse).toBeUndefined();
    expect(ctx.length).toBe(48);
  });
});
