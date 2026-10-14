import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

// Always read server/.env, whichever folder the app is started from. On Hostinger there is no .env file:
// the values come from the Environment Variables panel instead (real environment variables always win).
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'is required (MongoDB Atlas connection string)'),
  SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
  PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  CLOUDINARY_URL: z
    .string()
    .regex(/^cloudinary:\/\/[^:]+:[^@]+@.+$/, 'must look like cloudinary://API_KEY:API_SECRET@CLOUD_NAME')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // Email (Hostinger business mailbox). Optional: without it, forms still save to the admin inbox.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // Paystack secret key (Paystack dashboard > Settings > API Keys & Webhooks). Test keys start with sk_test_.
  PAYSTACK_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_[A-Za-z0-9]+$/, 'must be your Paystack secret key (starts with sk_test_ or sk_live_)')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('\nInvalid environment variables (check server/.env):')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')} ${issue.message}`)
  }
  process.exit(1)
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
}

// Launch checks: things that work locally but are wrong on the live site
if (env.isProd) {
  if (!env.PUBLIC_URL.startsWith('https://')) console.warn(`PUBLIC_URL should be your live https:// address (it is ${env.PUBLIC_URL}).`)
  if (env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_')) console.warn('Paystack is using a TEST key: no real money will be taken.')
}
