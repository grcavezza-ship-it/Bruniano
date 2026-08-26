import { createHash } from 'node:crypto';
import { db, send } from './_db.js';
import { clearSessionCookie, createSession, ensureInitialAdmin, hashPassword, requireAdmin, setSessionCookie, validPassword, verifyPassword } from './_auth.js';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown').split(',')[0].trim().slice(0, 100);
}

function rateKey(label, username, ip) {
  return createHash('sha256').update(`${label}|${username}|${ip}`).digest('hex');
}

async function blocked(sql, key) {
  const rows = await sql`SELECT attempts,window_started_at FROM auth_rate_limits WHERE rate_key=${key} LIMIT 1`;
  if (!rows.length) return false;
  const started = new Date(rows[0].window_started_at).getTime();
  if (Date.now() - started >= WINDOW_MINUTES * 60 * 1000) {
    await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
    return false;
  }
  return Number(rows[0].attempts) >= MAX_ATTEMPTS;
}

async function registerFailure(sql, key) {
  await sql`INSERT INTO auth_rate_limits(rate_key,attempts,window_started_at) VALUES(${key},1,now()) ON CONFLICT(rate_key) DO UPDATE SET attempts=CASE WHEN now()-auth_rate_limits.window_started_at >= make_interval(mins => ${WINDOW_MINUTES}) THEN 1 ELSE auth_rate_limits.attempts+1 END, window_started_at=CASE WHEN now()-auth_rate_limits.window_started_at >= make_interval(mins => ${WINDOW_MINUTES}) THEN now() ELSE auth_rate_limits.window_started_at END`;
}

async function clearFailures(sql, keys) {
  if (keys.length) await sql`DELETE FROM auth_rate_limits WHERE rate_key = ANY(${keys})`;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    await ensureInitialAdmin(sql);

    if (req.method === 'GET') {
      const user = await requireAdmin(req, res, sql);
      if (!user) return;
      return send(res, { authenticated: true, username: user.username, mustChangePassword: user.must_change_password });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = String(body.action || '').trim();

      if (action === 'login') {
        const username = normalizeUsername(body.username);
        const password = String(body.password || '');
        const ip = clientIp(req);
        const accountKey = rateKey('account', username, 'account');
        const ipKey = rateKey('ip', username, ip);
        if (await blocked(sql, accountKey) || await blocked(sql, ipKey)) return send(res, { error: 'Troppi tentativi. Riprova tra qualche minuto.' }, 429);
        const rows = await sql`SELECT id,username,password_hash,must_change_password FROM admin_users WHERE username=${username} LIMIT 1`;
        const valid = rows.length ? await verifyPassword(password, rows[0].password_hash) : false;
        if (!valid) {
          await registerFailure(sql, accountKey);
          await registerFailure(sql, ipKey);
          return send(res, { error: 'Username o password non corretti' }, 401);
        }
        await clearFailures(sql, [accountKey, ipKey]);
        await sql`UPDATE admin_users SET last_login_at=now() WHERE id=${rows[0].id}`;
        setSessionCookie(res, createSession(rows[0].id, rows[0].username));
        return send(res, { ok: true, username: rows[0].username, mustChangePassword: rows[0].must_change_password });
      }

      if (action === 'logout') {
        clearSessionCookie(res);
        return send(res, { ok: true });
      }

      if (action === 'change-password') {
        const user = await requireAdmin(req, res, sql);
        if (!user) return;
        const currentPassword = String(body.currentPassword || '');
        const newPassword = String(body.newPassword || '');
        const rows = await sql`SELECT password_hash FROM admin_users WHERE id=${user.id} LIMIT 1`;
        if (!rows.length || !(await verifyPassword(currentPassword, rows[0].password_hash))) return send(res, { error: 'Password attuale non corretta' }, 400);
        if (!validPassword(newPassword)) return send(res, { error: 'La nuova password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale' }, 400);
        const passwordHash = await hashPassword(newPassword);
        await sql`UPDATE admin_users SET password_hash=${passwordHash},must_change_password=false,updated_at=now() WHERE id=${user.id}`;
        clearSessionCookie(res);
        return send(res, { ok: true, mustRelogin: true });
      }
    }

    res.setHeader('Allow', 'GET,POST');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Auth API error:', error);
    return send(res, { error: 'Errore di autenticazione' }, 500);
  }
}
