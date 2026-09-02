# ARZON MARKET — Marketplace Web Application

Современный маркетплейс для **недвижимости**, **автомобилей** и **фриланс-услуг** в Таджикистане. Все разделы рабочие: поиск, фильтры, объявления, избранное, чат, уведомления, модерация и админ-панель.

## Запуск

```bash
npm run setup
npm run dev
```

- Сайт: http://localhost:5173
- API: http://localhost:4001

`setup` ставит зависимости и наполняет базу демо-данными.

## Демо-аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@market.tj | Admin123! |
| Пользователь | alex@market.tj | User123! |

Вход по телефону: укажите номер `+992XXXXXXXXX` — код подтверждения показывается в уведомлении (без SMS-шлюза).

## Стек

- Frontend: React, TypeScript, Tailwind CSS, Vite, React Router, Lucide
- Backend: Node.js, Express, JWT, bcrypt, Socket.io
- Database: SQLite (локально, без установки PostgreSQL). Схема PostgreSQL — в `database/schema.sql`
- Карты: OpenStreetMap / Leaflet
- Фото: локальная папка `backend/uploads` + внешние URL

## Возможности

- Категории: недвижимость, авто, фриланс с отдельными формами и фильтрами
- Поиск с autocomplete (объявления, города, категории)
- Избранное, чат 1-to-1 (текст, фото, emoji, unread)
- Уведомления в реальном времени
- Подача объявления → статус «На проверке» → Approve/Reject в админке
- Жалобы, отзывы, VIP / TOP / Поднять (демо-оплата)
- Мобильная нижняя навигация

## Скрипты

```bash
npm run dev      # frontend + backend
npm run seed     # пересоздать демо-данные
```
