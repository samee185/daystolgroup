import { useState } from 'react'
import { Link } from 'react-router'
import RichText from '../components/RichText.jsx'
import SmartImage from '../components/SmartImage.jsx'
import PhotoSlot from '../components/ui/PhotoSlot.jsx'
import ShopTeaser from '../components/home/ShopTeaser.jsx'
import HowWeWork from '../components/home/HowWeWork.jsx'
import ProjectsSection from '../components/home/ProjectsSection.jsx'
import { COMPANIES } from '../lib/companies.js'
import { AUDIENCES, COMPANY_PAGES, CONSTRUCTION_SECTORS, PROPERTY_INTENTS } from '../lib/pages.js'
import { PHOTOS } from '../lib/photos.js'
import { useCategories, useServices, useSettings, whatsappHref } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

// Company colours: the fill, the text on the fill, and the accent text class for the page
const ACCENT = {
  power: { fill: '#FFE52E', ink: '#0D1330', text: 'text-at-power' },
  innovation: { fill: '#01AFEE', ink: '#0D1330', text: 'text-at-innovation' },
  property: { fill: '#EB268F', ink: '#FFFFFF', text: 'text-at-property' },
  construction: { fill: '#FF7A1A', ink: '#0D1330', text: 'text-at-construction' },
}

const Tick = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)

function BadgeIcon({ id }) {
  if (id === 'power') return <svg className="size-6 sm:size-[34px]" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
  if (id === 'innovation') return <svg className="size-6 sm:size-[34px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="5" width="14" height="14" rx="3" /><path d="M9.5 9.5h5v5h-5zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>
  if (id === 'construction') return <svg className="size-6 sm:size-[34px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18v3H3zM5 18v-3a7 7 0 0 1 14 0v3M12 8V5M9.5 8.5L8 6M14.5 8.5L16 6" /></svg>
  return <svg className="size-6 sm:size-[34px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>
}

// Where the floating service chips sit around the hero photo (desktop only)
const CHIP_SPOTS = [
  { left: '-6px', top: '310px', delay: '-1s' },
  { left: '46%', top: '420px', delay: '-2.5s' },
  { left: '62%', top: '150px', delay: '-4s' },
]

function Hero({ config, accent }) {
  const photo = PHOTOS[config.heroPhoto]
  return (
    <section className="relative overflow-hidden pb-11 pt-6 sm:pb-20 sm:pt-10">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent.fill }} aria-hidden="true" />
      <svg aria-hidden="true" viewBox="0 0 1440 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-45">
        <path className="flowline" d="M-40 520 C 360 500, 520 240, 860 280 S 1260 120, 1500 150" fill="none" stroke={accent.fill} strokeWidth="2" />
        <path className="flowline" d="M-40 580 C 400 580, 640 380, 940 400 S 1280 300, 1500 300" fill="none" stroke={accent.fill} strokeWidth="1.5" style={{ animationDelay: '-1.6s', opacity: 0.6 }} />
      </svg>

      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-6 px-[18px] sm:gap-9 sm:px-7">
        <nav aria-label="Breadcrumb" className="fade-up text-sm text-mist">
          <ol className="m-0 flex list-none gap-2 p-0">
            <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">{config.title}</li>
          </ol>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="flex flex-col gap-[18px] sm:gap-6">
            <span className="fade-up self-start rounded-full px-3.5 py-2 text-sm font-extrabold" style={{ background: accent.fill, color: accent.ink, animationDelay: '.1s' }}>{config.companyName}</span>
            <h1 className="m-0 font-display text-[27px] font-extrabold leading-[1.12] tracking-[-0.02em] sm:text-[clamp(32px,4.2vw,58px)] sm:leading-[1.06]">
              <span className="rise-line"><span style={{ animationDelay: '.2s' }}>{config.h1[0]}</span></span>
              <span className="rise-line"><span className={accent.text} style={{ animationDelay: '.35s' }}>{config.h1[1]}</span></span>
            </h1>
            <p className="fade-up m-0 max-w-[56ch] text-base leading-relaxed text-mist sm:text-lg" style={{ animationDelay: '.55s' }}>{config.intro}</p>
            <div className="fade-up flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: '.7s' }}>
              <Link to={config.primary.to} className="shine press flex items-center justify-center gap-2.5 rounded-full bg-action px-6 py-4 font-bold text-white hover:text-white">
                {config.primary.label} <span className="nudge" aria-hidden="true">→</span>
              </Link>
              <Link to={config.secondary.to} className="press rounded-full bg-fg px-6 py-4 text-center font-bold text-bg hover:text-bg">{config.secondary.label}</Link>
            </div>
            <ul className="fade-up m-0 flex list-none flex-wrap gap-2.5 p-0" style={{ animationDelay: '.85s' }}>
              {config.pillars.map((p) => (
                <li key={p} className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 text-sm font-semibold">
                  <span className="size-2 rounded-full" style={{ background: accent.fill }} aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
          </div>

          {/* Main photo, company badge and the three headline services */}
          <div className="fade-up relative sm:py-[22px] sm:pl-[22px]" style={{ animationDelay: '.4s' }}>
            <div className="pointer-events-none absolute left-0 top-0 hidden h-[72%] w-[72%] rounded-[34px] border-2 opacity-55 sm:block" style={{ borderColor: accent.fill }} aria-hidden="true" />
            <a href="#services" className="zoom-host relative block h-[240px] overflow-hidden rounded-[22px] shadow-[var(--shadow)] sm:h-[430px] sm:rounded-[30px]" aria-label="See our services">
              <div className="zoom absolute inset-0"><PhotoSlot src={photo.src} label={photo.label} eager /></div>
            </a>
            <div className="bob pointer-events-none absolute right-2.5 top-2.5 size-[70px] sm:-right-3.5 sm:top-1 sm:size-[104px]" aria-hidden="true">
              <svg className="spin-slow absolute inset-0" viewBox="0 0 104 104"><circle cx="52" cy="52" r="49" fill="none" stroke={accent.fill} strokeWidth="3" strokeDasharray="40 22" strokeLinecap="round" /></svg>
              <span className="absolute inset-2 flex items-center justify-center rounded-full sm:inset-3" style={{ background: accent.fill, color: accent.ink }}><BadgeIcon id={config.company} /></span>
            </div>

            {/* Desktop: floating chips around the photo */}
            {config.chips.map((label, i) => (
              <span
                key={label}
                className="bob absolute hidden items-center gap-2.5 rounded-[18px] border border-line bg-glass px-4 py-3 text-sm font-bold shadow-[var(--shadow)] backdrop-blur-xl lg:flex"
                style={{ left: CHIP_SPOTS[i].left, top: CHIP_SPOTS[i].top, animationDelay: CHIP_SPOTS[i].delay }}
              >
                <span className="flex size-[30px] items-center justify-center rounded-[10px]" style={{ background: accent.fill, color: accent.ink }}><Tick /></span>
                {label}
              </span>
            ))}
            {/* Phones and tablets: the same chips as a stacked list, so nothing overlaps */}
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 lg:hidden">
              {config.chips.map((label) => (
                <li key={label} className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-4 py-3.5 text-[15px] font-bold">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px]" style={{ background: accent.fill, color: accent.ink }}><Tick size={16} /></span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ service, index, accent, askHref }) {
  const [open, setOpen] = useState(false)
  const hasMore = Boolean(service.body && service.body.replace(/<[^>]+>/g, '').trim())
  const bodyId = `service-${service.id}`

  return (
    <article className="reveal lift zoom-host flex flex-col overflow-hidden rounded-[26px] border border-line bg-card" style={{ animationDelay: `${(index % 3) * 0.06}s` }}>
      <div className="relative h-[150px] overflow-hidden sm:h-[180px]">
        <div className="zoom absolute inset-0"><SmartImage image={service.image} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" fallbackLabel={`Photo: ${service.title}`} /></div>
        <span className="absolute left-3.5 top-3 flex size-[42px] items-center justify-center rounded-[13px] font-display text-[15px] font-extrabold" style={{ background: accent.fill, color: accent.ink }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="h-[5px]" style={{ background: accent.fill }} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
        <h3 className="m-0 font-display text-lg font-bold leading-snug">{service.title}</h3>
        <p className="m-0 leading-relaxed text-mist">{service.summary}</p>
        {hasMore && (
          <div id={bodyId} hidden={!open}>
            <RichText html={service.body} className="text-base" />
          </div>
        )}
        <span className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          {hasMore ? (
            <button type="button" className="border-b-2 pb-0.5 font-bold text-fg" style={{ borderColor: accent.fill }} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
              {open ? 'Show less' : 'Read more'}
            </button>
          ) : <span />}
          <Link to={askHref(service.title)} className={`flex items-center gap-1.5 font-bold ${accent.text}`}>Ask about this <span className="nudge" aria-hidden="true">→</span></Link>
        </span>
      </div>
    </article>
  )
}

function Services({ config, accent }) {
  const { data: services, isPending, isError, refetch } = useServices(config.company)
  const askHref = (title) => `/contact?type=${config.enquiryType}&topic=${encodeURIComponent(title)}`

  return (
    <section id="services" className="scroll-mt-24 border-y border-line bg-bg2 py-[52px] sm:py-20" aria-labelledby="services-heading">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-[18px] sm:gap-9 sm:px-7">
        <div className="reveal flex flex-wrap items-end justify-between gap-[18px]">
          <div className="flex max-w-[640px] flex-col gap-3">
            <span className={`eyebrow ${accent.text}`}>What we do</span>
            <h2 id="services-heading" className="h-section m-0">{config.servicesTitle}</h2>
          </div>
        </div>

        {isError ? (
          <p className="m-0 text-mist">
            We couldn't load these services.{' '}
            <button type="button" className="font-bold text-fg underline" onClick={() => refetch()}>Try again</button>
          </p>
        ) : !isPending && services.length === 0 ? (
          <p className="m-0 text-mist">Details of these services will be published soon. <Link to="/contact" className="font-bold text-fg underline">Contact us</Link> in the meantime.</p>
        ) : (
          <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {isPending
              ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-[360px] animate-pulse rounded-[26px] border border-line bg-card" aria-hidden="true" />)
              : services.map((s, i) => <ServiceCard key={s.id} service={s} index={i} accent={accent} askHref={askHref} />)}
          </div>
        )}
      </div>
    </section>
  )
}

const BandHeading = ({ eyebrow, title, accent, children }) => (
  <div className="reveal flex flex-wrap items-end justify-between gap-4">
    <div className="flex max-w-[680px] flex-col gap-3">
      {eyebrow}
      <h2 className="h-section m-0">{title}</h2>
    </div>
    {children}
  </div>
)

/** Daystol Power Services: shop categories and featured products */
function ShopBand({ accent }) {
  const { data: categories } = useCategories()
  const cats = (categories || []).slice(0, 3)
  const photoFor = (slug) => (slug.includes('solar') ? PHOTOS.solar : slug.includes('stabil') ? PHOTOS.stabilizers : PHOTOS.generators)

  return (
    <section className="pt-[52px] sm:pt-[88px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-[30px] px-[18px] sm:px-7">
        <BandHeading eyebrow={<span className="self-start rounded-full bg-spark px-3 py-1.5 text-[13px] font-extrabold text-midnight">Shop online</span>} title="Buy the equipment. We install it." accent={accent}>
          <Link to="/shop" className={`flex items-center gap-2 font-bold ${accent.text}`}>Visit the shop <span className="nudge" aria-hidden="true">→</span></Link>
        </BandHeading>
        {cats.length > 0 && (
          <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c, i) => {
              const fallback = photoFor(c.slug)
              return (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="reveal lift zoom-host relative block h-[190px] overflow-hidden rounded-[26px] sm:h-[230px]" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="zoom absolute inset-0">
                    {c.image ? <SmartImage image={c.image} sizes="(min-width: 1024px) 33vw, 100vw" /> : <PhotoSlot src={fallback.src} label={fallback.label} />}
                  </div>
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[rgba(9,16,39,.88)] to-transparent p-[18px] pt-12 text-white">
                    <strong className="font-display text-[17px]">{c.name}</strong>
                    <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-spark font-extrabold text-midnight" aria-hidden="true">→</span>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <ShopTeaser title="Featured equipment" />
    </section>
  )
}

/** Daystol Innovation Systems: who the systems are built for */
function AudienceBand({ accent }) {
  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-[30px] px-[18px] pt-[52px] sm:px-7 sm:pt-[88px]">
      <BandHeading eyebrow={<span className={`eyebrow ${accent.text}`}>Built for</span>} title="Homes, offices and estates" />
      <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
        {AUDIENCES.map((a, i) => {
          const photo = PHOTOS[a.photo]
          return (
            <div key={a.title} className="reveal lift zoom-host flex flex-col overflow-hidden rounded-[26px] border border-line bg-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="relative h-[190px] overflow-hidden"><div className="zoom absolute inset-0"><PhotoSlot src={photo.src} label={photo.label} /></div></div>
              <div className="flex flex-col gap-3 p-[22px]">
                <strong className="font-display text-[19px]">{a.title}</strong>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {a.items.map((item) => <li key={item} className="rounded-full border border-line bg-card2 px-3 py-1.5 text-[13px] font-semibold">{item}</li>)}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Daystol Properties: quick ways in, each opening the property form with the topic chosen */
function IntentBand({ accent }) {
  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-[30px] px-[18px] pt-[52px] sm:px-7 sm:pt-[88px]">
      <BandHeading eyebrow={<span className={`eyebrow ${accent.text}`}>Start here</span>} title="What are you looking for?" />
      <ul className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {PROPERTY_INTENTS.map((intent, i) => (
          <li key={intent.label} className="reveal" style={{ animationDelay: `${i * 0.05}s` }}>
            <Link
              to={`/contact?type=property&topic=${encodeURIComponent(intent.topic)}`}
              className="lift flex h-full items-center justify-between gap-3.5 rounded-[22px] border border-line bg-card px-[18px] py-4 text-fg hover:text-fg sm:min-h-[150px] sm:flex-col sm:items-start sm:p-[22px]"
            >
              <strong className="text-[15px] leading-snug sm:text-[17px]">{intent.label}</strong>
              <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-magenta font-extrabold text-white sm:self-end" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Daystol Development Concept: what it builds, each opening the contract form with the topic chosen */
function SectorBand({ accent }) {
  return (
    <section className="mx-auto flex max-w-[1320px] flex-col gap-[30px] px-[18px] pt-[52px] sm:px-7 sm:pt-[88px]">
      <BandHeading eyebrow={<span className={`eyebrow ${accent.text}`}>What we build</span>} title="Infrastructure for communities, businesses and government" />
      <ul className="m-0 grid list-none gap-3.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {CONSTRUCTION_SECTORS.map((s, i) => (
          <li key={s.label} className="reveal" style={{ animationDelay: `${i * 0.05}s` }}>
            <Link
              to={`/contact?type=contract&topic=${encodeURIComponent(s.topic)}`}
              className="lift group flex h-full items-center gap-4 rounded-[22px] border border-line bg-card p-[18px] text-fg hover:text-fg sm:p-[22px]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" style={{ background: accent.fill, color: accent.ink }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="text-[16px] leading-snug sm:text-[17px]">{s.label}</strong>
                <span className="text-sm text-mist">{s.text}</span>
              </span>
              <span className={`nudge shrink-0 font-extrabold ${accent.text}`} aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CompanyCta({ config, accent }) {
  const { data: s } = useSettings()
  const wa = whatsappHref(s?.whatsappNumber)
  return (
    <section className="mx-auto max-w-[1320px] px-[18px] pb-20 sm:px-7 sm:pb-[88px]">
      <div className="reveal relative flex flex-wrap items-center justify-between gap-7 overflow-hidden rounded-3xl border border-[#2A335E] bg-midnight px-[22px] py-8 text-[#F2F4FA] sm:rounded-[34px] sm:px-11 sm:py-14">
        <div className="absolute inset-y-0 left-0 w-2" style={{ background: accent.fill }} aria-hidden="true" />
        <svg aria-hidden="true" viewBox="0 0 600 300" className="pointer-events-none absolute -right-10 -top-5 w-[560px] opacity-50">
          <path className="flowline" d="M0 250 C 160 250, 220 60, 420 80 S 560 40, 640 30" fill="none" stroke={accent.fill} strokeWidth="3" />
        </svg>
        <div className="relative flex max-w-[620px] flex-col gap-3">
          <h2 className="m-0 font-display text-[22px] font-extrabold leading-[1.18] tracking-[-0.02em] sm:text-[clamp(24px,2.6vw,36px)]">{config.cta.title}</h2>
          <p className="m-0 text-base leading-relaxed text-[#B9C0D9] sm:text-[17px]">{config.cta.text}</p>
        </div>
        <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link to={config.cta.to} className="press rounded-full px-6 py-4 text-center font-extrabold" style={{ background: accent.fill, color: accent.ink }}>{config.cta.label}</Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="press flex items-center justify-center gap-2 rounded-full border border-[#2A335E] px-[22px] py-[15px] font-bold text-white hover:text-white">
              <span className="size-2.5 rounded-full bg-whatsapp" aria-hidden="true" />WhatsApp us
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/** One template for the four company pages: Power solutions, Innovation systems, Property services and Construction services. */
export default function ServicePage({ companyId }) {
  const config = COMPANY_PAGES[companyId]
  const company = COMPANIES.find((c) => c.id === config.company)
  const accent = ACCENT[config.company]
  usePageMeta(config.title, config.intro)

  return (
    <>
      <Hero config={config} accent={accent} />
      <Services config={config} accent={accent} />
      {config.company === 'power' && <ShopBand accent={accent} />}
      {config.company === 'innovation' && <AudienceBand accent={accent} />}
      {config.company === 'property' && <IntentBand accent={accent} />}
      {config.company === 'construction' && <SectorBand accent={accent} />}
      <HowWeWork
        eyebrow="How it works"
        eyebrowClass={accent.text}
        title={config.processTitle}
        steps={config.steps.map((s) => ({ ...s, bg: accent.fill, ink: accent.ink }))}
      />
      <ProjectsSection category={config.company} title="Related projects" eyebrow={null} accentClass={accent.text} />
      <CompanyCta config={config} accent={accent} />
    </>
  )
}
