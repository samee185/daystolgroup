import { Product, Project, SiteSettings } from '../models/index.js'
import { currentPrice, stockStatus } from './pricing.js'
import { imageFor } from './images.js'
import { clip, SITE_NAME } from './seo-html.js'

const GROUP_DESCRIPTION =
  'Daystol Group Ltd. is the parent company of Daystol Power Services, Daystol Innovation Systems and Daystol Properties: power solutions, electrical and ICT systems, and property services in Nigeria.'

/** Every page the React app has. `index: false` keeps private pages out of search results. */
export const STATIC_PAGES = {
  '/': { fullTitle: `${SITE_NAME} | Power, Systems, Property`, description: GROUP_DESCRIPTION, priority: '1.0' },
  '/power-solutions': {
    title: 'Power solutions | Daystol Power Services',
    description: 'Power solution management, electrical installations and mechanical engineering, plus sales, installation and maintenance of diesel generators, solar power systems and servo central industrial stabilizers.',
    priority: '0.9',
  },
  '/innovation-systems': {
    title: 'Innovation systems | Daystol Innovation Systems',
    description: 'Electrical design and installation, power and home automation, surveillance systems, and ICT services: ICT installations, software engineering, web solutions and professional programming.',
    priority: '0.9',
  },
  '/property-services': {
    title: 'Property services | Daystol Properties',
    description: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy.',
    priority: '0.9',
  },
  '/shop': {
    title: 'Shop',
    description: 'Buy diesel generators, solar power systems and servo stabilizers from Daystol Power Services, with installation and maintenance.',
    priority: '0.9',
  },
  '/projects': { title: 'Projects', description: 'Projects delivered by Daystol Power Services, Daystol Innovation Systems and Daystol Properties.', priority: '0.7' },
  '/support': {
    title: 'Support and maintenance',
    description: 'Report a fault with your generator, solar power system, stabilizer, electrical or automation system, or ask about a maintenance contract.',
    priority: '0.8',
  },
  '/about': { title: 'About us', description: 'Daystol Group Ltd. (RC 9511880) is the parent company of Daystol Power Services, Daystol Innovation Systems and Daystol Properties.', priority: '0.6' },
  '/contact': { title: 'Contact us', description: 'Contact Daystol Group for quotes, consultations, property enquiries and maintenance contracts.', priority: '0.7' },
  '/privacy': { title: 'Privacy policy', description: 'How Daystol Group Ltd. collects, uses and protects your personal data under the Nigeria Data Protection Act 2023.', priority: '0.2' },
  '/terms': { title: 'Terms of sale', description: 'Terms for buying from the Daystol Group online shop.', priority: '0.2' },
  '/returns': { title: 'Returns and refunds', description: 'How returns, cancellations and refunds work for orders from the Daystol Group online shop.', priority: '0.2' },
  '/cart': { title: 'Your cart', index: false },
  '/checkout': { title: 'Checkout', index: false },
  '/system-check': { title: 'System check', index: false },
}

/** Old addresses that moved. Sent as permanent redirects. */
export const REDIRECTS = {
  '/electrical-automation': '/power-solutions',
  '/ict-services': '/innovation-systems',
}

const SCHEMA_AVAILABILITY = {
  in_stock: 'https://schema.org/InStock',
  low_stock: 'https://schema.org/LimitedAvailability',
  out_of_stock: 'https://schema.org/OutOfStock',
  on_order: 'https://schema.org/PreOrder',
}

async function organisationLd(baseUrl) {
  const s = await SiteSettings.findOne().select('phone email address socialLinks').lean()
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: 'Daystol Group Limited',
    url: baseUrl,
    logo: `${baseUrl}/brand/daystol-logo.png`,
    description: GROUP_DESCRIPTION,
    ...(s?.phone ? { telephone: s.phone } : {}),
    ...(s?.email ? { email: s.email } : {}),
    ...(s?.address ? { address: { '@type': 'PostalAddress', streetAddress: s.address, addressCountry: 'NG' } } : {}),
    ...(s?.socialLinks?.length ? { sameAs: s.socialLinks.map((l) => l.url) } : {}),
    subOrganization: [
      { '@type': 'Organization', name: 'Daystol Power Services Ltd.', url: `${baseUrl}/power-solutions` },
      { '@type': 'Organization', name: 'Daystol Innovation Systems Ltd.', url: `${baseUrl}/innovation-systems` },
      { '@type': 'Organization', name: 'Daystol Properties Ltd.', url: `${baseUrl}/property-services` },
    ],
  }
}

const notFound = (path) => ({ status: 404, meta: { title: 'Page not found', description: GROUP_DESCRIPTION, path, noindex: true } })

/** Work out the HTTP status and meta tags for a page address. */
export async function metaForPath(rawPath, baseUrl) {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath

  const staticPage = STATIC_PAGES[path]
  if (staticPage) {
    const meta = { ...staticPage, path, noindex: staticPage.index === false }
    if (path === '/') meta.jsonLd = await organisationLd(baseUrl)
    return { status: 200, meta }
  }

  const product = path.match(/^\/shop\/([a-z0-9-]{1,120})$/)
  if (product) {
    const p = await Product.findOne({ slug: product[1], published: true }).populate('category', 'name').lean()
    if (!p) return notFound(path)
    const image = imageFor(p.imageKeys?.[0], p.name)?.src
    const price = currentPrice(p)
    return {
      status: 200,
      meta: {
        title: p.name,
        description: p.shortDescription,
        path,
        image,
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: clip(p.shortDescription, 300),
          ...(image ? { image } : {}),
          ...(p.sku ? { sku: p.sku } : {}),
          ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
          ...(p.category?.name ? { category: p.category.name } : {}),
          ...(price != null
            ? {
              offers: {
                '@type': 'Offer',
                price: String(price),
                priceCurrency: 'NGN',
                availability: SCHEMA_AVAILABILITY[stockStatus(p)],
                url: `${baseUrl}${path}`,
                seller: { '@type': 'Organization', name: 'Daystol Power Services Ltd.' },
              },
            }
            : {}),
        },
      },
    }
  }

  const project = path.match(/^\/projects\/([a-z0-9-]{1,120})$/)
  if (project) {
    const p = await Project.findOne({ slug: project[1], published: true }).select('title summary coverKey').lean()
    if (!p) return notFound(path)
    return { status: 200, meta: { title: p.title, description: p.summary, path, image: imageFor(p.coverKey, p.title)?.src, type: 'article' } }
  }

  // Customer order pages: private, never indexed
  if (/^\/order\/[A-Z0-9-]{1,30}$/.test(path)) return { status: 200, meta: { title: 'Your order', path, noindex: true } }

  return notFound(path)
}

const xmlEscape = (v) => String(v).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

/** sitemap.xml: public pages, published products and projects. */
export async function buildSitemap(baseUrl) {
  const [products, projects] = await Promise.all([
    Product.find({ published: true }).select('slug updatedAt').lean(),
    Project.find({ published: true }).select('slug updatedAt').lean(),
  ])
  const entries = [
    ...Object.entries(STATIC_PAGES)
      .filter(([, page]) => page.index !== false)
      .map(([path, page]) => ({ loc: path === '/' ? `${baseUrl}/` : `${baseUrl}${path}`, priority: page.priority })),
    ...products.map((p) => ({ loc: `${baseUrl}/shop/${p.slug}`, lastmod: p.updatedAt, priority: '0.8' })),
    ...projects.map((p) => ({ loc: `${baseUrl}/projects/${p.slug}`, lastmod: p.updatedAt, priority: '0.5' })),
  ]
  const urls = entries.map((e) => [
    '  <url>',
    `    <loc>${xmlEscape(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n'))
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export function buildRobots(baseUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /order/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n')
}
