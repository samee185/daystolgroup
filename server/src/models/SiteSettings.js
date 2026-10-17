import mongoose from 'mongoose'

const phone = {
  type: String,
  trim: true,
  validate: { validator: (v) => !v || /^\+?[0-9\s-]{7,20}$/.test(v), message: 'Enter a valid phone number.' },
}

const httpsUrl = {
  type: String,
  trim: true,
  validate: { validator: (v) => !v || /^https:\/\//.test(v), message: 'Must start with https://' },
}

/** Keep only the code from a pasted <meta ... content="CODE"> tag. */
function verificationCode(v) {
  if (!v) return v
  const m = String(v).match(/content=["']([^"']+)["']/i)
  return (m ? m[1] : String(v)).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 100)
}

/** One document holds the contact details used across the site. Created by the seed script. */
const siteSettingsSchema = new mongoose.Schema(
  {
    phone,
    emergencyPhone: phone,
    whatsappNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^[1-9][0-9]{9,14}$/.test(v),
        message: 'Digits only, with country code and no "+", e.g. 2348012345678.',
      },
    },
    email: { type: String, trim: true, lowercase: true },
    notificationEmail: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    officeHours: { type: String, trim: true },
    mapUrl: httpsUrl,

    // Shop delivery
    pickupAddress: { type: String, trim: true },
    deliveryArea: { type: String, trim: true },
    deliveryFee: {
      type: Number,
      min: [0, 'The delivery fee cannot be negative.'],
      validate: { validator: (v) => v == null || Number.isInteger(v), message: 'Use whole naira, no kobo.' },
    },
    deliveryNote: { type: String, trim: true },

    // About page "Who we are" section. Hidden on the site until both are filled in.
    aboutHeadline: { type: String, trim: true, maxlength: 120 },
    aboutStory: { type: String, default: '' },
    // Search engine ownership checks. Staff can paste the whole tag Google or Bing gives them; only the code is kept.
    googleSiteVerification: { type: String, trim: true, set: verificationCode },
    bingSiteVerification: { type: String, trim: true, set: verificationCode },

    socialLinks: {
      type: [
        new mongoose.Schema(
          {
            platform: { type: String, enum: ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'google', 'jiji'], required: true },
            url: { ...httpsUrl, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, collection: 'sitesettings' },
)

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema)
