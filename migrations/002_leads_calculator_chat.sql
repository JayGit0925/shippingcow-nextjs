-- ShippingCow — Migration 002
-- Adds: leads, calculator_sessions, chat_messages
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- RLS is enabled on all three tables.

-- ============================================================
-- leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  step_completed   INTEGER NOT NULL DEFAULT 1 CHECK (step_completed BETWEEN 1 AND 4),
  step_timestamps  JSONB NOT NULL DEFAULT '{}',
  step1_data       JSONB,
  step2_data       JSONB,
  step3_data       JSONB,
  step4_data       JSONB,
  savings_estimate JSONB,
  source_url       TEXT,
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'contacted', 'qualified', 'converted'))
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION leads_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION leads_set_updated_at();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors may insert (step 1 save)
CREATE POLICY "leads_insert_anon"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role (backend API) can read and update
CREATE POLICY "leads_all_service"
  ON leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own lead (linked by email in step4_data)
CREATE POLICY "leads_select_own"
  ON leads FOR SELECT
  TO authenticated
  USING (
    (step4_data ->> 'email') = auth.email()
  );

-- ============================================================
-- calculator_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS calculator_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id          TEXT,
  inputs              JSONB,
  dim_weight_139      NUMERIC(10, 2),
  dim_weight_166      NUMERIC(10, 2),
  dim_weight_225      NUMERIC(10, 2),
  billable_weight_139 NUMERIC(10, 2),
  billable_weight_225 NUMERIC(10, 2),
  savings_per_package NUMERIC(10, 2),
  annual_savings      NUMERIC(12, 2),
  converted_to_lead   BOOLEAN NOT NULL DEFAULT FALSE,
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL
);

ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors may insert (calculator auto-save)
CREATE POLICY "calculator_sessions_insert_anon"
  ON calculator_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "calculator_sessions_all_service"
  ON calculator_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  page_url   TEXT,
  lead_id    UUID REFERENCES leads(id) ON DELETE SET NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors may insert chat messages
CREATE POLICY "chat_messages_insert_anon"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "chat_messages_all_service"
  ON chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS leads_status_idx            ON leads (status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx        ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS calc_sessions_session_idx   ON calculator_sessions (session_id);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx   ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS chat_messages_lead_idx      ON chat_messages (lead_id);
