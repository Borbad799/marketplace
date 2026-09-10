import { useEffect, useRef, useState } from 'react'
import { Search, MapPin, Tag, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MetaApi } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import type { Category, City, Listing } from '../types'
import { TYPE_LABEL } from '../utils/format'
import { Photo } from './Photo'
import { listingCover } from '../utils/listingPhoto'

type Suggest = { listings: Listing[]; cities: City[]; categories: Category[] }

export function SearchBar({ large = false, initial = '', type }: { large?: boolean; initial?: string; type?: string }) {
  const [q, setQ] = useState(initial)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Suggest>({ listings: [], cities: [], categories: [] })
  const debounced = useDebounce(q, 200)
  const nav = useNavigate()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!debounced.trim()) {
      setData({ listings: [], cities: [], categories: [] })
      return
    }
    MetaApi.suggest(debounced).then((r) => setData(r.data as Suggest)).catch(() => {})
  }, [debounced])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function go(query = q, extra: Record<string, string> = {}) {
    const params = new URLSearchParams({ q: query, ...extra })
    if (type) params.set('type', type)
    nav(`/search?${params.toString()}`)
    setOpen(false)
  }

  const has = data.listings.length + data.cities.length + data.categories.length > 0

  return (
    <div ref={box} className={`relative ${large ? 'w-full' : 'w-full max-w-md'}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go()
        }}
        className={`flex items-center gap-2 rounded-2xl ${large ? 'h-14 bg-bg px-4' : 'h-11 bg-white px-3 shadow-[var(--shadow-card)]'}`}
      >
        <Search className="shrink-0 text-muted" size={large ? 22 : 18} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Что вы ищете?"
          className="h-full w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} className="text-muted">
            <X size={16} />
          </button>
        )}
      </form>
      {open && has && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl bg-white py-2 shadow-[var(--shadow-soft)]">
          {data.categories.map((c) => (
            <button key={`c${c.id}`} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg" onClick={() => go(c.name, { type: c.type })}>
              <Tag size={16} className="text-primary" />
              <span>
                {c.name} <span className="text-xs text-muted">{TYPE_LABEL[c.type]}</span>
              </span>
            </button>
          ))}
          {data.cities.map((c) => (
            <button key={`city${c.id}`} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg" onClick={() => go('', { cityId: String(c.id) })}>
              <MapPin size={16} className="text-primary" />
              <span>{c.name_ru}</span>
            </button>
          ))}
          {data.listings.map((l) => (
            <button key={l.id} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg" onClick={() => nav(`/listings/${l.id}`)}>
              <Photo src={listingCover(l)} alt={l.title} className="h-10 w-10 rounded-lg object-cover bg-line" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{l.title}</span>
                <span className="text-xs text-muted">
                  {TYPE_LABEL[l.type]} · {l.city}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
