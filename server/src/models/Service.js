import mongoose from 'mongoose'
import { slugPlugin } from './plugins/slug.js'

/** The four Daystol companies. Each has its own page, which lists that company's services. */
export const COMPANIES = ['power', 'innovation', 'property', 'construction']

export const COMPANY_LABELS = [
  { value: 'power', label: 'Daystol Power Services' },
  { value: 'innovation', label: 'Daystol Innovation Systems' },
  { value: 'property', label: 'Daystol Property' },
  { value: 'construction', label: 'Daystol Development Concept' },
]

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, enum: COMPANIES, required: true, index: true },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    body: { type: String, default: '' },
    imageKey: { type: String },
    imageMimeType: { type: String },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
)

serviceSchema.plugin(slugPlugin, { source: 'title' })

export const Service = mongoose.model('Service', serviceSchema)
