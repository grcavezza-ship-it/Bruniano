import { db, json } from './_db.js';

export default async function handler() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  if (!databaseConfigured) return json({ ok: false, databaseConfigured: false }, 500);

  try {
    const sql = db();
    const started = Date.now();
    const rows = await sql`SELECT 1 AS ok`;
    return json({ ok: true, databaseConfigured: true, database: rows[0]?.ok === 1, latencyMs: Date.now() - started });
  } catch (error) {
    console.error('Health check database error:', error);
    return json({ ok: false, databaseConfigured: true, database: false, error: error?.message || 'Database connection failed' }, 500);
  }
}
