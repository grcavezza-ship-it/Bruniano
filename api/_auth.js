import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const COOKIE = '__Host-bruniano_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 3;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters');
  return value;
}

function b64url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

function sign(value) {
  return b64url(createHmac('sha256', secret()).update(value).digest());
}

export function validPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z\d]/.test(password);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, n, r, p, salt64, hash64] = String(encoded || '').split('$');
    if (algorithm !== 'scrypt') return false;
    const expected = Buffer.from(hash64, 'base64url');
    const actual = Buffer.from(await scrypt(password, Buffer.from(salt64, 'base64url'), expected.length, { N: Number(n), r: Number(r), p: Number(p) }));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  return Object.fromEntries(raw.split(';').map(v => v.trim()).filter(Boolean).map(pair => {
    const i = pair.indexOf('=');
    return i < 0 ? [pair, ''] : [pair.slice(0, i), decodeURIComponent(pair.slice(i + 1))];
  }));
}

export function createSession(userId, username) {
  const payload = b64url(JSON.stringify({ sub: userId, username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, iat: Math.floor(Date.now() / 1000) }));
  return `${payload}.${sign(payload)}`;
}

export function readSession(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.sub || !data.exp || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

export async function requireAdmin(req, res, sql) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Autenticazione richiesta' });
    return null;
  }
  const rows = await sql`SELECT id, username, must_change_password FROM admin_users WHERE id=${session.sub} LIMIT 1`;
  if (!rows.length) {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Sessione non valida' });
    return null;
  }
  return rows[0];
}

export async function ensureInitialAdmin(sql) {
  const existing = await sql`SELECT id FROM admin_users LIMIT 1`;
  if (existing.length) return;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!initialPassword) throw new Error('ADMIN_INITIAL_PASSWORD is not configured');
  const passwordHash = await hashPassword(initialPassword);
  await sql`INSERT INTO admin_users(username,password_hash,must_change_password) VALUES('admin',${passwordHash},true) ON CONFLICT (username) DO NOTHING`;
}

export { COOKIE };
