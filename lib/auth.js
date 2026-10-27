import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_estudio_anabella_zalazar_santa_fe_2026_super_secure_key';
const SESSION_COOKIE_NAME = 'az_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Almacén de sesiones en memoria con expiración
const activeSessions = new Map();

// Rate limiting para prevención de ataques de fuerza bruta
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Genera un hash seguro con sal para contraseñas usando scrypt (Nativo de Node.js)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica una contraseña contra el hash almacenado usando timingSafeEqual
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  
  if (keyBuffer.length !== derivedKey.length) {
    return false;
  }
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Firma un token de sesión con HMAC-SHA256
 */
function signToken(token) {
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

/**
 * Valida la firma del token de sesión
 */
function verifyToken(signedToken) {
  if (!signedToken || typeof signedToken !== 'string') return null;
  const parts = signedToken.split('.');
  if (parts.length !== 2) return null;
  const [token, signature] = parts;
  
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedHmac);
  
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;
  
  return token;
}

/**
 * Crea una sesión para un usuario
 */
export function createSession(user) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  
  activeSessions.set(rawToken, {
    userId: user.id,
    email: user.email,
    name: user.name || 'Administrador',
    role: user.role || 'admin',
    createdAt: Date.now(),
    expiresAt
  });
  
  return {
    signedToken: signToken(rawToken),
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS
    }
  };
}

/**
 * Destruye una sesión
 */
export function destroySession(signedToken) {
  const rawToken = verifyToken(signedToken);
  if (rawToken && activeSessions.has(rawToken)) {
    activeSessions.delete(rawToken);
    return true;
  }
  return false;
}

/**
 * Obtiene la sesión actual a partir del token firmado
 */
export function getSession(signedToken) {
  const rawToken = verifyToken(signedToken);
  if (!rawToken) return null;
  
  const session = activeSessions.get(rawToken);
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(rawToken);
    return null;
  }
  
  return session;
}

/**
 * Middleware para proteger rutas administrativas
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Se requiere inicio de sesión.' });
  }
  
  const session = getSession(token);
  if (!session) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Sesión expirada o inválida. Inicie sesión nuevamente.' });
  }
  
  req.user = session;
  next();
}

/**
 * Verifica y actualiza el contador de intentos de login por IP
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (attempt) {
    if (now - attempt.firstAttempt < LOCKOUT_WINDOW_MS) {
      if (attempt.count >= MAX_ATTEMPTS) {
        const remainingMinutes = Math.ceil((LOCKOUT_WINDOW_MS - (now - attempt.firstAttempt)) / 60000);
        return {
          allowed: false,
          message: `Demasiados intentos fallidos. Intente nuevamente en ${remainingMinutes} minutos.`
        };
      }
    } else {
      // Ventana expirada, resetear
      loginAttempts.set(ip, { count: 0, firstAttempt: now });
    }
  } else {
    loginAttempts.set(ip, { count: 0, firstAttempt: now });
  }
  
  return { allowed: true };
}

/**
 * Registra un intento de login fallido
 */
export function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  attempt.count += 1;
  loginAttempts.set(ip, attempt);
}

/**
 * Limpia los intentos de login tras un inicio exitoso
 */
export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

export { SESSION_COOKIE_NAME };
