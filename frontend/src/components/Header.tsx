import { Home, MessageCircle, Plus, Search, ShoppingBag, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { useAuth } from '../store/auth'
import { useEffect, useState } from 'react'
import { MessagesApi } from '../services/api'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="shrink-0 text-lg font-extrabold tracking-tight text-primary md:text-xl">
          ARZON MARKET
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>
        <Link to="/search" className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-bg md:hidden">
          <Search size={20} />
        </Link>
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
        `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-end px-1 pt-1">
        {item('/', <Home size={22} />, 'Главная', true)}
        {item('/favorites', <ShoppingBag size={22} />, 'Корзина')}
        <NavLink
          to={user ? '/post' : '/login'}
          className={({ isActive }) =>
            `relative flex min-w-0 flex-1 flex-col items-center ${isActive ? 'text-primary' : 'text-ink'}`
          }
        >
          <span className="-mt-7 grid h-16 w-16 place-items-center rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(255,77,48,0.45)] ring-4 ring-white">
            <Plus size={30} strokeWidth={2.5} />
          </span>
          <span className="mt-1 pb-2 text-[11px] font-extrabold">Продать</span>
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          <span className="relative">
            <MessageCircle size={22} />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-0.5 text-[9px] text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          Сообщения
        </NavLink>
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`
          }
        >
          <UserRound size={22} />
          {user ? 'Профиль' : 'Войти'}
        </NavLink>
      </div>
    </nav>
  )
}

export function Footer() {
  return (
    <footer className="mt-12 hidden border-t border-line bg-white pb-28 md:block">
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
