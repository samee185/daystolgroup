import mongoose from 'mongoose'

export const STOCK_REASONS = [
  { value: 'sale', label: 'Sold online' },
  { value: 'cancellation', label: 'Order cancelled (returned to stock)' },
  { value: 'adjustment', label: 'Edited in the admin' },
]

/** Every change to a product's stock, so the numbers can always be explained. Written by the server only. */
const inventoryLogSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    change: { type: Number, required: true }, // negative when stock goes down
    stockAfter: { type: Number },
    reason: { type: String, enum: STOCK_REASONS.map((r) => r.value), required: true },
    order: { type: String }, // order reference, for sales and cancellations
    by: { type: String }, // staff email for admin changes
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema)
