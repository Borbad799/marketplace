import type { Listing } from '../types'
import { mediaSrc } from '../services/api'
import { photoForListing } from './shopPhotos'

export function listingImages(item: Listing) {
  const fromMedia = (item.media || [])
    .filter((m) => m.type === 'image' && m.url)
    .map((m) => mediaSrc(m.url))
    .filter(Boolean)
  if (fromMedia.length) return fromMedia
  if (item.cover) {
    const cover = mediaSrc(item.cover)
    if (cover) return [cover]
  }
  return []
}

export function listingCover(item: Listing) {
  return listingImages(item)[0] || photoForListing(item)
}

export function listingVideo(item: Listing) {
  const url = (item.media || []).find((m) => m.type === 'video')?.url || item.videoUrl
  return url ? mediaSrc(url) : ''
}