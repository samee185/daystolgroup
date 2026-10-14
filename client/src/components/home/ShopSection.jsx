import { Link } from 'react-router'
import ProductCard, { ProductCardSkeleton } from '../ProductCard.jsx'
import SmartImage from '../SmartImage.jsx'
import PhotoSlot from '../ui/PhotoSlot.jsx'
import { PHOTOS } from '../../lib/photos.js'
import { useCategories, useProducts } from '../../hooks/useSiteData.js'

const PERKS = ['Live prices and stock', 'Secure Paystack checkout', 'Pickup or delivery', 'Installation by our engineers']

// Fallback photos for the three starter categories, until they have an image in the admin
const photoFor = (slug = '') => (slug.includes('solar') ? PHOTOS.solar : slug.includes('stabil') ? PHOTOS.stabilizers : PHOTOS.generators)

function CategoryTile({ category, big }) {
  const fallback = photoFor(category.slug)
  return (
    <Link to={`/shop?category=${category.slug}`} className={`lift zoom-host relative block overflow-hidden rounded-[26px] ${big ? 'row-span-2' : ''}`}>
      <div className="zoom absolute inset-0">
        {category.image ? <SmartImage image={category.image} sizes="(min-width: 1024px) 30vw, 100vw" /> : <PhotoSlot src={fallback.src} label={fallback.label} />}
      </div>
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[rgba(9,16,39,.88)] to-transparent p-4 pt-12 text-white sm:p-5">
        <strong className={`font-display ${big ? 'text-lg' : 'text-base'}`}>{category.name}</strong>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-spark font-extrabold text-midnight" aria-hidden="true">→</span>
      </span>
    </Link>
  )
}

/** Home page shop section: pitch, categories and live featured products. */
export default function ShopSection() {
  const { data: categories } = useCategories()
  const { data, isPending, isError } = useProducts({ sort: 'featured', limit: 4 })
  const cats = (categories || []).slice(0, 3)
  const hasProducts = !isError && (isPending || data.items.length > 0)

  return (
    <section className="relative overflow-hidden border-y border-line bg-bg2 py-20 sm:py-24">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full border-2 border-dashed border-line" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-12 px-5 sm:px-7">
        <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          <div className="reveal flex flex-col gap-5">
            <span className="self-start rounded-full bg-spark px-3.5 py-1.5 text-[13px] font-extrabold text-midnight">Daystol Power Services shop</span>
            <h2 className="h-section m-0">Keep the lights on. Buy online, we install.</h2>
            <p className="m-0 text-base leading-relaxed text-mist sm:text-[17px]">
              Diesel generators, solar power systems and servo stabilizers with live prices and stock. Pay securely, choose pickup or delivery, and let our engineers handle installation and maintenance.
            </p>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 rounded-2xl border border-line bg-card px-3.5 py-3 text-[15px] font-semibold">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-card2" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#01AFEE" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
              <Link to="/shop" className="shine press flex items-center justify-center gap-2.5 rounded-full bg-action px-6 py-4 font-bold text-white hover:text-white">Visit the shop <span className="nudge" aria-hidden="true">→</span></Link>
              <Link to="/contact?type=quote" className="press rounded-full border border-line px-6 py-4 text-center font-bold text-fg hover:text-fg">Not sure what size you need?</Link>
            </div>
          </div>

          {cats.length > 0 && (
            <div className="reveal grid grid-cols-[1.2fr_1fr] grid-rows-[130px_130px] gap-3.5 sm:grid-rows-[170px_170px]">
              {cats.map((c, i) => <CategoryTile key={c.id} category={c} big={i === 0} />)}
            </div>
          )}
        </div>

        {hasProducts && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="m-0 font-display text-xl font-extrabold sm:text-[22px]">Featured equipment</h3>
              <Link to="/shop" className="flex items-center gap-2 font-bold text-at-innovation">See all products <span className="nudge" aria-hidden="true">→</span></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {isPending
                ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
                : data.items.map((p, i) => <div key={p.id} className="reveal" style={{ animationDelay: `${i * 0.08}s` }}><ProductCard product={p} /></div>)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
