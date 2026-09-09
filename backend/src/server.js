import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { bootstrap, db } from './db.js';
import { uploadDir } from './middleware/upload.js';
import { setIo, emitPresence } from './services/notify.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import favoriteRoutes from './routes/favorites.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import promotionRoutes from './routes/promotions.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import metaRoutes from './routes/meta.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

function allowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function originOk(origin) {
  if (!origin) return true;
  const list = allowedOrigins();
  if (list.includes('*') || list.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

const corsOpts = {
  origin: (origin, cb) => cb(null, originOk(origin)),
  credentials: true,
};

const io = new Server(server, { cors: corsOpts });
setIo(io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOpts));
app.use(express.json({ limit: '2mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 180,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', metaRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Что-то пошло не так' });
});

const online = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'market-dev-secret-change-in-production');
    socket.userId = payload.id;
    next();
  } catch {
    next();
  }
});

io.on('connection', (socket) => {
  if (!socket.userId) return;
  socket.join(`user:${socket.userId}`);
  online.set(socket.userId, (online.get(socket.userId) || 0) + 1);
  db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(socket.userId).catch(() => {});
  emitPresence(socket.userId, true);
  socket.on('disconnect', () => {
    const n = (online.get(socket.userId) || 1) - 1;
    if (n <= 0) {
      online.delete(socket.userId);
      db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(socket.userId).catch(() => {});
      emitPresence(socket.userId, false);
    } else online.set(socket.userId, n);
  });
});

const port = Number(process.env.PORT || 4000);

server.listen(port, '0.0.0.0', () => {
  fs.mkdirSync(path.resolve(__dirname, '../../database'), { recursive: true });
  console.log(`MARKET API http://0.0.0.0:${port}`);
});

try {
  console.log('Starting MARKET API, database:', process.env.DATABASE_URL ? 'postgres' : 'sqlite');
  await bootstrap();
  console.log('Database ready');
} catch (err) {
  console.error('Database bootstrap failed:', err);
}
