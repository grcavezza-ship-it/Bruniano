CREATE TABLE IF NOT EXISTS auth_rate_limits (
  rate_key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now()
);
