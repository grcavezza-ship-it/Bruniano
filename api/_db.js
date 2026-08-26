import { neon } from '@neondatabase/serverless';

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

export function send(res, data, status = 200) {
  res.status(status).json(data);
}

export function getQuery(req) {
  return req.query || {};
}
