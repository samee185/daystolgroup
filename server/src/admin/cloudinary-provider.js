import { BaseProvider } from '@adminjs/upload'
import { cloudinary, cloudinaryReady, publicIdFromKey, uploadImage } from '../lib/images.js'

/**
 * Lets the AdminJS upload feature store files on Cloudinary instead of the server disk.
 * Hostinger rebuilds the app on every deploy, so files on its disk would not survive.
 */
export class CloudinaryProvider extends BaseProvider {
  constructor() {
    super('daystol')
  }

  ensureReady() {
    if (!cloudinaryReady) {
      throw new Error('Image uploads need CLOUDINARY_URL in server/.env (see .env.example).')
    }
  }

  async upload(file, key) {
    this.ensureReady()
    await uploadImage(file.path, publicIdFromKey(key))
  }

  async delete(key) {
    this.ensureReady()
    await cloudinary.uploader.destroy(publicIdFromKey(key), { resource_type: 'image' })
  }

  path(key) {
    if (!cloudinaryReady) return ''
    return cloudinary.url(publicIdFromKey(key), { secure: true, transformation: [{ width: 600, crop: 'limit', fetch_format: 'auto', quality: 'auto' }] })
  }
}
