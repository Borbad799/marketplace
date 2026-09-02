import { ChevronLeft, Heart, Home, MessageCircle, Plus, Search, ShoppingBag, UserRound } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { useAuth } from '../store/auth'
import { useEffect, useState } from 'react'
import { CLOTHING_NAV, CLOTHING_SUBS } from '../utils/format'
import { MessagesApi } from '../services/api'

const links = [
  { to: '/', label: 'Главная' },
  { to: '/real-estate', label: 'Недвижимость' },
  { to: '/cars', label: 'Авто' },
  { to: '/freelance', label: 'Фриланс' },
  { to: '/favorites', label: 'Избранное' },
]

const tileClass = (on: boolean) =>
  `flex min-h-[64px] flex-col items-center justify-center rounded-md border px-1 py-2 text-center shadow-sm transition sm:min-h-[68px] sm:rounded-lg ${
    on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary/40 hover:shadow'
  }`

export function Header() {
  const user = useAuth((s) => s.user)
  const loc = useLocation()
  const nav = useNavigate()
  const activeNav = CLOTHING_NAV.find((c) => loc.pathname === c.to)
  const itemKind = new URLSearchParams(loc.search).get('itemKind') || ''
  const inner = activeNav ? CLOTHING_SUBS[activeNav.category] || [] : []

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="shrink-0 text-lg font-extrabold tracking-tight text-primary md:text-xl">
          ARZON MARKET
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-semibold ${isActive ? 'bg-primary/10 text-primary' : 'text-ink/80 hover:bg-bg'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Link to="/search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-bg md:hidden">
            <Search size={20} />
          </Link>
          <Link to="/favorites" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-bg sm:grid">
            <Heart size={20} />
          </Link>
          <Link
            to={user ? '/post' : '/login'}
            className="hidden items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark sm:inline-flex"
          >
            <Plus size={16} /> Подать объявление
          </Link>
        </div>
      </div>
      <div className="border-t border-line bg-bg">
        {activeNav && (
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 pt-2 sm:px-4">
            <button
              type="button"
              onClick={() => nav('/')}
              className="inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-1 text-xs font-bold text-ink shadow-sm"
            >
              <ChevronLeft size={14} /> Назад
            </button>
            <p className="truncate text-xs font-extrabold">
              {activeNav.emoji} {activeNav.label}
            </p>
            <Link to={activeNav.to} className={`ml-auto text-xs font-bold ${!itemKind ? 'text-primary' : 'text-muted'}`}>
              Все
            </Link>
          </div>
        )}
        <div className="mx-auto grid max-w-6xl grid-cols-4 gap-1.5 px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
          {activeNav
            ? inner.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => nav(`${activeNav.to}?itemKind=${encodeURIComponent(s.value)}`)}
                  className={tileClass(itemKind === s.value)}
                >
                  <span className="text-lg leading-none sm:text-xl">{s.emoji}</span>
                  <span className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight sm:text-xs">{s.label}</span>
                </button>
              ))
            : CLOTHING_NAV.map((l) => (
                <Link key={l.to} to={l.to} className={tileClass(false)}>
                  <span className="text-lg leading-none sm:text-xl">{l.emoji}</span>
                  <span className="mt-1 line-clamp-2 text-[10px] font-bold leading-tight sm:text-xs">{l.label}</span>
                </Link>
              ))}
        </div>
      </div>
    </header>
  )
}

export function BottomNav() {
  const user = useAuth((s) => s.user)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    MessagesApi.unread().then((r) => setUnread(r.data.count)).catch(() => {})
  }, [user])

  const item = (to: string, icon: React.ReactNode, label: string, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center px-1">
        {item('/', <Home size={18} />, 'Главная', true)}
        {item('/favorites', <ShoppingBag size={18} />, 'Корзина')}
        <NavLink
          to={user ? '/post' : '/login'}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
            <Plus size={16} strokeWidth={2.5} />
          </span>
          Добавить
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          <span className="relative">
            <MessageCircle size={18} />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[8px] text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          Сообщения
        </NavLink>
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          <UserRound size={20} />
          {user ? 'Профиль' : 'Войти'}
        </NavLink>
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="mt-12 hidden border-t border-line bg-white md:block">
      <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-4 py-10 text-sm">
        <div>
          <div className="text-lg font-extrabold text-primary">ARZON MARKET</div>
          <p className="mt-2 text-muted">Недвижимость, автомобили и фриланс по всему Таджикистану.</p>
        </div>
        <div className="space-y-2">
          <div className="font-bold">Разделы</div>
          <Link to="/men" className="block text-muted hover:text-ink">Мужская одежда</Link>
          <Link to="/women" className="block text-muted hover:text-ink">Женская одежда</Link>
          <Link to="/kids" className="block text-muted hover:text-ink">Детская</Link>
          <Link to="/shoes" className="block text-muted hover:text-ink">Обувь</Link>
          <Link to="/electronics" className="block text-muted hover:text-ink">Электроника</Link>
          <Link to="/home" className="block text-muted hover:text-ink">Для дома</Link>
          <Link to="/beauty" className="block text-muted hover:text-ink">Красота</Link>
          <Link to="/sport" className="block text-muted hover:text-ink">Спорт</Link>
          <Link to="/real-estate" className="block text-muted hover:text-ink">Недвижимость</Link>
          <Link to="/cars" className="block text-muted hover:text-ink">Авто</Link>
          <Link to="/freelance" className="block text-muted hover:text-ink">Фриланс</Link>
        </div>
        <div className="space-y-2">
          <div className="font-bold">Сервис</div>
          <Link to="/post" className="block text-muted hover:text-ink">Подать объявление</Link>
          <Link to="/favorites" className="block text-muted hover:text-ink">Избранное</Link>
          <Link to="/nearby" className="block text-muted hover:text-ink">Рядом на карте</Link>
        </div>
        <div className="space-y-2">
          <div className="font-bold">Контакты</div>
          <p className="text-muted">+992 90 000 0001</p>
          <p className="text-muted">hello@market.tj</p>
        </div>
      </div>
    </footer>
  )
}
