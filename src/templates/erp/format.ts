// Formatting shared by every ERP page. The demo's "today" is fixed, so dates
// and "overdue" always read the same.

export const TODAY = '2026-10-01'

const money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const money2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
const number = new Intl.NumberFormat('en-US')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatMoney = (value: number, cents = true) => (cents ? money2 : money0).format(value)
export const formatNumber = (value: number) => number.format(value)

// Compact money for tiles and charts: $1.2M, $48K.
export function formatMoneyShort(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 10_000) return `$${Math.round(value / 1000)}K`
  if (abs >= 1000) return `$${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return money0.format(value)
}

// "2026-10-01" → "1 Oct 2026", or "1 Oct" in the current year.
export function formatDate(iso: string, withYear = false) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return withYear || y !== 2026 ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`
}

export function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)

// Every status in the template, by tone. A status not listed is neutral.
export type { Tone } from '@/components/status-badge'
import type { Tone } from '@/components/status-badge'

const TONES: Record<string, Tone> = {
  // Good outcomes
  Won: 'success', Accepted: 'success', Paid: 'success', Delivered: 'success', Received: 'success', Approved: 'success',
  Active: 'success', Posted: 'success', Completed: 'success', Qualified: 'success', 'In stock': 'success', Connected: 'success',
  Reconciled: 'success',
  // In motion
  Sent: 'info', Confirmed: 'info', Contacted: 'info', Proposal: 'info', 'In transit': 'info', Shipped: 'info',
  Ordered: 'info', Processing: 'progress', Negotiation: 'progress', 'Partially paid': 'progress', 'Partially received': 'progress',
  Discovery: 'progress', Scheduled: 'progress', Invited: 'info', 'On leave': 'info', Probation: 'progress',
  // Needs attention
  'Awaiting approval': 'warning', Pending: 'warning', Overdue: 'danger', 'Low stock': 'warning', Expiring: 'warning',
  'Ready to pick': 'warning', New: 'info', Open: 'warning', Unpaid: 'warning',
  // Stopped
  Lost: 'danger', Rejected: 'danger', Cancelled: 'neutral', Void: 'neutral', Expired: 'neutral', 'Out of stock': 'danger',
  Suspended: 'danger', Inactive: 'neutral', Archived: 'neutral', Draft: 'neutral', Closed: 'neutral', Disconnected: 'neutral',
}

export const toneOf = (status: string): Tone => TONES[status] ?? 'neutral'

// Badge and dot colours per tone are the kit's (components/status-badge).
export { TONE_CLASS, TONE_DOT } from '@/components/status-badge'
