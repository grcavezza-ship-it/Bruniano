import { db, send } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, { error: 'Method not allowed' }, 405);
  if (!process.env.DATABASE_URL) return send(res, { ok: false, databaseConfigured: false }, 500);

  try {
    const sql = db();
    const started = Date.now();
    const rows = await sql`SELECT 1 AS ok`;
    return send(res, {
      ok: true,
      databaseConfigured: true,
      database: rows[0]?.ok === 1,
      latencyMs: Date.now() - started
    });
  } catch (error) {
    console.error('Health check database error:', error);
    return send(res, {
      ok: false,
      databaseConfigured: true,
      database: false
    }, 500);
  }
}
