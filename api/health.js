import { db, send } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, { error: 'Method not allowed' }, 405);
  if (!process.env.DATABASE_URL) return send(res, { ok: false }, 500);

  try {
    const sql = db();
    await sql`SELECT 1 AS ok`;
    return send(res, { ok: true });
  } catch (error) {
    console.error('Health check database error:', error);
    return send(res, { ok: false }, 500);
  }
}
