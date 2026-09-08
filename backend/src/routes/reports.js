import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';

const router = Router();

const reasons = ['fraud', 'wrong_info', 'forbidden', 'duplicate', 'other'];

router.post('/', requireAuth, async (req, res) => {
  const { listingId, reason, comment } = req.body;
  if (!reasons.includes(reason)) return res.status(400).json({ error: 'Укажите причину жалобы' });
  const listing = await db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(listingId));
  if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });
  await db.prepare('INSERT INTO reports (listing_id, user_id, reason, comment) VALUES (?, ?, ?, ?)').run(
    listing.id,
    req.user.id,
    reason,
    comment || null,
  );
  const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  await Promise.all(
    admins.map((a) =>
      notify(a.id, {
        type: 'report',
        title: 'Новая жалоба',
        body: listing.title,
        link: '/admin/reports',
      }),
    ),
  );
  res.status(201).json({ ok: true });
});

export default router;
