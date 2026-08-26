import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const admin = getQuery(req).admin === '1';
      if (admin && !(await requireAdmin(req, res))) return;
      const rows = admin
        ? await sql`SELECT id,title,media_type,media_url,alt_text,sort_order,is_published,created_at FROM gallery_items ORDER BY sort_order ASC,created_at ASC`
        : await sql`SELECT id,title,media_type,media_url,alt_text,sort_order,is_published,created_at FROM gallery_items WHERE is_published=true ORDER BY sort_order ASC,created_at ASC`;
      return send(res, { items: rows });
    }

    if (!(await requireAdmin(req, res))) return;
    const body = req.body || {};
    if (req.method === 'POST' || req.method === 'PUT') {
      const id = body.id || null;
      const title = String(body.title || '').trim();
      const mediaType = String(body.media_type || 'image').trim();
      const mediaUrl = String(body.media_url || '').trim();
      const altText = String(body.alt_text || title).trim();
      const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
      const isPublished = Boolean(body.is_published);
      if (!mediaUrl) return send(res, { error: 'URL media obbligatorio' }, 400);
      if (!['image','video'].includes(mediaType)) return send(res, { error: 'Tipo media non valido' }, 400);
      if (mediaUrl.length > 2048) return send(res, { error: 'URL media troppo lungo' }, 400);
      if (id) {
        const rows = await sql`UPDATE gallery_items SET title=${title},media_type=${mediaType},media_url=${mediaUrl},alt_text=${altText},sort_order=${sortOrder},is_published=${isPublished} WHERE id=${id} RETURNING *`;
        return rows[0] ? send(res, rows[0]) : send(res, { error: 'Media non trovato' }, 404);
      }
      const rows = await sql`INSERT INTO gallery_items(title,media_type,media_url,alt_text,sort_order,is_published) VALUES(${title},${mediaType},${mediaUrl},${altText},${sortOrder},${isPublished}) RETURNING *`;
      return send(res, rows[0], 201);
    }
    if (req.method === 'DELETE') {
      if (!body.id) return send(res, { error: 'ID obbligatorio' }, 400);
      await sql`DELETE FROM gallery_items WHERE id=${body.id}`;
      return send(res, { ok: true });
    }
    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Gallery API error:', error);
    return send(res, { error: error?.message || 'Errore nella gestione della galleria' }, 500);
  }
}
