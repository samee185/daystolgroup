import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import CheckoutSteps from '../components/shop/CheckoutSteps.jsx'
import { apiGet, apiPost, formatNaira } from '../lib/api.js'
import { useCart } from '../lib/cart.jsx'
import { telHref, useSettings, whatsappHref } from '../hooks/useSiteData.js'
import { usePageMeta } from '../hooks/usePageMeta.js'

const PAID = ['paid', 'processing', 'ready', 'out_for_delivery', 'completed']
const POLL_FOR_MS = 90_000 // bank transfers can take a minute or two to confirm

const dateFormat = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const card = 'flex flex-col gap-3 rounded-[22px] border border-line bg-card p-[18px] text-left sm:rounded-[26px] sm:p-[26px]'

function Receipt({ order, paid }) {
  return (
    <section className={card}>
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="m-0 font-display text-[19px] font-extrabold">{paid ? 'Receipt' : 'Order summary'}</h2>
        <span className="text-sm text-mist">{dateFormat.format(new Date(order.createdAt))}</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.items.map((i) => (
          <li key={i.name} className="flex justify-between gap-4">
            <span><strong>{i.qty} ×</strong> {i.name}</span>
            <span className="shrink-0">{formatNaira(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
        <div className="flex justify-between"><span className="text-mist">Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
        <div className="flex justify-between gap-4">
          <span className="text-mist">{order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</span>
          <span className="text-right">{order.fulfilment === 'pickup' ? 'Free' : order.deliveryFeeToConfirm ? 'To be agreed with you' : formatNaira(order.deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-lg"><strong>{paid ? 'Total paid' : 'Total'}</strong><strong>{formatNaira(order.total)}</strong></div>
      </div>
    </section>
  )
}

/** What happens after payment, ticked off as the order moves along. */
function NextSteps({ order }) {
  const delivery = order.fulfilment === 'delivery'
  const reached = { paid: 1, processing: 1, ready: 2, out_for_delivery: 2, completed: 3 }[order.status] || 1
  const steps = [
    { title: 'Payment confirmed', text: 'Your order is paid and reserved for you.' },
    { title: 'We call you', text: delivery ? 'Our team calls to arrange the delivery date and installation.' : 'Our team calls when your order is ready for pickup.' },
    { title: delivery ? 'Delivery and installation' : 'Pickup and installation', text: 'Daystol engineers can install it and set up a maintenance plan.' },
  ]
  return (
    <section className={`${card} gap-[18px]`}>
      <h2 className="m-0 font-display text-[19px] font-extrabold">What happens next</h2>
      <ol className="m-0 flex list-none flex-col p-0">
        {steps.map((s, i) => {
          const done = i < reached
          const now = i === reached
          return (
            <li key={s.title} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3.5">
              <span className="flex flex-col items-center">
                <span className={`flex size-[34px] items-center justify-center rounded-full text-sm font-extrabold ${done ? 'bg-[#157347] text-white' : now ? 'bg-spark text-midnight' : 'border-2 border-line text-mist'}`}>
                  {done ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : i + 1}
                </span>
                {i < steps.length - 1 && <span className="min-h-[22px] w-0.5 flex-1 bg-line" aria-hidden="true" />}
              </span>
              <span className="flex flex-col gap-1 pb-[18px]">
                <strong>{s.title}{done && <span className="sr-only"> (done)</span>}</strong>
                <span className="text-[15px] text-mist">{s.text}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="m-0 text-sm text-mist">Current status: <strong className="text-fg">{order.statusLabel}</strong></p>
    </section>
  )
}

function SuccessMark() {
  return (
    <div className="ring-in relative mt-2.5 size-[104px]" aria-hidden="true">
      <span className="burst" />
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#157347]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
    </div>
  )
}

function StatusMark({ tone }) {
  const bg = tone === 'wait' ? 'bg-spark text-midnight' : tone === 'warn' ? 'bg-card2 text-bad' : 'bg-card2 text-mist'
  return (
    <span className={`pop-in flex size-[84px] items-center justify-center rounded-full ${bg}`} aria-hidden="true">
      {tone === 'wait' ? (
        <svg className="spin-slow" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
      ) : (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 7v6M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>
      )}
    </span>
  )
}

export default function Order() {
  const { reference } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const fromPaystack = params.has('reference') || params.has('trxref')
  const { clear } = useCart()
  const { data: settings } = useSettings()
  const [pollingOver, setPollingOver] = useState(false)
  const cleared = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setPollingOver(true), POLL_FOR_MS)
    return () => clearTimeout(t)
  }, [])
  usePageMeta(`Order ${reference}`)

  const query = useQuery({
    queryKey: ['order', reference, token],
    queryFn: () => apiGet(`/orders/${reference}`, { token, check: '1' }),
    enabled: Boolean(token),
    retry: 1,
    refetchOnWindowFocus: false,
    // While payment is still being confirmed, check again every few seconds for a short while
    refetchInterval: (q) => (q.state.data?.status === 'pending_payment' && fromPaystack && !pollingOver ? 5000 : false),
  })
  const order = query.data
  const isPaid = order && PAID.includes(order.status)

  // Empty the cart once, after a confirmed payment
  useEffect(() => {
    if (isPaid && fromPaystack && !cleared.current) {
      cleared.current = true
      clear()
    }
  }, [isPaid, fromPaystack, clear])

  const retry = useMutation({
    mutationFn: () => apiPost(`/orders/${reference}/pay`, { token }),
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
  })

  const call = telHref(settings?.phone)
  const wa = whatsappHref(settings?.whatsappNumber, `Hello Daystol, I have a question about my order ${reference}.`)
  const stillChecking = order?.status === 'pending_payment' && fromPaystack && !pollingOver

  let mark = null
  let title = 'Your order'
  let lead = null
  let extra = null
  let step = 2

  if (!token || (query.isError && query.error?.status === 404)) {
    mark = <StatusMark tone="warn" />
    title = 'Order not found'
    lead = "This link isn't complete. Use the link in your order email, or contact us with your order number."
  } else if (query.isPending) {
    mark = <StatusMark tone="wait" />
    title = 'Checking your payment'
    extra = <div className="h-48 w-full animate-pulse rounded-[26px] bg-card" aria-busy="true" />
  } else if (query.isError) {
    mark = <StatusMark tone="warn" />
    title = 'Something went wrong'
    lead = "We couldn't load your order just now."
    extra = <button type="button" onClick={() => query.refetch()} className="press rounded-full bg-fg px-6 py-3 font-bold text-bg">Try again</button>
  } else if (isPaid) {
    step = 3
    mark = <SuccessMark />
    title = 'Payment received'
    lead = (
      <>
        Thank you, {order.firstName}. A receipt is on its way to {order.email}. Your order number is{' '}
        <strong className="whitespace-nowrap rounded-lg bg-card2 px-2.5 py-0.5 tracking-[.04em] text-at-power">{order.reference}</strong>
      </>
    )
    extra = (
      <>
        <NextSteps order={order} />
        <Receipt order={order} paid />
      </>
    )
  } else if (stillChecking) {
    mark = <StatusMark tone="wait" />
    title = 'Confirming your payment'
    lead = <span role="status">We're waiting for Paystack to confirm your payment. This page updates by itself, so please keep it open.</span>
    extra = <Receipt order={order} />
  } else if (order.status === 'pending_payment') {
    mark = <StatusMark tone="warn" />
    title = 'Payment not completed'
    lead = (
      <>
        We haven't received payment for this order yet. If you paid by bank transfer, it can take a few minutes:{' '}
        <button type="button" onClick={() => query.refetch()} className="p-0 font-bold text-fg underline">check again</button>.
      </>
    )
    extra = (
      <>
        <Receipt order={order} />
        {order.canRetryPayment ? (
          <button type="button" onClick={() => retry.mutate()} disabled={retry.isPending || retry.isSuccess} className="shine press self-center rounded-full bg-action px-8 py-4 font-extrabold text-white disabled:opacity-70">
            {retry.isPending || retry.isSuccess ? 'Taking you to Paystack…' : `Pay ${formatNaira(order.total)} now`}
          </button>
        ) : (
          <p className="m-0 text-center text-mist">This order has expired. <Link to="/cart" className="font-bold text-fg underline">Go to your cart</Link> to order again.</p>
        )}
        {retry.isError && <p role="alert" className="m-0 text-center font-semibold text-bad">{retry.error.message}</p>}
      </>
    )
  } else if (order.status === 'payment_review') {
    mark = <StatusMark tone="wait" />
    title = 'Payment being checked'
    lead = "We've received a payment for this order and our team is checking it. We'll contact you shortly."
    extra = <Receipt order={order} />
  } else {
    mark = <StatusMark tone="info" />
    title = 'Order cancelled'
    lead = 'This order has been cancelled. If you were charged, your refund is being processed.'
    extra = <Receipt order={order} />
  }

  return (
    <section className="mx-auto flex max-w-[1180px] flex-col gap-7 px-4 pb-24 pt-9 sm:px-7">
      <CheckoutSteps step={step} />

      <div className="fade-up flex flex-col items-center gap-[26px] text-center" style={{ animationDuration: '.55s' }}>
        {mark}
        <div className="flex flex-col items-center gap-2.5">
          <h1 className="m-0 font-display text-2xl font-extrabold sm:text-[34px]">{title}</h1>
          {lead && <p className="m-0 max-w-[46ch] text-base leading-relaxed text-mist sm:text-[17px]">{lead}</p>}
        </div>

        <div className="flex w-full max-w-[780px] flex-col gap-[18px]">
          {extra}
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="press rounded-full bg-fg px-6 py-[15px] font-extrabold text-bg hover:text-bg">Continue shopping</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="press flex items-center gap-2 rounded-full border border-line px-[22px] py-3.5 font-bold text-fg hover:text-fg">
                <span className="size-2.5 rounded-full bg-whatsapp" aria-hidden="true" />Questions? WhatsApp us
              </a>
            )}
          </div>
          <p className="m-0 text-center text-sm text-mist">
            Questions about this order? {call ? <a href={call} className="font-semibold text-fg underline">Call {settings.phone}</a> : <Link to="/contact" className="font-semibold text-fg underline">Contact us</Link>} and quote <strong className="text-fg">{reference}</strong>.
          </p>
        </div>
      </div>
    </section>
  )
}
