import { Link, useSearchParams } from 'react-router'
import SmartImage from '../components/SmartImage.jsx'
import { PROJECT_TAG } from '../lib/companies.js'
import { useTheme } from '../lib/theme.js'
import { useProjects } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const FILTERS = [
  { value: '', label: 'All projects' },
  { value: 'power', label: 'Power Services' },
  { value: 'innovation', label: 'Innovation Systems' },
  { value: 'property', label: 'Properties' },
  { value: 'construction', label: 'Development Concept' },
]

const monthYear = new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' })
const place = (p) => [p.location, p.completedAt && monthYear.format(new Date(p.completedAt))].filter(Boolean).join(' · ')

function Featured({ p }) {
  const tag = PROJECT_TAG[p.category]
  return (
    <Link to={`/projects/${p.slug}`} className="reveal lift zoom-host grid overflow-hidden rounded-[22px] border border-line bg-card text-fg hover:text-fg sm:rounded-[30px] lg:grid-cols-[1.3fr_1fr]">
      <div className="relative min-h-[220px] overflow-hidden sm:min-h-[380px]">
        <div className="zoom absolute inset-0"><SmartImage image={p.cover} eager sizes="(min-width: 1024px) 56vw, 100vw" fallbackLabel={p.title} /></div>
        <span className="absolute left-[18px] top-[18px] rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: tag.bg, color: tag.fg }}>Featured · {tag.label}</span>
      </div>
      <div className="flex flex-col justify-center gap-3.5 p-[22px] sm:p-9">
        {place(p) && <span className="text-sm font-semibold text-mist">{place(p)}</span>}
        <strong className="font-display text-[22px] leading-tight sm:text-[26px]">{p.title}</strong>
        <span className="leading-relaxed text-mist">{p.summary}</span>
        <span className="flex items-center gap-2 pt-1.5 font-extrabold text-at-innovation">Read the case study <span className="nudge" aria-hidden="true">→</span></span>
      </div>
    </Link>
  )
}

function Tile({ p, index }) {
  const tag = PROJECT_TAG[p.category]
  return (
    <Link to={`/projects/${p.slug}`} className="reveal lift zoom-host relative block h-[340px] overflow-hidden rounded-[26px] text-white hover:text-white" style={{ animationDelay: `${(index % 3) * 0.06}s` }}>
      <div className="zoom absolute inset-0"><SmartImage image={p.cover} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" fallbackLabel={p.title} /></div>
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-b from-transparent to-[rgba(9,16,39,.94)] p-[22px] pt-16">
        <span className="self-start rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: tag.bg, color: tag.fg }}>{tag.label}</span>
        <strong className="font-display text-lg leading-tight">{p.title}</strong>
        <span className="flex items-center justify-between gap-2.5 text-sm text-[#D6DBEC]">
          {place(p)}
          <span className="nudge flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-midnight" aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  )
}

export default function Projects() {
  const [params, setParams] = useSearchParams()
  const { isDark } = useTheme()
  const category = FILTERS.some((t) => t.value === params.get('category')) ? params.get('category') : ''
  // One request for everything, so the filter chips can show counts
  const { data: all, isPending, isError, refetch } = useProjects()
  usePageMeta('Projects', 'Projects delivered by Daystol Power Services, Daystol Innovation Systems, Daystol Properties and Daystol Development Concept.')

  const projects = (all || []).filter((p) => !category || p.category === category)
  const featured = projects.find((p) => p.featured)
  const rest = projects.filter((p) => p !== featured)
  const countFor = (value) => (all || []).filter((p) => !value || p.category === value).length

  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-9 sm:pt-11">
        <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true"><span className="flex-1 bg-spark" /><span className="flex-1 bg-cyan" /><span className="flex-1 bg-magenta" /><span className="flex-1 bg-orange" /></div>
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[18px] px-4 sm:px-7">
          <nav aria-label="Breadcrumb" className="text-sm text-mist">
            <ol className="m-0 flex list-none gap-2 p-0">
              <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">Projects</li>
            </ol>
          </nav>
          <h1 className="m-0 font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(30px,3.8vw,52px)]">
            <span className="rise-line"><span style={{ animationDelay: '.1s' }}>Work we've delivered,</span></span>
            <span className="rise-line"><span className="text-at-innovation" style={{ animationDelay: '.25s' }}>across four companies.</span></span>
          </h1>
          <p className="fade-up m-0 max-w-[58ch] text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.4s' }}>
            Power installations, automation and security systems, property projects and construction works by Daystol Power Services, Daystol Innovation Systems, Daystol Properties and Daystol Development Concept.
          </p>
          <div className="fade-up -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 pt-1.5 sm:mx-0 sm:px-0" role="group" aria-label="Filter projects" style={{ animationDelay: '.5s', scrollbarWidth: 'none' }}>
            {FILTERS.map((f) => {
              const on = f.value === category
              const dot = f.value ? PROJECT_TAG[f.value].bg : isDark ? '#F2F4FA' : '#0D1330'
              return (
                <button
                  key={f.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setParams(f.value ? { category: f.value } : {})}
                  className={`press flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[15px] font-bold ${on ? 'border-fg bg-fg text-bg' : 'border-line bg-card text-fg hover:border-cyan'}`}
                >
                  <span className="size-[9px] rounded-full" style={{ background: dot }} aria-hidden="true" />
                  {f.label}
                  {all && <span className="font-semibold opacity-70">{countFor(f.value)}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="pb-12 pt-3 sm:pb-[88px]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[22px] px-4 sm:px-7">
          {isError && (
            <p className="m-0 text-mist">
              We couldn't load the projects. <button type="button" className="font-bold text-fg underline" onClick={() => refetch()}>Try again</button>
            </p>
          )}
          {isPending && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[340px] animate-pulse rounded-[26px] bg-card" />)}
            </div>
          )}
          {all && projects.length === 0 && (
            <p className="m-0 rounded-3xl border border-line bg-card p-8 text-center text-mist">Projects in this category will be published soon.</p>
          )}
          {featured && <Featured key={featured.id} p={featured} />}
          {rest.length > 0 && (
            <div key={category} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => <Tile key={p.id} p={p} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
