import { imagesFor } from './images.js'

/**
 * Pricing and stock rules, shared by the public API and (later) checkout.
 * Sales switch on and off by date at request time, so no scheduled job is needed.
 */

export function isSaleActive(product, now = new Date()) {
  const sale = product?.sale
  if (!sale || sale.price == null || product.price == null) return false
  if (sale.startsAt && now < new Date(sale.startsAt)) return false
  if (sale.endsAt && now >= new Date(sale.endsAt)) return false
  return sale.price < product.price
}

/** Price the customer pays right now, in whole naira. null for quote-only products. */
export function currentPrice(product, now = new Date()) {
  if (product.quoteOnly) return null
  return isSaleActive(product, now) ? product.sale.price : product.price
}

export function stockStatus(product) {
  const qty = product.stockQty ?? 0
  if (qty > 0) return qty <= (product.lowStockThreshold ?? 3) ? 'low_stock' : 'in_stock'
  return product.availableOnOrder ? 'on_order' : 'out_of_stock'
}

export function canBuyOnline(product) {
  if (product.quoteOnly) return false
  const status = stockStatus(product)
  return status === 'in_stock' || status === 'low_stock'
}

/** Shape a product for the public website. Exact stock is only revealed when it's low. */
export function toPublicProduct(product, now = new Date()) {
  const onSale = isSaleActive(product, now)
  const status = stockStatus(product)
  return {
    id: String(product._id),
    name: product.name,
    slug: product.slug,
    category: product.category && typeof product.category === 'object' && product.category.name
      ? { name: product.category.name, slug: product.category.slug }
      : null,
    brand: product.brand || null,
    sku: product.sku || null,
    images: imagesFor(product.imageKeys, product.name),
    shortDescription: product.shortDescription,
    description: product.description || '',
    specifications: (product.specifications || []).map((s) => ({ label: s.label, value: s.value })),
    quoteOnly: Boolean(product.quoteOnly),
    price: currentPrice(product, now),
    regularPrice: product.quoteOnly ? null : product.price,
    onSale,
    saleEndsAt: onSale && product.sale.endsAt ? product.sale.endsAt : null,
    stockStatus: status,
    unitsLeft: status === 'low_stock' ? product.stockQty : null,
    canBuyOnline: canBuyOnline(product),
    featured: Boolean(product.featured),
  }
}
