import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth, signToken, publicUser } from '../middleware/auth.js';
import { notify } from '../services/notify.js';

const router = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Попробуйте позже.' },
});

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
    return false;
  }
  return true;
}

function upsertProfile(userId) {
  db.prepare('INSERT OR IGNORE INTO profiles (user_id) VALUES (?)').run(userId);
}

router.post(
  '/register',
  authLimit,
  body('name').trim().isLength({ min: 2 }).withMessage('Укажите имя'),
  body('email').isEmail().withMessage('Некорректный email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { name, email, password, phone } = req.body;
    const exists = db.prepare('SELECT id FROM users WHERE email = ? OR (phone IS NOT NULL AND phone = ?)').get(email, phone || null);
    if (exists) return res.status(409).json({ error: 'Пользователь с таким email или телефоном уже есть' });
    const hash = bcrypt.hashSync(password, 12);
    const info = db
      .prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)')
      .run(name, email, phone || null, hash);
    upsertProfile(info.lastInsertRowid);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    notify(user.id, {
      type: 'welcome',
      title: 'Добро пожаловать в ARZON MARKET',
      body: 'Разместите первое объявление и найдите то, что нужно.',
      link: '/post',
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  },
);

router.post(
  '/login',
  authLimit,
  body('email').isEmail().withMessage('Некорректный email').normalizeEmail(),
  body('password').notEmpty().withMessage('Введите пароль'),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
    if (!user || !user.password || !bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    if (user.status === 'blocked') return res.status(403).json({ error: 'Аккаунт заблокирован' });
    db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(user.id);
    res.json({ token: signToken(user), user: publicUser(user) });
  },
);

router.post(
  '/phone/request',
  authLimit,
  body('phone')
    .matches(/^\+992\d{9}$/)
    .withMessage('Введите номер в формате +992XXXXXXXXX'),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const phone = req.body.phone;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.prepare('INSERT INTO otps (phone, code, expires_at) VALUES (?, ?, datetime(\'now\', \'+10 minutes\'))').run(phone, code);
    res.json({
      ok: true,
      message: 'Код отправлен',
      // Dev-only so phone auth works without an SMS gateway
      code,
    });
  },
);

router.post(
  '/phone/verify',
  authLimit,
  body('phone').matches(/^\+992\d{9}$/).withMessage('Некорректный номер'),
  body('code').isLength({ min: 4, max: 8 }).withMessage('Введите код'),
  body('name').optional().trim(),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const { phone, code, name } = req.body;
    const otp = db
      .prepare("SELECT * FROM otps WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1")
      .get(phone, code);
    if (!otp) return res.status(400).json({ error: 'Неверный или просроченный код' });
    db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(otp.id);
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      const info = db
        .prepare('INSERT INTO users (name, phone) VALUES (?, ?)')
        .run(name || `Пользователь ${phone.slice(-4)}`, phone);
      upsertProfile(info.lastInsertRowid);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      notify(user.id, {
        type: 'welcome',
        title: 'Добро пожаловать в ARZON MARKET',
        body: 'Номер подтверждён. Можно размещать объявления.',
        link: '/post',
      });
    }
    if (user.status === 'blocked') return res.status(403).json({ error: 'Аккаунт заблокирован' });
    db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(user.id);
    res.json({ token: signToken(user), user: publicUser(user) });
  },
);

router.post(
  '/forgot',
  authLimit,
  body('email').isEmail().withMessage('Некорректный email').normalizeEmail(),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (user) {
      db.prepare("INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, datetime('now', '+30 minutes'))").run(
        req.body.email,
        code,
      );
    }
    res.json({
      ok: true,
      message: 'Если аккаунт существует, код восстановления отправлен',
      code: user ? code : undefined,
    });
  },
);

router.post(
  '/reset',
  authLimit,
  body('email').isEmail().normalizeEmail(),
  body('code').notEmpty(),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  (req, res) => {
    if (!handleValidation(req, res)) return;
    const row = db
      .prepare("SELECT * FROM password_resets WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1")
      .get(req.body.email, req.body.code);
    if (!row) return res.status(400).json({ error: 'Неверный или просроченный код' });
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id);
    const hash = bcrypt.hashSync(req.body.password, 12);
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, req.body.email);
    res.json({ ok: true });
  },
);

router.get('/me', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ user: publicUser(req.user), profile });
});

router.post('/logout', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

export default router;
