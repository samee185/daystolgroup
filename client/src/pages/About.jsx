import { Link } from 'react-router'
import RichText from '../components/RichText.jsx'
import SmartImage from '../components/SmartImage.jsx'
import PhotoSlot from '../components/ui/PhotoSlot.jsx'
import { PHOTOS } from '../lib/photos.js'
import { useSettings, useTeam } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const COMPANIES = [
  {
    no: '01', color: '#FFE52E', ink: '#0D1330', to: '/power-solutions', short: 'Power solutions', photo: PHOTOS.power,
    name: 'Daystol Power Services Ltd.',
    text: 'Power solution management, electrical installations and mechanical engineering, with sales, installation and maintenance of diesel generators, solar power systems and servo central industrial stabilizers.',
    chips: ['Generators', 'Solar', 'Stabilizers', 'Electrical', 'Mechanical'],
  },
  {
    no: '02', color: '#01AFEE', ink: '#0D1330', to: '/innovation-systems', short: 'Innovation systems', photo: PHOTOS.innovation,
    name: 'Daystol Innovation Systems Ltd.',
    text: 'Electrical design and installation, power and home automation, surveillance systems, and ICT services: ICT installations, software engineering, web solutions and professional programming.',
    chips: ['Automation', 'Surveillance', 'ICT', 'Software', 'Web'],
  },
  {
    no: '03', color: '#EB268F', ink: '#FFFFFF', to: '/property-services', short: 'Properties', photo: PHOTOS.property,
    name: 'Daystol Properties Ltd.',
    text: 'Property development, sales and leasing, facility management, short-let apartments and real-estate consultancy.',
    chips: ['Development', 'Sales and leasing', 'Facility management', 'Short-lets', 'Consultancy'],
  },
  {
    no: '04', color: '#FF7A1A', ink: '#0D1330', to: '/construction-services', short: 'Construction', photo: PHOTOS.construction,
    name: 'Daystol Development Concept Ltd.',
    text: 'General contracting for buildings and infrastructure: building structures, roads and bridges, boreholes and water supply, schools and public facilities, networks, and other general contracts.',
    chips: ['Buildings', 'Roads and bridges', 'Boreholes', 'Schools', 'General contracts'],
  },
]

const EXPECT = [
  { title: 'One team to call', text: 'Power, systems, property and construction under one group, so you are never passed between strangers.', color: '#FFE52E', ink: '#0D1330', icon: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2' },
  { title: 'We install and maintain', text: 'The people who install your equipment are the people who look after it.', color: '#01AFEE', ink: '#0D1330', icon: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z' },
  { title: '24/7 fault line', text: 'When something stops working, there is always a number to call.', color: '#FF6B6B', ink: '#0D1330', icon: 'M12 3l9 16H3zM12 10v4M12 17.5v.5' },
  { title: 'Clear quotes first', text: 'You see an itemised quote before any work starts.', color: '#EB268F', ink: '#FFFFFF', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5' },
]

const TEAM_COLORS = ['#FFE52E', '#01AFEE', '#EB268F', '#FF7A1A']

const WIRES = [
  { d: 'M300 92 C 300 170, 75 170, 75 262', color: '#FFE52E', delay: 0.6, pulse: -0.3 },
  { d: 'M300 92 C 300 170, 225 170, 225 262', color: '#01AFEE', delay: 0.75, pulse: -1 },
  { d: 'M300 92 C 300 170, 375 170, 375 262', color: '#EB268F', delay: 0.9, pulse: -1.7 },
  { d: 'M300 92 C 300 170, 525 170, 525 262', color: '#FF7A1A', delay: 1.05, pulse: -2.4 },
]

const NODES = [
  { left: '12.5%', label: ['Power', 'Services'], bg: '#FFE52E', fg: '#0D1330', delay: 1.3 },
  { left: '37.5%', label: ['Innovation', 'Systems'], bg: '#01AFEE', fg: '#0D1330', delay: 1.45 },
  { left: '62.5%', label: ['Properties'], bg: '#EB268F', fg: '#FFFFFF', delay: 1.6 },
  { left: '87.5%', label: ['Development', 'Concept'], bg: '#FF7A1A', fg: '#0D1330', delay: 1.75 },
]

/** The group and its four companies, drawn as a family tree with power flowing down the wires. */
function GroupTree() {
  return (
    <div className="relative h-[300px] sm:h-[380px]" aria-hidden="true">
      <svg viewBox="0 0 600 380" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {WIRES.map((w) => <path key={w.color} className="wire" d={w.d} fill="none" stroke={w.color} strokeWidth="3" style={{ animationDelay: `${w.delay}s` }} />)}
        {WIRES.map((w) => <path key={`p-${w.color}`} className="wire-pulse" d={w.d} fill="none" stroke="var(--fg)" strokeWidth="3" style={{ opacity: 0.45, animationDelay: `${w.pulse}s` }} />)}
      </svg>
      <div className="absolute left-1/2 top-2.5 -translate-x-1/2">
        <div className="pop-in" style={{ animationDelay: '.3s' }}>
          <div className="bob rounded-[22px] bg-white px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,.3)] sm:px-[22px] sm:py-3.5">
            <img src="/brand/daystol-logo.png" alt="" className="h-9 w-auto sm:h-11" />
          </div>
        </div>
      </div>
      {NODES.map((n) => (
        <div key={n.left} className="absolute top-[69%] -translate-x-1/2" style={{ left: n.left }}>
          <div className="pop-in rounded-[16px] px-2 py-2.5 text-center text-[11px] font-extrabold sm:rounded-[18px] sm:px-3.5 sm:py-3.5 sm:text-sm" style={{ background: n.bg, color: n.fg, animationDelay: `${n.delay}s` }}>
            {n.label.map((l, i) => <span key={l}>{i > 0 && <br />}{l}</span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

function Team() {
  const { data: team } = useTeam()
  if (!team?.length) return null
  return (
    <section className="border-y border-line bg-bg2 py-12 sm:py-[72px]" aria-labelledby="team-heading">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-4 sm:px-7">
        <h2 id="team-heading" className="h-section reveal m-0">The people behind Daystol</h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-[18px] lg:grid-cols-4">
          {team.map((m, i) => (
            <li key={m.id} className="reveal lift zoom-host overflow-hidden rounded-[22px] border border-line bg-card sm:rounded-3xl" style={{ animationDelay: `${(i % 4) * 0.06}s` }}>
              <div className="relative aspect-[4/5] overflow-hidden">
                <div className="zoom absolute inset-0"><SmartImage image={m.photo} sizes="(min-width: 1024px) 25vw, 50vw" fallbackLabel={m.name} /></div>
                <span className="absolute inset-x-0 bottom-0 h-[5px]" style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }} aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 px-[18px] py-4">
                <h3 className="m-0 text-base font-bold">{m.name}</h3>
                <p className="m-0 text-sm text-mist">{m.position}</p>
                {m.bio && <p className="m-0 mt-2 text-sm leading-relaxed text-mist">{m.bio}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function About() {
  const { data: s } = useSettings()
  usePageMeta('About us', 'Daystol Group Ltd. (RC 9511880) is the parent company of Daystol Power Services, Daystol Innovation Systems, Daystol Properties and Daystol Development Concept.')

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-9 sm:pb-[72px] sm:pt-12">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true"><span className="flex-1 bg-spark" /><span className="flex-1 bg-cyan" /><span className="flex-1 bg-magenta" /><span className="flex-1 bg-orange" /></div>
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 sm:px-7 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-5">
            <nav aria-label="Breadcrumb" className="text-sm text-mist">
              <ol className="m-0 flex list-none gap-2 p-0">
                <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-fg">About</li>
              </ol>
            </nav>
            <span className="fade-up self-start rounded-full border border-line bg-card px-3.5 py-2 text-sm font-bold text-mist" style={{ animationDelay: '.05s' }}>Daystol Group Ltd. · RC 9511880</span>
            <h1 className="m-0 font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(30px,3.8vw,52px)]">
              <span className="rise-line"><span style={{ animationDelay: '.1s' }}>One group.</span></span>
              <span className="rise-line"><span style={{ animationDelay: '.25s' }}>Four specialist</span></span>
              <span className="rise-line"><span className="text-at-innovation" style={{ animationDelay: '.4s' }}>companies.</span></span>
            </h1>
            <p className="fade-up m-0 max-w-[54ch] text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.55s' }}>
              Daystol Group Ltd. is the parent company of Daystol Power Services, Daystol Innovation Systems, Daystol Properties and Daystol Development Concept. Together we cover power and energy, electrical and smart systems, property, and construction and infrastructure, so clients deal with one team from start to finish.
            </p>
          </div>
          <GroupTree />
        </div>
      </section>

      {/* "Who we are": written by staff under Site settings, hidden until then */}
      {s?.about && (
        <section className="border-y border-line bg-bg2 py-12 sm:py-[72px]">
          <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 sm:px-7 lg:grid-cols-2 lg:gap-12">
            <div className="reveal zoom-host relative h-[260px] overflow-hidden rounded-[22px] sm:h-[420px] sm:rounded-[30px]">
              <div className="zoom absolute inset-0"><PhotoSlot src={PHOTOS.team.src} label={PHOTOS.team.label} /></div>
            </div>
            <div className="reveal flex flex-col gap-4">
              <span className="eyebrow text-at-power">Who we are</span>
              <h2 className="h-section m-0">{s.about.headline}</h2>
              <RichText html={s.about.story} />
            </div>
          </div>
        </section>
      )}

      <section className="pb-10 pt-12 sm:pb-14 sm:pt-[88px]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-4 sm:px-7">
          <div className="reveal mb-3 flex max-w-[680px] flex-col gap-3">
            <span className="eyebrow text-at-innovation">Our companies</span>
            <h2 className="h-section m-0">Specialists in their own field, working as one group</h2>
          </div>
          {COMPANIES.map((c, i) => (
            <div key={c.no} className="reveal grid overflow-hidden rounded-[22px] border border-line bg-card sm:rounded-[28px] lg:grid-cols-[.9fr_1.1fr]">
              <div className={`zoom-host relative min-h-[200px] overflow-hidden sm:min-h-[300px] ${i % 2 ? 'lg:order-2' : ''}`}>
                <div className="zoom absolute inset-0"><PhotoSlot src={c.photo.src} label={c.photo.label} /></div>
                <span className="absolute left-5 top-[18px] font-display text-[44px] font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,.35)]" style={{ color: c.color }} aria-hidden="true">{c.no}</span>
              </div>
              <div className="flex flex-col justify-center gap-3.5 border-t-[6px] p-[22px] sm:p-9" style={{ borderTopColor: c.color }}>
                <h3 className="m-0 font-display text-xl font-bold sm:text-[22px]">{c.name}</h3>
                <p className="m-0 leading-relaxed text-mist">{c.text}</p>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {c.chips.map((x) => <li key={x} className="rounded-full border border-line bg-card2 px-3 py-1.5 text-[13px] font-semibold">{x}</li>)}
                </ul>
                <Link to={c.to} className="press mt-1 flex items-center gap-2 self-start rounded-full px-5 py-[13px] font-extrabold" style={{ background: c.color, color: c.ink }}>
                  Visit {c.short} <span className="nudge" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-12 pt-6 sm:pb-[88px] sm:pt-10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-4 sm:px-7">
          <h2 className="h-section reveal m-0">What you can expect from us</h2>
          <ul className="m-0 grid list-none gap-[18px] p-0 sm:grid-cols-2 lg:grid-cols-4">
            {EXPECT.map((e, i) => (
              <li key={e.title} className="reveal lift flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5 sm:rounded-3xl sm:p-6" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="flex size-[46px] items-center justify-center rounded-[14px]" style={{ background: e.color, color: e.ink }} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={e.icon} /></svg>
                </span>
                <strong className="text-[17px]">{e.title}</strong>
                <span className="text-[15px] leading-normal text-mist">{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Team />

      <section className="pb-12 pt-12 sm:pb-[88px] sm:pt-20">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 sm:px-7">
          <dl className="reveal m-0 flex flex-wrap justify-between gap-7 rounded-[22px] border border-line bg-card p-5 sm:rounded-[26px] sm:p-7">
            <div className="flex flex-col gap-1">
              <dt className="text-[13px] text-mist">Registered company</dt>
              <dd className="m-0 flex flex-col gap-1"><strong>Daystol Group Ltd.</strong><span className="text-sm text-mist">RC 9511880, registered in Nigeria</span></dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[13px] text-mist">Subsidiaries</dt>
              <dd className="m-0 flex flex-col gap-1"><strong>Daystol Power Services Ltd.</strong><strong>Daystol Innovation Systems Ltd.</strong><strong>Daystol Properties Ltd.</strong><strong>Daystol Development Concept Ltd.</strong></dd>
            </div>
            {(s?.address || s?.officeHours) && (
              <div className="flex flex-col gap-1">
                <dt className="text-[13px] text-mist">Head office</dt>
                <dd className="m-0 flex flex-col gap-1">
                  {s.address && <strong className="whitespace-pre-line">{s.address}</strong>}
                  {s.officeHours && <span className="text-sm text-mist">{s.officeHours}</span>}
                </dd>
              </div>
            )}
          </dl>
          <div className="reveal relative flex flex-wrap items-center justify-between gap-[22px] overflow-hidden rounded-[22px] border border-[#2A335E] bg-midnight p-6 text-[#F2F4FA] sm:rounded-[30px] sm:p-11">
            <span className="flex max-w-[560px] flex-col gap-2">
              <strong className="font-display text-[22px] leading-tight sm:text-[26px]">Let's work together</strong>
              <span className="leading-relaxed text-[#B9C0D9]">Power, systems, property or construction: tell us what you're planning and the right Daystol company will get back to you.</span>
            </span>
            <span className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link to="/contact" className="shine press rounded-full bg-action px-6 py-[15px] text-center font-extrabold text-white hover:text-white">Contact us</Link>
              <Link to="/projects" className="press rounded-full border border-[#2A335E] px-5 py-3.5 text-center font-bold text-white hover:text-white">See our projects</Link>
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
