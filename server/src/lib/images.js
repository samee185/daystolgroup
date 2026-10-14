import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.js'

// The SDK reads CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) from the environment.
export const cloudinaryReady = Boolean(env.CLOUDINARY_URL)
if (cloudinaryReady) cloudinary.config({ secure: true })

export { cloudinary }

/** Uploaded files are stored under a key like "products/<id>/photo.jpg"; Cloudinary's id drops the extension. */
export const publicIdFromKey = (key) => String(key).replace(/\.[a-z0-9]+$/i, '')

const WIDTHS = [400, 800, 1200, 1600]

/** Responsive image for the website: Cloudinary resizes and picks WebP/AVIF automatically. */
export function imageFor(key, alt = '') {
  if (!key || !cloudinaryReady) return null
  const id = publicIdFromKey(key)
  const at = (w) => cloudinary.url(id, { secure: true, transformation: [{ width: w, crop: 'limit', fetch_format: 'auto', quality: 'auto' }] })
  return {
    src: at(800),
    srcSet: WIDTHS.map((w) => `${at(w)} ${w}w`).join(', '),
    alt,
  }
}

export const imagesFor = (keys, alt = '') => (keys || []).map((k) => imageFor(k, alt)).filter(Boolean)

// Uploads from a slow connection can take a while: allow 3 minutes per attempt, and retry once.
const UPLOAD_TIMEOUT_MS = 180_000

const describe = (err) => err?.error?.message || err?.message || String(err)

function uploadOnce(source, options) {
  if (Buffer.isBuffer(source)) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (err, result) => (err ? reject(err) : resolve(result)))
        .end(source)
    })
  }
  return cloudinary.uploader.upload(source, options)
}

/** Upload an image (a file path or a Buffer) to Cloudinary, with a long timeout and one retry. */
export async function uploadImage(source, publicId, { overwrite = true } = {}) {
  const options = { public_id: publicId, resource_type: 'image', overwrite, timeout: UPLOAD_TIMEOUT_MS }
  try {
    return await uploadOnce(source, options)
  } catch (first) {
    console.warn(`Cloudinary upload of ${publicId} failed (${describe(first)}), retrying once…`)
    try {
      return await uploadOnce(source, options)
    } catch (second) {
      throw new Error(`Image upload to Cloudinary failed: ${describe(second)}. Check your internet connection and try again.`)
    }
  }
}
