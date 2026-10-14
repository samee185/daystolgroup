import { Link } from 'react-router'
import { telHref, useSettings, whatsappHref } from '../../hooks/useSiteData.js'

/** Closing call to action: three cables (one per company) flowing into the group logo. */
export default function ClosingCta() {
  const { data: s } = useSettings()
  const wa = whatsappHref(s?.whatsappNumber)
  const tel = telHref(s?.phone)

  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-7 sm:pb-24">
      <div className="reveal relative overflow-hidden rounded-[32px] bg-midnight px-6 py-12 text-white sm:px-12 sm:py-16">
        <svg aria-hidden="true" viewBox="0 0 1200 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-60">
          <path className="flowline" d="M-20 80 C 300 80, 600 160, 1010 200" fill="none" stroke="#FFE52E" strokeWidth="2.5" />
          <path className="flowline" d="M-20 200 C 300 200, 600 200, 1010 200" fill="none" stroke="#01AFEE" strokeWidth="2.5" style={{ animationDelay: '-1s' }} />
          <path className="flowline" d="M-20 320 C 300 320, 600 240, 1010 200" fill="none" stroke="#EB268F" strokeWidth="2.5" style={{ animationDelay: '-2s' }} />
        </svg>
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="flex max-w-[640px] flex-col gap-5">
            <h2 className="h-section m-0">Powering, building or automating? Start with one call.</h2>
            <p className="m-0 text-base leading-relaxed text-[#B9C0D9] sm:text-[17px]">
              Tell us what you need and the right Daystol company will get back to you with advice and a quote.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/contact?type=quote" className="shine press rounded-full bg-spark px-6 py-3.5 text-center font-bold text-midnight hover:text-midnight">Quote for power</Link>
              <Link to="/contact?type=consultation" className="press rounded-full bg-cyan px-6 py-3.5 text-center font-bold text-midnight hover:text-midnight">Book a consultation</Link>
              <Link to="/contact?type=property" className="press rounded-full bg-magenta px-6 py-3.5 text-center font-bold text-white hover:text-white">Property enquiry</Link>
            </div>
            {(wa || tel) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-[#1FA855] decoration-2 underline-offset-4 hover:text-white">Chat on WhatsApp</a>}
                {tel && <a href={tel} className="text-white underline decoration-cyan decoration-2 underline-offset-4 hover:text-white">Call {s.phone}</a>}
              </div>
            )}
          </div>
          <span className="bob relative mx-auto hidden size-[150px] lg:block" aria-hidden="true">
            <svg className="spin-slow absolute inset-0" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="62" fill="none" stroke="#FFE52E" strokeWidth="3" strokeDasharray="64 130" strokeLinecap="round" />
              <circle cx="66" cy="66" r="62" fill="none" stroke="#01AFEE" strokeWidth="3" strokeDasharray="64 130" strokeDashoffset="-130" strokeLinecap="round" />
              <circle cx="66" cy="66" r="62" fill="none" stroke="#EB268F" strokeWidth="3" strokeDasharray="64 130" strokeDashoffset="-260" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-3 flex items-center justify-center rounded-full bg-white"><img src="/brand/daystol-logo.png" alt="" className="w-3/5" /></span>
          </span>
        </div>
      </div>
    </section>
  )
}
