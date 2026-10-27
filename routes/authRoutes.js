import express from 'express';
import { 
  verifyPassword, 
  hashPassword, 
  createSession, 
  destroySession, 
  checkRateLimit, 
  recordFailedAttempt, 
  clearLoginAttempts, 
  requireAuth,
  SESSION_COOKIE_NAME 
} from '../lib/auth.js';
import { store } from '../lib/store.js';

const router = express.Router();

/**
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const { email, password } = req.body;

  // Verificación de Rate Limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({ error: rateLimit.message });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Debe ingresar email y contraseña.' });
  }

  const user = store.getUserByEmail(email.trim());
  if (!user) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Éxito: limpiar contador de intentos
  clearLoginAttempts(clientIp);

  // Crear sesión segura
  const { signedToken, cookieOptions } = createSession(user);
  res.cookie(SESSION_COOKIE_NAME, signedToken, cookieOptions);

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'Sesión finalizada correctamente.' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.json({ user: null });
  }
  
  import('../lib/auth.js').then(({ getSession }) => {
    const session = getSession(token);
    if (!session) {
      return res.json({ user: null });
    }
    return res.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role
      }
    });
  });
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debe ingresar la contraseña actual y la nueva contraseña.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }

  const user = store.getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
  }

  const newHash = hashPassword(newPassword);
  store.updateUserPassword(user.id, newHash);

  return res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
});

export default router;
