import {
  useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type DragEvent,
  type KeyboardEvent, type MouseEvent,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Alert02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { LegendRow } from '@/components/chart-legend'
import { ProgressRing } from '@/components/progress-ring'
import { TimeMarker } from '@/components/time-marker'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatMinutes, formatTimeOfDay } from '@/lib/format'
import {
  APPOINTMENT_STATUS, APPOINTMENT_STATUS_ORDER, DOCK_DIRECTION, DOCK_USE, bookingConflict, closuresOn,
  dockUtilisation, freeDocks, layoutLanes, overlaps, slotTimes, timeRange,
  type Dock, type DockAppointment, type DockClosure, type DockColourBy, type DockDensity, type DockOrientation,
  type DockSlot, type DockSlotMinutes,
} from './schedule'

// The dock schedule for one day, in either of two layouts:
//   horizontal: a row per dock door and time across the top (a resource
//               timeline). Scrolls sideways.
//   vertical:   a column per dock door and time down the side (a resource
//               calendar, like a calendar's day view). Scrolls down, and
//               sideways when the docks don't fit.
// Each appointment is a bar in its dock's lane. Time slots are marked on the
// grid, and beside the times a count of the docks still free in each slot.
// Closures (maintenance, a shift change) and docks out of service are
// hatched, the past is shaded and a red line marks now.
//
// Give it the docks, the appointments (only `date`'s are shown) and any
// closures. With `onMove`, bars drag to another dock or time, snapping to
// the slot; the drop is refused, with the reason, when the dock is taken,
// closed or the wrong way round. On the keyboard, Shift and the arrow keys
// move the focused bar one slot or one dock. With `onCreate`, clicking a free
// slot books it. Place it on a card (the sticky dock and time columns are
// drawn in bg-card), in a container with a definite width.

// Pixels per hour, by slot size, so a slot's bar has room for its text.
const HOUR_PX: Record<DockOrientation, Record<DockSlotMinutes, number>> = {
  horizontal: { 15: 160, 30: 120, 60: 96 },
  vertical: { 15: 144, 30: 96, 60: 72 },
}
// Horizontal: each lane's height and the gap around a bar.
const LANE: Record<DockDensity, { height: number; inset: number }> = {
  default: { height: 44, inset: 4 },
  compact: { height: 30, inset: 3 },
}
// Vertical: the gap either side of a bar in its column, and a column's least width.
const COLUMN_PAD = 3
const COLUMN_WIDTH: Record<DockDensity, string> = { default: '9rem', compact: '6.5rem' }

// Closed time: faint diagonal lines.
export const DOCK_HATCH: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 9%, transparent) 0 1px, transparent 1px 7px)',
}

const tint = (colour: string, percent: number) => `color-mix(in oklch, ${colour} ${percent}%, var(--card))`

// Amber on a light card needs a little foreground to be legible at 10px.
const LAST_ONE = 'font-medium text-[color-mix(in_oklch,var(--status-progress),var(--foreground)_25%)]'

/* ---------- One appointment ---------- */

// An appointment's bar: its colour (by status or by direction), the carrier,
// the time and the reference. The schedule places it; on its own it takes
// the size you give it in className. Other props go on the button.
//   horizontal: the carrier, and the time and reference on one line under it
//   vertical:   a line each for the carrier, the time and the reference, top
//               down; a short bar drops whole lines from the bottom
export function DockAppointmentBar({
  appointment: a, colourBy = 'status', density = 'default', orientation = 'horizontal', progress, conflict = false,
  selected = false, className, style, ...props
}: Omit<ComponentProps<'button'>, 'children'> & {
  appointment: DockAppointment
  colourBy?: DockColourBy
  density?: DockDensity
  orientation?: DockOrientation
  // 0 to 100: how far through it is, shaded from the start.
  progress?: number
  // It overlaps another booking on its dock (a double booking).
  conflict?: boolean
  // Open in the side panel.
  selected?: boolean
}) {
  const status = APPOINTMENT_STATUS[a.status]
  const direction = DOCK_DIRECTION[a.direction]
  const colour = colourBy === 'status' ? status.colour : direction.colour
  const noShow = a.status === 'no-show'
  const done = a.status === 'completed'
  const vertical = orientation === 'vertical'

  const lead = colourBy === 'status' ? (
    <span className="flex shrink-0" style={{ color: colour }}>
      <HugeiconsIcon icon={direction.icon} strokeWidth={2} className="size-3" />
    </span>
  ) : (
    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: status.colour }} />
  )
  const title = (
    <span className={cn('min-w-0 truncate font-medium', (done || noShow) && 'text-muted-foreground', noShow && 'line-through')}>
      {a.title}
    </span>
  )
  const mark = conflict ? (
    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-3 shrink-0" />
  ) : done && (
    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-muted-foreground hidden size-3 shrink-0 @min-[5rem]:block" />
  )

  return (
    <button
      type="button"
      data-selected={selected}
      {...props}
      className={cn(
        'relative flex min-w-0 overflow-hidden rounded-[5px] border border-l-[3px] text-left text-[11px] leading-4 outline-none',
        'hover:ring-foreground/20 focus-visible:ring-ring/60 hover:ring-1 focus-visible:ring-2',
        'data-[selected=true]:ring-brand data-[selected=true]:ring-offset-card data-[selected=true]:ring-2 data-[selected=true]:ring-offset-1',
        'data-[dragging=true]:opacity-40',
        noShow && 'border-dashed',
        className,
      )}
      style={{
        backgroundColor: noShow ? 'transparent' : tint(colour, done ? 9 : 16),
        borderColor: `color-mix(in oklch, ${colour} ${noShow ? 55 : 32}%, transparent)`,
        borderLeftColor: colour,
        ...style,
      }}
    >
      {progress !== undefined && progress > 0 && (
        <span
          aria-hidden
          className={cn('absolute left-0', vertical ? 'inset-x-0 top-0' : 'inset-y-0')}
          style={{ [vertical ? 'height' : 'width']: `${Math.min(100, progress)}%`, backgroundColor: tint(colour, 30) }}
        />
      )}
      {vertical ? (
        // Lines that don't fit wrap into a second column, which the bar clips,
        // so a short bar loses whole lines rather than showing half of one.
        // The column gap is wider than the padding, or the next column peeks in.
        <span className="@container relative flex h-full min-w-0 flex-1 flex-col flex-wrap content-start gap-x-4 overflow-hidden px-1.5 py-0.5">
          <span className="flex w-full min-w-0 shrink-0 items-center gap-1">
            {lead}
            {title}
            {mark && <span className="ml-auto flex shrink-0">{mark}</span>}
          </span>
          <span className="text-muted-foreground w-full shrink-0 truncate tabular-nums">{timeRange(a)}</span>
          {density === 'default' && a.subtitle && (
            <span className="text-muted-foreground w-full shrink-0 truncate tabular-nums">{a.subtitle}</span>
          )}
        </span>
      ) : (
        <span className={cn('@container relative flex min-w-0 flex-1 flex-col justify-center px-1.5', density === 'default' && 'py-0.5')}>
          <span className="flex min-w-0 items-center gap-1">
            {lead}
            {title}
            {(density === 'compact' || mark) && (
              <span className="ml-auto flex shrink-0 items-center gap-1 pl-1">
                {density === 'compact' && (
                  <span className="text-muted-foreground hidden tabular-nums @min-[9rem]:inline">{formatTimeOfDay(a.start)}</span>
                )}
                {mark}
              </span>
            )}
          </span>
          {density === 'default' && (
            <span className="text-muted-foreground truncate tabular-nums">
              {timeRange(a)}
              {a.subtitle && <> · {a.subtitle}</>}
            </span>
          )}
        </span>
      )}
    </button>
  )
}

// What a bar is called for screen readers and in its tooltip's first lines.
function describe(a: DockAppointment, dock: Dock | undefined) {
  return [
    a.title,
    timeRange(a),
    dock?.name,
    DOCK_DIRECTION[a.direction].label,
    APPOINTMENT_STATUS[a.status].label,
    a.subtitle,
  ].filter(Boolean).join(', ')
}

/* ---------- The day ---------- */

export function DockSchedule({
  docks, appointments, date, closures = [], open = 6 * 60, close = 22 * 60, slotMinutes = 30, now,
  orientation = 'horizontal', colourBy = 'status', density = 'default', showCapacity = true, selectedId, onOpen,
  onMove, onCreate, canMove, allowOverlap = false, className, viewportClassName,
}: {
  docks: Dock[]
  // Any days: only those on `date` are shown.
  appointments: DockAppointment[]
  // yyyy-MM-dd.
  date: string
  closures?: DockClosure[]
  // Opening and closing time, in minutes after midnight. Defaults to 06:00–22:00.
  open?: number
  close?: number
  // The grid, the free-dock count and where drags snap.
  slotMinutes?: DockSlotMinutes
  // Minutes after midnight, when `date` is today: draws the now line, shades
  // the past and fills the bars at the door by how far through they are.
  now?: number
  // A row per dock (time across), or a column per dock (time down).
  orientation?: DockOrientation
  colourBy?: DockColourBy
  // Lane height (horizontal), or column width (vertical).
  density?: DockDensity
  // The free docks per slot, beside the times.
  showCapacity?: boolean
  selectedId?: string | null
  // A bar was clicked, or Enter pressed on it.
  onOpen?: (appointment: DockAppointment) => void
  // Makes bars drag (and move with Shift + arrows). Only called for a move the dock can take.
  onMove?: (id: string, to: DockSlot) => void
  // Which bars may move, such as not the completed ones. Leave out to let every bar move.
  canMove?: (appointment: DockAppointment) => boolean
  // A free slot was clicked.
  onCreate?: (slot: DockSlot) => void
  // Lets a drop land on a booked dock (a double booking). Closures still refuse it.
  allowOverlap?: boolean
  className?: string
  // The scroll area. Vertical, it is 36rem tall at most; set another height here.
  viewportClassName?: string
}) {
  const vertical = orientation === 'vertical'
  const lane = LANE[density]
  const ppm = HOUR_PX[orientation][slotMinutes] / 60
  // Where a time of day sits along the time axis, in pixels from opening time.
  const pos = (min: number) => (Math.min(Math.max(min, open), close) - open) * ppm
  const length = (close - open) * ppm
  const slotPx = slotMinutes * ppm
  const slots = slotTimes(open, close, slotMinutes)
  const hours = slotTimes(Math.ceil(open / 60) * 60, close, 60)
  const showNow = now !== undefined && now >= open && now <= close
  const nowPos = showNow ? pos(now) : 0

  const day = useMemo(() => appointments.filter((a) => a.date === date), [appointments, date])
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // The dock column (horizontal) or the dock header row (vertical): what the sticky part covers.
  const headRef = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const [hover, setHover] = useState<DockSlot | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [drop, setDrop] = useState<(DockSlot & { end: number; reason: string | null }) | null>(null)
  // Read in dragover, before the state above has rendered.
  const dragRef = useRef<{ id: string; grab: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  // Opens on now, or on the first booking of another day.
  const first = day.length ? Math.min(...day.map((a) => a.start)) : open
  const focusTime = showNow ? now : first
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Both layouts share this scroll area, so the other axis starts over too.
    if (vertical) {
      const visible = el.clientHeight - (headRef.current?.offsetHeight ?? 0)
      el.scrollTo({ left: 0, top: Math.max(0, pos(focusTime) - (showNow ? visible / 3 : 16)) })
    } else {
      const visible = el.clientWidth - (headRef.current?.offsetWidth ?? 0)
      el.scrollTo({ top: 0, left: Math.max(0, pos(focusTime) - (showNow ? visible / 3 : 16)) })
    }
    // Only when the day, the scale or the layout changes, not after every move.
  }, [date, slotMinutes, orientation])

  const openDocks = docks.filter((d) => !d.outOfService)
  const capacity = showCapacity
    ? slots.map((start) => {
        const span = { start, end: Math.min(start + slotMinutes, close) }
        const free = freeDocks(openDocks, { date, ...span, appointments: day, closures, open, close }).length
        // Every dock closed then (a shift change), rather than booked up.
        const closed = openDocks.every((d) => closuresOn(closures, d.id, date).some((c) => overlaps(c, span)))
        return {
          start,
          free,
          closed,
          full: free === 0 && !closed,
          past: now !== undefined && span.end <= now,
          share: openDocks.length ? 1 - free / openDocks.length : 1,
          title: closed ? `${formatTimeOfDay(start)}: every dock closed` : `${formatTimeOfDay(start)}: ${free} of ${openDocks.length} docks free`,
        }
      })
    : []
  const capacityText = (c: (typeof capacity)[number]) => (c.closed ? 'Closed' : c.full ? 'Full' : c.free)
  const capacityTone = (c: (typeof capacity)[number]) =>
    c.full ? 'text-destructive font-medium' : c.free === 1 && !c.closed ? LAST_ONE : 'text-muted-foreground'

  const minuteAt = (e: { clientX: number; clientY: number }, track: HTMLElement) => {
    const r = track.getBoundingClientRect()
    return open + (vertical ? e.clientY - r.top : e.clientX - r.left) / ppm
  }
  const snap = (m: number) => open + Math.round((m - open) / slotMinutes) * slotMinutes
  const slotAt = (m: number) => open + Math.floor((m - open) / slotMinutes) * slotMinutes

  const conflictFor = (a: DockAppointment, dock: Dock, start: number) =>
    bookingConflict({
      dock, date, start, end: start + (a.end - a.start), direction: a.direction, appointments: day, closures,
      open, close, ignoreId: a.id, allowOverlap,
    })

  function move(a: DockAppointment, dock: Dock, start: number) {
    onMove?.(a.id, { dockId: dock.id, start })
    setAnnouncement(`Moved ${a.title} to ${dock.name}, ${timeRange({ start, end: start + a.end - a.start })}`)
  }

  function startDrag(e: DragEvent<HTMLElement>, a: DockAppointment) {
    const rect = e.currentTarget.getBoundingClientRect()
    dragRef.current = { id: a.id, grab: (vertical ? e.clientY - rect.top : e.clientX - rect.left) / ppm }
    e.dataTransfer.setData('text/plain', a.id)
    e.dataTransfer.effectAllowed = 'move'
    setHover(null)
    // Deferred so the browser takes the drag image before the bar fades.
    setTimeout(() => {
      if (dragRef.current?.id === a.id) setDraggingId(a.id)
    }, 0)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setDrop(null)
  }

  // Where the dragged bar would land in this dock's lane, and why it can't.
  function landing(e: DragEvent<HTMLElement>, dock: Dock) {
    const drag = dragRef.current
    const a = drag ? day.find((d) => d.id === drag.id) : undefined
    if (!drag || !a) return null
    const span = a.end - a.start
    const start = Math.min(Math.max(snap(minuteAt(e, e.currentTarget as HTMLElement) - drag.grab), open), close - span)
    const same = dock.id === a.dockId && start === a.start
    return { a, start, end: start + span, same, reason: same ? null : conflictFor(a, dock, start) }
  }

  // The free slot under the pointer in a dock's lane, if it is one: not on a
  // bar, inside opening hours, not over, and with nothing booked or closed.
  function freeSlotAt(e: MouseEvent<HTMLDivElement>, dock: Dock): DockSlot | null {
    if ((e.target as HTMLElement).closest('[data-dock-appointment]')) return null
    const start = slotAt(minuteAt(e, e.currentTarget))
    const end = Math.min(start + slotMinutes, close)
    const free = start >= open && end <= close && (now === undefined || end > now)
      && !bookingConflict({ dock, date, start, end, appointments: day, closures, open, close })
    return free ? { dockId: dock.id, start } : null
  }

  function trackHandlers(dock: Dock) {
    return {
      onDragOver: (e: DragEvent<HTMLDivElement>) => {
        const l = landing(e, dock)
        if (!l) return
        if (!l.reason) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }
        setDrop((p) =>
          p && p.dockId === dock.id && p.start === l.start && p.reason === l.reason
            ? p
            : { dockId: dock.id, start: l.start, end: l.end, reason: l.reason },
        )
      },
      onDragLeave: (e: DragEvent<HTMLDivElement>) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setDrop((p) => (p?.dockId === dock.id ? null : p))
      },
      onDrop: (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const l = landing(e, dock)
        endDrag()
        if (l && !l.reason && !l.same) move(l.a, dock, l.start)
      },
      ...(onCreate && !dock.outOfService && {
        onMouseMove: (e: MouseEvent<HTMLDivElement>) => {
          if (dragRef.current) return
          const slot = freeSlotAt(e, dock)
          setHover((p) => {
            if (!slot) return p === null ? p : null
            return p?.dockId === slot.dockId && p.start === slot.start ? p : slot
          })
        },
        onMouseLeave: () => setHover(null),
        // Worked out again from the pointer: a quick click can beat the hover's render.
        onClick: (e: MouseEvent<HTMLDivElement>) => {
          const slot = freeSlotAt(e, dock)
          if (slot) onCreate(slot)
        },
      }),
    }
  }

  function onBarKey(e: KeyboardEvent<HTMLButtonElement>, a: DockAppointment) {
    if (!onMove || !e.shiftKey || !e.key.startsWith('Arrow') || canMove?.(a) === false) return
    e.preventDefault()
    // Time runs along one axis, the docks along the other.
    const [earlier, later, prevDock, nextDock] = vertical
      ? ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      : ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    const index = docks.findIndex((d) => d.id === a.dockId)
    const dock = e.key === prevDock ? docks[index - 1] : e.key === nextDock ? docks[index + 1] : docks[index]
    const start = a.start + (e.key === earlier ? -slotMinutes : e.key === later ? slotMinutes : 0)
    if (!dock) return
    const reason = conflictFor(a, dock, start)
    if (reason) {
      setAnnouncement(`${a.title} can't move to ${dock.name} at ${formatTimeOfDay(start)}: ${reason}`)
      return
    }
    move(a, dock, start)
    // The bar may remount in another lane, so focus follows it there.
    setTimeout(() => rootRef.current?.querySelector<HTMLElement>(`[data-dock-appointment="${CSS.escape(a.id)}"]`)?.focus(), 0)
  }

  /* ----- What fills a dock's lane, in either layout ----- */

  // A block across the whole lane from one time to another: closed time, the
  // slot under the pointer, where a dragged bar would land.
  const across = (start: number, end: number): CSSProperties => {
    const from = pos(start) + 1
    const size = Math.max(pos(end) - pos(start) - 2, 6)
    return vertical
      ? { top: from, height: size, left: COLUMN_PAD, right: COLUMN_PAD }
      : { left: from, width: size, top: lane.inset, bottom: lane.inset }
  }

  // A bar in one lane of its dock (a double booking adds lanes).
  const barPlace = (a: DockAppointment, index: number, lanes: number): CSSProperties => {
    const from = pos(a.start) + 1
    return vertical
      ? {
          top: from,
          height: Math.max(pos(a.end) - pos(a.start) - 2, 16),
          left: `calc(${(index / lanes) * 100}% + ${COLUMN_PAD}px)`,
          width: `calc(${100 / lanes}% - ${COLUMN_PAD * 2}px)`,
        }
      : {
          left: from,
          width: Math.max(pos(a.end) - pos(a.start) - 2, 8),
          top: lane.inset + index * (lane.height - lane.inset),
          height: lane.height - 2 * lane.inset,
        }
  }

  function laneContent(dock: Dock) {
    const bookings = day.filter((a) => a.dockId === dock.id)
    const layout = layoutLanes(bookings)
    const ghost = drop?.dockId === dock.id ? drop : null

    return (
      <>
        {showNow && nowPos > 0 && (
          <div
            aria-hidden
            className="bg-foreground/[0.025] pointer-events-none absolute"
            style={vertical ? { top: 0, left: 0, right: 0, height: nowPos } : { left: 0, top: 0, bottom: 0, width: nowPos }}
          />
        )}

        {dock.outOfService ? (
          <div
            className={cn('bg-muted/40 absolute flex rounded-[5px]', vertical ? 'items-start' : 'items-center')}
            style={{ ...DOCK_HATCH, inset: vertical ? COLUMN_PAD : lane.inset }}
          >
            <span
              className={cn(
                'text-muted-foreground px-2 text-[11px]',
                vertical ? 'py-2' : 'sticky left-[calc(var(--label-w)+0.5rem)] truncate',
              )}
            >
              Out of service · {dock.outOfService}
            </span>
          </div>
        ) : (
          closuresOn(closures, dock.id, date).map((c) => {
            const roomy = vertical ? pos(c.end) - pos(c.start) >= 18 : pos(c.end) - pos(c.start) >= 48
            return (
              <div
                key={c.id}
                title={`${c.label}, ${timeRange(c)}`}
                className={cn(
                  'bg-muted/50 text-muted-foreground absolute flex overflow-hidden rounded-[5px] border border-dashed px-1.5 text-[10px]',
                  vertical ? 'items-start pt-0.5' : 'items-center',
                )}
                style={{ ...DOCK_HATCH, ...across(c.start, c.end) }}
              >
                {roomy && <span className="truncate">{c.label}</span>}
                <span className="sr-only">{`${dock.name} closed ${timeRange(c)}: ${c.label}`}</span>
              </div>
            )
          })
        )}

        {hover?.dockId === dock.id && !draggingId && (
          <div
            aria-hidden
            className="border-foreground/20 bg-accent/70 text-muted-foreground pointer-events-none absolute flex items-center justify-center gap-1 rounded-[5px] border border-dashed text-[10px] tabular-nums"
            style={across(hover.start, hover.start + slotMinutes)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3" />
            {(vertical || slotPx >= 56) && formatTimeOfDay(hover.start)}
          </div>
        )}

        {bookings.map((a) => {
          const conflict = layout.conflicts.has(a.id)
          const movable = !!onMove && canMove?.(a) !== false
          const progress = now !== undefined && a.status === 'at-door' && now > a.start
            ? ((now - a.start) / (a.end - a.start)) * 100
            : undefined
          return (
            <Tooltip key={a.id} open={draggingId ? false : undefined}>
              <TooltipTrigger asChild>
                <DockAppointmentBar
                  appointment={a}
                  colourBy={colourBy}
                  density={density}
                  orientation={orientation}
                  progress={progress}
                  conflict={conflict}
                  selected={selectedId === a.id}
                  data-dock-appointment={a.id}
                  data-dragging={draggingId === a.id}
                  draggable={movable}
                  onDragStart={movable ? (e) => startDrag(e, a) : undefined}
                  onDragEnd={movable ? endDrag : undefined}
                  onClick={() => onOpen?.(a)}
                  onKeyDown={(e) => onBarKey(e, a)}
                  aria-label={`${describe(a, dock)}${conflict ? ', double booked' : ''}`}
                  aria-describedby={movable ? hintId : undefined}
                  className={cn('absolute', movable ? 'cursor-grab active:cursor-grabbing' : !onOpen && 'cursor-default')}
                  style={barPlace(a, layout.laneOf.get(a.id) ?? 0, layout.lanes)}
                />
              </TooltipTrigger>
              <TooltipContent side={vertical ? 'right' : 'top'}>
                <div className="grid gap-0.5">
                  <span className="font-medium">{a.title}</span>
                  <span className="opacity-70">{timeRange(a)} · {formatMinutes(a.end - a.start)} · {dock.name}</span>
                  <span className="opacity-70">
                    {DOCK_DIRECTION[a.direction].label} · {APPOINTMENT_STATUS[a.status].label}
                    {a.subtitle && ` · ${a.subtitle}`}
                  </span>
                  {conflict && <span className="font-medium">Double booked on this dock</span>}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}

        {ghost && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute z-10 flex overflow-hidden rounded-[5px] border-2 border-dashed px-1.5 text-[10px] font-medium tabular-nums',
              vertical ? 'items-start pt-0.5' : 'items-center',
              ghost.reason ? 'border-destructive/70 bg-destructive/10 text-destructive' : 'border-brand/70 bg-brand/10 text-brand',
            )}
            style={across(ghost.start, ghost.end)}
          >
            <span className={vertical ? 'line-clamp-2' : 'truncate'}>{ghost.reason ?? timeRange(ghost)}</span>
          </div>
        )}
      </>
    )
  }

  // A dock's name, what it takes, and how booked it is.
  function dockLabel(dock: Dock) {
    const use = DOCK_USE[dock.use ?? 'both']
    const utilisation = dockUtilisation(dock, date, day, closures, open, close)
    const icon = (
      <span title={use.label} className="text-muted-foreground flex shrink-0">
        <HugeiconsIcon icon={use.icon} strokeWidth={2} className="size-3.5" />
      </span>
    )
    const name = (
      <span className="truncate text-xs font-medium">
        {dock.name}
        <span className="sr-only">, {use.label}</span>
      </span>
    )
    const note = density === 'default' && (dock.outOfService || dock.description) && (
      <span className="text-muted-foreground truncate text-[11px]">{dock.outOfService ? 'Out of service' : dock.description}</span>
    )
    const booked = !dock.outOfService && (
      <span className={cn('text-muted-foreground shrink-0 items-center gap-1 text-[11px] tabular-nums', vertical ? 'ml-auto flex' : 'hidden sm:flex')}>
        <ProgressRing value={utilisation} size={14} strokeWidth={2} colour={utilisation >= 90 ? 'var(--status-progress)' : undefined} />
        {utilisation}%<span className="sr-only"> booked</span>
      </span>
    )
    return vertical ? (
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">{icon}{name}{booked}</div>
        {note}
      </div>
    ) : (
      <>
        {icon}
        <div className="grid min-w-0 flex-1">{name}{note}</div>
        {booked}
      </>
    )
  }

  const hint = onMove && (
    <p id={hintId} className="sr-only">Enter opens it. Shift and the arrow keys move it by one slot or one dock.</p>
  )
  const live = <p aria-live="polite" className="sr-only">{announcement}</p>

  /* ----- Vertical: a column per dock, time down the side ----- */

  if (vertical) {
    const columnWidth = COLUMN_WIDTH[density]
    return (
      <div ref={rootRef} className={cn('relative min-w-0', className)}>
        <div ref={scrollRef} className={cn('max-h-[36rem] overflow-auto overscroll-contain', viewportClassName)}>
          <div
            className="relative w-full [--time-w:3.25rem]"
            style={{
              ['--gutter' as string]: showCapacity ? 'calc(var(--time-w) + 2.75rem)' : 'var(--time-w)',
              minWidth: `calc(var(--gutter) + ${Math.max(docks.length, 1)} * ${columnWidth})`,
            }}
          >
            <div ref={headRef} className="bg-card sticky top-0 z-30 flex border-b">
              <div className="bg-card text-muted-foreground sticky left-0 z-10 flex w-(--gutter) shrink-0 items-end border-r pb-1.5 text-[11px] font-medium">
                <span className="w-(--time-w) px-2">Time</span>
                {showCapacity && <span className="flex-1 text-center">Free</span>}
              </div>
              {docks.map((dock, i) => (
                <div key={dock.id} className={cn('min-w-0 flex-1 basis-0 px-2 py-1.5', i > 0 && 'border-l')}>
                  {dockLabel(dock)}
                </div>
              ))}
            </div>

            <div className="relative flex">
              {/* The slot grid, behind the lanes. */}
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-(--gutter)">
                {slots.slice(1).map((t) => (
                  <div
                    key={t}
                    className={cn('absolute inset-x-0 border-t', t % 60 === 0 ? 'border-foreground/10' : 'border-dashed')}
                    style={{ top: pos(t) }}
                  />
                ))}
              </div>

              <div className="bg-card sticky left-0 z-20 flex w-(--gutter) shrink-0 border-r" style={{ height: length }}>
                <div aria-hidden className="relative w-(--time-w) shrink-0">
                  {hours.map((h) => (
                    <span
                      key={h}
                      className={cn(
                        'text-muted-foreground absolute right-2 text-[10px] tabular-nums',
                        h === open ? 'translate-y-0.5' : '-translate-y-1/2',
                        // A label the now pill would cover gives way to it.
                        showNow && Math.abs(pos(h) - nowPos) < 12 && 'invisible',
                      )}
                      style={{ top: pos(h) }}
                    >
                      {formatTimeOfDay(h)}
                    </span>
                  ))}
                </div>
                {showCapacity && (
                  <div aria-hidden className="relative min-w-0 flex-1 border-l">
                    {capacity.map((c) => (
                      <span
                        key={c.start}
                        title={c.title}
                        className={cn(
                          'absolute inset-x-0 flex items-center justify-center text-[10px] tabular-nums',
                          c.past && 'opacity-40',
                          c.full && 'bg-destructive/[0.06]',
                        )}
                        style={{ top: pos(c.start), height: slotPx }}
                      >
                        <span className={capacityTone(c)}>{capacityText(c)}</span>
                      </span>
                    ))}
                  </div>
                )}
                {showNow && (
                  <TimeMarker
                    orientation="horizontal"
                    label={formatTimeOfDay(now)}
                    tone="destructive"
                    description={`Now, ${formatTimeOfDay(now)}`}
                    className="right-0 left-1"
                    style={{ top: nowPos }}
                  />
                )}
              </div>

              {docks.map((dock, i) => (
                <div
                  key={dock.id}
                  className={cn('relative min-w-0 flex-1 basis-0', i > 0 && 'border-l', hover?.dockId === dock.id && 'cursor-pointer')}
                  style={{ height: length }}
                  {...trackHandlers(dock)}
                >
                  {laneContent(dock)}
                </div>
              ))}

              {showNow && (
                <TimeMarker orientation="horizontal" tone="destructive" className="right-0 left-(--gutter)" style={{ top: nowPos }} />
              )}

              {docks.length === 0 && (
                <div className="text-muted-foreground flex flex-1 items-center justify-center text-xs">No docks to show</div>
              )}
            </div>
          </div>
        </div>
        {hint}
        {live}
      </div>
    )
  }

  /* ----- Horizontal: a row per dock, time across the top ----- */

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <div ref={scrollRef} className={cn('overflow-x-auto overscroll-x-contain', viewportClassName)}>
        <div className="relative w-max min-w-full [--label-w:7.5rem] sm:[--label-w:12rem]">
          {/* The slot grid, behind everything. Hours run through the header, slots start under it. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: 'var(--label-w)', width: length }}>
            {slots.slice(1).map((t) => (
              <div
                key={t}
                className={cn('absolute bottom-0 border-l', t % 60 === 0 ? 'border-foreground/10 top-0' : 'top-7 border-dashed')}
                style={{ left: pos(t) }}
              />
            ))}
          </div>

          {showNow && (
            <TimeMarker
              label={formatTimeOfDay(now)}
              tone="destructive"
              description={`Now, ${formatTimeOfDay(now)}`}
              className="top-1.5 bottom-0"
              style={{ left: `calc(var(--label-w) + ${nowPos}px)` }}
            />
          )}

          <div className="flex h-7 border-b">
            <div
              ref={headRef}
              className="bg-card text-muted-foreground sticky left-0 z-20 flex w-(--label-w) shrink-0 items-center border-r px-3 text-[11px] font-medium"
            >
              Dock
            </div>
            <div aria-hidden className="relative shrink-0" style={{ width: length }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className={cn(
                    'text-muted-foreground absolute inset-y-0 flex items-center pl-1.5 text-[10px] tabular-nums',
                    // A label the now pill would half cover gives way to it.
                    showNow && pos(h) + 38 > nowPos - 22 && pos(h) < nowPos + 22 && 'invisible',
                  )}
                  style={{ left: pos(h) }}
                >
                  {formatTimeOfDay(h)}
                </span>
              ))}
            </div>
          </div>

          {showCapacity && (
            <div aria-hidden className="flex h-7 border-b">
              <div className="bg-card text-muted-foreground sticky left-0 z-20 flex w-(--label-w) shrink-0 items-center border-r px-3 text-[11px]">
                Free docks
              </div>
              <div className="relative shrink-0" style={{ width: length }}>
                {capacity.map((c) => (
                  <span
                    key={c.start}
                    title={c.title}
                    className={cn('absolute inset-y-0 flex items-center justify-center text-[10px] tabular-nums', c.past && 'opacity-40')}
                    style={{ left: pos(c.start), width: slotPx }}
                  >
                    <span className={capacityTone(c)}>{capacityText(c)}</span>
                    {!c.closed && (
                      <span className="bg-foreground/5 absolute inset-x-1.5 bottom-1 h-0.5 overflow-hidden rounded-full">
                        <span
                          className={cn('block h-full rounded-full', c.full ? 'bg-destructive' : c.free === 1 ? 'bg-status-progress' : 'bg-brand/60')}
                          style={{ width: `${c.share * 100}%` }}
                        />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {docks.map((dock) => {
            const lanes = layoutLanes(day.filter((a) => a.dockId === dock.id)).lanes
            return (
              <div key={dock.id} className="flex border-b last:border-b-0" style={{ height: lanes * (lane.height - lane.inset) + lane.inset }}>
                <div className="bg-card sticky left-0 z-20 flex w-(--label-w) shrink-0 items-center gap-2 border-r px-2.5 sm:px-3">
                  {dockLabel(dock)}
                </div>
                <div
                  className={cn('relative shrink-0', hover?.dockId === dock.id && 'cursor-pointer')}
                  style={{ width: length }}
                  {...trackHandlers(dock)}
                >
                  {laneContent(dock)}
                </div>
              </div>
            )
          })}

          {docks.length === 0 && (
            <div className="text-muted-foreground flex h-24 items-center justify-center text-xs">No docks to show</div>
          )}
        </div>
      </div>
      {hint}
      {live}
    </div>
  )
}

/* ---------- Legend ---------- */

// The key under a schedule: the bar colours for the chosen colouring, closed
// time and the now line.
export function DockScheduleLegend({ colourBy = 'status', closed = true, now = true, className }: {
  colourBy?: DockColourBy
  closed?: boolean
  now?: boolean
  className?: string
}) {
  const items = colourBy === 'status'
    ? APPOINTMENT_STATUS_ORDER.map((s) => ({ key: s, label: APPOINTMENT_STATUS[s].label, colour: APPOINTMENT_STATUS[s].colour, hollow: s === 'no-show' }))
    : (['inbound', 'outbound'] as const).map((d) => ({ key: d, label: DOCK_DIRECTION[d].label, colour: DOCK_DIRECTION[d].colour, hollow: false }))

  return (
    <LegendRow className={className}>
      {items.map((i) => (
        <span key={i.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn('h-2.5 w-4 rounded-[3px] border border-l-[3px]', i.hollow && 'border-dashed')}
            style={{
              backgroundColor: i.hollow ? 'transparent' : tint(i.colour, 16),
              borderColor: `color-mix(in oklch, ${i.colour} ${i.hollow ? 55 : 32}%, transparent)`,
              borderLeftColor: i.colour,
            }}
          />
          {i.label}
        </span>
      ))}
      {closed && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-muted/50 h-2.5 w-4 rounded-[3px] border border-dashed" style={DOCK_HATCH} />
          Closed
        </span>
      )}
      {now && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-destructive h-3 w-px" />
          Now
        </span>
      )}
    </LegendRow>
  )
}
