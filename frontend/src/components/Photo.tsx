import { useEffect, useState } from 'react'
import { mediaSrc } from '../services/api'

export function Photo({
  src,
  alt = '',
  className,
  fallbackSrc,
}: {
  src?: string | null
  alt?: string
  className?: string
  fallbackSrc?: string
}) {
  const chain = [mediaSrc(src), mediaSrc(fallbackSrc)].filter((u, i, a) => Boolean(u) && a.indexOf(u) === i) as string[]
  const [i, setI] = useState(0)
  const url = chain[i] || ''

  useEffect(() => {
    setI(0)
  }, [src, fallbackSrc])

  if (!url) return <div className={className} />

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => {
        if (i < chain.length - 1) setI(i + 1)
      }}
    />
  )
}
