ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_followup ON leads (status, created_at) WHERE followup_sent_at IS NULL;
