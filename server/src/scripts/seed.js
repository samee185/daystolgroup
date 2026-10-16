/**
 * First-time setup. Creates the first admin account, the site settings record
 * and the default shop categories. Safe to run again: it never duplicates anything.
 *
 *   npm run seed -- --email you@example.com --name "Your Name" --password "a-long-password"
 */
import { parseArgs } from 'node:util'
import bcrypt from 'bcryptjs'

import { connectDB, disconnectDB } from '../db.js'
import { Category, Service, SiteSettings, User } from '../models/index.js'
import { DEFAULT_CATEGORIES, DEFAULT_SERVICES } from './defaults.js'

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string', default: 'Administrator' },
    password: { type: 'string' },
  },
})

async function main() {
  await connectDB()

  // 1. First admin
  const adminCount = await User.countDocuments({ roles: 'admin' })
  if (adminCount === 0) {
    if (!values.email || !values.password) {
      throw new Error('No admin exists yet. From the server folder run: node src/scripts/seed.js --email you@example.com --name "Your Name" --password "at-least-10-characters"')
    }
    if (values.password.length < 10) throw new Error('Use a password of at least 10 characters.')
    await User.create({
      name: values.name,
      email: values.email,
      passwordHash: await bcrypt.hash(values.password, 12),
      roles: ['admin'],
    })
    console.log(`Admin account created for ${values.email}`)
  } else {
    console.log('An admin account already exists, skipping.')
  }

  // 2. Site settings (a single record, edited in the admin)
  if (!(await SiteSettings.exists({}))) {
    await SiteSettings.create({})
    console.log('Site settings record created. Fill in the contact details in the admin.')
  }

  // 3. Shop categories
  if ((await Category.countDocuments()) === 0) {
    for (const [order, name] of DEFAULT_CATEGORIES.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await Category.create({ name, order })
    }
    console.log(`Created categories: ${DEFAULT_CATEGORIES.join(', ')}`)
  }

  // 4. Starter services for the company pages. Only companies with no services yet get them,
  //    so running the seed again adds a new company's services without touching existing ones.
  for (const company of [...new Set(DEFAULT_SERVICES.map(([c]) => c))]) {
    // eslint-disable-next-line no-await-in-loop
    if (await Service.exists({ company })) continue
    const list = DEFAULT_SERVICES.filter(([c]) => c === company)
    for (const [order, [, title, summary]] of list.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await Service.create({ company, title, summary, order })
    }
    console.log(`Created ${list.length} starter services for ${company}`)
  }
}

main()
  .catch((err) => {
    console.error(`\nSeed failed: ${err.message}`)
    process.exitCode = 1
  })
  .finally(() => disconnectDB())
