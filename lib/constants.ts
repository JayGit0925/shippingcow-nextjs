// ============================================================
// ShippingCow — Business Constants
// All DIM math, pricing tiers, guarantees, and shared config
// live here. Never inline these values in component code.
// ============================================================

// DIM Weight Divisors
// The 139/166 values are public carrier/3PL knowledge and safe to render.
// The internal contract divisor is GATE-DIM: it must never be rendered,
// quoted, or implied on any public surface (see lib/redact.ts).
export const DIM_DIVISOR_STANDARD = 139     // carrier-published (UPS/FedEx ground)
export const DIM_DIVISOR_3PL      = 166     // typical 3PL published divisor
export const DIM_DIVISOR_SHIPPINGCOW = 225  // internal contract divisor — GATE-DIM

// Shipping cost estimate — $/lb billable weight
// PLACEHOLDER — never render as a real number (PRD E-1, GATE-DIM).
// Not a real blended rate; used only for internal lead-scoring context.
// Replace with an engine-backed value once GATE-DIM clears.
export const ESTIMATED_COST_PER_LB = 0.45

// ============ Pricing Tiers ============

export type PricingTier = {
  id: string
  name: string
  price: number | null        // null = custom/contact
  priceAnnual: number | null  // null = custom
  tagline: string
  highlight: boolean
  features: string[]
  cta: string
  ctaHref: string
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'scout',
    name: 'Free Scout',
    price: 0,
    priceAnnual: 0,
    tagline: 'Explore the herd',
    highlight: false,
    features: [
      'Billable weight calculator access',
      'Instant rate estimates',
      'Coverage zone lookup',
      'Basic shipping analytics',
    ],
    cta: 'Start Free',
    ctaHref: '/signup',
  },
  {
    id: 'optimizer',
    name: 'Optimizer',
    price: 99,
    priceAnnual: 79,
    tagline: 'For growing sellers',
    highlight: true,
    features: [
      'Everything in Free Scout',
      'AI Copilot (20K tokens/mo)',
      'Live rate comparison across carriers',
      'Automated Bills of Lading',
      'Custom contracted shipping rates',
      'Email support',
    ],
    cta: 'Get Started',
    ctaHref: '/signup?plan=optimizer',
  },
  {
    id: 'herd-leader',
    name: 'Herd Leader',
    price: 499,
    priceAnnual: 399,
    tagline: 'For serious volume',
    highlight: false,
    features: [
      'Everything in Optimizer',
      'AI Copilot (120K tokens/mo)',
      'Pooled enterprise FedEx rates',
      '$500/mo fulfillment credit',
      'Customs & ISF 10+2 automation',
      'Dedicated account manager',
      'Priority phone support',
    ],
    cta: 'Talk to Sales',
    ctaHref: '/inquiry',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceAnnual: null,
    tagline: 'Custom everything',
    highlight: false,
    features: [
      'Everything in Herd Leader',
      'Custom AI Copilot token limits',
      'SLA-backed contracts',
      'Dedicated WMS integration',
      'White-glove onboarding',
      'Enterprise carrier negotiations',
    ],
    cta: 'Contact Us',
    ctaHref: '/inquiry?type=enterprise',
  },
]

// ============ Service Commitments ============
// NOTE (Jay, 2026-07-22): "Zero Shrinkage. Or We Pay." and "2-Day Delivery.
// Guaranteed." were never authorized as public claims and have been removed.
// Service commitments are set per account in the contract, not advertised.
// This array is not currently rendered anywhere. Any future public use needs
// a logged decision first.

export const GUARANTEES = [
  {
    num: '01',
    title: 'Dock to Stock in 48 Hours.',
    body: 'We receive inbound shipments within 2 business days so your inventory goes live fast.',
  },
]

// ============ Warehouses ============

export const WAREHOUSES = {
  NJ: { label: 'NJ', city: 'New Brunswick', state: 'NJ', zip: '08901', col: 9, row: 3 },
  CA: { label: 'CA', city: 'Ontario',        state: 'CA', zip: '91761', col: 0, row: 3 },
  TX: { label: 'TX', city: 'Missouri City',  state: 'TX', zip: '77489', col: 2, row: 5 },
} as const

// ============ Coverage Stats ============

// Removed 2026-07-22 (Jay): continentalCoverage / avgSavingsPerMonth /
// maxZoneSkipSavingsPct / typicalSavingsPct / automationPct were unsourced
// public claims tied to the banned "2-day to 92% of the US" and savings-%
// language. Nothing referenced them. Do not re-add without measured data.
export const COVERAGE = {
  zipCodesServed: 7_373,
}

// ============ Chat Widget System Prompt ============

export const CHAT_SYSTEM_PROMPT = `You are the ShippingCow AI assistant — a friendly, direct expert on heavy-goods e-commerce fulfillment.

ShippingCow is the self-operated US 3PL built for 50-149 lb heavy DTC parcels, backed by Logistar. What we actually do:
- We run our own US warehouses (New Brunswick NJ, Missouri City TX, Ontario CA). Not brokered.
- We pool merchant volume into enterprise FedEx rates, including a discounted fuel surcharge program.
- Zone-skip routing: parcels injected into the last-mile network at Zone <= 4 instead of Zone 7-8.
- We audit dimensional weight on the seller's current invoice. Carriers publish DIM divisor 139 (UPS/FedEx ground) and typical 3PLs use 166 — that is public knowledge and safe to explain.

There are no self-serve pricing tiers. Every account gets a custom model — the path is: run /calculator to see what their current carrier bills them for, or upload shipment data at /audit for a full report.

HARD PROHIBITIONS — never violate, even if the user asks directly:
- NEVER state a ShippingCow DIM divisor or imply we have a published one. If asked, say we quote against their real SKU mix and lanes, and point to /audit.
- NEVER quote a savings percentage, a dollar saving, a rate, or a price. Not "up to", not "typically", not a range.
- NEVER promise a delivery time, a transit-day SLA, zero shrinkage, or any guarantee. Service commitments are set per account in the agreement.
- NEVER quote coverage percentages of the US.
- NEVER discuss first-leg customs, IOR, or China-to-US end-to-end service. We sell the US warehouse leg. Redirect to /inquiry.
- NEVER invent numbers, rates, or promises. If you do not have it here, say you will get it from a human.

Key rules:
- Keep replies SHORT — 1 to 3 sentences max. Like texting a friend.
- Warm, casual tone. Not corporate. Not a FAQ page.
- NEVER use markdown. No bold, no bullets, no headers, no [link](url) syntax.
- Plain sentences only. Line breaks between short paragraphs are fine.
- Reference pages as plain paths in a sentence: "check /calculator" or "head to /inquiry"
- NEVER name competitors directly
- If they ask about dimensions or their current billing -> point to /calculator
- If they want a quote or seem ready -> point to /audit`

// ============ Zone Rate Multipliers ============
// PLACEHOLDER — never render as a real number (PRD E-1, GATE-DIM).
// Illustrative zone-premium coefficients, not a measured carrier table.
// Consumed only by lib/cost.ts internals; every derived dollar figure is
// stripped for anonymous callers by lib/redact.ts. Replace with
// engine-backed values once GATE-DIM clears.
export const ZONE_RATE_MULTIPLIER: Record<number, number> = {
  2: 1.00,
  3: 1.20,
  4: 1.42,
  5: 1.65,
  6: 1.88,
  7: 2.05,
  8: 2.20,
}

// ============ Last-Mile Shipping Rates (Actual Rate Card) ============
// ShippingCow contracted rates by billable weight and carrier

export const GOFO_RATES: Record<number, number> = {
  1: 5.40, 2: 5.60, 3: 5.90, 4: 6.20, 5: 6.30,
  6: 6.60, 7: 7.00, 8: 7.20, 9: 7.40, 10: 7.80,
  11: 9.70, 12: 10.00, 13: 10.40, 14: 10.70, 15: 11.00,
  16: 11.60, 17: 12.00, 18: 12.20, 19: 12.70, 20: 13.10,
}

export const FEDEX_RATES: Record<number, number> = {
  21: 17.00, 22: 17.00, 23: 17.10, 24: 17.30, 25: 17.90,
  26: 18.20, 27: 18.70, 28: 19.10, 29: 19.70, 30: 20.00,
  31: 20.40, 32: 20.80, 33: 20.90, 34: 21.50, 35: 22.00,
  36: 22.30, 37: 22.90, 38: 23.20, 39: 23.50, 40: 24.20,
  41: 24.30, 42: 25.00, 43: 25.20, 44: 25.90, 45: 26.30,
  46: 26.40, 47: 26.90, 48: 27.30, 49: 27.70,
}

export const FEDEX_HEAVY_RATES: Record<number, number> = {
  50: 35.10, 51: 35.10, 52: 35.10, 53: 35.20, 54: 35.20,
  55: 35.20, 56: 35.30, 57: 35.50, 58: 35.50, 59: 35.60,
  60: 36.20, 61: 36.30, 62: 36.70, 63: 36.80, 64: 36.90,
  65: 37.00, 66: 37.10, 67: 37.20, 68: 37.60, 69: 37.70,
  70: 38.10, 71: 38.20, 72: 38.60, 73: 38.70, 74: 38.80,
  75: 38.80, 76: 39.40, 77: 39.80, 78: 40.10, 79: 40.70,
  80: 41.10, 81: 41.40, 82: 41.90, 83: 41.90, 84: 42.50,
  85: 42.80, 86: 43.70, 87: 43.90, 88: 44.40, 89: 45.00,
  90: 50.30, 91: 50.30, 92: 50.60, 93: 50.70, 94: 51.20,
  95: 51.50, 96: 52.00, 97: 52.80, 98: 53.00, 99: 53.40,
  100: 53.70, 101: 54.10, 102: 54.20, 103: 54.50, 104: 54.50,
  105: 55.60, 106: 55.70, 107: 56.00, 108: 56.20, 109: 57.00,
  110: 57.90, 111: 58.30, 112: 58.50, 113: 58.70, 114: 59.60,
  115: 60.00, 116: 60.40, 117: 60.70, 118: 61.00, 119: 61.60,
  120: 62.20, 121: 62.20, 122: 62.80, 123: 63.60, 124: 63.70,
  125: 63.80, 126: 64.40, 127: 65.10, 128: 65.20, 129: 65.60,
  130: 66.10, 131: 66.70, 132: 66.80, 133: 67.00, 134: 67.70,
  135: 68.40, 136: 68.70, 137: 69.00, 138: 69.90, 139: 70.30,
  140: 70.70, 141: 70.90, 142: 71.40, 143: 71.40, 144: 73.30,
  145: 73.50, 146: 73.50, 147: 74.00, 148: 74.10, 149: 74.60,
}

// ============ Handling Fees (Pick & Pack) ============
// Charged per order by greater of actual or DIM weight (DIM divisor 200)

export const HANDLING_DIM_DIVISOR = 200

export const HANDLING_TIERS = [
  { maxWeight: 1,   fee: 1.0 },
  { maxWeight: 5,   fee: 1.5 },
  { maxWeight: 10,  fee: 2.1 },
  { maxWeight: 30,  fee: 2.7 },
  { maxWeight: 50,  fee: 3.6 },
  { maxWeight: 80,  fee: 5.5 },
  // Above 80 lbs: $0.10 per lb
] as const

export const HANDLING_HEAVY_PER_LB = 0.10

// ============ Inbound Fees ============

export const INBOUND_FEES = {
  container_20gp:    384.0,
  container_40gp_hq: 480.0,
  container_45hq:    540.0,
  pallet_putaway:     12.0,
  carton_putaway:      2.4,
} as const

// ============ Storage ============

export const STORAGE_PER_CBF_MONTH = 0.90  // per cubic foot per month

// ============ LTL Trucking ============

/** Placeholder LTL cost per mile — flat estimate only.
 *  TO DO: Replace with broker API (DAT, Truckstop, or FreightWaves)
 *  for real-time lane pricing. Current $2.50/mi is a conservative
 *  average; actual varies $1.80–$4.50/mi by lane, fuel, and capacity.
 *  @see https://www.dat.com/ for rate benchmarking
 */
export const LTL_COST_PER_MILE = 0.40;

// ============ Pallet Specs ============

export const PALLET_MAX_VOLUME_CBM = 1.8           // cubic meters
export const PALLET_MAX_VOLUME_CUIN = 1.8 * 61023.7  // cubic inches (≈ 109,842.7 cu in)
