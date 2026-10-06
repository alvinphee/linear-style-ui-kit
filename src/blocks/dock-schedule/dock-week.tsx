import { HugeiconsIcon } from '@hugeicons/react'
import { format, isWeekend } from 'date-fns'
import { cn } from 'cn'
import { LegendRow } from '@/components/chart-legend'
import { plural } from '@/lib/text'
import { DOCK_HATCH } from './dock-schedule'
import {
  DOCK_USE, dockUtilisation, holdsDock, parseDayKey,
  type Dock, type DockAppointment, type DockClosure,
} from './schedule'

// The dock schedule over several days: a row per dock, a column per day, and
// in each cell the day's bookings and how much of the dock's open time they
// take, shaded by that share (a heatmap). A red dot marks a day with late or
// no-show bookings. The footer adds up every dock. Click a cell or a day to
// open it in the day view (DockSchedule). Scrolls sideways inside itself.

export function DockWeek({
  docks, appointments, days, closures = [], open = 6 * 60, close = 22 * 60, today, selected, onOpenDay, className,
}: {
  docks: Dock[]
  appointments: DockAppointment[]
  // The days to show, as yyyy-MM-dd keys, usually a week.
  days: string[]
  closures?: DockClosure[]
  open?: number
  close?: number
  // Marked in the header, like a calendar's today.
  today?: string
  // The day open in the day view, outlined.
  selected?: string
  // A day's header (no dock) or one dock's cell was clicked.
  onOpenDay?: (date: string, dockId?: string) => void
  className?: string
}) {
  const working = docks.filter((d) => !d.outOfService)
  const onDay = (key: string) => appointments.filter((a) => a.date === key && holdsDock(a))

  return (
    <div className={cn('overflow-x-auto overscroll-x-contain', className)}>
      <table className="w-full min-w-[46rem] table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-36 sm:w-44" />
          {days.map((key) => <col key={key} />)}
        </colgroup>
        <thead>
          <tr className="border-b">
            <th scope="col" className="text-muted-foreground px-3 py-1.5 text-left text-[11px] font-medium">Dock</th>
            {days.map((key) => {
              const d = parseDayKey(key)
              const isToday = key === today
              return (
                <th key={key} scope="col" className={cn('border-l p-1 font-normal', isWeekend(d) && 'bg-subtle')}>
                  <button
                    type="button"
                    onClick={() => onOpenDay?.(key)}
                    aria-label={`${format(d, 'EEEE d MMMM')}: ${plural(onDay(key).length, 'booking')}. Open the day`}
                    className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 outline-none focus-visible:ring-2"
                  >
                    <span className={cn('text-[11px]', isToday ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {format(d, 'EEE')}
                    </span>
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full text-[11px] font-medium tabular-nums',
                        isToday && 'bg-brand text-primary-foreground',
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {docks.map((dock) => {
            const use = DOCK_USE[dock.use ?? 'both']
            return (
              <tr key={dock.id} className="border-b">
                <th scope="row" className="px-3 py-1 text-left font-normal">
                  <span className="flex min-w-0 items-center gap-2">
                    <span title={use.label} className="text-muted-foreground flex shrink-0">
                      <HugeiconsIcon icon={use.icon} strokeWidth={2} className="size-3.5" />
                    </span>
                    <span className="grid min-w-0">
                      <span className="truncate font-medium">{dock.name}</span>
                      {dock.outOfService && <span className="text-muted-foreground truncate text-[11px]">Out of service</span>}
                    </span>
                  </span>
                </th>
                {days.map((key) => (
                  <td key={key} className={cn('border-l p-1', isWeekend(parseDayKey(key)) && 'bg-subtle')}>
                    <WeekCell
                      dock={dock}
                      date={key}
                      bookings={appointments.filter((a) => a.date === key && a.dockId === dock.id)}
                      utilisation={dockUtilisation(dock, key, appointments, closures, open, close)}
                      selected={key === selected}
                      onOpen={onOpenDay && (() => onOpenDay(key, dock.id))}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>

        <tfoot>
          <tr>
            <th scope="row" className="text-muted-foreground px-3 py-2 text-left text-[11px] font-medium">All docks</th>
            {days.map((key) => {
              const average = working.length
                ? Math.round(working.reduce((sum, d) => sum + dockUtilisation(d, key, appointments, closures, open, close), 0) / working.length)
                : 0
              return (
                <td key={key} className={cn('border-l px-2.5 py-2 text-[11px] tabular-nums', isWeekend(parseDayKey(key)) && 'bg-subtle')}>
                  <span className="font-medium">{onDay(key).length}</span>
                  <span className="text-muted-foreground"> · {average}%</span>
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// The heatmap's tint for a share of open time booked: an empty day stays
// clear, a full one is a strong tint of the accent.
const heat = (utilisation: number) => `color-mix(in oklch, var(--brand) ${utilisation === 0 ? 0 : 4 + utilisation * 0.42}%, transparent)`

// The key under a DockWeek: the heatmap's scale and the late / no-show dot.
export function DockWeekLegend({ className }: { className?: string }) {
  return (
    <LegendRow className={className}>
      <span>Each cell: bookings, and the share of open time booked</span>
      <span className="flex items-center gap-1.5">
        Less
        <span aria-hidden className="flex gap-0.5">
          {[0, 25, 50, 75, 100].map((u) => (
            <span key={u} className="size-2.5 rounded-[3px] border" style={{ backgroundColor: heat(u) }} />
          ))}
        </span>
        More booked
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="bg-destructive size-1.5 rounded-full" />
        Late or no-show
      </span>
    </LegendRow>
  )
}

function WeekCell({ dock, date, bookings, utilisation, selected, onOpen }: {
  dock: Dock
  date: string
  bookings: DockAppointment[]
  utilisation: number
  selected: boolean
  onOpen?: () => void
}) {
  const day = format(parseDayKey(date), 'EEEE d MMMM')
  if (dock.outOfService) {
    return (
      <div className="bg-muted/40 h-11 rounded-md" style={DOCK_HATCH}>
        <span className="sr-only">{`${dock.name}, ${day}: out of service`}</span>
      </div>
    )
  }

  const count = bookings.filter(holdsDock).length
  const issues = bookings.filter((a) => a.status === 'late' || a.status === 'no-show').length
  const label = [
    `${dock.name}, ${day}: ${plural(count, 'booking')}, ${utilisation}% booked`,
    issues > 0 && `${issues} late or no-show`,
  ].filter(Boolean).join(', ')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={onOpen ? `${label}. Open the day` : label}
      data-selected={selected}
      className="hover:ring-foreground/15 focus-visible:ring-ring/50 data-[selected=true]:ring-brand/60 relative grid h-11 w-full content-center justify-items-start gap-0.5 rounded-md px-2 text-left outline-none hover:ring-1 focus-visible:ring-2 data-[selected=true]:ring-1"
      style={{ backgroundColor: heat(utilisation) }}
    >
      <span className={cn('text-sm leading-4 font-medium tabular-nums', count === 0 && 'text-muted-foreground text-xs font-normal')}>
        {count || 'Free'}
      </span>
      {count > 0 && <span className="text-muted-foreground text-[10px] leading-3 tabular-nums">{utilisation}%</span>}
      {issues > 0 && <span aria-hidden className="bg-destructive absolute top-1.5 right-1.5 size-1.5 rounded-full" />}
    </button>
  )
}
