export const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

async function uniqueSlug(Model, base, excludeId) {
  let candidate = base
  let n = 2
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${base}-${n}`
    n += 1
  }
  return candidate
}

/**
 * Adds a unique `slug` field. If staff leave it blank it is generated from `source`.
 * An existing slug is kept when the name changes, so published URLs don't break.
 *
 * Works for both document saves and findOneAndUpdate (AdminJS edits use the latter).
 */
export function slugPlugin(schema, { source = 'name' } = {}) {
  schema.add({
    slug: { type: String, trim: true, unique: true, index: true },
  })

  schema.pre('validate', async function slugOnSave() {
    if (this.slug && !this.isNew && !this.isModified('slug')) return
    const base = slugify(this.slug || this.get(source))
    if (!base) {
      this.invalidate('slug', 'Enter a name so a web address can be generated.')
      return
    }
    this.slug = await uniqueSlug(this.constructor, base, this._id)
  })

  schema.pre('findOneAndUpdate', async function slugOnUpdate() {
    const update = this.getUpdate() || {}
    const set = update.$set || update
    if (!Object.prototype.hasOwnProperty.call(set, 'slug')) return

    const current = await this.model.findOne(this.getQuery()).select(`_id slug ${source}`).lean()
    let raw = set.slug
    if (!raw) raw = current?.slug || set[source] || current?.[source]
    const base = slugify(raw)
    if (!base) return
    set.slug = await uniqueSlug(this.model, base, current?._id)
  })
}
