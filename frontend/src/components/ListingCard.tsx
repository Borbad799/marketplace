import { Heart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Listing } from '../types'
import { formatPrice } from '../utils/format'
import { useAuth, useUi } from '../store/auth'
import { FavoritesApi } from '../services/api'
import { useState } from 'react'
import { Photo } from './Photo'
import { listingCover, listingCoverFallback } from '../utils/listingPhoto'

export function Stars({ value = 0, size = 14 }: { value?: number; size?: number }) {
  const full = Math.round(value)
  return (
    <span className="inline-flex items-center gap-0.5 text-warning">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < full ? 'currentColor' : 'none'} className={i < full ? '' : 'text-line'} />
      ))}
    </span>
  )
}

export function ListingCard({ item, onChange, photoUrl }: { item: Listing; onChange?: (id: number, fav: boolean) => void; photoUrl?: string }) {
  const user = useAuth((s) => s.user)
  const toast = useUi((s) => s.toast)
  const [fav, setFav] = useState(Boolean(item.favorited))

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast('Войдите, чтобы сохранить', 'err')
      return
    }
    try {
      const { data } = await FavoritesApi.toggle(item.id)
      setFav(data.favorited)
      onChange?.(item.id, data.favorited)
    } catch (err) {
      toast((err as Error).message, 'err')
    }
  }

  const sub =
    item.type === 'real_estate' && item.realEstate
      ? `${item.realEstate.rooms || '—'} комн. • ${item.realEstate.area || '—'} м² • ${item.realEstate.floor || '—'} этаж`
      : item.type === 'cars' && item.car
        ? `${item.car.year} • ${item.car.mileage?.toLocaleString('ru-RU')} км • ${item.car.transmission}`
        : item.type === 'freelance' && item.freelance
          ? `Выполню за ${item.freelance.deliveryDays} дн.`
          : item.type === 'clothing' && item.clothing
            ? [item.clothing.size, item.clothing.brand, item.clothing.condition].filter(Boolean).join(' • ')
          : item.district || ''

  return (
    <Link
      to={`/listings/${item.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        <Photo
          src={photoUrl || listingCover(item)}
          alt={item.title}
          fallbackSrc={listingCoverFallback(item)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1">
          {item.isTop && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">TOP</span>}
          {item.isVip && <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-white">VIP</span>}
        </div>
        <button
          onClick={toggle}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
          aria-label="Избранное"
        >
          <Heart size={18} className={fav ? 'fill-primary text-primary' : 'text-ink'} />
        </button>
      </div>
      <div className="space-y-1.5 p-3.5">
        <div className="text-lg font-extrabold tracking-tight text-primary">{item.type === 'freelance' ? `От ${formatPrice(item.price, item.currency)}` : formatPrice(item.price, item.currency)}</div>
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug">{item.title}</h3>
        <p className="truncate text-sm text-muted">
          {item.city}
          {item.district ? `, ${item.district}` : ''}
        </p>
        {item.seller?.rating ? (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Stars value={item.seller.rating} />
            <span>{item.seller.rating}</span>
          </div>
        ) : null}
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
      <div className="aspect-[4/3] animate-pulse bg-line" />
      <div className="space-y-2 p-3.5">
        <div className="h-5 w-24 animate-pulse rounded bg-line" />
        <div className="h-4 w-full animate-pulse rounded bg-line" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
      </div>
    </div>
  )
}
