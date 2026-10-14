import { Enquiry, InventoryLog, Order, Product, ServiceRequest } from '../models/index.js'
import { statusLabel } from '../lib/orders.js'

/** Statuses that mean the customer has paid. */
export const PAID_STATUSES = ['paid', 'processing', 'ready', 'out_for_delivery', 'completed']
const TZ = 'Africa/Lagos' // UTC+1 all year
const TZ_OFFSET_MS = 60 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

/** Midnight today in Lagos, as a UTC Date. */
function startOfToday(now = new Date()) {
  const local = new Date(now.getTime() + TZ_OFFSET_MS)
  local.setUTCHours(0, 0, 0, 0)
  return new Date(local.getTime() - TZ_OFFSET_MS)
}

const lagosKey = (date, unit) => {
  const local = new Date(date.getTime() + TZ_OFFSET_MS).toISOString()
  return unit === 'month' ? local.slice(0, 7) : local.slice(0, 10)
}

/**
 * Paid orders per day (last 7 and last 30 days) and per month (last 12 months),
 * with empty buckets filled in so the chart has no gaps.
 */
async function salesSeries(now = new Date()) {
  const today = startOfToday(now)
  const local = new Date(today.getTime() + TZ_OFFSET_MS)
  const yearStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 11, 1) - TZ_OFFSET_MS)

  const grouped = (format, since) => Order.aggregate([
    { $match: { status: { $in: PAID_STATUSES }, 'payment.paidAt': { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$payment.paidAt', timezone: TZ } },
        orders: { $sum: 1 },
        revenue: { $sum: { $ifNull: ['$payment.amountPaid', '$total'] } },
      },
    },
  ])

  const [daily, monthly] = await Promise.all([
    grouped('%Y-%m-%d', new Date(today.getTime() - 29 * DAY)),
    grouped('%Y-%m', yearStart),
  ])
  const byDay = new Map(daily.map((d) => [d._id, d]))
  const byMonth = new Map(monthly.map((d) => [d._id, d]))

  const dayBars = (count) => Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getTime() - (count - 1 - i) * DAY)
    const key = lagosKey(date, 'day')
    const hit = byDay.get(key)
    return { key, orders: hit?.orders || 0, revenue: hit?.revenue || 0 }
  })

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - (11 - i), 1))
    const key = d.toISOString().slice(0, 7)
    const hit = byMonth.get(key)
    return { key, orders: hit?.orders || 0, revenue: hit?.revenue || 0 }
  })

  return { week: dayBars(7), month: dayBars(30), year: months }
}

const ago = (date) => (date ? new Date(date).toISOString() : null)

/** Everything the dashboard shows, in one request. */
export async function dashboardData(currentAdmin) {
  const now = new Date()
  const today = startOfToday(now)

  const [
    todaySales, toProcess, shortfalls, urgentFaults, openFaults, newEnquiries, enquiryTypes,
    lowStock, reviews, latestOrders, recentFaults, recentEnquiries, recentStock, series,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: PAID_STATUSES }, 'payment.paidAt': { $gte: today } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$payment.amountPaid', '$total'] } }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: { $in: ['paid', 'processing'] } }),
    Order.find({ stockShortfall: true, status: { $in: ['paid', 'processing'] } }).sort({ createdAt: -1 }).limit(5).select('reference customer.name createdAt').lean(),
    ServiceRequest.find({ urgent: true, status: 'new' }).sort({ createdAt: 1 }).limit(5).select('reference equipment address createdAt').lean(),
    ServiceRequest.countDocuments({ status: 'new' }),
    Enquiry.countDocuments({ status: 'new' }),
    Enquiry.aggregate([{ $match: { status: 'new' } }, { $group: { _id: '$type', n: { $sum: 1 } } }]),
    Product.find({ published: true, quoteOnly: { $ne: true }, $expr: { $lte: ['$stockQty', '$lowStockThreshold'] } })
      .sort({ stockQty: 1 }).limit(5).select('name stockQty lowStockThreshold availableOnOrder').lean(),
    Order.find({ status: 'payment_review' }).sort({ createdAt: -1 }).limit(5).select('reference createdAt').lean(),
    Order.find({ status: { $ne: 'pending_payment' } }).sort({ createdAt: -1 }).limit(6).select('reference customer.name total status stockShortfall createdAt').lean(),
    ServiceRequest.find().sort({ createdAt: -1 }).limit(4).select('reference urgent equipment createdAt').lean(),
    Enquiry.find().sort({ createdAt: -1 }).limit(4).select('reference type createdAt').lean(),
    InventoryLog.find({ reason: 'adjustment' }).sort({ createdAt: -1 }).limit(3).select('productName stockAfter by createdAt').lean(),
    salesSeries(now),
  ])

  const urgentCount = await ServiceRequest.countDocuments({ urgent: true, status: 'new' })
  const id = (doc) => String(doc._id)

  // "Needs attention": the things staff should act on first
  const attention = [
    ...urgentFaults.map((f) => ({
      tone: 'bad', icon: 'alert', resource: 'ServiceRequest', id: id(f), cta: 'Open',
      title: `Urgent: ${f.equipment === 'other' ? 'equipment' : f.equipment} down`,
      text: [f.reference, f.address].filter(Boolean).join(' · '), at: ago(f.createdAt),
    })),
    ...shortfalls.map((o) => ({
      tone: 'bad', icon: 'phone', resource: 'Order', id: id(o), cta: 'Call',
      title: 'Check stock before processing', text: `${o.reference} · an item sold out at payment`, at: ago(o.createdAt),
    })),
    ...reviews.map((o) => ({
      tone: 'warn', icon: 'info', resource: 'Order', id: id(o), cta: 'Review',
      title: 'Payment needs checking', text: `${o.reference} · amount or currency did not match`, at: ago(o.createdAt),
    })),
    ...lowStock.map((p) => ({
      tone: 'warn', icon: 'stock', resource: 'Product', id: id(p), cta: 'Restock', action: 'edit',
      title: `${p.stockQty > 0 ? 'Low stock' : 'Sold out'}: ${p.name}`,
      text: p.stockQty > 0 ? `${p.stockQty} left (alert at ${p.lowStockThreshold})` : p.availableOnOrder ? 'Showing "Available on order"' : 'Showing "Out of stock"',
    })),
  ].slice(0, 6)

  const activity = [
    ...latestOrders.filter((o) => PAID_STATUSES.includes(o.status)).slice(0, 3).map((o) => ({
      color: '#FFE52E', ref: o.reference, text: o.status === 'completed' ? 'completed' : 'paid by Paystack', at: ago(o.createdAt), resource: 'Order', id: id(o),
    })),
    ...recentFaults.map((f) => ({
      color: f.urgent ? '#FF6B6B' : '#01AFEE', ref: f.reference, text: f.urgent ? 'urgent fault reported' : 'fault reported', at: ago(f.createdAt), resource: 'ServiceRequest', id: id(f),
    })),
    ...recentEnquiries.map((e) => ({
      color: '#EB268F', ref: e.reference, text: `${e.type === 'pmc' ? 'maintenance' : e.type} enquiry received`, at: ago(e.createdAt), resource: 'Enquiry', id: id(e),
    })),
    ...recentStock.map((l) => ({
      color: '#3DDC84', ref: l.by || 'Staff', text: `set stock of ${l.productName} to ${l.stockAfter}`, at: ago(l.createdAt), resource: 'InventoryLog', id: id(l),
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 7)

  const typeCounts = Object.fromEntries(enquiryTypes.map((t) => [t._id, t.n]))

  return {
    name: currentAdmin?.title || '',
    roles: currentAdmin?.roles || [],
    kpis: {
      salesToday: todaySales[0]?.total || 0,
      paidToday: todaySales[0]?.count || 0,
      toProcess,
      shortfalls: shortfalls.length,
      urgentFaults: urgentCount,
      openFaults,
      oldestUrgentAt: ago(urgentFaults[0]?.createdAt),
      newEnquiries,
      enquiryTypes: typeCounts,
    },
    series,
    attention,
    latestOrders: latestOrders.map((o) => ({
      id: id(o), reference: o.reference, customer: o.customer?.name, total: o.total,
      status: o.status, statusLabel: o.stockShortfall && ['paid', 'processing'].includes(o.status) ? 'Check stock' : statusLabel(o.status),
      shortfall: Boolean(o.stockShortfall), at: ago(o.createdAt),
    })),
    activity,
  }
}
