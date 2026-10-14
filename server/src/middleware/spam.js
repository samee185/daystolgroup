import rateLimit from 'express-rate-limit'

/** At most 5 submissions per form per visitor every 15 minutes. */
export const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please wait a few minutes, or call us instead.' },
})

/**
 * Quiet bot checks. Forms include a hidden "website" field people never see (bots fill it in)
 * and the time the form was opened (bots submit instantly). Bots get a fake "success" and nothing is saved.
 */
export function looksLikeBot(body) {
  if (body.website) return true
  const startedAt = Number(body.startedAt)
  if (!startedAt || Date.now() - startedAt < 3000) return true
  return false
}
