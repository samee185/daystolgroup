const LABELS = ['Cart', 'Your details', 'Payment', 'Confirmation']

/** Progress bar across cart, checkout, payment and confirmation. `step` is 0 to 3. */
export default function CheckoutSteps({ step }) {
  return (
    <nav aria-label="Checkout steps" className="flex flex-col gap-3">
      <ol className="m-0 flex list-none justify-between gap-2 p-0">
        {LABELS.map((label, i) => {
          const done = i < step
          const now = i === step
          return (
            <li key={label} aria-current={now ? 'step' : undefined} className={`flex items-center gap-2.5 text-[15px] font-bold ${done || now ? 'text-fg' : 'text-mist'}`}>
              <span
                className={`flex size-[34px] shrink-0 items-center justify-center rounded-full text-sm ${done ? 'bg-[#157347] text-white' : now ? 'bg-spark text-midnight' : 'border-2 border-line text-mist'}`}
              >
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                ) : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
              {done && <span className="sr-only">(done)</span>}
            </li>
          )
        })}
      </ol>
      <div className="h-1.5 overflow-hidden rounded-full bg-card2" aria-hidden="true">
        <div
          key={step}
          className="grow-x h-full rounded-full"
          style={{ width: `${((step + 1) / LABELS.length) * 100}%`, background: 'linear-gradient(90deg, #FFE52E, #01AFEE, #EB268F)' }}
        />
      </div>
    </nav>
  )
}
