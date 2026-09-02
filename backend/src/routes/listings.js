import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { favoriteIdsFor, getListingById, listQuery, mapListing } from '../models/listing.js';

const router = Router();

function fail(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return true;
  }
  return false;
}

function saveDetails(listingId, type, body) {
  if (type === 'real_estate') {
    db.prepare(
      `INSERT INTO real_estate (listing_id, property_type, deal_type, rooms, area, floor, floors, renovation, furniture)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(listing_id) DO UPDATE SET
         property_type=excluded.property_type, deal_type=excluded.deal_type, rooms=excluded.rooms,
         area=excluded.area, floor=excluded.floor, floors=excluded.floors, renovation=excluded.renovation, furniture=excluded.furniture`,
    ).run(
      listingId,
      body.propertyType || null,
      body.dealType || null,
      body.rooms || null,
      body.area || null,
      body.floor || null,
      body.floors || null,
      body.renovation || null,
      body.furniture ? 1 : 0,
    );
  }
  if (type === 'cars') {
    db.prepare(
      `INSERT INTO cars (listing_id, brand, model, year, mileage, body_type, engine, engine_volume, transmission, drive, fuel, color, condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(listing_id) DO UPDATE SET
         brand=excluded.brand, model=excluded.model, year=excluded.year, mileage=excluded.mileage,
         body_type=excluded.body_type, engine=excluded.engine, engine_volume=excluded.engine_volume,
         transmission=excluded.transmission, drive=excluded.drive, fuel=excluded.fuel, color=excluded.color, condition=excluded.condition`,
    ).run(
      listingId,
      body.brand || null,
      body.model || null,
      body.year || null,
      body.mileage || null,
      body.bodyType || null,
      body.engine || null,
      body.engineVolume || null,
      body.transmission || null,
      body.drive || null,
      body.fuel || null,
      body.color || null,
      body.condition || null,
    );
  }
  if (type === 'freelance') {
    db.prepare(
      `INSERT INTO freelance_services (listing_id, service_category, delivery_days, service_type)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(listing_id) DO UPDATE SET
         service_category=excluded.service_category, delivery_days=excluded.delivery_days, service_type=excluded.service_type`,
    ).run(listingId, body.serviceCategory || null, body.deliveryDays || null, body.serviceType || null);
  }
  if (type === 'clothing') {
    db.prepare(
      `INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(listing_id) DO UPDATE SET
         clothing_category=excluded.clothing_category, item_kind=excluded.item_kind, size=excluded.size,
         brand=excluded.brand, color=excluded.color, condition=excluded.condition, season=excluded.season`,
    ).run(
      listingId,
      body.clothingCategory || null,
      body.itemKind || null,
      body.size || null,
      body.brand || null,
      body.color || null,
      body.condition || null,
      body.season || null,
    );
  }
}

function saveMedia(listingId, photos = [], videoUrl) {
  db.prepare('DELETE FROM listing_media WHERE listing_id = ?').run(listingId);
  (photos || []).forEach((url, i) => {
    if (url) db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)').run(listingId, url, 'image', i);
  });
  if (videoUrl) {
    db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)').run(
      listingId,
      videoUrl,
      'video',
      99,
    );
  }
}

router.get('/', optionalAuth, (req, res) => {
  const result = listQuery({
    type: req.query.type,
    status: req.query.status || (req.query.mine ? req.query.status : 'active'),
    q: req.query.q,
    cityId: req.query.cityId,
    categoryId: req.query.categoryId,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    userId: req.query.userId,
    mine: req.query.mine === '1',
    promoted: req.query.promoted,
    nearbyLat: req.query.lat,
    nearbyLng: req.query.lng,
    extraFilters: req.query,
    page: req.query.page || 1,
    limit: req.query.limit || 12,
    viewerId: req.user?.id,
  });
  res.json(result);
});

router.get('/popular', optionalAuth, (req, res) => {
  const favs = favoriteIdsFor(req.user?.id);
  const rows = db
    .prepare(
      `SELECT l.*, c.name_ru AS city_name, u.name AS seller_name, u.avatar AS seller_avatar, u.rating AS seller_rating,
              u.phone AS seller_phone, u.email AS seller_email, u.reviews_count AS seller_reviews, u.last_seen AS seller_last_seen,
              (SELECT url FROM listing_media WHERE listing_id = l.id AND type = 'image' ORDER BY sort_order LIMIT 1) AS cover
       FROM listings l
       LEFT JOIN cities c ON c.id = l.city_id
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.status = 'active'
       ORDER BY l.views DESC, l.is_vip DESC
       LIMIT 8`,
    )
    .all();
  res.json({ items: rows.map((r) => mapListing(r, { favoriteIds: favs })) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const row = getListingById(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Объявление не найдено' });
  const isOwner = req.user && req.user.id === row.user_id;
  const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'moderator');
  if (row.status !== 'active' && !isOwner && !isAdmin) {
    return res.status(404).json({ error: 'Объявление не найдено' });
  }
  if (!isOwner) {
    db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(row.id);
    row.views += 1;
  }
  const item = mapListing(row, { favoriteIds: favoriteIdsFor(req.user?.id) });
  const reviews = db
    .prepare(
      `SELECT r.*, u.name AS author_name, u.avatar AS author_avatar
       FROM reviews r JOIN users u ON u.id = r.from_user_id
       WHERE r.to_user_id = ? ORDER BY r.id DESC LIMIT 10`,
    )
    .all(row.user_id);
  item.reviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    author: { name: r.author_name, avatar: r.author_avatar },
  }));
  res.json({ item });
});

const createRules = [
  body('type').isIn(['real_estate', 'cars', 'freelance', 'clothing']).withMessage('Выберите категорию'),
  body('title').trim().isLength({ min: 4, max: 200 }).withMessage('Название слишком короткое'),
  body('description').trim().isLength({ min: 10 }).withMessage('Опишите объявление подробнее'),
  body('price').isFloat({ min: 0 }).withMessage('Укажите цену'),
];

router.post('/', requireAuth, createRules, (req, res) => {
  if (fail(req, res)) return;
  const b = req.body;
  const city = b.cityId ? db.prepare('SELECT * FROM cities WHERE id = ?').get(Number(b.cityId)) : null;
  const info = db
    .prepare(
      `INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .run(
      req.user.id,
      b.categoryId || null,
      b.type,
      b.title,
      b.description,
      Number(b.price),
      b.currency || 'USD',
      b.cityId || null,
      b.address || null,
      b.district || null,
      b.latitude || city?.latitude || null,
      b.longitude || city?.longitude || null,
      b.videoUrl || null,
    );
  const id = info.lastInsertRowid;
  saveDetails(id, b.type, b);
  saveMedia(id, b.photos, b.videoUrl);
  notify(req.user.id, {
    type: 'listing_pending',
    title: 'Объявление отправлено на проверку',
    body: b.title,
    link: `/listings/${id}`,
  });
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  admins.forEach((a) =>
    notify(a.id, {
      type: 'moderation',
      title: 'Новое объявление на проверке',
      body: b.title,
      link: '/admin/listings',
    }),
  );
  res.status(201).json({ item: mapListing(getListingById(id), { favoriteIds: new Set() }) });
});

router.put('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Объявление не найдено' });
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
  if (row.user_id !== req.user.id && !isAdmin) return res.status(403).json({ error: 'Недостаточно прав' });
  const b = req.body;
  const city = b.cityId ? db.prepare('SELECT * FROM cities WHERE id = ?').get(Number(b.cityId)) : null;
  db.prepare(
    `UPDATE listings SET title=?, description=?, price=?, currency=?, city_id=?, address=?, district=?,
      latitude=?, longitude=?, video_url=?, category_id=?, updated_at=datetime('now'),
      status = CASE WHEN ? = 1 THEN status ELSE 'pending' END
     WHERE id=?`,
  ).run(
    b.title ?? row.title,
    b.description ?? row.description,
    b.price ?? row.price,
    b.currency ?? row.currency,
    b.cityId ?? row.city_id,
    b.address ?? row.address,
    b.district ?? row.district,
    b.latitude ?? city?.latitude ?? row.latitude,
    b.longitude ?? city?.longitude ?? row.longitude,
    b.videoUrl ?? row.video_url,
    b.categoryId ?? row.category_id,
    isAdmin ? 1 : 0,
    row.id,
  );
  saveDetails(row.id, row.type, { ...row, ...b });
  if (b.photos) saveMedia(row.id, b.photos, b.videoUrl ?? row.video_url);
  res.json({ item: mapListing(getListingById(row.id), { favoriteIds: favoriteIdsFor(req.user.id) }) });
});

router.post('/:id/status', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Объявление не найдено' });
  if (row.user_id !== req.user.id) return res.status(403).json({ error: 'Недостаточно прав' });
  const next = req.body.status;
  const allowed = ['paused', 'active', 'completed', 'archived'];
  if (!allowed.includes(next)) return res.status(400).json({ error: 'Недопустимый статус' });
  if (next === 'active' && !['paused', 'active'].includes(row.status)) {
    return res.status(400).json({ error: 'Сначала дождитесь модерации' });
  }
  db.prepare("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next, row.id);
  res.json({ ok: true, status: next });
});

router.delete('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Объявление не найдено' });
  const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
  if (row.user_id !== req.user.id && !isAdmin) return res.status(403).json({ error: 'Недостаточно прав' });
  db.prepare('DELETE FROM listings WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

export default router;
