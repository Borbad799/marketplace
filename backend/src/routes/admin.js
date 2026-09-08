import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, publicUser } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { listingBase, mapListing } from '../models/listing.js';

const router = Router();
router.use(requireAdmin);

router.get('/stats', async (_req, res) => {
  const count = async (sql) => (await db.prepare(sql).get()).n;
  res.json({
    users: await count('SELECT COUNT(*) AS n FROM users'),
    listings: await count('SELECT COUNT(*) AS n FROM listings'),
    realEstate: await count("SELECT COUNT(*) AS n FROM listings WHERE type = 'real_estate'"),
    cars: await count("SELECT COUNT(*) AS n FROM listings WHERE type = 'cars'"),
    freelance: await count("SELECT COUNT(*) AS n FROM listings WHERE type = 'freelance'"),
    clothing: await count("SELECT COUNT(*) AS n FROM listings WHERE type = 'clothing'"),
    reports: await count("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'"),
    pending: await count("SELECT COUNT(*) AS n FROM listings WHERE status = 'pending'"),
    payments: (await db.prepare('SELECT COALESCE(SUM(amount),0) AS n FROM payments').get()).n,
  });
});

router.get('/users', async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : null;
  const rows = q
    ? await db.prepare('SELECT * FROM users WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT 200').all(q, q, q)
    : await db.prepare('SELECT * FROM users ORDER BY id DESC LIMIT 200').all();
  res.json({ items: rows.map(publicUser) });
});

router.post('/users/:id/block', async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const next = user.status === 'blocked' ? 'active' : 'blocked';
  await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(next, user.id);
  if (next === 'blocked') {
    await db
      .prepare("UPDATE listings SET status = 'archived' WHERE user_id = ? AND status IN ('active','pending','paused')")
      .run(user.id);
  }
  res.json({ ok: true, status: next });
});

router.post('/users/:id/role', async (req, res) => {
  const role = req.body.role;
  if (!['user', 'admin', 'moderator'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
  await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, Number(req.params.id));
  res.json({ ok: true });
});

router.delete('/users/:id', async (req, res) => {
  await db.prepare('DELETE FROM users WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/listings', async (req, res) => {
  const status = req.query.status;
  const type = req.query.type;
  const where = [];
  const params = [];
  if (status) {
    where.push('l.status = ?');
    params.push(status);
  }
  if (type) {
    where.push('l.type = ?');
    params.push(type);
  }
  const sql = `${listingBase} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY l.created_at DESC LIMIT 300`;
  const rows = await db.prepare(sql).all(...params);
  res.json({ items: await Promise.all(rows.map((r) => mapListing(r))) });
});

router.post('/listings/:id/approve', async (req, res) => {
  const listing = await db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Не найдено' });
  await db.prepare("UPDATE listings SET status = 'active', published_at = datetime('now'), reject_reason = NULL WHERE id = ?").run(listing.id);
  await notify(listing.user_id, {
    type: 'listing_approved',
    title: 'Объявление одобрено',
    body: listing.title,
    link: `/listings/${listing.id}`,
  });
  res.json({ ok: true });
});

router.post('/listings/:id/reject', async (req, res) => {
  const listing = await db.prepare('SELECT * FROM listings WHERE id = ?').get(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: 'Не найдено' });
  const reason = req.body.reason || 'Не соответствует правилам';
  await db.prepare("UPDATE listings SET status = 'rejected', reject_reason = ? WHERE id = ?").run(reason, listing.id);
  await notify(listing.user_id, {
    type: 'listing_rejected',
    title: 'Объявление отклонено',
    body: reason,
    link: `/profile/listings`,
  });
  res.json({ ok: true });
});

router.delete('/listings/:id', async (req, res) => {
  await db.prepare('DELETE FROM listings WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/reports', async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT r.*, l.title AS listing_title, u.name AS reporter_name
       FROM reports r
       LEFT JOIN listings l ON l.id = r.listing_id
       LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.id DESC`,
    )
    .all();
  res.json({
    items: rows.map((r) => ({
      id: r.id,
      listingId: r.listing_id,
      listingTitle: r.listing_title,
      userId: r.user_id,
      reporterName: r.reporter_name,
      reason: r.reason,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
});

router.post('/reports/:id/resolve', async (req, res) => {
  await db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(req.body.status || 'resolved', Number(req.params.id));
  res.json({ ok: true });
});

router.get('/messages', async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT m.*, u.name AS sender_name, c.listing_id
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN conversations c ON c.id = m.conversation_id
       ORDER BY m.id DESC LIMIT 200`,
    )
    .all();
  res.json({ items: rows });
});

router.get('/payments', async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT p.*, u.name AS user_name, pr.type AS promo_type, pr.listing_id
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN promotions pr ON pr.id = p.promotion_id
       ORDER BY p.id DESC LIMIT 200`,
    )
    .all();
  res.json({ items: rows });
});

router.get('/banners', async (_req, res) => {
  res.json({ items: await db.prepare('SELECT * FROM banners ORDER BY sort_order, id').all() });
});

router.post('/banners', async (req, res) => {
  const info = await db
    .prepare('INSERT INTO banners (title, image_url, link, is_active, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(req.body.title || '', req.body.imageUrl || '', req.body.link || '', req.body.isActive === false ? 0 : 1, req.body.sortOrder || 0);
  res.status(201).json({ item: await db.prepare('SELECT * FROM banners WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/banners/:id', async (req, res) => {
  const b = await db.prepare('SELECT * FROM banners WHERE id = ?').get(Number(req.params.id));
  if (!b) return res.status(404).json({ error: 'Не найдено' });
  await db.prepare('UPDATE banners SET title=?, image_url=?, link=?, is_active=?, sort_order=? WHERE id=?').run(
    req.body.title ?? b.title,
    req.body.imageUrl ?? b.image_url,
    req.body.link ?? b.link,
    req.body.isActive === undefined ? b.is_active : req.body.isActive ? 1 : 0,
    req.body.sortOrder ?? b.sort_order,
    b.id,
  );
  res.json({ ok: true });
});

router.delete('/banners/:id', async (req, res) => {
  await db.prepare('DELETE FROM banners WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/cities', async (_req, res) => {
  res.json({ items: await db.prepare('SELECT * FROM cities ORDER BY id').all() });
});

router.post('/cities', async (req, res) => {
  const info = await db
    .prepare('INSERT INTO cities (name, name_ru, latitude, longitude) VALUES (?, ?, ?, ?)')
    .run(req.body.name, req.body.nameRu || req.body.name, req.body.latitude, req.body.longitude);
  res.status(201).json({ item: await db.prepare('SELECT * FROM cities WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/cities/:id', async (req, res) => {
  const c = await db.prepare('SELECT * FROM cities WHERE id = ?').get(Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Не найдено' });
  await db
    .prepare('UPDATE cities SET name=?, name_ru=?, latitude=?, longitude=? WHERE id=?')
    .run(req.body.name ?? c.name, req.body.nameRu ?? c.name_ru, req.body.latitude ?? c.latitude, req.body.longitude ?? c.longitude, c.id);
  res.json({ ok: true });
});

router.delete('/cities/:id', async (req, res) => {
  await db.prepare('DELETE FROM cities WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/categories', async (_req, res) => {
  res.json({ items: await db.prepare('SELECT * FROM categories ORDER BY id').all() });
});

router.post('/categories', async (req, res) => {
  const info = await db
    .prepare('INSERT INTO categories (slug, name, parent_id, type, icon) VALUES (?, ?, ?, ?, ?)')
    .run(req.body.slug, req.body.name, req.body.parentId || null, req.body.type, req.body.icon || null);
  res.status(201).json({ item: await db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid) });
});

router.put('/categories/:id', async (req, res) => {
  const c = await db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Не найдено' });
  await db
    .prepare('UPDATE categories SET slug=?, name=?, parent_id=?, type=?, icon=? WHERE id=?')
    .run(req.body.slug ?? c.slug, req.body.name ?? c.name, req.body.parentId ?? c.parent_id, req.body.type ?? c.type, req.body.icon ?? c.icon, c.id);
  res.json({ ok: true });
});

router.delete('/categories/:id', async (req, res) => {
  await db.prepare('DELETE FROM categories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

router.get('/settings', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM settings').all();
  const map = {};
  rows.forEach((r) => {
    map[r.key] = r.value;
  });
  res.json({ items: map });
});

router.put('/settings', async (req, res) => {
  const entries = Object.entries(req.body || {});
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [k, v] of entries) await stmt.run(k, String(v));
  res.json({ ok: true });
});

export default router;
