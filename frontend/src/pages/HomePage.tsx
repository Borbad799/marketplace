import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { CardSkeleton, ListingCard } from '../components/ListingCard'
import { EmptyState, ErrorState } from '../components/Layout'
import { ListingsApi } from '../services/api'
import type { Listing } from '../types'
import { CLOTHING_NAV } from '../utils/format'
import { photosForListings } from '../utils/shopPhotos'

export default function HomePage() {
  const [popular, setPopular] = useState<Listing[]>([])
  const [re, setRe] = useState<Listing[]>([])
  const [cars, setCars] = useState<Listing[]>([])
  const [fl, setFl] = useState<Listing[]>([])
  const [cl, setCl] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  async function load() {
    setErr(false)
    setLoading(true)
    try {
      const [p, a, b, c, d] = await Promise.all([
        ListingsApi.popular(),
        ListingsApi.list({ type: 'real_estate', limit: 12 }),
        ListingsApi.list({ type: 'cars', limit: 12 }),
        ListingsApi.list({ type: 'freelance', limit: 12 }),
        ListingsApi.list({ type: 'clothing', limit: 12 }),
      ])
      setPopular(p.data.items)
      setRe(a.data.items)
      setCars(b.data.items)
      setFl(c.data.items)
      setCl(d.data.items)
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

  const Section = ({ title, to, items }: { title: string; to: string; items: Listing[] }) => {
    const photos = photosForListings(items)
    return (
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
            <ListingCard key={it.id} item={it} photoUrl={photos[it.id]} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
    )
  }

  return (
    <div>
      <section className="rounded-[28px] bg-white px-5 py-8 shadow-[var(--shadow-card)] md:px-10 md:py-12">
        <p className="text-sm font-semibold text-primary">Маркетплейс Таджикистана</p>
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight md:text-4xl">Найдите жильё, авто и специалистов рядом с вами</h1>
          <div className="w-full shrink-0 lg:max-w-md">
            <SearchBar large />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Например: Квартира в Душанбе · Toyota Camry · Дизайнер логотипа</p>
        <div className="mt-6 grid grid-cols-4 gap-1.5 sm:gap-2">
          {CLOTHING_NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="flex min-h-[64px] flex-col items-center justify-center rounded-md border border-line bg-bg px-1 py-2 text-center shadow-sm transition hover:border-primary/40 hover:shadow sm:min-h-[68px] sm:rounded-lg"
            >
              <span className="text-lg leading-none sm:text-xl">{l.emoji}</span>
              <span className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight sm:text-xs">{l.label}</span>
            </Link>
          ))}
        </div>
      </section>
      <Section title="🔥 Популярные объявления" to="/search" items={popular} />
      <Section title="👕 Одежда и обувь" to="/men" items={cl} />
      <Section title="🏠 Недвижимость" to="/real-estate" items={re} />
      <Section title="🚗 Автомобили" to="/cars" items={cars} />
      <Section title="💼 Фриланс" to="/freelance" items={fl} />
    </div>
  )
}
