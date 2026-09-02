import { create } from 'zustand'
import { AuthApi } from '../services/api'
import type { User } from '../types'

type AuthState = {
  user: User | null
  token: string | null
  ready: boolean
  setSession: (token: string, user: User) => void
  logout: () => void
  hydrate: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('market_token'),
  ready: false,
  setSession: (token, user) => {
    localStorage.setItem('market_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('market_token')
    set({ token: null, user: null })
  },
  hydrate: async () => {
    const token = localStorage.getItem('market_token')
    if (!token) {
      set({ ready: true, user: null })
      return
    }
    try {
      const { data } = await AuthApi.me()
      set({ user: data.user, token, ready: true })
    } catch {
      localStorage.removeItem('market_token')
      set({ user: null, token: null, ready: true })
    }
  },
}))

type Toast = { id: number; text: string; type: 'ok' | 'err' }
type UiState = {
  toasts: Toast[]
  toast: (text: string, type?: 'ok' | 'err') => void
  dismiss: (id: number) => void
}

let n = 1
export const useUi = create<UiState>((set) => ({
  toasts: [],
  toast: (text, type = 'ok') => {
    const id = n++
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
