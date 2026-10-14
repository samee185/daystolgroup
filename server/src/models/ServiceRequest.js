import mongoose from 'mongoose'

export const EQUIPMENT = [
  { value: 'generator', label: 'Diesel generator' },
  { value: 'solar', label: 'Solar power system' },
  { value: 'stabilizer', label: 'Servo stabilizer' },
  { value: 'electrical', label: 'Electrical installation' },
  { value: 'surveillance', label: 'Surveillance system' },
  { value: 'automation', label: 'Home or power automation' },
  { value: 'ict', label: 'ICT or network' },
  { value: 'other', label: 'Something else' },
]

export const REQUEST_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Customer contacted' },
  { value: 'scheduled', label: 'Visit scheduled' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

/** Fault reports from the Support page. Photos are stored on Cloudinary. */
const serviceRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    equipment: { type: String, enum: EQUIPMENT.map((e) => e.value), required: true, index: true },
    urgent: { type: Boolean, default: false, index: true },
    issue: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    photoKeys: { type: [String], default: [] },
    photoMimeTypes: { type: [String], default: [] },
    status: { type: String, enum: REQUEST_STATUSES.map((s) => s.value), default: 'new', index: true },
    staffNotes: { type: String, trim: true },
  },
  { timestamps: true },
)

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema)
