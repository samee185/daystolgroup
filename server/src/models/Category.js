import mongoose from 'mongoose'
import { slugPlugin } from './plugins/slug.js'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageKey: { type: String },
    imageMimeType: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

categorySchema.plugin(slugPlugin, { source: 'name' })

export const Category = mongoose.model('Category', categorySchema)
