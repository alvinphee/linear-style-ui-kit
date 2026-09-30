import { useId, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Calendar03Icon, Clock01Icon, Delete02Icon,
  Location01Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, isWeekend, startOfMonth, startOfWeek,
} from 'date-fns'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AvatarGroup } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Section } from './shared'
import { Initials } from './StatusSection'

type Colour = 'blue' | 'violet' | 'green' | 'amber' | 'rose'

// Fixed like label colours: an event reads the same in every theme.
const COLOURS: Record<Colour, { label: string; value: string }> = {
  blue: { label: 'Blue', value: 'oklch(0.62 0.15 250)' },
  violet: { label: 'Violet', value: 'oklch(0.6 0.17 300)' },
  green: { label: 'Green', value: 'oklch(0.66 0.14 155)' },
  amber: { label: 'Amber', value: 'oklch(0.74 0.15 70)' },
  rose: { label: 'Rose', value: 'oklch(0.65 0.18 10)' },
}

type CalEvent = {
  id: string
  title: string
  // yyyy-MM-dd in local time, so a day never shifts with the viewer's timezone.
  date: string
  // Minutes after midnight.
  start: number
  end: number
  colour: Colour
  location?: string
  people?: string[]
}

const TODAY = new Date(2026, 8, 30)
const NOW_MINUTES = 14 * 60 + 20
const DAY_START = 8 * 60
const DAY_END = 18 * 60
const HOUR_PX = 48
const MAX_CHIPS = 3
const WEEK = { weekStartsOn: 1 } as const

const keyOf = (d: Date) => format(d, 'yyyy-MM-dd')
const dateOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1)
}
const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
const clock = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
const timeRange = (e: CalEvent) => `${clock(e.start)} – ${clock(e.end)}`
const longDate = (d: Date) => format(d, 'EEEE d MMMM')

function duration(e: CalEvent) {
  const min = e.end - e.start
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const rest = min % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

const ev = (
  id: string, date: string, start: string, end: string, title: string, colour: Colour,
  extra: Pick<CalEvent, 'location' | 'people'> = {},
): CalEvent => ({ id, date, start: minutes(start), end: minutes(end), title, colour, ...extra })

// Made-up events around September and October 2026.
const SEED: CalEvent[] = [
  ev('e1', '2026-08-31', '15:00', '16:00', 'Month-end close', 'amber', { location: 'Finance room' }),
  ev('e2', '2026-09-01', '10:00', '11:00', 'Q4 planning kickoff', 'violet', { location: 'Room 2B', people: ['Mei Ling', 'Daniel', 'Ravi'] }),
  ev('e3', '2026-09-03', '14:00', '14:30', 'Design review', 'blue', { location: 'Video call', people: ['Siti', 'Ravi'] }),
  ev('e4', '2026-09-08', '09:30', '10:00', 'Customer call: Kestrel Labs', 'green', { location: 'Video call', people: ['Daniel'] }),
  ev('e5', '2026-09-10', '15:00', '16:00', 'Hiring sync', 'amber', { people: ['Mei Ling', 'Ali'] }),
  ev('e6', '2026-09-14', '11:00', '12:00', 'Roadmap review', 'violet', { location: 'Room 2B', people: ['Mei Ling', 'Daniel', 'Siti', 'Ravi'] }),
  ev('e7', '2026-09-17', '09:00', '09:15', 'Standup', 'blue', { location: 'Video call' }),
  ev('e8', '2026-09-17', '13:00', '14:00', 'Pricing workshop', 'rose', { location: 'Room 4A', people: ['Daniel', 'Ali'] }),
  ev('e9', '2026-09-17', '16:00', '17:00', 'Onboarding demo', 'green', { location: 'Video call', people: ['Siti'] }),
  ev('e10', '2026-09-22', '10:00', '11:30', 'Sprint planning', 'violet', { location: 'Room 2B', people: ['Ravi', 'Siti', 'Ali'] }),
  ev('e11', '2026-09-24', '14:00', '15:00', 'Security review', 'rose', { people: ['Ali', 'Daniel'] }),
  ev('e12', '2026-09-28', '09:00', '09:30', 'Weekly standup', 'blue', { location: 'Video call' }),
  ev('e13', '2026-09-28', '11:00', '12:00', '1:1 with Mei Ling', 'amber', { location: 'Cafe corner', people: ['Mei Ling'] }),
  ev('e14', '2026-09-29', '13:30', '15:00', 'Launch rehearsal', 'rose', { location: 'Main hall', people: ['Mei Ling', 'Daniel', 'Siti'] }),
  ev('e15', '2026-09-30', '09:00', '09:30', 'Standup', 'blue', { location: 'Video call' }),
  ev('e16', '2026-09-30', '10:30', '11:30', 'Design critique', 'violet', { location: 'Room 4A', people: ['Siti', 'Ravi'] }),
  ev('e17', '2026-09-30', '13:00', '14:00', 'Customer call: Northpeak', 'green', { location: 'Video call', people: ['Daniel'] }),
  ev('e18', '2026-09-30', '13:30', '14:30', 'Interview: frontend engineer', 'amber', { location: 'Room 2B', people: ['Ravi', 'Ali'] }),
  ev('e19', '2026-09-30', '16:00', '17:00', 'Release retro', 'rose', { location: 'Main hall', people: ['Mei Ling', 'Daniel', 'Siti', 'Ravi', 'Ali'] }),
  ev('e20', '2026-10-01', '11:00', '12:00', 'Board prep', 'violet', { people: ['Mei Ling'] }),
  ev('e21', '2026-10-01', '15:30', '16:30', 'Analytics deep dive', 'blue', { location: 'Video call', people: ['Ali', 'Siti'] }),
  ev('e22', '2026-10-02', '16:00', '17:00', 'Team demo day', 'green', { location: 'Main hall' }),
  ev('e23', '2026-10-06', '10:00', '11:00', 'Sprint planning', 'violet', { location: 'Room 2B' }),
  ev('e24', '2026-10-08', '14:00', '15:00', 'Partner sync', 'amber', { location: 'Video call', people: ['Daniel'] }),
  ev('e25', '2026-10-13', '09:30', '10:30', 'Quarterly business review', 'rose', { location: 'Room 4A' }),
  ev('e26', '2026-10-15', '13:00', '14:00', 'Webinar: Workflows 101', 'green', { location: 'Video call' }),
  ev('e27', '2026-10-21', '11:00', '11:45', 'Accessibility audit', 'blue', { people: ['Siti'] }),
]

type View = 'month' | 'week'

export default function CalendarSection() {
  const [events, setEvents] = useState(SEED)
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(TODAY)
  // The day listed under the grid on phones.
  const [selected, setSelected] = useState(TODAY)
  const [creating, setCreating] = useState(false)
  const nextId = useRef(100)

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of [...events].sort((a, b) => a.start - b.start || a.end - b.end)) {
      map.set(e.date, [...(map.get(e.date) ?? []), e])
    }
    return map
  }, [events])

  function step(dir: 1 | -1) {
    const next = view === 'month' ? startOfMonth(addMonths(cursor, dir)) : addWeeks(cursor, dir)
    setCursor(next)
    setSelected(view === 'month' && isSameMonth(next, TODAY) ? TODAY : next)
  }

  function goToday() {
    setCursor(TODAY)
    setSelected(TODAY)
  }

  function changeView(next: View) {
    if (next === 'week' && isSameMonth(selected, cursor)) setCursor(selected)
    setView(next)
  }

  function openWeek(day: Date) {
    setCursor(day)
    setSelected(day)
    setView('week')
  }

  function remove(event: CalEvent) {
    setEvents((es) => es.filter((e) => e.id !== event.id))
    toast(`Deleted “${event.title}”`, {
      action: { label: 'Undo', onClick: () => setEvents((es) => [...es, event]) },
    })
  }

  function create(draft: Omit<CalEvent, 'id'>) {
    const event = { ...draft, id: `new-${nextId.current++}` }
    setEvents((es) => [...es, event])
    const day = dateOf(event.date)
    setCursor(day)
    setSelected(day)
    setCreating(false)
    toast.success('Event created', { description: `${event.title} · ${format(day, 'EEE d MMM')}, ${timeRange(event)}` })
  }

  const weekStart = startOfWeek(cursor, WEEK)
  const weekEnd = endOfWeek(cursor, WEEK)
  const unit = view === 'month' ? 'month' : 'week'

  return (
    <Section id="calendar" title="Calendar" description="Month and week views with events">
      <article className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <div className="mr-auto flex min-w-0 flex-wrap items-baseline gap-x-2" aria-live="polite">
            <h3 className="text-sm font-semibold tracking-tight">{format(cursor, 'MMMM yyyy')}</h3>
            {view === 'week' && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM')}
              </span>
            )}
          </div>
          <ButtonGroup>
            <Button variant="outline" size="icon" aria-label={`Previous ${unit}`} onClick={() => step(-1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <Button variant="outline" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" aria-label={`Next ${unit}`} onClick={() => step(1)}>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          </ButtonGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            onValueChange={(v) => v && changeView(v as View)}
            aria-label="View"
          >
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setCreating(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New event
          </Button>
        </header>

        {view === 'month' ? (
          <MonthView
            cursor={cursor}
            byDay={byDay}
            selected={selected}
            onSelect={setSelected}
            onOpenWeek={openWeek}
            onDelete={remove}
          />
        ) : (
          <WeekView start={weekStart} byDay={byDay} onDelete={remove} />
        )}
      </article>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <NewEventForm defaultDate={selected} onCreate={create} />
        </DialogContent>
      </Dialog>
    </Section>
  )
}

function EventPopover({ event, onDelete, children }: {
  event: CalEvent
  onDelete: (e: CalEvent) => void
  children: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const colour = COLOURS[event.colour].value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: colour }} />
          <div className="grid min-w-0 gap-0.5">
            <p className="text-sm leading-snug font-medium">{event.title}</p>
            <p className="text-muted-foreground">{longDate(dateOf(event.date))}</p>
          </div>
        </div>
        <ul className="text-muted-foreground grid gap-1.5">
          <li className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
            <span className="text-foreground tabular-nums">{timeRange(event)}</span>
            <span>· {duration(event)}</span>
          </li>
          {event.location && (
            <li className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
              <span className="text-foreground truncate">{event.location}</span>
            </li>
          )}
          {event.people?.length ? (
            <li className="flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5 shrink-0" />
              <AvatarGroup className="-space-x-1.5">
                {event.people.map((p) => <Initials key={p} name={p} className="size-5" />)}
              </AvatarGroup>
              <span className="truncate">{event.people.join(', ')}</span>
            </li>
          ) : null}
        </ul>
        <div className="flex justify-end border-t pt-2.5">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setOpen(false)
              onDelete(event)
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const eventLabel = (e: CalEvent) => `${e.title}, ${longDate(dateOf(e.date))}, ${timeRange(e)}`

function EventRow({ event, onDelete, compact }: { event: CalEvent; onDelete: (e: CalEvent) => void; compact?: boolean }) {
  return (
    <EventPopover event={event} onDelete={onDelete}>
      <button
        type="button"
        aria-label={eventLabel(event)}
        className={cn(
          'hover:bg-accent focus-visible:ring-ring/50 flex w-full min-w-0 items-center gap-1.5 rounded px-1 text-left outline-none focus-visible:ring-2',
          compact ? 'h-5 text-[11px]' : 'h-7 gap-2 px-1.5 text-xs',
        )}
      >
        <span
          className={cn('shrink-0 rounded-full', compact ? 'size-1.5' : 'size-2')}
          style={{ backgroundColor: COLOURS[event.colour].value }}
        />
        <span className={cn('text-muted-foreground shrink-0 tabular-nums', compact && 'hidden md:inline')}>
          {compact ? clock(event.start) : timeRange(event)}
        </span>
        <span className="min-w-0 truncate">{event.title}</span>
      </button>
    </EventPopover>
  )
}

function MonthView({ cursor, byDay, selected, onSelect, onOpenWeek, onDelete }: {
  cursor: Date
  byDay: Map<string, CalEvent[]>
  selected: Date
  onSelect: (d: Date) => void
  onOpenWeek: (d: Date) => void
  onDelete: (e: CalEvent) => void
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), WEEK),
    end: endOfWeek(endOfMonth(cursor), WEEK),
  })
  const weekdays = days.slice(0, 7)
  const selectedEvents = byDay.get(keyOf(selected)) ?? []

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {weekdays.map((d) => (
          <div key={d.getDay()} className="text-muted-foreground px-1 py-1.5 text-center text-[11px] font-medium sm:px-2 sm:text-left">
            <span className="sm:hidden">{format(d, 'EEEEE')}</span>
            <span className="hidden sm:inline">{format(d, 'EEE')}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = byDay.get(keyOf(day)) ?? []
          const inMonth = isSameMonth(day, cursor)
          const today = isSameDay(day, TODAY)
          const isSelected = isSameDay(day, selected)
          const lastRow = i >= days.length - 7
          const overflow = dayEvents.length - MAX_CHIPS
          const count = `${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}`

          return (
            <div
              key={keyOf(day)}
              className={cn(
                'min-w-0 border-r sm:min-h-28 sm:p-1',
                i % 7 === 6 && 'border-r-0',
                !lastRow && 'border-b',
                !inMonth && 'bg-subtle',
              )}
            >
              {/* Phones: the whole cell is one button, with a dot per event. */}
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-pressed={isSelected}
                aria-label={`${longDate(day)}, ${count}`}
                className={cn(
                  'focus-visible:ring-ring/50 flex h-12 w-full flex-col items-center gap-1 pt-1.5 outline-none focus-visible:ring-2 focus-visible:ring-inset sm:hidden',
                  isSelected && 'bg-accent',
                )}
              >
                <DayNumber day={day} today={today} inMonth={inMonth} />
                <span className="flex gap-0.5" aria-hidden>
                  {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                    <span key={e.id} className="size-1 rounded-full" style={{ backgroundColor: COLOURS[e.colour].value }} />
                  ))}
                </span>
              </button>

              <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                <button
                  type="button"
                  onClick={() => onOpenWeek(day)}
                  aria-label={`${longDate(day)}, ${count}. Open week view`}
                  className="hover:bg-accent focus-visible:ring-ring/50 mb-0.5 w-fit rounded-full outline-none focus-visible:ring-2"
                >
                  <DayNumber day={day} today={today} inMonth={inMonth} showMonth />
                </button>
                {dayEvents.slice(0, MAX_CHIPS).map((e) => (
                  <EventRow key={e.id} event={e} onDelete={onDelete} compact />
                ))}
                {overflow > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Show all ${count} on ${longDate(day)}`}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 h-5 w-fit rounded px-1 text-left text-[11px] font-medium outline-none focus-visible:ring-2"
                      >
                        +{overflow} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 gap-2">
                      <p className="px-1.5 text-xs font-medium">{longDate(day)}</p>
                      <div className="grid gap-0.5">
                        {dayEvents.map((e) => <EventRow key={e.id} event={e} onDelete={onDelete} />)}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t p-3 sm:hidden">
        <p className="mb-1.5 px-1.5 text-xs font-medium">{longDate(selected)}</p>
        {selectedEvents.length ? (
          <div className="grid gap-0.5">
            {selectedEvents.map((e) => <EventRow key={e.id} event={e} onDelete={onDelete} />)}
          </div>
        ) : (
          <p className="text-muted-foreground px-1.5 text-xs">Nothing scheduled.</p>
        )}
      </div>
    </div>
  )
}

function DayNumber({ day, today, inMonth, showMonth }: { day: Date; today: boolean; inMonth: boolean; showMonth?: boolean }) {
  const first = day.getDate() === 1
  return (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums',
        today ? 'bg-brand text-primary-foreground' : !inMonth && 'text-muted-foreground',
      )}
    >
      {showMonth && first ? format(day, 'd MMM') : day.getDate()}
    </span>
  )
}

type Placed = { event: CalEvent; lane: number; lanes: number }

// Overlapping events share the column side by side: each cluster of overlaps gets as many lanes as it needs.
function layoutDay(events: CalEvent[]): Placed[] {
  const placed: Placed[] = []
  let cluster: { event: CalEvent; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const flush = () => {
    for (const p of cluster) placed.push({ ...p, lanes: laneEnds.length })
    cluster = []
    laneEnds = []
  }

  for (const event of events) {
    if (event.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= event.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(event.end)
    } else {
      laneEnds[lane] = event.end
    }
    cluster.push({ event, lane })
    clusterEnd = cluster.length === 1 ? event.end : Math.max(clusterEnd, event.end)
  }
  flush()
  return placed
}

const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i)
const yOf = (min: number) => ((Math.min(Math.max(min, DAY_START), DAY_END) - DAY_START) / 60) * HOUR_PX
const GRID_COLS = 'grid grid-cols-[3rem_repeat(7,minmax(0,1fr))]'

function WeekView({ start, byDay, onDelete }: {
  start: Date
  byDay: Map<string, CalEvent[]>
  onDelete: (e: CalEvent) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const height = yOf(DAY_END)
  const nowY = yOf(NOW_MINUTES)

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <div className="min-w-[44rem]">
        <div className={cn(GRID_COLS, 'border-b')}>
          <div />
          {days.map((d) => {
            const today = isSameDay(d, TODAY)
            return (
              <div key={keyOf(d)} className="flex items-center gap-1.5 border-l px-2 py-1.5">
                <span className={cn('text-[11px]', today ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {format(d, 'EEE')}
                </span>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[11px] font-medium tabular-nums',
                    today && 'bg-brand text-primary-foreground',
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        <div className="py-2.5">
          <div className={cn(GRID_COLS, 'relative')} style={{ height }}>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-12 z-[1]">
              {HOURS.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t" style={{ top: yOf(h * 60) }} />
              ))}
            </div>

            <div aria-hidden className="relative">
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="text-muted-foreground absolute right-2 -translate-y-1/2 text-[10px] tabular-nums"
                  style={{ top: yOf(h * 60) }}
                >
                  {h}:00
                </span>
              ))}
            </div>

            {days.map((d) => {
              const today = isSameDay(d, TODAY)
              return (
                <div key={keyOf(d)} className={cn('relative border-l', isWeekend(d) && 'bg-subtle')}>
                  {layoutDay(byDay.get(keyOf(d)) ?? []).map(({ event, lane, lanes }) => (
                    <WeekEvent key={event.id} event={event} lane={lane} lanes={lanes} onDelete={onDelete} />
                  ))}
                  {today && NOW_MINUTES >= DAY_START && NOW_MINUTES <= DAY_END && (
                    <div
                      role="img"
                      aria-label={`Now, ${clock(NOW_MINUTES)}`}
                      className="bg-destructive pointer-events-none absolute inset-x-0 z-20 h-px"
                      style={{ top: nowY }}
                    >
                      <span className="bg-destructive absolute -top-[3px] -left-[3.5px] size-[7px] rounded-full" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekEvent({ event, lane, lanes, onDelete }: {
  event: CalEvent
  lane: number
  lanes: number
  onDelete: (e: CalEvent) => void
}) {
  const colour = COLOURS[event.colour].value
  const top = yOf(event.start)
  const height = Math.max(18, yOf(event.end) - top - 2)

  return (
    <EventPopover event={event} onDelete={onDelete}>
      <button
        type="button"
        aria-label={eventLabel(event)}
        className="hover:ring-foreground/20 focus-visible:ring-ring/60 absolute z-10 flex flex-col overflow-hidden rounded-[5px] border-l-2 px-1.5 py-0.5 text-left text-[11px] leading-4 outline-none hover:z-30 hover:ring-1 focus-visible:z-30 focus-visible:ring-2"
        style={{
          top: top + 1,
          height,
          left: `calc(${(lane / lanes) * 100}% + 2px)`,
          width: `calc(${100 / lanes}% - 4px)`,
          backgroundColor: `color-mix(in oklch, ${colour} 18%, var(--card))`,
          borderLeftColor: colour,
        }}
      >
        <span className="truncate font-medium">{event.title}</span>
        {height >= 34 && <span className="text-muted-foreground truncate tabular-nums">{timeRange(event)}</span>}
      </button>
    </EventPopover>
  )
}

// Half-hour steps across the working day shown in the week view.
const TIMES = Array.from({ length: (DAY_END - DAY_START) / 30 + 1 }, (_, i) => DAY_START + i * 30)

function NewEventForm({ defaultDate, onCreate }: {
  defaultDate: Date
  onCreate: (e: Omit<CalEvent, 'id'>) => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [start, setStart] = useState(9 * 60)
  const [end, setEnd] = useState(10 * 60)
  const [colour, setColour] = useState<Colour>('blue')
  const [pickerOpen, setPickerOpen] = useState(false)
  const id = useId()

  function changeStart(value: string) {
    const next = Number(value)
    setStart(next)
    if (end <= next) setEnd(Math.min(next + 60, DAY_END))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title: title.trim(), date: keyOf(date), start, end, colour })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>New event</DialogTitle>
        <DialogDescription>Adds it to this calendar only.</DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Design review"
            autoComplete="off"
            autoFocus
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button id={`${id}-date`} variant="outline" className="w-full justify-start font-normal">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
                {format(date, 'EEE, d MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date}
                weekStartsOn={1}
                onSelect={(d) => {
                  if (d) setDate(d)
                  setPickerOpen(false)
                }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-start`}>Starts</FieldLabel>
            <Select value={String(start)} onValueChange={changeStart}>
              <SelectTrigger id={`${id}-start`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMES.slice(0, -1).map((t) => (
                  <SelectItem key={t} value={String(t)}>{clock(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-end`}>Ends</FieldLabel>
            <Select value={String(end)} onValueChange={(v) => setEnd(Number(v))}>
              <SelectTrigger id={`${id}-end`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMES.filter((t) => t > start).map((t) => (
                  <SelectItem key={t} value={String(t)}>{clock(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel id={`${id}-colour`}>Colour</FieldLabel>
          <ToggleGroup
            type="single"
            value={colour}
            onValueChange={(v) => v && setColour(v as Colour)}
            aria-labelledby={`${id}-colour`}
          >
            {(Object.keys(COLOURS) as Colour[]).map((c) => (
              <ToggleGroupItem
                key={c}
                value={c}
                aria-label={COLOURS[c].label}
                className="data-[state=on]:ring-foreground/25 data-[state=on]:ring-1"
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: COLOURS[c].value }} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!title.trim()}>Create event</Button>
      </DialogFooter>
    </form>
  )
}
