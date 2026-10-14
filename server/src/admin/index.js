import AdminJS, { ComponentLoader, ValidationError } from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import { Database, Resource } from '@adminjs/mongoose'
import uploadFeature from '@adminjs/upload'
import MongoStore from 'connect-mongo'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'node:url'

import { env } from '../config/env.js'
import {
  Category, COMPANY_LABELS, Enquiry, ENQUIRY_STATUSES, ENQUIRY_TYPES, EQUIPMENT, FULFILMENT, InventoryLog, Order,
  ORDER_STATUSES, PmcPackage, Product, Project, REQUEST_STATUSES, Service, ServiceRequest, SiteSettings,
  STOCK_REASONS, TeamMember, User,
} from '../models/index.js'
import { cancelOrder } from '../lib/orders.js'
import { ALL_STAFF, accessFor, hasRole } from './access.js'
import { CloudinaryProvider } from './cloudinary-provider.js'
import { dashboardData } from './dashboard.js'
import { orderActions as orderScreenActions, productActions } from './custom-actions.js'

AdminJS.registerAdapter({ Database, Resource })

const inbox = { name: 'Inbox', icon: 'Inbox' }
const shop = { name: 'Shop', icon: 'ShoppingCart' }
const content = { name: 'Website content', icon: 'Layout' }
const settings = { name: 'Settings', icon: 'Settings' }

const slugHelp = 'Web address. Leave blank to generate it from the name.'

// ---------- Image uploads (stored on Cloudinary) ----------
const componentLoader = new ComponentLoader()

// Custom Daystol screens (React). AdminJS bundles them at startup; styles are in admin-ui/admin.css.
const component = (name, file) => componentLoader.add(name, fileURLToPath(new URL(`./components/${file}`, import.meta.url)))
const Components = {
  Dashboard: component('DaystolDashboard', 'Dashboard.jsx'),
  OrderShow: component('DaystolOrderShow', 'OrderShow.jsx'),
  ProductList: component('DaystolProductList', 'ProductList.jsx'),
  ProductEditor: component('DaystolProductEditor', 'ProductEditor.jsx'),
}
const provider = new CloudinaryProvider()
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_IMAGE = 8 * 1024 * 1024 // 8 MB

const safeName = (filename) => String(filename).toLowerCase().replace(/[^a-z0-9.]+/g, '-')

/** One image per record, e.g. a category picture. */
const singleImage = (folder, field) =>
  uploadFeature({
    componentLoader,
    provider,
    properties: {
      key: `${field}Key`,
      mimeType: `${field}MimeType`,
      file: `${field}Upload`,
      filePath: `${field}Path`,
      filesToDelete: `${field}ToDelete`,
    },
    uploadPath: (record, filename) => `daystol/${folder}/${record.id()}/${field}-${Date.now()}-${safeName(filename)}`,
    validation: { mimeTypes: IMAGE_TYPES, maxSize: MAX_IMAGE },
  })

/** Several images per record, e.g. product photos or a project gallery. */
const manyImages = (folder, keysField, typesField, uploadField) =>
  uploadFeature({
    componentLoader,
    provider,
    multiple: true,
    properties: {
      key: keysField,
      mimeType: typesField,
      file: uploadField,
      filePath: `${uploadField}Paths`,
      filesToDelete: `${uploadField}ToDelete`,
    },
    uploadPath: (record, filename) => `daystol/${folder}/${record.id()}/${Date.now()}-${safeName(filename)}`,
    validation: { mimeTypes: IMAGE_TYPES, maxSize: MAX_IMAGE },
  })

const hideKeys = (...names) => Object.fromEntries(names.map((n) => [n, { isVisible: false }]))

/** Hash a password typed into the admin form; never store or show it in plain text. */
async function hashPasswordBefore(request) {
  if (request.payload?.password) {
    const { password, ...rest } = request.payload
    if (password.length < 10) {
      throw new ValidationError({ password: { message: 'Passwords must be at least 10 characters.' } })
    }
    request.payload = { ...rest, passwordHash: await bcrypt.hash(password, 12) }
  } else if (request.payload) {
    delete request.payload.password
  }
  return request
}

// Messages from the website. Created by visitors only; staff update status and notes.
const inboxActions = (editors) => ({
  ...accessFor({ read: ALL_STAFF, write: editors, remove: ['admin'] }),
  new: { isAccessible: false },
})

// ---------- Shop: orders and stock history ----------

/** Log stock changes made by hand in the product form, so the stock history is complete. */
const productEditHooks = {
  before: async (request, context) => {
    if (request.method === 'post' && request.params?.recordId) {
      const current = await Product.findById(request.params.recordId).select('stockQty').lean()
      context.stockBefore = current?.stockQty
    }
    return request
  },
  after: async (response, request, context) => {
    const record = response.record
    if (request.method !== 'post' || context.stockBefore === undefined || !record) return response
    if (record.errors && Object.keys(record.errors).length) return response
    const after = Number(record.params?.stockQty)
    if (!Number.isNaN(after) && after !== context.stockBefore) {
      await InventoryLog.create({
        product: request.params.recordId,
        productName: record.params?.name || 'Product',
        change: after - context.stockBefore,
        stockAfter: after,
        reason: 'adjustment',
        by: context.currentAdmin?.email,
      })
    }
    return response
  },
}

const SHOP_STAFF = ['admin', 'sales']
const orderAccess = accessFor({ read: ALL_STAFF, write: SHOP_STAFF, remove: ['admin'] })

const orderActions = {
  ...orderAccess,
  ...orderScreenActions,
  show: { ...orderAccess.show, component: Components.OrderShow, hideActionHeader: true },
  new: { isAccessible: false },
  edit: {
    ...orderAccess.edit,
    // Cancelling must go through the Cancel order button, which also puts the items back in stock.
    before: async (request) => {
      if (request.method === 'post' && request.payload?.status === 'cancelled') {
        const current = await Order.findById(request.params.recordId).select('status').lean()
        if (current?.status !== 'cancelled') {
          throw new ValidationError({ status: { message: 'Use the "Cancel order" button instead, so the items go back into stock.' } })
        }
      }
      return request
    },
  },
  cancelOrder: {
    actionType: 'record',
    icon: 'XCircle',
    label: 'Cancel order',
    component: false,
    guard: 'Cancel this order? Any items taken from stock will be put back. If the customer paid, refund them from your Paystack dashboard.',
    isAccessible: ({ currentAdmin }) => hasRole(currentAdmin, ...SHOP_STAFF),
    isVisible: ({ record }) => record?.params?.status !== 'cancelled',
    handler: async (request, response, context) => {
      const { record, resource, currentAdmin, h } = context
      const { order, restocked, wasPaid } = await cancelOrder(record.id(), currentAdmin?.email)
      const fresh = await resource.findOne(record.id())
      const message = !order
        ? 'Order not found.'
        : [
          'Order cancelled.',
          restocked ? 'Items are back in stock.' : null,
          wasPaid ? 'Remember to refund the customer from your Paystack dashboard.' : null,
        ].filter(Boolean).join(' ')
      return {
        record: (fresh || record).toJSON(currentAdmin),
        redirectUrl: h.recordActionUrl({ resourceId: resource.id(), recordId: record.id(), actionName: 'show' }),
        notice: { message, type: order ? 'success' : 'error' },
      }
    },
  },
}

const resources = [
  {
    resource: Order,
    options: {
      navigation: shop,
      sort: { sortBy: 'createdAt', direction: 'desc' },
      listProperties: ['reference', 'customer.name', 'total', 'fulfilment', 'status', 'stockShortfall', 'createdAt'],
      filterProperties: ['reference', 'status', 'fulfilment', 'customer.name', 'customer.phone', 'customer.email', 'stockShortfall', 'createdAt'],
      showProperties: [
        'reference', 'status', 'stockShortfall', 'items', 'subtotal', 'deliveryFee', 'deliveryFeeToConfirm', 'total',
        'customer.name', 'customer.phone', 'customer.email', 'fulfilment', 'address.line', 'address.city', 'address.state',
        'customerNotes', 'payment.reference', 'payment.channel', 'payment.amountPaid', 'payment.paidAt', 'staffNotes',
        'cancelledAt', 'createdAt', 'updatedAt',
      ],
      editProperties: ['status', 'staffNotes'],
      properties: {
        status: { availableValues: ORDER_STATUSES },
        fulfilment: { availableValues: FULFILMENT },
        total: { description: 'Whole naira, including delivery.' },
        stockShortfall: { description: 'Ticked when an item sold out before this payment came in. Call the customer before processing.' },
        deliveryFeeToConfirm: { description: 'No flat delivery fee was set, so agree the delivery cost with the customer.' },
        staffNotes: { type: 'textarea', description: 'Internal notes. Customers never see these.' },
        customerNotes: { type: 'textarea' },
        accessToken: { isVisible: false },
        'payment.attempts': { isVisible: false },
        'payment.provider': { isVisible: false },
      },
      actions: orderActions,
    },
  },
  {
    resource: InventoryLog,
    options: {
      navigation: shop,
      sort: { sortBy: 'createdAt', direction: 'desc' },
      listProperties: ['createdAt', 'productName', 'change', 'stockAfter', 'reason', 'order', 'by'],
      filterProperties: ['product', 'reason', 'order', 'createdAt'],
      properties: {
        reason: { availableValues: STOCK_REASONS },
        change: { description: 'Negative when stock went down.' },
      },
      actions: {
        ...accessFor({ read: ALL_STAFF, write: [], remove: [] }),
        new: { isAccessible: false },
        edit: { isAccessible: false },
        delete: { isAccessible: false },
        bulkDelete: { isAccessible: false },
      },
    },
  },
  {
    resource: ServiceRequest,
    options: {
      navigation: inbox,
      sort: { sortBy: 'createdAt', direction: 'desc' },
      listProperties: ['reference', 'equipment', 'urgent', 'name', 'phone', 'status', 'createdAt'],
      filterProperties: ['reference', 'equipment', 'urgent', 'status', 'name', 'phone', 'createdAt'],
      showProperties: ['reference', 'status', 'urgent', 'equipment', 'issue', 'photos', 'name', 'phone', 'email', 'address', 'staffNotes', 'createdAt', 'updatedAt'],
      editProperties: ['status', 'staffNotes'],
      properties: {
        equipment: { availableValues: EQUIPMENT },
        status: { availableValues: REQUEST_STATUSES },
        issue: { type: 'textarea' },
        staffNotes: { type: 'textarea', description: 'Internal notes. Customers never see these.' },
        photos: { description: 'Photos sent with the report. Click one to open it full size.' },
        ...hideKeys('photoKeys', 'photoMimeTypes'),
      },
      actions: inboxActions(['admin', 'support']),
    },
    features: [manyImages('service-requests', 'photoKeys', 'photoMimeTypes', 'photos')],
  },
  {
    resource: Enquiry,
    options: {
      navigation: inbox,
      sort: { sortBy: 'createdAt', direction: 'desc' },
      listProperties: ['reference', 'type', 'name', 'phone', 'topic', 'status', 'createdAt'],
      filterProperties: ['reference', 'type', 'status', 'name', 'phone', 'email', 'createdAt'],
      showProperties: ['reference', 'status', 'type', 'topic', 'message', 'name', 'phone', 'email', 'organisation', 'preferredContact', 'staffNotes', 'createdAt', 'updatedAt'],
      editProperties: ['status', 'staffNotes'],
      properties: {
        type: { availableValues: ENQUIRY_TYPES },
        status: { availableValues: ENQUIRY_STATUSES },
        message: { type: 'textarea' },
        topic: { description: 'The service, property interest, product or package they asked about.' },
        staffNotes: { type: 'textarea', description: 'Internal notes. Customers never see these.' },
      },
      actions: inboxActions(['admin', 'sales', 'support']),
    },
  },
  {
    resource: Product,
    options: {
      navigation: shop,
      listProperties: ['name', 'category', 'price', 'stockQty', 'quoteOnly', 'published', 'updatedAt'],
      filterProperties: ['name', 'category', 'published', 'quoteOnly', 'featured', 'stockQty'],
      editProperties: [
        'name', 'slug', 'category', 'brand', 'sku', 'shortDescription', 'description', 'specifications', 'photos',
        'quoteOnly', 'price', 'sale.price', 'sale.startsAt', 'sale.endsAt',
        'stockQty', 'lowStockThreshold', 'availableOnOrder', 'published', 'featured',
      ],
      properties: {
        slug: { description: slugHelp },
        description: { type: 'richtext' },
        ...hideKeys('imageKeys', 'imageMimeTypes'),
        photos: { description: 'JPG, PNG or WebP, up to 8 MB each. The first photo is the main one.' },
        price: { description: 'Whole naira, VAT inclusive. Not needed for quote-only products.' },
        quoteOnly: { description: 'Show "Request quote" instead of online checkout. Use for high-value items.' },
        'sale.price': { description: 'Optional sale price in whole naira. Must be lower than the price.' },
        'sale.startsAt': { description: 'Leave blank to start the sale immediately.' },
        'sale.endsAt': { description: 'Leave blank for no end date.' },
        stockQty: { description: 'Units in stock. Paid orders reduce it automatically; changes you make here are recorded in Stock history.' },
        lowStockThreshold: { description: 'At or below this number, the site shows "Only X left".' },
        availableOnOrder: { description: 'When out of stock, show "Available on order" instead of "Out of stock".' },
        published: { description: 'Only published products appear on the website.' },
      },
      actions: (() => {
        const access = accessFor({ read: ALL_STAFF, write: ['admin', 'sales'], remove: ['admin'] })
        return {
          ...access,
          ...productActions,
          // The Daystol list and editor replace the standard screens; the standard edit stays as a fallback for the API.
          list: { ...access.list, component: Components.ProductList, hideActionHeader: true },
          new: { ...access.new, component: Components.ProductEditor, hideActionHeader: true },
          edit: { ...access.edit, ...productEditHooks, component: Components.ProductEditor, hideActionHeader: true },
        }
      })(),
    },
    features: [manyImages('products', 'imageKeys', 'imageMimeTypes', 'photos')],
  },
  {
    resource: Category,
    options: {
      navigation: shop,
      listProperties: ['name', 'slug', 'order'],
      sort: { sortBy: 'order', direction: 'asc' },
      properties: { slug: { description: slugHelp }, ...hideKeys('imageKey', 'imageMimeType') },
      actions: accessFor({ read: ALL_STAFF, write: ['admin', 'sales'], remove: ['admin'] }),
    },
    features: [singleImage('categories', 'image')],
  },
  {
    resource: Service,
    options: {
      navigation: content,
      listProperties: ['title', 'company', 'order', 'published'],
      filterProperties: ['title', 'company', 'published'],
      properties: {
        slug: { description: slugHelp },
        body: { type: 'richtext' },
        company: { availableValues: COMPANY_LABELS, description: "Which Daystol company provides it. It appears on that company's page." },
        ...hideKeys('imageKey', 'imageMimeType'),
      },
      actions: accessFor({ read: ALL_STAFF, write: ['admin', 'editor'], remove: ['admin', 'editor'] }),
    },
    features: [singleImage('services', 'image')],
  },
  {
    resource: Project,
    options: {
      navigation: content,
      listProperties: ['title', 'category', 'location', 'completedAt', 'published'],
      filterProperties: ['title', 'category', 'published', 'featured'],
      properties: {
        slug: { description: slugHelp },
        caseStudy: { type: 'richtext', description: 'Optional. If filled in, the project gets its own case-study page.' },
        client: { description: 'Leave blank if the client is confidential.' },
        category: { availableValues: COMPANY_LABELS, description: 'The Daystol company that delivered the project.' },
        ...hideKeys('coverKey', 'coverMimeType', 'galleryKeys', 'galleryMimeTypes'),
        coverUpload: { description: 'Main photo shown in the project list.' },
        galleryUploads: { description: 'Extra photos for the case-study page.' },
      },
      actions: accessFor({ read: ALL_STAFF, write: ['admin', 'editor'], remove: ['admin', 'editor'] }),
    },
    features: [
      singleImage('projects', 'cover'),
      manyImages('projects', 'galleryKeys', 'galleryMimeTypes', 'galleryUploads'),
    ],
  },
  {
    resource: PmcPackage,
    options: {
      navigation: content,
      listProperties: ['name', 'priceLabel', 'highlighted', 'order'],
      sort: { sortBy: 'order', direction: 'asc' },
      properties: { priceLabel: { description: 'Free text, e.g. "From ₦150,000 per quarter" or "Custom pricing".' } },
      actions: accessFor({ read: ALL_STAFF, write: ['admin', 'editor'], remove: ['admin', 'editor'] }),
    },
  },
  {
    resource: TeamMember,
    options: {
      navigation: content,
      listProperties: ['name', 'position', 'order'],
      sort: { sortBy: 'order', direction: 'asc' },
      properties: { ...hideKeys('photoKey', 'photoMimeType') },
      actions: accessFor({ read: ALL_STAFF, write: ['admin', 'editor'], remove: ['admin', 'editor'] }),
    },
    features: [singleImage('team', 'photo')],
  },
  {
    resource: SiteSettings,
    options: {
      navigation: settings,
      listProperties: ['phone', 'emergencyPhone', 'whatsappNumber', 'email', 'updatedAt'],
      properties: {
        emergencyPhone: { description: '24/7 emergency line shown at the top of every page.' },
        notificationEmail: { description: 'Where new orders, service requests and enquiries are sent.' },
        pickupAddress: { type: 'textarea', description: 'Where customers collect shop orders. Leave blank to use the office address.' },
        deliveryArea: { description: 'Shown at checkout, e.g. "Lagos and Ogun". Leave blank if you deliver anywhere.' },
        deliveryFee: { description: 'Flat delivery fee in whole naira, added at checkout. Leave blank to agree delivery costs with each customer after payment.' },
        deliveryNote: { type: 'textarea', description: 'Optional line shown at checkout, e.g. "Delivery within 2 to 5 working days".' },
        aboutHeadline: { description: 'About page, "Who we are" heading. The section appears once this and the story are filled in.' },
        aboutStory: { type: 'richtext', description: 'About page: the group\'s story, in a few short paragraphs.' },
      },
      actions: {
        ...accessFor({ read: ALL_STAFF, write: ['admin'], remove: [] }),
        new: { isAccessible: false },
        delete: { isAccessible: false },
        bulkDelete: { isAccessible: false },
      },
    },
  },
  {
    resource: User,
    options: {
      navigation: settings,
      listProperties: ['name', 'email', 'roles', 'active'],
      properties: {
        passwordHash: { isVisible: false },
        password: {
          type: 'password',
          isVisible: { list: false, filter: false, show: false, edit: true },
          description: 'At least 10 characters. Leave blank when editing to keep the current password.',
        },
        roles: {
          description: 'admin: everything. editor: website content. sales: products and orders. support: service requests.',
        },
        active: { description: 'Untick to block this person from logging in without deleting the account.' },
      },
      actions: {
        ...accessFor({ read: ['admin'], write: ['admin'], remove: ['admin'] }),
        new: { isAccessible: ({ currentAdmin }) => currentAdmin?.roles?.includes('admin'), before: hashPasswordBefore },
        edit: { isAccessible: ({ currentAdmin }) => currentAdmin?.roles?.includes('admin'), before: hashPasswordBefore },
      },
    },
  },
]

// Compared against when the email is unknown, so failed logins take the same time either way.
const TIMING_HASH = bcrypt.hashSync('daystol-timing-equaliser', 12)

async function authenticate(email, password) {
  if (!email || !password) return null
  const user = await User.findOne({ email: String(email).toLowerCase().trim(), active: true }).select('+passwordHash')
  if (!user) {
    await bcrypt.compare(password, TIMING_HASH)
    return null
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null
  return { id: user.id, email: user.email, title: user.name, roles: user.roles }
}

export async function buildAdmin() {
  const admin = new AdminJS({
    rootPath: '/admin',
    resources,
    componentLoader,
    dashboard: {
      component: Components.Dashboard,
      handler: async (request, response, context) => dashboardData(context.currentAdmin),
    },
    assets: {
      styles: [
        'https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Instrument+Sans:wght@400;500;600;700&display=swap',
        '/admin-ui/admin.css',
      ],
      scripts: ['/admin-ui/admin.js'],
    },
    branding: {
      companyName: 'Daystol Admin',
      logo: '/brand/daystol-logo.png',
      withMadeWithLove: false,
      theme: {
        colors: {
          // Daystol colours for the standard AdminJS screens (dark mode is handled in admin-ui/admin.css)
          accent: '#01AFEE',
          hoverBg: '#B8106A',
          filterBg: '#0D1330',
          primary100: '#D4157A',
          primary80: '#DD3D8F',
          primary60: '#E666A6',
          primary40: '#EF99C4',
          primary20: '#F7CCE1',
        },
      },
    },
    locale: {
      language: 'en',
      translations: { en: { labels: { PmcPackage: 'PMC Packages', SiteSettings: 'Site Settings', TeamMember: 'Team', ServiceRequest: 'Fault reports', Enquiry: 'Enquiries', InventoryLog: 'Stock history' } } },
    },
  })

  // The upload feature ships its own admin components, which AdminJS bundles once at startup.
  if (env.isProd) await admin.initialize()
  else admin.watch()

  const sessionStore = MongoStore.create({
    mongoUrl: env.MONGODB_URI,
    collectionName: 'admin_sessions',
    ttl: 8 * 60 * 60,
  })

  const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    { authenticate, cookieName: 'daystol_admin', cookiePassword: env.SESSION_SECRET },
    null,
    {
      store: sessionStore,
      secret: env.SESSION_SECRET,
      name: 'daystol_admin',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: env.isProd, maxAge: 8 * 60 * 60 * 1000 },
    },
  )

  return { admin, router }
}
