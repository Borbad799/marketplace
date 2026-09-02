import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthApi } from '../services/api'
import { useAuth, useUi } from '../store/auth'
import { inputClass } from '../components/Layout'

export default function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const [tab, setTab] = useState<'email' | 'phone'>('email')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '+992', code: '' })
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [loading, setLoading] = useState(false)
  const setSession = useAuth((s) => s.setSession)
  const toast = useUi((s) => s.toast)
  const nav = useNavigate()

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        const { data } = await AuthApi.register({ name: form.name, email: form.email, password: form.password, phone: form.phone.length > 4 ? form.phone : undefined })
        setSession(data.token, data.user)
        nav('/')
      } else if (mode === 'forgot') {
        if (step === 'form') {
          const { data } = await AuthApi.forgot(form.email)
          setStep('code')
          toast(data.code ? `Код: ${data.code}` : 'Если аккаунт существует, код отправлен')
        } else {
          await AuthApi.reset({ email: form.email, code: form.code, password: form.password })
          toast('Пароль обновлён')
          nav('/login')
        }
      } else {
        const { data } = await AuthApi.login({ email: form.email, password: form.password })
        setSession(data.token, data.user)
        nav('/')
      }
    } catch (err) {
      toast((err as Error).message, 'err')
    } finally {
      setLoading(false)
    }
  }

  async function onPhone(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (step === 'form') {
        const { data } = await AuthApi.phoneRequest(form.phone)
        setStep('code')
        toast(data.code ? `Код: ${data.code}` : 'Код отправлен')
      } else {
        const { data } = await AuthApi.phoneVerify({ phone: form.phone, code: form.code, name: form.name })
        setSession(data.token, data.user)
        nav('/')
      }
    } catch (err) {
      toast((err as Error).message, 'err')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'register' ? 'Регистрация' : mode === 'forgot' ? 'Восстановление пароля' : 'Вход'

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
        <Link to="/" className="text-xl font-extrabold text-primary">ARZON MARKET</Link>
        <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
        {mode !== 'forgot' && (
          <div className="mt-4 grid grid-cols-2 rounded-2xl bg-bg p-1">
            <button onClick={() => { setTab('email'); setStep('form') }} className={`rounded-xl py-2 text-sm font-bold ${tab === 'email' ? 'bg-white shadow-sm' : 'text-muted'}`}>Email</button>
            <button onClick={() => { setTab('phone'); setStep('form') }} className={`rounded-xl py-2 text-sm font-bold ${tab === 'phone' ? 'bg-white shadow-sm' : 'text-muted'}`}>Телефон</button>
          </div>
        )}

        {tab === 'email' || mode === 'forgot' ? (
          <form className="mt-5 space-y-3" onSubmit={onEmail}>
            {mode === 'register' && <input className={inputClass} placeholder="Имя" value={form.name} onChange={(e) => set('name', e.target.value)} required />}
            <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            {mode === 'register' && <input className={inputClass} placeholder="+992XXXXXXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} />}
            {(mode !== 'forgot' || step === 'code') && (
              <input className={inputClass} type="password" placeholder={mode === 'forgot' ? 'Новый пароль' : 'Пароль'} value={form.password} onChange={(e) => set('password', e.target.value)} required={mode !== 'forgot' || step === 'code'} />
            )}
            {mode === 'forgot' && step === 'code' && <input className={inputClass} placeholder="Код из письма" value={form.code} onChange={(e) => set('code', e.target.value)} />}
            <button disabled={loading} className="h-12 w-full rounded-2xl bg-primary font-bold text-white hover:bg-primary-dark disabled:opacity-60">
              {loading ? '...' : mode === 'register' ? 'Создать аккаунт' : mode === 'forgot' ? (step === 'code' ? 'Сохранить пароль' : 'Отправить код') : 'Войти'}
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={onPhone}>
            {mode === 'register' && step === 'form' && <input className={inputClass} placeholder="Имя" value={form.name} onChange={(e) => set('name', e.target.value)} />}
            <input className={inputClass} placeholder="+992 _________ " value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            {step === 'code' && <input className={inputClass} placeholder="Код из SMS" value={form.code} onChange={(e) => set('code', e.target.value)} />}
            <button disabled={loading} className="h-12 w-full rounded-2xl bg-primary font-bold text-white hover:bg-primary-dark">
              {step === 'form' ? 'Получить код' : 'Подтвердить'}
            </button>
          </form>
        )}

        <div className="mt-5 space-y-1 text-sm text-muted">
          {mode === 'login' && (
            <>
              <Link to="/register" className="block font-semibold text-primary">Регистрация</Link>
              <Link to="/forgot" className="block">Восстановление пароля</Link>
            </>
          )}
          {mode !== 'login' && <Link to="/login" className="font-semibold text-primary">Уже есть аккаунт? Войти</Link>}
        </div>
      </div>
    </div>
  )
}
