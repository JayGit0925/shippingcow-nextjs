import { describe, it, expect } from "vitest";
import { isHighIntentPath } from "@/lib/widget-paths";

describe("isHighIntentPath", () => {
  it.each([
    "/calculator",
    "/calculator/pallet",
    "/audit",
    "/big-and-bulky",
    "/heavy-3pl-comparison",
    "/heavy-goods",
  ])("returns true for high-intent path %s", (p) => {
    expect(isHighIntentPath(p)).toBe(true);
  });

  it.each(["/", "/blog", "/blog/heavy-tips", "/about", "/inquiry"])(
    "returns false for %s",
    (p) => {
      expect(isHighIntentPath(p)).toBe(false);
    }
  );

  it("returns false for null and undefined", () => {
    expect(isHighIntentPath(null)).toBe(false);
    expect(isHighIntentPath(undefined)).toBe(false);
  });
});
