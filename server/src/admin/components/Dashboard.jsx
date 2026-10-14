import React, { useState } from 'react'
import {
  Badge, Icon, LoadError, ORDER_TONE, getJson, naira, newUrl, recordUrl, resourceUrl, timeAgo, useLoad,
} from './ui.jsx'

const BAR_COLORS = ['#FFE52E', '#01AFEE', '#EB268F']
const PERIODS = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
]
const WEEKDAY = new Intl.DateTimeFormat('en-NG', { weekday: 'short', timeZone: 'UTC' })
const MONTH = new Intl.DateTimeFormat('en-NG', { month: 'short', timeZone: 'UTC' })
const TODAY = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }).format(new Date()))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function barLabel(period, key, i, count) {
  if (period === 'year') return MONTH.format(new Date(`${key}-01T00:00:00Z`))
  if (period === 'week') return WEEKDAY.format(new Date(`${key}T00:00:00Z`))
  // Month view: label every fifth day so the axis stays readable
  return i % 5 === 0 || i === count - 1 ? String(Number(key.slice(8, 10))) : ''
}

function Kpi({ href, label, value, note, noteTone, color, icon, delay }) {
  return (
    <a href={href} className="dz-card dz-kpi dz-lift dz-rise" style={{ animationDelay: delay }}>
      <span className="dz-kpi-bar" style={{ background: color }} aria-hidden="true" />
      <span className="dz-kpi-head">
        <span>{label}</span>
        <span className="dz-kpi-icon" style={{ color }}><Icon name={icon} /></span>
      </span>
      <strong className="dz-display dz-kpi-value dz-count">{value}</strong>
      <span className={`dz-kpi-note ${noteTone ? `dz-text-${noteTone}` : ''}`}>{note}</span>
    </a>
  )
}

function SalesChart({ series }) {
  const [period, setPeriod] = useState('week')
  const bars = series[period] || []
  const max = Math.max(1, ...bars.map((b) => b.orders))
  const totalOrders = bars.reduce((n, b) => n + b.orders, 0)
  const totalRevenue = bars.reduce((n, b) => n + b.revenue, 0)
  const span = { week: 'last 7 days', month: 'last 30 days', year: 'last 12 months' }[period]

  return (
    <section className="dz-card" aria-labelledby="dz-chart-title">
      <div className="dz-card-head">
        <span className="dz-stack">
          <strong id="dz-chart-title">Paid orders</strong>
          <span className="dz-muted dz-small">{totalOrders} {totalOrders === 1 ? 'order' : 'orders'}, {naira(totalRevenue)} in the {span}</span>
        </span>
        <div className="dz-segment" role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="dz-chart" key={period} role="img" aria-label={`Bar chart of paid orders, ${span}`}>
        {bars.map((b, i) => (
          <div key={b.key} className="dz-chart-col" title={`${b.orders} ${b.orders === 1 ? 'order' : 'orders'}, ${naira(b.revenue)}`}>
            <div className="dz-chart-track">
              <div className="dz-bar" style={{ height: `${Math.max(b.orders ? 6 : 2, (b.orders / max) * 100)}%`, background: b.orders ? BAR_COLORS[i % 3] : 'var(--dz-line)', animationDelay: `${i * 0.03}s` }} />
            </div>
            <span className="dz-chart-label">{barLabel(period, b.key, i, bars.length)}</span>
          </div>
        ))}
      </div>
      {totalOrders === 0 && <p className="dz-muted dz-small dz-m0">No paid orders in this period yet.</p>}
    </section>
  )
}

const TONE_ICON_BG = { bad: 'var(--dz-bad-bg)', warn: 'var(--dz-warn-bg)', info: 'var(--dz-info-bg)' }

function Attention({ items }) {
  return (
    <section className="dz-card dz-stack dz-gap-12" aria-labelledby="dz-attn-title">
      <strong id="dz-attn-title" className="dz-row dz-gap-10">
        <span className="dz-pulse" aria-hidden="true"><span className="dz-ping" /><span /></span>
        Needs attention
      </strong>
      {items.length === 0 ? (
        <div className="dz-empty">
          <span className="dz-empty-icon dz-ok"><Icon name="check" size={22} stroke={2.6} /></span>
          <span>All clear. Nothing urgent right now.</span>
        </div>
      ) : items.map((a) => (
        <a key={`${a.resource}-${a.id}-${a.title}`} href={recordUrl(a.resource, a.id, a.action || 'show')} className="dz-attn dz-lift">
          <span className="dz-attn-icon" style={{ background: TONE_ICON_BG[a.tone] }}><span className={`dz-text-${a.tone}`}><Icon name={a.icon} /></span></span>
          <span className="dz-stack dz-min0">
            <strong className="dz-ellipsis">{a.title}</strong>
            <span className="dz-muted dz-small dz-ellipsis">{a.text}{a.at ? ` · ${timeAgo(a.at)}` : ''}</span>
          </span>
          <span className={`dz-attn-cta dz-text-${a.tone}`}>{a.cta} →</span>
        </a>
      ))}
    </section>
  )
}

function LatestOrders({ orders }) {
  return (
    <section className="dz-card" aria-labelledby="dz-orders-title">
      <div className="dz-card-head">
        <strong id="dz-orders-title">Latest orders</strong>
        <a href={resourceUrl('Order')} className="dz-link">All orders →</a>
      </div>
      {orders.length === 0 ? (
        <p className="dz-muted dz-m0">Orders appear here once customers start buying.</p>
      ) : (
        <div className="dz-table-wrap">
          <table className="dz-table">
            <thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col" className="dz-hide-sm">Placed</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="dz-click" onClick={() => { window.location.href = recordUrl('Order', o.id) }}>
                  <td><a href={recordUrl('Order', o.id)} onClick={(e) => e.stopPropagation()}><strong>{o.reference}</strong></a></td>
                  <td>{o.customer}</td>
                  <td>{naira(o.total)}</td>
                  <td><Badge tone={o.shortfall && ['paid', 'processing'].includes(o.status) ? 'bad' : ORDER_TONE[o.status]}>{o.statusLabel}</Badge></td>
                  <td className="dz-hide-sm dz-muted">{timeAgo(o.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Activity({ items }) {
  return (
    <section className="dz-card dz-stack dz-gap-12" aria-labelledby="dz-activity-title">
      <strong id="dz-activity-title">Recent activity</strong>
      {items.length === 0 ? <p className="dz-muted dz-m0">Nothing yet.</p> : (
        <ol className="dz-timeline">
          {items.map((a) => (
            <li key={`${a.resource}-${a.id}`}>
              <span className="dz-tl-dot" style={{ background: a.color }} aria-hidden="true" />
              <a href={recordUrl(a.resource, a.id)} className="dz-stack">
                <span><strong>{a.ref}</strong> {a.text}</span>
                <span className="dz-muted dz-small">{timeAgo(a.at)}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** The admin home page: today's numbers, sales, what needs attention, latest orders and activity. */
export default function Dashboard() {
  const { data, error, loading, reload } = useLoad(() => getJson('/api/dashboard'))

  if (error) return <div className="dz dz-page"><LoadError error={error} onRetry={reload} /></div>
  if (loading && !data) {
    return (
      <div className="dz dz-page" aria-busy="true">
        <div className="dz-skel" style={{ height: 60, width: 320 }} />
        <div className="dz-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="dz-skel" style={{ height: 140 }} />)}</div>
        <div className="dz-skel" style={{ height: 300 }} />
      </div>
    )
  }

  const { kpis, series, attention, latestOrders, activity } = data
  const first = (data.name || '').split(/\s+/)[0]
  const types = Object.entries(kpis.enquiryTypes || {}).map(([t, n]) => `${n} ${t === 'pmc' ? 'maintenance' : t}`).join(', ')

  return (
    <div className="dz dz-page">
      <div className="dz-page-head dz-rise">
        <div className="dz-stack">
          <span className="dz-muted dz-small">{TODAY.format(new Date())}</span>
          <h1 className="dz-display dz-h1">{greeting()}{first ? `, ${first}` : ''}</h1>
        </div>
        <div className="dz-row dz-wrap dz-gap-8">
          <a href={newUrl('Product')} className="dz-btn dz-btn-primary"><Icon name="plus" size={16} stroke={2.6} />Add product</a>
          <a href={resourceUrl('Product')} className="dz-btn dz-btn-ghost"><Icon name="tag" size={16} />Start a sale</a>
          <a href={newUrl('Project')} className="dz-btn dz-btn-ghost"><Icon name="plus" size={16} stroke={2.6} />Add project</a>
        </div>
      </div>

      <div className="dz-kpis">
        <Kpi href={resourceUrl('Order')} label="Sales today" value={naira(kpis.salesToday)} note={`${kpis.paidToday} paid ${kpis.paidToday === 1 ? 'order' : 'orders'} today`} noteTone={kpis.paidToday ? 'ok' : ''} color="#FFE52E" icon="money" delay="0s" />
        <Kpi href={resourceUrl('Order', '?filters.status=paid')} label="Orders to process" value={kpis.toProcess} note={kpis.shortfalls ? `${kpis.shortfalls} out of stock: call the customer` : 'Paid or in progress'} noteTone={kpis.shortfalls ? 'bad' : ''} color="#01AFEE" icon="box" delay=".05s" />
        <Kpi href={resourceUrl('ServiceRequest', '?filters.urgent=true&filters.status=new')} label="Urgent fault reports" value={kpis.urgentFaults} note={kpis.oldestUrgentAt ? `Oldest: ${timeAgo(kpis.oldestUrgentAt)}` : `${kpis.openFaults} new in total`} noteTone={kpis.urgentFaults ? 'bad' : ''} color="#FF6B6B" icon="alert" delay=".1s" />
        <Kpi href={resourceUrl('Enquiry', '?filters.status=new')} label="New enquiries" value={kpis.newEnquiries} note={types || 'None waiting'} color="#EB268F" icon="chat" delay=".15s" />
      </div>

      <div className="dz-row2">
        <SalesChart series={series} />
        <Attention items={attention} />
      </div>
      <div className="dz-row2">
        <LatestOrders orders={latestOrders} />
        <Activity items={activity} />
      </div>
    </div>
  )
}
