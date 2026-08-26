import { db, json } from './_db.js';

const slugify = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || crypto.randomUUID();

export default async function handler(req) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const slug = url.searchParams.get('slug');
      const includeDrafts = url.searchParams.get('admin') === '1';
      if (slug) {
        const rows = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
        return rows[0] ? json(rows[0]) : json({ error: 'Not found' }, 404);
      }
      const rows = includeDrafts
        ? await sql`SELECT * FROM blog_posts ORDER BY COALESCE(published_at, created_at) DESC`
        : await sql`SELECT id, slug, title, excerpt, cover_image_url, category, author, published_at FROM blog_posts WHERE is_published = true ORDER BY COALESCE(published_at, created_at) DESC`;
      return json({ items: rows });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!title || !content) return json({ error: 'Titolo e contenuto sono obbligatori' }, 400);
      const slug = slugify(body.slug || title);
      const rows = await sql`
        INSERT INTO blog_posts
          (slug, title, excerpt, content, cover_image_url, category, meta_description, author, published_at, is_published)
        VALUES
          (${slug}, ${title}, ${body.excerpt || null}, ${content}, ${body.cover_image_url || null}, ${body.category || null}, ${body.meta_description || null}, ${body.author || null}, ${body.published_at || null}, ${Boolean(body.is_published)})
        RETURNING *
      `;
      return json(rows[0], 201);
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const id = body.id;
      if (!id) return json({ error: 'ID mancante' }, 400);
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!title || !content) return json({ error: 'Titolo e contenuto sono obbligatori' }, 400);
      const slug = slugify(body.slug || title);
      const rows = await sql`
        UPDATE blog_posts
        SET slug = ${slug}, title = ${title}, excerpt = ${body.excerpt || null}, content = ${content},
            cover_image_url = ${body.cover_image_url || null}, category = ${body.category || null},
            meta_description = ${body.meta_description || null}, author = ${body.author || null},
            published_at = ${body.published_at || null}, is_published = ${Boolean(body.is_published)},
            updated_at = now()
        WHERE id = ${id}
        RETURNING *
      `;
      return rows[0] ? json(rows[0]) : json({ error: 'Not found' }, 404);
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      if (!body.id) return json({ error: 'ID mancante' }, 400);
      const rows = await sql`DELETE FROM blog_posts WHERE id = ${body.id} RETURNING id`;
      return rows[0] ? json({ ok: true }) : json({ error: 'Not found' }, 404);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error.message || 'Internal server error' }, 500);
  }
}
