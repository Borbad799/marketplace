import bcrypt from 'bcryptjs';
import { createDb, isPostgres } from './db-client.js';
import { photoForKind, photoForRow } from './shopPhotos.js';

const OWNER_EMAIL = 'borbad500@gmail.com';
const OWNER_PASSWORD = '919137379_115ffraBb';

let impl = null;

export const db = {
  prepare: (sql) => impl.prepare(sql),
  exec: (sql) => impl.exec(sql),
  pragma: (v) => impl.pragma?.(v),
  transaction: (fn) => impl.transaction(fn),
};

function schemaSql() {
  let sql = `
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
  `;
  if (isPostgres) {
    sql = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
      .replace(/DEFAULT \(datetime\('now'\)\)/g, 'DEFAULT NOW()');
  }
  return sql;
}

export async function initSchema() {
  await db.exec(schemaSql());
}

export async function seedClothingIfEmpty() {
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM listings WHERE type = 'clothing'").get()).n;
  if (n > 0) return;
  const user = await db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = await db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
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
  await db.transaction(async () => {
    for (const it of items) {
      const [title, desc, price, cat, kind, size, brand, color, condition, season, photo] = it;
      const info = await insertListing.run(user.id, title, desc, price, city.id, city.latitude, city.longitude);
      await insertCL.run(info.lastInsertRowid, cat, kind, size, brand, color, condition, season);
      await insertMedia.run(info.lastInsertRowid, photo, 'image', 0);
    }
  })();
}

export async function seedShopExtrasIfEmpty() {
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM clothing WHERE clothing_category IN ('electronics','home','beauty','sport')").get()).n;
  if (n > 0) return;
  const user = await db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = await db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
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
  await db.transaction(async () => {
    for (const it of items) {
      const [title, desc, price, cat, kind, size, brand, color, condition, season, photo] = it;
      const info = await insertListing.run(user.id, title, desc, price, city.id, city.latitude, city.longitude);
      await insertCL.run(info.lastInsertRowid, cat, kind, size, brand, color, condition, season);
      await insertMedia.run(info.lastInsertRowid, photo, 'image', 0);
    }
  })();
}

export async function seedMissingShopKinds() {
  const user = await db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = await db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
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
  await db.transaction(async () => {
    for (const [cat, kind, title, price, size, brand, img] of items) {
      if ((await exists.get(cat, kind)).n > 0) continue;
      const info = await insertListing.run(user.id, title, `${title}. Состояние хорошее, самовывоз.`, price, city.id, city.latitude, city.longitude);
      await insertCL.run(info.lastInsertRowid, cat, kind, size, brand, '', 'хорошее', '');
      await insertMedia.run(info.lastInsertRowid, img, 'image', 0);
    }
  })();
}

export async function seedShopVariants() {
  const user = await db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = await db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
  if (!user || !city) return;
  const kinds = await db.prepare('SELECT clothing_category AS cat, item_kind AS kind, COUNT(*) AS n FROM clothing GROUP BY clothing_category, item_kind').all();
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
    VALUES (?, NULL, 'clothing', ?, ?, ?, 'TJS', ?, '', '', ?, ?, 'active', 16, 0, 0, datetime('now'), datetime('now'))
  `);
  const insertCL = db.prepare(
    'INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)');
  const sample = db.prepare(
    `SELECT l.title, l.price, cl.size, cl.brand, cl.color, cl.condition, cl.season
     FROM clothing cl JOIN listings l ON l.id = cl.listing_id
     WHERE cl.clothing_category = ? AND cl.item_kind = ? LIMIT 1`,
  );
  const extras = [
    { tag: 'новая', add: 20 },
    { tag: 'б/у', add: -15 },
    { tag: 'премиум', add: 40 },
  ];
  await db.transaction(async () => {
    for (const row of kinds) {
      if (row.n >= 4) continue;
      const base = await sample.get(row.cat, row.kind);
      if (!base) continue;
      for (let i = 0; i < 4 - row.n; i++) {
        const ex = extras[i] || extras[0];
        const title = `${base.title} · ${ex.tag}`;
        const price = Math.max(20, Number(base.price) + ex.add + i * 8);
        const info = await insertListing.run(user.id, title, `${title}. Только этот вид товара.`, price, city.id, city.latitude, city.longitude);
        await insertCL.run(info.lastInsertRowid, row.cat, row.kind, base.size || '', base.brand || '', base.color || '', base.condition || 'хорошее', base.season || '');
        await insertMedia.run(info.lastInsertRowid, photoForKind(row.kind, info.lastInsertRowid, row.cat), 'image', 0);
      }
    }
  })();
}

export async function ensureListingPhotos() {
  const insert = db.prepare(`INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, 'image', 0)`);
  const kindOf = db.prepare('SELECT item_kind, clothing_category FROM clothing WHERE listing_id = ?');
  const missing = await db
    .prepare(
      `SELECT l.id FROM listings l
       WHERE NOT EXISTS (SELECT 1 FROM listing_media m WHERE m.listing_id = l.id AND m.type = 'image')`,
    )
    .all();
  for (const row of missing) {
    const cl = await kindOf.get(row.id);
    await insert.run(row.id, photoForKind(cl?.item_kind, row.id, cl?.clothing_category));
  }
}

export async function applyShopPhotos() {
  const rows = await db
    .prepare(
      `SELECT m.id AS media_id, l.id AS listing_id, l.type, l.title,
              cl.item_kind, cl.clothing_category,
              c.body_type, c.brand, c.model, re.property_type, f.service_category
       FROM listing_media m
       JOIN listings l ON l.id = m.listing_id
       LEFT JOIN clothing cl ON cl.listing_id = l.id
       LEFT JOIN cars c ON c.listing_id = l.id
       LEFT JOIN real_estate re ON re.listing_id = l.id
       LEFT JOIN freelance_services f ON f.listing_id = l.id
       WHERE m.type = 'image'
       ORDER BY l.type, cl.clothing_category, cl.item_kind, c.body_type, re.property_type, f.service_category, l.id`,
    )
    .all();
  const upd = db.prepare('UPDATE listing_media SET url = ? WHERE id = ?');
  const usedByKey = new Map();
  await db.transaction(async () => {
    for (const r of rows) {
      const key = `${r.type}:${r.clothing_category || ''}:${r.item_kind || ''}:${r.body_type || ''}:${r.property_type || ''}:${r.service_category || ''}`;
      if (!usedByKey.has(key)) usedByKey.set(key, new Set());
      const used = usedByKey.get(key);
      const url = photoForRow({ ...r, id: r.listing_id }, used);
      used.add(url);
      await upd.run(url, r.media_id);
    }
  })();
}

export async function connectDb() {
  if (!impl) impl = await createDb();
  await initSchema();
  return db;
}

async function ensureMinimalProduction() {
  const users = await db.prepare('SELECT COUNT(*) AS n FROM users').get();
  if (users?.n) return;
  const cities = await db.prepare('SELECT COUNT(*) AS n FROM cities').get();
  if (!cities?.n) {
    await db
      .prepare('INSERT INTO cities (name, name_ru, latitude, longitude) VALUES (?, ?, ?, ?)')
      .run('Dushanbe', 'Душанбе', 38.5598, 68.787);
  }
  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  const admin = await db
    .prepare('INSERT INTO users (name, phone, email, password, avatar, role, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Админ', '+992900000001', 'borbad500@gmail.com', hash, '', 'admin', 5, 0);
  await db.prepare('INSERT INTO profiles (user_id, bio, city_id) VALUES (?, ?, ?)').run(admin.lastInsertRowid, 'Администратор', 1);
  const userHash = bcrypt.hashSync('User123!', 10);
  const user = await db
    .prepare('INSERT INTO users (name, phone, email, password, avatar, role, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run('Алекс', '+992900000002', 'alex@market.tj', userHash, '', 'user', 5, 0);
  await db.prepare('INSERT INTO profiles (user_id, bio, city_id) VALUES (?, ?, ?)').run(user.lastInsertRowid, '', 1);
}

export async function seedDemoCatalogIfEmpty() {
  const user = await db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get();
  const city = await db.prepare('SELECT id, latitude, longitude FROM cities ORDER BY id LIMIT 1').get();
  if (!user || !city) return;

  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, datetime('now'), datetime('now'))
  `);
  const insertRE = db.prepare(
    'INSERT INTO real_estate (listing_id, property_type, deal_type, rooms, area, floor, floors, renovation, furniture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertCar = db.prepare(
    'INSERT INTO cars (listing_id, brand, model, year, mileage, body_type, engine, engine_volume, transmission, drive, fuel, color, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertFL = db.prepare(
    'INSERT INTO freelance_services (listing_id, service_category, delivery_days, service_type) VALUES (?, ?, ?, ?)',
  );
  const insertCL = db.prepare(
    'INSERT INTO clothing (listing_id, clothing_category, item_kind, size, brand, color, condition, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertMedia = db.prepare('INSERT INTO listing_media (listing_id, url, type, sort_order) VALUES (?, ?, ?, ?)');
  const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
  const countType = async (type) => (await db.prepare('SELECT COUNT(*) AS n FROM listings WHERE type = ?').get(type)).n;

  if (!(await countType('real_estate'))) {
    const items = [
      ['2-комнатная квартира в Сино', 'Светлая квартира после ремонта, мебель остаётся.', 85000, 'USD', 'Сино', 312, 1, 0, 'apartment', 'sale', 2, 78, 5, 9, 'евро', 1, 'photo-1502672260266-1c1ef2d93688'],
      ['3-комнатная квартира в центре', 'Просторная квартира с видом на город.', 128000, 'USD', 'Центр', 210, 0, 1, 'apartment', 'sale', 3, 112, 8, 12, 'дизайнерский', 1, 'photo-1560448204-e02f11c3d0e2'],
      ['Дом 180 м² с двором', 'Дом в тихом районе, сад и гараж на 2 машины.', 95000, 'USD', '', 145, 0, 0, 'house', 'sale', 5, 180, 1, 2, 'хороший', 1, 'photo-1600596542815-ffad4c1539a9'],
      ['Комната в аренду', 'Сдаётся комната, интернет и кухня общие.', 250, 'USD', 'Исмоили Сомони', 88, 0, 0, 'room', 'rent', 1, 18, 3, 5, 'косметический', 1, 'photo-1493809842364-78817add7e54'],
      ['Офис 64 м²', 'Помещение под салон или магазин, отдельный вход.', 45000, 'USD', 'Фирдавси', 67, 0, 0, 'commercial', 'sale', 0, 64, 1, 4, 'евро', 0, 'photo-1497366216548-37526070297c'],
      ['1-комнатная посуточно', 'Чистая квартира, Wi-Fi и кондиционер.', 40, 'USD', 'Центр', 410, 0, 0, 'apartment', 'rent', 1, 38, 4, 7, 'евро', 1, 'photo-1522708323590-d24dbb6b0267'],
    ];
    for (const it of items) {
      const [title, desc, price, cur, district, views, vip, top, pType, deal, rooms, area, floor, floors, renovation, furniture, img] = it;
      const info = await insertListing.run(user.id, 'real_estate', title, desc, price, cur, city.id, '', district, city.latitude, city.longitude, views, vip, top);
      await insertRE.run(info.lastInsertRowid, pType, deal, rooms, area, floor, floors, renovation, furniture);
      await insertMedia.run(info.lastInsertRowid, photo(img), 'image', 0);
    }
  }

  if (!(await countType('cars'))) {
    const items = [
      ['Toyota Camry 2019', 'Один хозяин, полный сервис, без ДТП.', 23500, 520, 1, 0, 'Toyota', 'Camry', 2019, 64000, 'седан', 2.5, 'автомат', 'передний', 'бензин', 'белый', 'photo-1621007947382-bb3c9980e2de'],
      ['Hyundai Tucson 2021', 'Полный привод, зимняя резина в комплекте.', 27800, 301, 0, 1, 'Hyundai', 'Tucson', 2021, 41000, 'кроссовер', 2.0, 'автомат', 'полный', 'бензин', 'серый', 'photo-1552519507-da3b142c6e3d'],
      ['Honda Accord 2018', 'Американская сборка, газ+бензин.', 16800, 188, 0, 0, 'Honda', 'Accord', 2018, 98000, 'седан', 2.4, 'автомат', 'передний', 'бензин', 'чёрный', 'photo-1606664515524-ed2f786a0bd6'],
      ['Mercedes-Benz E-Class 2017', 'AMG пакет, панорама, память сидений.', 32900, 266, 1, 0, 'Mercedes-Benz', 'E-Class', 2017, 87000, 'седан', 2.0, 'автомат', 'задний', 'бензин', 'синий', 'photo-1617531658526-da3d7a31f32c'],
      ['BMW X5 2016', 'Полная комплектация, сервисная книжка.', 28500, 174, 0, 0, 'BMW', 'X5', 2016, 112000, 'внедорожник', 3.0, 'автомат', 'полный', 'дизель', 'чёрный', 'photo-1555215695-3004980ad54e'],
      ['Kia K5 2022', 'Почти новая, ещё на гарантии.', 24900, 221, 0, 0, 'Kia', 'K5', 2022, 18000, 'седан', 2.0, 'автомат', 'передний', 'бензин', 'красный', 'photo-1542362567-b07e54358753'],
    ];
    for (const it of items) {
      const [title, desc, price, views, vip, top, brand, model, year, mileage, body, vol, trans, drive, fuel, color, img] = it;
      const info = await insertListing.run(user.id, 'cars', title, desc, price, 'USD', city.id, '', '', city.latitude, city.longitude, views, vip, top);
      await insertCar.run(info.lastInsertRowid, brand, model, year, mileage, body, fuel, vol, trans, drive, fuel, color, 'отличное');
      await insertMedia.run(info.lastInsertRowid, photo(img), 'image', 0);
    }
  }

  if (!(await countType('freelance'))) {
    const items = [
      ['Сделаю профессиональный логотип', '3 концепции, исходники и правки до утверждения.', 20, 640, 1, 1, 'design', 2, 'логотип', 'photo-1561070791-2526d30994b5'],
      ['Разработка сайта на React', 'Лендинг или магазин, адаптив и админка.', 400, 210, 0, 0, 'programming', 10, 'веб-разработка', 'photo-1498050108023-c5249f4df085'],
      ['SMM продвижение Instagram', 'Контент-план, дизайн постов и таргет.', 150, 180, 0, 1, 'smm', 30, 'продвижение', 'photo-1611162617474-5b21e879e113'],
      ['Переводы RU–TJ–EN', 'Документы, сайты и субтитры.', 8, 96, 0, 0, 'translation', 1, 'перевод', 'photo-1454165804606-c3d57bc86b40'],
      ['Монтаж видео и Reels', 'Динамичный монтаж, субтитры и цветокор.', 35, 155, 1, 0, 'video', 2, 'монтаж', 'photo-1574717024653-61fd2cf4d44d'],
      ['Дизайн мобильного приложения', 'UI-kit, 12 экранов и прототип в Figma.', 220, 134, 0, 0, 'design', 7, 'UI/UX', 'photo-1522202176988-66273c2fd55f'],
    ];
    for (const it of items) {
      const [title, desc, price, views, vip, top, sc, days, st, img] = it;
      const info = await insertListing.run(user.id, 'freelance', title, desc, price, 'USD', city.id, '', '', city.latitude, city.longitude, views, vip, top);
      await insertFL.run(info.lastInsertRowid, sc, days, st);
      await insertMedia.run(info.lastInsertRowid, photo(img), 'image', 0);
    }
  }

  if (!(await countType('clothing'))) {
    await seedClothingIfEmpty();
    await seedShopExtrasIfEmpty();
  }
}

export async function ensureSoleAdmin() {
  const email = OWNER_EMAIL.toLowerCase();
  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  const owner = await db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email);
  if (owner) {
    await db.prepare("UPDATE users SET role = 'admin', password = ? WHERE id = ?").run(hash, owner.id);
  } else {
    const created = await db
      .prepare('INSERT INTO users (name, phone, email, password, avatar, role, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run('Админ', null, email, hash, '', 'admin', 5, 0);
    await db.prepare('INSERT INTO profiles (user_id, bio) VALUES (?, ?)').run(created.lastInsertRowid, 'Администратор');
  }
  await db
    .prepare("UPDATE users SET role = 'user' WHERE role IN ('admin', 'moderator') AND lower(COALESCE(email, '')) != ?")
    .run(email);
}

export async function bootstrap() {
  await connectDb();
  const hosted = Boolean(process.env.DATABASE_URL);
  if ((hosted || process.env.NODE_ENV === 'production') && process.env.AUTO_SEED !== '1') {
    try {
      await ensureMinimalProduction();
      await seedDemoCatalogIfEmpty();
    } catch (err) {
      console.error('Minimal seed skipped:', err);
    }
  } else {
    const users = await db.prepare('SELECT COUNT(*) AS n FROM users').get();
    if (!users?.n) {
      const { runSeed } = await import('./seed.js');
      await runSeed();
    }
    await seedClothingIfEmpty();
    await seedShopExtrasIfEmpty();
    await seedMissingShopKinds();
    await seedShopVariants();
    await ensureListingPhotos();
    await applyShopPhotos();
  }
  try {
    await ensureSoleAdmin();
  } catch (err) {
    console.error('Admin owner sync skipped:', err);
  }
}
