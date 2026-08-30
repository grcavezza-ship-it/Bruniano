import crypto from 'node:crypto';
import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

const MAX_TITLE_LENGTH = 200;
const MAX_EXCERPT_LENGTH = 1000;
const MAX_CONTENT_LENGTH = 200000;
const MAX_COVER_URL_LENGTH = 2048;
const MAX_CATEGORY_LENGTH = 300;
const MAX_META_LENGTH = 320;
const MAX_AUTHOR_LENGTH = 200;
const ALLOWED_CONTENT_TAGS = new Set(['p','br','strong','em','b','i','u','s','ul','ol','li','blockquote','h2','h3','h4','a']);
const ALLOWED_GLOBAL_ATTRIBUTES = new Set(['href','title','target','rel']);

const slugify = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || crypto.randomUUID();

function validateHttpsUrl(value, field) {
  const url = String(value || '').trim();
  if (!url) return null;
  if (url.length > 2048) throw new Error(`${field} troppo lungo`);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error(`${field} deve usare HTTPS`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('deve usare HTTPS')) throw error;
    throw new Error(`${field} non valido`);
  }
  return url;
}

function sanitizeContent(value) {
  const source = String(value || '').trim();
  if (source.length > MAX_CONTENT_LENGTH) throw new Error('Contenuto troppo lungo');

  const withoutDangerousBlocks = source
    .replace(/<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|option|svg|math|link|meta|base)[^>]*>/gi, '')
    .replace(/<!--(?:[\s\S]*?)-->/g, '');

  return withoutDangerousBlocks.replace(/<([a-z0-9]+)(\s[^>]*)?>/gi, (full, rawTag, rawAttributes = '') => {
    const tag = String(rawTag).toLowerCase();
    if (!ALLOWED_CONTENT_TAGS.has(tag)) return '';
    if (!rawAttributes) return `<${tag}>`;

    const attributes = [];
    const matcher = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const match of rawAttributes.matchAll(matcher)) {
      const name = String(match[1]).toLowerCase();
      if (!ALLOWED_GLOBAL_ATTRIBUTES.has(name)) continue;
      const rawValue = String(match[2] ?? match[3] ?? match[4] ?? '');
      if (name === 'href') {
        try {
          const url = new URL(rawValue);
          if (url.protocol !== 'https:') continue;
          attributes.push(`href="${escapeAttribute(url.toString())}"`);
        } catch {
          continue;
        }
      } else if (name === 'target') {
        if (rawValue === '_blank') attributes.push('target="_blank"');
      } else if (name === 'rel') {
        attributes.push(`rel="${escapeAttribute(rawValue.replace(/[^a-zA-Z0-9 _-]/g, ''))}"`);
      } else if (name === 'title') {
        attributes.push(`title="${escapeAttribute(rawValue.slice(0, 300))}"`);
      }
    }
    return attributes.length ? `<${tag} ${attributes.join(' ')}>` : `<${tag}>`;
  }).replace(/<\/?[a-z0-9]+\s*javascript:[^>]*>/gi, '');
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preparePost(body) {
  const title = String(body.title || '').trim();
  const content = sanitizeContent(body.content);
  if (!title || !content) throw new Error('Titolo e contenuto sono obbligatori');
  if (title.length > MAX_TITLE_LENGTH) throw new Error('Titolo troppo lungo');

  const excerpt = String(body.excerpt || '').trim() || null;
  const category = String(body.category || '').trim() || null;
  const metaDescription = String(body.meta_description || '').trim() || null;
  const author = String(body.author || '').trim() || null;
  if (excerpt && excerpt.length > MAX_EXCERPT_LENGTH) throw new Error('Estratto troppo lungo');
  if (category && category.length > MAX_CATEGORY_LENGTH) throw new Error('Categoria troppo lunga');
  if (metaDescription && metaDescription.length > MAX_META_LENGTH) throw new Error('Meta description troppo lunga');
  if (author && author.length > MAX_AUTHOR_LENGTH) throw new Error('Autore troppo lungo');

  const coverImageUrl = validateHttpsUrl(body.cover_image_url, 'URL copertina');
  const slug = slugify(body.slug || title);
  if (slug.length > 180) throw new Error('Slug troppo lungo');

  return {
    title,
    content,
    excerpt,
    category,
    metaDescription,
    author,
    coverImageUrl,
    slug,
    publishedAt: body.published_at || null,
    isPublished: Boolean(body.is_published),
  };
}

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
      const post = preparePost(body);
      const rows = await sql`
        INSERT INTO blog_posts (slug,title,excerpt,content,cover_image_url,category,meta_description,author,published_at,is_published)
        VALUES (${post.slug},${post.title},${post.excerpt},${post.content},${post.coverImageUrl},${post.category},${post.metaDescription},${post.author},${post.publishedAt},${post.isPublished})
        RETURNING *`;
      return send(res, rows[0], 201);
    }

    if (req.method === 'PUT') {
      if (!body.id) return send(res, { error: 'ID mancante' }, 400);
      const post = preparePost(body);
      const rows = await sql`
        UPDATE blog_posts
        SET slug=${post.slug},title=${post.title},excerpt=${post.excerpt},content=${post.content},cover_image_url=${post.coverImageUrl},category=${post.category},meta_description=${post.metaDescription},author=${post.author},published_at=${post.publishedAt},is_published=${post.isPublished},updated_at=now()
        WHERE id=${body.id}
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
    return send(res, { error: error instanceof Error ? error.message : 'Internal server error' }, error instanceof Error ? 400 : 500);
  }
}