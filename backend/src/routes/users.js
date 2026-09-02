import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { listingBase, mapListing, favoriteIdsFor } from '../models/listing.js';

const router = Router();

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const listings = db
    .prepare(`${listingBase} WHERE l.user_id = ? AND l.status = 'active' ORDER BY l.created_at DESC LIMIT 20`)
    .all(user.id)
    .map((r) => mapListing(r, { favoriteIds: new Set() }));
  const reviews = db
    .prepare(
      `SELECT r.*, u.name AS author_name, u.avatar AS author_avatar
       FROM reviews r JOIN users u ON u.id = r.from_user_id
       WHERE r.to_user_id = ? ORDER BY r.id DESC LIMIT 20`,
    )
    .all(user.id);
  res.json({
    user: publicUser(user),
    profile,
    listings,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      author: { name: r.author_name, avatar: r.author_avatar },
    })),
  });
});

router.put('/me', requireAuth, (req, res) => {
  const { name, phone, bio, cityId, address, avatar } = req.body;
  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (phone !== undefined) {
    const taken = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user.id);
    if (taken) return res.status(409).json({ error: 'Этот номер уже занят' });
    db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone || null, req.user.id);
  }
  if (avatar !== undefined) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  db.prepare('INSERT OR IGNORE INTO profiles (user_id) VALUES (?)').run(req.user.id);
  db.prepare('UPDATE profiles SET bio = COALESCE(?, bio), city_id = COALESCE(?, city_id), address = COALESCE(?, address) WHERE user_id = ?').run(
    bio ?? null,
    cityId ?? null,
    address ?? null,
    req.user.id,
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ user: publicUser(user), profile });
});

router.get('/me/listings', requireAuth, (req, res) => {
  const status = req.query.status;
  const where = status ? 'AND l.status = ?' : '';
  const params = status ? [req.user.id, status] : [req.user.id];
  const rows = db.prepare(`${listingBase} WHERE l.user_id = ? ${where} ORDER BY l.updated_at DESC`).all(...params);
  res.json({ items: rows.map((r) => mapListing(r, { favoriteIds: favoriteIdsFor(req.user.id) })) });
});

export default router;
