import 'dotenv/config';
import http from 'node:http';
import express from 'express';

const port = Number(process.env.PORT || 4000);
const app = express();
const server = http.createServer(app);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`MARKET API http://0.0.0.0:${port}`);
});

try {
  const { setupApp } = await import('./setup.js');
  await setupApp(app, server);
  console.log('App ready');
} catch (err) {
  console.error('App setup failed, health endpoint still live:', err);
}
