import { format, isSameDay, startOfDay, subDays } from 'date-fns'

// Formatters the kit's components, pages and templates share. Dates go
// through date-fns, not Intl: newer en-GB data writes "Sept" for September,
// which reads oddly next to "Aug" and "Oct". date-fns writes "Sep".

type DateInput = Date | number

// A UTC midnight read as the same calendar day in local time, for pages that
// keep their dates as UTC midnights so day maths never trips over a DST change.
const utcDay = (value: DateInput) => {
  const d = new Date(value)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/* ---------- Sizes and durations ---------- */

// A file's size: "820 B", "48 KB", "2.4 MB".
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// How long something took: "0.4s", "8s", "1m 5s".
export function formatDuration(ms: number) {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

// A running timer in minutes and seconds: "0:05", "12:30". For a recording
// or a job that is still going; seconds are rounded down.
export function formatTimer(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* ---------- Numbers and money ---------- */

const NUMBER = new Intl.NumberFormat('en-US')
const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const WHOLE_MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// A number with thousands separators: "68,400".
export const formatNumber = (value: number) => NUMBER.format(value)

// US dollars: "$1,234.50", or "$1,235" with `cents` false (tiles, charts, totals).
export const formatMoney = (value: number, cents = true) => (cents ? MONEY : WHOLE_MONEY).format(value)

/* ---------- Dates and times ---------- */

// A short date: "5 Oct", or "5 Oct 2026" with `year`. Pass `utc` for a date
// kept as a UTC midnight, so it reads as that day in every time zone.
export function formatShortDate(value: DateInput, { year = false, utc = false }: { year?: boolean; utc?: boolean } = {}) {
  return format(utc ? utcDay(value) : value, year ? 'd MMM yyyy' : 'd MMM')
}

// The time of day on a 24-hour clock: "09:05", or "09:05:42" with `seconds`.
export function formatTime(value: DateInput, { seconds = false }: { seconds?: boolean } = {}) {
  return format(value, seconds ? 'HH:mm:ss' : 'HH:mm')
}

// "Today" or "Yesterday" counted in calendar days from `now`, or undefined for
// an earlier day. A time later than now still counts as today.
export function relativeDay(value: DateInput, now: DateInput = Date.now()): 'Today' | 'Yesterday' | undefined {
  const today = startOfDay(now).getTime()
  const time = new Date(value).getTime()
  if (time >= today) return 'Today'
  if (time >= subDays(today, 1).getTime()) return 'Yesterday'
  return undefined
}

// "Today", "Yesterday" or "5 Oct": when something was made or last changed.
// With `time`, today and yesterday add the time: "Today, 09:05".
export function formatRelativeDate(value: DateInput, { now, time = false }: { now?: DateInput; time?: boolean } = {}) {
  const day = relativeDay(value, now)
  if (!day) return formatShortDate(value)
  return time ? `${day}, ${formatTime(value)}` : day
}

// A date range: "1 Sep – 30 Sep", or a single date when both ends are the
// same day (or there is no end). With `year`, the year follows the end date,
// and the start date too when the range crosses into a new year.
export function formatDateRange(
  from: DateInput,
  to?: DateInput,
  { year = false, utc = false }: { year?: boolean; utc?: boolean } = {},
) {
  const start = utc ? utcDay(from) : new Date(from)
  const end = to === undefined ? start : utc ? utcDay(to) : new Date(to)
  const last = format(end, year ? 'd MMM yyyy' : 'd MMM')
  if (isSameDay(start, end)) return last
  const yearOnStart = year && start.getFullYear() !== end.getFullYear()
  return `${format(start, yearOnStart ? 'd MMM yyyy' : 'd MMM')} – ${last}`
}
