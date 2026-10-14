import { Link } from 'react-router'
import { POLICY } from '../lib/policies.js'
import { telHref, useSettings } from '../hooks/useSiteData.js'

/** Shared layout for the Privacy, Terms and Returns pages: contents list on the side, readable text column. */
export default function LegalLayout({ title, intro, sections }) {
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-9 sm:pt-11">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-cyan" aria-hidden="true" />
        <div className="mx-auto flex max-w-[1320px] flex-col gap-[18px] px-4 sm:px-7">
          <nav aria-label="Breadcrumb" className="text-sm text-mist">
            <ol className="m-0 flex list-none gap-2 p-0">
              <li><Link to="/" className="text-mist hover:text-fg">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">{title}</li>
            </ol>
          </nav>
          <span className="fade-up self-start rounded-full border border-line bg-card px-3.5 py-2 text-sm font-bold text-mist">{POLICY.group} · {POLICY.rc}</span>
          <h1 className="m-0 font-display text-[27px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[clamp(30px,3.6vw,48px)]">
            <span className="rise-line"><span style={{ animationDelay: '.1s' }}>{title}</span></span>
          </h1>
          {intro && <p className="fade-up m-0 max-w-[60ch] text-base leading-relaxed text-mist sm:text-[17px]" style={{ animationDelay: '.3s' }}>{intro}</p>}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-8 px-4 pb-24 sm:px-7 lg:flex-row lg:gap-12">
        <nav aria-label="On this page" className="w-full rounded-[22px] border border-line bg-card p-5 lg:sticky lg:top-24 lg:w-[270px] lg:shrink-0">
          <strong className="mb-3 block text-sm text-mist">On this page</strong>
          <ol className="m-0 flex list-none flex-col gap-1 p-0 text-[15px]">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2.5 rounded-xl px-2 py-1.5 text-mist hover:bg-card2 hover:text-fg">
                  <span className="font-display text-xs font-bold text-at-innovation">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="legal w-full min-w-0 max-w-[72ch] text-[17px] leading-relaxed">
          <p className="m-0 mb-8 text-sm text-mist">Last updated {POLICY.lastUpdated}</p>
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
              <h2 className="m-0 mb-3 font-display text-xl font-extrabold sm:text-2xl">{s.heading}</h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </>
  )
}

/** "email us at ..., or call ..." built from Site Settings, with the Contact page as a fallback. */
export function ContactLine() {
  const { data: s } = useSettings()
  if (!s?.email && !s?.phone) return <Link to="/contact" className="font-semibold underline">contact us</Link>
  return (
    <>
      {s.email && <>email <a href={`mailto:${s.email}`} className="font-semibold underline">{s.email}</a></>}
      {s.email && s.phone && ' or '}
      {s.phone && <>call <a href={telHref(s.phone)} className="font-semibold underline">{s.phone}</a></>}
    </>
  )
}
