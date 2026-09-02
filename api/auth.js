import crypto from 'node:crypto';
import { db, send } from './_db.js';
import { logout, me, changePassword, ensureSchema, verifyPassword, hashPassword, SCRYPT_CURRENT_N, SCRYPT_LEGACY_N } from './_auth.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const MAX_RESET_ATTEMPTS = 5;
const RESET_TTL_MS = 30 * 60 * 1000;
const MAX_USERNAME_LENGTH = 160;
const MAX_LOGIN_PASSWORD_LENGTH = 128;
const MAX_RESET_TOKEN_LENGTH = 256;
const MAX_ACTIVATION_TOKEN_LENGTH = 256;

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase().slice(0, MAX_USERNAME_LENGTH);
}

function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || 'unknown')
    .split(',')[0].trim().slice(0, 100);
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function rateKey(username, ip) {
  return hashValue(`${username}|${ip}`);
}

function ipRateKey(ip) {
  return hashValue(`ip|${ip}`);
}

function resetRateKey(ip) {
  return hashValue(`password-reset|${ip}`);
}

async function isBlocked(sql, keys) {
  for (const key of keys) {
    const rows = await sql`SELECT attempts, window_started_at FROM auth_rate_limits WHERE rate_key=${key} LIMIT 1`;
    if (!rows.length) continue;
    const started = new Date(rows[0].window_started_at).getTime();
    if (Date.now() - started >= WINDOW_MS) {
      await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
      continue;
    }
    if (Number(rows[0].attempts) >= MAX_ATTEMPTS) return true;
  }
  return false;
}

async function registerFailure(sql, keys, maxAttempts = MAX_ATTEMPTS) {
  for (const key of keys) {
    await sql`INSERT INTO auth_rate_limits(rate_key, attempts, window_started_at)
      VALUES(${key}, 1, now())
      ON CONFLICT(rate_key) DO UPDATE SET
        attempts = CASE
          WHEN now() - auth_rate_limits.window_started_at >= interval '15 minutes' THEN 1
          ELSE LEAST(auth_rate_limits.attempts + 1, ${maxAttempts})
        END,
        window_started_at = CASE
          WHEN now() - auth_rate_limits.window_started_at >= interval '15 minutes' THEN now()
          ELSE auth_rate_limits.window_started_at
        END`;
  }
}

async function clearFailure(sql, keys) {
  for (const key of keys) await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
}

async function sendPasswordResetEmail({ token, to, firstName }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();
  const publicSiteUrl = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (!apiKey || !from || !to || !publicSiteUrl) return false;
  let baseUrl;
  try { baseUrl = new URL(publicSiteUrl); } catch { return false; }
  if (baseUrl.protocol !== 'https:') return false;
  const resetUrl = `${baseUrl.origin}/admin/login.html?token=${encodeURIComponent(token)}`;
  const safeName = String(firstName || '').replace(/[&<>\"]/g, '');
  const greeting = safeName ? `Ciao ${safeName},` : 'Buongiorno,';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Reimpostazione password | Bruniano',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10213b;max-width:600px;margin:auto"><h2>Reimpostazione password</h2><p>${greeting}</p><p>È stata richiesta una nuova password per il tuo account dell’area riservata Bruniano.</p><p>Il link è valido per 30 minuti e può essere utilizzato una sola volta.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#145cff;color:#fff;text-decoration:none;border-radius:8px">Reimposta password</a></p><p>Se non hai richiesto questa operazione, puoi ignorare questa email.</p></div>`,
    }),
  });
  return response.ok;
}

async function requestPasswordReset(sql, req, res) {
  const ip = clientIp(req);
  const key = resetRateKey(ip);
  const rows = await sql`SELECT attempts, window_started_at FROM auth_rate_limits WHERE rate_key=${key} LIMIT 1`;
  if (rows.length) {
    const started = new Date(rows[0].window_started_at).getTime();
    if (Date.now() - started >= WINDOW_MS) await sql`DELETE FROM auth_rate_limits WHERE rate_key=${key}`;
    else if (Number(rows[0].attempts) >= MAX_RESET_ATTEMPTS) return send(res, { ok: true, message: 'Se l’account è configurato per il recupero, riceverai un’email con le istruzioni.' });
  }
  await registerFailure(sql, [key], MAX_RESET_ATTEMPTS);
  const username = normalizeUsername(req.body?.username);
  const users = username ? await sql`SELECT id,username,email,first_name FROM admin_users WHERE (username=${username} OR lower(coalesce(email,''))=${username}) AND is_active=true LIMIT 1` : [];
  if (users.length && users[0].email) {
    const user = users[0];
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashValue(token);
    const expires = new Date(Date.now() + RESET_TTL_MS);
    await sql`DELETE FROM password_reset_tokens WHERE user_id=${user.id} AND used_at IS NULL`;
    await sql`INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES(${user.id},${tokenHash},${expires.toISOString()})`;
    const sent = await sendPasswordResetEmail({ token, to: user.email, firstName: user.first_name });
    if (!sent) await sql`DELETE FROM password_reset_tokens WHERE token_hash=${tokenHash}`;
  }
  return send(res, { ok: true, message: 'Se l’account è configurato per il recupero, riceverai un’email con le istruzioni.' });
}

function validPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/.test(value);
}

async function resetPassword(sql, req, res) {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  if (!token || token.length > MAX_RESET_TOKEN_LENGTH) return send(res, { error: 'Link di recupero non valido o scaduto' }, 400);
  if (newPassword !== confirmPassword) return send(res, { error: 'Le password non coincidono' }, 400);
  if (!validPassword(newPassword)) return send(res, { error: 'La password deve avere 8-64 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale' }, 400);
  const tokenHash = hashValue(token);
  const claimed = await sql`UPDATE password_reset_tokens SET used_at=now() WHERE token_hash=${tokenHash} AND used_at IS NULL AND expires_at > now() AND EXISTS (SELECT 1 FROM admin_users u WHERE u.id=password_reset_tokens.user_id AND u.is_active=true) RETURNING user_id`;
  if (!claimed.length) return send(res, { error: 'Link di recupero non valido o scaduto' }, 400);
  const userId = claimed[0].user_id;
  const { salt, hash } = hashPassword(newPassword);
  await sql`UPDATE admin_users SET password_hash=${hash},password_salt=${salt},password_scrypt_n=${SCRYPT_CURRENT_N},must_change_password=false,updated_at=now() WHERE id=${userId}`;
  await sql`DELETE FROM admin_sessions WHERE user_id=${userId}`;
  await sql`DELETE FROM password_reset_tokens WHERE user_id=${userId}`;
  await sql`DELETE FROM first_access_tokens WHERE user_id=${userId}`;
  return send(res, { ok: true });
}

async function activateAccount(sql, req, res) {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  if (!token || token.length > MAX_ACTIVATION_TOKEN_LENGTH) return send(res, { error: 'Link di attivazione non valido o scaduto' }, 400);
  if (newPassword !== confirmPassword) return send(res, { error: 'Le password non coincidono' }, 400);
  if (!validPassword(newPassword)) return send(res, { error: 'La password deve avere 8-64 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale' }, 400);
  const tokenHash = hashValue(token);
  const claimed = await sql`UPDATE first_access_tokens SET used_at=now() WHERE token_hash=${tokenHash} AND used_at IS NULL AND expires_at > now() RETURNING user_id`;
  if (!claimed.length) return send(res, { error: 'Link di attivazione non valido o scaduto' }, 400);
  const userId = claimed[0].user_id;
  const { salt, hash } = hashPassword(newPassword);
  await sql`UPDATE admin_users SET password_hash=${hash},password_salt=${salt},password_scrypt_n=${SCRYPT_CURRENT_N},must_change_password=false,is_active=true,updated_at=now() WHERE id=${userId}`;
  await sql`DELETE FROM admin_sessions WHERE user_id=${userId}`;
  await sql`DELETE FROM first_access_tokens WHERE user_id=${userId}`;
  return send(res, { ok: true });
}

export default async function handler(req, res) {
  try {
    const sql = db();
    await ensureSchema(sql);
    if (req.method === 'GET') return me(req, res);
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, { error: 'Method not allowed' }, 405); }
    const body = req.body || {};
    const action = String(body.action || '').trim();
    if (action === 'login') {
      const username = normalizeUsername(body.username);
      const password = String(body.password || '');
      if (password.length > MAX_LOGIN_PASSWORD_LENGTH) return send(res, { error: 'Username o password non corretti' }, 401);
      const ip = clientIp(req);
      const keys = [rateKey(username, ip), ipRateKey(ip)];
      if (await isBlocked(sql, keys)) return send(res, { error: 'Troppi tentativi. Riprova tra qualche minuto.' }, 429);
      const rows = await sql`SELECT id,username,password_hash,password_salt,password_scrypt_n,must_change_password,is_active FROM admin_users WHERE username=${username} OR lower(coalesce(email,''))=${username} LIMIT 1`;
      const user = rows[0];
      const hashN = Number(user?.password_scrypt_n) || SCRYPT_LEGACY_N;
      const valid = Boolean(user && user.is_active !== false && verifyPassword(password, user.password_salt, user.password_hash, hashN));
      if (!valid) { await registerFailure(sql, keys); return send(res, { error: 'Username o password non corretti' }, 401); }
      if (hashN < SCRYPT_CURRENT_N) {
        const { salt, hash } = hashPassword(password);
        await sql`UPDATE admin_users SET password_hash=${hash},password_salt=${salt},password_scrypt_n=${SCRYPT_CURRENT_N},updated_at=now() WHERE id=${user.id}`;
      }
      await clearFailure(sql, keys);
      await sql`DELETE FROM admin_sessions WHERE expires_at <= now()`;
      const token = crypto.randomBytes(32).toString('base64url');
      const tokenHash = hashValue(token);
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await sql`INSERT INTO admin_sessions(user_id,token_hash,expires_at) VALUES(${user.id},${tokenHash},${expires.toISOString()})`;
      res.setHeader('Set-Cookie', `__Host-bruniano_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
      return send(res, { ok: true, username: user.username, must_change_password: user.must_change_password });
    }
    if (action === 'request-password-reset') return requestPasswordReset(sql, req, res);
    if (action === 'reset-password') return resetPassword(sql, req, res);
    if (action === 'activate-account') return activateAccount(sql, req, res);
    if (action === 'logout') return logout(req, res);
    if (action === 'change-password') return changePassword(req, res);
    return send(res, { error: 'Azione non valida' }, 400);
  } catch (error) {
    console.error('Auth API error:', error);
    return send(res, { error: 'Errore di autenticazione' }, 500);
  }
}
