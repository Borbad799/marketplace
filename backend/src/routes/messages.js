import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, publicUser } from '../middleware/auth.js';
import { emitMessage, notify } from '../services/notify.js';

const router = Router();

function mapMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.text,
    imageUrl: row.image_url,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function conversationPayload(row, userId) {
  const otherId = row.buyer_id === userId ? row.seller_id : row.buyer_id;
  const other = await db.prepare('SELECT * FROM users WHERE id = ?').get(otherId);
  const listing = row.listing_id
    ? await db
        .prepare(
          `SELECT l.id, l.title, l.price, l.currency,
            (SELECT url FROM listing_media WHERE listing_id = l.id AND type='image' ORDER BY sort_order LIMIT 1) AS cover
           FROM listings l WHERE l.id = ?`,
        )
        .get(row.listing_id)
    : null;
  const unread = (
    await db
      .prepare('SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ? AND sender_id != ? AND is_read = 0')
      .get(row.id, userId)
  ).n;
  return {
    id: row.id,
    listingId: row.listing_id,
    listing,
    other: publicUser(other),
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unread,
    createdAt: row.created_at,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT * FROM conversations
       WHERE buyer_id = ? OR seller_id = ?
       ORDER BY COALESCE(last_message_at, created_at) DESC`,
    )
    .all(req.user.id, req.user.id);
  res.json({ items: await Promise.all(rows.map((r) => conversationPayload(r, req.user.id))) });
});

router.get('/unread-count', requireAuth, async (req, res) => {
  const n = (
    await db
      .prepare(
        `SELECT COUNT(*) AS n FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.is_read = 0 AND m.sender_id != ? AND (c.buyer_id = ? OR c.seller_id = ?)`,
      )
      .get(req.user.id, req.user.id, req.user.id)
  ).n;
  res.json({ count: n });
});

router.post('/', requireAuth, async (req, res) => {
  const listingId = Number(req.body.listingId);
  const listing = await db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  if (!listing) return res.status(404).json({ error: 'Объявление не найдено' });
  if (listing.user_id === req.user.id) return res.status(400).json({ error: 'Нельзя писать самому себе' });
  let conv = await db
    .prepare('SELECT * FROM conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?')
    .get(listingId, req.user.id, listing.user_id);
  if (!conv) {
    const info = await db
      .prepare('INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?, ?, ?)')
      .run(listingId, req.user.id, listing.user_id);
    conv = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(info.lastInsertRowid);
  }
  res.json({ item: await conversationPayload(conv, req.user.id) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const conv = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(Number(req.params.id));
  if (!conv) return res.status(404).json({ error: 'Диалог не найден' });
  if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  await db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(conv.id, req.user.id);
  const messages = (await db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conv.id)).map(mapMessage);
  res.json({ item: await conversationPayload(conv, req.user.id), messages });
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  const conv = await db.prepare('SELECT * FROM conversations WHERE id = ?').get(Number(req.params.id));
  if (!conv) return res.status(404).json({ error: 'Диалог не найден' });
  if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  const text = (req.body.text || '').trim();
  const imageUrl = req.body.imageUrl || null;
  if (!text && !imageUrl) return res.status(400).json({ error: 'Введите сообщение' });
  const info = await db
    .prepare('INSERT INTO messages (conversation_id, sender_id, text, image_url) VALUES (?, ?, ?, ?)')
    .run(conv.id, req.user.id, text, imageUrl);
  const preview = text || '📷 Фото';
  await db.prepare("UPDATE conversations SET last_message = ?, last_message_at = datetime('now') WHERE id = ?").run(preview, conv.id);
  const message = mapMessage(await db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid));
  const otherId = conv.buyer_id === req.user.id ? conv.seller_id : conv.buyer_id;
  emitMessage(otherId, { conversationId: conv.id, message, from: { id: req.user.id, name: req.user.name, avatar: req.user.avatar } });
  await notify(otherId, {
    type: 'message',
    title: `Новое сообщение от ${req.user.name}`,
    body: preview,
    link: `/messages/${conv.id}`,
  });
  res.status(201).json({ item: message });
});

export default router;
