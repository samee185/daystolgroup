import crypto from 'node:crypto'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'

import { env } from '../config/env.js'
import { nextReference, Order } from '../models/index.js'
import {
  deliveryOptions, MAX_QTY, PAYMENT_WINDOW_MS, priceCart, settlePayment, toPublicOrder,
} from '../lib/orders.js'
import {
  initializeTransaction, PaystackError, paystackReady, validSignature, verifyTransaction,
} from '../lib/paystack.js'
import { asyncHandler, HttpError } from '../middleware/errors.js'
import { looksLikeBot } from '../middleware/spam.js'

const router = Router()

const objectId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid product')
const cartItems = z.array(z.object({ id: objectId, qty: z.coerce.number().int().min(1).max(MAX_QTY) })).min(1, 'Your cart is empty').max(30)

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many checkout attempts. Please wait a few minutes and try again.' },
})

const randomHex = (bytes) => crypto.randomBytes(bytes).toString('hex')

/** Start a Paystack payment for an order and remember the reference. */
async function startPayment(order) {
  const paystackRef = `${order.reference}-${randomHex(3)}`
  order.payment.attempts.push(paystackRef)
  await order.save()
  try {
    const tx = await initializeTransaction({
      email: order.customer.email,
      amountKobo: order.total * 100,
      reference: paystackRef,
      callbackUrl: `${env.PUBLIC_URL}/order/${order.reference}?token=${order.accessToken}`,
      metadata: {
        order_reference: order.reference,
        custom_fields: [
          { display_name: 'Order', variable_name: 'order', value: order.reference },
          { display_name: 'Customer', variable_name: 'customer', value: order.customer.name },
        ],
      },
    })
    return tx.authorization_url
  } catch (err) {
    console.error(`Paystack initialize failed for ${order.reference}: ${err.message}`)
    throw new HttpError(502, 'We could not reach our payment provider. Please try again in a moment.')
  }
}

// ---------- Cart: live prices and stock for what's in the browser's cart ----------

router.post('/cart/quote', asyncHandler(async (req, res) => {
  const { items } = z.object({ items: cartItems }).parse(req.body)
  const [cart, delivery] = await Promise.all([priceCart(items), deliveryOptions()])
  res.set('Cache-Control', 'no-store').json({ ...cart, delivery, paymentsEnabled: paystackReady })
}))

// ---------- Checkout: create the order, then send the customer to Paystack ----------

const requiredText = (max, label) => z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)

const checkoutSchema = z.object({
  items: cartItems,
  expectedTotal: z.coerce.number().int().min(0),
  name: requiredText(100, 'Your name'),
  email: z.string().trim().email('Enter a valid email address for your receipt').max(120),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
  fulfilment: z.enum(['pickup', 'delivery']),
  address: z.string().trim().max(300).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
}).superRefine((d, ctx) => {
  if (d.fulfilment !== 'delivery') return
  if (!d.address) ctx.addIssue({ code: 'custom', path: ['address'], message: 'Enter the delivery address' })
  if (!d.city) ctx.addIssue({ code: 'custom', path: ['city'], message: 'Enter the town or city' })
  if (!d.state) ctx.addIssue({ code: 'custom', path: ['state'], message: 'Choose the state' })
})

router.post('/checkout', checkoutLimiter, asyncHandler(async (req, res) => {
  if (looksLikeBot(req.body)) throw new HttpError(400, 'Please try again.')
  if (!paystackReady) {
    throw new HttpError(503, 'Online payment is not available yet. Please call us or order on WhatsApp.', { code: 'PAYMENTS_OFF' })
  }
  const data = checkoutSchema.parse(req.body)

  const [cart, delivery] = await Promise.all([priceCart(data.items), deliveryOptions()])
  if (!cart.ok) {
    throw new HttpError(409, 'Some items in your cart have changed. Please review your cart.', { code: 'CART_CHANGED' })
  }

  const isDelivery = data.fulfilment === 'delivery'
  const deliveryFee = isDelivery ? (delivery.deliveryFee ?? 0) : 0
  const total = cart.subtotal + deliveryFee

  // The customer must pay exactly what they were shown. If a price changed meanwhile, show them the new total first.
  if (total !== data.expectedTotal) {
    throw new HttpError(409, 'A price has changed since you opened your cart. Please check the new total.', { code: 'PRICE_CHANGED' })
  }

  const order = await Order.create({
    reference: await nextReference('order', 'OR'),
    items: cart.lines.map((l) => ({ product: l.id, name: l.name, sku: l.sku, unitPrice: l.unitPrice, qty: l.qty, lineTotal: l.lineTotal })),
    subtotal: cart.subtotal,
    deliveryFee,
    deliveryFeeToConfirm: isDelivery && delivery.deliveryFee == null,
    total,
    customer: { name: data.name, email: data.email, phone: data.phone },
    fulfilment: data.fulfilment,
    address: isDelivery ? { line: data.address, city: data.city, state: data.state } : undefined,
    customerNotes: data.notes || undefined,
    accessToken: randomHex(24),
  })

  const authorizationUrl = await startPayment(order)
  res.status(201).json({ reference: order.reference, authorizationUrl })
}))

// ---------- Order page: the customer lands here after paying ----------

const orderParams = z.object({ reference: z.string().regex(/^OR-\d{6,}$/, 'Invalid order') })
const tokenSchema = z.string().regex(/^[a-f0-9]{48}$/, 'Invalid link')

async function findOrder(req, token) {
  const { reference } = orderParams.parse(req.params)
  const order = await Order.findOne({ reference, accessToken: tokenSchema.parse(token) })
  if (!order) throw new HttpError(404, 'We could not find this order. Check the link in your email.')
  return order
}

router.get('/orders/:reference', asyncHandler(async (req, res) => {
  let order = await findOrder(req, req.query.token)

  // Still waiting? Ask Paystack directly, newest attempt first (the webhook may not have arrived yet).
  if (order.status === 'pending_payment' && paystackReady && req.query.check === '1') {
    for (const ref of [...order.payment.attempts].reverse().slice(0, 3)) {
      try {
        const tx = await verifyTransaction(ref)
        if (tx?.status === 'success') {
          order = (await settlePayment(tx)) || order
          break
        }
      } catch (err) {
        // "Transaction reference not found" just means the customer never finished that attempt
        if (!(err instanceof PaystackError) || err.status >= 500 || err.status === 0) console.error(`Paystack verify ${ref}: ${err.message}`)
      }
    }
  }

  res.set('Cache-Control', 'no-store').json(toPublicOrder(order))
}))

/** Try paying again (closed the Paystack page, card declined...). Prices stay as they were when the order was placed. */
router.post('/orders/:reference/pay', checkoutLimiter, asyncHandler(async (req, res) => {
  const order = await findOrder(req, req.body?.token)
  if (order.status !== 'pending_payment') throw new HttpError(409, 'This order is already paid or closed.')
  if (Date.now() - order.createdAt.getTime() > PAYMENT_WINDOW_MS) {
    throw new HttpError(410, 'This order has expired. Please add the items to your cart again.', { code: 'EXPIRED' })
  }
  if (!paystackReady) throw new HttpError(503, 'Online payment is not available right now. Please call us.')
  res.json({ authorizationUrl: await startPayment(order) })
}))

export default router

/**
 * Paystack webhook. Mounted in index.js before the JSON parser, because the signature
 * is checked against the exact bytes Paystack sent.
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')
  if (!validSignature(raw, req.get('x-paystack-signature'))) return res.sendStatus(401)

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return res.sendStatus(400)
  }

  if (event.event === 'charge.success' && event.data?.reference) {
    // Never trust the webhook body alone: confirm the payment with Paystack before marking anything paid.
    const tx = await verifyTransaction(event.data.reference)
    await settlePayment(tx)
  }
  res.sendStatus(200)
})
