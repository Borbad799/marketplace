import { useEffect, useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

export function Gallery({ images, videoUrl }: { images: string[]; videoUrl?: string | null }) {
  const all = [...images, ...(videoUrl ? [videoUrl] : [])]
  const [i, setI] = useState(0)
  const [full, setFull] = useState(false)
  const current = all[i]
  const isVideo = Boolean(videoUrl && i === all.length - 1 && videoUrl === current)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFull(false)
      if (e.key === 'ArrowRight') setI((v) => Math.min(all.length - 1, v + 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [all.length])

  if (!all.length) return <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-line text-muted">Нет фото</div>

  const stage = (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      {isVideo ? (
        <video src={current} controls className="max-h-[70vh] w-full object-contain" />
      ) : (
        <img src={current} alt="" className="max-h-[70vh] w-full cursor-zoom-in object-cover" onClick={() => setFull(true)} />
      )}
      {!isVideo && (
        <button onClick={() => setFull(true)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90">
          <ZoomIn size={18} />
        </button>
      )}
    </div>
  )

  return (
    <div>
      {stage}
      {all.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {all.map((src, idx) => (
            <button
              key={src + idx}
              onClick={() => setI(idx)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${idx === i ? 'border-primary' : 'border-transparent'}`}
            >
              {videoUrl && idx === all.length - 1 ? (
                <div className="grid h-full place-items-center bg-ink text-xs text-white">VIDEO</div>
              ) : (
                <img src={src} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
      {full && !isVideo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setFull(false)}>
          <button className="absolute right-4 top-4 text-white" onClick={() => setFull(false)}>
            <X />
          </button>
          <img src={current} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
