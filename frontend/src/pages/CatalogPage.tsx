import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListingsApi, MetaApi } from '../services/api'
import type { City, Listing, ListingType } from '../types'
import { CardSkeleton, ListingCard } from '../components/ListingCard'
import { EmptyState, ErrorState, inputClass } from '../components/Layout'
import { SearchBar } from '../components/SearchBar'
import { CAR_BODIES, CLOTHING_SUBS, FREELANCE_CATS, FUELS, PROPERTY_TYPES, RENOVATIONS, TRANSMISSIONS, TYPE_LABEL } from '../utils/format'

const titles: Record<string, string> = {
  real_estate: 'Недвижимость',
  cars: 'Автомобили',
  freelance: 'Фриланс',
  clothing: 'Одежда',
}

export default function CatalogPage({ type, clothingCategory }: { type?: ListingType; clothingCategory?: string }) {
  const [params, setParams] = useSearchParams()
  const t = (type || (params.get('type') as ListingType) || undefined) as ListingType | undefined
  const [items, setItems] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const page = Number(params.get('page') || 1)
  const query = Object.fromEntries(params.entries())

  const filters = useMemo(
    () => ({ ...query, type: t, clothingCategory: clothingCategory || query.clothingCategory, page, limit: 12 }),
    [params.toString(), t, page, clothingCategory],
  )

  function set(k: string, v: string) {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }

  async function load() {
    setLoading(true)
    setErr(false)
    try {
      const { data } = await ListingsApi.list(filters)
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setErr(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [params.toString(), t, clothingCategory])

  useEffect(() => {
    MetaApi.cities().then((r) => setCities((r.data as { items: City[] }).items))
    MetaApi.carMeta().then((r) => setBrands((r.data as { brands: string[] }).brands)).catch(() => {})
  }, [])

  if (err) return <ErrorState onRetry={load} />

  const subLabel = (CLOTHING_SUBS[clothingCategory || ''] || []).find((s) => s.value === params.get('itemKind'))?.label
  const shopPage = Boolean(clothingCategory)

  const list = (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            {clothingCategory ? `${TYPE_LABEL[clothingCategory]}${subLabel ? ` · ${subLabel}` : ''}` : t ? titles[t] : 'Поиск'}
          </h1>
          <p className="text-sm text-muted">{total} объявлений</p>
        </div>
        <div className="sm:w-80">
          <SearchBar initial={params.get('q') || ''} type={t} />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((it) => (
            <ListingCard key={it.id} item={it} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => set('page', String(i + 1))}
              className={`h-10 w-10 rounded-full font-bold ${page === i + 1 ? 'bg-primary text-white' : 'bg-white'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  )

  if (shopPage) return list

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="order-2 h-fit space-y-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)] lg:order-1">
        <h2 className="font-extrabold">Фильтры</h2>
        <select className={inputClass} value={params.get('cityId') || ''} onChange={(e) => set('cityId', e.target.value)}>
          <option value="">Город</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ru}
            </option>
          ))}
        </select>
        <input className={inputClass} placeholder="Цена от" value={params.get('minPrice') || ''} onChange={(e) => set('minPrice', e.target.value)} />
        <input className={inputClass} placeholder="Цена до" value={params.get('maxPrice') || ''} onChange={(e) => set('maxPrice', e.target.value)} />

        {t === 'real_estate' && (
          <>
            <select className={inputClass} value={params.get('dealType') || ''} onChange={(e) => set('dealType', e.target.value)}>
              <option value="">Продажа / Аренда</option>
              <option value="sale">Продажа</option>
              <option value="rent">Аренда</option>
            </select>
            <select className={inputClass} value={params.get('propertyType') || ''} onChange={(e) => set('propertyType', e.target.value)}>
              <option value="">Тип недвижимости</option>
              {PROPERTY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select className={inputClass} value={params.get('rooms') || ''} onChange={(e) => set('rooms', e.target.value)}>
              <option value="">Комнаты</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Площадь от, м²" value={params.get('minArea') || ''} onChange={(e) => set('minArea', e.target.value)} />
            <select className={inputClass} value={params.get('renovation') || ''} onChange={(e) => set('renovation', e.target.value)}>
              <option value="">Ремонт</option>
              {RENOVATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Этаж" value={params.get('floor') || ''} onChange={(e) => set('floor', e.target.value)} />
          </>
        )}

        {t === 'cars' && (
          <>
            <select className={inputClass} value={params.get('brand') || ''} onChange={(e) => set('brand', e.target.value)}>
              <option value="">Марка</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Модель" value={params.get('model') || ''} onChange={(e) => set('model', e.target.value)} />
            <input className={inputClass} placeholder="Год от" value={params.get('yearFrom') || ''} onChange={(e) => set('yearFrom', e.target.value)} />
            <input className={inputClass} placeholder="Год до" value={params.get('yearTo') || ''} onChange={(e) => set('yearTo', e.target.value)} />
            <input className={inputClass} placeholder="Пробег до, км" value={params.get('mileageMax') || ''} onChange={(e) => set('mileageMax', e.target.value)} />
            <select className={inputClass} value={params.get('transmission') || ''} onChange={(e) => set('transmission', e.target.value)}>
              <option value="">Коробка</option>
              {TRANSMISSIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select className={inputClass} value={params.get('fuel') || ''} onChange={(e) => set('fuel', e.target.value)}>
              <option value="">Топливо</option>
              {FUELS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select className={inputClass} value={params.get('bodyType') || ''} onChange={(e) => set('bodyType', e.target.value)}>
              <option value="">Кузов</option>
              {CAR_BODIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </>
        )}

        {t === 'freelance' && (
          <>
            <select className={inputClass} value={params.get('serviceCategory') || ''} onChange={(e) => set('serviceCategory', e.target.value)}>
              <option value="">Категория</option>
              {FREELANCE_CATS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input className={inputClass} placeholder="Срок до, дни" value={params.get('maxDays') || ''} onChange={(e) => set('maxDays', e.target.value)} />
            <select className={inputClass} value={params.get('minRating') || ''} onChange={(e) => set('minRating', e.target.value)}>
              <option value="">Рейтинг от</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>
          </>
        )}
      </aside>

      <div className="order-1 lg:order-2">{list}</div>
    </div>
  )
}
