import { useState } from 'react'

/**
 * A fixed website photo from client/public/images (for example /images/home/power.jpg).
 * Until the file exists, a labelled striped placeholder shows instead, so the layout never breaks.
 * To add the real photo, save it under that exact name and rebuild. No code changes needed.
 */
export default function PhotoSlot({ src, alt = '', label, className = '', imgClassName = '', eager = false }) {
  const [missing, setMissing] = useState(!src)

  if (missing) {
    return (
      <div className={`ph flex h-full w-full items-end p-4 ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {label && (
          <span className="flex items-center gap-2 rounded-full bg-glass px-3 py-1.5 text-[13px] font-semibold text-mist backdrop-blur">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></svg>
            {label}
          </span>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setMissing(true)}
      className={`h-full w-full object-cover ${className} ${imgClassName}`}
    />
  )
}
