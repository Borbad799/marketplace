import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../../database/market.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      rating REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      last_seen TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      city_id INTEGER,
      address TEXT,
      language TEXT NOT NULL DEFAULT 'ru'
    );

    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES categories(id),
      type TEXT NOT NULL,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER REFERENCES categories(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      city_id INTEGER REFERENCES cities(id),
      address TEXT,
      district TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      reject_reason TEXT,
      views INTEGER NOT NULL DEFAULT 0,
      is_vip INTEGER NOT NULL DEFAULT 0,
      is_top INTEGER NOT NULL DEFAULT 0,
      bumped_at TEXT,
      video_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      published_at TEXT
    );

    CREATE TABLE IF NOT EXISTS real_estate (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
      property_type TEXT,
      deal_type TEXT,
      rooms INTEGER,
      area REAL,
      floor INTEGER,
      floors INTEGER,
      renovation TEXT,
      furniture INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cars (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
      brand TEXT,
      model TEXT,
      year INTEGER,
      mileage INTEGER,
      body_type TEXT,
      engine TEXT,
      engine_volume REAL,
      transmission TEXT,
      drive TEXT,
      fuel TEXT,
      color TEXT,
      condition TEXT
    );

    CREATE TABLE IF NOT EXISTS freelance_services (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
      service_category TEXT,
      delivery_days INTEGER,
      service_type TEXT
    );

    CREATE TABLE IF NOT EXISTS clothing (
      listing_id INTEGER PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
      clothing_category TEXT,
      item_kind TEXT,
      size TEXT,
      brand TEXT,
      color TEXT,
      condition TEXT,
      season TEXT
    );

    CREATE TABLE IF NOT EXISTS listing_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'image',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      last_message TEXT,
      last_message_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(listing_id, buyer_id, seller_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      text TEXT,
      image_url TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      reason TEXT NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
      from_user_id INTEGER NOT NULL REFERENCES users(id),
      to_user_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TJS',
      status TEXT NOT NULL DEFAULT 'paid',
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      promotion_id INTEGER REFERENCES promotions(id),
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TJS',
      method TEXT NOT NULL DEFAULT 'wallet',
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image_url TEXT,
      link TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_listings_type_status ON listings(type, status);
    CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
  `);
}

initSchema();

export function seedClothingIfEmpty() {
  const n = db.prepare("SELECT COUNT(*) AS n FROM listings WHERE type = 'clothing'").get().n;
  if (n > 0) return;
  const user = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
  if (!user || !city) return;
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
    VALUES (?, NULL, 'clothing', ?, ?, ?, 'TJS', ?, '', '', ?, ?, 'active', 20, 0, 0, datetime('now'), datetime('now'))
  `);
  const insertCL = db.prepare(
    'INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)');
  const items = [
    ['Куртка мужская зимняя', 'Тёплая куртка, почти новая, носили один сезон.', 320, 'men', 'куртка', 'L', 'Zara', 'чёрный', 'отличное', 'зима', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80'],
    ['Джинсы мужские slim', 'Джинсы в хорошем состоянии, без потёртостей.', 95, 'men', 'джинсы', '32', "Levi's", 'синий', 'хорошее', 'демисезон', 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1400&q=80'],
    ['Платье женское вечернее', 'Надевала один раз на торжество. Размер M.', 180, 'women', 'платье', 'M', 'H&M', 'бордовый', 'отличное', 'лето', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80'],
    ['Пальто женское демисезон', 'Классическое пальто, тёплый подклад.', 250, 'women', 'пальто', 'S', 'Mango', 'бежевый', 'хорошее', 'демисезон', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1400&q=80'],
    ['Костюм детский 5-6 лет', 'Комплект кофта + штаны, мягкий хлопок.', 70, 'kids', 'костюм', '5-6 лет', 'LC Waikiki', 'серый', 'отличное', 'демисезон', 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1400&q=80'],
    ['Куртка для девочки', 'Яркая куртка на осень, рост 110-116.', 85, 'kids', 'куртка', '110', 'Mothercare', 'розовый', 'хорошее', 'осень', 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=1400&q=80'],
    ['Кроссовки Nike, 42', 'Оригинал, подошва целая. Коробка есть.', 210, 'shoes', 'кроссовки', '42', 'Nike', 'белый', 'хорошее', 'демисезон', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80'],
    ['Туфли женские 37', 'На каблуке 6 см, надевались два раза.', 120, 'shoes', 'туфли', '37', 'Respect', 'чёрный', 'отличное', 'лето', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80'],
  ];
  const tx = db.transaction(() => {
    for (const it of items) {
      const [title, desc, price, cat, kind, size, brand, color, condition, season, photo] = it;
      const info = insertListing.run(user.id, title, desc, price, city.id, city.latitude, city.longitude);
      insertCL.run(info.lastInsertRowid, cat, kind, size, brand, color, condition, season);
      insertMedia.run(info.lastInsertRowid, photo, 'image', 0);
    }
  });
  tx();
}

export function seedShopExtrasIfEmpty() {
  const n = db.prepare("SELECT COUNT(*) AS n FROM clothing WHERE clothing_category IN ('electronics','home','beauty','sport')").get().n;
  if (n > 0) return;
  const user = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
  if (!user || !city) return;
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
    VALUES (?, NULL, 'clothing', ?, ?, ?, 'TJS', ?, '', '', ?, ?, 'active', 20, 0, 0, datetime('now'), datetime('now'))
  `);
  const insertCL = db.prepare(
    'INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)');
  const items = [
    ['iPhone 12, 128 GB', 'Телефон в отличном состоянии, батарея держит.', 2800, 'electronics', 'телефон', '', 'Apple', 'чёрный', 'хорошее', '', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80'],
    ['Наушники беспроводные', 'Звук чистый, кейс есть.', 180, 'electronics', 'наушники', '', 'JBL', 'белый', 'отличное', '', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80'],
    ['Диван угловой', 'Удобный диван, без пятен.', 1200, 'home', 'мебель', '', '', 'серый', 'хорошее', '', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80'],
    ['Набор кастрюль', '5 предметов, нержавейка.', 220, 'home', 'кухня', '', '', 'серебро', 'отличное', '', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80'],
    ['Палитра теней', 'Новая, запечатана.', 65, 'beauty', 'макияж', '', 'Maybelline', '', 'новое', '', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=80'],
    ['Парфюм женский 50 мл', 'Оригинал, осталось больше половины.', 150, 'beauty', 'парфюм', '', 'Zara', '', 'хорошее', '', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1400&q=80'],
    ['Гантели 2×5 кг', 'Пара гантелей для дома.', 90, 'sport', 'тренажёр', '', '', 'чёрный', 'хорошее', '', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80'],
    ['Велосипед горный', '24 скорости, состояние хорошее.', 950, 'sport', 'велосипед', '', 'Stels', 'синий', 'хорошее', '', 'https://images.unsplash.com/photo-1485965120184-e7b47f5525ec?auto=format&fit=crop&w=1400&q=80'],
  ];
  db.transaction(() => {
    for (const it of items) {
      const [title, desc, price, cat, kind, size, brand, color, condition, season, photo] = it;
      const info = insertListing.run(user.id, title, desc, price, city.id, city.latitude, city.longitude);
      insertCL.run(info.lastInsertRowid, cat, kind, size, brand, color, condition, season);
      insertMedia.run(info.lastInsertRowid, photo, 'image', 0);
    }
  })();
}

export function seedMissingShopKinds() {
  const user = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
  if (!user || !city) return;
  const exists = db.prepare('SELECT COUNT(*) AS n FROM clothing WHERE clothing_category = ? AND item_kind = ?');
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
    VALUES (?, NULL, 'clothing', ?, ?, ?, 'TJS', ?, '', '', ?, ?, 'active', 18, 0, 0, datetime('now'), datetime('now'))
  `);
  const insertCL = db.prepare(
    'INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)');
  const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
  const items = [
    ['men', 'куртка', 'Куртка мужская зимняя', 320, 'L', 'Zara', photo('photo-1617137968427-85924c800a22')],
    ['men', 'джинсы', 'Джинсы мужские slim', 95, '32', "Levi's", photo('photo-1520975661595-6453be3f7070')],
    ['men', 'футболка', 'Футболка мужская хлопок', 45, 'M', 'Uniqlo', photo('photo-1521572163474-6864f9cf17ab')],
    ['men', 'рубашка', 'Рубашка мужская классика', 110, 'L', 'H&M', photo('photo-1593030761757-71fae45fa0e7')],
    ['men', 'брюки', 'Брюки мужские чинос', 130, '32', 'Zara', photo('photo-1473966968600-fa801b869a1a')],
    ['men', 'костюм', 'Костюм мужской двойка', 480, '50', 'Kanzler', photo('photo-1594938298603-c8148c38188c')],
    ['men', 'спорт', 'Костюм спортивный мужской', 150, 'L', 'Adidas', photo('photo-1515886657613-9f3515b0c78f')],
    ['men', 'худи', 'Худи мужское оверсайз', 160, 'XL', 'Nike', photo('photo-1556821840-3a63f95609a7')],
    ['women', 'платье', 'Платье женское вечернее', 180, 'M', 'H&M', photo('photo-1483985988355-763728e1935b')],
    ['women', 'пальто', 'Пальто женское демисезон', 250, 'S', 'Mango', photo('photo-1515372039744-b8f02a3ae446')],
    ['women', 'блузка', 'Блузка женская шёлк', 95, 'M', 'Zara', photo('photo-1564257631407-4deb1f99d992')],
    ['women', 'юбка', 'Юбка миди плиссе', 85, 'S', 'H&M', photo('photo-1583496661160-fb5886a0aaaa')],
    ['women', 'джинсы', 'Джинсы женские mom', 120, '28', "Levi's", photo('photo-1541099649105-f69ad21f3246')],
    ['women', 'куртка', 'Куртка женская кожаная', 340, 'M', 'Stradivarius', photo('photo-1521223890158-f9f7c3d5d504')],
    ['women', 'костюм', 'Костюм женский брючный', 290, 'S', 'Mango', photo('photo-1595777457583-95e059d581b8')],
    ['women', 'хиджаб', 'Хиджаб шёлковый', 55, '', '', photo('photo-1583391733956-6c78276477e2')],
    ['kids', 'костюм', 'Костюм детский 5-6 лет', 70, '5-6 лет', 'LC Waikiki', photo('photo-1514090458221-65bb69cf63e6')],
    ['kids', 'куртка', 'Куртка для девочки', 85, '110', 'Mothercare', photo('photo-1503919545889-aef636e10ad4')],
    ['kids', 'для мальчиков', 'Комплект для мальчика', 75, '122', 'LC Waikiki', photo('photo-1503919545889-aef636e10ad4')],
    ['kids', 'для девочек', 'Платье для девочки', 80, '116', 'H&M Kids', photo('photo-1514090458221-65bb69cf63e6')],
    ['kids', 'для малышей', 'Боди для малыша', 40, '', 'Mothercare', photo('photo-1515488044360-fbdf91d1bf27')],
    ['kids', 'школа', 'Школьная форма', 160, '128', 'Gloria Jeans', photo('photo-1503676260728-1c00da094a0b')],
    ['kids', 'спорт', 'Костюм спорт детский', 90, '122', 'Adidas', photo('photo-1461896836934-ffe607ba6851')],
    ['kids', 'пижама', 'Пижама детская', 50, '116', 'LC Waikiki', photo('photo-1515488044360-fbdf91d1bf27')],
    ['shoes', 'кроссовки', 'Кроссовки Nike, 42', 210, '42', 'Nike', photo('photo-1542291026-7eec264c27ff')],
    ['shoes', 'туфли', 'Туфли женские 37', 120, '37', 'Respect', photo('photo-1549298916-b41d501d3772')],
    ['shoes', 'ботинки', 'Ботинки мужские 43', 280, '43', 'Ralf Ringer', photo('photo-1520639888713-7851133b1ed0')],
    ['shoes', 'сапоги', 'Сапоги женские зима', 260, '38', 'Carlo Pazolini', photo('photo-1543163521-1bf539c55dd2')],
    ['shoes', 'сандалии', 'Сандалии летние 39', 90, '39', 'Crocs', photo('photo-1603487742131-4160ec999306')],
    ['shoes', 'кеды', 'Кеды белые 41', 140, '41', 'Converse', photo('photo-1460353581641-37baddab0fa2')],
    ['shoes', 'домашние', 'Тапочки домашние', 35, '40', '', photo('photo-1543163521-1bf539c55dd2')],
    ['shoes', 'детская обувь', 'Кроссовки детские 32', 85, '32', 'Geox', photo('photo-1514989940723-e8e51635b782')],
    ['electronics', 'телефон', 'iPhone 12, 128 GB', 2800, '', 'Apple', photo('photo-1511707171634-5f897ff02aa9')],
    ['electronics', 'наушники', 'Наушники беспроводные', 180, '', 'JBL', photo('photo-1505740420928-5e560c06d30e')],
    ['electronics', 'ноутбук', 'Ноутбук 15.6" i5', 4200, '', 'Lenovo', photo('photo-1496181133206-80ce9b88a853')],
    ['electronics', 'телевизор', 'Телевизор 43" Smart', 3100, '', 'Samsung', photo('photo-1593359677879-a4bb92f829d1')],
    ['electronics', 'планшет', 'Планшет 10"', 1500, '', 'Xiaomi', photo('photo-1544244015-0df4b3ffc6b0')],
    ['electronics', 'часы', 'Смарт-часы', 320, '', 'Huawei', photo('photo-1523275335684-37898b6baf30')],
    ['electronics', 'колонка', 'Колонка Bluetooth', 140, '', 'JBL', photo('photo-1608043152269-423dbba4e7e1')],
    ['electronics', 'зарядка', 'Зарядка 65W', 55, '', 'Baseus', photo('photo-1583863788434-e58a36330cf0')],
    ['home', 'мебель', 'Диван угловой', 1200, '', '', photo('photo-1555041469-a586c61ea9bc')],
    ['home', 'кухня', 'Набор кастрюль', 220, '', '', photo('photo-1556909114-f6e7ad7d3136')],
    ['home', 'декор', 'Картина на стену', 70, '', '', photo('photo-1513519245088-0e12902e35ca')],
    ['home', 'текстиль', 'Комплект постельного', 180, '', '', photo('photo-1522771739844-6a9f6d5f14af')],
    ['home', 'свет', 'Лампа настольная', 95, '', '', photo('photo-1507473883502-3fe0818bf23a')],
    ['home', 'уборка', 'Пылесос ручной', 250, '', 'Xiaomi', photo('photo-1558317374-058bb2c308b5')],
    ['home', 'посуда', 'Набор тарелок 6 шт', 80, '', '', photo('photo-1578500494198-2825ed0de43c')],
    ['home', 'хранение', 'Коробки для хранения', 45, '', '', photo('photo-1558618666-fcd25c85cd64')],
    ['beauty', 'уход', 'Крем для лица', 75, '', 'Nivea', photo('photo-1556228578-8c89e6adf883')],
    ['beauty', 'макияж', 'Палитра теней', 65, '', 'Maybelline', photo('photo-1596462502278-27bfdc403348')],
    ['beauty', 'парфюм', 'Парфюм женский 50 мл', 150, '', 'Zara', photo('photo-1541643600914-78b084683601')],
    ['beauty', 'волосы', 'Фен для волос', 190, '', 'Philips', photo('photo-1522338140262-f46f5913618a')],
    ['beauty', 'маникюр', 'Набор для маникюра', 40, '', '', photo('photo-1604654894610-df63bc536371')],
    ['beauty', 'для лица', 'Маска тканевая 10 шт', 55, '', 'Garnier', photo('photo-1570172619604-71ec5470c0b3')],
    ['beauty', 'для тела', 'Лосьон для тела', 60, '', 'Dove', photo('photo-1556228453-efd6c1ff04f6')],
    ['beauty', 'инструменты', 'Зеркало с подсветкой', 85, '', '', photo('photo-1512496015851-a90fb38ba796')],
    ['sport', 'тренажёр', 'Гантели 2×5 кг', 90, '', '', photo('photo-1517836357463-d25dfeac3438')],
    ['sport', 'велосипед', 'Велосипед горный', 950, '', 'Stels', photo('photo-1485965120184-e7b47f5525ec')],
    ['sport', 'мяч', 'Мяч футбольный', 70, '', 'Adidas', photo('photo-1614632537197-38a17061c2bd')],
    ['sport', 'йога', 'Коврик для йоги', 55, '', '', photo('photo-1544367567-0f2fcb009e0b')],
    ['sport', 'форма', 'Форма футбольная', 120, 'L', 'Nike', photo('photo-1431324155629-1a6deb1dec8d')],
    ['sport', 'рюкзак', 'Рюкзак спортивный', 95, '', 'Puma', photo('photo-1553062407-98eeb64c6a62')],
    ['sport', 'ролики', 'Ролики 39-42', 180, '40', 'Reaction', photo('photo-1558618666-fcd25c85cd64')],
    ['sport', 'туризм', 'Палатка 2-местная', 320, '', '', photo('photo-1478131143081-80f7f84ca84d')],
  ];
  const tx = db.transaction(() => {
    for (const [cat, kind, title, price, size, brand, img] of items) {
      if (exists.get(cat, kind).n > 0) continue;
      const info = insertListing.run(user.id, title, `${title}. Состояние хорошее, самовывоз.`, price, city.id, city.latitude, city.longitude);
      insertCL.run(info.lastInsertRowid, cat, kind, size, brand, '', 'хорошее', '');
      insertMedia.run(info.lastInsertRowid, img, 'image', 0);
    }
  });
  tx();
}

seedClothingIfEmpty();
seedShopExtrasIfEmpty();
seedMissingShopKinds();
