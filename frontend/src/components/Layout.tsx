import { Link, useLocation } from 'react-router-dom'
import { Header, BottomNav, Footer } from './Header'
import { useAuth, useUi } from '../store/auth'
import { X } from 'lucide-react'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const toasts = useUi((s) => s.toasts)
  const dismiss = useUi((s) => s.dismiss)
  const isHome = useLocation().pathname === '/'
  return (
    <div className="min-h-screen bg-bg">
      {!isHome && <Header />}
      <main className={`mx-auto max-w-6xl px-4 pb-28 ${isHome ? 'pt-5' : 'pt-4'}`}>{children}</main>
      {!isHome && <Footer />}
      <BottomNav />
      <div className="fixed bottom-28 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${t.type === 'err' ? 'bg-ink' : 'bg-success'}`}
          >
            <span>{t.text}</span>
            <button onClick={() => dismiss(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ title = 'Ничего не найдено', text = 'Попробуйте изменить параметры поиска.' }: { title?: string; text?: string }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
      <div className="text-4xl">😔</div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-muted">{text}</p>
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-bold">Что-то пошло не так</h3>
      <button onClick={onRetry} className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-dark">
        Повторить
      </button>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] outline-none transition focus:border-primary'
export const areaClass =
  'min-h-32 w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition focus:border-primary'

export function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  if (!ready) return <div className="py-20 text-center text-muted">Загрузка…</div>
  if (!user) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-bold">Нужен вход</h2>
        <p className="mt-2 text-muted">Чтобы продолжить, войдите в аккаунт.</p>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 font-bold text-white">
          Войти
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
