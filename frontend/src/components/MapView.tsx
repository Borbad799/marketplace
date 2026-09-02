import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Listing } from '../types'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export function MapView({
  items,
  center = [38.5598, 68.787],
  zoom = 7,
  onSelect,
  height = 360,
}: {
  items: Listing[]
  center?: [number, number]
  zoom?: number
  onSelect?: (id: number) => void
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    mapRef.current = L.map(ref.current).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapRef.current)
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const group = L.layerGroup().addTo(map)
    items.forEach((it) => {
      if (it.latitude == null || it.longitude == null) return
      const m = L.marker([it.latitude, it.longitude]).addTo(group)
      m.bindPopup(`<b>${it.title}</b><br/>${it.price} ${it.currency}`)
      m.on('click', () => onSelect?.(it.id))
    })
    return () => {
      group.remove()
    }
  }, [items, onSelect])

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-3xl" />
}
