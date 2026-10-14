import { Link } from 'react-router'
import SmartImage from '../components/SmartImage.jsx'
import CheckoutSteps from '../components/shop/CheckoutSteps.jsx'
import { formatNaira } from '../lib/api.js'
import { MAX_QTY, useCart, useCartQuote } from '../lib/cart.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

const NO_QTY = ['unavailable', 'quote_only', 'out_of_stock']

function LineQty({ line, onChange }) {
  const btn = 'press flex size-10 items-center justify-center text-xl font-bold text-fg disabled:opacity-30'
  const max = Math.min(MAX_QTY, line.maxQty || MAX_QTY)
  return (
    <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity of ${line.name}`}>
      <button type="button" className={btn} onClick={() => onChange(line.qty - 1)} disabled={line.qty <= 1} aria-label="One less">−</button>
      <output className="w-[26px] text-center font-extrabold">{line.qty}</output>
      <button type="button" className={btn} onClick={() => onChange(line.qty + 1)} disabled={line.qty >= max} aria-label="One more">+</button>
    </div>
  )
}

function CartLine({ line, setQty, remove }) {
  const removeButton = (
    <button type="button" onClick={() => remove(line.id)} className="p-0 text-sm text-mist underline hover:text-fg">Remove</button>
  )

  if (!line.name) {
    return (
      <li className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-card p-5">
        <span className="text-mist">{line.message}</span>
        {removeButton}
      </li>
    )
  }

  return (
    <li className={`fade-up grid grid-cols-[72px_minmax(0,1fr)] items-center gap-[18px] rounded-[22px] border bg-card p-[18px] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:rounded-3xl sm:p-4 ${line.problem ? 'border-bad' : 'border-line'}`} style={{ animationDuration: '.5s' }}>
      <Link to={`/shop/${line.slug}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-[#F2F4FA]" tabIndex={-1} aria-hidden="true">
        {line.image
          ? <SmartImage image={line.image} sizes="96px" className="object-contain" />
          : <span className="absolute inset-[20%] rounded-full bg-[radial-gradient(circle,rgba(255,229,46,.6),transparent_70%)]" />}
      </Link>
      <div className="flex min-w-0 flex-col gap-1.5">
        {line.category && <span className="text-[13px] font-bold text-mist">{line.category}</span>}
        <Link to={`/shop/${line.slug}`} className="text-[17px] font-bold leading-snug text-fg hover:text-cyan">{line.name}</Link>
        {line.unitPrice != null && (
          <span className="text-sm text-mist">
            {formatNaira(line.unitPrice)} each
            {line.onSale && <span className="ml-2 rounded-full bg-action px-2 py-0.5 text-[11px] font-extrabold text-white">SALE</span>}
          </span>
        )}
        {line.problem && <span className="text-sm font-bold text-bad" role="alert">{line.message}</span>}
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
        {!NO_QTY.includes(line.problem) ? <LineQty line={line} onChange={(q) => setQty(line.id, q)} /> : <span />}
        <span className="flex items-center gap-3.5">
          {removeButton}
          {!line.problem && <strong className="font-display text-[17px]">{formatNaira(line.lineTotal)}</strong>}
        </span>
      </div>
    </li>
  )
}

const Perk = ({ d, children }) => (
  <span className="flex items-center gap-2.5">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-at-innovation"><path d={d} /></svg>
    {children}
  </span>
)

export default function Cart() {
  const { items, count, setQty, remove } = useCart()
  const { data, isPending, isError, refetch, isFetching } = useCartQuote(items)
  usePageMeta('Your cart')

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-[1180px] flex-col gap-7 px-4 pb-24 pt-9 sm:px-7">
        <CheckoutSteps step={0} />
        <div className="pop-in flex flex-col items-center gap-4 rounded-[26px] border border-line bg-card px-6 py-14 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-card2 text-at-power" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20.5" r="1.2" /><circle cx="17" cy="20.5" r="1.2" /></svg>
          </span>
          <h1 className="m-0 font-display text-2xl font-extrabold sm:text-[34px]">Your cart is empty</h1>
          <p className="m-0 max-w-[44ch] text-mist">Generators, solar power systems and stabilizers, with installation by Daystol engineers.</p>
          <Link to="/shop" className="shine press mt-2 rounded-full bg-action px-7 py-4 font-bold text-white hover:text-white">Browse the shop</Link>
        </div>
      </section>
    )
  }

  const problems = data?.lines?.filter((l) => l.problem) || []
  const canCheckout = data?.ok && data.paymentsEnabled

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-7 px-4 pb-24 pt-9 sm:px-7">
      <CheckoutSteps step={0} />
      <h1 className="m-0 font-display text-2xl font-extrabold sm:text-[34px]">
        Your cart <span className="text-[.6em] font-semibold text-mist">({count} {count === 1 ? 'item' : 'items'})</span>
      </h1>

      <div className="flex flex-col items-start gap-7 lg:flex-row">
        <div className="flex w-full min-w-0 flex-col gap-[18px]">
          {isPending && (
            <ul className="m-0 flex list-none flex-col gap-[18px] p-0" aria-busy="true">
              {items.map((i) => <li key={i.id} className="h-[128px] animate-pulse rounded-3xl bg-card" />)}
            </ul>
          )}
          {isError && !data && (
            <div className="rounded-3xl border border-line bg-card p-6">
              <p className="m-0 mb-3 text-mist">We couldn't load your cart.</p>
              <button type="button" onClick={() => refetch()} className="press rounded-full bg-fg px-6 py-3 font-bold text-bg">Try again</button>
            </div>
          )}
          {data && (
            <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
              {data.lines.map((line) => <CartLine key={line.id} line={line} setQty={setQty} remove={remove} />)}
            </ul>
          )}
          <Link to="/shop" className="flex items-center gap-2 self-start font-bold text-mist hover:text-fg"><span aria-hidden="true">←</span> Continue shopping</Link>
        </div>

        <aside className="flex w-full flex-col gap-4 rounded-[22px] border border-line bg-card p-[18px] sm:rounded-[26px] sm:p-6 lg:sticky lg:top-24 lg:w-[380px] lg:shrink-0" aria-busy={isFetching}>
          <h2 className="m-0 font-display text-xl font-extrabold">Summary</h2>
          <div className="flex justify-between"><span className="text-mist">Subtotal</span><strong>{data ? formatNaira(data.subtotal) : '…'}</strong></div>
          <div className="flex justify-between"><span className="text-mist">Delivery</span><span className="text-mist">Chosen at checkout</span></div>
          {problems.length > 0 && (
            <p className="m-0 rounded-[14px] bg-[rgba(255,138,128,.12)] px-3.5 py-3 text-sm font-bold text-bad">
              Fix or remove the {problems.length === 1 ? 'item' : 'items'} marked in red to continue.
            </p>
          )}
          {data && !data.paymentsEnabled && (
            <p className="m-0 rounded-[14px] bg-card2 px-3.5 py-3 text-sm text-mist">
              Online payment isn't switched on yet. <Link to="/contact?type=quote" className="font-bold text-fg underline">Send us your order</Link> and we'll get back to you.
            </p>
          )}
          {canCheckout ? (
            <Link to="/checkout" className="shine press rounded-full bg-action py-4 text-center text-[17px] font-extrabold text-white hover:text-white">Checkout</Link>
          ) : (
            <span className="rounded-full bg-action py-4 text-center text-[17px] font-extrabold text-white opacity-45" aria-disabled="true">Checkout</span>
          )}
          <div className="flex flex-col gap-2.5 border-t border-line pt-3.5 text-sm text-mist">
            <Perk d="M4 10h16v10H4zM8 10V7a4 4 0 0 1 8 0v3">Pay by card, transfer or USSD</Perk>
            <Perk d="M12 3a9 9 0 1 0 9 9M12 7v5l3 2">Prices checked live before you pay</Perk>
            <Perk d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z">Installation by Daystol engineers</Perk>
          </div>
        </aside>
      </div>
    </section>
  )
}
