import { useQuery } from '@tanstack/react-query'
import { apiGet, formatNaira } from '../lib/api.js'

const STATUS_LABEL = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  on_order: 'Available on order',
}

function Check({ label, query, render }) {
  const tone = query.isPending ? 'bg-mist' : query.isError ? 'bg-magenta' : 'bg-spark'
  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      <h2 className="flex items-center gap-3 font-bold">
        <span className={`size-3 rounded-full ${tone}`} aria-hidden="true" />
        {label}
      </h2>
      <div className="mt-3 text-mist">
        {query.isPending && 'Checking…'}
        {query.isError && <span className="text-white">Failed: {query.error.message}</span>}
        {query.isSuccess && render(query.data)}
      </div>
    </section>
  )
}

export default function SystemCheck() {
  const health = useQuery({ queryKey: ['health'], queryFn: () => apiGet('/health') })
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => apiGet('/categories') })
  const products = useQuery({ queryKey: ['products', 'all'], queryFn: () => apiGet('/products', { limit: 12 }) })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <img src="/brand/daystol-logo.png" alt="Daystol Group Ltd" className="h-16 w-auto" />
      <h1 className="mt-8 font-display text-3xl font-extrabold">Milestone 1: system check</h1>
      <p className="mt-3 text-mist">If all three boxes turn yellow, React, Express, MongoDB and the admin are connected.</p>

      <div className="mt-10 grid gap-4">
        <Check label="API and database" query={health} render={(d) => `API is up, database ${d.db}.`} />
        <Check
          label="Categories"
          query={categories}
          render={(d) => (d.length ? d.map((c) => c.name).join(', ') : 'None yet. Run the seed script.')}
        />
        <Check
          label="Published products"
          query={products}
          render={(d) =>
            d.items.length ? (
              <ul className="grid gap-2">
                {d.items.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 text-white">
                    <span>{p.name}</span>
                    <span className="text-mist">
                      {p.quoteOnly ? 'Quote only' : formatNaira(p.price)}
                      {p.onSale && ` (sale, was ${formatNaira(p.regularPrice)})`} · {STATUS_LABEL[p.stockStatus]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              'None yet. Add one in the admin and tick "Published".'
            )
          }
        />
      </div>

      <a href="/admin" className="mt-10 inline-block rounded-full bg-action px-6 py-3 font-bold text-white">Open the admin dashboard</a>
    </main>
  )
}
