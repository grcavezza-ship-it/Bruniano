import crypto from 'node:crypto';
import { db, send } from './_db.js';

const SESSION_COOKIE = '__Host-bruniano_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEMO_USERNAME = 'admin';
const INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
}

function getCookie(req, name) {
  const raw = req.headers?.cookie || '';
  const part = raw.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : '';
}

function hashSession(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(String(password), salt, 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(expectedHash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

export async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    must_change_password boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS admin_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS auth_rate_limits (
    rate_key text PRIMARY KEY,
    attempts integer NOT NULL DEFAULT 0,
    window_started_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at)`;

  const users = await sql`SELECT id FROM admin_users WHERE username=${DEMO_USERNAME} LIMIT 1`;
  if (!users.length) {
    if (!INITIAL_PASSWORD) throw new Error('ADMIN_INITIAL_PASSWORD is required to provision the first admin user');
    const { salt, hash } = hashPassword(INITIAL_PASSWORD);
    await sql`INSERT INTO admin_users(username,password_hash,password_salt,must_change_password) VALUES(${DEMO_USERNAME},${hash},${salt},false)`;
  }
}

export async function requireAdmin(req, res) {
  const sql = db();
  await ensureSchema(sql);
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) {
    send(res, { error: 'Non autenticato' }, 401);
    return null;
  }
  const tokenHash = hashSession(token);
  const rows = await sql`
    SELECT u.id,u.username,u.must_change_password,s.id AS session_id
    FROM admin_sessions s
    JOIN admin_users u ON u.id=s.user_id
    WHERE s.token_hash=${tokenHash} AND s.expires_at > now()
    LIMIT 1`;
  if (!rows.length) {
    clearCookie(res);
    send(res, { error: 'Sessione non valida o scaduta' }, 401);
    return null;
  }
  return { sql, user: rows[0], tokenHash };
}

export async function logout(req, res) {
  const sql = db();
  await ensureSchema(sql);
  const token = getCookie(req, SESSION_COOKIE);
  if (token) await sql`DELETE FROM admin_sessions WHERE token_hash=${hashSession(token)}`;
  clearCookie(res);
  return send(res, { ok: true });
}

export async function me(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  return send(res, { ok: true, username: ctx.user.username, must_change_password: ctx.user.must_change_password });
}

export async function changePassword(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const body = req.body || {};
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const userRows = await ctx.sql`SELECT password_hash,password_salt FROM admin_users WHERE id=${ctx.user.id} LIMIT 1`;
  const current = userRows[0];
  if (!current || !verifyPassword(currentPassword, current.password_salt, current.password_hash)) return send(res, { error: 'Password attuale non valida' }, 400);
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/.test(newPassword)) return send(res, { error: 'La password deve avere 8-64 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale' }, 400);
  const { salt, hash } = hashPassword(newPassword);
  await ctx.sql`UPDATE admin_users SET password_hash=${hash},password_salt=${salt},must_change_password=false,updated_at=now() WHERE id=${ctx.user.id}`;
  await ctx.sql`DELETE FROM admin_sessions WHERE user_id=${ctx.user.id}`;
  clearCookie(res);
  return send(res, { ok: true, loggedOut: true });
}

export { getCookie, SESSION_COOKIE, hashSession };