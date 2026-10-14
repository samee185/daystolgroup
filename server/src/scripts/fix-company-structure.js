/**
 * One-time update for databases created before the company structure was corrected.
 * Safe to run more than once. It only replaces the old starter content; anything staff
 * created themselves is kept.
 *
 *   npm run fix-structure
 */
import { connectDB, disconnectDB } from '../db.js'
import { Category, Product, Project, Service } from '../models/index.js'
import { slugify } from '../models/plugins/slug.js'
import { DEFAULT_SERVICES } from './defaults.js'

// Starter services from the earlier, incorrect structure
const OLD_STARTER_TITLES = [
  'Diesel generators', 'Inverters and batteries', 'Solar systems', 'Voltage stabilizers',
  'Electrical design and installation', 'Home automation', 'Power automation',
  'ICT installation', 'ICT engineering',
]

const CATEGORY_RENAMES = [
  ['Generators', 'Diesel generators'],
  ['Solar systems', 'Solar power systems'],
  ['Stabilizers', 'Servo stabilizers'],
]

async function main() {
  await connectDB()
  const services = Service.collection // raw collection: old documents don't match the new schema yet

  // 1. Services: move from "page + subsidiary" to "company"
  const removed = await services.deleteMany({
    title: { $in: OLD_STARTER_TITLES },
    page: { $in: ['power-solutions', 'electrical-automation', 'ict-services'] },
  })
  console.log(`Removed ${removed.deletedCount} old starter services`)

  const legacy = await services.find({ company: { $exists: false } }).toArray()
  for (const s of legacy) {
    // eslint-disable-next-line no-await-in-loop
    await services.updateOne({ _id: s._id }, { $set: { company: s.subsidiary || 'power' }, $unset: { page: '', subsidiary: '' } })
  }
  if (legacy.length) console.log(`Moved ${legacy.length} existing services to their company`)

  // Starter service replaced in the second correction (only removed if staff haven't edited it)
  const replaced = await Service.deleteMany({
    company: 'innovation',
    title: 'ICT engineering and installation',
    summary: 'Design and installation of ICT and network systems for homes, offices and estates.',
  })
  if (replaced.deletedCount) console.log('Replaced "ICT engineering and installation" with the detailed ICT services')

  let added = 0
  for (const [order, [company, title, summary]] of DEFAULT_SERVICES.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Service.exists({ company, title })
    if (!exists) {
      // eslint-disable-next-line no-await-in-loop
      await Service.create({ company, title, summary, order })
      added += 1
    }
  }
  console.log(`Added ${added} corrected starter services`)

  // 2. Projects: "ict" becomes "innovation"
  const projects = await Project.collection.updateMany({ category: 'ict' }, { $set: { category: 'innovation' } })
  if (projects.modifiedCount) console.log(`Moved ${projects.modifiedCount} ICT projects to Innovation Systems`)

  // 3. Shop categories
  for (const [from, to] of CATEGORY_RENAMES) {
    // eslint-disable-next-line no-await-in-loop
    const res = await Category.collection.updateOne({ name: from }, { $set: { name: to, slug: slugify(to) } })
    if (res.modifiedCount) console.log(`Renamed category "${from}" to "${to}"`)
  }
  for (const name of ['Inverters', 'Batteries']) {
    // eslint-disable-next-line no-await-in-loop
    const cat = await Category.findOne({ name }).select('_id').lean()
    if (!cat) continue
    // eslint-disable-next-line no-await-in-loop
    const used = await Product.countDocuments({ category: cat._id })
    if (used === 0) {
      // eslint-disable-next-line no-await-in-loop
      await Category.deleteOne({ _id: cat._id })
      console.log(`Removed unused category "${name}"`)
    } else {
      console.log(`Kept category "${name}": ${used} product(s) use it. Move them to another category in the admin, then delete it there.`)
    }
  }

  console.log('\nDone.')
}

main()
  .catch((err) => {
    console.error(`\nUpdate failed: ${err.message}`)
    process.exitCode = 1
  })
  .finally(() => disconnectDB())
