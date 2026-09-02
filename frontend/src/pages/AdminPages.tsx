import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AdminApi } from '../services/api'
import { useAuth } from '../store/auth'
import { inputClass } from '../components/Layout'
import { STATUS_LABEL, TYPE_LABEL } from '../utils/format'

function AdminGate({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  if (!ready) return <div className="p-10">Загрузка…</div>
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="p-10 text-center">
        <p>Только для администратора.</p>
        <Link to="/login" className="font-bold text-primary">Войти</Link>
      </div>
    )
  }
  return <>{children}</>
}

const nav = [
  ['/admin', 'Обзор'],
  ['/admin/users', 'Пользователи'],
  ['/admin/listings', 'Объявления'],
  ['/admin/reports', 'Жалобы'],
  ['/admin/messages', 'Сообщения'],
  ['/admin/payments', 'Платежи'],
  ['/admin/banners', 'Баннеры'],
  ['/admin/cities', 'Города'],
  ['/admin/categories', 'Категории'],
  ['/admin/settings', 'Настройки'],
]

export function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-white px-4 py-3">
          <Link to="/" className="font-extrabold text-primary">ARZON MARKET</Link>
          <span className="font-bold">Admin</span>
          <nav className="ml-4 flex flex-1 gap-1 overflow-x-auto no-scrollbar text-sm font-semibold">
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 ${isActive ? 'bg-primary text-white' : 'hover:bg-bg'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </div>
    </AdminGate>
  )
}

export function AdminHome() {
  const [s, setS] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    AdminApi.stats().then((r) => setS(r.data as Record<string, number>))
  }, [])
  if (!s) return <div className="h-40 animate-pulse rounded-3xl bg-line" />
  const cards = [
    ['Пользователи', s.users],
    ['Объявления', s.listings],
    ['Недвижимость', s.realEstate],
    ['Авто', s.cars],
    ['Одежда', s.clothing],
    ['Фриланс', s.freelance],
    ['Жалобы', s.reports],
    ['На проверке', s.pending],
    ['Платежи, с.', s.payments],
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(([k, v]) => (
        <div key={k as string} className="rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="text-sm text-muted">{k}</div>
          <div className="mt-1 text-3xl font-extrabold">{Number(v).toLocaleString('ru-RU')}</div>
        </div>
      ))}
    </div>
  )
}

export function AdminUsers() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<{ id: number; name: string; email?: string; phone?: string; role: string; status: string }[]>([])
  async function load() {
    const { data } = await AdminApi.users(q)
    setItems((data as { items: typeof items }).items)
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <div>
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); load() }}>
        <input className={inputClass} placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="rounded-2xl bg-primary px-4 font-bold text-white">Найти</button>
      </form>
      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted">{['ID','Имя','Email','Телефон','Роль','Статус',''].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="p-3">{u.id}</td>
                <td className="p-3 font-semibold">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">
                  <select defaultValue={u.role} onChange={(e) => AdminApi.role(u.id, e.target.value)} className="rounded-lg border border-line px-2 py-1">
                    <option>user</option><option>moderator</option><option>admin</option>
                  </select>
                </td>
                <td className="p-3">{u.status}</td>
                <td className="p-3 space-x-2">
                  <button className="font-bold text-primary" onClick={async () => { await AdminApi.blockUser(u.id); load() }}>Block</button>
                  <button className="font-bold" onClick={async () => { await AdminApi.deleteUser(u.id); load() }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminListings() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState<{ id: number; title: string; type: string; status: string; seller?: { name: string } }[]>([])
  async function load(s = status) {
    const { data } = await AdminApi.listings({ status: s })
    setItems((data as { items: typeof items }).items)
  }
  useEffect(() => { load() }, [status])
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {['pending', 'active', 'rejected', 'paused'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-2 text-sm font-bold ${status === s ? 'bg-primary text-white' : 'bg-white'}`}>{STATUS_LABEL[s] || s}</button>
        ))}
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4">
            <div className="flex-1">
              <Link to={`/listings/${it.id}`} className="font-bold">{it.title}</Link>
              <div className="text-xs text-muted">{TYPE_LABEL[it.type]} · {it.seller?.name}</div>
            </div>
            <button className="rounded-full bg-success px-3 py-1 text-sm font-bold text-white" onClick={async () => { await AdminApi.approve(it.id); load() }}>Approve</button>
            <button className="rounded-full bg-warning px-3 py-1 text-sm font-bold" onClick={async () => { await AdminApi.reject(it.id, 'Не соответствует правилам'); load() }}>Reject</button>
            <Link to={`/listings/${it.id}/edit`} className="rounded-full bg-bg px-3 py-1 text-sm font-bold">Edit</Link>
            <button className="rounded-full bg-bg px-3 py-1 text-sm font-bold text-primary" onClick={async () => { await AdminApi.deleteListing(it.id); load() }}>Delete</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted">Нет объявлений в этом статусе.</p>}
      </div>
    </div>
  )
}

export function AdminReports() {
  const [items, setItems] = useState<{ id: number; listingTitle: string; listingId: number; reporterName: string; reason: string; status: string }[]>([])
  async function load() {
    const { data } = await AdminApi.reports()
    setItems((data as { items: typeof items }).items)
  }
  useEffect(() => { load() }, [])
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white p-4">
          <div className="font-bold">{r.listingTitle}</div>
          <div className="text-sm text-muted">{r.reason} · {r.reporterName} · {r.status}</div>
          <div className="mt-2 flex gap-2">
            <Link to={`/listings/${r.listingId}`} className="text-sm font-bold text-primary">Открыть</Link>
            <button className="text-sm font-bold" onClick={async () => { await AdminApi.resolveReport(r.id, 'resolved'); load() }}>Resolve</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminTablePage({ kind }: { kind: 'messages' | 'payments' | 'banners' | 'cities' | 'categories' | 'settings' }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  async function load() {
    if (kind === 'messages') setItems(((await AdminApi.messages()).data as { items: typeof items }).items)
    if (kind === 'payments') setItems(((await AdminApi.payments()).data as { items: typeof items }).items)
    if (kind === 'banners') setItems(((await AdminApi.banners()).data as { items: typeof items }).items)
    if (kind === 'cities') setItems(((await AdminApi.cities()).data as { items: typeof items }).items)
    if (kind === 'categories') setItems(((await AdminApi.categories()).data as { items: typeof items }).items)
    if (kind === 'settings') setForm(((await AdminApi.settings()).data as { items: Record<string, string> }).items)
  }
  useEffect(() => { load() }, [kind])

  if (kind === 'settings') {
    return (
      <form className="max-w-lg space-y-3" onSubmit={async (e) => { e.preventDefault(); await AdminApi.saveSettings(form); }}>
        {Object.entries(form).map(([k, v]) => (
          <label key={k} className="block">
            <span className="text-sm font-semibold">{k}</span>
            <input className={inputClass} value={v} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </label>
        ))}
        <button className="rounded-2xl bg-primary px-4 py-3 font-bold text-white">Сохранить</button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {(kind === 'banners' || kind === 'cities' || kind === 'categories') && (
        <form
          className="grid gap-2 rounded-2xl bg-white p-4 md:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (kind === 'banners') await AdminApi.saveBanner({ title: form.title, imageUrl: form.imageUrl, link: form.link })
            if (kind === 'cities') await AdminApi.saveCity({ name: form.name, nameRu: form.nameRu || form.name, latitude: form.latitude, longitude: form.longitude })
            if (kind === 'categories') await AdminApi.saveCategory({ slug: form.slug, name: form.name, type: form.type, icon: form.icon })
            setForm({})
            load()
          }}
        >
          {kind === 'banners' && (
            <>
              <input className={inputClass} placeholder="Заголовок" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className={inputClass} placeholder="Image URL" value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              <input className={inputClass} placeholder="Ссылка" value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </>
          )}
          {kind === 'cities' && (
            <>
              <input className={inputClass} placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inputClass} placeholder="На русском" value={form.nameRu || ''} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
              <input className={inputClass} placeholder="Lat" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              <input className={inputClass} placeholder="Lng" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </>
          )}
          {kind === 'categories' && (
            <>
              <input className={inputClass} placeholder="slug" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <input className={inputClass} placeholder="Название" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inputClass} placeholder="type" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              <input className={inputClass} placeholder="icon" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </>
          )}
          <button className="rounded-2xl bg-primary font-bold text-white">Добавить</button>
        </form>
      )}
      <div className="overflow-x-auto rounded-3xl bg-white p-3 text-sm">
        <pre className="whitespace-pre-wrap">{JSON.stringify(items.slice(0, 40), null, 2)}</pre>
      </div>
    </div>
  )
}

export function AdminPlaceholder() {
  const nav = useNavigate()
  useEffect(() => { nav('/admin') }, [nav])
  return null
}
