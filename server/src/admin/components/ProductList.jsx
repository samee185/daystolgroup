import React, { useMemo, useState } from 'react'
import {
  Badge, Icon, LoadError, Switch, callAction, naira, newUrl, recordUrl, stockInfo, useLoad, useToast,
} from './ui.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'In stock' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
  { id: 'sale', label: 'On sale' },
  { id: 'hidden', label: 'Hidden' },
]

const kindOf = (p) => (p.quoteOnly ? 'quote' : stockInfo(p.stockQty, p.lowStockThreshold, p.availableOnOrder).kind)

function matches(p, filter) {
  if (filter === 'all') return true
  if (filter === 'hidden') return !p.published
  if (filter === 'sale') return p.onSale
  return kindOf(p) === filter
}

/** Products screen: search, stock filters with counts, and an instant "On website" switch. */
export default function ProductList() {
  const [toast, notify] = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState({})
  const { data, error, loading, reload, setData } = useLoad(() => callAction({ resource: 'Product', action: 'productTable', method: 'get' }))
  const products = data?.products || []

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => [p.name, p.brand, p.sku, p.category].some((v) => v && v.toLowerCase().includes(q)))
  }, [products, query])
  const rows = searched.filter((p) => matches(p, filter))

  const togglePublished = async (p, next) => {
    setSaving((s) => ({ ...s, [p.id]: true }))
    setData((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, published: next } : x)) }))
    try {
      const res = await callAction({ resource: 'Product', record: p.id, action: 'togglePublished', data: { published: next } })
      if (res.error) throw new Error(res.error)
      if (res.product) setData((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? res.product : x)) }))
      notify(next ? `${p.name} is now on the website.` : `${p.name} is now hidden from the website.`)
    } catch (err) {
      setData((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, published: !next } : x)) }))
      notify(err.message, 'bad')
    } finally {
      setSaving((s) => ({ ...s, [p.id]: false }))
    }
  }

  if (error) return <div className="dz dz-page"><LoadError error={error} onRetry={reload} /></div>

  return (
    <div className="dz dz-page">
      {toast}
      <div className="dz-page-head dz-rise">
        <h1 className="dz-display dz-h1">Products {data && <span className="dz-muted dz-h1-count">({products.length})</span>}</h1>
        <a href={newUrl('Product')} className="dz-btn dz-btn-primary"><Icon name="plus" size={16} stroke={2.6} />Add product</a>
      </div>

      <div className="dz-toolbar dz-rise" style={{ animationDelay: '.05s' }}>
        <label className="dz-search">
          <Icon name="search" />
          <span className="dz-sr">Search products</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, brand, model or category" />
        </label>
        <div className="dz-filters" role="group" aria-label="Filter products">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="dz-filter">
              {f.label} <span className="dz-filter-count">{searched.filter((p) => matches(p, f.id)).length}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="dz-card dz-table-card dz-rise" style={{ animationDelay: '.1s' }} aria-busy={loading}>
        {loading && !data ? (
          <div className="dz-stack dz-gap-10">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="dz-skel" style={{ height: 56 }} />)}</div>
        ) : rows.length === 0 ? (
          <div className="dz-empty dz-empty-lg">
            <span className="dz-empty-icon"><Icon name="box" size={22} /></span>
            <span>{products.length === 0 ? 'No products yet.' : 'No products match.'}</span>
            {products.length === 0
              ? <a href={newUrl('Product')} className="dz-btn dz-btn-primary">Add your first product</a>
              : <button type="button" className="dz-btn dz-btn-ghost" onClick={() => { setQuery(''); setFilter('all') }}>Clear search and filters</button>}
          </div>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr><th scope="col">Product</th><th scope="col" className="dz-hide-sm">Category</th><th scope="col">Price</th><th scope="col">Stock</th><th scope="col">On website</th><th scope="col"><span className="dz-sr">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const stock = stockInfo(p.stockQty, p.lowStockThreshold, p.availableOnOrder)
                  return (
                    <tr key={p.id}>
                      <td>
                        <a href={recordUrl('Product', p.id, 'edit')} className="dz-product-cell">
                          <span className="dz-product-thumb">{p.image ? <img src={p.image} alt="" loading="lazy" /> : <Icon name="image" />}</span>
                          <span className="dz-stack dz-min0">
                            <strong className="dz-ellipsis">{p.name}</strong>
                            <span className="dz-muted dz-small dz-ellipsis">{[p.brand, p.sku].filter(Boolean).join(' · ') || p.slug}</span>
                          </span>
                        </a>
                      </td>
                      <td className="dz-hide-sm">{p.category}</td>
                      <td>
                        {p.quoteOnly ? <span className="dz-muted">Quote only</span> : (
                          <span className="dz-row dz-gap-8 dz-nowrap">
                            <strong>{naira(p.onSale ? p.salePrice : p.price)}</strong>
                            {p.onSale && <span className="dz-sale">SALE</span>}
                          </span>
                        )}
                      </td>
                      <td>{p.quoteOnly ? <Badge tone="mute">By quote</Badge> : <Badge tone={stock.tone}>{p.stockQty > 0 && stock.kind === 'in' ? `${p.stockQty} in stock` : stock.text}</Badge>}</td>
                      <td><Switch on={p.published} onChange={(next) => togglePublished(p, next)} label={`Show ${p.name} on the website`} disabled={saving[p.id]} /></td>
                      <td><a href={recordUrl('Product', p.id, 'edit')} className="dz-btn dz-btn-ghost dz-btn-sm">Edit</a></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="dz-muted dz-small dz-m0">The On website switch publishes or hides a product straight away.</p>
    </div>
  )
}
