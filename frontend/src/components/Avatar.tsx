import { mediaSrc } from '../services/api'

function initials(name?: string | null) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const letters = (parts[0]?.[0] || '?') + (parts[1]?.[0] || '')
  return letters.toUpperCase()
}

function stableSrc(src?: string | null) {
  const url = mediaSrc(src)
  if (!url) return ''
  if (/pravatar\.cc/i.test(url) && !/[?&]img=/.test(url)) return ''
  return url
}

export function Avatar({
  src,
  name,
  className = 'h-10 w-10 text-sm',
}: {
  src?: string | null
  name?: string | null
  className?: string
}) {
  const url = stableSrc(src)
  if (url) {
    return <img src={url} alt={name || ''} className={`rounded-full object-cover bg-line ${className}`} />
  }
  return (
    <div
      className={`grid place-items-center rounded-full bg-primary/15 font-extrabold text-primary ${className}`}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}
