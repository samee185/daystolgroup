import { InventoryLog, Order, ORDER_STATUSES, Product, SiteSettings } from '../models/index.js'
import { canBuyOnline, currentPrice, isSaleActive } from './pricing.js'
import { imagesFor } from './images.js'
import { confirmCustomer, notifyStaff } from './mailer.js'

export const MAX_QTY = 20 // per product in one order

export const naira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

/**
 * Price a cart from the database. The browser only ever sends product ids and quantities;
 * names, prices and availability always come from here.
 */
export async function priceCart(items, now = new Date()) {
  const wanted = new Map()
  for (const { id, qty } of items) wanted.set(id, Math.min(MAX_QTY, (wanted.get(id) || 0) + qty))

  const products = await Product.find({ _id: { $in: [...wanted.keys()] }, published: true })
    .select('name slug sku imageKeys price sale quoteOnly stockQty lowStockThreshold availableOnOrder category')
    .populate('category', 'name')
    .lean()
  const byId = new Map(products.map((p) => [String(p._id), p]))

  const lines = []
  let subtotal = 0
  for (const [id, qty] of wanted) {
    const p = byId.get(id)
    if (!p) {
      lines.push({ id, qty, name: null, problem: 'unavailable', message: 'This product is no longer available.' })
      continue
    }
    let problem = null
    let message = null
    if (p.quoteOnly) {
      problem = 'quote_only'
      message = 'This product is sold by quote. Request a quote instead.'
    } else if (!canBuyOnline(p)) {
      problem = 'out_of_stock'
      message = p.availableOnOrder ? 'Out of stock. Contact us to order it.' : 'Out of stock.'
    } else if (p.stockQty < qty) {
      problem = 'not_enough'
      message = `Only ${p.stockQty} available. Lower the quantity to continue.`
    }
    const unitPrice = currentPrice(p, now)
    const lineTotal = problem ? 0 : unitPrice * qty
    subtotal += lineTotal
    lines.push({
      id,
      slug: p.slug,
      name: p.name,
      category: p.category?.name || null,
      sku: p.sku || null,
      image: imagesFor(p.imageKeys, p.name)[0] || null,
      unitPrice,
      regularPrice: p.quoteOnly ? null : p.price,
      onSale: isSaleActive(p, now),
      qty,
      maxQty: Math.max(1, Math.min(MAX_QTY, p.stockQty || 0)),
      lineTotal,
      problem,
      message,
    })
  }

  return { lines, subtotal, ok: lines.length > 0 && lines.every((l) => !l.problem) }
}

/** Delivery and pickup details from Site Settings. A blank delivery fee means staff agree it with the customer. */
export async function deliveryOptions() {
  const s = await SiteSettings.findOne().select('pickupAddress address deliveryArea deliveryFee deliveryNote').lean()
  return {
    pickupAddress: s?.pickupAddress || s?.address || null,
    deliveryArea: s?.deliveryArea || null,
    deliveryFee: s?.deliveryFee ?? null,
    deliveryNote: s?.deliveryNote || null,
  }
}

export const statusLabel = (value) => ORDER_STATUSES.find((s) => s.value === value)?.label || value

export const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000

/** What the customer may see on their order page. */
export function toPublicOrder(o) {
  return {
    reference: o.reference,
    status: o.status,
    statusLabel: statusLabel(o.status),
    createdAt: o.createdAt,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    deliveryFeeToConfirm: o.deliveryFeeToConfirm,
    total: o.total,
    fulfilment: o.fulfilment,
    firstName: o.customer.name.split(/\s+/)[0],
    email: o.customer.email,
    canRetryPayment: o.status === 'pending_payment' && Date.now() - new Date(o.createdAt).getTime() < PAYMENT_WINDOW_MS,
  }
}

const itemRows = (order) => order.items.map((i) => [`${i.qty} × ${i.name}`, naira(i.lineTotal)])

function totalRows(order) {
  const rows = [['Subtotal', naira(order.subtotal)]]
  if (order.fulfilment === 'delivery') {
    rows.push(['Delivery', order.deliveryFeeToConfirm ? 'To be agreed with you' : naira(order.deliveryFee)])
  } else {
    rows.push(['Collection', 'Pickup from our office'])
  }
  rows.push(['Total paid', naira(order.total)])
  return rows
}

const addressText = (order) =>
  order.fulfilment === 'delivery' ? [order.address?.line, order.address?.city, order.address?.state].filter(Boolean).join(', ') : 'Pickup'

async function sendPaidEmails(order, lowStock) {
  const shortfallNote = order.stockShortfall
    ? 'WARNING: some items sold out before this payment came through. Contact the customer before processing.'
    : null
  await notifyStaff({
    subject: `${order.stockShortfall ? 'CHECK STOCK: ' : ''}New paid order ${order.reference}: ${naira(order.total)}`,
    replyTo: order.customer.email,
    heading: `New paid order ${order.reference}`,
    intro: shortfallNote,
    rows: [
      ...itemRows(order),
      ...totalRows(order),
      ['Customer', order.customer.name],
      ['Phone', order.customer.phone],
      ['Email', order.customer.email],
      ['Deliver to', addressText(order)],
      ['Notes', order.customerNotes],
      ['Paystack reference', order.payment.reference],
      ...lowStock.map((p) => ['Low stock', `${p.name}: ${p.stockAfter} left`]),
    ],
    note: 'Open Shop → Orders in the admin to update its status.',
  })
  await confirmCustomer({
    to: order.customer.email,
    subject: `Order ${order.reference} confirmed`,
    heading: `Thank you for your order, ${order.customer.name.split(/\s+/)[0]}`,
    intro: order.fulfilment === 'delivery'
      ? 'We have received your payment. Our team will call you to arrange delivery and installation.'
      : 'We have received your payment. Our team will call you when your order is ready for pickup.',
    rows: [['Order', order.reference], ...itemRows(order), ...totalRows(order)],
    note: 'Keep this email as your receipt. Questions? Reply to this email or call us, quoting your order number.',
  })
}

/**
 * Record a successful Paystack payment. Safe to call more than once for the same payment
 * (the return from Paystack and the webhook can arrive together): only the first call does anything.
 */
export async function settlePayment(tx) {
  if (!tx || tx.status !== 'success') return null
  const order = await Order.findOne({ 'payment.attempts': tx.reference })
  if (!order) {
    console.warn(`Paystack payment ${tx.reference} does not match any order.`)
    return null
  }
  if (order.status !== 'pending_payment') return order

  const payment = {
    'payment.reference': tx.reference,
    'payment.channel': tx.channel,
    'payment.amountPaid': Number(tx.amount) / 100,
    'payment.paidAt': tx.paid_at ? new Date(tx.paid_at) : new Date(),
  }

  // The amount must match exactly. Anything else is held for a person to check.
  const amountOk = Number(tx.amount) === order.total * 100 && (!tx.currency || tx.currency === 'NGN')
  if (!amountOk) {
    const held = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending_payment' },
      { $set: { status: 'payment_review', ...payment } },
      { new: true },
    )
    if (held) {
      notifyStaff({
        subject: `Payment needs checking: order ${held.reference}`,
        heading: 'Payment amount does not match the order',
        rows: [['Order', held.reference], ['Order total', naira(held.total)], ['Paid', naira(Number(tx.amount) / 100)], ['Paystack reference', tx.reference]],
        note: 'Check this payment in your Paystack dashboard before processing the order.',
      }).catch((err) => console.error(`Notification failed: ${err.message}`))
    }
    return held || Order.findById(order._id)
  }

  // Claim the order. If another request got here first, it has already done the rest.
  const paid = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending_payment' },
    { $set: { status: 'paid', ...payment } },
    { new: true },
  )
  if (!paid) return Order.findById(order._id)

  // Take the items out of stock. The condition stops stock going below zero if two people bought the last unit.
  const lowStock = []
  for (const item of paid.items) {
    const { modifiedCount } = await Product.updateOne(
      { _id: item.product, stockQty: { $gte: item.qty } },
      { $inc: { stockQty: -item.qty } },
    )
    if (!modifiedCount) {
      paid.stockShortfall = true
      continue
    }
    item.stockDeducted = true
    const after = await Product.findById(item.product).select('stockQty lowStockThreshold').lean()
    await InventoryLog.create({
      product: item.product, productName: item.name, change: -item.qty, stockAfter: after?.stockQty, reason: 'sale', order: paid.reference,
    })
    if (after && after.stockQty <= (after.lowStockThreshold ?? 3)) lowStock.push({ name: item.name, stockAfter: after.stockQty })
  }
  await paid.save()

  sendPaidEmails(paid, lowStock).catch((err) => console.error(`Order emails failed: ${err.message}`))
  return paid
}

/** Put a cancelled order's items back in stock. Used by the "Cancel order" button in the admin. */
export async function cancelOrder(orderId, staffEmail) {
  const order = await Order.findById(orderId)
  if (!order) return { order: null, restocked: false }
  if (order.status === 'cancelled') return { order, restocked: false }

  const wasPaid = Boolean(order.payment?.paidAt)
  let restocked = false
  for (const item of order.items) {
    if (!item.stockDeducted) continue
    await Product.updateOne({ _id: item.product }, { $inc: { stockQty: item.qty } })
    const after = await Product.findById(item.product).select('stockQty').lean()
    await InventoryLog.create({
      product: item.product, productName: item.name, change: item.qty, stockAfter: after?.stockQty, reason: 'cancellation', order: order.reference, by: staffEmail,
    })
    item.stockDeducted = false
    restocked = true
  }
  order.status = 'cancelled'
  order.cancelledAt = new Date()
  await order.save()
  return { order, restocked, wasPaid }
}
