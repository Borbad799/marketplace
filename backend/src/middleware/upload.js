import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.resolve(__dirname, '../..', process.env.UPLOAD_DIR || 'uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('upload dir:', err.message);
}

const allowed = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safe = ext.replace(/[^.a-z0-9]/g, '') || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safe}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Допустимы только изображения JPEG/PNG/WebP/GIF и видео MP4/WebM'));
    }
    cb(null, true);
  },
});

export function fileUrl(filename) {
  return `/uploads/${filename}`;
}
