const Y = '#FFE52E'
const C = '#01AFEE'
const M = '#EB268F'

// Every service from the three companies
const ITEMS = [
  ['Diesel generators', Y], ['Solar power systems', Y], ['Servo stabilizers', Y], ['Electrical installations', Y], ['Mechanical engineering', Y],
  ['Power automation', C], ['Home automation', C], ['Surveillance systems', C], ['ICT installations', C], ['Software engineering', C], ['Web solutions', C],
  ['Property development', M], ['Sales and leasing', M], ['Facility management', M], ['Short-lets', M], ['Real-estate consultancy', M],
]

/** Scrolling strip of services. Pauses on hover; the list is doubled so it loops seamlessly. */
export default function Marquee() {
  return (
    <div className="overflow-hidden border-y border-line bg-bg2 py-4">
      <p className="sr-only">What we do: {ITEMS.map(([label]) => label).join(', ')}.</p>
      <div className="marquee" aria-hidden="true">
        {[...ITEMS, ...ITEMS].map(([label, color], i) => (
          <span key={i} className="flex items-center gap-3.5 whitespace-nowrap px-5 text-base font-semibold sm:text-[17px]">
            <span className="size-2.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
