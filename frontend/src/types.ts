export type ListingType = 'real_estate' | 'cars' | 'freelance' | 'clothing'
export type ListingStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived' | 'rejected'

export type User = {
  id: number
  name: string
  phone?: string | null
  email?: string | null
  avatar?: string | null
  role: 'user' | 'admin' | 'moderator'
  status: string
  rating: number
  reviewsCount: number
  lastSeen?: string | null
  createdAt?: string
}

export type Media = { id: number; url: string; type: string; sortOrder: number }

export type Listing = {
  id: number
  userId: number
  categoryId?: number | null
  type: ListingType
  title: string
  description: string
  price: number
  currency: string
  cityId?: number | null
  city?: string | null
  address?: string | null
  district?: string | null
  latitude?: number | null
  longitude?: number | null
  status: ListingStatus
  rejectReason?: string | null
  views: number
  isVip: boolean
  isTop: boolean
  cover?: string | null
  favorited?: boolean
  videoUrl?: string | null
  createdAt: string
  publishedAt?: string | null
  seller?: User & { reviewsCount?: number }
  media?: Media[]
  realEstate?: {
    propertyType?: string
    dealType?: string
    rooms?: number
    area?: number
    floor?: number
    floors?: number
    renovation?: string
    furniture?: boolean
  } | null
  car?: {
    brand?: string
    model?: string
    year?: number
    mileage?: number
    bodyType?: string
    engine?: string
    engineVolume?: number
    transmission?: string
    drive?: string
    fuel?: string
    color?: string
    condition?: string
  } | null
  freelance?: {
    serviceCategory?: string
    deliveryDays?: number
    serviceType?: string
  } | null
  clothing?: {
    clothingCategory?: string
    itemKind?: string
    size?: string
    brand?: string
    color?: string
    condition?: string
    season?: string
  } | null
  reviews?: { id: number; rating: number; comment: string; createdAt: string; author: { name: string; avatar?: string } }[]
}

export type City = { id: number; name: string; name_ru: string; latitude: number; longitude: number }
export type Category = { id: number; slug: string; name: string; parent_id: number | null; type: string; icon?: string }

export type Conversation = {
  id: number
  listingId: number
  listing?: { id: number; title: string; price: number; currency: string; cover?: string }
  other: User
  lastMessage?: string
  lastMessageAt?: string
  unread: number
  createdAt: string
}

export type ChatMessage = {
  id: number
  conversationId: number
  senderId: number
  text?: string | null
  imageUrl?: string | null
  isRead: boolean
  createdAt: string
}

export type NotificationItem = {
  id: number
  type: string
  title: string
  body?: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

export type Paged<T> = { items: T[]; total: number; page: number; limit: number; pages: number }
