import mongoose from 'mongoose'
import { env } from './config/env.js'

mongoose.set('strictQuery', true)

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
