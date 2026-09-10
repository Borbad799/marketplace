# ARZON MARKET — Marketplace Web Application

Современный маркетплейс для **недвижимости**, **автомобилей**, **фриланса** и **магазина** в Таджикистане. Все разделы рабочие: поиск, фильтры, объявления, избранное, чат, уведомления, модерация и админ-панель.

## Запуск локально

```bash
npm run setup
npm run dev
```

- Сайт: http://localhost:5173
- API: http://localhost:4001

`setup` ставит зависимости и наполняет базу демо-данными. Локально используется **SQLite** (`database/market.db`) — `DATABASE_URL` не нужен.

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | borbad500@gmail.com | (ваш пароль) |
| Пользователь | alex@market.tj | User123! |

Вход по телефону: укажите номер `+992XXXXXXXXX` — код подтверждения показывается в уведомлении (без SMS-шлюза).

## Стек

- Frontend: React, TypeScript, Tailwind CSS, Vite, React Router, Lucide
- Backend: Node.js, Express, JWT, bcrypt, Socket.io
- Database: SQLite локально; PostgreSQL (Neon) в продакшене
- Карты: OpenStreetMap / Leaflet
- Фото: локальная папка `uploads` + внешние URL

## Деплой: Vercel + Railway + Neon

Проект готов к раздельному деплою: фронт на Vercel, API на Railway, база на Neon.

### 1. Neon (PostgreSQL)

1. Создайте проект на [neon.tech](https://neon.tech) и скопируйте connection string.
2. Формат: `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`
3. Таблицы создаются сами при первом старте API. Если база пустая — заливаются демо-данные.

### 2. Railway (backend)

1. New Project → Deploy from GitHub → этот репозиторий.
2. **Root Directory:** `backend`
3. Variables:

| Variable | Значение |
|----------|----------|
| `DATABASE_URL` | connection string из Neon |
| `JWT_SECRET` | длинная случайная строка |
| `CLIENT_ORIGIN` | URL фронта, например `https://your-app.vercel.app` |
| `PORT` | Railway подставит сам; можно не задавать |
| `UPLOAD_DIR` | `uploads` или путь к Volume |
| `AUTO_SEED` | `1` только если нужно перезаписать демо-фото при старте |

4. После деплоя откройте `https://<service>.up.railway.app/api/health` — должно быть `{"ok":true}`.
5. Файлы из `/uploads` живут на диске контейнера. Чтобы они не пропадали после рестарта, подключите Railway Volume и укажите его путь в `UPLOAD_DIR`.

### 3. Vercel (frontend)

1. Import того же GitHub-репозитория.
2. Framework: Vite. Корень репозитория можно оставить как есть — `vercel.json` в корне собирает `frontend`.
3. Environment Variables:

| Variable | Значение |
|----------|----------|
| `VITE_API_URL` | публичный URL Railway **без** `/` в конце, например `https://your-service.up.railway.app` |

4. Redeploy после сохранения переменной.
5. Скопируйте production URL Vercel в `CLIENT_ORIGIN` на Railway и рестартните API. Preview-домены `*.vercel.app` уже разрешены в CORS.

### Порядок

1. Neon → скопировать `DATABASE_URL`
2. Railway → задеплоить backend, проверить `/api/health`
3. Vercel → задать `VITE_API_URL` и задеплоить фронт
4. Railway → прописать `CLIENT_ORIGIN` на URL Vercel

Локальная разработка не меняется: без `VITE_API_URL` и без `DATABASE_URL` фронт ходит через Vite proxy, бэкенд пишет в SQLite.

## Скрипты

```bash
npm run dev      # frontend + backend
npm run seed     # пересоздать демо-данные (только локальный SQLite, если нет DATABASE_URL)
```
