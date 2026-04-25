CREATE TABLE IF NOT EXISTS waitlist_signups (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  company_name VARCHAR(160),
  phone_number VARCHAR(40),
  role VARCHAR(60),
  focus VARCHAR(220),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at
ON waitlist_signups (created_at DESC, id DESC);
