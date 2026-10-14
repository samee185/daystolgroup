/**
 * Set a new password for an existing staff account (for example if it's forgotten).
 *
 *   npm run reset-password -- --email you@example.com --password "a-new-long-password"
 */
import { parseArgs } from 'node:util'
import bcrypt from 'bcryptjs'

import { connectDB, disconnectDB } from '../db.js'
import { User } from '../models/index.js'

const { values } = parseArgs({ options: { email: { type: 'string' }, password: { type: 'string' } } })

async function main() {
  if (!values.email || !values.password) {
    throw new Error('Run: npm run reset-password -- --email you@example.com --password "a-new-long-password"')
  }
  if (values.password.length < 10) throw new Error('Use a password of at least 10 characters.')

  await connectDB()
  const user = await User.findOneAndUpdate(
    { email: values.email.toLowerCase().trim() },
    { $set: { passwordHash: await bcrypt.hash(values.password, 12), active: true } },
    { new: true },
  )
  if (!user) {
    const count = await User.countDocuments()
    throw new Error(
      count === 0
        ? 'There are no staff accounts in this database yet. Run the seed with --email and --password to create the first admin.'
        : `No account found for ${values.email}. Check the spelling.`,
    )
  }
  console.log(`Password updated for ${user.email}. You can log in at /admin now.`)
}

main()
  .catch((err) => {
    console.error(`\n${err.message}`)
    process.exitCode = 1
  })
  .finally(() => disconnectDB())
