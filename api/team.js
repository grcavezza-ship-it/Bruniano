import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

async function getCurricula(sql) {
  const rows = await sql`SELECT value FROM site_settings WHERE key = 'team_curricula' LIMIT 1`;
  if (!rows.length) return {};
  try { return JSON.parse(rows[0].value || '{}'); } catch { return {}; }
}

async function saveCurricula(sql, curricula) {
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('team_curricula', ${JSON.stringify(curricula)}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

export default async function handler(req, res) {
  try {
    const sql = db();
    if (req.method === 'GET') {
      const admin = String(getQuery(req).admin || '') === '1';
      if (admin && !await requireAdmin(req, res, sql)) return;
      const rows = admin
        ? await sql`SELECT id,name,role,specialty,bio,photo_url,sort_order,is_published,created_at,updated_at FROM team_members ORDER BY sort_order ASC,created_at ASC`
        : await sql`SELECT id,name,role,specialty,bio,photo_url,sort_order,is_published,created_at,updated_at FROM team_members WHERE is_published = true ORDER BY sort_order ASC,created_at ASC`;
      if (!rows.length) return send(res, { items: [] });
      const curricula = await getCurricula(sql);
      return send(res, { items: rows.map(item => ({ ...item, curriculum: curricula[item.id] || {} })) });
    }

    if (!await requireAdmin(req, res, sql)) return;

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const id = body.id || null;
      const name = String(body.name || '').trim();
      if (!name) return send(res, { error: 'Nome obbligatorio' }, 400);
      const role = String(body.role || '').trim();
      const specialty = String(body.specialty || '').trim();
      const bio = String(body.bio || '').trim();
      const photoUrl = String(body.photo_url || '').trim();
      const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
      const isPublished = Boolean(body.is_published);
      let saved;
      if (id) {
        const rows = await sql`UPDATE team_members SET name=${name}, role=${role}, specialty=${specialty}, bio=${bio}, photo_url=${photoUrl}, sort_order=${sortOrder}, is_published=${isPublished}, updated_at=now() WHERE id=${id} RETURNING *`;
        if (!rows.length) return send(res, { error: 'Professionista non trovato' }, 404);
        saved = rows[0];
      } else {
        const rows = await sql`INSERT INTO team_members(name,role,specialty,bio,photo_url,sort_order,is_published) VALUES(${name},${role},${specialty},${bio},${photoUrl},${sortOrder},${isPublished}) RETURNING *`;
        saved = rows[0];
      }
      const curricula = await getCurricula(sql);
      curricula[saved.id] = body.curriculum || {};
      await saveCurricula(sql, curricula);
      return send(res, { ...saved, curriculum: curricula[saved.id] }, id ? 200 : 201);
    }

    if (req.method === 'DELETE') {
      const body = req.body || {};
      if (!body.id) return send(res, { error: 'ID obbligatorio' }, 400);
      await sql`DELETE FROM team_members WHERE id=${body.id}`;
      const curricula = await getCurricula(sql);
      delete curricula[body.id];
      await saveCurricula(sql, curricula);
      return send(res, { ok: true });
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Team API error:', error);
    return send(res, { error: 'Errore nella gestione del team' }, 500);
  }
}
