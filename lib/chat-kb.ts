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
