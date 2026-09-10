import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FavoritesApi, ListingsApi, PromoApi, UploadApi, UsersApi } from '../services/api'
import { Avatar } from '../components/Avatar'
import { useAuth, useUi } from '../store/auth'
import { CardSkeleton, ListingCard, Stars } from '../components/ListingCard'
import { EmptyState, Field, Protected, inputClass, areaClass } from '../components/Layout'
import type { Listing, User } from '../types'
import { STATUS_LABEL, TYPE_LABEL } from '../utils/format'
import { Bell } from 'lucide-react'
import { NotifApi } from '../services/api'
import type { NotificationItem } from '../types'
import { Photo } from '../components/Photo'
import { photoForListing } from '../utils/shopPhotos'

export default function ProfilePage() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  return (
    <Protected>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
          <Avatar src={user?.avatar} name={user?.name} className="h-20 w-20 text-xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{user?.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Stars value={user?.rating} /> {user?.rating}
            </div>
          </div>
          {user?.role === 'admin' && (
            <Link to="/admin" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
              Админ
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/profile/listings" className="rounded-3xl bg-white p-4 font-bold shadow-[var(--shadow-card)]">Мои объявления</Link>
          <Link to="/favorites" className="rounded-3xl bg-white p-4 font-bold shadow-[var(--shadow-card)]">Избранное</Link>
          <Link to="/messages" className="rounded-3xl bg-white p-4 font-bold shadow-[var(--shadow-card)]">Сообщения</Link>
          <Link to="/notifications" className="rounded-3xl bg-white p-4 font-bold shadow-[var(--shadow-card)]">Уведомления</Link>
          <Link to="/profile/settings" className="rounded-3xl bg-white p-4 font-bold shadow-[var(--shadow-card)]">Настройки</Link>
          <button
            onClick={() => {
              logout()
              nav('/')
            }}
            className="rounded-3xl bg-white p-4 text-left font-bold text-primary shadow-[var(--shadow-card)]"
          >
            Выход
          </button>
        </div>
      </div>
    </Protected>
  )
}

export function FavoritesPage() {
  const [type, setType] = useState('')
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  async function load(t = type) {
    setLoading(true)
    try {
      const { data } = await FavoritesApi.list(t || undefined)
      setItems(data.items)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [type])
  return (
    <Protected>
      <h1 className="mb-4 text-2xl font-extrabold">Избранное</h1>
      <div className="mb-4 flex gap-2">
        {['', 'clothing', 'real_estate', 'cars', 'freelance'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-2 text-sm font-bold ${type === t ? 'bg-primary text-white' : 'bg-white'}`}>
            {t ? TYPE_LABEL[t] : 'Все'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState title="Пока пусто" text="Нажмите ❤️ на объявлении, чтобы сохранить его." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((it) => (
            <ListingCard key={it.id} item={it} onChange={() => load()} />
          ))}
        </div>
      )}
    </Protected>
  )
}

export function MyListingsPage() {
  const [status, setStatus] = useState('active')
  const [items, setItems] = useState<Listing[]>([])
  const toast = useUi((s) => s.toast)
  async function load(s = status) {
    const { data } = await UsersApi.myListings(s)
    setItems((data as { items: Listing[] }).items)
  }
  useEffect(() => {
    load()
  }, [status])
  return (
    <Protected>
      <h1 className="mb-4 text-2xl font-extrabold">Мои объявления</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {['active', 'pending', 'completed', 'archived', 'paused', 'rejected'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-4 py-2 text-sm font-bold ${status === s ? 'bg-primary text-white' : 'bg-white'}`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.length === 0 && <EmptyState />}
        {items.map((it) => (
          <div key={it.id} className="flex gap-3 rounded-3xl bg-white p-3 shadow-[var(--shadow-card)]">
            <Photo src={photoForListing(it)} alt={it.title} fallbackSrc={photoForListing(it, 1)} className="h-24 w-28 rounded-2xl object-cover bg-line" />
            <div className="min-w-0 flex-1">
              <Link to={`/listings/${it.id}`} className="font-bold">{it.title}</Link>
              <p className="text-sm text-muted">{STATUS_LABEL[it.status]} {it.rejectReason ? `· ${it.rejectReason}` : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                <Link to={`/listings/${it.id}/edit`} className="rounded-full bg-bg px-3 py-1">Edit</Link>
                {it.status === 'active' && <button onClick={async () => { await ListingsApi.status(it.id, 'paused'); load(); toast('Приостановлено') }} className="rounded-full bg-bg px-3 py-1">Pause</button>}
                {it.status === 'paused' && <button onClick={async () => { await ListingsApi.status(it.id, 'active'); load(); toast('Опубликовано') }} className="rounded-full bg-bg px-3 py-1">Renew</button>}
                {it.status === 'active' && (
                  <button onClick={async () => { await PromoApi.buy(it.id, 'bump'); toast('Поднято') }} className="rounded-full bg-bg px-3 py-1">Promote</button>
                )}
                <button onClick={async () => { await ListingsApi.remove(it.id); load(); toast('Удалено') }} className="rounded-full bg-bg px-3 py-1 text-primary">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Protected>
  )
}

export function SettingsPage() {
  const user = useAuth((s) => s.user)
  const setSession = useAuth((s) => s.setSession)
  const token = useAuth((s) => s.token)
  const toast = useUi((s) => s.toast)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', bio: '', avatar: user?.avatar || '' })
  useEffect(() => {
    if (user) setForm((s) => ({ ...s, name: user.name, phone: user.phone || '', avatar: user.avatar || '' }))
  }, [user])
  return (
    <Protected>
      <form
        className="mx-auto max-w-lg space-y-3 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)]"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            const payload = user?.role === 'admin' ? form : { name: form.name, phone: form.phone, bio: form.bio }
            const { data } = await UsersApi.updateMe(payload)
            if (token) setSession(token, data.user)
            toast('Сохранено')
          } catch (err) {
            toast((err as Error).message, 'err')
          }
        }}
      >
        <h1 className="text-2xl font-extrabold">Настройки</h1>
        <Field label="Имя">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Телефон">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        {user?.role === 'admin' ? (
          <Field label="Фото профиля">
            <div className="flex items-center gap-3">
              <Avatar src={form.avatar} name={form.name} className="h-16 w-16 text-lg" />
              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={async (e) => {
                  const files = e.target.files
                  if (!files?.length) return
                  try {
                    const uploaded = await UploadApi.files(files)
                    if (uploaded[0]?.url) setForm((s) => ({ ...s, avatar: uploaded[0].url }))
                  } catch (err) {
                    toast((err as Error).message, 'err')
                  }
                }}
              />
            </div>
          </Field>
        ) : null}
        <Field label="О себе">
          <textarea className={areaClass} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        <button className="h-12 w-full rounded-2xl bg-primary font-bold text-white">Сохранить</button>
      </form>
    </Protected>
  )
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  async function load() {
    const { data } = await NotifApi.list()
    setItems((data as { items: NotificationItem[] }).items)
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <Protected>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Уведомления</h1>
        <button
          onClick={async () => {
            await NotifApi.readAll()
            load()
          }}
          className="text-sm font-bold text-primary"
        >
          Прочитать все
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <EmptyState title="Нет уведомлений" text="Здесь появятся сообщения и статусы объявлений." />}
        {items.map((n) => (
          <Link
            key={n.id}
            to={n.link || '/'}
            onClick={() => NotifApi.read(n.id)}
            className={`flex gap-3 rounded-2xl p-4 ${n.isRead ? 'bg-white' : 'bg-primary/5'} shadow-[var(--shadow-card)]`}
          >
            <Bell className="mt-0.5 text-primary" size={18} />
            <div>
              <div className="font-bold">{n.title}</div>
              <div className="text-sm text-muted">{n.body}</div>
            </div>
          </Link>
        ))}
      </div>
    </Protected>
  )
}

export function PublicProfilePage() {
  const { id } = useParams()
  const [data, setData] = useState<{ user: User; listings: Listing[]; reviews: { id: number; rating: number; comment: string; author: { name: string } }[] } | null>(null)
  useEffect(() => {
    UsersApi.one(Number(id)).then((r) => setData(r.data as never))
  }, [id])
  if (!data) return <div className="h-40 animate-pulse rounded-3xl bg-line" />
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-card)]">
        <Avatar src={data.user.avatar} name={data.user.name} className="h-20 w-20 text-xl" />
        <div>
          <h1 className="text-2xl font-extrabold">{data.user.name}</h1>
          <Stars value={data.user.rating} /> {data.user.rating}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.listings.map((it) => (
          <ListingCard key={it.id} item={it} />
        ))}
      </div>
    </div>
  )
}
