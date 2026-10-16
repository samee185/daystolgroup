import { Link } from 'react-router'
import Skyline from './Skyline.jsx'
import PhotoSlot from '../ui/PhotoSlot.jsx'
import { PHOTOS } from '../../lib/photos.js'
import { telHref, useSettings } from '../../hooks/useSiteData.js'
import { useIsDesktop } from '../../hooks/useMediaQuery.js'

const LINES = [
  { text: 'Power & Energy Solutions.', className: 'text-at-power', delay: 0.15 },
  { text: 'Innovative Systems.', className: 'text-at-innovation', delay: 0.3 },
  { text: 'Properties.', className: 'text-at-property', delay: 0.45 },
  { text: 'Construction & Infrastructure.', className: 'text-at-construction', delay: 0.6 },
]

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#01AFEE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)

function CollageTile({ to, photo, tag, tagClass, className = '' }) {
  return (
    <Link to={to} className={`zoom-host relative block overflow-hidden rounded-[28px] ${className}`}>
      <div className="zoom absolute inset-0"><PhotoSlot src={photo.src} label={photo.label} /></div>
      <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[13px] font-extrabold ${tagClass}`}>{tag}</span>
    </Link>
  )
}

export default function Hero() {
  const isDesktop = useIsDesktop()
  const { data: settings } = useSettings()
  const emergency = telHref(settings?.emergencyPhone)

  return (
    <section className="relative overflow-hidden pt-10 sm:pt-16">
      {/* Power lines flowing across the background, one per company */}
      <svg aria-hidden="true" viewBox="0 0 1440 700" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-50">
        <path className="flowline" d="M-40 560 C 300 520, 420 260, 760 300 S 1200 120, 1500 160" fill="none" stroke="#FFE52E" strokeWidth="2" />
        <path className="flowline" d="M-40 620 C 340 600, 520 380, 820 400 S 1220 260, 1500 280" fill="none" stroke="#01AFEE" strokeWidth="2" style={{ animationDelay: '-1s' }} />
        <path className="flowline" d="M-40 680 C 380 680, 600 500, 880 500 S 1240 400, 1500 410" fill="none" stroke="#EB268F" strokeWidth="2" style={{ animationDelay: '-2s' }} />
        <path className="flowline" d="M-40 740 C 420 740, 660 600, 940 590 S 1260 520, 1500 530" fill="none" stroke="#FF7A1A" strokeWidth="2" style={{ animationDelay: '-3s' }} />
      </svg>

      <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-5 sm:px-7 lg:grid-cols-[1.08fr_.92fr] lg:gap-14">
        <div className="flex flex-col gap-6">
          <span className="fade-up flex items-center gap-2.5 self-start rounded-full border border-line bg-card py-2 pl-2 pr-3.5 text-sm font-semibold text-mist">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-spark" /><span className="size-2.5 rounded-full bg-cyan" /><span className="size-2.5 rounded-full bg-magenta" /><span className="size-2.5 rounded-full bg-orange" />
            </span>
            Daystol Group Ltd. · RC 9511880
          </span>

          <h1 className="m-0 font-display text-[clamp(26px,3.8vw,54px)] font-extrabold leading-[1.06] tracking-[-0.02em]">
            {LINES.map((l) => (
              <span key={l.text} className="rise-line"><span className={l.className} style={{ animationDelay: `${l.delay}s` }}>{l.text}</span></span>
            ))}
            <span className="rise-line pt-[.1em]">
              <span className="relative" style={{ animationDelay: '.75s' }}>
                One Daystol.
                <span className="grow-x absolute inset-x-0 -bottom-[.04em] flex h-[.11em]" style={{ animationDelay: '1.45s' }} aria-hidden="true">
                  <span className="flex-1 bg-spark" /><span className="flex-1 bg-cyan" /><span className="flex-1 bg-magenta" /><span className="flex-1 bg-orange" />
                </span>
              </span>
            </span>
          </h1>

          <p className="fade-up m-0 max-w-[54ch] text-base leading-relaxed text-mist sm:text-lg" style={{ animationDelay: '.8s' }}>
            The parent company of <strong className="text-fg">Daystol Power Services</strong>, <strong className="text-fg">Daystol Innovation Systems</strong>, <strong className="text-fg">Daystol Properties</strong> and <strong className="text-fg">Daystol Development Concept</strong>: generators, solar and stabilizers; automation, surveillance and ICT; property development and leasing; buildings, roads and general contracts. One team to call.
          </p>

          <div className="fade-up flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: '1s' }}>
            <Link to="/contact" className="shine shine-auto press flex items-center justify-center gap-2.5 rounded-full bg-action px-7 py-4 font-bold text-white hover:text-white">
              Get a quote <span className="nudge" aria-hidden="true">→</span>
            </Link>
            <Link to="/shop" className="press rounded-full bg-fg px-7 py-4 text-center font-bold text-bg hover:text-bg">Shop power equipment</Link>
            <Link to="/support" className="press flex items-center justify-center gap-2.5 rounded-full border border-line px-6 py-4 font-bold text-fg hover:text-fg">
              <span className="relative size-2.5" aria-hidden="true"><span className="ping bg-alert" /><span className="absolute inset-0 rounded-full bg-alert" /></span>
              Report a fault
            </Link>
          </div>

          <ul className="fade-up m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-mist" style={{ animationDelay: '1.15s' }}>
            <li className="flex items-center gap-2"><Check />Sales, installation and maintenance</li>
            <li className="flex items-center gap-2"><Check />24/7 emergency fault line</li>
            <li className="flex items-center gap-2"><Check />Secure online checkout</li>
          </ul>
        </div>

        {/* One photo per company, with the group logo in the middle */}
        <div className="fade-up relative" style={{ animationDelay: '.5s' }}>
          <div className="grid grid-cols-2 grid-rows-[150px_150px] gap-3.5 sm:grid-rows-[200px_200px]">
            <CollageTile to="/power-solutions" photo={PHOTOS.power} tag="Power Services" tagClass="bg-spark text-midnight" />
            <CollageTile to="/innovation-systems" photo={PHOTOS.innovation} tag="Innovation Systems" tagClass="bg-cyan text-midnight" />
            <CollageTile to="/property-services" photo={PHOTOS.property} tag="Properties" tagClass="bg-magenta text-white" />
            <CollageTile to="/construction-services" photo={PHOTOS.construction} tag="Development Concept" tagClass="bg-orange text-midnight" />
          </div>

          <div className="bob pointer-events-none absolute left-1/2 top-1/2 size-[104px] -translate-x-1/2 -translate-y-1/2 sm:size-[132px]" aria-hidden="true">
            <svg className="spin-slow absolute inset-0" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="62" fill="none" stroke="#FFE52E" strokeWidth="3" strokeDasharray="64 130" strokeLinecap="round" />
              <circle cx="66" cy="66" r="62" fill="none" stroke="#01AFEE" strokeWidth="3" strokeDasharray="64 130" strokeDashoffset="-130" strokeLinecap="round" />
              <circle cx="66" cy="66" r="62" fill="none" stroke="#EB268F" strokeWidth="3" strokeDasharray="64 130" strokeDashoffset="-260" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-3 flex items-center justify-center rounded-full bg-white shadow-[0_16px_40px_rgba(0,0,0,.3)]">
              <img src="/brand/daystol-logo.png" alt="" className="w-3/5" />
            </span>
          </div>

          {emergency && (
            <a href={emergency} className="bob absolute -bottom-5 left-2 flex items-center gap-3 rounded-[20px] border border-line bg-glass px-4 py-3 shadow-[var(--shadow)] backdrop-blur-xl sm:-left-6" style={{ animationDelay: '-2s' }}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-spark" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="#0D1330"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg></span>
              <span className="flex flex-col"><strong className="text-[15px]">Equipment down?</strong><span className="text-[13px] text-mist">Call our 24/7 line</span></span>
            </a>
          )}
          <span className="bob absolute -right-4 -top-6 hidden items-center gap-2.5 rounded-[20px] border border-line bg-glass px-4 py-3 text-sm font-semibold shadow-[var(--shadow)] backdrop-blur-xl sm:flex" style={{ animationDelay: '-3.5s' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#01AFEE" strokeWidth="2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            Pay securely with Paystack
          </span>
        </div>
      </div>

      <Skyline dense={isDesktop} />
    </section>
  )
}
