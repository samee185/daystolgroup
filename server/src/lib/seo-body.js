/**
 * Readable page content placed inside <div id="root"> before the React app loads.
 * Search engines (and anyone with JavaScript turned off) get real headings, text and links;
 * the app replaces it the moment it starts. It always matches what the page shows, so it is
 * not hidden or different content. No imports here, so it can be tested on its own.
 */

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const NAV = [
  ['/', 'Home'],
  ['/power-solutions', 'Power solutions'],
  ['/innovation-systems', 'Innovation systems'],
  ['/property-services', 'Property'],
  ['/construction-services', 'Construction'],
  ['/shop', 'Shop'],
  ['/projects', 'Projects'],
  ['/support', 'Support and maintenance'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

const COMPANY_LINKS = [
  ['/power-solutions', 'Daystol Power Services Ltd.'],
  ['/innovation-systems', 'Daystol Innovation Systems Ltd.'],
  ['/property-services', 'Daystol Property Ltd.'],
  ['/construction-services', 'Daystol Development Concept Ltd.'],
]

const AREAS_LINE = 'Serving Lagos, Abuja and clients across Nigeria.'

const link = (to, label) => `<a href="${esc(to)}">${esc(label)}</a>`
const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`

function header() {
  return `<header class="ssr-head"><a href="/" class="ssr-brand"><img src="/brand/daystol-logo.png" alt="Daystol Group Ltd." width="120" height="55" /></a><nav aria-label="Main">${NAV.map(([to, label]) => link(to, label)).join(' ')}</nav></header>`
}

function footer(s = {}) {
  const contact = [
    'Daystol Group Ltd., RC 9511880',
    s.address ? esc(s.address).replace(/\n/g, '<br />') : null,
    s.phone ? `<a href="${esc(telHref(s.phone))}">${esc(s.phone)}</a>` : null,
    s.emergencyPhone ? `24/7 fault line: <a href="${esc(telHref(s.emergencyPhone))}">${esc(s.emergencyPhone)}</a>` : null,
    s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : null,
    s.officeHours ? esc(s.officeHours) : null,
  ].filter(Boolean)
  const social = (s.socialLinks || []).map((l) => `<a href="${esc(l.url)}" rel="me noopener">${esc(l.platform)}</a>`).join(' ')
  return `<footer class="ssr-foot"><p>${contact.join('<br />')}</p><p>${AREAS_LINE}</p><nav aria-label="Companies">${COMPANY_LINKS.map(([to, label]) => link(to, label)).join(' ')}</nav>${social ? `<p>${social}</p>` : ''}<nav aria-label="Policies">${link('/terms', 'Terms of sale')} ${link('/returns', 'Returns and refunds')} ${link('/privacy', 'Privacy policy')}</nav></footer>`
}

function list(items) {
  if (!items?.length) return ''
  return `<ul>${items.map((i) => `<li>${i.to ? `<a href="${esc(i.to)}"><strong>${esc(i.name)}</strong></a>` : `<strong>${esc(i.name)}</strong>`}${i.text ? `: ${esc(i.text)}` : ''}</li>`).join('')}</ul>`
}

/**
 * kind: 'home' | 'company' | 'page' | 'product' | 'notFound'
 * The data passed in comes from the database or from fixed copy in seo.js; everything is escaped here.
 */
export function pageBody(opts) {
  const s = opts.settings || {}
  let main = ''

  if (opts.kind === 'home') {
    const companies = Object.entries(opts.companies).map(([to, c]) => ({ name: c.legalName, text: c.intro, to }))
    main = `<h1>${esc(opts.h1)}</h1><p>${esc(opts.intro)}</p><h2>Our companies</h2>${list(companies)}<p>${AREAS_LINE} ${link('/contact', 'Get a quote or ask a question')}.</p>`
  } else if (opts.kind === 'company') {
    const c = opts.company
    const services = (opts.services || []).map((sv) => ({ name: sv.title, text: sv.summary }))
    main = `<p>${esc(c.legalName)}</p><h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p>${services.length ? `<h2>Services from ${esc(c.shortName)}</h2>${list(services)}` : ''}<h2>Areas we serve</h2><p>${esc(c.shortName)} works with homes, businesses and government in Lagos, Abuja and across Nigeria.</p><p>${link(c.cta.to, c.cta.label)}</p>`
  } else if (opts.kind === 'product') {
    main = `<h1>${esc(opts.h1)}</h1>${opts.facts?.length ? `<p>${opts.facts.map(esc).join(' · ')}</p>` : ''}<p>${esc(opts.intro)}</p><p>${link(opts.back.to, opts.back.label)}</p>`
  } else if (opts.kind === 'notFound') {
    main = `<h1>Page not found</h1><p>${link('/', 'Go to the Daystol Group home page')}</p>`
  } else {
    main = `<h1>${esc(opts.h1)}</h1>${opts.intro ? `<p>${esc(opts.intro)}</p>` : ''}${list(opts.items)}`
  }

  return `<div class="ssr">${header()}<main>${main}</main>${footer(s)}</div>`
}

/** Light styling so the content is readable for the moment before the app takes over. */
export const SSR_STYLE =
  '<style>.ssr{max-width:1100px;margin:0 auto;padding:24px 20px;font-family:system-ui,sans-serif;line-height:1.6;color:#F2F4FA}[data-theme="light"] .ssr{color:#0D1330}.ssr a{color:#01AFEE}.ssr nav{display:flex;flex-wrap:wrap;gap:6px 16px;margin:12px 0}.ssr h1{font-size:32px;line-height:1.2}.ssr-foot{margin-top:40px;font-size:14px;opacity:.85}body{background:#0D1330}[data-theme="light"] body{background:#F5F7FC}</style>'
