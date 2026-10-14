/** Read a value that may be stored nested ({ sale: { price } }) or flattened ({ 'sale.price' }). */
export function pick(obj, path) {
  if (!obj) return undefined
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path]
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

/** '' / null / undefined -> null, otherwise a Number (NaN stays NaN so validation can reject it). */
export function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  return Number(value)
}

/** AdminJS sends booleans as strings; normalise. */
export function toBool(value) {
  return value === true || value === 'true'
}

export function toDate(value) {
  if (value === '' || value === null || value === undefined) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
