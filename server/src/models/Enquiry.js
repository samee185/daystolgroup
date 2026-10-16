import mongoose from 'mongoose'

export const ENQUIRY_TYPES = [
  { value: 'general', label: 'General enquiry' },
  { value: 'quote', label: 'Quote request' },
  { value: 'consultation', label: 'Consultation (Innovation Systems)' },
  { value: 'property', label: 'Property enquiry' },
  { value: 'contract', label: 'Contract enquiry (Development Concept)' },
  { value: 'pmc', label: 'Maintenance contract' },
]

export const ENQUIRY_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
]

/** Messages sent through the Contact page. Created by the website only; staff update the status. */
const enquirySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    type: { type: String, enum: ENQUIRY_TYPES.map((t) => t.value), required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    organisation: { type: String, trim: true },
    topic: { type: String, trim: true }, // service, property interest, product or package, depending on type
    message: { type: String, required: true, trim: true },
    preferredContact: { type: String, enum: ['call', 'whatsapp', 'email'], default: 'call' },
    status: { type: String, enum: ENQUIRY_STATUSES.map((s) => s.value), default: 'new', index: true },
    staffNotes: { type: String, trim: true },
  },
  { timestamps: true },
)

export const Enquiry = mongoose.model('Enquiry', enquirySchema)
