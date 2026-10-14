import { Link, useLocation } from 'react-router'
import { telHref, useSettings, whatsappHref } from '../../hooks/useSiteData.js'

const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
)

/**
 * Desktop: a floating WhatsApp button.
 * Mobile: a bar pinned to the bottom with Call 24/7, WhatsApp and Get a quote.
 * Buttons only appear once their number is filled in under Site Settings.
 */
export default function ContactShortcuts() {
  const { data: s } = useSettings()
  const wa = whatsappHref(s?.whatsappNumber)
  const call = telHref(s?.emergencyPhone)
  // Product pages have their own add-to-cart bar at the bottom on phones
  const onProduct = /^\/shop\/[^/]+/.test(useLocation().pathname)

  return (
    <>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="press fixed bottom-6 right-6 z-30 hidden size-[60px] items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_10px_28px_rgba(4,7,22,.5)] md:flex"
        >
          <WhatsAppIcon width="28" height="28" />
        </a>
      )}

      {!onProduct && <nav
        aria-label="Quick actions"
        className="fade-up fixed inset-x-3 bottom-3.5 z-30 grid auto-cols-fr grid-flow-col gap-1.5 rounded-[22px] border border-line bg-glass p-2 shadow-[var(--shadow)] backdrop-blur-xl md:hidden"
        style={{ animationDelay: '2.6s' }}
      >
        {call && (
          <a href={call} className="press flex min-h-12 items-center justify-center rounded-2xl bg-spark text-sm font-bold text-midnight">Call 24/7</a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="press flex min-h-12 items-center justify-center rounded-2xl bg-[#157347] text-sm font-bold text-white">WhatsApp</a>
        )}
        <Link to="/contact" className="press flex min-h-12 items-center justify-center rounded-2xl bg-action text-sm font-bold text-white">Get a quote</Link>
      </nav>}
    </>
  )
}
