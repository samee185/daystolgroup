import React, { useEffect, useState } from 'react'

/* Shared pieces for the custom admin screens. Styles live in server/admin-ui/admin.css (classes start with "dz-"). */

export const ROOT = '/admin'

export const naira = (n) => (n == null || Number.isNaN(Number(n)) ? '' : `₦${Number(n).toLocaleString('en-NG')}`)

export const resourceUrl = (resource, query = '') => `${ROOT}/resources/${resource}${query}`
export const recordUrl = (resource, id, action = 'show') => `${ROOT}/resources/${resource}/records/${id}/${action}`
export const newUrl = (resource) => `${ROOT}/resources/${resource}/actions/new`

const dateTime = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' })
export const formatDateTime = (d) => (d ? dateTime.format(new Date(d)) : '')

/** "12 min ago", "Yesterday", "3 Oct" */
export function timeAgo(d) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const days = Math.round(h / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' })
}

/**
 * Call one of the admin actions in src/admin/custom-actions.js.
 * JSON goes in a "data" field so photos can be sent in the same request.
 */
export async function callAction({ resource, record, action, data, files = [], method = 'post' }) {
  const url = record
    ? `${ROOT}/api/resources/${resource}/records/${record}/${action}`
    : `${ROOT}/api/resources/${resource}/actions/${action}`
  const options = { credentials: 'same-origin', headers: { Accept: 'application/json' } }
  if (method === 'get') {
    options.method = 'GET'
  } else {
    const form = new FormData()
    form.append('data', JSON.stringify(data || {}))
    files.forEach((file, i) => form.append(`newPhotos.${i}`, file))
    options.method = 'POST'
    options.body = form
  }
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('No connection. Check your internet and try again.')
  }
  if (res.redirected || res.status === 401) {
    throw new Error('Your session has ended. Reload the page and log in again.')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json) {
    throw new Error(json?.notice?.message || json?.message || 'Something went wrong. Try again.')
  }
  return json
}

export async function getJson(path) {
  const res = await fetch(`${ROOT}${path}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
  if (res.redirected || res.status === 401) throw new Error('Your session has ended. Reload the page and log in again.')
  if (!res.ok) throw new Error('Could not load this page. Try again.')
  return res.json()
}

/** Run a loader on mount; returns { data, error, loading, reload, setData }. */
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    loader()
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState((s) => ({ ...s, error, loading: false })))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, deps)
  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) }
}

const PATHS = {
  money: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  box: 'M6 3h12l2 5H4zM4 8v12h16V8',
  alert: 'M12 3l9 16H3zM12 10v4M12 17.5v.5',
  chat: 'M4 5h16v11H8l-4 4z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  stock: 'M4 19V9M10 19V5M16 19v-7M22 19H2',
  info: 'M12 8v4M12 16h.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  print: 'M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  arrowL: 'M15 5l-7 7 7 7',
  arrowR: 'M9 5l7 7-7 7',
  x: 'M6 6l12 12M18 6L6 18',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
}

export function Icon({ name, size = 18, stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || PATHS.info} />
    </svg>
  )
}

/** Coloured status pill. tone: ok, warn, bad, info, mute */
export function Badge({ tone = 'mute', children }) {
  return <span className={`dz-badge dz-${tone}`}><span className="dz-dot" />{children}</span>
}

export const ORDER_TONE = {
  pending_payment: 'mute', paid: 'warn', processing: 'info', ready: 'info', out_for_delivery: 'info',
  completed: 'ok', cancelled: 'mute', payment_review: 'bad',
}

/** Stock text and tone, matching what the website shows. */
export function stockInfo(qty, threshold = 3, onOrder = false) {
  if (qty > threshold) return { text: 'In stock', tone: 'ok', kind: 'in' }
  if (qty > 0) return { text: `Only ${qty} left`, tone: 'warn', kind: 'low' }
  return onOrder ? { text: 'Available on order', tone: 'info', kind: 'out' } : { text: 'Out of stock', tone: 'bad', kind: 'out' }
}

/** On/off switch with a proper role and label. */
export function Switch({ on, onChange, label, color = '#3DDC84', disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="dz-switch"
      style={{ background: on ? color : undefined }}
    >
      <span className="dz-knob" />
    </button>
  )
}

/** Shown when a screen can't load. */
export function LoadError({ error, onRetry }) {
  return (
    <div className="dz-card dz-error-box" role="alert">
      <strong>{error?.message || 'Something went wrong.'}</strong>
      {onRetry && <button type="button" className="dz-btn dz-btn-ghost" onClick={onRetry}>Try again</button>}
    </div>
  )
}

/** Short-lived message at the top of a screen. */
export function useToast() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), toast.tone === 'bad' ? 8000 : 4500)
    return () => clearTimeout(t)
  }, [toast])
  const view = toast ? (
    <div className={`dz-toast dz-${toast.tone || 'ok'}`} role={toast.tone === 'bad' ? 'alert' : 'status'}>{toast.text}</div>
  ) : null
  return [view, (text, tone = 'ok') => setToast({ text, tone, at: Date.now() })]
}

/** Nigerian numbers as wa.me digits: 0803… becomes 234803… */
export function waNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  return digits
}
