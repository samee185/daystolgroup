import { useState } from 'react'
import { Link, useParams } from 'react-router'
import RichText from '../components/RichText.jsx'
import SmartImage from '../components/SmartImage.jsx'
import Lightbox from '../components/ui/Lightbox.jsx'
import NotFound from './NotFound.jsx'
import { PROJECT_TAG } from '../lib/companies.js'
import { useProject } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const monthYear = new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' })

// Up to 8 tiles on the page. With more photos, the 8th tile becomes "+N more" and opens the viewer.
const SHOW = 7
// Tile sizes in the 4-column grid, repeating every six tiles: [columns, rows]
const SPANS = [[2, 2], [1, 1], [1, 1], [1, 1], [1, 1], [2, 1]]
const spanClass = ([c, r]) => `${c === 2 ? 'col-span-2' : ''} ${r === 2 ? 'row-span-2' : ''}`

function Gallery({ images, title }) {
  const [open, setOpen] = useState(null)
  const overflow = images.length > SHOW + 1
  const tiles = overflow ? images.slice(0, SHOW) : images

  return (
    <section className="py-0 pb-11 sm:pb-[72px]" aria-labelledby="gallery-heading">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="gallery-heading" className="m-0 font-display text-[22px] font-extrabold sm:text-[26px]">Gallery</h2>
          <span className="text-sm text-mist">{images.length} {images.length === 1 ? 'photo' : 'photos'}</span>
        </div>
        <ul className="m-0 grid list-none auto-rows-[130px] grid-cols-2 gap-3 p-0 sm:auto-rows-[170px] lg:grid-cols-4">
          {tiles.map((img, i) => (
            <li key={img.src} className={spanClass(SPANS[i % SPANS.length])}>
              <button type="button" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${images.length}`} className="reveal lift zoom-host relative block h-full w-full overflow-hidden rounded-[18px] p-0">
                <div className="zoom absolute inset-0"><SmartImage image={img} sizes="(min-width: 1024px) 50vw, 100vw" /></div>
              </button>
            </li>
          ))}
          {overflow && (
            <li className={spanClass(SPANS[SHOW % SPANS.length])}>
              <button type="button" onClick={() => setOpen(SHOW)} className="reveal lift zoom-host relative block h-full w-full overflow-hidden rounded-[18px] p-0 text-white">
                <div className="zoom absolute inset-0"><SmartImage image={images[SHOW]} sizes="(min-width: 1024px) 50vw, 100vw" /></div>
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[rgba(9,16,39,.72)]">
                  <strong className="font-display text-2xl sm:text-3xl">+{images.length - SHOW}</strong>
                  <span className="text-sm font-bold">more photos</span>
                </span>
              </button>
            </li>
          )}
        </ul>
      </div>
      {open != null && <Lightbox images={images} start={open} title={title} onClose={() => setOpen(null)} />}
    </section>
  )
}

export default function ProjectDetail() {
  const { slug } = useParams()
  const { data: p, isPending, isError, error, refetch } = useProject(slug)
  usePageMeta(p?.title || 'Project', p?.summary)

  if (isError && error?.status === 404) return <NotFound />
  if (isError) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-mist">We couldn't load this project.</p>
        <button type="button" onClick={() => refetch()} className="press mt-4 rounded-full bg-fg px-6 py-3 font-bold text-bg">Try again</button>
      </div>
    )
  }
  if (isPending) return <div className="mx-4 my-12 h-[60vh] animate-pulse rounded-[30px] bg-card sm:mx-7 xl:mx-auto xl:max-w-[1264px]" aria-busy="true" />

  const tag = PROJECT_TAG[p.category]
  const similar = `/contact?type=${tag.enquiry}&project=${p.slug}`
  const facts = [
    ['Company', `Daystol ${tag.label}`],
    p.location && ['Location', p.location],
    p.client && ['Client', p.client],
    p.completedAt && ['Completed', monthYear.format(new Date(p.completedAt))],
  ].filter(Boolean)

  return (
    <>
      <section className="pb-10 pt-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 sm:px-7">
          <Link to="/projects" className="press self-start rounded-full border border-line bg-card px-4 py-2.5 font-bold text-fg hover:text-fg"><span aria-hidden="true">←</span> All projects</Link>
          <span className="fade-up self-start rounded-full px-3 py-1.5 text-[13px] font-extrabold" style={{ background: tag.bg, color: tag.fg }}>{tag.label}</span>
          <h1 className="m-0 max-w-[22ch] font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(28px,3.4vw,46px)]">
            <span className="rise-line"><span style={{ animationDelay: '.1s' }}>{p.title}</span></span>
          </h1>
          <div className="fade-up zoom-host relative h-[260px] overflow-hidden rounded-[22px] sm:h-[520px] sm:rounded-[30px]" style={{ animationDelay: '.25s' }}>
            <div className="zoom absolute inset-0"><SmartImage image={p.cover} eager sizes="100vw" fallbackLabel={p.title} /></div>
          </div>
        </div>
      </section>

      <section className="pb-11 pt-5 sm:pb-16">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-9 px-4 sm:px-7 lg:flex-row">
          <article className="flex w-full min-w-0 flex-1 flex-col gap-[18px]">
            <h2 className="m-0 font-display text-[22px] font-extrabold sm:text-[26px]">The project</h2>
            {p.caseStudy ? <RichText html={p.caseStudy} /> : <p className="m-0 text-[17px] leading-relaxed text-mist">{p.summary}</p>}
          </article>
          <aside className="flex w-full flex-col gap-1 rounded-3xl border border-line bg-card p-6 lg:sticky lg:top-24 lg:w-[320px] lg:shrink-0">
            <dl className="m-0 flex flex-col">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 border-b border-line py-3">
                  <dt className="text-[13px] text-mist">{label}</dt>
                  <dd className="m-0 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <Link to={similar} className="shine press mt-3.5 rounded-full bg-action py-[15px] text-center font-extrabold text-white hover:text-white">Start a similar project</Link>
          </aside>
        </div>
      </section>

      {p.gallery.length > 0 && <Gallery images={p.gallery} title={p.title} />}

      <section className="pb-12 sm:pb-[88px]">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-7">
          <div className="reveal flex flex-wrap items-center justify-between gap-5 rounded-[22px] border border-[#2A335E] bg-midnight p-6 text-[#F2F4FA] sm:rounded-[30px] sm:p-10">
            <span className="flex flex-col gap-2">
              <strong className="font-display text-xl sm:text-2xl">Planning something similar?</strong>
              <span className="text-[#B9C0D9]">Tell us about your site and we'll get back to you with advice and a quote.</span>
            </span>
            <Link to={similar} className="press rounded-full px-6 py-[15px] font-extrabold" style={{ background: tag.bg, color: tag.fg }}>Talk to {tag.label}</Link>
          </div>
        </div>
      </section>
    </>
  )
}
