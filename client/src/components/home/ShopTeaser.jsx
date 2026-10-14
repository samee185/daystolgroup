import { Link } from 'react-router'
import ProductCard, { ProductCardSkeleton } from '../ProductCard.jsx'
import { useProducts } from '../../hooks/useSiteData.js'

/** A row of live featured products, used on company pages. Hidden until products exist. */
export default function ShopTeaser({ title = 'Featured equipment' }) {
  const { data, isPending, isError } = useProducts({ sort: 'featured', limit: 4 })
  if (isError || (!isPending && data.items.length === 0)) return null

  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-10 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="m-0 font-display text-xl font-extrabold sm:text-[22px]">{title}</h3>
        <Link to="/shop" className="flex items-center gap-2 font-bold text-at-innovation">See all products <span className="nudge" aria-hidden="true">→</span></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
          : data.items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
