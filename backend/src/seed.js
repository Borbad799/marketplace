import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDb, db } from './db.js';
import { isPostgres } from './db-client.js';

export async function runSeed() {
  if (isPostgres) {
    await db.exec(`
      TRUNCATE TABLE
        messages, conversations, notifications, favorites, reports, reviews,
        payments, promotions, listing_media, real_estate, cars, freelance_services,
        clothing, listings, otps, password_resets, banners, settings, profiles,
        categories, cities, users
      RESTART IDENTITY CASCADE
    `);
  } else {
    await db.exec(`
      DELETE FROM messages;
      DELETE FROM conversations;
      DELETE FROM notifications;
      DELETE FROM favorites;
      DELETE FROM reports;
      DELETE FROM reviews;
      DELETE FROM payments;
      DELETE FROM promotions;
      DELETE FROM listing_media;
      DELETE FROM real_estate;
      DELETE FROM cars;
      DELETE FROM freelance_services;
      DELETE FROM clothing;
      DELETE FROM listings;
      DELETE FROM otps;
      DELETE FROM password_resets;
      DELETE FROM banners;
      DELETE FROM settings;
      DELETE FROM profiles;
      DELETE FROM categories;
      DELETE FROM cities;
      DELETE FROM users;
    `);
    try {
      await db.exec('DELETE FROM sqlite_sequence');
    } catch {
      /* sqlite_sequence may be missing */
    }
  }

const hash = (p) => bcrypt.hashSync(p, 10);

const cities = [
  ['Dushanbe', 'Душанбе', 38.5598, 68.787],
  ['Khujand', 'Худжанд', 40.2826, 69.6222],
  ['Bokhtar', 'Бохтар', 37.8364, 68.7803],
  ['Kulob', 'Куляб', 37.9146, 69.7845],
  ['Tursunzoda', 'Турсунзода', 38.5127, 68.2316],
  ['Istaravshan', 'Истаравшан', 39.9142, 69.0],
];
const insertCity = db.prepare('INSERT INTO cities (name, name_ru, latitude, longitude) VALUES (?, ?, ?, ?)');
for (const c of cities) await insertCity.run(...c);

const cats = [
  ['real-estate', 'Недвижимость', null, 'real_estate', 'home'],
  ['apartments', 'Квартиры', 1, 'real_estate', 'building'],
  ['houses', 'Дома', 1, 'real_estate', 'house'],
  ['rooms', 'Комнаты', 1, 'real_estate', 'door'],
  ['land', 'Земельные участки', 1, 'real_estate', 'trees'],
  ['commercial', 'Коммерческая недвижимость', 1, 'real_estate', 'store'],
  ['new-buildings', 'Новостройки', 1, 'real_estate', 'building-2'],
  ['rent', 'Аренда', 1, 'real_estate', 'key'],
  ['sale', 'Продажа', 1, 'real_estate', 'badge-dollar'],
  ['cars', 'Автомобили', null, 'cars', 'car'],
  ['passenger', 'Легковые', 10, 'cars', 'car'],
  ['trucks', 'Грузовые', 10, 'cars', 'truck'],
  ['moto', 'Мото', 10, 'cars', 'bike'],
  ['special', 'Спецтехника', 10, 'cars', 'tractor'],
  ['parts', 'Запчасти', 10, 'cars', 'cog'],
  ['accessories', 'Аксессуары', 10, 'cars', 'sparkles'],
  ['freelance', 'Фриланс', null, 'freelance', 'briefcase'],
  ['programming', 'Программирование', 17, 'freelance', 'code'],
  ['design', 'Дизайн', 17, 'freelance', 'palette'],
  ['smm', 'SMM', 17, 'freelance', 'share-2'],
  ['translation', 'Переводы', 17, 'freelance', 'languages'],
  ['copywriting', 'Копирайтинг', 17, 'freelance', 'pen'],
  ['video', 'Видео/монтаж', 17, 'freelance', 'clapperboard'],
  ['marketing', 'Маркетинг', 17, 'freelance', 'megaphone'],
  ['other', 'Другое', 17, 'freelance', 'ellipsis'],
  ['clothing', 'Одежда', null, 'clothing', 'shirt'],
  ['men-clothing', 'Мужская одежда', 26, 'clothing', 'shirt'],
  ['women-clothing', 'Женская одежда', 26, 'clothing', 'heart'],
  ['kids-clothing', 'Детская одежда', 26, 'clothing', 'baby'],
  ['shoes', 'Обувь', 26, 'clothing', 'footprints'],
];
const insertCat = db.prepare('INSERT INTO categories (slug, name, parent_id, type, icon) VALUES (?, ?, ?, ?, ?)');
for (const c of cats) await insertCat.run(...c);

const users = [
  ['Админ', '+992900000001', 'borbad500@gmail.com', hash('919137379_115ffraBb'), 'https://i.pravatar.cc/150?img=12', 'admin', 5, 18],
  ['Алекс', '+992900000002', 'alex@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=33', 'user', 4.8, 24],
  ['Мадина Каримова', '+992900000003', 'madina@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=47', 'user', 4.9, 31],
  ['Фарход Юсупов', '+992900000004', 'farhod@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=15', 'user', 4.6, 12],
  ['Нигора Саидова', '+992900000005', 'nigora@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=20', 'user', 4.7, 9],
  ['Рустам Назаров', '+992900000006', 'rustam@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=8', 'user', 4.5, 7],
  ['Зарина Мирзоева', '+992900000007', 'zarina@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=49', 'user', 5, 15],
  ['Далер Исмоилов', '+992900000008', 'daler@market.tj', hash('User123!'), 'https://i.pravatar.cc/150?img=13', 'user', 4.4, 5],
];
const insertUser = db.prepare(
  'INSERT INTO users (name, phone, email, password, avatar, role, rating, reviews_count, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
);
for (const u of users) await insertUser.run(...u);
const insertProfile = db.prepare('INSERT INTO profiles (user_id, bio, city_id) VALUES (?, ?, ?)');
for (const p of [
  [1, 'Администратор ARZON MARKET', 1],
  [2, 'Продаю квартиру и ищу авто', 1],
  [3, 'Дизайнер логотипов и брендинга', 1],
  [4, 'Автосалон, Худжанд', 2],
  [5, 'Риелтор по Душанбе', 1],
  [6, 'Грузоперевозки и спецтехника', 3],
  [7, 'SMM и маркетинг', 1],
  [8, 'Фронтенд-разработчик', 2],
]) await insertProfile.run(...p);

const rePhotos = [
  ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1493809842364-78817add7e54?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80'],
];
const carPhotos = [
  ['https://images.unsplash.com/photo-1621007947382-bb3c9980e2de?auto=format&fit=crop&w=1400&q=80', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1617531658526-da3d7a31f32c?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=80'],
];
const flPhotos = [
  ['https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80'],
];

const insertListing = db.prepare(`
  INSERT INTO listings (user_id, category_id, type, title, description, price, currency, city_id, address, district, latitude, longitude, status, views, is_vip, is_top, bumped_at, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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

async function addMedia(id, urls) {
  for (let i = 0; i < urls.length; i++) await insertMedia.run(id, urls[i], 'image', i);
}

const realEstate = [
  [2, 2, '2-комнатная квартира в Сино', 'Светлая квартира после ремонта, мебель остаётся. Рядом школа, рынок и остановка. Документы чистые, собственник.', 85000, 'USD', 1, 'ул. Айни 48', 'Сино', 38.57, 68.8, 'active', 312, 1, 0, 'apartment', 'sale', 2, 78, 5, 9, 'евро', 1],
  [5, 2, '3-комнатная квартира в центре', 'Просторная квартира с видом на город. Высокие потолки, два санузла, подземный паркинг.', 128000, 'USD', 1, 'пр. Рудаки 92', 'Центр', 38.56, 68.79, 'active', 210, 0, 1, 'apartment', 'sale', 3, 112, 8, 12, 'дизайнерский', 1],
  [4, 3, 'Дом 180 м² с двором', 'Дом в тихом районе Худжанда, сад, гараж на 2 машины, отдельная гостевая.', 95000, 'USD', 2, 'массив 32', 'Сирдарё', 40.28, 69.63, 'active', 145, 0, 0, 'house', 'sale', 5, 180, 1, 2, 'хороший', 1],
  [2, 4, 'Комната в аренду, Исмоили Сомони', 'Сдаётся комната в 3-комнатной квартире. Интернет, кухня общая, депозит 1 месяц.', 250, 'USD', 1, 'ул. Бохтар 12', 'Исмоили Сомони', 38.55, 68.78, 'active', 88, 0, 0, 'room', 'rent', 1, 18, 3, 5, 'косметический', 1],
  [5, 6, 'Офис 64 м² на первом этаже', 'Коммерческое помещение под салон или магазин, отдельный вход, витрины.', 45000, 'USD', 1, 'ул. Шевченко 7', 'Фирдавси', 38.54, 68.77, 'active', 67, 0, 0, 'commercial', 'sale', 0, 64, 1, 4, 'евро', 0],
  [7, 7, 'Новостройка ЖК Сомон, 1-комнатная', 'Сдача в 2026, рассрочка от застройщика, вид на парк.', 72000, 'USD', 1, 'ЖК Сомон', 'Сино', 38.58, 68.81, 'active', 190, 1, 0, 'new_building', 'sale', 1, 42, 11, 16, 'черновая', 0],
  [6, 5, 'Земельный участок 8 соток', 'Ровный участок под строительство дома, коммуникации рядом, документы готовы.', 18000, 'USD', 3, 'кишлак Гулистон', 'окрестности', 37.84, 68.79, 'active', 54, 0, 0, 'land', 'sale', 0, 800, 0, 0, 'без ремонта', 0],
  [5, 8, '1-комнатная квартира посуточно', 'Чистая квартира для командировок, Wi-Fi, кондиционер, рядом центр.', 40, 'USD', 1, 'ул. Лоик Шерали 3', 'Центр', 38.561, 68.786, 'active', 410, 0, 0, 'apartment', 'rent', 1, 38, 4, 7, 'евро', 1],
  [2, 2, '4-комнатная квартира премиум', 'Панорамные окна, concierge, подземный паркинг, умный дом.', 210000, 'USD', 1, 'ЖК Душанбе Плаза', 'Шохмансур', 38.565, 68.8, 'pending', 12, 0, 0, 'apartment', 'sale', 4, 156, 14, 18, 'дизайнерский', 1],
  [8, 3, 'Дом в Бохтаре, 120 м²', 'Семейный дом, сад, летняя кухня. Срочная продажа.', 38000, 'USD', 3, 'ул. Мирзо Турсунзода 22', 'центр', 37.837, 68.78, 'active', 73, 0, 0, 'house', 'sale', 4, 120, 1, 1, 'хороший', 1],
];

await db.transaction(async () => {
  for (let i = 0; i < realEstate.length; i++) {
    const row = realEstate[i];
    const [userId, catId, title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top, pType, deal, rooms, area, floor, floors, renovation, furniture] = row;
    const info = await insertListing.run(userId, catId, 'real_estate', title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top);
    await insertRE.run(info.lastInsertRowid, pType, deal, rooms, area, floor, floors, renovation, furniture);
    await addMedia(info.lastInsertRowid, rePhotos[i]);
  }
})();

const carsData = [
  [4, 11, 'Toyota Camry 2019', 'Один хозяин, полный сервис, кожаный салон, камера 360. Без ДТП.', 23500, 'USD', 2, 'Автосалон Навруз', '', 40.283, 69.62, 'active', 520, 1, 0, 'Toyota', 'Camry', 2019, 64000, 'седан', 'бензин', 2.5, 'автомат', 'передний', 'бензин', 'белый', 'отличное'],
  [6, 11, 'Hyundai Tucson 2021', 'Полный привод, зимняя резина в комплекте, гаражное хранение.', 27800, 'USD', 1, 'ул. Ахмади Дониш 15', '', 38.57, 68.79, 'active', 301, 0, 1, 'Hyundai', 'Tucson', 2021, 41000, 'кроссовер', 'бензин', 2.0, 'автомат', 'полный', 'бензин', 'серый', 'отличное'],
  [4, 11, 'Honda Accord 2018', 'Американская сборка, газ+бензин, идеальная ходовая.', 16800, 'USD', 2, '', '', 40.28, 69.62, 'active', 188, 0, 0, 'Honda', 'Accord', 2018, 98000, 'седан', 'бензин', 2.4, 'автомат', 'передний', 'бензин', 'чёрный', 'хорошее'],
  [8, 11, 'Mercedes-Benz E-Class 2017', 'AMG пакет, панорама, память сидений. Торг у капота.', 32900, 'USD', 1, '', '', 38.56, 68.787, 'active', 266, 1, 0, 'Mercedes-Benz', 'E-Class', 2017, 87000, 'седан', 'бензин', 2.0, 'автомат', 'задний', 'бензин', 'синий', 'отличное'],
  [4, 11, 'BMW X5 2016', 'Полная комплектация, два комплекта резины, сервисная книжка.', 28500, 'USD', 1, '', '', 38.55, 68.78, 'active', 174, 0, 0, 'BMW', 'X5', 2016, 112000, 'внедорожник', 'дизель', 3.0, 'автомат', 'полный', 'дизель', 'чёрный', 'хорошее'],
  [6, 11, 'Toyota Land Cruiser 2014', 'Рама целая, подготовка под бездорожье, лебёдка.', 41000, 'USD', 4, '', '', 37.91, 69.78, 'active', 390, 0, 1, 'Toyota', 'Land Cruiser', 2014, 156000, 'внедорожник', 'бензин', 4.0, 'автомат', 'полный', 'бензин', 'белый', 'хорошее'],
  [2, 11, 'Kia K5 2022', 'Почти новая, ещё на гарантии, пробег 18 000 км.', 24900, 'USD', 1, '', '', 38.559, 68.79, 'active', 221, 0, 0, 'Kia', 'K5', 2022, 18000, 'седан', 'бензин', 2.0, 'автомат', 'передний', 'бензин', 'красный', 'отличное'],
  [6, 12, 'Isuzu NPR грузовик', 'Рефрижератор, грузоподъёмность 5 тонн, документы в порядке.', 19500, 'USD', 3, '', '', 37.836, 68.78, 'active', 92, 0, 0, 'Isuzu', 'NPR', 2015, 210000, 'грузовик', 'дизель', 5.2, 'механика', 'задний', 'дизель', 'белый', 'хорошее'],
  [8, 13, 'Honda CBR 600', 'Спортбайк в идеале, без падений, плёнка на баке.', 6200, 'USD', 1, '', '', 38.56, 68.787, 'active', 140, 0, 0, 'Honda', 'CBR 600', 2018, 12000, 'мото', 'бензин', 0.6, 'механика', 'задний', 'бензин', 'красный', 'отличное'],
  [4, 15, 'Фары LED Toyota Camry 70', 'Оригинал, пара, без трещин. Самовывоз Душанбе/Худжанд.', 380, 'USD', 2, '', '', 40.28, 69.62, 'active', 45, 0, 0, 'Toyota', 'Camry', 2020, 0, 'запчасти', '—', 0, '—', '—', '—', 'чёрный', 'новое'],
];

await db.transaction(async () => {
  for (let i = 0; i < carsData.length; i++) {
    const row = carsData[i];
    const [userId, catId, title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top, brand, model, year, mileage, body, engine, vol, trans, drive, fuel, color, condition] = row;
    const info = await insertListing.run(userId, catId, 'cars', title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top);
    await insertCar.run(info.lastInsertRowid, brand, model, year, mileage, body, engine, vol, trans, drive, fuel, color, condition);
    await addMedia(info.lastInsertRowid, carPhotos[i]);
  }
})();

const freelance = [
  [3, 19, 'Сделаю профессиональный логотип', 'Фирменный стиль, 3 концепции, исходники AI/Figma, правки до утверждения. Работаю с кафе, клиниками и IT.', 20, 'USD', 1, '', '', 38.56, 68.787, 'active', 640, 1, 1, 'design', 2, 'логотип'],
  [8, 18, 'Разработка сайта на React', 'Лендинг или интернет-магазин, адаптив, админка, SEO-база. Срок от 7 дней.', 400, 'USD', 2, '', '', 40.282, 69.622, 'active', 210, 0, 0, 'programming', 10, 'веб-разработка'],
  [7, 20, 'SMM продвижение Instagram', 'Контент-план, дизайн постов, таргет. Отчёт каждую неделю.', 150, 'USD', 1, '', '', 38.56, 68.79, 'active', 180, 0, 1, 'smm', 30, 'продвижение'],
  [5, 21, 'Переводы RU–TJ–EN', 'Документы, сайты, субтитры. Нотариальное заверение по запросу.', 8, 'USD', 1, '', '', 38.559, 68.787, 'active', 96, 0, 0, 'translation', 1, 'перевод'],
  [7, 22, 'Копирайтинг для бизнеса', 'Тексты для сайта, карточки Wildberries, email-рассылки.', 25, 'USD', 1, '', '', 38.56, 68.78, 'active', 77, 0, 0, 'copywriting', 3, 'тексты'],
  [8, 23, 'Монтаж видео и Reels', 'Динамичный монтаж, субтитры, цветокор, музыка. Сдаю в 48 часов.', 35, 'USD', 2, '', '', 40.28, 69.62, 'active', 155, 1, 0, 'video', 2, 'монтаж'],
  [7, 24, 'Маркетинг-стратегия на 90 дней', 'Аудит, воронка, медиаплан, KPI. Созвон с командой включён.', 300, 'USD', 1, '', '', 38.57, 68.8, 'active', 61, 0, 0, 'marketing', 14, 'консультация'],
  [3, 19, 'Дизайн мобильного приложения', 'UI-kit, 12 экранов, прототип в Figma, передача разработчикам.', 220, 'USD', 1, '', '', 38.56, 68.787, 'active', 134, 0, 0, 'design', 7, 'UI/UX'],
];

await db.transaction(async () => {
  for (let i = 0; i < freelance.length; i++) {
    const row = freelance[i];
    const [userId, catId, title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top, sc, days, st] = row;
    const info = await insertListing.run(userId, catId, 'freelance', title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top);
    await insertFL.run(info.lastInsertRowid, sc, days, st);
    await addMedia(info.lastInsertRowid, flPhotos[i]);
  }
})();

const clPhotos = [
  ['https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80'],
  ['https://images.unsplash.com/photo-1485965120184-e7b47f5525ec?auto=format&fit=crop&w=1400&q=80'],
];

const clothing = [
  [2, 27, 'Куртка мужская зимняя', 'Тёплая куртка, почти новая, носили один сезон. Размер L, подходит на 48-50.', 320, 'TJS', 1, '', '', 38.56, 68.787, 'active', 88, 1, 0, 'men', 'куртка', 'L', 'Zara', 'чёрный', 'отличное', 'зима'],
  [4, 27, 'Джинсы мужские slim', 'Джинсы в хорошем состоянии, без потёртостей. Самовывоз Душанбе.', 95, 'TJS', 1, '', '', 38.559, 68.79, 'active', 41, 0, 0, 'men', 'джинсы', '32', 'Levi\'s', 'синий', 'хорошее', 'демисезон'],
  [3, 28, 'Платье женское вечернее', 'Надевала один раз на торжество. Размер M, ткань приятная, без дефектов.', 180, 'TJS', 1, '', '', 38.56, 68.787, 'active', 120, 0, 1, 'women', 'платье', 'M', 'H&M', 'бордовый', 'отличное', 'лето'],
  [7, 28, 'Пальто женское демисезон', 'Классическое пальто, тёплый подклад. Идеально на весну и осень.', 250, 'TJS', 1, '', '', 38.57, 68.8, 'active', 67, 0, 0, 'women', 'пальто', 'S', 'Mango', 'бежевый', 'хорошее', 'демисезон'],
  [5, 29, 'Костюм детский 5-6 лет', 'Комплект кофта + штаны, мягкий хлопок. После одного ребёнка, как новый.', 70, 'TJS', 1, '', '', 38.56, 68.78, 'active', 54, 0, 0, 'kids', 'костюм', '5-6 лет', 'LC Waikiki', 'серый', 'отличное', 'демисезон'],
  [3, 29, 'Куртка для девочки', 'Яркая куртка на осень, капюшон отстёгивается. Рост 110-116.', 85, 'TJS', 2, '', '', 40.28, 69.62, 'active', 33, 0, 0, 'kids', 'куртка', '110', 'Mothercare', 'розовый', 'хорошее', 'осень'],
  [8, 30, 'Кроссовки Nike, 42', 'Оригинал, подошва целая, носили аккуратно. Коробка есть.', 210, 'TJS', 1, '', '', 38.56, 68.787, 'active', 156, 1, 0, 'shoes', 'кроссовки', '42', 'Nike', 'белый', 'хорошее', 'демисезон'],
  [2, 30, 'Туфли женские 37', 'На каблуке 6 см, надевались два раза. Без потёртостей.', 120, 'TJS', 1, '', '', 38.559, 68.787, 'active', 72, 0, 0, 'shoes', 'туфли', '37', 'Respect', 'чёрный', 'отличное', 'лето'],
  [4, null, 'iPhone 12, 128 GB', 'Телефон в отличном состоянии, батарея держит. Чехол и стекло в комплекте.', 2800, 'TJS', 1, '', '', 38.56, 68.787, 'active', 210, 1, 0, 'electronics', 'телефон', '', 'Apple', 'чёрный', 'хорошее', ''],
  [8, null, 'Наушники беспроводные', 'Звук чистый, кейс есть. Почти новые.', 180, 'TJS', 1, '', '', 38.56, 68.79, 'active', 64, 0, 0, 'electronics', 'наушники', '', 'JBL', 'белый', 'отличное', ''],
  [5, null, 'Диван угловой', 'Удобный диван, без пятен. Самовывоз из Душанбе.', 1200, 'TJS', 1, '', '', 38.57, 68.8, 'active', 91, 0, 0, 'home', 'мебель', '', '', 'серый', 'хорошее', ''],
  [7, null, 'Набор кастрюль', '5 предметов, нержавейка. Почти не пользовались.', 220, 'TJS', 1, '', '', 38.56, 68.787, 'active', 28, 0, 0, 'home', 'кухня', '', '', 'серебро', 'отличное', ''],
  [3, null, 'Палитра теней', 'Новая, запечатана. Оттенок нюд.', 65, 'TJS', 1, '', '', 38.56, 68.787, 'active', 44, 0, 0, 'beauty', 'макияж', '', 'Maybelline', '', 'новое', ''],
  [7, null, 'Парфюм женский 50 мл', 'Оригинал, осталось больше половины.', 150, 'TJS', 1, '', '', 38.559, 68.79, 'active', 39, 0, 0, 'beauty', 'парфюм', '', 'Zara', '', 'хорошее', ''],
  [6, null, 'Гантели 2×5 кг', 'Пара гантелей, резина. Для дома.', 90, 'TJS', 1, '', '', 38.56, 68.787, 'active', 22, 0, 0, 'sport', 'тренажёр', '', '', 'чёрный', 'хорошее', ''],
  [8, null, 'Велосипед горный', '24 скорости, состояние хорошее. Торг.', 950, 'TJS', 2, '', '', 40.28, 69.62, 'active', 77, 0, 1, 'sport', 'велосипед', '', 'Stels', 'синий', 'хорошее', ''],
];

await db.transaction(async () => {
  for (let i = 0; i < clothing.length; i++) {
    const row = clothing[i];
    const [userId, catId, title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top, cat, kind, size, brand, color, condition, season] = row;
    const info = await insertListing.run(userId, catId, 'clothing', title, desc, price, cur, cityId, address, district, lat, lng, status, views, vip, top);
    await insertCL.run(info.lastInsertRowid, cat, kind, size, brand, color, condition, season);
    await addMedia(info.lastInsertRowid, clPhotos[i]);
  }
})();

await db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?), (?, ?), (?, ?), (?, ?)').run(2, 1, 2, 11, 2, 21, 3, 12);
const conv = await db.prepare('INSERT INTO conversations (listing_id, buyer_id, seller_id, last_message, last_message_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(1, 3, 2, 'Да, свободна.');
await db.prepare('INSERT INTO messages (conversation_id, sender_id, text, is_read) VALUES (?, ?, ?, 1), (?, ?, ?, 1)').run(
  conv.lastInsertRowid, 3, 'Здравствуйте, квартира ещё свободна?',
  conv.lastInsertRowid, 2, 'Да, свободна. Можем показать сегодня после 16:00.',
);
const conv2 = await db.prepare('INSERT INTO conversations (listing_id, buyer_id, seller_id, last_message, last_message_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(21, 2, 3, 'Могу начать завтра');
await db.prepare('INSERT INTO messages (conversation_id, sender_id, text, is_read) VALUES (?, ?, ?, 1), (?, ?, ?, 0)').run(
  conv2.lastInsertRowid, 2, 'Сколько правок входит в логотип?',
  conv2.lastInsertRowid, 3, 'Могу начать завтра. Правки безлимитные до утверждения.',
);

await db.prepare('INSERT INTO notifications (user_id, type, title, body, link, is_read) VALUES (?, ?, ?, ?, ?, 0), (?, ?, ?, ?, ?, 0), (?, ?, ?, ?, ?, 1)').run(
  2, 'message', 'Новое сообщение от Мадина Каримова', 'Здравствуйте, квартира ещё свободна?', '/messages/1',
  2, 'listing_approved', 'Объявление одобрено', '2-комнатная квартира в Сино опубликовано', '/listings/1',
  3, 'message', 'Новое сообщение от Алекс', 'Сколько правок входит в логотип?', '/messages/2',
);

await db.prepare('INSERT INTO reviews (listing_id, from_user_id, to_user_id, rating, comment) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)').run(
  21, 2, 3, 5, 'Логотип получился лучше, чем ждали. Рекомендую.',
  1, 3, 2, 5, 'Квартира как на фото, хозяин пунктуальный.',
);

await db.prepare('INSERT INTO reports (listing_id, user_id, reason, comment, status) VALUES (?, ?, ?, ?, ?)').run(
  10, 2, 'wrong_info', 'Цена на фото отличается', 'open',
);

await db.prepare('INSERT INTO banners (title, image_url, link, sort_order) VALUES (?, ?, ?, ?)').run(
  'Продвиньте объявление наверх',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80',
  '/post',
  1,
);

await db.prepare("INSERT INTO settings (key, value) VALUES ('site_name', 'ARZON MARKET'), ('phone_prefix', '+992'), ('moderation', 'on')").run();

const n = (await db.prepare('SELECT COUNT(*) AS n FROM listings').get()).n;
console.log(`Seeded MARKET: ${users.length} users, ${n} listings`);
}

const isCli = process.argv[1] && process.argv[1].includes('seed.js');
if (isCli) {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== '1') {
    console.error('Seed in production is blocked. Set FORCE_SEED=1 if you really want to wipe the database.');
    process.exit(1);
  }
  await connectDb();
  await runSeed();
}
