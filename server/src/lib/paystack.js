import crypto from 'node:crypto'
import { env } from '../config/env.js'

/**
 * Small Paystack client: start a payment, check a payment, and check that a webhook really came from Paystack.
 * Amounts sent to Paystack are in kobo (naira x 100).
 */

const API = 'https://api.paystack.co'

export const paystackReady = Boolean(env.PAYSTACK_SECRET_KEY)
if (!paystackReady) console.warn('Paystack is not set up (PAYSTACK_SECRET_KEY in server/.env). Online checkout is switched off.')

export class PaystackError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function call(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    throw new PaystackError(`Could not reach Paystack: ${err.message}`, 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status === false) throw new PaystackError(data.message || `Paystack error ${res.status}`, res.status)
  return data.data
}

/** Start a payment. Returns { authorization_url, access_code, reference }. */
export const initializeTransaction = ({ email, amountKobo, reference, callbackUrl, metadata }) =>
  call('/transaction/initialize', {
    method: 'POST',
    body: { email, amount: String(amountKobo), currency: 'NGN', reference, callback_url: callbackUrl, metadata },
  })

/** Ask Paystack what happened to a payment. Returns the transaction (status, amount, currency, paid_at, channel...). */
export const verifyTransaction = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`)

/** Webhooks are signed with HMAC-SHA512 of the raw body, using the secret key. */
export function validSignature(rawBody, signature) {
  if (!paystackReady || !signature) return false
  const expected = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
