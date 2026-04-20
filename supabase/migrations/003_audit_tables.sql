-- Create zip_coords table for US ZIP code coordinates
CREATE TABLE IF NOT EXISTS zip_coords (
  zip   TEXT PRIMARY KEY,
  lat   DOUBLE PRECISION NOT NULL,
  lng   DOUBLE PRECISION NOT NULL,
  city  TEXT,
  state TEXT
);

CREATE INDEX IF NOT EXISTS idx_zip_coords_zip ON zip_coords (zip);

-- Create audits table to store shipment analysis results
CREATE TABLE IF NOT EXISTS audits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  lead_id       UUID,
  input_data    JSONB,
  report_data   JSONB,
  row_count     INTEGER,
  total_savings NUMERIC(12, 2)
);

CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_lead_id ON audits (lead_id);
