-- Admin users: minimal profile required by the gestionale.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (lower(email)) WHERE email IS NOT NULL;
