import React, { useEffect, useState } from 'react'
import {
  Badge, Icon, LoadError, ORDER_TONE, ROOT, callAction, formatDateTime, naira, recordUrl, resourceUrl, useLoad, useToast, waNumber,
} from './ui.jsx'

/** The steps an order passes through. The fourth depends on pickup or delivery. */
function steps(order) {
  const fourth = order.fulfilment === 'delivery' ? { id: 'out_for_delivery', label: 'Out for delivery' } : { id: 'ready', label: 'Ready for pickup' }
  return [{ id: 'pending_payment', label: 'Placed' }, { id: 'paid', label: 'Paid' }, { id: 'processing', label: 'Processing' }, fourth, { id: 'completed', label: 'Completed' }]
}

function Timeline({ order }) {
  const list = steps(order)
  const at = order.status === 'payment_review' ? 0 : list.findIndex((s) => s.id === order.status)
  const cancelled = order.status === 'cancelled'
  return (
    <section className="dz-card" aria-label="Order progress">
      <ol className="dz-progress">
        {list.map((s, i) => {
          const done = !cancelled && i <= at
          const now = !cancelled && i === at
          return (
            <li key={s.id} className={done ? 'dz-done' : ''} aria-current={now ? 'step' : undefined}>
              <span className="dz-progress-bar" style={{ background: done ? (now && i < list.length - 1 ? '#D4157A' : '#3DDC84') : undefined }} />
              <span className="dz-row dz-gap-8">
                <span className={`dz-step-mark ${done ? 'dz-step-done' : ''}`} aria-hidden="true">{done ? <Icon name="check" size={14} stroke={3} /> : i + 1}</span>
                <span className="dz-step-label">{s.label}</span>
              </span>
            </li>
          )
        })}
      </ol>
      {order.status === 'payment_review' && <p className="dz-small dz-text-bad dz-m0 dz-mt-12">A payment came in that didn't match this order. Check it in your Paystack dashboard before doing anything else.</p>}
      {order.status === 'pending_payment' && <p className="dz-small dz-muted dz-m0 dz-mt-12">The customer hasn't paid yet. Unpaid orders expire after 24 hours.</p>}
    </section>
  )
}

function Row({ label, children, strong }) {
  return (
    <div className="dz-kv">
      <span className="dz-muted">{label}</span>
      {strong ? <strong>{children}</strong> : <span>{children}</span>}
    </div>
  )
}

/** Custom order page: progress, one-click next step, customer contact buttons, notes and a printable receipt. */
export default function OrderShow({ record }) {
  const id = record?.id
  const [toast, notify] = useToast()
  const [busy, setBusy] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [note, setNote] = useState('')
  const { data, error, loading, reload, setData } = useLoad(
    () => callAction({ resource: 'Order', record: id, action: 'orderDetails', method: 'get' }),
    [id],
  )
  const order = data?.order
  const canEdit = data?.canEdit

  useEffect(() => {
    if (order) setNote(order.staffNotes || '')
  }, [order?.id, order?.staffNotes])

  if (error) return <div className="dz dz-page"><LoadError error={error} onRetry={reload} /></div>
  if (loading && !order) return <div className="dz dz-page" aria-busy="true"><div className="dz-skel" style={{ height: 60, width: 340 }} /><div className="dz-skel" style={{ height: 90 }} /><div className="dz-skel" style={{ height: 320 }} /></div>
  if (!order) return <div className="dz dz-page"><LoadError error={{ message: 'Order not found.' }} /></div>

  const run = async (name, fn) => {
    setBusy(name)
    try {
      await fn()
    } catch (err) {
      notify(err.message, 'bad')
    } finally {
      setBusy('')
    }
  }

  const advance = () => run('advance', async () => {
    const res = await callAction({ resource: 'Order', record: id, action: 'advanceStatus', data: { from: order.status } })
    if (res.order) setData((d) => ({ ...d, order: res.order }))
    notify(res.error || res.notice, res.error ? 'warn' : 'ok')
  })

  const cancel = () => run('cancel', async () => {
    const res = await callAction({ resource: 'Order', record: id, action: 'cancelOrder' })
    setConfirmCancel(false)
    notify(res.notice?.message || 'Order cancelled.', res.notice?.type === 'error' ? 'bad' : 'ok')
    reload()
  })

  const saveNote = () => run('note', async () => {
    const res = await callAction({ resource: 'Order', record: id, action: 'saveOrderNote', data: { staffNotes: note } })
    if (res.order) setData((d) => ({ ...d, order: res.order }))
    notify(res.notice || 'Note saved.')
  })

  const c = order.customer || {}
  const wa = waNumber(c.phone)
  const tone = order.stockShortfall && ['paid', 'processing'].includes(order.status) ? 'bad' : ORDER_TONE[order.status]
  const paid = Boolean(order.payment?.paidAt)
  const cancelled = order.status === 'cancelled'
  const noteChanged = note !== (order.staffNotes || '')

  return (
    <div className="dz dz-page dz-print">
      {toast}
      <nav aria-label="Breadcrumb" className="dz-crumbs dz-noprint">
        <a href={ROOT}>Dashboard</a><span aria-hidden="true">/</span>
        <a href={resourceUrl('Order')}>Orders</a><span aria-hidden="true">/</span>
        <span aria-current="page">{order.reference}</span>
      </nav>

      <div className="dz-page-head">
        <span className="dz-row dz-wrap dz-gap-12">
          <h1 className="dz-display dz-h1">Order {order.reference}</h1>
          <span key={order.status} className="dz-pop"><Badge tone={tone}>{order.stockShortfall && tone === 'bad' ? 'Check stock' : order.statusLabel}</Badge></span>
        </span>
        <span className="dz-row dz-wrap dz-gap-8 dz-noprint">
          {canEdit && order.next && (
            <button type="button" className="dz-btn dz-btn-primary" onClick={advance} disabled={Boolean(busy)}>
              {busy === 'advance' ? 'Saving…' : order.next.label}
            </button>
          )}
          <button type="button" className="dz-btn dz-btn-ghost" onClick={() => window.print()}><Icon name="print" size={16} />Print receipt</button>
          {canEdit && !cancelled && order.status !== 'completed' && (
            confirmCancel ? (
              <span className="dz-confirm" role="group" aria-label="Confirm cancelling">
                <span className="dz-small">Cancel and put items back in stock?</span>
                <button type="button" className="dz-btn dz-btn-danger" onClick={cancel} disabled={Boolean(busy)}>{busy === 'cancel' ? 'Cancelling…' : 'Yes, cancel'}</button>
                <button type="button" className="dz-btn dz-btn-ghost" onClick={() => setConfirmCancel(false)}>Keep order</button>
              </span>
            ) : (
              <button type="button" className="dz-btn dz-btn-danger-ghost" onClick={() => setConfirmCancel(true)}>Cancel order</button>
            )
          )}
        </span>
      </div>

      {cancelled && (
        <div className="dz-banner dz-mute" role="status">
          Order cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ''}. Items taken from stock were put back.{paid ? ' If you have not refunded the customer yet, do it from your Paystack dashboard.' : ''}
        </div>
      )}
      {order.stockShortfall && !cancelled && (
        <div className="dz-banner dz-bad" role="alert">An item sold out before this payment came in. Call the customer before processing: offer a wait, a swap or a refund.</div>
      )}
      {order.deliveryFeeToConfirm && order.fulfilment === 'delivery' && !cancelled && (
        <div className="dz-banner dz-warn">No flat delivery fee was set, so agree the delivery cost with the customer.</div>
      )}

      <Timeline order={order} />

      <div className="dz-order-grid">
        <div className="dz-stack dz-gap-16">
          <section className="dz-card dz-stack dz-gap-12" aria-labelledby="dz-items">
            <strong id="dz-items">Items</strong>
            {order.items.map((i) => (
              <div key={`${i.product}-${i.name}`} className="dz-item">
                <span className="dz-item-thumb" aria-hidden="true"><Icon name="box" /></span>
                <span className="dz-stack dz-min0">
                  <a href={recordUrl('Product', i.product, 'edit')} className="dz-noprint-link"><strong>{i.name}</strong></a>
                  <span className="dz-muted dz-small">
                    {i.qty} × {naira(i.unitPrice)}{i.sku ? ` · ${i.sku}` : ''}
                    {paid && <> · <span className={i.stockDeducted ? 'dz-text-ok' : 'dz-text-bad'}>{i.stockDeducted ? 'Taken from stock' : 'Not taken from stock'}</span></>}
                  </span>
                </span>
                <strong>{naira(i.lineTotal)}</strong>
              </div>
            ))}
            <div className="dz-totals">
              <Row label="Subtotal">{naira(order.subtotal)}</Row>
              <Row label={order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}>
                {order.fulfilment === 'pickup' ? 'Free' : order.deliveryFeeToConfirm ? 'To be agreed' : naira(order.deliveryFee)}
              </Row>
              <div className="dz-kv dz-kv-total"><strong>{paid ? 'Total paid' : 'Total'}</strong><strong className="dz-display">{naira(order.total)}</strong></div>
            </div>
          </section>

          <section className="dz-card dz-stack dz-gap-10 dz-noprint">
            <label htmlFor="dz-notes"><strong>Staff notes</strong> <span className="dz-muted dz-small">(customers never see these)</span></label>
            <textarea id="dz-notes" className="dz-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={!canEdit} placeholder="For example: called customer, delivery booked for Friday" maxLength={5000} />
            {canEdit && (
              <button type="button" className="dz-btn dz-btn-ghost dz-self-start" onClick={saveNote} disabled={!noteChanged || Boolean(busy)}>
                {busy === 'note' ? 'Saving…' : 'Save note'}
              </button>
            )}
          </section>
        </div>

        <div className="dz-stack dz-gap-16">
          <section className="dz-card dz-stack dz-gap-10" aria-labelledby="dz-customer">
            <strong id="dz-customer">Customer</strong>
            <span className="dz-stack">
              <strong>{c.name}</strong>
              <span className="dz-muted dz-small dz-break">{[c.phone, c.email].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="dz-row dz-wrap dz-gap-8 dz-noprint">
              {c.phone && <a href={`tel:${c.phone.replace(/[^+\d]/g, '')}`} className="dz-chip-btn"><Icon name="phone" size={15} />Call</a>}
              {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${(c.name || '').split(' ')[0]}, this is Daystol about your order ${order.reference}.`)}`} target="_blank" rel="noopener noreferrer" className="dz-chip-btn dz-chip-wa"><span className="dz-wa-dot" />WhatsApp</a>}
              {c.email && <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your Daystol order ${order.reference}`)}`} className="dz-chip-btn"><Icon name="mail" size={15} />Email</a>}
            </span>
          </section>

          <section className="dz-card dz-stack dz-gap-8" aria-labelledby="dz-delivery">
            <strong id="dz-delivery">{order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</strong>
            {order.fulfilment === 'delivery' ? (
              <span className="dz-stack">
                <span className="dz-muted dz-small">Deliver to</span>
                <span>{order.address?.line}</span>
                <span>{[order.address?.city, order.address?.state].filter(Boolean).join(', ')}</span>
              </span>
            ) : <span className="dz-muted">Customer collects from the office.</span>}
            {order.customerNotes && <span className="dz-quote">Customer note: “{order.customerNotes}”</span>}
          </section>

          <section className="dz-card dz-stack dz-gap-4" aria-labelledby="dz-payment">
            <strong id="dz-payment" className="dz-mb-6">Payment</strong>
            <Row label="Method">Paystack{order.payment?.channel ? ` · ${order.payment.channel.replace(/_/g, ' ')}` : ''}</Row>
            {order.payment?.reference && <Row label="Reference"><span className="dz-break">{order.payment.reference}</span></Row>}
            {order.payment?.amountPaid != null && <Row label="Amount paid">{naira(order.payment.amountPaid)}</Row>}
            <Row label="Paid at">{paid ? formatDateTime(order.payment.paidAt) : 'Not paid yet'}</Row>
            <Row label="Placed">{formatDateTime(order.createdAt)}</Row>
          </section>
        </div>
      </div>
    </div>
  )
}
