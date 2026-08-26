import { login, logout, me, changePassword } from './_auth.js';

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || '');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (action === 'login') return login(req, res);
    if (action === 'logout') return logout(req, res);
    if (action === 'me') return me(req, res);
    if (action === 'change-password') return changePassword(req, res);
    return res.status(400).json({ error: 'Azione non valida' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Errore interno di autenticazione' });
  }
}
