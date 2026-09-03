import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

const ALLOWED_TYPES = new Set(['image','video']);
const MAX_TITLE_LENGTH = 200;
const MAX_ALT_LENGTH = 300;
const MAX_URL_LENGTH = 2048;
const MAX_STUDIO_SLOT = 4;

class ValidationError extends Error {}

function validateHttpsUrl(value) {
  const url = String(value || '').trim();
  if (!url) throw new ValidationError('Media obbligatorio');
  if (url.length > MAX_URL_LENGTH) throw new ValidationError('Media non valido');
  let parsed;
  try { parsed = new URL(url); } catch { throw new ValidationError('Media non valido'); }
  if (parsed.protocol !== 'https:') throw new ValidationError('Media non valido');
  return parsed.toString();
}

function normalizeSlot(value) {
  if (value === null || value === undefined || value === '' || Number(value) === 0) return null;
  const slot = Number(value);
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_STUDIO_SLOT) throw new ValidationError('Posizione non valida');
  return slot;
}

async function saveStudioSlot(sql, id, slot) {
  if (!id) return;
  if (slot !== null) {
    await sql`UPDATE gallery_items SET studio_slot=NULL WHERE studio_slot=${slot} AND id<>${id}`;
  }
}

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const admin = getQuery(req).admin === '1';
      if (admin && !(await requireAdmin(req, res))) return;
      const rows = admin
        ? await sql`SELECT id,title,media_type,media_url,alt_text,sort_order,studio_slot,is_published,created_at FROM gallery_items ORDER BY COALESCE(studio_slot,99) ASC, sort_order ASC,created_at ASC`
        : await sql`SELECT id,title,media_type,media_url,alt_text,sort_order,studio_slot,is_published,created_at FROM gallery_items WHERE is_published=true ORDER BY COALESCE(studio_slot,99) ASC, sort_order ASC,created_at ASC`;
      return send(res, { items: rows });
    }

    if (!(await requireAdmin(req, res))) return;
    const body = req.body || {};
    if (req.method === 'POST' || req.method === 'PUT') {
      const id = body.id || null;
      const title = String(body.title || '').trim();
      const mediaType = String(body.media_type || 'image').trim().toLowerCase();
      const mediaUrl = validateHttpsUrl(body.media_url);
      const altText = String(body.alt_text || title).trim();
      const sortOrder = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 0;
      const studioSlot = normalizeSlot(body.studio_slot);
      const isPublished = Boolean(body.is_published);
      if (!ALLOWED_TYPES.has(mediaType)) return send(res, { error: 'Tipo media non valido' }, 400);
      if (title.length > MAX_TITLE_LENGTH || altText.length > MAX_ALT_LENGTH) return send(res, { error: 'Dati media troppo lunghi' }, 400);
      await saveStudioSlot(sql, id || '00000000-0000-0000-0000-000000000000', studioSlot);
      if (id) {
        const rows = await sql`UPDATE gallery_items SET title=${title},media_type=${mediaType},media_url=${mediaUrl},alt_text=${altText},sort_order=${sortOrder},studio_slot=${studioSlot},is_published=${isPublished} WHERE id=${id} RETURNING *`;
        return rows[0] ? send(res, rows[0]) : send(res, { error: 'Media non trovato' }, 404);
      }
      const rows = await sql`INSERT INTO gallery_items(title,media_type,media_url,alt_text,sort_order,studio_slot,is_published) VALUES(${title},${mediaType},${mediaUrl},${altText},${sortOrder},${studioSlot},${isPublished}) RETURNING *`;
      return send(res, rows[0], 201);
    }

    if (req.method === 'DELETE') {
      if (!body.id) return send(res, { error: 'ID obbligatorio' }, 400);
      const rows = await sql`DELETE FROM gallery_items WHERE id=${body.id} RETURNING id`;
      return rows[0] ? send(res, { ok: true }) : send(res, { error: 'Media non trovato' }, 404);
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Gallery API error:', error);
    if (error instanceof ValidationError) return send(res, { error: error.message }, 400);
    return send(res, { error: 'Errore nella gestione della galleria' }, 500);
  }
}