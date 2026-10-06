import type { IconSvgElement } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, ArrowDownLeft01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import type { Tone } from '@/components/status-badge'
import { formatTimeOfDay } from '@/lib/format'

// The dock schedule's vocabulary, and the maths the three views share:
// DockSchedule (one day, docks by time), DockWeek (docks by day) and
// DockSlotPicker (free docks per time slot, for booking). Times of day are
// minutes after midnight and days are yyyy-MM-dd keys in local time, so a
// booking never moves with the viewer's time zone.

export type DockDirection = 'inbound' | 'outbound'

// What a dock door takes: inbound (receiving), outbound (shipping) or both.
export type DockUse = DockDirection | 'both'

export type Dock = {
  id: string
  // "Dock 01".
  name: string
  // Defaults to both.
  use?: DockUse
  // A muted line under the name, such as "Reefer · Leveller".
  description?: string
  // Out of service: the row is hatched with this reason and takes no bookings.
  outOfService?: string
}

// Scheduled → checked in at the gate → at the door (loading or unloading) →
// completed. Late: past its start and not checked in. A no-show frees its dock.
export type DockAppointmentStatus = 'scheduled' | 'checked-in' | 'at-door' | 'completed' | 'late' | 'no-show'

export type DockAppointment = {
  id: string
  dockId: string
  // yyyy-MM-dd.
  date: string
  // Minutes after midnight.
  start: number
  end: number
  direction: DockDirection
  status: DockAppointmentStatus
  // The bar's first line, usually the carrier.
  title: string
  // Its second line, such as the reference and the load: "PO-8004 · 22 pallets".
  subtitle?: string
}

// Time a dock can't be booked: maintenance, cleaning, a shift change.
export type DockClosure = {
  id: string
  // Leave out for every dock (a shift change).
  dockId?: string
  // Leave out for every day.
  date?: string
  start: number
  end: number
  label: string
}

// A place on the schedule: a dock and a start time.
export type DockSlot = { dockId: string; start: number }

export type DockSlotMinutes = 15 | 30 | 60
export type DockColourBy = 'status' | 'direction'
export type DockDensity = 'default' | 'compact'
// horizontal: a row per dock, time across. vertical: a column per dock, time down.
export type DockOrientation = 'horizontal' | 'vertical'

export const APPOINTMENT_STATUS: Record<DockAppointmentStatus, {
  label: string
  // For a StatusBadge.
  tone: Tone
  // The badge's dot, when the tone's colour isn't the status's own.
  dotClassName?: string
  // The bar's colour on the schedule.
  colour: string
}> = {
  scheduled: { label: 'Scheduled', tone: 'info', colour: 'var(--brand)' },
  'checked-in': { label: 'Checked in', tone: 'neutral', dotClassName: 'bg-chart-2', colour: 'var(--chart-2)' },
  'at-door': { label: 'At door', tone: 'progress', colour: 'var(--status-progress)' },
  completed: { label: 'Completed', tone: 'neutral', colour: 'var(--muted-foreground)' },
  late: { label: 'Late', tone: 'danger', colour: 'var(--destructive)' },
  'no-show': { label: 'No-show', tone: 'danger', colour: 'var(--destructive)' },
}

export const APPOINTMENT_STATUS_ORDER: DockAppointmentStatus[] = ['scheduled', 'checked-in', 'at-door', 'completed', 'late', 'no-show']

// Fixed like label colours, so a direction reads the same in every theme.
export const DOCK_DIRECTION: Record<DockDirection, { label: string; icon: IconSvgElement; colour: string }> = {
  inbound: { label: 'Inbound', icon: ArrowDownLeft01Icon, colour: 'oklch(0.64 0.12 220)' },
  outbound: { label: 'Outbound', icon: ArrowUpRight01Icon, colour: 'oklch(0.7 0.15 50)' },
}

export const DOCK_USE: Record<DockUse, { label: string; icon: IconSvgElement }> = {
  inbound: { label: 'Inbound only', icon: ArrowDownLeft01Icon },
  outbound: { label: 'Outbound only', icon: ArrowUpRight01Icon },
  both: { label: 'Inbound and outbound', icon: ArrowDataTransferHorizontalIcon },
}

// A day's key and back: 5 Oct 2026 ↔ "2026-10-05", in local time.
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function parseDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

type Span = { start: number; end: number }

export const overlaps = (a: Span, b: Span) => a.start < b.end && b.start < a.end

// "09:30 – 10:30".
export const timeRange = (span: Span) => `${formatTimeOfDay(span.start)} – ${formatTimeOfDay(span.end)}`

// A no-show frees its dock; every other booking holds it.
export const holdsDock = (a: DockAppointment) => a.status !== 'no-show'

export const dockTakes = (dock: Dock, direction: DockDirection) => !dock.use || dock.use === 'both' || dock.use === direction

export const closuresOn = (closures: DockClosure[], dockId: string, date: string) =>
  closures.filter((c) => (!c.dockId || c.dockId === dockId) && (!c.date || c.date === date))

// The start of every slot from opening to closing time.
export function slotTimes(open: number, close: number, step: number) {
  const times: number[] = []
  for (let t = open; t < close; t += step) times.push(t)
  return times
}

// Minutes covered by a set of spans, counting overlaps once.
function coveredMinutes(spans: Span[], from: number, to: number) {
  const sorted = spans
    .map((s) => ({ start: Math.max(s.start, from), end: Math.min(s.end, to) }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start)
  let total = 0
  let reach = from
  for (const s of sorted) {
    const start = Math.max(s.start, reach)
    if (s.end > start) total += s.end - start
    reach = Math.max(reach, s.end)
  }
  return total
}

export type BookingCheck = {
  dock: Dock
  date: string
  start: number
  end: number
  // Leave out to check the time only, whatever the dock takes.
  direction?: DockDirection
  appointments: DockAppointment[]
  closures?: DockClosure[]
  open: number
  close: number
  // The booking being moved, so it doesn't clash with itself.
  ignoreId?: string
  // Lets two bookings share a dock (a double booking).
  allowOverlap?: boolean
}

// Why a dock can't take a booking at that time, short enough for a tooltip,
// or null when it can.
export function bookingConflict({
  dock, date, start, end, direction, appointments, closures = [], open, close, ignoreId, allowOverlap,
}: BookingCheck): string | null {
  if (dock.outOfService) return 'Out of service'
  if (direction && !dockTakes(dock, direction)) return DOCK_USE[dock.use ?? 'both'].label
  if (start < open || end > close) return 'Outside opening hours'
  const closure = closuresOn(closures, dock.id, date).find((c) => overlaps(c, { start, end }))
  if (closure) return closure.label
  if (allowOverlap) return null
  const booked = appointments.find(
    (a) => a.id !== ignoreId && a.dockId === dock.id && a.date === date && holdsDock(a) && overlaps(a, { start, end }),
  )
  return booked ? `Taken by ${booked.title}` : null
}

// The docks that could take a booking at that time, in the order given.
export function freeDocks(docks: Dock[], check: Omit<BookingCheck, 'dock'>) {
  return docks.filter((dock) => !bookingConflict({ ...check, dock }))
}

// The booked share of a dock's open time on a day, 0 to 100. Closed time
// doesn't count as open, and a double booking counts once.
export function dockUtilisation(
  dock: Dock, date: string, appointments: DockAppointment[], closures: DockClosure[], open: number, close: number,
) {
  if (dock.outOfService) return 0
  const available = close - open - coveredMinutes(closuresOn(closures, dock.id, date), open, close)
  if (available <= 0) return 0
  const booked = coveredMinutes(appointments.filter((a) => a.dockId === dock.id && a.date === date && holdsDock(a)), open, close)
  return Math.min(100, Math.round((booked / available) * 100))
}

// Bookings that overlap on one dock (a double booking) sit in lanes, one
// under the other. `conflicts` holds the ids of every booking that overlaps another.
export function layoutLanes(items: DockAppointment[]) {
  const laneOf = new Map<string, number>()
  const conflicts = new Set<string>()
  const laneEnds: number[] = []
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  for (const a of sorted) {
    let lane = laneEnds.findIndex((end) => end <= a.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(a.end)
    } else {
      laneEnds[lane] = a.end
    }
    laneOf.set(a.id, lane)
  }
  const holding = sorted.filter(holdsDock)
  for (let i = 0; i < holding.length; i++) {
    for (let j = i + 1; j < holding.length && holding[j].start < holding[i].end; j++) {
      conflicts.add(holding[i].id)
      conflicts.add(holding[j].id)
    }
  }
  return { lanes: Math.max(1, laneEnds.length), laneOf, conflicts }
}
