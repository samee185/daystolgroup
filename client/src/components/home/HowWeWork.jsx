const STEPS = [
  { title: 'Talk to us', text: 'Call, WhatsApp or send a request. We find out what you need and where.', bg: '#FFE52E', ink: '#0D1330' },
  { title: 'Site visit and quote', text: 'Our engineers assess the site and give you a clear, itemised quote.', bg: '#01AFEE', ink: '#0D1330' },
  { title: 'Supply and install', text: 'We supply the equipment and install it safely, to standard.', bg: '#EB268F', ink: '#FFFFFF' },
  { title: 'Maintain and support', text: 'Maintenance contracts and a 24/7 fault line keep things running.', bg: 'var(--fg)', ink: 'var(--bg)' },
]

export default function HowWeWork({ title = 'From the first call to years of upkeep', eyebrow = 'How we work', eyebrowClass = 'text-at-power', steps = STEPS }) {
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-20 pt-12 sm:px-7 sm:pb-24">
      <div className="reveal mb-9 flex max-w-[700px] flex-col gap-3">
        <span className={`eyebrow ${eyebrowClass}`}>{eyebrow}</span>
        <h2 className="h-section m-0">{title}</h2>
      </div>
      <ol className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="reveal lift flex flex-col gap-3.5 rounded-3xl border border-line bg-card p-6" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="flex items-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-extrabold" style={{ background: s.bg, color: s.ink }}>{i + 1}</span>
              <span className="ml-3.5 h-0.5 flex-1" style={{ background: 'repeating-linear-gradient(90deg, var(--line) 0 8px, transparent 8px 14px)' }} aria-hidden="true" />
            </span>
            <strong className="text-lg">{s.title}</strong>
            <span className="leading-relaxed text-mist">{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
