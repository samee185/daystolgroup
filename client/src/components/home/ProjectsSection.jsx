import { Link } from 'react-router'
import SmartImage from '../SmartImage.jsx'
import { PROJECT_TAG } from '../../lib/companies.js'
import { useProjects } from '../../hooks/useSiteData.js'

/** Published projects from the admin. The section stays hidden until there is at least one. */
export default function ProjectsSection({ category, title = "Work we've delivered", eyebrow = 'Recent projects', accentClass = 'text-at-property' }) {
  const { data: projects } = useProjects(category ? { category, limit: 3 } : { limit: 3 })
  if (!projects?.length) return null

  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-20 pt-6 sm:px-7 sm:pb-24">
      <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-3">
          {eyebrow && <span className={`eyebrow ${accentClass}`}>{eyebrow}</span>}
          <h2 className="h-section m-0">{title}</h2>
        </div>
        <Link to={category ? `/projects?category=${category}` : '/projects'} className="flex items-center gap-2 font-bold text-at-innovation">All projects <span className="nudge" aria-hidden="true">→</span></Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {projects.map((p, i) => {
          const tag = PROJECT_TAG[p.category]
          return (
            <Link key={p.id} to={`/projects/${p.slug}`} className="reveal lift zoom-host relative block h-[340px] overflow-hidden rounded-[28px] sm:h-[420px]" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="zoom absolute inset-0">
                <SmartImage image={p.cover} sizes="(min-width: 768px) 33vw, 100vw" fallbackLabel={p.title} />
              </div>
              {tag && <span className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[13px] font-extrabold" style={{ background: tag.bg, color: tag.fg }}>{tag.label}</span>}
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-[rgba(9,16,39,.92)] to-transparent p-5 pt-16 text-white">
                <strong className="font-display text-lg leading-snug">{p.title}</strong>
                {p.location && <span className="text-sm text-[#B9C0D9]">{p.location}</span>}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
