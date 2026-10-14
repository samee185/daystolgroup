import mongoose from 'mongoose'

/** Running numbers for human-friendly references like SR-000042. */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false })

export const Counter = mongoose.model('Counter', counterSchema)

export async function nextReference(name, prefix) {
  const { seq } = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true })
  return `${prefix}-${String(seq).padStart(6, '0')}`
}
