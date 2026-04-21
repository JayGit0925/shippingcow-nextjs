-- ShippingCow — Migration 003
-- Chat Widget v2: sessions, events, KB chunks
-- Run in Supabase SQL Editor before deploying jay/chat-widget-v2

-- ============================================================
-- Extend chat_messages
-- ============================================================
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS event_type TEXT;

-- ============================================================
-- chat_sessions — one row per browser session_id
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id         TEXT PRIMARY KEY,
  first_seen         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_count         INTEGER NOT NULL DEFAULT 1,
  opener_variant     TEXT,
  email              TEXT,
  qualified_score    INTEGER NOT NULL DEFAULT 0,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  slack_notified_at  TIMESTAMPTZ,
  follow_up_sent_at  TIMESTAMPTZ,
  message_count      INTEGER NOT NULL DEFAULT 0,
  calculator_context JSONB
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_insert_anon"
  ON chat_sessions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "chat_sessions_update_own"
  ON chat_sessions FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "chat_sessions_all_service"
  ON chat_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- chat_events — analytics event stream
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id  TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  metadata    JSONB
);

ALTER TABLE chat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_events_insert_anon"
  ON chat_events FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "chat_events_all_service"
  ON chat_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- chat_kb_chunks — knowledge base, keyword-matched (no vectors v1)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_kb_chunks (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source   TEXT NOT NULL,
  content  TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}'
);

ALTER TABLE chat_kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_kb_chunks_all_service"
  ON chat_kb_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS chat_sessions_email_idx    ON chat_sessions (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS chat_sessions_score_idx    ON chat_sessions (qualified_score DESC);
CREATE INDEX IF NOT EXISTS chat_events_session_idx    ON chat_events (session_id);
CREATE INDEX IF NOT EXISTS chat_events_type_idx       ON chat_events (event_type);
CREATE INDEX IF NOT EXISTS chat_events_created_idx    ON chat_events (created_at DESC);
CREATE INDEX IF NOT EXISTS chat_kb_chunks_source_idx  ON chat_kb_chunks (source);

-- ============================================================
-- Seed KB chunks
-- ============================================================
INSERT INTO chat_kb_chunks (source, content, keywords) VALUES

('dim225',
 'ShippingCow uses DIM divisor 225 vs the industry standard 139 (UPS/FedEx) or 166 (typical 3PL). A 24x18x12 box weighing 30 lbs: at DIM 139 = 45 lbs billable, at DIM 225 = 28 lbs billable. That 38% reduction directly lowers your shipping bill.',
 ARRAY['dim','dimensional','weight','divisor','225','139','166','billable']),

('pricing',
 'ShippingCow pricing tiers: Free Scout ($0) — calculator + rate estimates. Optimizer ($99/mo) — AI Copilot 20K tokens, live rate comparison, automated BoLs, DIM 225 rates. Herd Leader ($499/mo) — AI Copilot 120K tokens, 80% off FedEx pool, $500/mo fulfillment credit, dedicated account manager. Enterprise (custom) — SLA contracts, dedicated WMS, white-glove onboarding.',
 ARRAY['price','pricing','cost','plan','tier','monthly','optimizer','herd leader','enterprise','free','scout']),

('warehouses',
 'ShippingCow operates 3 fulfillment centers: New Brunswick NJ (East Coast), Ontario CA (West Coast), Missouri City TX (Central). Combined coverage: 92% of continental US in 2-day ground. Zone-skip routing injects parcels at Zone ≤4, cutting transit time and cost 28–52%.',
 ARRAY['warehouse','location','fulfillment center','new jersey','california','texas','coverage','zone','2-day','two day']),

('savings',
 'ShippingCow customers shipping 50lb+ goods typically save 40–80% vs standard carrier rates. Savings come from three levers: (1) DIM 225 reduces billable weight 38%, (2) volume pooling unlocks enterprise FedEx rates, (3) zone-skip routing cuts distance. Run the calculator at /calculator for your exact estimate.',
 ARRAY['save','savings','discount','rate','cost','reduce','80%','40%','cheaper','how much']),

('guarantees',
 'ShippingCow guarantees: Zero inventory shrinkage — if we lose or damage anything we pay you wholesale replacement cost immediately. $50 credit for every picking accuracy error. 2-day delivery to 92% of US.',
 ARRAY['guarantee','shrinkage','damage','lost','accuracy','sla','promise','insurance','credit']),

('carriers',
 'ShippingCow routes through FedEx (primary for 21–150 lbs), GOFO (optimized last-mile 1–20 lbs), and regional carriers for zone-skip injection. Carrier selection is automated based on package weight, destination zone, and speed requirement.',
 ARRAY['carrier','fedex','ups','gofo','shipping','freight','lbs','pounds','weight','heavy']),

('process',
 'How ShippingCow works: (1) Send inventory to our nearest warehouse. (2) We receive, count, and store — you get confirmation within 24 hours. (3) Orders flow in via API or CSV. (4) We pick, pack, and inject at optimal zone. (5) AI generates all paperwork (BoL, ISF, customs) automatically. 85%+ of paperwork is fully automated.',
 ARRAY['how','process','works','onboard','start','begin','inventory','receive','pick','pack','paperwork','bol']),

('icp',
 'ShippingCow is built for: e-commerce sellers shipping 50–500 lbs items (furniture, fitness equipment, power tools, outdoor gear, home appliances). Minimum: 200 shipments/month. Best fit: $50K+/mo shipping spend, multi-SKU, 2+ warehouses needed, currently paying DIM 139 or 166.',
 ARRAY['who','fit','right for','minimum','volume','shipments','furniture','fitness','equipment','amazon','tiktok','seller']),

('ai_paperwork',
 'ShippingCow AI automates: Bills of Lading (BoL), ISF 10+2 filings, customs documentation, commercial invoices. 85%+ fully automated. Reduces paperwork time from hours to minutes. Included in Optimizer and Herd Leader plans.',
 ARRAY['paperwork','bol','bill of lading','isf','customs','documents','automate','ai','filing']),

('tiktok_amazon',
 'ShippingCow supports Amazon SFP (Seller Fulfilled Prime) and TikTok Shop dispatch requirements. 2-day delivery SLA meets Amazon Prime standards. Automated labels and manifests for both platforms. Ask about platform-specific setup.',
 ARRAY['amazon','tiktok','prime','sfp','seller fulfilled','tiktok shop','marketplace','platform']);
