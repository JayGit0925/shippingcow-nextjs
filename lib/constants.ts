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
