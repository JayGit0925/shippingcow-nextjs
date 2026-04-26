// KB chunks seeded in migrations/003_chat_v2.sql.
// This module does keyword-based retrieval (no vectors v1).

export type KbChunk = {
  source: string;
  content: string;
  keywords: string[];
};

// Fallback in-memory chunks — used if DB is unavailable or for edge runtime
const FALLBACK_CHUNKS: KbChunk[] = [
  {
    source: 'dim225',
    content: 'ShippingCow uses DIM divisor 225 vs 139 (UPS/FedEx) or 166 (typical 3PL). A 24x18x12 box at 30 lbs: DIM 139 = 45 lbs billable, DIM 225 = 28 lbs billable. That 38% reduction lowers your shipping bill directly.',
    keywords: ['dim', 'dimensional', 'weight', 'divisor', '225', '139', '166', 'billable'],
  },
  {
    source: 'pricing',
    content: 'Pricing: Free Scout ($0). Optimizer ($99/mo) — AI Copilot, live rates, DIM 225 rates. Herd Leader ($499/mo) — 80% off FedEx, $500/mo credit, dedicated account manager. Enterprise (custom) — SLA, white-glove.',
    keywords: ['price', 'pricing', 'cost', 'plan', 'tier', 'monthly', 'optimizer', 'herd leader', 'enterprise', 'free'],
  },
  {
    source: 'warehouses',
    content: '3 fulfillment centers: New Brunswick NJ, Ontario CA, Missouri City TX. 92% of continental US in 2-day ground. Zone-skip routing cuts cost 28–52%.',
    keywords: ['warehouse', 'location', 'new jersey', 'california', 'texas', 'coverage', 'zone', '2-day'],
  },
  {
    source: 'savings',
    content: 'Customers save 40–80% vs standard carriers. Three levers: DIM 225 reduces billable weight 38%, volume pooling unlocks enterprise FedEx rates, zone-skip routing cuts distance. Use /calculator for exact estimate.',
    keywords: ['save', 'savings', 'discount', 'rate', 'cost', 'reduce', 'cheaper', 'how much'],
  },
  {
    source: 'guarantees',
    content: 'Zero inventory shrinkage guarantee — we pay wholesale replacement if anything lost or damaged. $50 credit per picking accuracy error. 2-day delivery to 92% of US.',
    keywords: ['guarantee', 'shrinkage', 'damage', 'lost', 'accuracy', 'sla', 'promise', 'insurance'],
  },
  {
    source: 'carriers',
    content: 'Routes through FedEx (21–150 lbs), GOFO (optimized last-mile 1–20 lbs), regional carriers for zone-skip. Carrier selection automated by weight, destination zone, and speed.',
    keywords: ['carrier', 'fedex', 'gofo', 'freight', 'pounds', 'heavy'],
  },
  {
    source: 'icp',
    content: 'Built for e-commerce sellers shipping 50–500 lb items (furniture, fitness equipment, power tools, outdoor gear). Minimum: 200 shipments/month. Best fit: $50K+/mo shipping spend.',
    keywords: ['who', 'fit', 'minimum', 'volume', 'furniture', 'fitness', 'equipment', 'amazon', 'tiktok', 'seller'],
  },
  {
    source: 'ai_paperwork',
    content: 'Automates Bills of Lading, ISF 10+2 filings, customs docs, commercial invoices. 85%+ fully automated. Included in Optimizer and Herd Leader plans.',
    keywords: ['paperwork', 'bol', 'bill of lading', 'isf', 'customs', 'automate', 'ai'],
  },
  {
    source: 'process',
    content: 'How it works: Send inventory to nearest warehouse → received + counted in 24h → orders flow via API or CSV → we pick, pack, inject at optimal zone → AI handles all paperwork.',
    keywords: ['how', 'process', 'works', 'onboard', 'start', 'inventory', 'receive', 'pick', 'pack'],
  },
  {
    source: 'tiktok_amazon',
    content: 'Supports Amazon SFP (Seller Fulfilled Prime) and TikTok Shop dispatch. 2-day SLA meets Prime standards. Automated labels and manifests for both platforms.',
    keywords: ['amazon', 'tiktok', 'prime', 'sfp', 'seller fulfilled', 'marketplace'],
  },

  // ── General 3PL / E-commerce knowledge ──────────────────────
  {
    source: '3pl_basics',
    content: 'A 3PL (third-party logistics provider) stores your inventory and fulfills orders on your behalf. You ship product to their warehouse; when a customer orders, they pick, pack, and ship it. Benefits: no warehouse lease, no picking staff, volume-based carrier rates you can\'t get alone.',
    keywords: ['3pl', 'third party', 'logistics', 'what is', 'how does', 'fulfillment', 'outsource', 'warehouse'],
  },
  {
    source: '3pl_vs_self_fulfill',
    content: 'Self-fulfilling makes sense below ~50 orders/month. Above that, a 3PL typically wins on cost and speed. A 3PL gives you multi-warehouse coverage, carrier discounts, and no fixed overhead. The break-even is usually when your shipping carrier fees exceed the 3PL pick-and-pack fee.',
    keywords: ['self fulfill', 'in-house', 'vs', 'compare', 'better', 'worth it', 'should i use', 'when'],
  },
  {
    source: 'dim_weight_basics',
    content: 'DIM weight (dimensional weight) is how carriers charge for large, light packages. Formula: Length × Width × Height ÷ DIM divisor. If DIM weight > actual weight, you pay DIM weight. Standard carriers (FedEx/UPS) use divisor 139 — the lower the divisor, the higher the charge on bulky items.',
    keywords: ['dim weight', 'dimensional', 'how is', 'calculated', 'formula', 'divisor', 'why am i charged', 'volumetric'],
  },
  {
    source: 'shipping_zones',
    content: 'Shipping zones (1–8) measure distance between origin and destination. Zone 2 = local, Zone 8 = cross-country. Every zone up roughly adds 15–25% to your shipping cost. Zone-skipping means injecting packages at a warehouse closer to the customer to start at a lower zone.',
    keywords: ['zone', 'zones', 'distance', 'zone skip', 'zone 2', 'zone 8', 'cross country', 'local delivery'],
  },
  {
    source: 'ltl_basics',
    content: 'LTL (Less Than Truckload) is how most e-commerce sellers ship inbound inventory to warehouses. You share trailer space with other shippers. Cost is based on freight class, weight, and distance. Typically $150–$800 per pallet depending on origin/destination.',
    keywords: ['ltl', 'less than truckload', 'inbound', 'freight', 'pallet', 'trucking', 'shipping inventory'],
  },
  {
    source: 'ecommerce_fulfillment_costs',
    content: 'Typical 3PL cost structure: receiving fee ($2–5/carton or $10–15/pallet), storage ($0.50–1.50/cubic foot/month), pick & pack ($2–6/order + $0.25–0.50/item), outbound shipping (carrier rate + fuel surcharge). Total all-in cost per order is usually $5–15 for standard e-commerce.',
    keywords: ['cost', 'how much', 'fees', 'receiving', 'storage', 'pick and pack', 'per order', 'price'],
  },
  {
    source: 'ecommerce_heavy_goods',
    content: 'Heavy goods (50 lbs+) face steep DIM penalties from standard carriers. FedEx/UPS surcharges kick in at 50 lbs and again at 70+ lbs. Specialized 3PLs with negotiated heavy-goods rates can cut costs 30–60% vs shipping direct. Categories: furniture, gym equipment, power tools, outdoor gear, pet supplies.',
    keywords: ['heavy', '50 lbs', '70 lbs', 'surcharge', 'oversize', 'furniture', 'gym', 'power tools', 'outdoor'],
  },
  {
    source: 'returns_processing',
    content: 'Returns (reverse logistics) are handled by the 3PL: receive returned item, inspect condition, restock if resellable or quarantine if damaged. Typical returns processing fee: $3–8/unit. High return rates (>15%) are a red flag for margin; apparel and electronics typically have the highest rates.',
    keywords: ['return', 'returns', 'reverse logistics', 'refund', 'damaged', 'restock', 'rma'],
  },
  {
    source: 'inventory_receiving',
    content: 'When you send inventory to a 3PL, they receive, count, and check it against your packing list. This is called "receiving" or "check-in." Discrepancies are documented. Standard receiving takes 1–3 business days; express receiving (same-day) costs extra. Always send an ASN (advance ship notice) so the warehouse can plan labor.',
    keywords: ['receive', 'receiving', 'check in', 'inventory', 'asn', 'advance ship notice', 'counting', 'discrepancy'],
  },
  {
    source: 'carrier_surcharges',
    content: 'Major carrier surcharges to know: Residential Delivery ($5–6/package), Delivery Area Surcharge for rural ZIPs ($5–25), Fuel Surcharge (varies weekly, currently ~18–22%), Extended Delivery Area ($20–50), Adult Signature Required ($6–10), Saturday Delivery premium. These stack and can double the base rate.',
    keywords: ['surcharge', 'surcharges', 'residential', 'rural', 'fuel', 'fees', 'extra charge', 'hidden'],
  },
  {
    source: 'kpis_fulfillment',
    content: 'Key fulfillment KPIs to track: Order accuracy rate (target 99.5%+), on-time ship rate (target 98%+), inventory accuracy (target 99%+), average time to ship (target same-day for orders placed before 2pm), return rate by SKU. Low accuracy and late shipments are the top reasons sellers switch 3PLs.',
    keywords: ['kpi', 'metrics', 'accuracy', 'on time', 'measure', 'benchmark', 'performance', 'sla'],
  },
];

export function retrieveChunks(query: string, topK = 5): KbChunk[] {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);

  const scored = FALLBACK_CHUNKS.map((chunk) => {
    let score = 0;
    for (const kw of chunk.keywords) {
      if (lower.includes(kw)) score += 2;
    }
    for (const word of words) {
      if (chunk.content.toLowerCase().includes(word) && word.length > 3) score += 1;
    }
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk);
}

export function buildKbContext(chunks: KbChunk[]): string {
  if (chunks.length === 0) return '';
  return (
    '\n\n--- KNOWLEDGE BASE (use this, do not invent beyond it) ---\n' +
    chunks.map((c) => `[${c.source}] ${c.content}`).join('\n\n') +
    '\n--- END KNOWLEDGE BASE ---'
  );
}
