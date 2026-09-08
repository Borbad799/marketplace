import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const secret = process.env.JWT_SECRET || 'market-dev-secret-change-in-production';

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret);
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (user && user.status !== 'blocked') req.user = user;
  } catch {
    /* ignore invalid token for optional routes */
  }
  next();
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    next();
  });
}

export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  });
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    rating: user.rating,
    reviewsCount: user.reviews_count,
    lastSeen: user.last_seen,
    createdAt: user.created_at,
  };
}
