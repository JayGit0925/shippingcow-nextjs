import { SITE_URL } from '@/lib/site';

// Copy source of truth: logistar:shippingcow/content/
// copy_vertical-landing-and-comparison_shippingcow_2026-07-20.md (PAGE 1,
// approved). Transcribed 1:1 with internal citation markers stripped.
// Publishing (sitemap + index) is gated on GATE-LANDED-COST — pages render
// noindex until the gate clears.

export const VERTICAL_SLUGS = [
  'heavy-goods-fulfillment',
  'furniture-fulfillment',
  'fitness-equipment-fulfillment',
] as const;

export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];
export type ProofKey = 'furniture' | 'fitness';

export interface VerticalConfig {
  slug: VerticalSlug;
  h1: string;
  heroExamples: string;
  metaTitle: string;
  metaDescription: string;
  proofLines: ProofKey[];
}

// H1 noun + hero-example swaps use only nouns already in the approved doc
// (master list from the subhead; furniture/fitness nouns from the proof lines).
export const VERTICALS: Record<VerticalSlug, VerticalConfig> = {
  'heavy-goods-fulfillment': {
    slug: 'heavy-goods-fulfillment',
    h1: 'The self-operated US 3PL built for 50–149 lb furniture and fitness goods.',
    heroExamples: 'sofas, weight racks, treadmills, cabinets, and grills',
    metaTitle: 'Heavy Goods Fulfillment (50–149 lb) | ShippingCow',
    metaDescription:
      'A self-operated US 3PL where 50–149 lb furniture and fitness goods are the whole business: own warehouse, below-market last-mile rate, written penalty-backed guarantee.',
    proofLines: ['furniture', 'fitness'],
  },
  'furniture-fulfillment': {
    slug: 'furniture-fulfillment',
    h1: 'The self-operated US 3PL built for 50–149 lb furniture.',
    heroExamples: 'sofas, sectionals, cabinets, and mattresses',
    metaTitle: 'Furniture Fulfillment 3PL (50–149 lb) | ShippingCow',
    metaDescription:
      'A self-operated US 3PL where 50–149 lb furniture is the whole business: own warehouse, below-market last-mile rate, written penalty-backed guarantee.',
    proofLines: ['furniture'],
  },
  'fitness-equipment-fulfillment': {
    slug: 'fitness-equipment-fulfillment',
    h1: 'The self-operated US 3PL built for 50–149 lb fitness equipment.',
    heroExamples: 'racks, benches, treadmills, and plates',
    metaTitle: 'Fitness Equipment Fulfillment 3PL (50–149 lb) | ShippingCow',
    metaDescription:
      'A self-operated US 3PL where 50–149 lb fitness equipment is the whole business: own warehouse, below-market last-mile rate, written penalty-backed guarantee.',
    proofLines: ['fitness'],
  },
};

export const SUBHEAD_TEMPLATE = (examples: string) =>
  `Most 3PLs are tuned for 1–3 lb boxes and quietly steer heavy SKUs away. ShippingCow does the opposite: ${examples} are the whole business. Your goods live in our own US warehouse; we pick, pack, and ship the last mile on a heavy-parcel rate floor ordinary 3PLs can't match — with a written, penalty-backed guarantee on the segment we control.`;

export const PRIMARY_CTA = {
  button: 'Get a free Cost Audit',
  body: 'Send one heavy SKU and a recent invoice; we return your true landed cost per order and a side-by-side vs your current setup. No account, no wallet, no commitment, no need to move inventory to see the number.',
  href: '/audit',
};

export const SECONDARY_CTAS = [
  { label: 'Estimate my heavy-parcel cost', href: '/calculator' },
  { label: 'Book a 1-week paid pilot', href: '/inquiry' },
];

export const BENEFIT_HEADING = 'Why heavy sellers pick ShippingCow';

export const BENEFIT_BULLETS: { title: string; body: string }[] = [
  {
    title: 'The 50–149 lb band is our default, not an exception.',
    body: 'Amazon FBA caps a standard box at 50 lb, so heavy SKUs get forced onto merchant-fulfilled or into a bulky tier with 2026 fee hikes. Light-optimized 3PLs (ShipBob, ShipMonk) say outright they "probably won\'t be a good fit" for big/heavy items. We priced, palletized, and staffed for exactly this weight.',
  },
  {
    title: 'A real last-mile cost floor.',
    body: 'Our GS ground rate runs roughly ~17% below FedEx Home and ~28% below UPS on the last leg for this weight band — the single line item that dominates a heavy parcel\'s landed cost. You feel it on every order, not once at signup.',
  },
  {
    title: 'Self-operated, not brokered.',
    body: 'Your inventory sits in our own warehouse and our own team handles every touch — receiving, storage, pick, pack, and last-mile. One accountable operator for US fulfillment, one invoice, no finger-pointing between a warehouse and a carrier. (Ocean first-leg and customs are available to qualified accounts on request — ask your rep; they\'re not part of the standard offer.)',
  },
  {
    title: 'A written, capped, paid guarantee.',
    body: 'Zero-loss / zero-mispick / on-time on the segment we control (in-warehouse, last-mile) — if we miss, we pay you, reimbursed at your cost, not a token slice of freight. ShipBob offers no financial SLA; ShipMonk pauses its SLA during peak. Our guarantee is in writing and stays on in peak.',
  },
  {
    title: "Built for 2026's surcharge shocks.",
    body: 'New cubic-volume Additional Handling (10,368 in³), the first-ever 110 lb weight-only oversize trigger, +8.4% residential, and a blended 8–12% real rate increase all land hardest on bulky 50–149 lb parcels. Our audit screens your box dimensions and flags exactly where these hit you.',
  },
  {
    title: 'Chinese-language support, one responsible party.',
    body: 'For brands sourcing from or based in China, we run US fulfillment with a bilingual team and verifiable US entity — the reliability of a US 3PL, in your language. (Your goods reach the US however you already import; we take it from our dock.)',
  },
  {
    title: 'Test small, then scale.',
    body: 'A 1-week paid pilot runs real orders through our facility before you commit volume — the "先测后放量" way heavy sellers actually buy. Land as a backup provider, earn the volume on proven time + payout.',
  },
  {
    title: 'No net terms, no working-capital trap on us.',
    body: 'Prepaid wallet with auto-recharge; transparent cost-plus. You always know the number before the label prints.',
  },
];

export const PROOF_LINES: Record<ProofKey, string> = {
  furniture:
    'North American online furniture is a ~$47B market and growing — sofas, sectionals, cabinets, and mattresses are multi-touch, damage-prone, and exactly where handling discipline and a paid guarantee pay for themselves.',
  fitness:
    'US home-fitness equipment is a ~$4B market with ~35% online — racks, benches, treadmills, and plates that are dense, heavy, and punished by every oversize and additional-handling surcharge on the 2026 sheet.',
};

export const CLOSING = {
  headline: 'Stop overpaying to ship the things nobody else wants to touch.',
  body: 'Get a free Cost Audit → see your real landed cost per order → run a 1-week paid pilot. A US 3PL built for heavy, run by a team you can actually reach.',
  button: 'Get my free Cost Audit',
  href: '/audit',
};

export const FAQ_HEADING = 'Frequently asked questions';

export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'What is the best 3PL for furniture and heavy fitness equipment?',
    answer:
      'The best fit for 50–149 lb furniture and fitness goods is a 3PL that specializes in heavy SKUs rather than one optimized for 1–3 lb parcels. ShippingCow handles this band as its core business from its own US warehouses — pick, pack, and last-mile on a below-market heavy-parcel rate, with a written, penalty-backed loss-and-accuracy guarantee.',
  },
  {
    question: "Why won't ShipBob or ShipMonk handle my 50+ lb products well?",
    answer:
      'ShipBob and ShipMonk are automation-optimized for light, standardized DTC SKUs and publicly note they may not be a good fit for big, heavy, or bulky items. Their pricing and workflows assume small parcels, so 50–149 lb goods incur exceptions and steep surcharges. Heavy-goods specialists price and staff for that weight band directly.',
  },
  {
    question: 'How much does it cost to ship a 50 lb package in 2026?',
    answer:
      'Cost depends on zone, dimensions, and residential delivery, but 2026 adds real pressure: a blended 8–12% carrier rate increase, cubic-volume Additional Handling at 10,368 cubic inches, and higher residential fees. A last-mile rate roughly 17% below FedEx Home materially lowers the landed cost on heavy parcels. Run a free Cost Audit for your exact number.',
  },
  {
    question: 'Do I have to move all my inventory to get a quote?',
    answer:
      "No. The free Cost Audit needs only one representative heavy SKU and a recent shipping invoice — we return your true landed cost per order and a side-by-side against your current setup. You see the number before you move anything. If it's worth it, a 1-week paid pilot tests real orders before you commit volume.",
  },
  {
    question: 'Does ShippingCow guarantee against loss and damage on heavy items?',
    answer:
      'Yes. On the segment we control — in-warehouse and last-mile — we offer a written, capped guarantee covering loss, mispicks, and late shipments, reimbursed at your product cost. Uncontrollable legs are explicitly excluded. This differs from providers that track damage but offer no financial service-level agreement.',
  },
  {
    question: 'Can I test ShippingCow before moving all my inventory?',
    answer:
      'Yes. We run a 1-week paid pilot with real orders through our facility so you can verify transit time and accuracy before committing volume. Heavy sellers typically test small, then scale, and multi-home across providers — so we expect to earn volume as the pilot proves time-in-transit and payout performance.',
  },
];

export function buildVerticalJsonLd(slug: VerticalSlug) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/${slug}#faq`,
        mainEntity: FAQ_ITEMS.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/${slug}#service`,
        name: 'Heavy-parcel 3PL fulfillment (50–149 lb)',
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: 'US',
        description:
          'Self-operated US 3PL for 50–149 lb parcels: receiving, storage, pick, pack, and last-mile on a below-market heavy-parcel ground rate, backed by a written, capped guarantee on the controllable segment.',
      },
    ],
  };
}
