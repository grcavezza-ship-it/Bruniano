import { db, send } from './_db.js';
import { clearSessionCookie, createSession, ensureInitialAdmin, hashPassword, readSession, requireAdmin, setSessionCookie, validPassword, verifyPassword } from './_auth.js';

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  try {
    const sql = db();
    await ensureInitialAdmin(sql);

    if (req.method === 'GET') {
      const user = await requireAdmin(req, res, sql);
      if (!user) return;
      return send(res, { authenticated: true, username: user.username, mustChangePassword: user.must_change_password });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = String(body.action || '').trim();

      if (action === 'login') {
        const username = normalizeUsername(body.username);
        const password = String(body.password || '');
        const rows = await sql`SELECT id,username,password_hash,must_change_password FROM admin_users WHERE username=${username} LIMIT 1`;
        const valid = rows.length ? await verifyPassword(password, rows[0].password_hash) : false;
        if (!valid) return send(res, { error: 'Username o password non corretti' }, 401);
        await sql`UPDATE admin_users SET last_login_at=now() WHERE id=${rows[0].id}`;
        setSessionCookie(res, createSession(rows[0].id, rows[0].username));
        return send(res, { ok: true, username: rows[0].username, mustChangePassword: rows[0].must_change_password });
      }

      if (action === 'logout') {
        clearSessionCookie(res);
        return send(res, { ok: true });
      }

      if (action === 'change-password') {
        const user = await requireAdmin(req, res, sql);
        if (!user) return;
        const currentPassword = String(body.currentPassword || '');
        const newPassword = String(body.newPassword || '');
        const rows = await sql`SELECT password_hash FROM admin_users WHERE id=${user.id} LIMIT 1`;
        if (!rows.length || !(await verifyPassword(currentPassword, rows[0].password_hash))) return send(res, { error: 'Password attuale non corretta' }, 400);
        if (!validPassword(newPassword)) return send(res, { error: 'La nuova password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale' }, 400);
        const passwordHash = await hashPassword(newPassword);
        await sql`UPDATE admin_users SET password_hash=${passwordHash},must_change_password=false,updated_at=now() WHERE id=${user.id}`;
        clearSessionCookie(res);
        return send(res, { ok: true, mustRelogin: true });
      }
    }

    res.setHeader('Allow', 'GET,POST');
    return send(res, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Auth API error:', error);
    return send(res, { error: 'Errore di autenticazione' }, 500);
  }
}
