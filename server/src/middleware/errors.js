import { ZodError } from 'zod'
import { env } from '../config/env.js'

/** Wrap async route handlers so rejected promises reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export class HttpError extends Error {
  /** `extra` can carry a machine-readable `code` and field `details` for the client. */
  constructor(status, message, extra = {}) {
    super(message)
    this.status = status
    this.code = extra.code
    this.details = extra.details
  }
}

export function notFoundApi(req, res) {
  res.status(404).json({ error: 'Not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Invalid request',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}), ...(err.details ? { details: err.details } : {}) })
  }

  console.error(err)
  return res.status(500).json({ error: env.isProd ? 'Something went wrong. Please try again.' : err.message })
}
