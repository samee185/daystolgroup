import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import SmartImage from '../components/SmartImage.jsx'
import CheckoutSteps from '../components/shop/CheckoutSteps.jsx'
import {
  fieldErrorsFrom, Honeypot, Select, TextArea, TextInput, validators,
} from '../components/form/Fields.jsx'
import { apiPost, formatNaira } from '../lib/api.js'
import { useCart, useCartQuote } from '../lib/cart.jsx'
import { usePageMeta } from '../hooks/usePageMeta.js'

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
].map((s) => ({ value: s, label: s }))

const EMPTY = { name: '', email: '', phone: '', fulfilment: 'pickup', address: '', city: '', state: '', notes: '', website: '' }

const card = 'flex flex-col gap-[18px] rounded-[22px] border border-line bg-card p-[18px] sm:rounded-[26px] sm:p-[26px]'

function StepHeading({ n, bg, ink, children }) {
  return (
    <h2 className="m-0 flex items-center gap-3 text-[19px] font-bold">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm" style={{ background: bg, color: ink }}>{n}</span>
      {children}
    </h2>
  )
}

/** Pickup or delivery, as two large radio cards. */
function FulfilmentChoice({ value, onChange, delivery }) {
  const deliveryText = delivery.deliveryFee == null
    ? 'Fee agreed after payment'
    : `${formatNaira(delivery.deliveryFee)}${delivery.deliveryArea ? ` to ${delivery.deliveryArea}` : ''}`
  const options = [
    { value: 'pickup', title: 'Pickup', text: 'Free, from our office', color: '#FFE52E', icon: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6' },
    { value: 'delivery', title: 'Delivery', text: deliveryText, color: '#01AFEE', icon: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1' },
  ]
  const onKey = (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const next = value === 'pickup' ? 'delivery' : 'pickup'
    onChange(next)
    document.getElementById(`fulfil-${next}`)?.focus()
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Pickup or delivery" onKeyDown={onKey}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            id={`fulfil-${o.value}`}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className="press flex items-start gap-3.5 rounded-[20px] bg-field p-[18px] text-left text-fg"
            style={{ border: on ? `2px solid ${o.color}` : '1px solid var(--line)' }}
          >
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[13px] bg-card2" style={{ color: o.color }} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={o.icon} /></svg>
            </span>
            <span className="flex flex-col gap-1"><strong>{o.title}</strong><span className="text-sm text-mist">{o.text}</span></span>
          </button>
        )
      })}
    </div>
  )
}

function Summary({ quote, fulfilment, total }) {
  const fee = quote.delivery.deliveryFee
  return (
    <aside className="flex w-full flex-col gap-3.5 rounded-[22px] border border-line bg-card p-[18px] sm:rounded-[26px] sm:p-6 lg:sticky lg:top-24 lg:w-[380px] lg:shrink-0">
      <h2 className="m-0 font-display text-xl font-extrabold">Your order</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {quote.lines.map((l) => (
          <li key={l.id} className="flex items-center gap-3">
            <span className="relative size-12 shrink-0 rounded-xl bg-[#F2F4FA]">
              {l.image && <span className="absolute inset-0 overflow-hidden rounded-xl"><SmartImage image={l.image} sizes="48px" className="object-contain" /></span>}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-spark px-1 text-[11px] font-extrabold text-midnight">{l.qty}</span>
            </span>
            <span className="min-w-0 flex-1 text-sm leading-snug">{l.name}</span>
            <strong className="shrink-0 text-sm">{formatNaira(l.lineTotal)}</strong>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t border-line pt-3.5">
        <div className="flex justify-between"><span className="text-mist">Subtotal</span><span>{formatNaira(quote.subtotal)}</span></div>
        <div className="flex justify-between gap-4">
          <span className="text-mist">{fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</span>
          <span className="text-right">{fulfilment === 'pickup' ? 'Free' : fee == null ? 'Agreed after payment' : formatNaira(fee)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-xl">
          <strong>Total</strong>
          <strong className="font-display">{formatNaira(total)}</strong>
        </div>
      </div>
    </aside>
  )
}

export default function Checkout() {
  const { items } = useCart()
  const { data: quote, isPending, refetch } = useCartQuote(items)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [startedAt] = useState(() => Date.now())
  usePageMeta('Checkout')

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: null }))
  }

  const mutation = useMutation({
    mutationFn: (body) => apiPost('/checkout', body),
    onSuccess: ({ authorizationUrl }) => {
      // Off to Paystack's secure payment page. The cart is cleared once payment is confirmed.
      window.location.assign(authorizationUrl)
    },
    onError: (err) => {
      setErrors(fieldErrorsFrom(err))
      if (err.code === 'PRICE_CHANGED' || err.code === 'CART_CHANGED') refetch()
    },
  })

  if (items.length === 0 && !mutation.isSuccess) return <Navigate to="/cart" replace />

  const isDelivery = form.fulfilment === 'delivery'
  const fee = isDelivery ? (quote?.delivery.deliveryFee ?? 0) : 0
  const total = quote ? quote.subtotal + fee : 0

  const validate = () => {
    const e = {
      name: validators.required(form.name, 'Your name'),
      email: !form.email.trim() ? 'Your email is required for the receipt' : validators.email(form.email),
      phone: validators.phone(form.phone),
      address: isDelivery ? validators.required(form.address, 'The delivery address') : null,
      city: isDelivery ? validators.required(form.city, 'The town or city') : null,
      state: isDelivery && !form.state ? 'Choose the state' : null,
    }
    const clean = Object.fromEntries(Object.entries(e).filter(([, v]) => v))
    setErrors(clean)
    return Object.keys(clean).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!quote?.ok || mutation.isPending) return
    if (!validate()) {
      // Wait for the error messages to render, then move to the first one
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    mutation.mutate({ ...form, items, expectedTotal: total, startedAt })
  }

  const generalError = mutation.isError && !Object.keys(fieldErrorsFrom(mutation.error)).length ? mutation.error : null
  const paying = mutation.isPending || mutation.isSuccess

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-7 px-4 pb-24 pt-9 sm:px-7">
      <CheckoutSteps step={1} />
      <h1 className="m-0 font-display text-2xl font-extrabold sm:text-[34px]">Checkout</h1>

      {isPending ? (
        <div className="h-[480px] animate-pulse rounded-[26px] bg-card" aria-busy="true" />
      ) : !quote?.ok ? (
        <div className={card}>
          <p className="m-0">Some items in your cart need your attention before you can pay.</p>
          <Link to="/cart" className="press self-start rounded-full bg-fg px-6 py-3 font-bold text-bg hover:text-bg">Back to cart</Link>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-7 lg:flex-row">
          <form onSubmit={submit} noValidate className="relative flex w-full min-w-0 flex-col gap-[18px]">
            <section className={card}>
              <StepHeading n="1" bg="#FFE52E" ink="#0D1330">Your details</StepHeading>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Full name" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
                <TextInput label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
              </div>
              <TextInput label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} help="Your receipt is sent here." />
            </section>

            <section className={card}>
              <StepHeading n="2" bg="#01AFEE" ink="#0D1330">Pickup or delivery</StepHeading>
              <FulfilmentChoice value={form.fulfilment} onChange={set('fulfilment')} delivery={quote.delivery} />
              {!isDelivery ? (
                <p key="pickup" className="fade-up m-0 rounded-2xl bg-field px-4 py-3.5 text-mist" style={{ animationDuration: '.5s' }}>
                  {quote.delivery.pickupAddress
                    ? <>Collect from <strong className="whitespace-pre-line text-fg">{quote.delivery.pickupAddress}</strong>. We'll call you when it's ready.</>
                    : "We'll call you with the pickup address when your order is ready."}
                </p>
              ) : (
                <div key="delivery" className="fade-up flex flex-col gap-4" style={{ animationDuration: '.5s' }}>
                  {(quote.delivery.deliveryFee == null || quote.delivery.deliveryNote) && (
                    <p className="m-0 rounded-2xl bg-field px-4 py-3.5 text-mist">
                      {quote.delivery.deliveryFee == null && 'Delivery cost depends on your location. We will call you to agree it after payment; it is paid separately.'}
                      {quote.delivery.deliveryNote && ` ${quote.delivery.deliveryNote}`}
                    </p>
                  )}
                  <TextArea label="Delivery address" name="address" autoComplete="street-address" rows={2} value={form.address} onChange={set('address')} error={errors.address} maxLength={300} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput label="Town or city" name="city" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} maxLength={80} />
                    <Select label="State" name="state" value={form.state} onChange={set('state')} options={STATES} placeholder="Choose a state" error={errors.state} />
                  </div>
                </div>
              )}
            </section>

            <section className={card}>
              <StepHeading n="3" bg="#EB268F" ink="#FFFFFF">Notes for our team <span className="text-[15px] font-medium text-mist">(optional)</span></StepHeading>
              <TextArea label="Notes for our team" hideLabel name="notes" rows={3} value={form.notes} onChange={set('notes')} maxLength={1000} placeholder="For example: installation needed, best time to call" />
            </section>

            <Honeypot value={form.website} onChange={set('website')} />

            {generalError && (
              <p role="alert" className="m-0 rounded-2xl bg-[rgba(255,138,128,.12)] p-4 font-semibold text-bad">
                {generalError.message}
                {generalError.code === 'CART_CHANGED' && <> <Link to="/cart" className="text-bad underline">Review your cart</Link></>}
              </p>
            )}

            <button
              type="submit"
              disabled={paying}
              className="shine press flex items-center justify-center gap-2.5 rounded-full bg-action p-[18px] text-lg font-extrabold text-white disabled:cursor-wait disabled:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              {paying ? 'Taking you to Paystack…' : `Pay ${formatNaira(total)} with Paystack`}
            </button>
            <p className="m-0 text-sm leading-relaxed text-mist">
              You'll pay on Paystack's secure page (card, bank transfer or USSD), then come back here for your receipt.
              By paying you agree to our <Link to="/terms" className="text-fg underline">Terms of sale</Link> and{' '}
              <Link to="/returns" className="text-fg underline">Returns policy</Link>. See how we use your details in our{' '}
              <Link to="/privacy" className="text-fg underline">Privacy policy</Link>.
            </p>
            <Link to="/cart" className="flex items-center gap-2 self-start font-bold text-mist hover:text-fg"><span aria-hidden="true">←</span> Back to cart</Link>
          </form>

          <Summary quote={quote} fulfilment={form.fulfilment} total={total} />
        </div>
      )}
    </section>
  )
}
