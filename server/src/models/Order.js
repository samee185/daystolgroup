import mongoose from 'mongoose'

export const ORDER_STATUSES = [
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid, to be processed' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready', label: 'Ready for pickup' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'payment_review', label: 'Payment needs checking' },
]

export const FULFILMENT = [
  { value: 'pickup', label: 'Pickup from our office' },
  { value: 'delivery', label: 'Delivery' },
]

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String },
    unitPrice: { type: Number, required: true, min: 0 }, // whole naira, locked when the order was placed
    qty: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    stockDeducted: { type: Boolean, default: false }, // set once payment is confirmed and stock was taken
  },
  { _id: false },
)

/**
 * Shop orders. Created at checkout (awaiting payment) and marked paid only after the server
 * has confirmed the payment with Paystack. Prices are always calculated on the server.
 */
const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    status: { type: String, enum: ORDER_STATUSES.map((s) => s.value), default: 'pending_payment', index: true },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'An order needs at least one item.'] },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    deliveryFeeToConfirm: { type: Boolean, default: false }, // no flat fee set: staff agree the cost with the customer
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },

    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    fulfilment: { type: String, enum: FULFILMENT.map((f) => f.value), required: true },
    address: {
      line: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },
    customerNotes: { type: String, trim: true },

    payment: {
      provider: { type: String, default: 'paystack' },
      attempts: { type: [String], default: [], index: true }, // every Paystack reference created for this order
      reference: { type: String }, // the one that was paid
      channel: { type: String },
      amountPaid: { type: Number },
      paidAt: { type: Date },
    },
    stockShortfall: { type: Boolean, default: false }, // paid, but some items were no longer in stock
    accessToken: { type: String, required: true }, // lets the customer view their order page; never shown in the admin
    staffNotes: { type: String, trim: true },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', orderSchema)
