import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { listingBase, mapListing, favoriteIdsFor } from '../models/listing.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const listingRows = await db
    .prepare(`${listingBase} WHERE l.user_id = ? AND l.status = 'active' ORDER BY l.created_at DESC LIMIT 20`)
    .all(user.id);
  const listings = await Promise.all(listingRows.map((r) => mapListing(r, { favoriteIds: new Set() })));
  const reviews = await db
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

router.put('/me', requireAuth, async (req, res) => {
  const { name, phone, bio, cityId, address, avatar } = req.body;
  if (name) await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (phone !== undefined) {
    const taken = await db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.user.id);
    if (taken) return res.status(409).json({ error: 'Этот номер уже занят' });
    await db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone || null, req.user.id);
  }
  if (avatar !== undefined) {
    await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar || '', req.user.id);
  }
  await db.prepare('INSERT OR IGNORE INTO profiles (user_id) VALUES (?)').run(req.user.id);
  await db
    .prepare('UPDATE profiles SET bio = COALESCE(?, bio), city_id = COALESCE(?, city_id), address = COALESCE(?, address) WHERE user_id = ?')
    .run(bio ?? null, cityId ?? null, address ?? null, req.user.id);
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ user: publicUser(user), profile });
});

router.get('/me/listings', requireAuth, async (req, res) => {
  const status = req.query.status;
  const where = status ? 'AND l.status = ?' : '';
  const params = status ? [req.user.id, status] : [req.user.id];
  const rows = await db.prepare(`${listingBase} WHERE l.user_id = ? ${where} ORDER BY l.updated_at DESC`).all(...params);
  const favs = await favoriteIdsFor(req.user.id);
  res.json({ items: await Promise.all(rows.map((r) => mapListing(r, { favoriteIds: favs }))) });
});

export default router;
