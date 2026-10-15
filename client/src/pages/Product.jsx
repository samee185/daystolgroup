import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import RichText from '../components/RichText.jsx'
import SmartImage from '../components/SmartImage.jsx'
import ProductCard, { STOCK_LABEL } from '../components/ProductCard.jsx'
import NotFound from './NotFound.jsx'
import { formatNaira } from '../lib/api.js'
import { telHref, useProduct, useProducts, useSettings, whatsappHref } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'
import { MAX_QTY, useCart } from '../lib/cart.jsx'

const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long' })

// Stock text colour on the page, from the theme (see index.css)
const STOCK_TEXT = { in_stock: 'var(--ok)', low_stock: 'var(--low)', out_of_stock: 'var(--bad)', on_order: 'var(--mist)' }

const glowFor = (p) => {
  const slug = p.category?.slug || ''
  if (slug.includes('stabil')) return 'rgba(1,175,238,.45)'
  if (p.onSale) return 'rgba(235,38,143,.32)'
  return 'rgba(255,229,46,.55)'
}

const TRUST = [
  { title: 'Secure payment', text: 'Card, transfer or USSD via Paystack', icon: 'M4 10h16v10H4zM8 10V7a4 4 0 0 1 8 0v3' },
  { title: 'Pickup or delivery', text: 'Choose at checkout', icon: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1' },
  { title: 'Installed by engineers', text: 'Daystol Power Services', icon: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z' },
  { title: 'Warranty support', text: 'We help with any claim', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
]

function Gallery({ p }) {
  const [active, setActive] = useState(0)
  const images = p.images
  const current = images[active]

  return (
    <div className="fade-up flex flex-col gap-3 lg:sticky lg:top-24">
      <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[#F2F4FA] sm:rounded-[30px]">
        <span className="absolute left-1/2 top-[55%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${glowFor(p)} 0%, rgba(255,255,255,0) 70%)` }} aria-hidden="true" />
        {current ? (
          <SmartImage key={active} image={current} eager sizes="(min-width: 1024px) 50vw, 100vw" className="fade-up relative object-contain" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-ink-soft">Photo coming soon</span></span>
        )}
        {p.onSale && (
          <span className="absolute left-4 top-4 rounded-full bg-action px-3 py-1.5 text-[13px] font-extrabold text-white sm:left-[18px] sm:top-[18px]">
            SALE{p.saleEndsAt ? ` until ${dateFormat.format(new Date(p.saleEndsAt))}` : ''}
          </span>
        )}
        {images.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-[rgba(13,19,48,.8)] px-3 py-1.5 text-[13px] font-bold text-white">{active + 1} / {images.length}</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1" role="group" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              className={`size-[68px] shrink-0 overflow-hidden rounded-[18px] bg-[#F2F4FA] sm:size-[88px] ${i === active ? 'border-[3px] border-cyan' : 'border border-line opacity-70 hover:opacity-100'}`}
            >
              <img src={img.src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QtyStepper({ value, onChange, max }) {
  const btn = 'press flex size-12 items-center justify-center text-[22px] font-bold text-fg disabled:opacity-30'
  return (
    <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="One less">−</button>
      <output className="w-[34px] text-center text-lg font-extrabold" aria-live="polite">{value}</output>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="One more">+</button>
    </div>
  )
}

function StockMeter({ p }) {
  const color = STOCK_TEXT[p.stockStatus]
  const low = p.stockStatus === 'low_stock'
  const text = low && p.unitsLeft ? `Only ${p.unitsLeft} left in stock` : STOCK_LABEL[p.stockStatus].text
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-2.5 font-bold" style={{ color }}>
        <span className="relative size-2.5" aria-hidden="true">
          {low && <span className="ping" style={{ background: color }} />}
          <span className="absolute inset-0 rounded-full" style={{ background: color }} />
        </span>
        {text}
      </span>
      {low && p.unitsLeft > 0 && (
        <span className="h-1.5 overflow-hidden rounded-full bg-card2" aria-hidden="true">
          <span className="grow-x block h-full rounded-full" style={{ width: `${Math.max(8, Math.min(40, p.unitsLeft * 7))}%`, background: color, animationDelay: '.6s' }} />
        </span>
      )}
    </div>
  )
}

/** Add to cart, or the right alternative for quote-only and out-of-stock products. */
function BuyBox({ p, settings, qty, setQty, onAdd, added, inCart }) {
  const max = Math.min(MAX_QTY, p.unitsLeft || MAX_QTY)
  const priceText = p.quoteOnly ? 'price on request' : formatNaira(p.price)
  const waText = p.quoteOnly
    ? `Hello Daystol, I'd like a quote for the ${p.name}.`
    : p.canBuyOnline
      ? `Hello Daystol, I have a question about the ${p.name} (${priceText}).`
      : `Hello Daystol, please let me know when the ${p.name} is available.`
  const wa = whatsappHref(settings?.whatsappNumber, waText)
  const call = telHref(settings?.phone)
  const box = 'flex flex-col gap-3 rounded-3xl border border-line bg-card p-[18px]'

  if (!p.canBuyOnline) {
    return (
      <div className={box}>
        <Link to={`/contact?type=quote&product=${p.slug}`} className="shine press rounded-full bg-action px-6 py-4 text-center text-[17px] font-extrabold text-white hover:text-white">
          {p.quoteOnly ? 'Request a quote' : p.stockStatus === 'on_order' ? 'Order on request' : 'Ask when it’s back'}
        </Link>
        <span className="flex flex-wrap gap-4 text-sm text-mist">
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="text-mist underline hover:text-fg">WhatsApp us</a>}
          {call && <a href={call} className="text-mist underline hover:text-fg">Call {settings.phone}</a>}
        </span>
      </div>
    )
  }

  return (
    <div className={box}>
      <div className="flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} max={max} />
        <button type="button" onClick={onAdd} className="shine press min-w-[200px] flex-1 rounded-full bg-action px-6 py-4 text-[17px] font-extrabold text-white">
          Add to cart, {formatNaira(p.price * qty)}
        </button>
      </div>
      {added && (
        <div role="status" className="pop-in flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-[rgba(21,115,71,.18)] px-3.5 py-3">
          <span className="font-bold">Added to your cart ({inCart} in cart).</span>
          <span className="flex gap-2">
            <Link to="/cart" className="press rounded-full bg-fg px-4 py-2.5 font-extrabold text-bg hover:text-bg">View cart</Link>
            <Link to="/checkout" className="press rounded-full border border-line px-3.5 py-2.5 font-bold text-fg hover:text-fg">Checkout</Link>
          </span>
        </div>
      )}
      <span className="flex flex-wrap gap-4 text-sm text-mist">
        <Link to={`/contact?type=quote&product=${p.slug}`} className="text-mist underline hover:text-fg">Need installation? Get a quote</Link>
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="text-mist underline hover:text-fg">Questions? WhatsApp us</a>}
      </span>
    </div>
  )
}

function DetailTabs({ p }) {
  const tabs = [
    p.description && { id: 'desc', label: 'Description' },
    p.specifications.length > 0 && { id: 'specs', label: 'Specifications' },
    { id: 'delivery', label: 'Delivery and installation' },
  ].filter(Boolean)
  const [tab, setTab] = useState(tabs[0].id)

  // Arrow keys move between tabs
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1
    if (next < 0) return
    setTab(tabs[next].id)
    document.getElementById(`tab-${tabs[next].id}`)?.focus()
  }

  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-[18px] pb-[72px] sm:px-7">
      <div role="tablist" aria-label="Product details" className="flex gap-[26px] overflow-x-auto border-b border-line" onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap border-b-[3px] px-1 py-3.5 font-bold ${tab === t.id ? 'border-spark text-fg' : 'border-transparent text-mist hover:text-fg'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pop-in" style={{ animationDuration: '.45s' }}>
        {tab === 'desc' && <div className="max-w-[72ch]"><RichText html={p.description} /></div>}
        {tab === 'specs' && (
          <table className="w-full max-w-[760px] border-separate border-spacing-0 overflow-hidden rounded-[22px] border border-line text-[15px]">
            <tbody>
              {p.specifications.map((s, i) => (
                <tr key={s.label} className={i % 2 ? '' : 'bg-card'}>
                  <th scope="row" className={`px-5 py-3.5 text-left font-normal text-mist ${i ? 'border-t border-line' : ''}`}>{s.label}</th>
                  <td className={`px-5 py-3.5 text-right font-bold ${i ? 'border-t border-line' : ''}`}>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'delivery' && (
          <div className="grid max-w-[980px] gap-3.5 sm:grid-cols-3">
            {[
              ['Pickup', "Free. Collect from our office; we call you when it's ready."],
              ['Delivery', 'Choose delivery at checkout and the fee is shown before you pay.'],
              ['Installation', 'Quoted separately by our engineers after a quick site check.'],
            ].map(([title, text]) => (
              <div key={title} className="flex flex-col gap-2 rounded-[22px] border border-line p-[22px]">
                <strong>{title}</strong>
                <span className="text-mist">{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Related({ product }) {
  const { data } = useProducts(product.category ? { category: product.category.slug, limit: 5 } : { limit: 5 })
  const items = (data?.items || []).filter((p) => p.id !== product.id).slice(0, 4)
  if (!items.length) return null
  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-[18px] pb-24 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 font-display text-[clamp(20px,2.2vw,30px)] font-extrabold tracking-[-0.02em]">You may also need</h2>
        <Link to={product.category ? `/shop?category=${product.category.slug}` : '/shop'} className="flex items-center gap-2 font-bold text-at-innovation">See all <span className="nudge" aria-hidden="true">→</span></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

export default function Product() {
  const { slug } = useParams()
  const { data: p, isPending, isError, error, refetch } = useProduct(slug)
  const { data: settings } = useSettings()
  const { add, items } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  usePageMeta(p?.name || 'Product', p?.shortDescription)

  useEffect(() => {
    if (!added) return undefined
    const t = setTimeout(() => setAdded(false), 6000)
    return () => clearTimeout(t)
  }, [added])

  if (isError && error?.status === 404) return <NotFound />
  if (isError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-mist">We couldn't load this product.</p>
        <button type="button" onClick={() => refetch()} className="press mt-4 rounded-full bg-fg px-6 py-3 font-bold text-bg">Try again</button>
      </div>
    )
  }
  if (isPending) {
    return (
      <div className="mx-auto grid max-w-[1320px] gap-12 px-[18px] py-12 sm:px-7 lg:grid-cols-2" aria-busy="true">
        <div className="aspect-square animate-pulse rounded-[30px] bg-card" />
        <div className="flex flex-col gap-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-card" />
          <div className="h-8 w-1/3 animate-pulse rounded bg-card" />
          <div className="h-28 animate-pulse rounded bg-card" />
        </div>
      </div>
    )
  }

  const onAdd = () => {
    add(p.id, qty)
    setAdded(true)
    setQty(1)
  }
  const inCart = items.find((i) => i.id === p.id)?.qty || 0
  const keySpecs = p.specifications.slice(0, 3)

  return (
    <>
      <section className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-[18px] pb-16 pt-[26px] sm:px-7">
        <nav aria-label="Breadcrumb" className="text-sm text-mist">
          <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/shop" className="text-mist hover:text-fg">Shop</Link></li>
            {p.category && (
              <>
                <li aria-hidden="true">/</li>
                <li><Link to={`/shop?category=${p.category.slug}`} className="text-mist hover:text-fg">{p.category.name}</Link></li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">{p.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12">
          <Gallery p={p} />

          <div className="flex min-w-0 flex-col gap-5">
            <span className="fade-up flex flex-wrap gap-2" style={{ animationDelay: '.05s' }}>
              {p.category && <span className="rounded-full bg-spark px-3 py-1.5 text-[13px] font-extrabold text-midnight">{p.category.name}</span>}
              {(p.brand || p.sku) && (
                <span className="rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-mist">{[p.brand, p.sku && `model ${p.sku}`].filter(Boolean).join(', ')}</span>
              )}
            </span>
            <h1 className="fade-up m-0 break-words font-display text-[23px] font-extrabold leading-[1.15] tracking-[-0.02em] sm:text-[clamp(26px,2.8vw,38px)]" style={{ animationDelay: '.1s' }}>{p.name}</h1>

            <div className="fade-up flex flex-wrap items-end gap-3.5" style={{ animationDelay: '.18s' }}>
              {p.quoteOnly ? (
                <span className="text-xl font-semibold">Priced per site. Request a quote below.</span>
              ) : (
                <>
                  <span className="font-display text-[28px] font-bold sm:text-4xl">{formatNaira(p.price)}</span>
                  {p.onSale && (
                    <>
                      <span className="pb-1.5 text-lg text-mist line-through">{formatNaira(p.regularPrice)}</span>
                      <span className="mb-1 rounded-[10px] bg-[rgba(212,21,122,.15)] px-2.5 py-1.5 text-sm font-extrabold text-at-property">
                        You save {formatNaira(p.regularPrice - p.price)}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="fade-up" style={{ animationDelay: '.24s' }}><StockMeter p={p} /></div>

            {p.shortDescription && <p className="fade-up m-0 text-base leading-relaxed text-mist [overflow-wrap:anywhere] sm:text-[17px]" style={{ animationDelay: '.3s' }}>{p.shortDescription}</p>}

            {keySpecs.length > 0 && (
              <dl className="fade-up m-0 grid grid-cols-3 gap-2.5" style={{ animationDelay: '.36s' }}>
                {keySpecs.map((s) => (
                  <div key={s.label} className="flex min-w-0 flex-col gap-1 rounded-2xl border border-line bg-card p-3.5">
                    <dt className="truncate text-[13px] text-mist">{s.label}</dt>
                    <dd className="m-0 break-words text-[15px] font-bold sm:text-[17px]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="fade-up" style={{ animationDelay: '.42s' }}>
              <BuyBox p={p} settings={settings} qty={qty} setQty={setQty} onAdd={onAdd} added={added} inCart={inCart} />
            </div>

            <ul className="fade-up m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2" style={{ animationDelay: '.48s' }}>
              {TRUST.map((t) => (
                <li key={t.title} className="flex items-start gap-3 rounded-[18px] border border-line p-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-card2 text-at-power" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                  </span>
                  <span className="flex flex-col gap-0.5"><strong className="text-[15px]">{t.title}</strong><span className="text-[13px] text-mist">{t.text}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <DetailTabs p={p} />
      <Related product={p} />

      {/* Phones: price and add to cart stay at the bottom of the screen */}
      {p.canBuyOnline && (
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-line bg-glass px-[18px] py-3 backdrop-blur-xl sm:hidden">
          <span className="flex flex-col">
            <span className="text-xs text-mist">{qty} × {formatNaira(p.price)}</span>
            <strong className="font-display text-[17px]">{formatNaira(p.price * qty)}</strong>
          </span>
          {added ? (
            <Link to="/cart" role="status" className="pop-in rounded-full bg-[#157347] px-[22px] py-3.5 font-extrabold text-white hover:text-white">Added. View cart ({inCart})</Link>
          ) : (
            <button type="button" onClick={onAdd} className="press rounded-full bg-action px-[22px] py-3.5 font-extrabold text-white">Add to cart</button>
          )}
        </div>
      )}
    </>
  )
}
