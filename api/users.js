import crypto from 'node:crypto';
import { db, send } from './_db.js';
import { requireAdmin, hashPassword, SCRYPT_CURRENT_N } from './_auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = value => String(value ?? '').trim();
const normalizeEmail = value => clean(value).toLowerCase();
const FIRST_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function serialize(row) {
  return {
    id: row.id,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email: row.email || '',
    username: row.username,
    is_active: row.is_active !== false,
    must_change_password: row.must_change_password === true,
    created_at: row.created_at,
    last_login_at: row.last_login_at || null,
  };
}

function publicSiteUrl() {
  return String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
}

async function sendActivationEmail({ to, firstName, token }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();
  const baseUrl = publicSiteUrl();
  if (!apiKey || !from || !baseUrl) return false;
  let site;
  try { site = new URL(baseUrl); } catch { return false; }
  if (site.protocol !== 'https:') return false;
  const activationUrl = `${site.origin}/admin/login.html?activate=${encodeURIComponent(token)}`;
  const safeName = String(firstName || '').replace(/[&<>\"]/g, '');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Attiva il tuo accesso | Bruniano',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10213b;max-width:600px;margin:auto"><h2>Attiva il tuo accesso Bruniano</h2><p>Ciao ${safeName},</p><p>È stato creato per te un account operatore per l’area riservata Bruniano.</p><p>Per completare il primo accesso, imposta personalmente la tua password usando il pulsante qui sotto.</p><p><a href="${activationUrl}" style="display:inline-block;padding:12px 18px;background:#145cff;color:#fff;text-decoration:none;border-radius:8px">Attiva account</a></p><p>Il link è valido 24 ore e può essere utilizzato una sola volta.</p><p>Se non riconosci questa richiesta, ignora questa email.</p></div>`,
    }),
  });
  return response.ok;
}

async function createFirstAccessToken(sql, user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashValue(token);
  const expires = new Date(Date.now() + FIRST_ACCESS_TTL_MS);
  await sql`DELETE FROM first_access_tokens WHERE user_id=${user.id} AND used_at IS NULL`;
  await sql`INSERT INTO first_access_tokens(user_id,token_hash,expires_at) VALUES(${user.id},${tokenHash},${expires.toISOString()})`;
  return token;
}

async function sendInviteForUser(sql, user) {
  if (!user.email || user.username === 'admin') return { sent: false, reason: 'L’account amministratore principale non usa l’attivazione via email.' };
  const token = await createFirstAccessToken(sql, user);
  const sent = await sendActivationEmail({ to: user.email, firstName: user.first_name, token });
  if (!sent) {
    await sql`DELETE FROM first_access_tokens WHERE token_hash=${hashValue(token)}`;
    return { sent: false, reason: 'Email non inviata: verifica la configurazione Resend e MAIL_FROM.' };
  }
  return { sent: true };
}

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  try {
    if (req.method === 'GET') {
      const rows = await ctx.sql`SELECT id,first_name,last_name,email,username,is_active,must_change_password,created_at,last_login_at FROM admin_users ORDER BY is_active DESC, lower(coalesce(last_name,'')), lower(coalesce(first_name,'')), created_at ASC`;
      return send(res, { items: rows.map(serialize) });
    }

    if (req.method === 'POST') {
      const action = clean(req.body?.action);
      if (action === 'resend-invite') {
        const id = clean(req.body?.id);
        if (!id) return send(res, { error: 'Utente non valido.' }, 400);
        const rows = await ctx.sql`SELECT id,first_name,last_name,email,username,is_active,must_change_password,created_at,last_login_at FROM admin_users WHERE id=${id} LIMIT 1`;
        if (!rows.length) return send(res, { error: 'Utente non trovato.' }, 404);
        const user = rows[0];
        if (user.username === 'admin') return send(res, { error: 'L’account amministratore principale non usa il primo accesso via email.' }, 400);
        if (!user.email) return send(res, { error: 'L’utente non ha un indirizzo email.' }, 400);
        await ctx.sql`DELETE FROM admin_sessions WHERE user_id=${id}`;
        await ctx.sql`UPDATE admin_users SET is_active=false,must_change_password=true,updated_at=now() WHERE id=${id}`;
        const result = await sendInviteForUser(ctx.sql, { ...user, is_active: false, must_change_password: true });
        if (!result.sent) {
          await ctx.sql`UPDATE admin_users SET is_active=${user.is_active !== false},updated_at=now() WHERE id=${id}`;
          return send(res, { error: result.reason }, 502);
        }
        return send(res, { ok: true, message: 'Nuovo invito inviato.' });
      }

      const firstName = clean(req.body?.first_name);
      const lastName = clean(req.body?.last_name);
      const email = normalizeEmail(req.body?.email);
      if (!firstName || !lastName || !EMAIL_RE.test(email)) return send(res, { error: 'Inserisci nome, cognome e un indirizzo email valido.' }, 400);

      const existing = await ctx.sql`SELECT id FROM admin_users WHERE lower(coalesce(email,''))=${email} OR lower(username)=${email} LIMIT 1`;
      if (existing.length) return send(res, { error: 'Esiste già un utente con questa email.' }, 409);

      const unusablePassword = crypto.randomBytes(24).toString('base64url');
      const { salt, hash } = hashPassword(unusablePassword);
      const rows = await ctx.sql`INSERT INTO admin_users(first_name,last_name,email,username,password_hash,password_salt,password_scrypt_n,must_change_password,is_active) VALUES(${firstName},${lastName},${email},${email},${hash},${salt},${SCRYPT_CURRENT_N},true,false) RETURNING id,first_name,last_name,email,username,is_active,must_change_password,created_at,last_login_at`;
      const user = rows[0];
      const result = await sendInviteForUser(ctx.sql, user);
      if (!result.sent) return send(res, { error: `Utente creato ma invito non inviato. ${result.reason}` }, 502);
      return send(res, { item: serialize(user), invited: true }, 201);
    }

    if (req.method === 'PUT') {
      const id = clean(req.body?.id);
      const firstName = clean(req.body?.first_name);
      const lastName = clean(req.body?.last_name);
      const email = normalizeEmail(req.body?.email);
      const isActive = req.body?.is_active !== false;
      if (!id || !firstName || !lastName || !EMAIL_RE.test(email)) return send(res, { error: 'Dati utente non validi.' }, 400);

      const currentRows = await ctx.sql`SELECT id,username,email,is_active,must_change_password FROM admin_users WHERE id=${id} LIMIT 1`;
      if (!currentRows.length) return send(res, { error: 'Utente non trovato.' }, 404);
      const current = currentRows[0];
      const duplicate = await ctx.sql`SELECT id FROM admin_users WHERE id<>${id} AND (lower(coalesce(email,''))=${email} OR lower(username)=${email}) LIMIT 1`;
      if (duplicate.length) return send(res, { error: 'Esiste già un utente con questa email.' }, 409);

      const rows = await ctx.sql`UPDATE admin_users SET first_name=${firstName},last_name=${lastName},email=${email},username=${current.username === 'admin' ? 'admin' : email},is_active=${isActive},updated_at=now() WHERE id=${id} RETURNING id,first_name,last_name,email,username,is_active,must_change_password,created_at,last_login_at`;
      if (!isActive) await ctx.sql`DELETE FROM admin_sessions WHERE user_id=${id}`;
      return send(res, { item: serialize(rows[0]) });
    }

    if (req.method === 'DELETE') {
      const id = clean(req.body?.id);
      if (!id) return send(res, { error: 'Utente non valido.' }, 400);
      if (id === ctx.user.id) return send(res, { error: 'Non puoi cancellare l’utente con cui sei collegato.' }, 400);
      const targetRows = await ctx.sql`SELECT id,username FROM admin_users WHERE id=${id} LIMIT 1`;
      if (!targetRows.length) return send(res, { error: 'Utente non trovato.' }, 404);
      if (targetRows[0].username === 'admin') return send(res, { error: 'L’account amministratore principale non può essere cancellato.' }, 400);
      await ctx.sql`DELETE FROM admin_users WHERE id=${id}`;
      return send(res, { ok: true, message: 'Operatore cancellato definitivamente.' });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Users API error:', error);
    return send(res, { error: 'Errore nella gestione degli utenti.' }, 500);
  }
}
