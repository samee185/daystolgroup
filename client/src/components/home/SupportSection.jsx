import { Link } from 'react-router'
import { telHref, useSettings } from '../../hooks/useSiteData.js'

// Matches what Daystol Power Services and Daystol Innovation Systems install and maintain
const EQUIPMENT = [
  { label: 'Diesel generator', value: 'generator' },
  { label: 'Solar power system', value: 'solar' },
  { label: 'Servo stabilizer', value: 'stabilizer' },
  { label: 'Electrical installation', value: 'electrical' },
  { label: 'Surveillance system', value: 'surveillance' },
  { label: 'Automation', value: 'automation' },
]

function ActionCard({ to, title, text, icon, iconBg }) {
  return (
    <Link to={to} className="lift flex items-center gap-4 rounded-3xl border border-line bg-card p-5 text-fg hover:text-fg">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: iconBg }} aria-hidden="true">{icon}</span>
      <span className="flex flex-1 flex-col"><strong className="text-[17px]">{title}</strong><span className="text-sm text-mist">{text}</span></span>
      <span className="nudge text-xl text-mist" aria-hidden="true">→</span>
    </Link>
  )
}

export default function SupportSection() {
  const { data: s } = useSettings()
  const emergency = telHref(s?.emergencyPhone)

  return (
    <section className="mx-auto grid max-w-[1320px] items-start gap-10 px-5 py-20 sm:px-7 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:gap-12">
      <div className="reveal flex flex-col gap-5">
        <span className="eyebrow text-at-innovation">Support and maintenance</span>
        <h2 className="h-section m-0">Something stopped working? Tell us in two minutes.</h2>
        <p className="m-0 max-w-[36em] text-base leading-relaxed text-mist sm:text-[17px]">
          Report a fault with photos and our support team calls you to arrange a technician. Planned maintenance contracts keep generators, solar and stabilizers running.
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {EQUIPMENT.map((e) => (
            <li key={e.value}>
              <Link to={`/support?equipment=${e.value}`} className="press inline-block rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold text-fg hover:border-cyan hover:text-fg">
                {e.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="reveal flex flex-col gap-4">
        {emergency && (
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-3xl bg-midnight p-6 text-white sm:p-7">
            <span className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-spark opacity-20 blur-2xl" aria-hidden="true" />
            <span className="flex items-center gap-2.5 text-sm font-bold text-spark">
              <span className="relative size-2.5" aria-hidden="true"><span className="ping bg-alert" /><span className="absolute inset-0 rounded-full bg-alert" /></span>
              24/7 emergency line
            </span>
            <strong className="font-display text-2xl font-extrabold">{s.emergencyPhone}</strong>
            <span className="text-[15px] text-[#B9C0D9]">For outages that can't wait.</span>
            <a href={emergency} className="press mt-1 self-start rounded-full bg-spark px-6 py-3.5 font-bold text-midnight hover:text-midnight">Call now</a>
          </div>
        )}
        <ActionCard
          to="/support"
          title="Report a fault"
          text="With photos, in minutes"
          iconBg="#D4157A"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>}
        />
        <ActionCard
          to="/support#maintenance"
          title="Maintenance contracts"
          text="Planned visits, fewer outages"
          iconBg="#01AFEE"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D1330" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M9 15l2 2 4-4" /></svg>}
        />
      </div>
    </section>
  )
}
