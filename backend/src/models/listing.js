import { db } from '../db.js';

const listingBase = `
  SELECT l.*,
    c.name_ru AS city_name,
    u.name AS seller_name,
    u.avatar AS seller_avatar,
    u.rating AS seller_rating,
    u.phone AS seller_phone,
    u.email AS seller_email,
    u.reviews_count AS seller_reviews,
    u.last_seen AS seller_last_seen,
    (SELECT url FROM listing_media WHERE listing_id = l.id AND type = 'image' ORDER BY sort_order ASC, id ASC LIMIT 1) AS cover
  FROM listings l
  LEFT JOIN cities c ON c.id = l.city_id
  LEFT JOIN users u ON u.id = l.user_id
`;

export function listingOrderSql() {
  return ` ORDER BY l.is_top DESC, l.is_vip DESC, COALESCE(l.bumped_at, l.published_at, l.created_at) DESC `;
}

export function mapListing(row, { favoriteIds = new Set(), extra = true } = {}) {
  if (!row) return null;
  const item = {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    type: row.type,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    cityId: row.city_id,
    city: row.city_name,
    address: row.address,
    district: row.district,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    rejectReason: row.reject_reason,
    views: row.views,
    isVip: Boolean(row.is_vip),
    isTop: Boolean(row.is_top),
    bumpedAt: row.bumped_at,
    videoUrl: row.video_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    cover: row.cover,
    favorited: favoriteIds.has(row.id),
    seller: {
      id: row.user_id,
      name: row.seller_name,
      avatar: row.seller_avatar,
      rating: row.seller_rating,
      reviewsCount: row.seller_reviews,
      phone: row.seller_phone,
      email: row.seller_email,
      lastSeen: row.seller_last_seen,
    },
  };

  if (extra) {
    item.media = db
      .prepare('SELECT id, url, type, sort_order AS sortOrder FROM listing_media WHERE listing_id = ? ORDER BY sort_order, id')
      .all(row.id);
    if (row.type === 'real_estate') {
      const d = db.prepare('SELECT * FROM real_estate WHERE listing_id = ?').get(row.id);
      item.realEstate = d
        ? {
            propertyType: d.property_type,
            dealType: d.deal_type,
            rooms: d.rooms,
            area: d.area,
            floor: d.floor,
            floors: d.floors,
            renovation: d.renovation,
            furniture: Boolean(d.furniture),
          }
        : null;
    }
    if (row.type === 'cars') {
      const d = db.prepare('SELECT * FROM cars WHERE listing_id = ?').get(row.id);
      item.car = d
        ? {
            brand: d.brand,
            model: d.model,
            year: d.year,
            mileage: d.mileage,
            bodyType: d.body_type,
            engine: d.engine,
            engineVolume: d.engine_volume,
            transmission: d.transmission,
            drive: d.drive,
            fuel: d.fuel,
            color: d.color,
            condition: d.condition,
          }
        : null;
    }
    if (row.type === 'freelance') {
      const d = db.prepare('SELECT * FROM freelance_services WHERE listing_id = ?').get(row.id);
      item.freelance = d
        ? {
            serviceCategory: d.service_category,
            deliveryDays: d.delivery_days,
            serviceType: d.service_type,
          }
        : null;
    }
    if (row.type === 'clothing') {
      const d = db.prepare('SELECT * FROM clothing WHERE listing_id = ?').get(row.id);
      item.clothing = d
        ? {
            clothingCategory: d.clothing_category,
            itemKind: d.item_kind,
            size: d.size,
            brand: d.brand,
            color: d.color,
            condition: d.condition,
            season: d.season,
          }
        : null;
    }
  }
  return item;
}

export function getListingById(id) {
  return db.prepare(`${listingBase} WHERE l.id = ?`).get(id);
}

export function favoriteIdsFor(userId) {
  if (!userId) return new Set();
  const rows = db.prepare('SELECT listing_id FROM favorites WHERE user_id = ?').all(userId);
  return new Set(rows.map((r) => r.listing_id));
}

export function listQuery({
  type,
  status = 'active',
  q,
  cityId,
  categoryId,
  minPrice,
  maxPrice,
  userId,
  mine,
  promoted,
  nearbyLat,
  nearbyLng,
  extraFilters = {},
  page = 1,
  limit = 12,
  viewerId,
}) {
  const where = [];
  const params = [];

  if (type) {
    where.push('l.type = ?');
    params.push(type);
  }
  if (mine && viewerId) {
    where.push('l.user_id = ?');
    params.push(viewerId);
    if (status) {
      where.push('l.status = ?');
      params.push(status);
    }
  } else if (userId) {
    where.push('l.user_id = ?');
    params.push(userId);
    where.push("l.status = 'active'");
  } else if (status) {
    where.push('l.status = ?');
    params.push(status);
  }
  if (q) {
    where.push('(l.title LIKE ? OR l.description LIKE ? OR l.address LIKE ? OR l.district LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (cityId) {
    where.push('l.city_id = ?');
    params.push(Number(cityId));
  }
  if (categoryId) {
    where.push('l.category_id = ?');
    params.push(Number(categoryId));
  }
  if (minPrice) {
    where.push('l.price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where.push('l.price <= ?');
    params.push(Number(maxPrice));
  }
  if (promoted === 'vip') where.push('l.is_vip = 1');
  if (promoted === 'top') where.push('l.is_top = 1');

  if (type === 'real_estate') {
    if (extraFilters.rooms) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.rooms = ?)');
      params.push(Number(extraFilters.rooms));
    }
    if (extraFilters.dealType) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.deal_type = ?)');
      params.push(extraFilters.dealType);
    }
    if (extraFilters.propertyType) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.property_type = ?)');
      params.push(extraFilters.propertyType);
    }
    if (extraFilters.renovation) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.renovation = ?)');
      params.push(extraFilters.renovation);
    }
    if (extraFilters.minArea) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.area >= ?)');
      params.push(Number(extraFilters.minArea));
    }
    if (extraFilters.maxArea) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.area <= ?)');
      params.push(Number(extraFilters.maxArea));
    }
    if (extraFilters.floor) {
      where.push('EXISTS (SELECT 1 FROM real_estate re WHERE re.listing_id = l.id AND re.floor = ?)');
      params.push(Number(extraFilters.floor));
    }
  }

  if (type === 'cars') {
    if (extraFilters.brand) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.brand = ?)');
      params.push(extraFilters.brand);
    }
    if (extraFilters.model) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.model LIKE ?)');
      params.push(`%${extraFilters.model}%`);
    }
    if (extraFilters.yearFrom) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.year >= ?)');
      params.push(Number(extraFilters.yearFrom));
    }
    if (extraFilters.yearTo) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.year <= ?)');
      params.push(Number(extraFilters.yearTo));
    }
    if (extraFilters.mileageMax) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.mileage <= ?)');
      params.push(Number(extraFilters.mileageMax));
    }
    if (extraFilters.transmission) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.transmission = ?)');
      params.push(extraFilters.transmission);
    }
    if (extraFilters.fuel) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.fuel = ?)');
      params.push(extraFilters.fuel);
    }
    if (extraFilters.bodyType) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.body_type = ?)');
      params.push(extraFilters.bodyType);
    }
    if (extraFilters.engine) {
      where.push('EXISTS (SELECT 1 FROM cars ca WHERE ca.listing_id = l.id AND ca.engine = ?)');
      params.push(extraFilters.engine);
    }
  }

  if (type === 'freelance') {
    if (extraFilters.serviceCategory) {
      where.push('EXISTS (SELECT 1 FROM freelance_services fs WHERE fs.listing_id = l.id AND fs.service_category = ?)');
      params.push(extraFilters.serviceCategory);
    }
    if (extraFilters.maxDays) {
      where.push('EXISTS (SELECT 1 FROM freelance_services fs WHERE fs.listing_id = l.id AND fs.delivery_days <= ?)');
      params.push(Number(extraFilters.maxDays));
    }
    if (extraFilters.minRating) {
      where.push('u.rating >= ?');
      params.push(Number(extraFilters.minRating));
    }
  }

  if (type === 'clothing') {
    if (extraFilters.clothingCategory) {
      where.push('EXISTS (SELECT 1 FROM clothing cl WHERE cl.listing_id = l.id AND cl.clothing_category = ?)');
      params.push(extraFilters.clothingCategory);
    }
    if (extraFilters.itemKind) {
      where.push('EXISTS (SELECT 1 FROM clothing cl WHERE cl.listing_id = l.id AND (cl.item_kind = ? OR cl.item_kind LIKE ? OR l.title LIKE ?))');
      params.push(extraFilters.itemKind, `%${extraFilters.itemKind}%`, `%${extraFilters.itemKind}%`);
    }
    if (extraFilters.size) {
      where.push('EXISTS (SELECT 1 FROM clothing cl WHERE cl.listing_id = l.id AND cl.size = ?)');
      params.push(extraFilters.size);
    }
    if (extraFilters.brand) {
      where.push('EXISTS (SELECT 1 FROM clothing cl WHERE cl.listing_id = l.id AND cl.brand LIKE ?)');
      params.push(`%${extraFilters.brand}%`);
    }
    if (extraFilters.condition) {
      where.push('EXISTS (SELECT 1 FROM clothing cl WHERE cl.listing_id = l.id AND cl.condition = ?)');
      params.push(extraFilters.condition);
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = db.prepare(`SELECT COUNT(*) AS n FROM listings l LEFT JOIN users u ON u.id = l.user_id ${whereSql}`).get(...params).n;
  const offset = (Number(page) - 1) * Number(limit);
  let order = listingOrderSql();
  if (nearbyLat && nearbyLng) {
    order = ` ORDER BY ((l.latitude - ${Number(nearbyLat)}) * (l.latitude - ${Number(nearbyLat)}) + (l.longitude - ${Number(nearbyLng)}) * (l.longitude - ${Number(nearbyLng)})) ASC, l.is_top DESC `;
  }
  const rows = db
    .prepare(`${listingBase} ${whereSql} ${order} LIMIT ? OFFSET ?`)
    .all(...params, Number(limit), offset);
  const favs = favoriteIdsFor(viewerId);
  return {
    items: rows.map((r) => mapListing(r, { favoriteIds: favs })),
    total: count,
    page: Number(page),
    limit: Number(limit),
    pages: Math.max(1, Math.ceil(count / Number(limit))),
  };
}

export { listingBase };
