import { Fragment } from 'react'
import { cn } from 'cn'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatTimeOfDay } from '@/lib/format'
import { plural } from '@/lib/text'
import { freeDocks, slotTimes, type Dock, type DockAppointment, type DockClosure, type DockDirection } from './schedule'

// Picks a time slot for a booking, the way a carrier booking portal does:
// every start time left in the day, with the number of docks still free for
// a booking that long and that way round (or "Free" when given one dock). A
// slot with no free dock can't be picked. Grouped into morning, afternoon and
// evening; arrow keys move between slots.

const PARTS = [
  { label: 'Morning', until: 12 * 60 },
  { label: 'Afternoon', until: 17 * 60 },
  { label: 'Evening', until: 24 * 60 },
]

// Amber on a light card needs a little foreground to be legible at 10px.
const LAST_ONE = 'text-[color-mix(in_oklch,var(--status-progress),var(--foreground)_25%)]'

export function DockSlotPicker({
  docks, appointments, closures = [], date, direction, length, open = 6 * 60, close = 22 * 60, slotMinutes = 30,
  notBefore, ignoreId, value, onChange, id, className, ...aria
}: {
  // The docks it may book: all of them, or the one chosen.
  docks: Dock[]
  appointments: DockAppointment[]
  closures?: DockClosure[]
  // yyyy-MM-dd.
  date: string
  direction: DockDirection
  // The booking's length, in minutes.
  length: number
  open?: number
  close?: number
  slotMinutes?: number
  // Minutes after midnight (now, on today): slots starting earlier are left out.
  notBefore?: number
  // The booking being rescheduled, so its own time counts as free.
  ignoreId?: string
  value: number | null
  onChange: (start: number) => void
  id?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  const options = slotTimes(open, close - length + 1, slotMinutes)
    .filter((start) => notBefore === undefined || start >= notBefore)
    .map((start) => ({
      start,
      free: freeDocks(docks, { date, start, end: start + length, direction, appointments, closures, open, close, ignoreId }).length,
    }))

  if (!options.length) {
    return <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs">No slots left on this day.</p>
  }

  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      spacing={1.5}
      value={value === null ? '' : String(value)}
      onValueChange={(v) => v && onChange(Number(v))}
      className={cn('grid w-full grid-cols-3 sm:grid-cols-5', className)}
      {...aria}
    >
      {PARTS.map((part, i) => {
        const from = i === 0 ? 0 : PARTS[i - 1].until
        const inPart = options.filter((o) => o.start >= from && o.start < part.until)
        if (!inPart.length) return null
        return (
          <Fragment key={part.label}>
            <span className={cn('text-muted-foreground col-span-full text-[11px] font-medium', options[0] !== inPart[0] && 'pt-1.5')}>
              {part.label}
            </span>
            {inPart.map((o) => {
              const note = o.free === 0 ? 'Full' : docks.length === 1 ? 'Free' : `${o.free} free`
              return (
                <ToggleGroupItem
                  key={o.start}
                  value={String(o.start)}
                  disabled={o.free === 0}
                  aria-label={`${formatTimeOfDay(o.start)}, ${o.free === 0 ? 'full' : docks.length === 1 ? 'free' : `${plural(o.free, 'dock')} free`}`}
                  className="data-[state=on]:border-brand data-[state=on]:bg-brand/10 h-auto flex-col items-start gap-0 px-2 py-1"
                >
                  <span className="text-xs font-medium tabular-nums">{formatTimeOfDay(o.start)}</span>
                  <span className={cn('text-[10px] font-normal', o.free === 1 && docks.length > 1 ? LAST_ONE : 'text-muted-foreground')}>
                    {note}
                  </span>
                </ToggleGroupItem>
              )
            })}
          </Fragment>
        )
      })}
    </ToggleGroup>
  )
}
