-- ShippingCow — initial schema
-- Run once against your Supabase / Postgres instance.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  company       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  company        TEXT,
  phone          TEXT,
  monthly_spend  TEXT,
  product_weight TEXT,
  message        TEXT,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'new',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking (
  id              SERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  status          TEXT NOT NULL,
  origin          TEXT,
  destination     TEXT,
  est_delivery    TEXT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demo tracking numbers (idempotent)
INSERT INTO tracking (tracking_number, status, origin, destination, est_delivery)
VALUES
  ('SC123456789', 'out_for_delivery', 'Dallas, TX',    'Austin, TX',  'Tomorrow, 2 PM'),
  ('SC987654321', 'in_transit',       'Reno, NV',      'Denver, CO',  '2 days'),
  ('SC111222333', 'delivered',        'Knoxville, TN', 'Atlanta, GA', 'Delivered')
ON CONFLICT (tracking_number) DO NOTHING;
