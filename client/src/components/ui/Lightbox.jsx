import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Full-screen photo viewer: arrows, swipe, a counter, and Escape to close.
 * `images` are { src, alt } objects; `start` is the photo to open on.
 */
export default function Lightbox({ images, start = 0, onClose, title = 'Photos' }) {
  const [index, setIndex] = useState(start)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const touch = useRef(null)
  const count = images.length
  const go = (step) => setIndex((i) => (i + step + count) % count)

  useEffect(() => {
    const opener = document.activeElement
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        // Keep keyboard focus inside the viewer
        const items = dialogRef.current?.querySelectorAll('button')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, count])

  // Preload the photos either side, so moving between them is instant
  useEffect(() => {
    if (count < 2) return
    ;[images[(index + 1) % count], images[(index - 1 + count) % count]].forEach((img) => { new Image().src = img.src })
  }, [index, images, count])

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    touch.current = null
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
  }

  const current = images[index]
  const arrow = 'press absolute top-1/2 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 sm:flex'

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${count}`}
      className="fade-up fixed inset-0 z-50 flex flex-col bg-[rgba(5,8,22,.94)] text-white"
      style={{ animationDuration: '.3s' }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-sm font-bold" aria-live="polite">{index + 1} / {count}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photos" className="press flex size-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-20" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={(e) => e.target === e.currentTarget && onClose()}>
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${arrow} left-4`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        <img key={current.src} src={current.src} alt={current.alt || `Photo ${index + 1}`} className="pop-in max-h-full max-w-full select-none rounded-xl object-contain" style={{ animationDuration: '.35s' }} draggable="false" />
        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${arrow} right-4`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4 sm:justify-center" role="group" aria-label="All photos">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`size-14 shrink-0 overflow-hidden rounded-lg ${i === index ? 'ring-2 ring-cyan' : 'opacity-50 hover:opacity-90'}`}
            >
              <img src={img.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  )
}
