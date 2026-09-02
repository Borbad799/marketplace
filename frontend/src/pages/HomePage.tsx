import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { CardSkeleton, ListingCard } from '../components/ListingCard'
import { EmptyState, ErrorState } from '../components/Layout'
import { ListingsApi } from '../services/api'
import type { Listing } from '../types'
import { MapView } from '../components/MapView'
import { useNavigate } from 'react-router-dom'

const cats = [
  { to: '/men', emoji: '👔', title: 'Мужская одежда', sub: 'Куртки, джинсы, футболки' },
  { to: '/women', emoji: '👗', title: 'Женская одежда', sub: 'Платья, пальто, блузки' },
  { to: '/kids', emoji: '🧒', title: 'Детская', sub: 'Для мальчиков и девочек' },
  { to: '/shoes', emoji: '👟', title: 'Обувь', sub: 'Кроссовки, туфли, ботинки' },
  { to: '/electronics', emoji: '📱', title: 'Электроника', sub: 'Телефоны, ТВ, ноутбуки' },
  { to: '/home', emoji: '🏠', title: 'Для дома', sub: 'Мебель, кухня, декор' },
  { to: '/beauty', emoji: '💄', title: 'Красота', sub: 'Уход, макияж, парфюм' },
  { to: '/sport', emoji: '⚽', title: 'Спорт', sub: 'Тренажёры, велосипеды' },
]

export default function HomePage() {
  const [popular, setPopular] = useState<Listing[]>([])
  const [re, setRe] = useState<Listing[]>([])
  const [cars, setCars] = useState<Listing[]>([])
  const [fl, setFl] = useState<Listing[]>([])
  const [cl, setCl] = useState<Listing[]>([])
  const [nearby, setNearby] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const nav = useNavigate()

  async function load() {
    setErr(false)
    setLoading(true)
    try {
      const [p, a, b, c, d, n] = await Promise.all([
        ListingsApi.popular(),
        ListingsApi.list({ type: 'real_estate', limit: 4 }),
        ListingsApi.list({ type: 'cars', limit: 4 }),
        ListingsApi.list({ type: 'freelance', limit: 4 }),
        ListingsApi.list({ type: 'clothing', limit: 4 }),
        ListingsApi.list({ lat: 38.5598, lng: 68.787, limit: 30 }),
      ])
      setPopular(p.data.items)
      setRe(a.data.items)
      setCars(b.data.items)
      setFl(c.data.items)
      setCl(d.data.items)
      setNearby(n.data.items)
    } catch {
      setErr(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (err) return <ErrorState onRetry={load} />

  const Section = ({ title, to, items }: { title: string; to: string; items: Listing[] }) => (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <Link to={to} className="text-sm font-bold text-primary">
          Смотреть все
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((it) => (
            <ListingCard key={it.id} item={it} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  )

  return (
    <div>
      <section className="rounded-[28px] bg-white px-5 py-8 shadow-[var(--shadow-card)] md:px-10 md:py-12">
        <p className="text-sm font-semibold text-primary">Маркетплейс Таджикистана</p>
        <h1 className="mt-1 max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">Найдите жильё, авто и специалистов рядом с вами</h1>
        <div className="mt-6 max-w-2xl">
          <SearchBar large />
        </div>
        <p className="mt-3 text-sm text-muted">Например: Квартира в Душанбе · Toyota Camry · Дизайнер логотипа</p>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cats.map((c) => (
            <Link key={c.to} to={c.to} className="flex items-center gap-4 rounded-2xl bg-bg px-4 py-4 transition hover:bg-primary/5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">{c.emoji}</span>
              <span>
                <span className="block font-bold">{c.title}</span>
                <span className="text-sm text-muted">{c.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <Section title="🔥 Популярные объявления" to="/search" items={popular} />
      <Section title="👕 Одежда и обувь" to="/men" items={cl} />
      <Section title="🏠 Недвижимость" to="/real-estate" items={re} />
      <Section title="🚗 Автомобили" to="/cars" items={cars} />
      <Section title="💼 Фриланс" to="/freelance" items={fl} />
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-extrabold">📍 Объявления рядом</h2>
          <Link to="/nearby" className="text-sm font-bold text-primary">
            Карта
          </Link>
        </div>
        <MapView items={nearby} onSelect={(id) => nav(`/listings/${id}`)} />
      </section>
    </div>
  )
}
