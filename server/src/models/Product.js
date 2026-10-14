import mongoose from 'mongoose'
import { slugPlugin } from './plugins/slug.js'
import { pick, toBool, toDate, toNumber } from '../lib/values.js'
import { toValidationError } from '../lib/validation-error.js'

const specSchema = new mongoose.Schema(
  { label: { type: String, required: true, trim: true }, value: { type: String, required: true, trim: true } },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, trim: true },
    sku: { type: String, trim: true },
    // Uploaded through the admin (Cloudinary). The first image is the main product photo.
    imageKeys: { type: [String], default: [] },
    imageMimeTypes: { type: [String], default: [] },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '' },
    specifications: { type: [specSchema], default: [] },

    // Selling. Prices are whole naira, VAT inclusive.
    quoteOnly: { type: Boolean, default: false },
    price: { type: Number, min: 0 },
    sale: {
      price: { type: Number, min: 0 },
      startsAt: { type: Date },
      endsAt: { type: Date },
    },

    // Stock. Status (in stock / low / out / on order) is calculated, never typed by hand.
    stockQty: { type: Number, default: 0, min: [0, 'Stock cannot be negative.'] },
    lowStockThreshold: { type: Number, default: 3, min: 0 },
    availableOnOrder: { type: Boolean, default: false },

    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
)

productSchema.plugin(slugPlugin, { source: 'name' })
productSchema.index({ published: 1, category: 1, createdAt: -1 })
productSchema.index({ name: 'text', brand: 'text', shortDescription: 'text' })

/** Business rules that involve more than one field. Returns { path: message }. */
export function productErrors(p) {
  const errors = {}
  const quoteOnly = toBool(pick(p, 'quoteOnly'))
  const price = toNumber(pick(p, 'price'))

  if (!quoteOnly) {
    if (price === null || Number.isNaN(price) || price <= 0) errors.price = 'Enter a price, or tick "Quote only".'
    else if (!Number.isInteger(price)) errors.price = 'Use whole naira, no kobo.'
  }

  const salePrice = toNumber(pick(p, 'sale.price'))
  const startsAt = toDate(pick(p, 'sale.startsAt'))
  const endsAt = toDate(pick(p, 'sale.endsAt'))
  if (salePrice !== null) {
    if (quoteOnly) errors['sale.price'] = 'Quote-only products cannot have a sale price.'
    else if (Number.isNaN(salePrice) || salePrice <= 0 || !Number.isInteger(salePrice)) errors['sale.price'] = 'Enter the sale price in whole naira.'
    else if (price && salePrice >= price) errors['sale.price'] = 'The sale price must be lower than the normal price.'
  }
  if ((startsAt || endsAt) && salePrice === null) errors['sale.price'] = 'Enter a sale price, or clear the sale dates.'
  if (startsAt && endsAt && endsAt <= startsAt) errors['sale.endsAt'] = 'The sale must end after it starts.'

  const qty = toNumber(pick(p, 'stockQty'))
  if (qty !== null && (Number.isNaN(qty) || !Number.isInteger(qty))) errors.stockQty = 'Stock must be a whole number.'

  return errors
}

productSchema.pre('validate', function checkRules() {
  for (const [path, message] of Object.entries(productErrors(this.toObject()))) this.invalidate(path, message)
})

// AdminJS saves edits with findOneAndUpdate, which skips document hooks, so check the merged result here too.
productSchema.pre('findOneAndUpdate', async function checkRulesOnUpdate() {
  const update = this.getUpdate() || {}
  const set = update.$set || update
  const current = (await this.model.findOne(this.getQuery()).lean()) || {}

  // Apply the update on top of the stored document, whether keys arrive nested or dotted.
  const merged = { ...current }
  merged.sale = { ...(current.sale || {}) }
  for (const [key, value] of Object.entries(set)) {
    if (key === 'sale' && value && typeof value === 'object') merged.sale = { ...merged.sale, ...value }
    else if (key.startsWith('sale.')) merged.sale[key.slice(5)] = value
    else merged[key] = value
  }

  const errors = productErrors(merged)
  if (Object.keys(errors).length) throw toValidationError(errors)
})

export const Product = mongoose.model('Product', productSchema)
