import clsx from 'clsx'

export function cn(...args: Parameters<typeof clsx>) {
  return clsx(args)
}

export function formatPrice(price?: number | null, currency = 'USD') {
  if (price == null) return '—'
  const symbol = currency === 'USD' ? '$' : currency === 'TJS' ? 'с.' : currency === 'RUB' ? '₽' : currency
  return `${Number(price).toLocaleString('ru-RU')} ${symbol}`
}

export function timeAgo(iso?: string | null) {
  if (!iso) return ''
  const t = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').getTime()
  const diff = Date.now() - t
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return `${m} мин. назад`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} ч. назад`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} дн. назад`
  return new Date(t).toLocaleDateString('ru-RU')
}

export function formatTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Квартиры' },
  { value: 'house', label: 'Дома' },
  { value: 'room', label: 'Комнаты' },
  { value: 'land', label: 'Земельные участки' },
  { value: 'commercial', label: 'Коммерческая' },
  { value: 'new_building', label: 'Новостройки' },
]

export const DEAL_TYPES = [
  { value: 'sale', label: 'Продажа' },
  { value: 'rent', label: 'Аренда' },
]

export const RENOVATIONS = ['евро', 'дизайнерский', 'хороший', 'косметический', 'черновая', 'без ремонта']

export const CAR_BODIES = ['седан', 'кроссовер', 'внедорожник', 'хэтчбек', 'универсал', 'минивэн', 'грузовик', 'мото', 'запчасти']
export const TRANSMISSIONS = ['автомат', 'механика', 'робот', 'вариатор']
export const FUELS = ['бензин', 'дизель', 'гибрид', 'электро', 'газ']
export const DRIVES = ['передний', 'задний', 'полный']
export const CONDITIONS = ['новое', 'отличное', 'хорошее', 'среднее', 'на запчасти']
export const CLOTHING_CONDITIONS = ['новое', 'отличное', 'хорошее', 'среднее']

export const FREELANCE_CATS = [
  { value: 'programming', label: 'Программирование' },
  { value: 'design', label: 'Дизайн' },
  { value: 'smm', label: 'SMM' },
  { value: 'translation', label: 'Переводы' },
  { value: 'copywriting', label: 'Копирайтинг' },
  { value: 'video', label: 'Видео/монтаж' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'other', label: 'Другое' },
]

export const REPORT_REASONS = [
  { value: 'fraud', label: 'Мошенничество' },
  { value: 'wrong_info', label: 'Неверная информация' },
  { value: 'forbidden', label: 'Запрещённый товар' },
  { value: 'duplicate', label: 'Дубликат' },
  { value: 'other', label: 'Другое' },
]

export const CLOTHING_NAV = [
  { to: '/men', label: 'Мужская одежда', category: 'men', emoji: '👔' },
  { to: '/women', label: 'Женская одежда', category: 'women', emoji: '👗' },
  { to: '/kids', label: 'Детская', category: 'kids', emoji: '🧒' },
  { to: '/shoes', label: 'Обувь', category: 'shoes', emoji: '👟' },
  { to: '/electronics', label: 'Электроника', category: 'electronics', emoji: '📱' },
  { to: '/home', label: 'Для дома', category: 'home', emoji: '🏠' },
  { to: '/beauty', label: 'Красота', category: 'beauty', emoji: '💄' },
  { to: '/sport', label: 'Спорт', category: 'sport', emoji: '⚽' },
]

export const CLOTHING_CATS = [
  { value: 'men', label: 'Мужская одежда' },
  { value: 'women', label: 'Женская одежда' },
  { value: 'kids', label: 'Детская' },
  { value: 'shoes', label: 'Обувь' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'home', label: 'Для дома' },
  { value: 'beauty', label: 'Красота' },
  { value: 'sport', label: 'Спорт' },
]

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '32', '34', '36', '37', '38', '39', '40', '41', '42', '43', '44', '110', '116', '122', '128', '5-6 лет']
export const CLOTHING_SEASONS = ['лето', 'зима', 'осень', 'весна', 'демисезон']
export const CLOTHING_SUBS: Record<string, { value: string; label: string; emoji: string }[]> = {
  men: [
    { value: 'куртка', label: 'Куртки', emoji: '🧥' },
    { value: 'джинсы', label: 'Джинсы', emoji: '👖' },
    { value: 'футболка', label: 'Футболки', emoji: '👕' },
    { value: 'рубашка', label: 'Рубашки', emoji: '👔' },
    { value: 'брюки', label: 'Брюки', emoji: '👖' },
    { value: 'костюм', label: 'Костюмы', emoji: '🤵' },
    { value: 'спорт', label: 'Спортивная', emoji: '🏃' },
    { value: 'худи', label: 'Худи', emoji: '🧥' },
  ],
  women: [
    { value: 'платье', label: 'Платья', emoji: '👗' },
    { value: 'пальто', label: 'Пальто', emoji: '🧥' },
    { value: 'блузка', label: 'Блузки', emoji: '👚' },
    { value: 'юбка', label: 'Юбки', emoji: '👗' },
    { value: 'джинсы', label: 'Джинсы', emoji: '👖' },
    { value: 'куртка', label: 'Куртки', emoji: '🧥' },
    { value: 'костюм', label: 'Костюмы', emoji: '👜' },
    { value: 'хиджаб', label: 'Хиджаб', emoji: '🧕' },
  ],
  kids: [
    { value: 'костюм', label: 'Костюмы', emoji: '🧸' },
    { value: 'куртка', label: 'Куртки', emoji: '🧥' },
    { value: 'для мальчиков', label: 'Мальчикам', emoji: '👦' },
    { value: 'для девочек', label: 'Девочкам', emoji: '👧' },
    { value: 'для малышей', label: 'Малышам', emoji: '👶' },
    { value: 'школа', label: 'Школьная', emoji: '🎒' },
    { value: 'спорт', label: 'Спортивная', emoji: '⚽' },
    { value: 'пижама', label: 'Пижамы', emoji: '🌙' },
  ],
  shoes: [
    { value: 'кроссовки', label: 'Кроссовки', emoji: '👟' },
    { value: 'туфли', label: 'Туфли', emoji: '👠' },
    { value: 'ботинки', label: 'Ботинки', emoji: '🥾' },
    { value: 'сапоги', label: 'Сапоги', emoji: '👢' },
    { value: 'сандалии', label: 'Сандалии', emoji: '🩴' },
    { value: 'кеды', label: 'Кеды', emoji: '👟' },
    { value: 'домашние', label: 'Домашние', emoji: '🥿' },
    { value: 'детская обувь', label: 'Детская', emoji: '👶' },
  ],
  electronics: [
    { value: 'телефон', label: 'Телефоны', emoji: '📱' },
    { value: 'наушники', label: 'Наушники', emoji: '🎧' },
    { value: 'ноутбук', label: 'Ноутбуки', emoji: '💻' },
    { value: 'телевизор', label: 'ТВ', emoji: '📺' },
    { value: 'планшет', label: 'Планшеты', emoji: '📲' },
    { value: 'часы', label: 'Смарт-часы', emoji: '⌚' },
    { value: 'колонка', label: 'Колонки', emoji: '🔊' },
    { value: 'зарядка', label: 'Зарядки', emoji: '🔌' },
  ],
  home: [
    { value: 'мебель', label: 'Мебель', emoji: '🛋️' },
    { value: 'кухня', label: 'Кухня', emoji: '🍳' },
    { value: 'декор', label: 'Декор', emoji: '🖼️' },
    { value: 'текстиль', label: 'Текстиль', emoji: '🛏️' },
    { value: 'свет', label: 'Освещение', emoji: '💡' },
    { value: 'уборка', label: 'Уборка', emoji: '🧹' },
    { value: 'посуда', label: 'Посуда', emoji: '🍽️' },
    { value: 'хранение', label: 'Хранение', emoji: '📦' },
  ],
  beauty: [
    { value: 'уход', label: 'Уход', emoji: '🧴' },
    { value: 'макияж', label: 'Макияж', emoji: '💄' },
    { value: 'парфюм', label: 'Парфюм', emoji: '🌸' },
    { value: 'волосы', label: 'Волосы', emoji: '💇' },
    { value: 'маникюр', label: 'Маникюр', emoji: '💅' },
    { value: 'для лица', label: 'Для лица', emoji: '✨' },
    { value: 'для тела', label: 'Для тела', emoji: '🛁' },
    { value: 'инструменты', label: 'Инструменты', emoji: '🪞' },
  ],
  sport: [
    { value: 'тренажёр', label: 'Тренажёры', emoji: '🏋️' },
    { value: 'велосипед', label: 'Велосипеды', emoji: '🚲' },
    { value: 'мяч', label: 'Мячи', emoji: '⚽' },
    { value: 'йога', label: 'Йога', emoji: '🧘' },
    { value: 'форма', label: 'Форма', emoji: '👕' },
    { value: 'рюкзак', label: 'Рюкзаки', emoji: '🎒' },
    { value: 'ролики', label: 'Ролики', emoji: '🛼' },
    { value: 'туризм', label: 'Туризм', emoji: '⛺' },
  ],
}

export const TYPE_LABEL: Record<string, string> = {
  real_estate: 'Недвижимость',
  cars: 'Авто',
  freelance: 'Фриланс',
  clothing: 'Одежда',
  men: 'Мужская одежда',
  women: 'Женская одежда',
  kids: 'Детская',
  shoes: 'Обувь',
  electronics: 'Электроника',
  home: 'Для дома',
  beauty: 'Красота',
  sport: 'Спорт',
}

export const STATUS_LABEL: Record<string, string> = {
  pending: 'На проверке',
  active: 'Активные',
  paused: 'Приостановлено',
  completed: 'Завершённые',
  archived: 'Архив',
  rejected: 'Отклонено',
}
