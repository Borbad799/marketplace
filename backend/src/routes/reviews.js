import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const rating = Number(req.body.rating);
  const toUserId = Number(req.body.toUserId);
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Оценка от 1 до 5' });
  if (toUserId === req.user.id) return res.status(400).json({ error: 'Нельзя оценить себя' });
  const target = await db.prepare('SELECT id FROM users WHERE id = ?').get(toUserId);
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' });
  await db.prepare('INSERT INTO reviews (listing_id, from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?, ?)').run(
    req.body.listingId || null,
    req.user.id,
    toUserId,
    rating,
    req.body.comment || null,
  );
  const agg = await db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE to_user_id = ?').get(toUserId);
  await db.prepare('UPDATE users SET rating = ?, reviews_count = ? WHERE id = ?').run(
    Math.round(agg.avg * 10) / 10,
    agg.n,
    toUserId,
  );
  res.status(201).json({ ok: true, rating: Math.round(agg.avg * 10) / 10 });
});

export default router;
