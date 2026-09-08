import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { mapNotification } from '../services/notify.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 80').all(req.user.id);
  const unread = (await db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id)).n;
  res.json({ items: rows.map(mapNotification), unread });
});

router.post('/read-all', requireAuth, async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});

export default router;
