import crypto from 'node:crypto';
import { db, send } from './_db.js';
import { logout, me, changePassword, ensureSchema, hashPassword, verifyPassword } from './_auth.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown')
    .split(',')[0].trim().slice(0, 100);
}

function rateKey(username, ip) {
  return crypto.createHash('sha256').update(`${username}|${ip}`).digest('hex');
}

async function isBlocked(sql, key) {
  const rows = await sql`SELECT attempts, window_started_at FROM auth_rate_limits WHERE rate_key=${key} LIMIT 1`;
  if (!rows.length) return false;
  const started = new Date(rows[0].window_started_at).getTime();
  if (Date.now() - started >= WINDOW_MS) {
    await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
    return false;
  }
  return Number(rows[0].attempts) >= MAX_ATTEMPTS;
}

async function registerFailure(sql, key) {
  await sql`INSERT INTO auth_rate_limits(rate_key, attempts, window_started_at)
    VALUES(${key}, 1, now())
    ON CONFLICT(rate_key) DO UPDATE SET
      attempts = CASE
        WHEN now() - auth_rate_limits.window_started_at >= interval '15 minutes' THEN 1
        ELSE auth_rate_limits.attempts + 1
      END,
      window_started_at = CASE
        WHEN now() - auth_rate_limits.window_started_at >= interval '15 minutes' THEN now()
        ELSE auth_rate_limits.window_started_at
      END`;
}

async function clearFailure(sql, key) {
  await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    await ensureSchema(sql);

    if (req.method === 'GET') {
      return me(req, res);
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return send(res, { error: 'Method not allowed' }, 405);
    }

    const body = req.body || {};
    const action = String(body.action || '').trim();

    if (action === 'login') {
      const username = normalizeUsername(body.username);
      const password = String(body.password || '');
      const key = rateKey(username, clientIp(req));

      if (await isBlocked(sql, key)) {
        return send(res, { error: 'Troppi tentativi. Riprova tra qualche minuto.' }, 429);
      }

      const rows = await sql`SELECT id, username, password_hash, password_salt, must_change_password
        FROM admin_users WHERE username=${username} LIMIT 1`;
      const user = rows[0];
      const valid = Boolean(user && verifyPassword(password, user.password_salt, user.password_hash));

      if (!valid) {
        await registerFailure(sql, key);
        return send(res, { error: 'Username o password non corretti' }, 401);
      }

      await clearFailure(sql, key);
      await sql`DELETE FROM admin_sessions WHERE expires_at <= now()`;
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await sql`INSERT INTO admin_sessions(user_id, token_hash, expires_at)
        VALUES(${user.id}, ${tokenHash}, ${expires.toISOString()})`;
      res.setHeader('Set-Cookie', `__Host-bruniano_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
      return send(res, { ok: true, username: user.username, mustChangePassword: user.must_change_password });
    }

    if (action === 'logout') return logout(req, res);
    if (action === 'change-password') return changePassword(req, res);

    return send(res, { error: 'Azione non valida' }, 400);
  } catch (error) {
    console.error('Auth API error:', error);
    return send(res, { error: 'Errore di autenticazione' }, 500);
  }
}
