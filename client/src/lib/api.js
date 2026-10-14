export class ApiError extends Error {
  constructor(status, message, details, code) {
    super(message)
    this.status = status
    this.details = details // field errors from the server: [{ field, message }]
    this.code = code // machine-readable reason, e.g. PRICE_CHANGED
  }
}

async function handle(res) {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error || `Request failed (${res.status})`, body.details, body.code)
  return body
}

/** GET a JSON endpoint from the Express API. Same origin, so no CORS setup is needed. */
export async function apiGet(path, params) {
  const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''))}` : ''
  const res = await fetch(`/api${path}${query}`, { headers: { Accept: 'application/json' } })
  return handle(res)
}

/** POST JSON. */
export async function apiPost(path, body) {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  return handle(res)
}

/** POST a form with files (multipart). The browser sets the content type itself. */
export async function apiPostForm(path, formData) {
  const res = await fetch(`/api${path}`, { method: 'POST', body: formData, headers: { Accept: 'application/json' } })
  return handle(res)
}

export const formatNaira = (amount) =>
  amount == null ? null : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
