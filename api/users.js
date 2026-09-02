import crypto from 'node:crypto';
import { db, send } from './_db.js';
import { requireAdmin, hashPassword, SCRYPT_CURRENT_N } from './_auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = value => String(value ?? '').trim();
const normalizeEmail = value => clean(value).toLowerCase();

function temporaryPassword() {
  return `${crypto.randomBytes(9).toString('base64url')}A1!`;
}

function serialize(row, includeCredential = false) {
  const item = {
    id: row.id,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email: row.email || '',
    username: row.username,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    last_login_at: row.last_login_at || null,
  };
  if (includeCredential) item.temporary_password = row.temporary_password;
  return item;
}

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  try {
    if (req.method === 'GET') {
      const rows = await ctx.sql`SELECT id,first_name,last_name,email,username,is_active,created_at,last_login_at FROM admin_users ORDER BY is_active DESC, lower(coalesce(last_name,'')), lower(coalesce(first_name,'')), created_at ASC`;
      return send(res, { items: rows.map(row => serialize(row)) });
    }

    if (req.method === 'POST') {
      const firstName = clean(req.body?.first_name);
      const lastName = clean(req.body?.last_name);
      const email = normalizeEmail(req.body?.email);
      if (!firstName || !lastName || !EMAIL_RE.test(email)) return send(res, { error: 'Inserisci nome, cognome e un indirizzo email valido.' }, 400);

      const existing = await ctx.sql`SELECT id FROM admin_users WHERE lower(coalesce(email,''))=${email} OR lower(username)=${email} LIMIT 1`;
      if (existing.length) return send(res, { error: 'Esiste già un utente con questa email.' }, 409);

      const password = temporaryPassword();
      const { salt, hash } = hashPassword(password);
      const rows = await ctx.sql`INSERT INTO admin_users(first_name,last_name,email,username,password_hash,password_salt,password_scrypt_n,must_change_password,is_active) VALUES(${firstName},${lastName},${email},${email},${hash},${salt},${SCRYPT_CURRENT_N},true,true) RETURNING id,first_name,last_name,email,username,is_active,created_at,last_login_at`;
      return send(res, { item: serialize({ ...rows[0], temporary_password: password }, true) }, 201);
    }

    if (req.method === 'PUT') {
      const id = clean(req.body?.id);
      const firstName = clean(req.body?.first_name);
      const lastName = clean(req.body?.last_name);
      const email = normalizeEmail(req.body?.email);
      const isActive = req.body?.is_active !== false;
      if (!id || !firstName || !lastName || !EMAIL_RE.test(email)) return send(res, { error: 'Dati utente non validi.' }, 400);

      const duplicate = await ctx.sql`SELECT id FROM admin_users WHERE id<>${id} AND (lower(coalesce(email,''))=${email} OR lower(username)=${email}) LIMIT 1`;
      if (duplicate.length) return send(res, { error: 'Esiste già un utente con questa email.' }, 409);

      const rows = await ctx.sql`UPDATE admin_users SET first_name=${firstName},last_name=${lastName},email=${email},username=${email},is_active=${isActive},updated_at=now() WHERE id=${id} RETURNING id,first_name,last_name,email,username,is_active,created_at,last_login_at`;
      if (!rows.length) return send(res, { error: 'Utente non trovato.' }, 404);
      if (!isActive) await ctx.sql`DELETE FROM admin_sessions WHERE user_id=${id}`;
      return send(res, { item: serialize(rows[0]) });
    }

    if (req.method === 'DELETE') {
      const id = clean(req.body?.id);
      if (!id) return send(res, { error: 'Utente non valido.' }, 400);
      if (id === ctx.user.id) return send(res, { error: 'Non puoi disattivare l’utente con cui sei collegato.' }, 400);
      const rows = await ctx.sql`UPDATE admin_users SET is_active=false,updated_at=now() WHERE id=${id} RETURNING id`;
      if (!rows.length) return send(res, { error: 'Utente non trovato.' }, 404);
      await ctx.sql`DELETE FROM admin_sessions WHERE user_id=${id}`;
      return send(res, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Users API error:', error);
    return send(res, { error: 'Errore nella gestione degli utenti.' }, 500);
  }
}
