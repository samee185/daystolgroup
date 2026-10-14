import { Link } from 'react-router'
import { telHref, useSettings } from '../../hooks/useSiteData.js'
import { COMPANIES } from '../../lib/companies.js'

export default function SiteFooter() {
  const { data: s } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-line bg-bg2">
      <div className="mx-auto flex max-w-[1320px] flex-wrap justify-between gap-x-16 gap-y-10 px-5 py-14 text-[15px] text-mist sm:px-7">
        <div className="flex max-w-xs flex-col gap-3">
          <img src="/brand/daystol-logo.png" alt="Daystol Group Ltd" className="h-20 w-auto self-start" width="174" height="80" loading="lazy" />
          <span>Daystol Group Ltd., RC 9511880</span>
          {s?.address && <span className="whitespace-pre-line">{s.address}</span>}
          {s?.phone && <a href={telHref(s.phone)} className="hover:text-fg">{s.phone}</a>}
          {s?.email && <a href={`mailto:${s.email}`} className="hover:text-fg">{s.email}</a>}
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-8">
          <div className="flex flex-col gap-2">
            <strong className="text-fg">Companies</strong>
            {COMPANIES.map((c) => (
              <Link key={c.id} to={c.to} className="hover:text-fg">{c.legalName}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <strong className="text-fg">Help</strong>
            <Link to="/shop" className="hover:text-fg">Shop power equipment</Link>
            <Link to="/support" className="hover:text-fg">Report a fault</Link>
            <Link to="/support#maintenance" className="hover:text-fg">Maintenance contracts</Link>
            <Link to="/contact" className="hover:text-fg">Contact us</Link>
            {s?.emergencyPhone && <a href={telHref(s.emergencyPhone)} className="hover:text-fg">24/7: {s.emergencyPhone}</a>}
          </div>
          <div className="flex flex-col gap-2">
            <strong className="text-fg">Policies</strong>
            <Link to="/terms" className="hover:text-fg">Terms of sale</Link>
            <Link to="/returns" className="hover:text-fg">Returns and refunds</Link>
            <Link to="/privacy" className="hover:text-fg">Privacy policy</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1320px] px-5 pb-28 text-sm text-mist sm:px-7 md:pb-8">© {year} Daystol Group Ltd.</div>
      <div className="flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-cyan" />
        <span className="flex-1 bg-magenta" />
        <span className="flex-1 bg-spark" />
      </div>
    </footer>
  )
}
