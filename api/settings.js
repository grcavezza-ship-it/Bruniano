import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

const PUBLIC_KEYS = new Set(['home_hero_image']);

function validateImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.length > 2048) throw new Error('Immagine non valida');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Immagine non valida'); }
  if (parsed.protocol !== 'https:') throw new Error('Immagine non valida');
  if (parsed.hostname !== 'res.cloudinary.com' || parsed.pathname.split('/').filter(Boolean)[0] !== 'pomzhih4') {
    throw new Error('Immagine non valida');
  }
  return parsed.toString();
}

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const { key } = getQuery(req);
      const requested = key && PUBLIC_KEYS.has(key) ? [key] : [...PUBLIC_KEYS];
      const rows = await sql`SELECT key,value,updated_at FROM site_settings WHERE key = ANY(${requested})`;
      return send(res, { items: Object.fromEntries(rows.map(row => [row.key, row.value])) });
    }

    if (!(await requireAdmin(req, res))) return;
    const body = req.body || {};
    if (req.method === 'PUT') {
      const key = String(body.key || '').trim();
      if (!PUBLIC_KEYS.has(key)) return send(res, { error: 'Impostazione non disponibile' }, 400);
      const value = key === 'home_hero_image' ? validateImageUrl(body.value) : String(body.value || '').trim();
      const rows = await sql`
        INSERT INTO site_settings (key,value,updated_at)
        VALUES (${key},${value},now())
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()
        RETURNING key,value,updated_at`;
      return send(res, rows[0]);
    }

    res.setHeader('Allow', 'GET,PUT');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    return send(res, { error: error?.message || 'Errore impostazioni' }, 400);
  }
}
