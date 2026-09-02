import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { favoriteIdsFor, getListingById, mapListing } from '../models/listing.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const type = req.query.type;
  const rows = db
    .prepare(
      `SELECT l.*, c.name_ru AS city_name, u.name AS seller_name, u.avatar AS seller_avatar, u.rating AS seller_rating,
              u.phone AS seller_phone, u.email AS seller_email, u.reviews_count AS seller_reviews, u.last_seen AS seller_last_seen,
              (SELECT url FROM listing_media WHERE listing_id = l.id AND type = 'image' ORDER BY sort_order LIMIT 1) AS cover
       FROM favorites f
       JOIN listings l ON l.id = f.listing_id
       LEFT JOIN cities c ON c.id = l.city_id
       LEFT JOIN users u ON u.id = l.user_id
       WHERE f.user_id = ? AND l.status = 'active' ${type ? 'AND l.type = ?' : ''}
       ORDER BY f.created_at DESC`,
    )
    .all(...(type ? [req.user.id, type] : [req.user.id]));
  const favs = favoriteIdsFor(req.user.id);
  res.json({ items: rows.map((r) => mapListing(r, { favoriteIds: favs })) });
});

router.post('/:listingId', requireAuth, (req, res) => {
  const listingId = Number(req.params.listingId);
  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listingId);
  if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });
  const exists = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?').get(req.user.id, listingId);
  if (exists) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(exists.id);
    return res.json({ favorited: false });
  }
  db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)').run(req.user.id, listingId);
  res.json({ favorited: true, item: mapListing(getListingById(listingId), { favoriteIds: new Set([listingId]) }) });
});

export default router;
