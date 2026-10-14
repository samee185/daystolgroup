/**
 * Put the right title, description, share preview (Open Graph) and structured data into index.html
 * before it is sent, so search engines and WhatsApp/Facebook link previews see real content.
 * No imports here, so it can be tested on its own.
 */

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
 * meta: { title, description, path, image, type, noindex, jsonLd: object | object[] }
 * baseUrl: the public site address, e.g. https://daystolgroup.com
 */
export function renderHtml(template, meta, baseUrl) {
  const fullTitle = meta.fullTitle || (meta.title ? `${meta.title} | ${SITE_NAME}` : `${SITE_NAME} | Power, Systems, Property`)
  const description = clip(meta.description)
  const url = `${baseUrl}${meta.path || '/'}`
  const image = meta.image || `${baseUrl}/brand/daystol-logo.png`

  const tags = [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex, nofollow" />' : null,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `<meta property="og:type" content="${escapeAttr(meta.type || 'website')}" />`,
    `<meta property="og:title" content="${escapeAttr(meta.title || SITE_NAME)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    '<meta property="og:locale" content="en_NG" />',
    `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
    ...[].concat(meta.jsonLd || []).map((ld) => `<script type="application/ld+json">${safeJson(ld)}</script>`),
  ].filter(Boolean).join('\n    ')

  // Replacer functions, so a "$" in a product name can't be read as a special replace pattern
  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeAttr(fullTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${escapeAttr(description)}" />`)
    .replace('</head>', () => `    ${tags}\n  </head>`)
}

export { clip }
