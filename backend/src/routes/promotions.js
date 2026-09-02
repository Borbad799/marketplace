import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { getListingById, mapListing } from '../models/listing.js';

const router = Router();

const prices = { bump: 10, vip: 20, top: 30 };

router.get('/prices', (_req, res) => {
  res.json({
    items: [
      { type: 'bump', title: 'Поднять объявление', price: 10, currency: 'TJS', icon: 'rocket' },
      { type: 'vip', title: 'VIP', price: 20, currency: 'TJS', icon: 'star' },
      { type: 'top', title: 'TOP', price: 30, currency: 'TJS', icon: 'fire' },
    ],
  });
});

router.post('/', requireAuth, (req, res) => {
  const type = req.body.type;
  if (!prices[type]) return res.status(400).json({ error: 'Неизвестный тип продвижения' });
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.body.listingId));
  if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });
  if (listing.user_id !== req.user.id) return res.status(403).json({ error: 'Можно продвигать только свои объявления' });
  if (listing.status !== 'active') return res.status(400).json({ error: 'Сначала опубликуйте объявление' });

  const amount = prices[type];
  const expires = type === 'bump' ? null : db.prepare("SELECT datetime('now', '+7 days') AS d").get().d;
  const promo = db
    .prepare('INSERT INTO promotions (listing_id, user_id, type, amount, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(listing.id, req.user.id, type, amount, expires);
  db.prepare('INSERT INTO payments (user_id, promotion_id, amount, method) VALUES (?, ?, ?, ?)').run(
    req.user.id,
    promo.lastInsertRowid,
    amount,
    req.body.method || 'wallet',
  );

  if (type === 'bump') {
    db.prepare("UPDATE listings SET bumped_at = datetime('now') WHERE id = ?").run(listing.id);
  }
  if (type === 'vip') {
    db.prepare("UPDATE listings SET is_vip = 1 WHERE id = ?").run(listing.id);
  }
  if (type === 'top') {
    db.prepare("UPDATE listings SET is_top = 1 WHERE id = ?").run(listing.id);
  }

  notify(req.user.id, {
    type: 'promotion',
    title: 'Продвижение активировано',
    body: `${listing.title} — ${type.toUpperCase()}`,
    link: `/listings/${listing.id}`,
  });

  res.json({ ok: true, item: mapListing(getListingById(listing.id)) });
});

export default router;
