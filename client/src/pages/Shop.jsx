import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx'
import SmartImage from '../components/SmartImage.jsx'
import PhotoSlot from '../components/ui/PhotoSlot.jsx'
import { PHOTOS } from '../lib/photos.js'
import { useCategories, useProducts } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

const STOCK_FILTERS = [
  { value: 'in_stock', label: 'In stock' },
  { value: 'on_order', label: 'Available on order' },
]

const PERKS = ['Live prices and stock', 'Secure Paystack checkout', 'Card, transfer or USSD', 'Pickup or delivery', 'Installation by Daystol engineers', 'Manufacturer warranty support']

const PAGE_SIZE = 12

const photoFor = (slug = '') => (slug.includes('solar') ? PHOTOS.solar : slug.includes('stabil') ? PHOTOS.stabilizers : PHOTOS.generators)
const countText = (n) => `${n} ${n === 1 ? 'product' : 'products'}`

/** Page numbers to show: first, last, and two either side of the current page. */
function pageList(page, pages) {
  const out = []
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) out.push(n)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

function Perks() {
  return (
    <div className="overflow-hidden border-b border-line bg-bg2 py-3.5">
      <p className="sr-only">Why buy from Daystol: {PERKS.join(', ')}.</p>
      <div className="marquee" aria-hidden="true">
        {[...PERKS, ...PERKS].map((p, i) => (
          <span key={i} className="flex items-center gap-2.5 whitespace-nowrap px-6 font-semibold text-mist">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFE52E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The shop. Category, search, filters, sort and page live in the URL, so every view can be shared or bookmarked. */
export default function Shop() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || ''
  const q = params.get('q') || ''
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'featured'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const stock = (params.get('stock') || '').split(',').filter((v) => STOCK_FILTERS.some((f) => f.value === v))
  const sale = params.get('sale') === 'true'

  const { data: categories } = useCategories()
  const activeCategory = categories?.find((c) => c.slug === category)
  const totalProducts = (categories || []).reduce((sum, c) => sum + (c.productCount || 0), 0)
  const { data, isPending, isError, isFetching, refetch } = useProducts({
    category, q, sort, page, limit: PAGE_SIZE, stock: stock.join(','), sale: sale ? 'true' : '',
  })

  usePageMeta(activeCategory ? `${activeCategory.name} | Shop | Daystol Group Ltd.` : 'Shop generators, solar and stabilizers', 'Buy diesel generators, solar power systems and servo stabilizers online from Daystol Power Services, with installation and maintenance across Nigeria.')

  // Update URL values; any filter change goes back to page 1
  const update = (changes) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === '' || v == null || v === false || (k === 'sort' && v === 'featured') || (k === 'page' && v === 1)) next.delete(k)
      else next.set(k, String(v))
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const toggleStock = (value) => {
    const list = stock.includes(value) ? stock.filter((v) => v !== value) : [...stock, value]
    update({ stock: list.join(',') })
  }

  // Search box: searches when typing pauses, or straight away on Enter
  const [search, setSearch] = useState(q)
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    if (search.trim() === q) return undefined
    const id = setTimeout(() => update({ q: search.trim() }), 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const goToPage = (n) => {
    update({ page: n })
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filtered = Boolean(q || category || stock.length || sale)
  const clearAll = () => {
    setSearch('')
    setParams(new URLSearchParams(sort === 'featured' ? {} : { sort }))
  }

  const catOptions = [{ slug: '', name: 'All products', productCount: totalProducts }, ...(categories || [])]
  const chip = (on) => `press shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-[15px] font-semibold ${on ? 'border-spark bg-spark text-midnight' : 'border-line bg-card text-fg hover:border-cyan'}`

  return (
    <>
      {/* Title, search and the live promise */}
      <section className="relative overflow-hidden border-b border-line pb-10 pt-9">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-spark" aria-hidden="true" />
        <svg aria-hidden="true" viewBox="0 0 1440 360" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-40">
          <path className="flowline" d="M-40 300 C 360 280, 520 120, 860 140 S 1260 60, 1500 80" fill="none" stroke="#FFE52E" strokeWidth="2" />
        </svg>
        <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-7 px-[18px] sm:px-7">
          <div className="flex max-w-[640px] flex-col gap-4">
            <nav aria-label="Breadcrumb" className="text-sm text-mist">
              <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
                <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
                <li aria-hidden="true">/</li>
                {activeCategory ? (
                  <>
                    <li><Link to="/shop" className="text-mist hover:text-fg">Shop</Link></li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page" className="text-fg">{activeCategory.name}</li>
                  </>
                ) : <li aria-current="page" className="text-fg">Shop</li>}
              </ol>
            </nav>
            <span className="self-start rounded-full bg-spark px-3 py-1.5 text-[13px] font-extrabold text-midnight">Daystol Power Services shop</span>
            <h1 className="m-0 font-display text-[clamp(26px,3.6vw,50px)] font-extrabold leading-[1.08] tracking-[-0.02em]">
              <span className="rise-line"><span style={{ animationDelay: '.1s' }}>Power equipment,</span></span>
              <span className="rise-line"><span className="text-at-power" style={{ animationDelay: '.25s' }}>delivered and installed.</span></span>
            </h1>
            <p className="fade-up m-0 text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.4s' }}>
              Diesel generators, solar power systems and servo stabilizers. Prices and stock update live.
            </p>
          </div>
          <form
            role="search"
            className="fade-up flex w-full max-w-[520px] flex-[1_1_380px] gap-2 rounded-full border border-line bg-card p-1.5"
            style={{ animationDelay: '.5s' }}
            onSubmit={(e) => {
              e.preventDefault()
              update({ q: search.trim() })
            }}
          >
            <label htmlFor="shop-search" className="sr-only">Search products</label>
            <span className="flex items-center pl-3.5 text-mist" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            </span>
            <input
              id="shop-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search generators, kVA, brand…"
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base text-fg outline-none placeholder:text-mist"
            />
            <button type="submit" className="press rounded-full bg-action px-5 py-3 font-bold text-white">Search</button>
          </form>
        </div>
      </section>

      <Perks />

      {/* Category tiles: tap again to show everything */}
      {categories?.length > 0 && (
        <section className="mx-auto grid max-w-[1320px] gap-3.5 px-[18px] pt-9 sm:grid-cols-3 sm:px-7">
          {categories.slice(0, 3).map((c) => {
            const on = c.slug === category
            const fallback = photoFor(c.slug)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => update({ category: on ? '' : c.slug })}
                className={`lift zoom-host relative h-[130px] overflow-hidden rounded-3xl p-0 text-left text-white sm:h-[150px] ${on ? 'ring-[3px] ring-spark' : ''}`}
              >
                <div className="zoom absolute inset-0">
                  {c.image ? <SmartImage image={c.image} sizes="(min-width: 640px) 33vw, 100vw" /> : <PhotoSlot src={fallback.src} label={fallback.label} />}
                </div>
                <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent from-30% to-[rgba(9,16,39,.88)] p-[18px]">
                  <strong className="font-display text-[17px]">{c.name}</strong>
                  <span className="text-sm text-[#D6DBEC]">{countText(c.productCount || 0)}</span>
                </span>
              </button>
            )
          })}
        </section>
      )}

      <section id="results" className="mx-auto flex max-w-[1320px] scroll-mt-24 flex-col items-start gap-7 px-[18px] pb-24 pt-7 sm:px-7 lg:flex-row">
        {/* Filters (desktop) and the engineer card */}
        <aside aria-label="Filters" className="flex w-full flex-col gap-3.5 lg:sticky lg:top-24 lg:w-[270px] lg:shrink-0">
          <div className="hidden flex-col gap-[22px] rounded-3xl border border-line bg-card p-[22px] lg:flex">
            <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
              <legend className="mb-2.5 font-bold">Category</legend>
              {catOptions.map((c) => {
                const on = c.slug === category
                return (
                  <button
                    key={c.slug || 'all'}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ category: c.slug })}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-fg ${on ? 'bg-card2 font-bold' : 'font-medium hover:bg-card2'}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[13px] text-mist">{c.productCount ?? ''}</span>
                  </button>
                )
              })}
            </fieldset>
            <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
              <legend className="mb-2.5 font-bold">Availability</legend>
              {STOCK_FILTERS.map((f) => (
                <label key={f.value} className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" checked={stock.includes(f.value)} onChange={() => toggleStock(f.value)} className="size-[18px] accent-action" />
                  {f.label}
                </label>
              ))}
              <label className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" checked={sale} onChange={() => update({ sale: !sale })} className="size-[18px] accent-action" />
                On sale
              </label>
            </fieldset>
          </div>
          <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-3xl border border-[#2A335E] bg-midnight p-[22px] text-[#F2F4FA]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-spark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#0D1330"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
            </span>
            <strong className="text-[17px]">Not sure what size you need?</strong>
            <span className="text-sm leading-normal text-[#B9C0D9]">Tell us what you want to power. Our engineers will recommend the right generator, solar kit or stabilizer.</span>
            <Link to="/contact?type=quote" className="press mt-1 self-start rounded-full bg-spark px-4 py-2.5 text-sm font-extrabold text-midnight hover:text-midnight">Ask an engineer</Link>
          </div>
        </aside>

        {/* Results */}
        <div className="flex w-full min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="-mx-[18px] flex max-w-full gap-2 overflow-x-auto px-[18px] pb-0.5 sm:mx-0 sm:px-0" role="group" aria-label="Category" style={{ scrollbarWidth: 'none' }}>
              {catOptions.map((c) => (
                <button key={c.slug || 'all'} type="button" aria-pressed={c.slug === category} onClick={() => update({ category: c.slug })} className={chip(c.slug === category)}>
                  {c.name}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2.5 text-sm text-mist">
              Sort
              <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="rounded-full border border-line bg-card px-3.5 py-2.5 font-semibold text-fg">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {/* Phones and tablets: availability filters as chips (the sidebar is hidden) */}
          <div className="-mx-[18px] flex gap-2 overflow-x-auto px-[18px] sm:mx-0 sm:px-0 lg:hidden" role="group" aria-label="Availability" style={{ scrollbarWidth: 'none' }}>
            {STOCK_FILTERS.map((f) => (
              <button key={f.value} type="button" aria-pressed={stock.includes(f.value)} onClick={() => toggleStock(f.value)} className={chip(stock.includes(f.value))}>{f.label}</button>
            ))}
            <button type="button" aria-pressed={sale} onClick={() => update({ sale: !sale })} className={chip(sale)}>On sale</button>
          </div>

          {isError ? (
            <div className="rounded-3xl border border-line bg-card p-8 text-center">
              <p className="m-0 text-mist">We couldn't load the products.</p>
              <button type="button" onClick={() => refetch()} className="press mt-4 rounded-full bg-fg px-6 py-3 font-bold text-bg">Try again</button>
            </div>
          ) : (
            <>
              <span className="flex flex-wrap items-center gap-3 text-sm text-mist" aria-live="polite">
                {isPending ? 'Loading products…' : `${countText(data.total)}${q ? ` for "${q}"` : ''}`}
                {filtered && !isPending && <button type="button" onClick={clearAll} className="font-bold text-fg underline">Clear filters</button>}
              </span>

              <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${isFetching && !isPending ? 'opacity-60 transition-opacity' : ''}`}>
                {isPending
                  ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
                  : data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {!isPending && data.items.length === 0 && (
                <div className="rounded-3xl border border-line bg-card p-8 text-center">
                  <p className="m-0 font-semibold">No products match {q ? `"${q}"` : 'these filters'} yet.</p>
                  <p className="mb-0 mt-2 text-mist">Tell us what you need and we'll source it for you.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    {filtered && <button type="button" onClick={clearAll} className="press rounded-full bg-fg px-6 py-3 font-bold text-bg">Show all products</button>}
                    <Link to="/contact?type=quote" className="press rounded-full bg-action px-6 py-3 font-bold text-white hover:text-white">Ask for a quote</Link>
                  </div>
                </div>
              )}

              {!isPending && data.pages > 1 && (
                <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-2 pt-3">
                  {page > 1 && (
                    <button type="button" onClick={() => goToPage(page - 1)} className="press flex h-11 items-center gap-2 rounded-full border border-line px-[18px] font-bold">
                      <span aria-hidden="true">←</span> Previous
                    </button>
                  )}
                  {pageList(page, data.pages).map((n, i) => (n === '…' ? (
                    <span key={`gap-${i}`} className="px-1 text-mist" aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                      aria-label={`Page ${n}`}
                      className={`press flex size-11 items-center justify-center rounded-full font-bold ${n === page ? 'bg-spark font-extrabold text-midnight' : 'border border-line'}`}
                    >
                      {n}
                    </button>
                  )))}
                  {page < data.pages && (
                    <button type="button" onClick={() => goToPage(page + 1)} className="press flex h-11 items-center gap-2 rounded-full border border-line px-[18px] font-bold">
                      Next <span className="nudge" aria-hidden="true">→</span>
                    </button>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
