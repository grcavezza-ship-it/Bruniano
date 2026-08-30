import { db, send, getQuery } from './_db.js';
import { requireAdmin } from './_auth.js';

const FIELD_LIMITS = { name: 200, role: 200, specialty: 300, bio: 5000, photoUrl: 2048 };
const CURRICULUM_FIELDS = ['profile', 'training', 'experience', 'certifications'];
const CURRICULUM_FIELD_LIMIT = 10000;

class ValidationError extends Error {}

function validateHttpsUrl(value, field) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.length > FIELD_LIMITS.photoUrl) throw new ValidationError(`${field} troppo lungo`);
  let parsed;
  try { parsed = new URL(url); } catch { throw new ValidationError(`${field} non valido`); }
  if (parsed.protocol !== 'https:') throw new ValidationError(`${field} deve usare HTTPS`);
  return parsed.toString();
}

function normalizeCurriculum(value) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Curriculum non valido');
  const result = {};
  for (const field of CURRICULUM_FIELDS) {
    const text = String(value[field] || '').trim();
    if (text.length > CURRICULUM_FIELD_LIMIT) throw new ValidationError(`Campo curriculum troppo lungo: ${field}`);
    result[field] = text;
  }
  return result;
}

async function getCurricula(sql) {
  const rows = await sql`SELECT value FROM site_settings WHERE key = 'team_curricula' LIMIT 1`;
  if (!rows.length) return {};
  try {
    const parsed = JSON.parse(rows[0].value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
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
      const admin = getQuery(req).admin === '1';
      if (admin) {
        if (!(await requireAdmin(req, res))) return;
        const rows = await sql`SELECT id,name,role,specialty,bio,photo_url,sort_order,is_published,created_at,updated_at FROM team_members ORDER BY sort_order ASC,created_at ASC`;
        const curricula = await getCurricula(sql);
        return send(res, { items: rows.map(item => ({ ...item, curriculum: curricula[item.id] || {} })) });
      }
      const rows = await sql`SELECT id,name,role,specialty,bio,photo_url,sort_order,is_published,created_at,updated_at FROM team_members WHERE is_published=true ORDER BY sort_order ASC,created_at ASC`;
      return send(res, { items: rows.map(({ id, name, role, specialty, bio, photo_url, sort_order, is_published, created_at, updated_at }) => ({ id, name, role, specialty, bio, photo_url, sort_order, is_published, created_at, updated_at })) });
    }

    if (!(await requireAdmin(req, res))) return;

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const id = body.id || null;
      const name = String(body.name || '').trim();
      if (!name) return send(res, { error: 'Nome obbligatorio' }, 400);
      const role = String(body.role || '').trim();
      const specialty = String(body.specialty || '').trim();
      const bio = String(body.bio || '').trim();
      const photoUrl = validateHttpsUrl(body.photo_url, 'URL foto');
      const sortOrder = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 0;
      const isPublished = Boolean(body.is_published);
      if (name.length > FIELD_LIMITS.name || role.length > FIELD_LIMITS.role || specialty.length > FIELD_LIMITS.specialty || bio.length > FIELD_LIMITS.bio) return send(res, { error: 'Dati professionista troppo lunghi' }, 400);
      const curriculum = normalizeCurriculum(body.curriculum);
      let saved;
      if (id) {
        const rows = await sql`UPDATE team_members SET name=${name},role=${role},specialty=${specialty},bio=${bio},photo_url=${photoUrl},sort_order=${sortOrder},is_published=${isPublished},updated_at=now() WHERE id=${id} RETURNING *`;
        if (!rows.length) return send(res, { error: 'Professionista non trovato' }, 404);
        saved = rows[0];
      } else {
        const rows = await sql`INSERT INTO team_members(name,role,specialty,bio,photo_url,sort_order,is_published) VALUES(${name},${role},${specialty},${bio},${photoUrl},${sortOrder},${isPublished}) RETURNING *`;
        saved = rows[0];
      }
      const curricula = await getCurricula(sql);
      curricula[saved.id] = curriculum;
      await saveCurricula(sql, curricula);
      return send(res, { ...saved, curriculum: curricula[saved.id] }, id ? 200 : 201);
    }

    if (req.method === 'DELETE') {
      const body = req.body || {};
      if (!body.id) return send(res, { error: 'ID obbligatorio' }, 400);
      const deleted = await sql`DELETE FROM team_members WHERE id=${body.id} RETURNING id`;
      const curricula = await getCurricula(sql);
      delete curricula[body.id];
      await saveCurricula(sql, curricula);
      return deleted.length ? send(res, { ok: true }) : send(res, { error: 'Professionista non trovato' }, 404);
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Team API error:', error);
    if (error instanceof ValidationError) return send(res, { error: error.message }, 400);
    return send(res, { error: 'Errore nella gestione del team' }, 500);
  }
}