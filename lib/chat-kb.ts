// KB — keyword-based retrieval with DB-backed chunks, in-memory fallback.

import { sql } from '@/lib/db';

export type KbChunk = {
  source: string;
  content: string;
  keywords: string[];
};

// Fallback in-memory chunks — used if DB is unavailable
const FALLBACK_CHUNKS: KbChunk[] = [
  {
    source: 'dim_billing',
    content: 'Carriers turn box size into billable weight with a DIM divisor. UPS/FedEx publish 139 for ground; a typical 3PL uses 166. A 24x18x12 box at 30 lbs bills as 45 lbs at divisor 139 — 15 lbs of phantom weight. ShippingCow does not publish its own divisor: we quote against your real SKU mix and lanes. Use /calculator to see what you are billed for today, and /audit to have us price it.',
    keywords: ['dim', 'dimensional', 'weight', 'divisor', '139', '166', 'billable'],
  },
  {
    source: 'pricing',
    content: 'Pricing: no self-serve tiers — every account gets a custom savings model. Path: /calculator for an instant estimate, /audit for a full savings report from real shipment data.',
    keywords: ['price', 'pricing', 'cost', 'plan', 'tier', 'monthly', 'optimizer', 'herd leader', 'enterprise', 'free'],
  },
  {
    source: 'warehouses',
    content: '3 self-operated fulfillment centers: New Brunswick NJ, Ontario CA, Missouri City TX. Inventory is split across East, Central and West so orders ship from the closest warehouse at the lowest available FedEx zone. We do not publish a transit-day guarantee — ask us about your specific lanes.',
    keywords: ['warehouse', 'location', 'new jersey', 'california', 'texas', 'coverage', 'zone', 'transit'],
  },
  {
    source: 'savings',
    content: 'We do not publish savings percentages — a number that ignores your zones and SKU mix is a number that lies. Three levers actually move your cost: dimensional weight on bulky parcels, volume pooling into enterprise FedEx rates, and zone-skip routing that shortens the lane. Use /calculator to see what your carrier bills you for today, and /audit to have us price your real shipments.',
    keywords: ['save', 'savings', 'discount', 'rate', 'cost', 'reduce', 'cheaper', 'how much', 'percent'],
  },
  {
    source: 'service_levels',
    content: 'Service commitments are set per account in the agreement, not advertised on the website. If you need specific SLA language on accuracy, damage, or transit time, ask and we will put it in writing for your volume.',
    keywords: ['guarantee', 'damage', 'lost', 'accuracy', 'sla', 'promise', 'insurance'],
  },
  {
    source: 'carriers',
    content: 'Routes through FedEx (21–150 lbs), GOFO (optimized last-mile 1–20 lbs), regional carriers for zone-skip. Carrier selection automated by weight, destination zone, and speed.',
    keywords: ['carrier', 'fedex', 'gofo', 'freight', 'pounds', 'heavy'],
  },
  {
    source: 'icp',
    content: 'Built for US e-commerce brands shipping heavy DTC parcels in the 50–149 lb band (furniture, fitness equipment, power tools, outdoor gear). Fit and minimums are set per account — tell us your monthly volume and we will tell you straight whether we are the right home for it.',
    keywords: ['who', 'fit', 'minimum', 'volume', 'furniture', 'fitness', 'equipment', 'amazon', 'tiktok', 'seller'],
  },
  {
    source: 'paperwork',
    content: 'Outbound shipping paperwork — Bills of Lading, labels, manifests, commercial invoices for domestic moves — is generated for you. Ask your account contact about anything beyond the US warehouse leg; we do not scope that on the website.',
    keywords: ['paperwork', 'bol', 'bill of lading', 'label', 'manifest', 'document'],
  },
  {
    source: 'process',
    content: 'How it works: Send inventory to the nearest warehouse → received and counted → orders flow in via API or CSV → we pick, pack, and inject at the optimal zone → shipping paperwork is generated for you.',
    keywords: ['how', 'process', 'works', 'onboard', 'start', 'inventory', 'receive', 'pick', 'pack'],
  },
  {
    source: 'tiktok_amazon',
    content: 'Supports Amazon SFP (Seller Fulfilled Prime) and TikTok Shop dispatch, with automated labels and manifests for both platforms. Whether your specific lanes clear Prime transit standards is checked against your ZIP mix — we do not blanket-promise it.',
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

export async function retrieveChunks(query: string, topK = 5): Promise<KbChunk[]> {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/);

  // Try DB first — keyword array overlap match
  let chunks: KbChunk[] = [];
  try {
    const keywordTerms = words.filter((w) => w.length > 3);
    if (keywordTerms.length > 0) {
      const dbChunks = await sql<KbChunk[]>`
        SELECT source, content, keywords
        FROM chat_kb_chunks
        WHERE keywords && ${sql.array(keywordTerms)}
        LIMIT 50
      `;
      chunks = dbChunks.map((row) => ({
        source: row.source,
        content: row.content,
        keywords: row.keywords ?? [],
      }));
    }
  } catch (e) {
    console.warn('[chat-kb] DB query failed, falling back to in-memory chunks:', String(e));
  }

  // Fall back to in-memory chunks if DB returned nothing
  const source = chunks.length > 0 ? chunks : FALLBACK_CHUNKS;

  const scored = source.map((chunk) => {
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
