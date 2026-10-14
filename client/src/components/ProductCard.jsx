import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import SmartImage from './SmartImage.jsx'
import { formatNaira } from '../lib/api.js'
import { useCart } from '../lib/cart.jsx'

// Stock colours on the white product photo area (readable in both themes)
export const STOCK_LABEL = {
  in_stock: { text: 'In stock', color: '#157347' },
  low_stock: { text: 'Low stock', color: '#8A6A00' },
  out_of_stock: { text: 'Out of stock', color: '#B3261E' },
  on_order: { text: 'Available on order', color: '#4A5375' },
}

/** Soft colour glow behind the product photo, by category. */
const glowFor = (p) => {
  const slug = p.category?.slug || ''
  if (slug.includes('stabil')) return 'rgba(1,175,238,.45)'
  if (p.onSale) return 'rgba(235,38,143,.32)'
  return 'rgba(255,229,46,.55)'
}

function AddButton({ product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return undefined
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  return (
    <button
      type="button"
      onClick={() => {
        add(product.id, 1)
        setAdded(true)
      }}
      aria-label={added ? `${product.name} added to cart` : `Add ${product.name} to cart`}
      className={`press flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${added ? 'bg-[#157347] text-white' : 'bg-spark text-midnight'}`}
    >
      {added ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      )}
    </button>
  )
}

export default function ProductCard({ product: p }) {
  const stock = STOCK_LABEL[p.stockStatus]
  const stockText = p.stockStatus === 'low_stock' && p.unitsLeft ? `Only ${p.unitsLeft} left` : stock.text
  const specs = (p.specifications || []).slice(0, 2).map((s) => s.value)
  const href = `/shop/${p.slug}`

  return (
    <article className="lift flex h-full flex-col gap-3.5 rounded-[26px] border border-line bg-card p-3">
      <Link to={href} className="zoom-host relative block h-[210px] overflow-hidden rounded-[18px] bg-[#F2F4FA]" tabIndex={-1} aria-hidden="true">
        <span className="absolute left-1/2 top-[56%] size-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${glowFor(p)} 0%, rgba(255,255,255,0) 70%)` }} />
        <div className="zoom absolute inset-0">
          {p.images?.[0] ? (
            <SmartImage image={p.images[0]} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain" />
          ) : (
            <span className="flex h-full items-end p-3"><span className="rounded-full bg-white/85 px-3 py-1.5 text-[13px] font-semibold text-ink-soft">Photo coming soon</span></span>
          )}
        </div>
        {p.onSale && <span className="absolute left-3 top-3 rounded-full bg-action px-3 py-1.5 text-xs font-extrabold text-white">SALE</span>}
        <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold" style={{ color: stock.color }}>
          <span className="size-[7px] rounded-full bg-current" />{stockText}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 px-2 pb-2">
        {p.category && <span className="text-[13px] font-bold text-mist">{p.category.name}</span>}
        <Link to={href} className="text-lg font-bold leading-snug text-fg hover:text-cyan">{p.name}</Link>
        {specs.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {specs.map((s) => <span key={s} className="rounded-lg bg-card2 px-2.5 py-1 text-xs font-semibold text-mist">{s}</span>)}
          </span>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1.5">
          {p.quoteOnly ? (
            <span className="text-[15px] font-semibold text-mist">Price on request</span>
          ) : (
            <span className="flex flex-col">
              {p.onSale && <span className="text-[13px] text-mist line-through">{formatNaira(p.regularPrice)}</span>}
              <span className="font-display text-[19px] font-bold">{formatNaira(p.price)}</span>
            </span>
          )}
          {p.canBuyOnline ? (
            <AddButton product={p} />
          ) : (
            <Link to={p.quoteOnly ? `/contact?type=quote&product=${p.slug}` : href} className="press rounded-[14px] border border-line px-3.5 py-3 text-sm font-bold text-fg hover:text-fg">
              {p.quoteOnly ? 'Get a quote' : 'View'}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-[400px] flex-col gap-3.5 rounded-[26px] border border-line bg-card p-3" aria-hidden="true">
      <div className="h-[210px] animate-pulse rounded-[18px] bg-card2" />
      <div className="mx-2 h-4 w-1/3 animate-pulse rounded bg-card2" />
      <div className="mx-2 h-5 w-3/4 animate-pulse rounded bg-card2" />
    </div>
  )
}
