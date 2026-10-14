import mongoose from 'mongoose'

/** Preventative Maintenance Contract packages shown on Support & Maintenance. */
const pmcPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    priceLabel: { type: String, trim: true }, // free text, e.g. "From ₦150,000 per quarter"
    features: {
      type: [{ type: String, trim: true }],
      validate: [(v) => v.length > 0, 'Add at least one feature.'],
    },
    highlighted: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const PmcPackage = mongoose.model('PmcPackage', pmcPackageSchema)
