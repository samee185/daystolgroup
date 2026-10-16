import { Link } from 'react-router'
import PhotoSlot from '../ui/PhotoSlot.jsx'
import { PHOTOS } from '../../lib/photos.js'

const ICONS = {
  power: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>,
  innovation: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /><path d="M9.5 9.5h5v5h-5zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /></svg>,
  property: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>,
  construction: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 18h18v3H3zM5 18v-3a7 7 0 0 1 14 0v3M12 8V5M9.5 8.5L8 6M14.5 8.5L16 6" /></svg>,
}

const CARDS = [
  {
    id: 'power', no: '01', name: 'Power Services', legal: 'Daystol Power Services Ltd.', to: '/power-solutions', cta: 'Explore power solutions',
    color: '#FFE52E', ink: '#0D1330', text: 'text-at-power', photo: PHOTOS.power,
    blurb: 'Power solution management, electrical installations and mechanical engineering, with sales, installation and maintenance of generators, solar and stabilizers.',
    chips: ['Diesel generators', 'Solar power', 'Servo stabilizers', 'Electrical installations', 'Mechanical engineering'],
  },
  {
    id: 'innovation', no: '02', name: 'Innovation Systems', legal: 'Daystol Innovation Systems Ltd.', to: '/innovation-systems', cta: 'Explore innovation systems',
    color: '#01AFEE', ink: '#0D1330', text: 'text-at-innovation', photo: PHOTOS.innovation,
    blurb: 'Electrical design and installation, power and home automation, surveillance systems, and ICT: installations, software engineering, web solutions and programming.',
    chips: ['Home automation', 'Power automation', 'CCTV and surveillance', 'ICT installations', 'Software and web'],
  },
  {
    id: 'property', no: '03', name: 'Property', legal: 'Daystol Property Ltd.', to: '/property-services', cta: 'Explore properties',
    color: '#EB268F', ink: '#FFFFFF', text: 'text-at-property', photo: PHOTOS.property,
    blurb: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy, from first viewing to day-to-day upkeep.',
    chips: ['Development', 'Sales and leasing', 'Facility management', 'Short-lets', 'Consultancy'],
  },
  {
    id: 'construction', no: '04', name: 'Development Concept', legal: 'Daystol Development Concept Ltd.', to: '/construction-services', cta: 'Explore construction',
    color: '#FF7A1A', ink: '#0D1330', text: 'text-at-construction', photo: PHOTOS.construction,
    blurb: 'General contractor for buildings, infrastructure, roads and bridges, boreholes and water supply, schools, networks and other general contracts.',
    chips: ['Buildings', 'Roads and bridges', 'Boreholes', 'Schools', 'General contracts'],
  },
]

export default function CompanyCards() {
  return (
    <section id="companies" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 pb-10 pt-20 sm:px-7 sm:pt-24">
      <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-5">
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className="eyebrow text-at-innovation">The Daystol group</span>
          <h2 className="h-section m-0">Four specialist companies. One team behind them.</h2>
        </div>
        <p className="m-0 max-w-[46ch] text-base leading-relaxed text-mist sm:text-[17px]">
          Each company has its own engineers and experts, and they work together when your project needs power, systems, property and construction under one plan.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c, i) => (
          <Link key={c.id} to={c.to} className="reveal lift zoom-host flex flex-col overflow-hidden rounded-[30px] border border-line bg-card text-fg hover:text-fg" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="relative h-[210px] overflow-hidden sm:h-[230px]">
              <div className="zoom absolute inset-0"><PhotoSlot src={c.photo.src} label={c.photo.label} /></div>
              <span className="absolute right-5 top-3 font-display text-[44px] font-extrabold opacity-90" style={{ color: c.color }} aria-hidden="true">{c.no}</span>
            </div>
            <div className="h-1.5" style={{ background: c.color }} aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
              <span className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: c.color, color: c.ink }}>{ICONS[c.id]}</span>
                <span className="flex flex-col">
                  <strong className="font-display text-lg">{c.name}</strong>
                  <span className="text-[13px] text-mist">{c.legal}</span>
                </span>
              </span>
              <p className="m-0 leading-relaxed text-mist">{c.blurb}</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {c.chips.map((chip) => <li key={chip} className="rounded-full border border-line bg-card2 px-3 py-1.5 text-[13px] font-semibold">{chip}</li>)}
              </ul>
              <span className={`mt-auto flex items-center gap-2 pt-2 font-bold ${c.text}`}>{c.cta} <span className="nudge" aria-hidden="true">→</span></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
