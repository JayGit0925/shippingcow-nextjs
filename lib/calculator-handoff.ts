// Calculator → downstream handoff (PRD A-2 / TSK-WEB-06).
//
// PUBLIC SURFACE RULE: everything built here reaches anonymous storage
// (localStorage) or a shareable URL, so it must carry ZERO dollar fields and
// nothing derived from the ShippingCow divisor. Zone data is copied through a
// hard allowlist — never spread the API response, which is shaped by auth
// state (lib/redact.ts).

import { DIM_DIVISOR_STANDARD, DIM_DIVISOR_3PL } from "@/lib/constants";

export type CalcHandoff = {
  length: number;
  width: number;
  height: number;
  weight: number;
  volume: number;
  originZip?: string;
  destZip?: string;
};

const ZIP_RE = /^\d{5}$/;

export function buildInquiryHref(h: CalcHandoff): string {
  const params = new URLSearchParams({
    l: String(h.length),
    w: String(h.width),
    h: String(h.height),
    weight: String(h.weight),
    vol: String(h.volume),
  });
  if (h.originZip && ZIP_RE.test(h.originZip) && h.destZip && ZIP_RE.test(h.destZip)) {
    params.set("origin_zip", h.originZip);
    params.set("dest_zip", h.destZip);
  }
  return `/inquiry?${params.toString()}`;
}

// Zone fields safe for anonymous storage — matches the redactEstimate()
// allowlist in lib/redact.ts minus the weight duplicates.
const ZONE_ALLOWLIST = [
  "current_zone",
  "current_distance_miles",
  "sc_warehouse",
  "sc_zone",
  "sc_distance_miles",
  "zone_improvement",
] as const;

export function buildCalcContext(
  h: CalcHandoff,
  zone?: Record<string, unknown> | null
): Record<string, unknown> {
  const vol = h.length * h.width * h.height;
  const dim139 = vol / DIM_DIVISOR_STANDARD;
  const dim166 = vol / DIM_DIVISOR_3PL;
  const ctx: Record<string, unknown> = {
    length: h.length,
    width: h.width,
    height: h.height,
    weight: h.weight,
    monthly_volume: h.volume,
    dim139: Math.round(dim139 * 10) / 10,
    dim166: Math.round(dim166 * 10) / 10,
    bill139: Math.round(Math.max(h.weight, dim139) * 10) / 10,
    bill166: Math.round(Math.max(h.weight, dim166) * 10) / 10,
  };
  if (h.originZip && ZIP_RE.test(h.originZip)) ctx.origin_zip = h.originZip;
  if (h.destZip && ZIP_RE.test(h.destZip)) ctx.dest_zip = h.destZip;
  if (zone) {
    for (const k of ZONE_ALLOWLIST) {
      if (zone[k] !== undefined) ctx[k] = zone[k];
    }
  }
  return ctx;
}
