import mongoose from 'mongoose'
import { slugPlugin } from './plugins/slug.js'

// Projects are grouped by the Daystol company that delivered them
export const PROJECT_CATEGORIES = ['power', 'innovation', 'property']

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: PROJECT_CATEGORIES, required: true, index: true },
    location: { type: String, trim: true },
    client: { type: String, trim: true },
    // Uploaded through the admin (Cloudinary). Uploads are attached right after the record is saved.
    coverKey: { type: String },
    coverMimeType: { type: String },
    galleryKeys: { type: [String], default: [] },
    galleryMimeTypes: { type: [String], default: [] },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    caseStudy: { type: String, default: '' },
    completedAt: { type: Date },
    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
)

projectSchema.plugin(slugPlugin, { source: 'title' })

export const Project = mongoose.model('Project', projectSchema)
