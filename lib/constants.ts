// ============================================================
// ShippingCow — Business Constants
// All DIM math, pricing tiers, guarantees, and shared config
// live here. Never inline these values in component code.
// ============================================================

// DIM Weight Divisors
export const DIM_DIVISOR_STANDARD = 139     // UPS / FedEx published rate
export const DIM_DIVISOR_3PL      = 166     // Typical 3PL
export const DIM_DIVISOR_SHIPPINGCOW = 225  // ShippingCow advantage

// Shipping cost estimate — $/lb billable weight
// TODO: update with real blended rate data from carrier contracts
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
      'DIM 225 calculator access',
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
      'DIM 225 shipping rates',
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
      'Up to 80% off FedEx pool rates',
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

// ============ Cow-Guaranteed Promises ============

export const GUARANTEES = [
  {
    num: '01',
    title: 'Zero Shrinkage. Or We Pay.',
    body: 'Industry average loss is 2–4%. Our rate? Zero. If we lose or damage your inventory, we cover the wholesale cost. No excuses, no clauses.',
  },
  {
    num: '02',
    title: '2-Day Delivery. Guaranteed.',
    body: "Every destination ZIP we serve is injected at Zone ≤ 4. If we miss your SLA, we make it right. Fast shipping isn't optional — it's in the contract.",
  },
  {
    num: '03',
    title: 'Dock to Stock in 48 Hours.',
    body: 'We receive all inbound shipments within 2 business days. Your inventory goes live fast so you can sell, not wait.',
  },
  {
    num: '04',
    title: "100% Order Accuracy. Or $50 Says We're Sorry.",
    body: "Wrong item ships? We pay you $50 per error and reship correctly. Immediately. No ticket queue, no excuses.",
  },
]

// ============ Warehouses ============

export const WAREHOUSES = {
  NJ: { label: 'NJ', city: 'New Brunswick', state: 'NJ', zip: '08901', col: 9, row: 3 },
  CA: { label: 'CA', city: 'Ontario',        state: 'CA', zip: '91761', col: 0, row: 3 },
  TX: { label: 'TX', city: 'Missouri City',  state: 'TX', zip: '77489', col: 2, row: 5 },
} as const

// ============ Coverage Stats ============

export const COVERAGE = {
  zipCodesServed:        7_373,
  continentalCoverage:   92,   // % of continental US with 2-day delivery
  avgSavingsPerMonth:   1_500, // $ average merchant monthly savings
  fedexDiscountPct:        80, // % off FedEx published rates
  slaPct:                99.2, // % of 2-day SLAs attained
  automationPct:           85, // % of paperwork automated
}

// ============ Chat Widget System Prompt ============

export const CHAT_SYSTEM_PROMPT = `You are the ShippingCow AI assistant — a friendly, direct expert on heavy-goods e-commerce fulfillment.

ShippingCow is a 3PL platform built for the 50 lb+ seller. Core competitive advantages:
- DIM divisor 225 (vs 139 UPS/FedEx, 166 typical 3PL) → 38–39% lower dimensional weight → lower shipping bills
- 3 warehouses: New Brunswick NJ, Ontario CA, Missouri City TX — covering 92% of continental US in 2 days
- Zone-skip routing: parcels injected at Zone ≤ 4, cutting transit time and cost 28–52%
- Up to 80% off FedEx published rates via volume pooling
- Guaranteed zero inventory shrinkage (we pay wholesale if we lose anything)
- $50 credit per accuracy error
- AI-powered paperwork: Bills of Lading, ISF 10+2, customs docs — 85%+ automated

Pricing tiers:
- Free Scout: $0 — calculator, rate estimates, coverage lookup
- Optimizer: $99/mo — AI Copilot (20K tokens), live rate comparison, automated BoLs, DIM 225 rates
- Herd Leader: $499/mo — AI Copilot (120K tokens), 80% off FedEx pool, $500/mo fulfillment credit, dedicated account manager
- Enterprise: custom — everything + SLA contracts, dedicated WMS, white-glove onboarding

Key rules:
- If the question is about their specific product dimensions/rates → send to /calculator
- If they seem ready to commit or want a quote → send to /inquiry
- If they ask about account/login → send to /login
- NEVER invent SLAs, rates, or promises beyond what's listed above
- NEVER mention competitor names (UPS, FedEx, ShipBob, etc.) directly
- Keep responses under 150 words unless a detailed breakdown is truly needed
- Be direct and helpful — no filler, no corporate fluff`

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

export const LTL_COST_PER_MILE = 2.50  // placeholder — will be replaced with broker API

// ============ Pallet Specs ============

export const PALLET_MAX_VOLUME_CBM = 1.8           // cubic meters
export const PALLET_MAX_VOLUME_CUIN = 1.8 * 61023.7  // cubic inches (≈ 109,842.7 cu in)
