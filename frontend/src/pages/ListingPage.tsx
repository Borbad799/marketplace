import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Gallery } from '../components/Gallery'
import { MapView } from '../components/MapView'
import { ErrorState, inputClass } from '../components/Layout'
import { Stars } from '../components/ListingCard'
import { Avatar } from '../components/Avatar'
import { ListingsApi, MessagesApi, PromoApi, ReportsApi, ReviewsApi } from '../services/api'
import { useAuth, useUi } from '../store/auth'
import type { Listing } from '../types'
import { formatPrice, REPORT_REASONS, timeAgo, TYPE_LABEL } from '../utils/format'
import { photoForListing } from '../utils/shopPhotos'
import { Flag, Heart, MessageCircle, Phone, Share2 } from 'lucide-react'
import { FavoritesApi } from '../services/api'

export default function ListingPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Listing | null>(null)
  const [err, setErr] = useState(false)
  const [report, setReport] = useState(false)
  const [promo, setPromo] = useState(false)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const user = useAuth((s) => s.user)
  const toast = useUi((s) => s.toast)
  const nav = useNavigate()

  async function load() {
    setErr(false)
    try {
      const { data } = await ListingsApi.one(id!)
      setItem(data.item)
    } catch {
      setErr(true)
    }
  }
  useEffect(() => {
    load()
  }, [id])

  if (err) return <ErrorState onRetry={load} />
  if (!item) return <div className="h-80 animate-pulse rounded-3xl bg-line" />

  const kindPhoto = photoForListing(item)
  const images = (item.media || [])
    .filter((m) => m.type === 'image')
    .map((_, i) => photoForListing(item, i))
    .filter(Boolean)
  const video = (item.media || []).find((m) => m.type === 'video')?.url || item.videoUrl
  const mine = user?.id === item.userId

  async function chat() {
    if (!user) return nav('/login')
    try {
      const { data } = await MessagesApi.start(item!.id)
      nav(`/messages/${(data as { item: { id: number } }).item.id}`)
    } catch (e) {
      toast((e as Error).message, 'err')
    }
  }

  async function fav() {
    if (!user) return nav('/login')
    const { data } = await FavoritesApi.toggle(item!.id)
    setItem({ ...item!, favorited: data.favorited })
  }

  async function buy(type: string) {
    try {
      await PromoApi.buy(item!.id, type)
      toast('Продвижение активировано')
      load()
    } catch (e) {
      toast((e as Error).message, 'err')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <Gallery images={images} videoUrl={video} fallbackSrc={kindPhoto} />
        <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-extrabold">Описание</h2>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink/80">{item.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {item.realEstate && (
              <>
                <Spec k="Тип" v={item.realEstate.propertyType} />
                <Spec k="Сделка" v={item.realEstate.dealType === 'rent' ? 'Аренда' : 'Продажа'} />
                <Spec k="Комнаты" v={item.realEstate.rooms} />
                <Spec k="Площадь" v={item.realEstate.area ? `${item.realEstate.area} м²` : '—'} />
                <Spec k="Этаж" v={`${item.realEstate.floor || '—'} / ${item.realEstate.floors || '—'}`} />
                <Spec k="Ремонт" v={item.realEstate.renovation} />
                <Spec k="Мебель" v={item.realEstate.furniture ? 'Есть' : 'Нет'} />
              </>
            )}
            {item.car && (
              <>
                <Spec k="Марка" v={`${item.car.brand} ${item.car.model}`} />
                <Spec k="Год" v={item.car.year} />
                <Spec k="Пробег" v={`${item.car.mileage?.toLocaleString('ru-RU')} км`} />
                <Spec k="Кузов" v={item.car.bodyType} />
                <Spec k="Двигатель" v={`${item.car.engine}, ${item.car.engineVolume} л`} />
                <Spec k="Коробка" v={item.car.transmission} />
                <Spec k="Привод" v={item.car.drive} />
                <Spec k="Топливо" v={item.car.fuel} />
                <Spec k="Цвет" v={item.car.color} />
                <Spec k="Состояние" v={item.car.condition} />
              </>
            )}
            {item.freelance && (
              <>
                <Spec k="Категория" v={item.freelance.serviceCategory} />
                <Spec k="Срок" v={`${item.freelance.deliveryDays} дн.`} />
                <Spec k="Тип услуги" v={item.freelance.serviceType} />
              </>
            )}
            {item.clothing && (
              <>
                <Spec k="Раздел" v={TYPE_LABEL[item.clothing.clothingCategory || ''] || item.clothing.clothingCategory} />
                <Spec k="Вид" v={item.clothing.itemKind} />
                <Spec k="Размер" v={item.clothing.size} />
                <Spec k="Бренд" v={item.clothing.brand} />
                <Spec k="Цвет" v={item.clothing.color} />
                <Spec k="Сезон" v={item.clothing.season} />
                <Spec k="Состояние" v={item.clothing.condition} />
              </>
            )}
          </div>
        </div>
        {item.latitude && (
          <div className="rounded-3xl bg-white p-3 shadow-[var(--shadow-card)]">
            <MapView items={[item]} center={[item.latitude, item.longitude!]} zoom={13} height={260} />
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
        <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex gap-2">
            {item.isTop && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">TOP</span>}
            {item.isVip && <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">VIP</span>}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="mt-2 text-3xl font-extrabold text-primary">{item.type === 'freelance' ? `От ${formatPrice(item.price, item.currency)}` : formatPrice(item.price, item.currency)}</div>
          <p className="mt-2 text-sm text-muted">
            {item.city}
            {item.district ? `, ${item.district}` : ''} {item.address ? `· ${item.address}` : ''}
          </p>
          <p className="mt-1 text-xs text-muted">
            {timeAgo(item.publishedAt || item.createdAt)} · {item.views} просмотров
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {item.type === 'freelance' ? (
              <button onClick={chat} className="col-span-2 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary-dark">
                Заказать
              </button>
            ) : (
              <button onClick={chat} className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary-dark">
                <MessageCircle size={18} /> Написать
              </button>
            )}
            {item.seller?.phone && (
              <a href={`tel:${item.seller.phone}`} className="flex items-center justify-center gap-2 rounded-2xl bg-success py-3 font-bold text-white">
                <Phone size={18} /> Позвонить
              </a>
            )}
            <button onClick={fav} className="flex items-center justify-center gap-2 rounded-2xl bg-bg py-3 font-bold">
              <Heart size={18} className={item.favorited ? 'fill-primary text-primary' : ''} /> В избранное
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast('Ссылка скопирована')
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-bg py-3 font-bold"
            >
              <Share2 size={18} /> Поделиться
            </button>
          </div>
          <button onClick={() => setReport(true)} className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-muted">
            <Flag size={14} /> Пожаловаться
          </button>
        </div>

        <Link to={`/users/${item.userId}`} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)]">
          <Avatar src={item.seller?.avatar} name={item.seller?.name} className="h-14 w-14 text-base" />
          <div>
            <div className="font-bold">{item.seller?.name}</div>
            <div className="flex items-center gap-1 text-sm text-muted">
              <Stars value={item.seller?.rating} /> {item.seller?.rating} · {item.seller?.reviewsCount} отзывов
            </div>
          </div>
        </Link>

        {mine && item.status === 'active' && (
          <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)]">
            <h3 className="font-bold">Продвижение</h3>
            <div className="mt-3 space-y-2 text-sm">
              <button onClick={() => buy('bump')} className="w-full rounded-2xl bg-bg px-3 py-3 text-left font-semibold">🚀 Поднять — 10 сомони</button>
              <button onClick={() => buy('vip')} className="w-full rounded-2xl bg-bg px-3 py-3 text-left font-semibold">⭐ VIP — 20 сомони</button>
              <button onClick={() => buy('top')} className="w-full rounded-2xl bg-bg px-3 py-3 text-left font-semibold">🔥 TOP — 30 сомони</button>
            </div>
          </div>
        )}

        {mine && (
          <Link to={`/listings/${item.id}/edit`} className="block rounded-2xl bg-ink py-3 text-center font-bold text-white">
            Редактировать
          </Link>
        )}

        {user && !mine && (
          <form
            className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] space-y-2"
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                await ReviewsApi.create({ toUserId: item.userId, listingId: item.id, ...review })
                toast('Отзыв отправлен')
                load()
              } catch (er) {
                toast((er as Error).message, 'err')
              }
            }}
          >
            <h3 className="font-bold">Оставить отзыв</h3>
            <select className={inputClass} value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Комментарий" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
            <button className="w-full rounded-2xl bg-primary py-3 font-bold text-white">Отправить</button>
          </form>
        )}
      </aside>

      {report && (
        <Modal title="Пожаловаться" onClose={() => setReport(false)}>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              className="w-full rounded-2xl bg-bg px-4 py-3 text-left font-semibold"
              onClick={async () => {
                if (!user) return nav('/login')
                await ReportsApi.create({ listingId: item.id, reason: r.value })
                setReport(false)
                toast('Жалоба отправлена')
              }}
            >
              {r.label}
            </button>
          ))}
        </Modal>
      )}
    </div>
  )
}

function Spec({ k, v }: { k: string; v?: string | number | null }) {
  return (
    <div className="rounded-2xl bg-bg px-3 py-2">
      <div className="text-xs text-muted">{k}</div>
      <div className="font-semibold capitalize">{v || '—'}</div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md space-y-2 rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-extrabold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function NearbyPage() {
  const [items, setItems] = useState<Listing[]>([])
  const nav = useNavigate()
  useEffect(() => {
    ListingsApi.list({ lat: 38.5598, lng: 68.787, limit: 50 }).then((r) => setItems(r.data.items))
  }, [])
  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Объявления на карте</h1>
      <MapView items={items} height={520} onSelect={(id) => nav(`/listings/${id}`)} />
    </div>
  )
}
