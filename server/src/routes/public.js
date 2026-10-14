import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'

import {
  Category, COMPANIES, PmcPackage, Product, Project, PROJECT_CATEGORIES, Service, SiteSettings, TeamMember,
} from '../models/index.js'
import { toPublicProduct, currentPrice, stockStatus, canBuyOnline } from '../lib/pricing.js'
import { imageFor, imagesFor } from '../lib/images.js'
import { asyncHandler, HttpError } from '../middleware/errors.js'

const router = Router()

// Prices and stock change often: let browsers reuse a response only after checking with the server.
const fresh = (res) => res.set('Cache-Control', 'no-cache')

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,120}$/, 'Invalid slug')

router.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

router.get('/settings', asyncHandler(async (req, res) => {
  const s = await SiteSettings.findOne().lean()
  fresh(res).json({
    phone: s?.phone || null,
    emergencyPhone: s?.emergencyPhone || null,
    whatsappNumber: s?.whatsappNumber || null,
    email: s?.email || null,
    address: s?.address || null,
    officeHours: s?.officeHours || null,
    mapUrl: s?.mapUrl || null,
    socialLinks: s?.socialLinks || [],
    about: s?.aboutHeadline && s?.aboutStory?.replace(/<[^>]+>/g, '').trim()
      ? { headline: s.aboutHeadline, story: s.aboutStory }
      : null,
  })
}))

router.get('/categories', asyncHandler(async (req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).select('name slug description imageKey').lean(),
    Product.aggregate([{ $match: { published: true } }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
  ])
  const countFor = new Map(counts.map((c) => [String(c._id), c.n]))
  fresh(res).json(categories.map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    image: imageFor(c.imageKey, c.name),
    productCount: countFor.get(String(c._id)) || 0,
  })))
}))

const productQuery = z.object({
  category: slug.optional(),
  featured: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(80).optional(),
  // Availability filters from the shop sidebar: comma list of in_stock, on_order
  stock: z.string().optional().transform((v) => (v ? v.split(',').filter((x) => ['in_stock', 'on_order'].includes(x)) : [])),
  sale: z.enum(['true', 'false']).optional(),
  sort: z.enum(['featured', 'newest', 'price_asc', 'price_desc']).default('featured'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(24),
})

const SORTS = {
  featured: { featured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
}

router.get('/products', asyncHandler(async (req, res) => {
  const q = productQuery.parse(req.query)
  const filter = { published: true }

  if (q.category) {
    const cat = await Category.findOne({ slug: q.category }).select('_id').lean()
    if (!cat) throw new HttpError(404, 'Category not found')
    filter.category = cat._id
  }
  if (q.featured === 'true') filter.featured = true
  if (q.q) filter.$text = { $search: q.q }

  const and = []
  if (q.stock.length) {
    const any = []
    if (q.stock.includes('in_stock')) any.push({ stockQty: { $gt: 0 } })
    if (q.stock.includes('on_order')) any.push({ stockQty: { $lte: 0 }, availableOnOrder: true })
    and.push({ $or: any })
  }
  if (q.sale === 'true') {
    // Same rule as isSaleActive() in lib/pricing.js
    const now = new Date()
    and.push(
      { quoteOnly: { $ne: true }, 'sale.price': { $ne: null }, $expr: { $lt: ['$sale.price', '$price'] } },
      { $or: [{ 'sale.startsAt': null }, { 'sale.startsAt': { $lte: now } }] },
      { $or: [{ 'sale.endsAt': null }, { 'sale.endsAt': { $gt: now } }] },
    )
  }
  if (and.length) filter.$and = and

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ])

  const now = new Date()
  fresh(res).json({
    items: items.map((p) => toPublicProduct(p, now)),
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
    total,
  })
}))

router.get('/products/:slug', asyncHandler(async (req, res) => {
  const s = slug.parse(req.params.slug)
  const product = await Product.findOne({ slug: s, published: true }).populate('category', 'name slug').lean()
  if (!product) throw new HttpError(404, 'Product not found')
  fresh(res).json(toPublicProduct(product))
}))

/** Live price and stock for the cart and product pages. Never cached. */
const stockQuery = z.object({
  ids: z.string().transform((v) => v.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().regex(/^[a-f0-9]{24}$/, 'Invalid product id')).min(1).max(50)),
})

router.get('/stock', asyncHandler(async (req, res) => {
  const { ids } = stockQuery.parse(req.query)
  const products = await Product.find({ _id: { $in: ids }, published: true })
    .select('price quoteOnly sale stockQty lowStockThreshold availableOnOrder')
    .lean()
  const now = new Date()
  res.set('Cache-Control', 'no-store').json(products.map((p) => {
    const status = stockStatus(p)
    return {
      id: String(p._id),
      price: currentPrice(p, now),
      stockStatus: status,
      unitsLeft: status === 'low_stock' || status === 'in_stock' ? p.stockQty : 0,
      canBuyOnline: canBuyOnline(p),
    }
  }))
}))

router.get('/services', asyncHandler(async (req, res) => {
  const { company } = z.object({ company: z.enum(COMPANIES).optional() }).parse(req.query)
  const services = await Service.find({ published: true, ...(company ? { company } : {}) })
    .sort({ order: 1, title: 1 })
    .select('title slug company summary body imageKey')
    .lean()
  fresh(res).json(services.map(({ _id, imageKey, ...s }) => ({ id: String(_id), ...s, image: imageFor(imageKey, s.title) })))
}))

router.get('/projects', asyncHandler(async (req, res) => {
  const { category, limit } = z.object({
    category: z.enum(PROJECT_CATEGORIES).optional(),
    limit: z.coerce.number().int().min(1).max(60).default(60),
  }).parse(req.query)
  const projects = await Project.find({ published: true, ...(category ? { category } : {}) })
    .sort({ featured: -1, completedAt: -1 })
    .limit(limit)
    .select('title slug category location client coverKey summary completedAt featured')
    .lean()
  fresh(res).json(projects.map(({ _id, coverKey, ...p }) => ({ id: String(_id), ...p, cover: imageFor(coverKey, p.title) })))
}))

router.get('/projects/:slug', asyncHandler(async (req, res) => {
  const s = slug.parse(req.params.slug)
  const project = await Project.findOne({ slug: s, published: true }).lean()
  if (!project) throw new HttpError(404, 'Project not found')
  const { _id, __v, published, coverKey, coverMimeType, galleryKeys, galleryMimeTypes, ...rest } = project
  fresh(res).json({
    id: String(_id), ...rest, cover: imageFor(coverKey, rest.title), gallery: imagesFor(galleryKeys, rest.title),
  })
}))

router.get('/pmc-packages', asyncHandler(async (req, res) => {
  const packages = await PmcPackage.find().sort({ order: 1 }).select('name summary priceLabel features highlighted').lean()
  fresh(res).json(packages.map(({ _id, ...p }) => ({ id: String(_id), ...p })))
}))

router.get('/team', asyncHandler(async (req, res) => {
  const team = await TeamMember.find().sort({ order: 1 }).select('name position photoKey bio').lean()
  fresh(res).json(team.map(({ _id, photoKey, ...t }) => ({ id: String(_id), ...t, photo: imageFor(photoKey, t.name) })))
}))

export default router
