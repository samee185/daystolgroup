import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import compression from 'compression'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { env } from './config/env.js'
import { connectDB } from './db.js'
import { buildAdmin } from './admin/index.js'
import publicRoutes from './routes/public.js'
import formRoutes from './routes/forms.js'
import shopRoutes, { paystackWebhook } from './routes/shop.js'
import { asyncHandler, errorHandler, notFoundApi } from './middleware/errors.js'
import { buildRobots, buildSitemap, metaForPath, REDIRECTS } from './lib/seo.js'
import { renderHtml } from './lib/seo-html.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(here, '../../client/dist')
const brandDir = path.resolve(here, '../../client/public/brand')

const app = express()
app.set('trust proxy', 1) // Hostinger sits behind a proxy; needed for secure cookies and rate limits
app.disable('x-powered-by')
app.use(compression())

// ---------- Admin dashboard ----------
// Mounted before helmet and the JSON parser: AdminJS parses its own forms and needs its own scripts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: (req) => req.method !== 'POST',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts. Try again in 15 minutes.',
})
app.use('/admin/login', loginLimiter)

// Logo for the admin header (also served by Vite in development)
app.use('/brand', express.static(brandDir, { maxAge: '7d' }))
// Styles and the light/dark switch for the admin
app.use('/admin-ui', express.static(fileURLToPath(new URL('../admin-ui', import.meta.url)), { maxAge: '1h' }))

// The admin is built in the background after the server starts (bundling its screens can take a minute),
// so the website answers straight away. Until it's ready, /admin shows a short "starting" page.
const ADMIN_PATH = '/admin'
let adminRouter = null
let adminError = null
app.use(ADMIN_PATH, (req, res, next) => {
  if (adminRouter) return adminRouter(req, res, next)
  res.status(503).set('Retry-After', '20').type('html').send(
    adminError
      ? '<p style="font-family:sans-serif">The admin dashboard could not start. Check the server logs.</p>'
      : '<meta http-equiv="refresh" content="15"><p style="font-family:sans-serif">The admin dashboard is starting. This page refreshes by itself.</p>',
  )
})

// ---------- Everything else ----------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        'connect-src': ["'self'"],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  }),
)
// Paystack webhook: needs the raw request body to check the signature, so it comes before the JSON parser.
app.post('/api/paystack/webhook', express.raw({ type: '*/*', limit: '200kb' }), paystackWebhook)

app.use(express.json({ limit: '100kb' }))

const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false })
app.use('/api', apiLimiter, publicRoutes)
app.use('/api', formRoutes)
app.use('/api', shopRoutes)
app.use('/api', notFoundApi)

// ---------- Search engines ----------
const baseUrl = env.PUBLIC_URL.replace(/\/+$/, '')

app.get('/robots.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(buildRobots(baseUrl)))
app.get('/sitemap.xml', asyncHandler(async (req, res) => {
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await buildSitemap(baseUrl))
}))
for (const [from, to] of Object.entries(REDIRECTS)) app.get(from, (req, res) => res.redirect(301, to))

// In production, Express also serves the built React app (one deployment on Hostinger).
if (fs.existsSync(clientDist)) {
  const indexFile = path.join(clientDist, 'index.html')
  let template = fs.readFileSync(indexFile, 'utf8')

  // Built files have content hashes in their names, so they can be cached for a long time.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { maxAge: '1y', immutable: true }))
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }))

  // A missing file (anything with an extension, e.g. /logo.png) gets a plain 404, never the web page.
  // Sending the page instead makes browsers report confusing "MIME type text/html" errors.
  app.get(/\.[a-z0-9]{2,12}$/i, (req, res) => res.status(404).type('text/plain').send('Not found'))

  // Every page gets index.html with its own title, description and share preview filled in.
  app.get('*', asyncHandler(async (req, res) => {
    if (!env.isProd) template = fs.readFileSync(indexFile, 'utf8') // pick up rebuilds while testing locally
    let page
    try {
      page = await metaForPath(req.path, baseUrl)
    } catch (err) {
      console.error(`Page meta for ${req.path} failed: ${err.message}`)
      page = { status: 200, meta: { path: req.path } } // the page still works, just with default tags
    }
    res.status(page.status).set('Cache-Control', 'no-cache').type('html').send(renderHtml(template, page.meta, baseUrl))
  }))
} else if (env.isProd) {
  console.warn('client/dist not found: run "npm run build" before starting in production.')
}

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`)
})

/** Connect to MongoDB, retrying every 15 seconds so a slow or blocked connection doesn't take the site down. */
async function connectWithRetry() {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await connectDB()
      return
    } catch (err) {
      console.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}`)
      if (attempt === 1) console.error('If this keeps happening, check MONGODB_URI and that MongoDB Atlas > Network Access allows 0.0.0.0/0.')
      await new Promise((r) => setTimeout(r, 15_000))
    }
  }
}

connectWithRetry()
buildAdmin()
  .then(({ router }) => {
    adminRouter = router
    console.log(`Admin dashboard ready at ${ADMIN_PATH}`)
  })
  .catch((err) => {
    adminError = err
    console.error('Admin dashboard failed to start:', err)
  })
