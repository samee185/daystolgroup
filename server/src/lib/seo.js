import mongoose from 'mongoose'
import { Product, Project, Service, SiteSettings } from '../models/index.js'
import { currentPrice, stockStatus } from './pricing.js'
import { imageFor } from './images.js'
import { clip, SITE_NAME } from './seo-html.js'
import { pageBody } from './seo-body.js'

// Where the group works. Used in page text and in the structured data search engines read.
export const AREAS = ['Lagos', 'Abuja', 'Nigeria']
const AREA_SERVED = [
  { '@type': 'City', name: 'Lagos' },
  { '@type': 'City', name: 'Abuja' },
  { '@type': 'Country', name: 'Nigeria' },
]

// The group's verified physical store and office. Search engines get it as a structured address,
// which is how Google matches the site to a Google Business Profile. Use the same wording everywhere.
export const STORE_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: '5 Awe Street',
  addressLocality: 'Ojodu',
  addressRegion: 'Lagos',
  postalCode: '101232',
  addressCountry: 'NG',
}
export const STORE_ADDRESS_TEXT = '5 Awe Street, Ojodu, Lagos 101232'

const GROUP_DESCRIPTION =
  'Daystol Group Ltd. is the parent of Daystol Power Services, Innovation Systems, Property and Development Concept, serving Lagos, Abuja and all of Nigeria.'

/**
 * The four companies. `schemaType` tells search engines what kind of business each one is.
 * `h1` and `intro` match the company pages in the React app (client/src/lib/pages.js).
 */
export const COMPANY_SEO = {
  '/power-solutions': {
    company: 'power', legalName: 'Daystol Power Services Ltd.', shortName: 'Daystol Power Services', schemaType: ['Electrician', 'Store'],
    h1: 'Reliable power, installed and maintained.',
    intro: 'Power solution management, electrical installations and mechanical engineering, plus sales, installation and maintenance of diesel generators, solar power systems and servo central industrial stabilizers.',
    cta: { label: 'Get a quote', to: '/contact?type=quote' },
  },
  '/innovation-systems': {
    company: 'innovation', legalName: 'Daystol Innovation Systems Ltd.', shortName: 'Daystol Innovation Systems', schemaType: 'ProfessionalService',
    h1: 'Smart systems that run, watch and connect.',
    intro: 'Electrical design and installation, power and home automation, surveillance systems, and ICT services: ICT installations, software engineering, web solutions and professional programming.',
    cta: { label: 'Request a consultation', to: '/contact?type=consultation' },
  },
  '/property-services': {
    company: 'property', legalName: 'Daystol Property Ltd.', shortName: 'Daystol Property', schemaType: 'RealEstateAgent',
    h1: 'Property, developed and well looked after.',
    intro: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy.',
    cta: { label: 'Make a property enquiry', to: '/contact?type=property' },
  },
  '/construction-services': {
    company: 'construction', legalName: 'Daystol Development Concept Ltd.', shortName: 'Daystol Development Concept', schemaType: 'GeneralContractor',
    h1: 'Buildings, roads and infrastructure, delivered as one contract.',
    intro: 'General contractor for buildings, infrastructure, roads and bridges, boreholes and water supply, schools, networks and other general contracts, for private clients, businesses and government.',
    cta: { label: 'Make a contract enquiry', to: '/contact?type=contract' },
  },
}

/**
 * Every page the React app has. `fullTitle` replaces the whole browser title; `title` gets " | Daystol Group Ltd." added.
 * `index: false` keeps private pages out of search results. Keep these in step with client/src/lib/seo.js.
 */
export const STATIC_PAGES = {
  '/': {
    fullTitle: 'Daystol Group | Power, ICT, Property and Construction in Nigeria',
    description: GROUP_DESCRIPTION,
    h1: 'Power & Energy Solutions. Innovative Systems. Properties. Construction & Infrastructure. One Daystol.',
    priority: '1.0',
  },
  '/power-solutions': {
    fullTitle: 'Daystol Power Services | Generators, Solar and Stabilizers in Lagos',
    description: 'Diesel generators, solar power systems and servo stabilizers: sales, installation and maintenance by Daystol Power Services in Lagos, Abuja and across Nigeria.',
    priority: '0.9',
  },
  '/innovation-systems': {
    fullTitle: 'Daystol Innovation Systems | Automation, CCTV and ICT in Lagos',
    description: 'Home and power automation, CCTV, electrical design, ICT, software and web solutions by Daystol Innovation Systems in Lagos, Abuja and across Nigeria.',
    priority: '0.9',
  },
  '/property-services': {
    fullTitle: 'Daystol Property | Property Development and Short-lets in Lagos',
    description: 'Property development, sales and leasing, facility management, short-lets and real-estate consultancy by Daystol Property in Lagos, Abuja and Nigeria.',
    priority: '0.9',
  },
  '/construction-services': {
    fullTitle: 'Daystol Development Concept | Construction and Contracts in Nigeria',
    description: 'General contractor for buildings, roads and bridges, boreholes, schools, networks and infrastructure in Lagos, Abuja and across Nigeria.',
    priority: '0.9',
  },
  '/shop': {
    title: 'Shop generators, solar and stabilizers',
    h1: 'Shop power equipment',
    description: 'Buy diesel generators, solar power systems and servo stabilizers online from Daystol Power Services, with installation and maintenance across Nigeria.',
    priority: '0.9',
  },
  '/projects': {
    title: 'Projects',
    h1: 'Work we have delivered, across four companies',
    description: 'Power, automation, property and construction projects delivered by the Daystol Group companies in Lagos, Abuja and across Nigeria.',
    priority: '0.7',
  },
  '/support': {
    title: 'Support and maintenance',
    h1: 'Support and maintenance',
    description: 'Report a fault with a generator, solar system, stabilizer, electrical or automation system, or ask about a maintenance contract. 24/7 fault line.',
    priority: '0.8',
  },
  '/about': {
    title: 'About Daystol Group',
    h1: 'One group. Four specialist companies.',
    description: 'Daystol Group Ltd. (RC 9511880) is the parent company of Daystol Power Services, Innovation Systems, Property and Development Concept.',
    priority: '0.6',
  },
  '/contact': {
    title: 'Contact Daystol Group',
    h1: 'Contact Daystol Group',
    description: 'Contact Daystol Group for quotes, consultations, property and contract enquiries, and maintenance contracts in Lagos, Abuja and across Nigeria.',
    priority: '0.7',
  },
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

// Never wait on the database while it is still connecting: pages go out with default content instead.
const dbReady = () => mongoose.connection.readyState === 1

// Contact details change rarely, so they are kept for a minute instead of being read on every page.
let settingsCache = { at: 0, value: null }
async function getSettings() {
  if (!dbReady()) return settingsCache.value || { address: STORE_ADDRESS_TEXT }
  if (Date.now() - settingsCache.at < 60_000 && settingsCache.value) return settingsCache.value
  const s = await SiteSettings.findOne()
    .select('phone emergencyPhone email address officeHours mapUrl socialLinks googleSiteVerification bingSiteVerification')
    .lean()
  settingsCache = { at: Date.now(), value: { ...(s || {}), address: s?.address || STORE_ADDRESS_TEXT } }
  return settingsCache.value
}

const sameAs = (s) => (s.socialLinks || []).map((l) => l.url)

function contactFields(s) {
  return {
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    address: STORE_ADDRESS,
    ...(s.mapUrl ? { hasMap: s.mapUrl } : {}),
  }
}

function organisationLd(baseUrl, s) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: SITE_NAME,
    alternateName: ['Daystol', 'Daystol Group', 'Daystol Group Limited'],
    legalName: 'Daystol Group Limited',
    identifier: { '@type': 'PropertyValue', propertyID: 'CAC RC number', value: '9511880' },
    url: `${baseUrl}/`,
    logo: `${baseUrl}/brand/daystol-logo.png`,
    image: `${baseUrl}/brand/share.png`,
    description: GROUP_DESCRIPTION,
    areaServed: AREA_SERVED,
    ...contactFields(s),
    ...(s.phone ? { contactPoint: [{ '@type': 'ContactPoint', telephone: s.phone, contactType: 'customer service', areaServed: 'NG', availableLanguage: 'English' }] } : {}),
    ...(sameAs(s).length ? { sameAs: sameAs(s) } : {}),
    subOrganization: Object.entries(COMPANY_SEO).map(([path, c]) => ({ '@type': c.schemaType, '@id': `${baseUrl}${path}#business`, name: c.legalName, url: `${baseUrl}${path}` })),
  }
}

const websiteLd = (baseUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${baseUrl}/#website`,
  name: 'Daystol Group',
  alternateName: ['Daystol', 'Daystol Group Ltd.'],
  url: `${baseUrl}/`,
  publisher: { '@id': `${baseUrl}/#organization` },
  inLanguage: 'en-NG',
})

function companyLd(baseUrl, path, c, s, services) {
  return {
    '@context': 'https://schema.org',
    '@type': c.schemaType,
    '@id': `${baseUrl}${path}#business`,
    name: c.legalName,
    alternateName: c.shortName,
    url: `${baseUrl}${path}`,
    logo: `${baseUrl}/brand/daystol-logo.png`,
    image: `${baseUrl}/brand/share.png`,
    description: c.intro,
    parentOrganization: { '@id': `${baseUrl}/#organization`, name: SITE_NAME },
    areaServed: AREA_SERVED,
    ...contactFields(s),
    ...(sameAs(s).length ? { sameAs: sameAs(s) } : {}),
    ...(services.length
      ? {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `${c.shortName} services`,
          itemListElement: services.map((sv) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: sv.title, description: sv.summary, areaServed: AREA_SERVED } })),
        },
      }
      : {}),
  }
}

function breadcrumbLd(baseUrl, trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${baseUrl}${t.path}` })),
  }
}

const pageName = (page) => page.h1 || page.title || SITE_NAME

const notFound = (path, s) => ({
  status: 404,
  meta: { title: 'Page not found', description: GROUP_DESCRIPTION, path, noindex: true, verification: s, body: pageBody({ kind: 'notFound', settings: s }) },
})

/** Work out the HTTP status, meta tags, structured data and readable page content for a page address. */
export async function metaForPath(rawPath, baseUrl) {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath
  const s = await getSettings()
  const base = { path, verification: s }

  const staticPage = STATIC_PAGES[path]
  if (staticPage) {
    const meta = { ...staticPage, ...base, image: `${baseUrl}/brand/share.png`, noindex: staticPage.index === false }
    const company = COMPANY_SEO[path]

    if (path === '/') {
      meta.jsonLd = [organisationLd(baseUrl, s), websiteLd(baseUrl)]
      meta.body = pageBody({ kind: 'home', h1: staticPage.h1, intro: GROUP_DESCRIPTION, companies: COMPANY_SEO, settings: s })
    } else if (company) {
      const services = dbReady()
        ? await Service.find({ company: company.company, published: true }).sort({ order: 1, createdAt: 1 }).select('title summary').lean()
        : []
      meta.jsonLd = [companyLd(baseUrl, path, company, s, services), breadcrumbLd(baseUrl, [{ name: company.shortName, path }])]
      meta.body = pageBody({ kind: 'company', company, services, settings: s })
    } else {
      if (staticPage.index !== false) meta.jsonLd = breadcrumbLd(baseUrl, [{ name: pageName(staticPage), path }])
      let items = []
      if (path === '/shop' && dbReady()) {
        const products = await Product.find({ published: true }).sort({ createdAt: -1 }).limit(60).select('name slug shortDescription').lean()
        items = products.map((p) => ({ name: p.name, text: p.shortDescription, to: `/shop/${p.slug}` }))
      }
      if (path === '/projects' && dbReady()) {
        const projects = await Project.find({ published: true }).sort({ completedAt: -1, createdAt: -1 }).limit(60).select('title slug summary location').lean()
        items = projects.map((p) => ({ name: p.title, text: [p.location, p.summary].filter(Boolean).join(': '), to: `/projects/${p.slug}` }))
      }
      meta.body = pageBody({ kind: 'page', h1: pageName(staticPage), intro: staticPage.description, items, settings: s })
    }
    return { status: 200, meta }
  }

  const product = path.match(/^\/shop\/([a-z0-9-]{1,120})$/)
  if (product) {
    if (!dbReady()) return { status: 200, meta: { ...base, title: 'Shop' } }
    const p = await Product.findOne({ slug: product[1], published: true }).populate('category', 'name').lean()
    if (!p) return notFound(path, s)
    const image = imageFor(p.imageKeys?.[0], p.name)?.src
    const price = currentPrice(p)
    return {
      status: 200,
      meta: {
        ...base,
        title: p.name,
        description: p.shortDescription,
        image,
        type: 'product',
        jsonLd: [
          {
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
                  areaServed: 'NG',
                  seller: { '@type': 'Organization', name: 'Daystol Power Services Ltd.', '@id': `${baseUrl}/power-solutions#business` },
                },
              }
              : {}),
          },
          breadcrumbLd(baseUrl, [{ name: 'Shop', path: '/shop' }, { name: p.name, path }]),
        ],
        body: pageBody({
          kind: 'product',
          h1: p.name,
          intro: p.shortDescription,
          facts: [p.category?.name, p.brand, price != null ? `₦${Number(price).toLocaleString('en-NG')}` : 'Price on request'].filter(Boolean),
          back: { label: 'Back to the shop', to: '/shop' },
          settings: s,
        }),
      },
    }
  }

  const project = path.match(/^\/projects\/([a-z0-9-]{1,120})$/)
  if (project) {
    if (!dbReady()) return { status: 200, meta: { ...base, title: 'Projects' } }
    const p = await Project.findOne({ slug: project[1], published: true }).select('title summary coverKey location').lean()
    if (!p) return notFound(path, s)
    return {
      status: 200,
      meta: {
        ...base,
        title: p.title,
        description: p.summary,
        image: imageFor(p.coverKey, p.title)?.src,
        type: 'article',
        jsonLd: breadcrumbLd(baseUrl, [{ name: 'Projects', path: '/projects' }, { name: p.title, path }]),
        body: pageBody({ kind: 'product', h1: p.title, intro: p.summary, facts: [p.location].filter(Boolean), back: { label: 'All projects', to: '/projects' }, settings: s }),
      },
    }
  }

  // Customer order pages: private, never indexed
  if (/^\/order\/[A-Z0-9-]{1,30}$/.test(path)) return { status: 200, meta: { ...base, title: 'Your order', noindex: true } }

  return notFound(path, s)
}

const xmlEscape = (v) => String(v).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))

/** sitemap.xml: public pages, published products and projects. */
export async function buildSitemap(baseUrl) {
  const [products, projects] = dbReady()
    ? await Promise.all([
      Product.find({ published: true }).select('slug updatedAt').lean(),
      Project.find({ published: true }).select('slug updatedAt').lean(),
    ])
    : [[], []]
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
