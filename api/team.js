const { sql } = require('./_db');

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const admin = req.query?.admin === '1';
      const rows = await sql`
        SELECT id, name, role, specialty, bio, photo_url, sort_order, is_published, created_at, updated_at
        FROM team_members
        ${admin ? sql`` : sql`WHERE is_published = true`}
        ORDER BY sort_order ASC, created_at ASC
      `;
      return send(res, 200, { items: rows });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {};
      const id = body.id || null;
      const name = String(body.name || '').trim();
      if (!name) return send(res, 400, { error: 'Nome obbligatorio' });

      const role = String(body.role || '').trim();
      const specialty = String(body.specialty || '').trim();
      const bio = String(body.bio || '').trim();
      const photoUrl = String(body.photo_url || '').trim();
      const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;
      const isPublished = Boolean(body.is_published);

      if (id) {
        const rows = await sql`
          UPDATE team_members
          SET name=${name}, role=${role}, specialty=${specialty}, bio=${bio}, photo_url=${photoUrl},
              sort_order=${sortOrder}, is_published=${isPublished}, updated_at=now()
          WHERE id=${id}
          RETURNING *
        `;
        if (!rows.length) return send(res, 404, { error: 'Professionista non trovato' });
        return send(res, 200, rows[0]);
      }

      const rows = await sql`
        INSERT INTO team_members (name, role, specialty, bio, photo_url, sort_order, is_published)
        VALUES (${name}, ${role}, ${specialty}, ${bio}, ${photoUrl}, ${sortOrder}, ${isPublished})
        RETURNING *
      `;
      return send(res, 201, rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.body?.id;
      if (!id) return send(res, 400, { error: 'ID obbligatorio' });
      await sql`DELETE FROM team_members WHERE id=${id}`;
      return send(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return send(res, 405, { error: 'Metodo non consentito' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: 'Errore nella gestione del team' });
  }
};
