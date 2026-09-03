import { db } from './_db.js';

const SITE_URL = 'https://centromedicobruniano.it';
const STATIC_PATHS = [
  '/',
  '/trattamenti.html',
  '/studio.html',
  '/team.html',
  '/promozioni.html',
  '/blog.html',
  '/recensioni.html',
  '/contatti.html',
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(path) {
  return `${SITE_URL}${path}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Method not allowed');
  }

  try {
    const sql = db();
    const posts = await sql`
      SELECT slug, published_at, updated_at
      FROM blog_posts
      WHERE is_published = true
      ORDER BY COALESCE(published_at, created_at) DESC
    `;

    const urls = STATIC_PATHS.map(path => ({ loc: absoluteUrl(path) }));
    for (const post of posts) {
      if (!post.slug) continue;
      const entry = { loc: `${SITE_URL}/articolo.html?slug=${encodeURIComponent(post.slug)}` };
      const lastmod = post.updated_at || post.published_at;
      if (lastmod) entry.lastmod = new Date(lastmod).toISOString().slice(0, 10);
      urls.push(entry);
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(body);
  } catch (error) {
    console.error('Sitemap error:', error);
    return res.status(500).send('Sitemap unavailable');
  }
}
