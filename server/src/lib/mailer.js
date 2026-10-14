import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { SiteSettings } from '../models/index.js'

const looksLikeEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Sender: MAIL_FROM, or the SMTP login when that login is an email address (Hostinger).
// Providers like Resend use a plain username ("resend"), so MAIL_FROM is required there.
const sender = env.MAIL_FROM || (looksLikeEmail(env.SMTP_USER) ? env.SMTP_USER : null)

export const mailReady = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && sender)

const transport = mailReady
  ? nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
  : null

if (!mailReady) {
  console.warn(env.SMTP_HOST && !sender
    ? 'Email is not set up: add MAIL_FROM to server/.env (for example MAIL_FROM="Daystol Group <onboarding@resend.dev>"). Forms still save to the admin inbox.'
    : 'Email is not set up (SMTP_* in server/.env). Forms still save to the admin inbox.')
}

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** Simple branded email: a heading, label/value rows and an optional closing note. */
export function renderEmail({ heading, intro, rows = [], note }) {
  const rowHtml = rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#4A5375;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 0;color:#0D1330;white-space:pre-line">${escapeHtml(value)}</td></tr>`)
    .join('')
  const html = `<!doctype html><html><body style="margin:0;background:#F2F4FA;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="height:6px;background:linear-gradient(90deg,#01AFEE 0 33%,#EB268F 33% 66%,#FFE52E 66%)"></div>
    <div style="background:#ffffff;padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px;color:#0D1330">${escapeHtml(heading)}</h1>
      ${intro ? `<p style="margin:0 0 16px;color:#0D1330;line-height:1.5">${escapeHtml(intro)}</p>` : ''}
      ${rowHtml ? `<table style="border-collapse:collapse;font-size:15px">${rowHtml}</table>` : ''}
      ${note ? `<p style="margin:20px 0 0;color:#4A5375;line-height:1.5">${escapeHtml(note)}</p>` : ''}
    </div>
    <p style="color:#4A5375;font-size:12px;text-align:center">Daystol Group Ltd., RC 9511880</p>
  </div></body></html>`
  const text = [heading, intro, ...rows.filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`), note].filter(Boolean).join('\n\n')
  return { html, text }
}

async function send(message) {
  if (!transport) return
  try {
    await transport.sendMail({ from: sender, ...message })
  } catch (err) {
    // Never fail a customer's submission because email is down; the record is already saved.
    console.error(`Email to ${message.to} failed: ${err.message}`)
  }
}

/** Alert the Daystol team (the "notification email" in Site Settings). */
export async function notifyStaff({ subject, replyTo, ...content }) {
  const settings = await SiteSettings.findOne().select('notificationEmail').lean()
  const to = settings?.notificationEmail || (looksLikeEmail(env.SMTP_USER) ? env.SMTP_USER : null)
  if (!to) {
    if (transport) console.warn('Staff alert not sent: set "Notification email" in Admin → Site settings.')
    return
  }
  await send({ to, subject, replyTo, ...renderEmail(content) })
}

/** Confirmation to the customer, when they gave an email address. */
export async function confirmCustomer({ to, subject, ...content }) {
  if (!to) return
  await send({ to, subject, ...renderEmail(content) })
}
