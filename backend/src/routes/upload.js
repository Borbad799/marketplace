import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload, fileUrl } from '../middleware/upload.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  upload.array('files', 12)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Ошибка загрузки' });
    const files = (req.files || []).map((f) => ({
      url: fileUrl(f.filename),
      type: f.mimetype.startsWith('video') ? 'video' : 'image',
      name: f.originalname,
    }));
    res.json({ files });
  });
});

export default router;
