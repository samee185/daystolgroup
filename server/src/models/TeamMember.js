import mongoose from 'mongoose'

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    photoKey: { type: String },
    photoMimeType: { type: String },
    bio: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema)
