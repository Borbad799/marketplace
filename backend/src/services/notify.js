import { db } from '../db.js';

let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

export async function notify(userId, { type, title, body, link }) {
  const info = await db
    .prepare(
      `INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(userId, type, title, body || '', link || null);
  const row = await db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid);
  if (ioRef) ioRef.to(`user:${userId}`).emit('notification', mapNotification(row));
  return row;
}

export function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export function emitMessage(userId, payload) {
  if (ioRef) ioRef.to(`user:${userId}`).emit('message', payload);
}

export function emitPresence(userId, online) {
  if (ioRef) ioRef.emit('presence', { userId, online });
}
