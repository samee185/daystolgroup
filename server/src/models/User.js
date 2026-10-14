import mongoose from 'mongoose'

export const ROLES = ['admin', 'editor', 'sales', 'support']

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },
    passwordHash: { type: String, required: [true, 'Set a password for this account.'], select: false },
    roles: {
      type: [{ type: String, enum: ROLES }],
      default: ['editor'],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'Give the account at least one role.'],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', userSchema)
