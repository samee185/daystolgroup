/**
 * Responsive image from the API ({ src, srcSet, alt }), or a striped placeholder when there is no photo yet.
 */
export default function SmartImage({ image, sizes = '(min-width: 768px) 33vw, 100vw', className = '', fallbackLabel, fallbackClassName = '', eager = false }) {
  if (image?.src) {
    return (
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        alt={image.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }
  return (
    <div className={`ph flex h-full w-full items-end p-4 ${fallbackClassName} ${className}`} role="img" aria-label={fallbackLabel || 'Photo coming soon'}>
      {fallbackLabel && <span className="rounded-full bg-glass px-3 py-1.5 text-[13px] font-semibold text-mist backdrop-blur">{fallbackLabel}</span>}
    </div>
  )
}
