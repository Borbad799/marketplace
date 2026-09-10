import axios from 'axios'
import type { Listing, Paged, User } from '../types'

const PRODUCTION_API = 'https://marketplace-production-2afd.up.railway.app'

function resolveApiUrl() {
  const raw = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  const usable =
    /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(:\d+)?$/i.test(raw) &&
    !/[^\x00-\x7F]/.test(raw) &&
    !/ваш|что-то|xxxx|your-service|example\.com/i.test(raw)
  if (import.meta.env.PROD) return usable ? raw : PRODUCTION_API
  return usable ? raw : ''
}

export const API_URL = resolveApiUrl()

export const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('market_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Что-то пошло не так'
    return Promise.reject(new Error(message))
  },
)

export const mediaSrc = (url?: string | null) => {
  if (!url) return ''
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url
  if (url.startsWith('/') && API_URL) return `${API_URL}${url}`
  return url
}

export const AuthApi = {
  register: (data: object) => api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: object) => api.post<{ token: string; user: User }>('/auth/login', data),
  phoneRequest: (phone: string) => api.post<{ ok: boolean; code?: string }>('/auth/phone/request', { phone }),
  phoneVerify: (data: object) => api.post<{ token: string; user: User }>('/auth/phone/verify', data),
  forgot: (email: string) => api.post<{ ok: boolean; code?: string }>('/auth/forgot', { email }),
  reset: (data: object) => api.post('/auth/reset', data),
  me: () => api.get<{ user: User; profile: Record<string, unknown> }>('/auth/me'),
}

export const ListingsApi = {
  list: (params: Record<string, unknown>) => api.get<Paged<Listing>>('/listings', { params }),
  popular: () => api.get<{ items: Listing[] }>('/listings/popular'),
  one: (id: string | number) => api.get<{ item: Listing }>(`/listings/${id}`),
  create: (data: object) => api.post<{ item: Listing }>('/listings', data),
  update: (id: number, data: object) => api.put<{ item: Listing }>(`/listings/${id}`, data),
  status: (id: number, status: string) => api.post(`/listings/${id}/status`, { status }),
  remove: (id: number) => api.delete(`/listings/${id}`),
}

export const FavoritesApi = {
  list: (type?: string) => api.get<{ items: Listing[] }>('/favorites', { params: { type } }),
  toggle: (id: number) => api.post<{ favorited: boolean }>(`/favorites/${id}`),
}

export const MetaApi = {
  cities: () => api.get('/cities'),
  categories: () => api.get('/categories'),
  banners: () => api.get('/banners'),
  suggest: (q: string) => api.get('/suggest', { params: { q } }),
  carMeta: () => api.get('/car-meta'),
}

export const MessagesApi = {
  list: () => api.get('/messages'),
  unread: () => api.get<{ count: number }>('/messages/unread-count'),
  start: (listingId: number) => api.post('/messages', { listingId }),
  thread: (id: number) => api.get(`/messages/${id}`),
  send: (id: number, data: object) => api.post(`/messages/${id}/messages`, data),
}

export const NotifApi = {
  list: () => api.get('/notifications'),
  read: (id: number) => api.post(`/notifications/${id}/read`),
  readAll: () => api.post('/notifications/read-all'),
}

export const UsersApi = {
  one: (id: number) => api.get(`/users/${id}`),
  updateMe: (data: object) => api.put('/users/me', data),
  myListings: (status?: string) => api.get('/users/me/listings', { params: { status } }),
}

export const PromoApi = {
  prices: () => api.get('/promotions/prices'),
  buy: (listingId: number, type: string) => api.post('/promotions', { listingId, type }),
}

export const ReportsApi = {
  create: (data: object) => api.post('/reports', data),
}

export const ReviewsApi = {
  create: (data: object) => api.post('/reviews', data),
}

export const UploadApi = {
  files: async (files: FileList | File[]) => {
    const form = new FormData()
    Array.from(files).forEach((f) => form.append('files', f))
    const { data } = await api.post<{ files: { url: string; type: string }[] }>('/upload', form)
    return data.files
  },
}

export const AdminApi = {
  stats: () => api.get('/admin/stats'),
  users: (q?: string) => api.get('/admin/users', { params: { q } }),
  blockUser: (id: number) => api.post(`/admin/users/${id}/block`),
  role: (id: number, role: string) => api.post(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  listings: (params?: object) => api.get('/admin/listings', { params }),
  approve: (id: number) => api.post(`/admin/listings/${id}/approve`),
  reject: (id: number, reason: string) => api.post(`/admin/listings/${id}/reject`, { reason }),
  deleteListing: (id: number) => api.delete(`/admin/listings/${id}`),
  reports: () => api.get('/admin/reports'),
  resolveReport: (id: number, status: string) => api.post(`/admin/reports/${id}/resolve`, { status }),
  messages: () => api.get('/admin/messages'),
  payments: () => api.get('/admin/payments'),
  banners: () => api.get('/admin/banners'),
  saveBanner: (data: object, id?: number) => (id ? api.put(`/admin/banners/${id}`, data) : api.post('/admin/banners', data)),
  deleteBanner: (id: number) => api.delete(`/admin/banners/${id}`),
  cities: () => api.get('/admin/cities'),
  saveCity: (data: object, id?: number) => (id ? api.put(`/admin/cities/${id}`, data) : api.post('/admin/cities', data)),
  deleteCity: (id: number) => api.delete(`/admin/cities/${id}`),
  categories: () => api.get('/admin/categories'),
  saveCategory: (data: object, id?: number) => (id ? api.put(`/admin/categories/${id}`, data) : api.post('/admin/categories', data)),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),
  settings: () => api.get('/admin/settings'),
  saveSettings: (data: object) => api.put('/admin/settings', data),
}
