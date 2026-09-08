import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { listingBase, mapListing, favoriteIdsFor } from '../models/listing.js';

const router = Router();

router.get('/cities', async (_req, res) => {
  res.json({ items: await db.prepare('SELECT * FROM cities ORDER BY id').all() });
});

router.get('/categories', async (_req, res) => {
  const items = await db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json({ items });
});

router.get('/banners', async (_req, res) => {
  res.json({ items: await db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order, id').all() });
});

router.get('/settings', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM settings').all();
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  res.json({ items: map });
});

router.get('/suggest', optionalAuth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ listings: [], cities: [], categories: [] });
  const like = `%${q}%`;
  const favs = await favoriteIdsFor(req.user?.id);
  const listingRows = await db
    .prepare(
      `${listingBase} WHERE l.status = 'active' AND (l.title LIKE ? OR l.description LIKE ?) ORDER BY l.is_vip DESC LIMIT 8`,
    )
    .all(like, like);
  const listings = await Promise.all(listingRows.map((r) => mapListing(r, { favoriteIds: favs, extra: false })));
  const cities = await db.prepare('SELECT * FROM cities WHERE name LIKE ? OR name_ru LIKE ? LIMIT 6').all(like, like);
  const categories = await db.prepare('SELECT * FROM categories WHERE name LIKE ? OR slug LIKE ? LIMIT 6').all(like, like);
  res.json({ listings, cities, categories });
});

router.get('/car-meta', async (_req, res) => {
  const brands = (await db.prepare('SELECT DISTINCT brand FROM cars WHERE brand IS NOT NULL ORDER BY brand').all()).map((r) => r.brand);
  const models = await db.prepare('SELECT DISTINCT brand, model FROM cars WHERE model IS NOT NULL ORDER BY brand, model').all();
  res.json({ brands, models });
});

export default router;
