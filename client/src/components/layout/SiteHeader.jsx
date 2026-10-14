import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router'
import { telHref, useSettings, whatsappHref } from '../../hooks/useSiteData.js'
import { useCart } from '../../lib/cart.jsx'
import ThemeToggle from '../ui/ThemeToggle.jsx'

const ICON = {
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  chip: 'M6 6h12v12H6zM10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
  home: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  house: 'M3 11l9-7 9 7M5 10v10h14V10',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  info: 'M12 8v.01M11 12h1v5h1M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
  chat: 'M4 5h16v11H8l-4 4z',
}

// The three companies, grouped under "Companies" on laptops and shown as big cards in the phone menu
const COMPANY_LINKS = [
  { to: '/power-solutions', label: 'Power solutions', company: 'Daystol Power Services', text: 'Generators, solar and stabilizers', bg: '#FFE52E', fg: '#0D1330', icon: ICON.bolt },
  { to: '/innovation-systems', label: 'Innovation systems', company: 'Daystol Innovation Systems', text: 'Automation, CCTV, ICT and software', bg: '#01AFEE', fg: '#0D1330', icon: ICON.chip },
  { to: '/property-services', label: 'Properties', company: 'Daystol Properties', text: 'Development, leasing and short-lets', bg: '#EB268F', fg: '#FFFFFF', icon: ICON.home },
]

const PAGE_LINKS = [
  { to: '/', label: 'Home', end: true, icon: ICON.house, color: '#01AFEE' },
  { to: '/shop', label: 'Shop', icon: ICON.cart, color: '#FFE52E' },
  { to: '/projects', label: 'Projects', icon: ICON.grid, color: '#EB268F' },
  { to: '/support', label: 'Support', long: 'Support and maintenance', icon: ICON.wrench, color: '#FF6B6B' },
  { to: '/about', label: 'About', icon: ICON.info, color: '#01AFEE' },
  { to: '/contact', label: 'Contact', icon: ICON.chat, color: '#EB268F' },
]

const Svg = ({ d, size = 20, stroke = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

function Underline({ color }) {
  return <span className="pop-in absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full" style={{ background: color, animationDuration: '.4s' }} aria-hidden="true" />
}

function DesktopLink({ item }) {
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `relative whitespace-nowrap py-1.5 transition-colors hover:text-fg ${isActive ? 'text-fg' : 'text-mist'}`}>
      {({ isActive }) => (
        <>
          {item.label}
          {isActive && <Underline color={item.color} />}
        </>
      )}
    </NavLink>
  )
}

/** "Companies" on laptops: opens on hover or click, closes on Escape, a click outside, or leaving the area. */
function CompaniesMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const wrapRef = useRef(null)
  const timer = useRef(null)
  const active = COMPANY_LINKS.find((c) => pathname.startsWith(c.to))

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        wrapRef.current?.querySelector('button')?.focus()
      }
    }
    const onClick = (e) => !wrapRef.current?.contains(e.target) && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const enter = () => { clearTimeout(timer.current); setOpen(true) }
  const leave = () => { timer.current = setTimeout(() => setOpen(false), 160) }

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="companies-menu"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-1.5 whitespace-nowrap py-1.5 transition-colors hover:text-fg ${active || open ? 'text-fg' : 'text-mist'}`}
      >
        Companies
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        {active && <Underline color={active.bg} />}
      </button>

      {open && (
        <div id="companies-menu" className="absolute left-1/2 top-full z-40 w-[400px] -translate-x-1/2 pt-4">
          <div className="pop-in flex flex-col gap-1.5 rounded-[24px] border border-line bg-card p-2.5 shadow-[var(--shadow)]" style={{ animationDuration: '.35s', transformOrigin: 'top center' }}>
            {COMPANY_LINKS.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                aria-current={pathname.startsWith(c.to) ? 'page' : undefined}
                className="group flex items-center gap-3.5 rounded-[18px] p-3 text-fg transition-colors hover:bg-card2 hover:text-fg aria-[current=page]:bg-card2"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ background: c.bg, color: c.fg }}>
                  <Svg d={c.icon} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-[15px]">{c.company}</strong>
                  <span className="text-[13px] text-mist">{c.text}</span>
                </span>
                <span className="nudge text-mist" aria-hidden="true">→</span>
              </Link>
            ))}
            <div className="mx-3 mb-1 mt-1.5 flex h-1 overflow-hidden rounded-full" aria-hidden="true">
              <span className="flex-1 bg-spark" /><span className="flex-1 bg-cyan" /><span className="flex-1 bg-magenta" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Phone and tablet menu: the three companies as big colour cards, the other pages as tiles,
 * and the emergency line and quote buttons at the bottom. Rendered at the end of <body> (a portal).
 */
function MobileMenu({ onClose, settings }) {
  const panelRef = useRef(null)
  const { pathname } = useLocation()
  const { count } = useCart()
  const emergency = telHref(settings?.emergencyPhone)
  const wa = whatsappHref(settings?.whatsappNumber)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('a')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // Keep keyboard focus inside the menu
        const items = panelRef.current?.querySelectorAll('a, button')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const stagger = (i) => ({ animationDelay: `${0.06 + i * 0.045}s`, animationDuration: '.5s' })

  return createPortal(
    <div id="mobile-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menu" className="menu-in fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-y-auto overflow-x-hidden bg-bg lg:hidden">
      {/* Background: soft colour glows and the three power lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute -right-24 -top-24 size-72 rounded-full bg-spark opacity-[.18] blur-3xl" />
        <span className="absolute -left-28 top-1/3 size-72 rounded-full bg-cyan opacity-[.16] blur-3xl" />
        <span className="absolute -bottom-24 right-0 size-72 rounded-full bg-magenta opacity-[.16] blur-3xl" />
        <svg viewBox="0 0 400 800" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-30">
          <path className="flowline" d="M-20 120 C 160 160, 240 60, 420 110" fill="none" stroke="#FFE52E" strokeWidth="2" />
          <path className="flowline" d="M-20 470 C 120 420, 280 540, 420 480" fill="none" stroke="#01AFEE" strokeWidth="2" style={{ animationDelay: '-1s' }} />
          <path className="flowline" d="M-20 760 C 140 700, 260 800, 420 740" fill="none" stroke="#EB268F" strokeWidth="2" style={{ animationDelay: '-2s' }} />
        </svg>
      </div>

      <div className="relative flex items-center justify-between px-4 py-3 sm:px-7">
        <Link to="/" aria-label="Daystol Group Ltd, home" onClick={onClose}>
          <img src="/brand/daystol-logo.png" alt="Daystol Group Ltd" className="h-11 w-auto" width="128" height="59" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={onClose} aria-label="Close menu" className="press flex size-11 items-center justify-center rounded-full bg-fg text-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="spin-once"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      <nav aria-label="Main" className="relative flex flex-1 flex-col gap-6 px-4 pb-6 pt-3 sm:px-7">
        <section className="flex flex-col gap-2.5" aria-labelledby="menu-companies">
          <span id="menu-companies" className="fade-up eyebrow text-mist" style={stagger(0)}>Our companies</span>
          {COMPANY_LINKS.map((c, i) => {
            const on = pathname.startsWith(c.to)
            return (
              <Link
                key={c.to}
                to={c.to}
                onClick={onClose}
                aria-current={on ? 'page' : undefined}
                className="fade-up press relative flex items-center gap-3.5 overflow-hidden rounded-[22px] p-4 hover:opacity-95"
                style={{ background: c.bg, color: c.fg, ...stagger(i + 1) }}
              >
                <span className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full border-[14px] opacity-20" style={{ borderColor: c.fg }} aria-hidden="true" />
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(13,19,48,.14)' }}>
                  <Svg d={c.icon} size={22} />
                </span>
                <span className="relative flex min-w-0 flex-1 flex-col">
                  <strong className="font-display text-[17px] leading-tight">{c.label}</strong>
                  <span className="text-[13px] font-semibold opacity-80">{c.text}</span>
                </span>
                {on ? (
                  <span className="relative rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: c.fg, color: c.bg }}>You're here</span>
                ) : (
                  <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full font-extrabold" style={{ background: 'rgba(13,19,48,.14)' }} aria-hidden="true">→</span>
                )}
              </Link>
            )
          })}
        </section>

        <section className="flex flex-col gap-2.5" aria-labelledby="menu-pages">
          <span id="menu-pages" className="fade-up eyebrow text-mist" style={stagger(4)}>Explore</span>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PAGE_LINKS.map((p, i) => (
              <NavLink
                key={p.to}
                to={p.to}
                end={p.end}
                onClick={onClose}
                className={({ isActive }) => `fade-up press relative flex min-h-[92px] flex-col justify-between gap-3 rounded-[20px] border p-3.5 backdrop-blur ${isActive ? 'border-fg bg-fg text-bg' : 'border-line bg-glass text-fg hover:border-cyan hover:text-fg'}`}
                style={stagger(i + 5)}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-xl" style={{ background: isActive ? 'var(--bg)' : 'var(--card2)', color: p.color }}>
                        <Svg d={p.icon} size={18} />
                      </span>
                      {p.to === '/shop' && count > 0 && (
                        <span className="rounded-full bg-spark px-2 py-0.5 text-[11px] font-extrabold text-midnight">{count} in cart</span>
                      )}
                    </span>
                    <strong className="text-[15px] leading-tight">{p.long || p.label}</strong>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </section>
      </nav>

      <div className="fade-up relative flex flex-col gap-2.5 border-t border-line bg-glass px-4 pb-7 pt-4 backdrop-blur-xl sm:px-7" style={stagger(11)}>
        {emergency && (
          <a href={emergency} className="press flex items-center gap-3 rounded-[20px] bg-midnight p-3.5 text-white hover:text-white">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-spark text-midnight">
              <Svg d={ICON.bolt} size={20} />
              <span className="absolute -right-0.5 -top-0.5 size-3" aria-hidden="true"><span className="ping bg-alert" /><span className="absolute inset-0 rounded-full border-2 border-midnight bg-alert" /></span>
            </span>
            <span className="flex flex-1 flex-col">
              <strong className="text-[15px]">Equipment down?</strong>
              <span className="text-[13px] text-[#B9C0D9]">Call our 24/7 line: {settings.emergencyPhone}</span>
            </span>
          </a>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Link to="/contact?type=quote" onClick={onClose} className="shine press rounded-full bg-action py-3.5 text-center font-bold text-white hover:text-white">Get a quote</Link>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="press flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3.5 font-bold text-white hover:text-white">
              <span className="size-2 rounded-full bg-white" aria-hidden="true" />WhatsApp
            </a>
          ) : (
            <Link to="/support" onClick={onClose} className="press rounded-full border border-line py-3.5 text-center font-bold text-fg hover:text-fg">Report a fault</Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function CartButton() {
  const { count } = useCart()
  return (
    <Link
      to="/cart"
      className="press relative flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-fg hover:border-cyan hover:text-fg"
      aria-label={count ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart, empty'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
        <circle cx="10" cy="20.5" r="1.2" />
        <circle cx="17" cy="20.5" r="1.2" />
      </svg>
      {count > 0 && (
        <span key={count} className="pop-in absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-spark px-1 text-[11px] font-extrabold text-midnight" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { data: settings } = useSettings()
  const buttonRef = useRef(null)
  const wasOpen = useRef(false)
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => setOpen(false), [pathname])

  // Give focus back to the menu button after closing
  useEffect(() => {
    if (wasOpen.current && !open) buttonRef.current?.focus()
    wasOpen.current = open
  }, [open])

  return (
    <header className="navin sticky top-0 z-30 border-b border-line bg-glass backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-6 px-4 sm:h-[76px] sm:px-7">
        <Link to="/" aria-label="Daystol Group Ltd, home" className="shrink-0">
          <img src="/brand/daystol-logo.png" alt="Daystol Group Ltd" className="logo-on h-10 w-auto sm:h-[46px]" width="128" height="59" />
        </Link>

        {/* Laptops and up: links in the header, with the three companies grouped */}
        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-x-5 text-sm font-medium lg:flex xl:gap-x-7 xl:text-[15px]">
          <DesktopLink item={PAGE_LINKS[0]} />
          <CompaniesMenu />
          {PAGE_LINKS.slice(1).map((item) => <DesktopLink key={item.to} item={item} />)}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <CartButton />
          <Link to="/contact" className="shine press hidden rounded-full bg-action px-5 py-3 text-[15px] font-bold text-white hover:text-white sm:inline-block">Get a quote</Link>
          <button
            ref={buttonRef}
            type="button"
            className="press flex size-11 items-center justify-center rounded-full bg-fg text-bg lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 8h16M4 16h11" /></svg>
          </button>
        </div>
      </div>

      {open && <MobileMenu onClose={close} settings={settings} />}
    </header>
  )
}
