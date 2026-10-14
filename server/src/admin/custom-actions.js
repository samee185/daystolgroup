import { ValidationError } from 'adminjs'
import { Category, InventoryLog, Order, Product } from '../models/index.js'
import { statusLabel } from '../lib/orders.js'
import { cloudinary, cloudinaryReady, imageFor, publicIdFromKey, uploadImage } from '../lib/images.js'
import { hasRole } from './access.js'

/*
 * Server side of the custom admin screens (order page, product list and product editor).
 * Each one is an AdminJS action with no page of its own: the screens call them through the
 * admin API, so the usual login and role checks apply.
 */

const SHOP_STAFF = ['admin', 'sales']
const canShop = ({ currentAdmin }) => hasRole(currentAdmin, ...SHOP_STAFF)
const hidden = { isVisible: false, component: false }

/** AdminJS requires record actions to send the record back. */
const reply = (context, extra = {}) => ({ record: context.record.toJSON(context.currentAdmin), ...extra })

/** The JSON a screen sends arrives as one "data" field (so photos can travel in the same request). */
function readData(request) {
  const raw = request.payload?.data
  if (!raw) return {}
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    throw new ValidationError({}, { message: 'The form could not be read. Reload the page and try again.' })
  }
}

// ---------- Orders ----------

/** Where each order goes next. Pickup orders become "Ready for pickup"; delivery orders go "Out for delivery". */
export function nextStatus(order) {
  switch (order.status) {
    case 'paid': return 'processing'
    case 'processing': return order.fulfilment === 'delivery' ? 'out_for_delivery' : 'ready'
    case 'ready':
    case 'out_for_delivery': return 'completed'
    default: return null
  }
}

const NEXT_LABEL = {
  processing: 'Start processing',
  ready: 'Mark ready for pickup',
  out_for_delivery: 'Mark out for delivery',
  completed: 'Mark completed',
}

function orderView(o) {
  const next = nextStatus(o)
  return {
    id: String(o._id),
    reference: o.reference,
    status: o.status,
    statusLabel: statusLabel(o.status),
    next: next ? { status: next, label: NEXT_LABEL[next] } : null,
    fulfilment: o.fulfilment,
    items: o.items.map((i) => ({ name: i.name, sku: i.sku, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal, stockDeducted: i.stockDeducted, product: String(i.product) })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    deliveryFeeToConfirm: o.deliveryFeeToConfirm,
    total: o.total,
    customer: o.customer,
    address: o.address,
    customerNotes: o.customerNotes || '',
    staffNotes: o.staffNotes || '',
    payment: { reference: o.payment?.reference, channel: o.payment?.channel, amountPaid: o.payment?.amountPaid, paidAt: o.payment?.paidAt },
    stockShortfall: Boolean(o.stockShortfall),
    cancelledAt: o.cancelledAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }
}

export const orderActions = {
  orderDetails: {
    actionType: 'record',
    ...hidden,
    handler: async (request, response, context) => {
      const order = await Order.findById(context.record.id()).lean()
      return reply(context, { order: order ? orderView(order) : null, canEdit: canShop(context) })
    },
  },

  /** One click moves the order to its next stage. Only moves forward from the status the screen showed. */
  advanceStatus: {
    actionType: 'record',
    ...hidden,
    isAccessible: canShop,
    handler: async (request, response, context) => {
      const { from } = readData(request)
      const current = await Order.findById(context.record.id()).lean()
      if (!current) return reply(context, { error: 'Order not found.' })
      const to = nextStatus(current)
      if (!to || current.status !== from) {
        return reply(context, { order: orderView(current), error: 'This order was updated by someone else. The page now shows its current status.' })
      }
      const updated = await Order.findOneAndUpdate({ _id: current._id, status: from }, { $set: { status: to } }, { new: true }).lean()
      return reply(context, { order: orderView(updated || current), notice: `Order marked: ${statusLabel(to)}.` })
    },
  },

  saveOrderNote: {
    actionType: 'record',
    ...hidden,
    isAccessible: canShop,
    handler: async (request, response, context) => {
      const { staffNotes = '' } = readData(request)
      const updated = await Order.findByIdAndUpdate(
        context.record.id(),
        { $set: { staffNotes: String(staffNotes).slice(0, 5000) } },
        { new: true },
      ).lean()
      return reply(context, { order: updated ? orderView(updated) : null, notice: 'Note saved.' })
    },
  },
}

// ---------- Products ----------

const thumb = (key) => {
  if (!key || !cloudinaryReady) return null
  return cloudinary.url(publicIdFromKey(key), { secure: true, transformation: [{ width: 300, height: 300, crop: 'limit', fetch_format: 'auto', quality: 'auto' }] })
}

function productRow(p) {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    sku: p.sku || '',
    brand: p.brand || '',
    category: p.category?.name || '',
    price: p.price ?? null,
    salePrice: p.sale?.price ?? null,
    onSale: isSaleOn(p),
    quoteOnly: Boolean(p.quoteOnly),
    stockQty: p.stockQty ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 3,
    availableOnOrder: Boolean(p.availableOnOrder),
    published: Boolean(p.published),
    featured: Boolean(p.featured),
    image: thumb(p.imageKeys?.[0]),
    updatedAt: p.updatedAt,
  }
}

function isSaleOn(p, now = new Date()) {
  const s = p.sale
  if (!s || s.price == null || p.price == null || p.quoteOnly) return false
  if (s.startsAt && now < new Date(s.startsAt)) return false
  if (s.endsAt && now >= new Date(s.endsAt)) return false
  return s.price < p.price
}

const dateOnly = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')

function productForm(p) {
  return {
    id: p ? String(p._id) : null,
    name: p?.name || '',
    slug: p?.slug || '',
    category: p?.category ? String(p.category._id || p.category) : '',
    brand: p?.brand || '',
    sku: p?.sku || '',
    shortDescription: p?.shortDescription || '',
    description: p?.description || '',
    specifications: (p?.specifications || []).map((s) => ({ label: s.label, value: s.value })),
    photos: (p?.imageKeys || []).map((key) => ({ key, src: thumb(key) || imageFor(key)?.src || null })),
    quoteOnly: Boolean(p?.quoteOnly),
    price: p?.price ?? null,
    sale: { price: p?.sale?.price ?? null, startsAt: dateOnly(p?.sale?.startsAt), endsAt: dateOnly(p?.sale?.endsAt) },
    stockQty: p?.stockQty ?? 0,
    lowStockThreshold: p?.lowStockThreshold ?? 3,
    availableOnOrder: Boolean(p?.availableOnOrder),
    published: Boolean(p?.published),
    featured: Boolean(p?.featured),
  }
}

async function formExtras(productId) {
  const [categories, history] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).select('name').lean(),
    productId
      ? InventoryLog.find({ product: productId }).sort({ createdAt: -1 }).limit(6).select('change stockAfter reason order by createdAt').lean()
      : [],
  ])
  return {
    categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
    history: history.map((h) => ({ change: h.change, stockAfter: h.stockAfter, reason: h.reason, order: h.order, by: h.by, at: h.createdAt })),
    cloudinaryReady,
  }
}

const wholeOrNull = (v) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

/** Apply what the editor sent onto a product document. Business rules run in the model on save. */
function applyForm(doc, data) {
  const text = (v, max) => String(v ?? '').trim().slice(0, max)
  doc.name = text(data.name, 200)
  if (data.slug !== undefined) doc.slug = text(data.slug, 120) || undefined
  doc.category = data.category || undefined
  doc.brand = text(data.brand, 120) || undefined
  doc.sku = text(data.sku, 120) || undefined
  doc.shortDescription = text(data.shortDescription, 300)
  doc.description = String(data.description ?? '')
  doc.specifications = (Array.isArray(data.specifications) ? data.specifications : [])
    .map((s) => ({ label: text(s?.label, 80), value: text(s?.value, 160) }))
    .filter((s) => s.label && s.value)
    .slice(0, 30)
  doc.quoteOnly = Boolean(data.quoteOnly)
  doc.price = wholeOrNull(data.price) ?? undefined
  const sale = data.sale || {}
  const salePrice = wholeOrNull(sale.price)
  doc.sale = {
    price: salePrice ?? undefined,
    startsAt: sale.startsAt ? new Date(`${sale.startsAt}T00:00:00+01:00`) : undefined,
    endsAt: sale.endsAt ? new Date(`${sale.endsAt}T23:59:59+01:00`) : undefined,
  }
  const qty = wholeOrNull(data.stockQty)
  doc.stockQty = qty ?? 0
  const low = wholeOrNull(data.lowStockThreshold)
  doc.lowStockThreshold = low ?? 3
  doc.availableOnOrder = Boolean(data.availableOnOrder)
  doc.published = Boolean(data.published)
  doc.featured = Boolean(data.featured)
}

/** Mongoose validation errors as { field: message } for the editor. */
function fieldErrors(err) {
  if (err?.name !== 'ValidationError' || !err.errors) return null
  return Object.fromEntries(Object.entries(err.errors).map(([path, e]) => [path, e.message]))
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_IMAGE = 8 * 1024 * 1024
const MAX_PHOTOS = 12
const safeName = (filename) => String(filename || 'photo').toLowerCase().replace(/[^a-z0-9.]+/g, '-')

/** New photos arrive as files named "newPhotos.0", "newPhotos.1", … */
function newPhotoFiles(payload) {
  // AdminJS normally keeps the names flat ("newPhotos.0"); accept a nested list too
  const nested = payload?.newPhotos
  if (nested && typeof nested === 'object') return Object.values(nested).filter((f) => f && f.path)
  return Object.keys(payload || {})
    .filter((k) => /^newPhotos\.\d+$/.test(k))
    .sort((a, b) => Number(a.split('.')[1]) - Number(b.split('.')[1]))
    .map((k) => payload[k])
    .filter((f) => f && f.path)
}

/**
 * Save a product from the editor: fields, photo order, removed photos and new uploads.
 * `photoOrder` lists existing keys and "new:<n>" markers in the order staff arranged them.
 */
async function saveProduct(doc, data, payload, staffEmail) {
  const files = newPhotoFiles(payload)
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return { errors: { photos: `"${f.name}" isn't a JPG, PNG, WebP or AVIF photo.` } }
    if (f.size > MAX_IMAGE) return { errors: { photos: `"${f.name}" is larger than 8 MB.` } }
  }
  if (files.length && !cloudinaryReady) return { errors: { photos: 'Photo uploads need CLOUDINARY_URL in server/.env.' } }

  const stockBefore = doc.isNew ? 0 : doc.stockQty
  const keysBefore = [...(doc.imageKeys || [])]
  applyForm(doc, data)

  // Check the fields before uploading anything, so a typo doesn't leave stray photos on Cloudinary
  try {
    await doc.validate()
  } catch (err) {
    const errors = fieldErrors(err)
    if (errors) return { errors }
    throw err
  }

  const order = Array.isArray(data.photoOrder) ? data.photoOrder : keysBefore
  const uploaded = []
  for (const [i, f] of files.entries()) {
    const key = `daystol/products/${doc._id}/${Date.now()}-${i}-${safeName(f.name)}`
    // eslint-disable-next-line no-await-in-loop
    await uploadImage(f.path, publicIdFromKey(key))
    uploaded.push({ key, type: f.type })
  }

  const finalKeys = []
  const finalTypes = []
  for (const entry of order) {
    if (typeof entry === 'string' && entry.startsWith('new:')) {
      const u = uploaded[Number(entry.slice(4))]
      if (u) { finalKeys.push(u.key); finalTypes.push(u.type) }
    } else if (keysBefore.includes(entry)) {
      finalKeys.push(entry)
      finalTypes.push(doc.imageMimeTypes?.[keysBefore.indexOf(entry)] || 'image/jpeg')
    }
  }
  doc.imageKeys = finalKeys.slice(0, MAX_PHOTOS)
  doc.imageMimeTypes = finalTypes.slice(0, MAX_PHOTOS)

  try {
    await doc.save()
  } catch (err) {
    const errors = fieldErrors(err)
    if (errors) return { errors }
    throw err
  }

  // Remove photos staff took out, now that the product no longer points at them
  const removed = keysBefore.filter((k) => !doc.imageKeys.includes(k))
  if (removed.length && cloudinaryReady) {
    await Promise.allSettled(removed.map((k) => cloudinary.uploader.destroy(publicIdFromKey(k), { resource_type: 'image' })))
  }

  if (doc.stockQty !== stockBefore) {
    await InventoryLog.create({
      product: doc._id,
      productName: doc.name,
      change: doc.stockQty - stockBefore,
      stockAfter: doc.stockQty,
      reason: 'adjustment',
      by: staffEmail,
    })
  }
  return { product: doc }
}

export const productActions = {
  /** Every product with what the list screen needs. The shop is small, so the list filters in the browser. */
  productTable: {
    actionType: 'resource',
    ...hidden,
    handler: async () => {
      const products = await Product.find().sort({ updatedAt: -1 }).limit(1000).populate('category', 'name').lean()
      return { products: products.map((p) => productRow(p)) }
    },
  },

  togglePublished: {
    actionType: 'record',
    ...hidden,
    isAccessible: canShop,
    handler: async (request, response, context) => {
      const { published } = readData(request)
      try {
        const p = await Product.findByIdAndUpdate(context.record.id(), { $set: { published: Boolean(published) } }, { new: true })
          .populate('category', 'name').lean()
        return reply(context, { product: p ? productRow(p) : null })
      } catch (err) {
        // The model refuses to publish a product with missing details, e.g. no price
        const errors = fieldErrors(err)
        if (!errors) throw err
        return reply(context, { error: `Fix this product first: ${Object.values(errors)[0]}` })
      }
    },
  },

  productForm: {
    actionType: 'record',
    ...hidden,
    handler: async (request, response, context) => {
      const p = await Product.findById(context.record.id()).lean()
      return reply(context, { product: productForm(p), ...(await formExtras(p?._id)), canEdit: canShop(context) })
    },
  },

  newProductForm: {
    actionType: 'resource',
    ...hidden,
    handler: async (request, response, context) => ({ product: productForm(null), ...(await formExtras(null)), canEdit: canShop(context) }),
  },

  updateProduct: {
    actionType: 'record',
    ...hidden,
    isAccessible: canShop,
    handler: async (request, response, context) => {
      const doc = await Product.findById(context.record.id())
      if (!doc) return reply(context, { error: 'Product not found.' })
      const result = await saveProduct(doc, readData(request), request.payload, context.currentAdmin?.email)
      if (result.errors) return reply(context, { errors: result.errors })
      const fresh = await Product.findById(doc._id).lean()
      return reply(context, { product: productForm(fresh), ...(await formExtras(doc._id)), notice: 'Saved. The website shows the new details straight away.' })
    },
  },

  createProduct: {
    actionType: 'resource',
    ...hidden,
    isAccessible: canShop,
    handler: async (request, response, context) => {
      const doc = new Product()
      const result = await saveProduct(doc, readData(request), request.payload, context.currentAdmin?.email)
      if (result.errors) return { errors: result.errors }
      return { product: { id: String(doc._id) }, notice: 'Product created.' }
    },
  },
}
