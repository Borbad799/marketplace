-- MARKET Marketplace — PostgreSQL schema
-- SQLite-compatible types are used in backend/src/db.js for local zero-config development.
-- This file documents the production PostgreSQL layout.

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(32) UNIQUE,
  email VARCHAR(160) UNIQUE,
  password TEXT,
  avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  city_id INTEGER,
  address TEXT,
  language VARCHAR(8) NOT NULL DEFAULT 'ru'
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  name_ru VARCHAR(80) NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  type VARCHAR(32) NOT NULL,
  icon VARCHAR(40)
);

CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  type VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  city_id INTEGER REFERENCES cities(id),
  address TEXT,
  district VARCHAR(120),
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  is_top BOOLEAN NOT NULL DEFAULT FALSE,
  bumped_at TIMESTAMPTZ,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE real_estate (
  listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  property_type VARCHAR(40),
  deal_type VARCHAR(20),
  rooms INTEGER,
  area NUMERIC(10,2),
  floor INTEGER,
  floors INTEGER,
  renovation VARCHAR(40),
  furniture BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cars (
  listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  brand VARCHAR(80),
  model VARCHAR(80),
  year INTEGER,
  mileage INTEGER,
  body_type VARCHAR(40),
  engine VARCHAR(40),
  engine_volume NUMERIC(4,1),
  transmission VARCHAR(40),
  drive VARCHAR(40),
  fuel VARCHAR(40),
  color VARCHAR(40),
  condition VARCHAR(40)
);

CREATE TABLE freelance_services (
  listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  service_category VARCHAR(80),
  delivery_days INTEGER,
  service_type VARCHAR(80)
);

CREATE TABLE clothing (
  listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  clothing_category VARCHAR(40),
  item_kind VARCHAR(80),
  size VARCHAR(40),
  brand VARCHAR(80),
  color VARCHAR(40),
  condition VARCHAR(40),
  season VARCHAR(40)
);

CREATE TABLE listing_media (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'image',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id, seller_id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT,
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  reason VARCHAR(80) NOT NULL,
  comment TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TJS',
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  promotion_id INTEGER REFERENCES promotions(id),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TJS',
  method VARCHAR(40) NOT NULL DEFAULT 'wallet',
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(32) NOT NULL,
  code VARCHAR(8) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  code VARCHAR(8) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE banners (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160),
  image_url TEXT,
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE settings (
  key VARCHAR(80) PRIMARY KEY,
  value TEXT
);

CREATE INDEX idx_listings_type_status ON listings(type, status);
CREATE INDEX idx_listings_city ON listings(city_id);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
