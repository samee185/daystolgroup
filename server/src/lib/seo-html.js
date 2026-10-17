/**
 * Put the right title, description, share preview (Open Graph) and structured data into index.html
 * before it is sent, so search engines and WhatsApp/Facebook link previews see real content.
 * Only imports other import-free files, so it can be tested on its own.
 */
import { SSR_STYLE } from './seo-body.js'

export const SITE_NAME = 'Daystol Group Ltd.'

const escapeAttr = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// JSON inside <script> must not be able to close the tag
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

const clip = (text, max = 160) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

/**
 * meta: { title, fullTitle, description, path, image, type, noindex, jsonLd: object | object[], body, verification }
 * baseUrl: the public site address, e.g. https://daystolgroup.com
 */
export function renderHtml(template, meta, baseUrl) {
  const fullTitle = meta.fullTitle || (meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} | Power, ICT, Property and Construction in Nigeria`)
  const description = clip(meta.description)
  const url = `${baseUrl}${meta.path || '/'}`
  const image = meta.image || `${baseUrl}/brand/share.png`
  const isShareImage = image === `${baseUrl}/brand/share.png`
  const v = meta.verification || {}

  const tags = [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-image-preview:large" />',
    v.googleSiteVerification ? `<meta name="google-site-verification" content="${escapeAttr(v.googleSiteVerification)}" />` : null,
    v.bingSiteVerification ? `<meta name="msvalidate.01" content="${escapeAttr(v.bingSiteVerification)}" />` : null,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `<meta property="og:type" content="${escapeAttr(meta.type || 'website')}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title || fullTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    isShareImage ? '<meta property="og:image:width" content="1200" />' : null,
    isShareImage ? '<meta property="og:image:height" content="630" />' : null,
    `<meta property="og:image:alt" content="${escapeAttr(meta.title || SITE_NAME)}" />`,
    '<meta property="og:locale" content="en_NG" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttr(meta.title || fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    ...[].concat(meta.jsonLd || []).map((ld) => `<script type="application/ld+json">${safeJson(ld)}</script>`),
  ].filter(Boolean).join('\n    ')

  // Replacer functions, so a "$" in a product name can't be read as a special replace pattern
  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeAttr(fullTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace('</head>', () => `    ${tags}\n    ${meta.body ? SSR_STYLE : ''}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${meta.body || ''}</div>`)
}

export { clip }
