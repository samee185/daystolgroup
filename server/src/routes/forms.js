import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'

import {
  Enquiry, ENQUIRY_TYPES, EQUIPMENT, nextReference, ServiceRequest,
} from '../models/index.js'
import { cloudinaryReady, uploadImage } from '../lib/images.js'
import { confirmCustomer, notifyStaff } from '../lib/mailer.js'
import { asyncHandler, HttpError } from '../middleware/errors.js'
import { formLimiter, looksLikeBot } from '../middleware/spam.js'

const router = Router()

const phone = z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number')
const email = z.string().trim().email('Enter a valid email address').max(120).optional().or(z.literal('').transform(() => undefined))
const text = (max, label) => z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)

const label = (list, value) => list.find((x) => x.value === value)?.label || value

/** Run email sending after the response has gone out; a failure is logged, never shown to the visitor. */
const afterResponse = (task) => {
  task().catch((err) => console.error(`Notification failed: ${err.message}`))
}

// ---------- Contact page: enquiries ----------

const enquirySchema = z.object({
  type: z.enum(ENQUIRY_TYPES.map((t) => t.value)),
  name: text(100, 'Your name'),
  phone,
  email,
  organisation: z.string().trim().max(120).optional(),
  topic: z.string().trim().max(160).optional(),
  message: text(3000, 'Your message'),
  preferredContact: z.enum(['call', 'whatsapp', 'email']).default('call'),
})

router.post('/enquiries', formLimiter, asyncHandler(async (req, res) => {
  if (looksLikeBot(req.body)) return res.status(201).json({ reference: 'EN-000000' })
  const data = enquirySchema.parse(req.body)
  if (data.preferredContact === 'email' && !data.email) throw new HttpError(400, 'Add your email address so we can reply by email.')

  const reference = await nextReference('enquiry', 'EN')
  await Enquiry.create({ ...data, reference })
  res.status(201).json({ reference })

  // Emails go out after the visitor already has their answer
  const typeLabel = label(ENQUIRY_TYPES, data.type)
  afterResponse(async () => {
    await notifyStaff({
      subject: `${typeLabel} ${reference} from ${data.name}`,
      replyTo: data.email,
      heading: `New ${typeLabel.toLowerCase()}`,
      rows: [['Reference', reference], ['Name', data.name], ['Phone', data.phone], ['Email', data.email], ['Organisation', data.organisation], ['About', data.topic], ['Prefers', data.preferredContact], ['Message', data.message]],
      note: 'Open the admin inbox to update its status.',
    })
    await confirmCustomer({
      to: data.email,
      subject: `We've received your message (${reference})`,
      heading: `Thank you, ${data.name}`,
      intro: 'We have received your message and a member of our team will get back to you shortly.',
      rows: [['Reference', reference], ['About', data.topic || typeLabel], ['Your message', data.message]],
      note: 'Daystol Group: Daystol Power Services, Daystol Innovation Systems, Daystol Properties and Daystol Development Concept.',
    })
  })
}))

// ---------- Support page: fault reports with photos ----------

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 4, fields: 20 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) cb(null, true)
    else cb(new HttpError(400, 'Photos must be JPG, PNG, WebP or HEIC images.'))
  },
})

// Turn upload-size and file-count errors into friendly messages
const photos = (req, res, next) =>
  upload.array('photos', 4)(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 8 MB or smaller.'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can attach up to 4 photos.'
          : 'The photos could not be uploaded.'
      return next(new HttpError(400, message))
    }
    return next(err)
  })

const requestSchema = z.object({
  equipment: z.enum(EQUIPMENT.map((e) => e.value)),
  urgent: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  issue: text(3000, 'A description of the problem'),
  name: text(100, 'Your name'),
  phone,
  email,
  address: text(300, 'The address or location'),
})

const uploadToCloudinary = (buffer, publicId) => uploadImage(buffer, publicId, { overwrite: false })

router.post('/service-requests', formLimiter, photos, asyncHandler(async (req, res) => {
  if (looksLikeBot(req.body)) return res.status(201).json({ reference: 'SR-000000' })
  const data = requestSchema.parse(req.body)
  const reference = await nextReference('service-request', 'SR')

  const photoKeys = []
  const photoMimeTypes = []
  let photosSkipped = false
  if (req.files?.length) {
    if (!cloudinaryReady) {
      photosSkipped = true
    } else {
      for (const [i, file] of req.files.entries()) {
        const ext = file.mimetype.split('/')[1].replace('jpeg', 'jpg')
        const key = `daystol/service-requests/${reference}/${i + 1}.${ext}`
        try {
          // eslint-disable-next-line no-await-in-loop
          await uploadToCloudinary(file.buffer, key.replace(/\.[a-z0-9]+$/, ''))
          photoKeys.push(key)
          photoMimeTypes.push(file.mimetype)
        } catch (err) {
          // A failed photo must never lose the customer's report: save it without that photo
          console.error(`Fault report ${reference}: ${err.message}`)
          photosSkipped = true
        }
      }
    }
  }

  await ServiceRequest.create({ ...data, reference, photoKeys, photoMimeTypes })
  res.status(201).json({ reference })

  const equipment = label(EQUIPMENT, data.equipment)
  afterResponse(async () => {
    await notifyStaff({
      subject: `${data.urgent ? 'URGENT ' : ''}Fault report ${reference}: ${equipment}`,
      replyTo: data.email,
      heading: data.urgent ? 'Urgent fault report' : 'New fault report',
      rows: [['Reference', reference], ['Equipment', equipment], ['Urgent', data.urgent ? 'Yes' : 'No'], ['Name', data.name], ['Phone', data.phone], ['Email', data.email], ['Location', data.address], ['Problem', data.issue], ['Photos', photoKeys.length ? `${photoKeys.length} attached (view in the admin inbox)` : photosSkipped ? 'Sent, but they could not be saved. Ask the customer to WhatsApp them.' : 'None']],
      note: 'Open the admin inbox to update its status.',
    })
    await confirmCustomer({
      to: data.email,
      subject: `Your fault report ${reference}`,
      heading: `We've received your report, ${data.name}`,
      intro: 'Our support team will call you to arrange a technician. For an emergency, please call our 24/7 line.',
      rows: [['Reference', reference], ['Equipment', equipment], ['Location', data.address], ['Problem', data.issue]],
    })
  })
}))

export default router
