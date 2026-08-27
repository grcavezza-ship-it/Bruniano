import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

const slugify = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || crypto.randomUUID();

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const { slug, admin } = getQuery(req);
      if (admin === '1' && !(await requireAdmin(req, res))) return;
      if (slug) {
        const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
        if (!rows[0]) return send(res, { error: 'Not found' }, 404);
        if (rows[0].is_published !== true && admin !== '1') return send(res, { error: 'Not found' }, 404);
        return send(res, rows[0]);
      }
      const rows = admin === '1'
        ? await sql`SELECT * FROM blog_posts ORDER BY COALESCE(published_at, created_at) DESC`
        : await sql`SELECT id,slug,title,excerpt,cover_image_url,category,author,published_at FROM blog_posts WHERE is_published=true ORDER BY COALESCE(published_at,created_at) DESC`;
      return send(res, { items: rows });
    }

    if (!(await requireAdmin(req, res))) return;
    const body = req.body || {};

    if (req.method === 'POST') {
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!title || !content) return send(res, { error: 'Titolo e contenuto sono obbligatori' }, 400);
      const slug = slugify(body.slug || title);
      const rows = await sql`
        INSERT INTO blog_posts (slug,title,excerpt,content,cover_image_url,category,meta_description,author,published_at,is_published)
        VALUES (${slug},${title},${body.excerpt || null},${content},${body.cover_image_url || null},${body.category || null},${body.meta_description || null},${body.author || null},${body.published_at || null},${Boolean(body.is_published)})
        RETURNING *`;
      return send(res, rows[0], 201);
    }

    if (req.method === 'PUT') {
      const id = body.id;
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!id) return send(res, { error: 'ID mancante' }, 400);
      if (!title || !content) return send(res, { error: 'Titolo e contenuto sono obbligatori' }, 400);
      const rows = await sql`
        UPDATE blog_posts
        SET slug=${slugify(body.slug || title)},title=${title},excerpt=${body.excerpt || null},content=${content},cover_image_url=${body.cover_image_url || null},category=${body.category || null},meta_description=${body.meta_description || null},author=${body.author || null},published_at=${body.published_at || null},is_published=${Boolean(body.is_published)},updated_at=now()
        WHERE id=${id}
        RETURNING *`;
      return rows[0] ? send(res, rows[0]) : send(res, { error: 'Not found' }, 404);
    }

    if (req.method === 'DELETE') {
      if (!body.id) return send(res, { error: 'ID mancante' }, 400);
      const rows = await sql`DELETE FROM blog_posts WHERE id=${body.id} RETURNING id`;
      return rows[0] ? send(res, { ok: true }) : send(res, { error: 'Not found' }, 404);
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Blog API error:', error);
    return send(res, { error: 'Internal server error' }, 500);
  }
}
