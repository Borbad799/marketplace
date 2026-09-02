import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { listingBase, mapListing, favoriteIdsFor } from '../models/listing.js';

const router = Router();

router.get('/cities', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM cities ORDER BY id').all() });
});

router.get('/categories', (_req, res) => {
  const items = db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json({ items });
});

router.get('/banners', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  res.json({ items: map });
});

router.get('/suggest', optionalAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ listings: [], cities: [], categories: [] });
  const like = `%${q}%`;
  const listings = db
    .prepare(
      `${listingBase} WHERE l.status = 'active' AND (l.title LIKE ? OR l.description LIKE ?) ORDER BY l.is_vip DESC LIMIT 8`,
    )
    .all(like, like)
    .map((r) => mapListing(r, { favoriteIds: favoriteIdsFor(req.user?.id), extra: false }));
  const cities = db.prepare('SELECT * FROM cities WHERE name LIKE ? OR name_ru LIKE ? LIMIT 6').all(like, like);
  const categories = db.prepare('SELECT * FROM categories WHERE name LIKE ? OR slug LIKE ? LIMIT 6').all(like, like);
  res.json({ listings, cities, categories });
});

router.get('/car-meta', (_req, res) => {
  const brands = db.prepare("SELECT DISTINCT brand FROM cars WHERE brand IS NOT NULL ORDER BY brand").all().map((r) => r.brand);
  const models = db.prepare("SELECT DISTINCT brand, model FROM cars WHERE model IS NOT NULL ORDER BY brand, model").all();
  res.json({ brands, models });
});

export default router;
