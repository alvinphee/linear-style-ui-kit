import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GANTT_LABEL, GanttBar } from '@/components/gantt-bar'
import { MilestoneMarker } from '@/components/milestone-marker'
import { TimeMarker } from '@/components/time-marker'
import { formatShortDate } from '@/lib/format'

// A Gantt chart: items as bars on a timeline of days, filled in as far as
// they have got, with milestones as diamonds, weekends shaded and a line at
// today. Weeks is a fixed scale that scrolls sideways; Months fits the whole
// range into the card at any width. The column of names stays put while the
// timeline scrolls, and today stays in view until the viewer scrolls away.
//
// Dates are UTC midnights (Date.UTC(2026, 8, 1)), so day maths never trips
// over a daylight-saving change; an item's end is its last day. Draw a row's
// cell in the names column with `renderLabel` (a status icon, the name, an
// avatar…) and add to a bar's tooltip with `details`. Clicking a bar scrolls
// to its start, unless you pass `onItemClick`.

export type GanttMilestone = { name: string; date: number }

export type GanttItem = {
  id: string
  name: string
  // The first and last day, as UTC midnights.
  start: number
  end: number
  // 0 to 100.
  progress?: number
  // Any CSS colour. Fixed, like label colours, so an item reads the same in every theme.
  colour: string
  milestones?: GanttMilestone[]
}

// weeks: a fixed scale that scrolls. months: the whole range fits the card.
export type GanttZoom = 'weeks' | 'months'

const DAY = 86_400_000
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })

const WEEK_PX = 22
// Below this width a bar's name always goes beside it.
const LABEL_INSIDE_PX = 96
// The room a bar's "62%" needs after its name, with the gap before it.
const PROGRESS_ROOM = 36
// Narrower weeks than this would crowd their dates and lines, so only months show.
const MIN_WEEK_PX = 20
// A month narrower than this shows as "Sep" instead of "September".
const LONG_MONTH_PX = 80
// The room a Monday's date needs: "28" and its padding.
const WEEK_LABEL_PX = 18
// Half a milestone diamond's width, plus a little room.
const MARK_R = 9
// A milestone this close to either end of a bar pushes the bar's text inward.
const MARK_EDGE = 56
// The gap between a bar and a name drawn beside it.
const NAME_GAP = 6

// The days from `start` to `end`, cut into months and weeks.
function timescale(start: number, end: number) {
  const index = (t: number) => Math.round((t - start) / DAY)
  const totalDays = index(end) + 1
  const days = Array.from({ length: totalDays }, (_, i) => new Date(start + i * DAY))

  const months: { key: string; label: string; short: string; offset: number; days: number }[] = []
  for (let first = start; first <= end;) {
    const d = new Date(first)
    const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
    const label = MONTH.format(d)
    // Not Intl's short form: newer en-GB data writes "Sept".
    months.push({ key: label + d.getUTCFullYear(), label, short: label.slice(0, 3), offset: index(first), days: index(Math.min(next - DAY, end)) - index(first) + 1 })
    first = next
  }

  return {
    index,
    totalDays,
    months,
    mondays: days.flatMap((d, i) => (d.getUTCDay() === 1 ? [{ index: i, label: d.getUTCDate() }] : [])),
    weekends: days.flatMap((d, i) => (d.getUTCDay() === 0 || d.getUTCDay() === 6 ? [i] : [])),
  }
}

type Scale = ReturnType<typeof timescale>

export function GanttChart<T extends GanttItem>({
  items, start, end, today, defaultZoom = 'weeks', labelHeading = 'Name', summary, legend = true,
  empty = 'Nothing scheduled', renderLabel, details, onItemClick, className,
}: {
  items: T[]
  // The first and last day shown, as UTC midnights.
  start: number
  end: number
  // Marked with a line, and the chart opens with it in view. Outside the
  // range, or left out, there is no line and the chart opens at the start.
  today?: number
  defaultZoom?: GanttZoom
  // Over the names column: Project, Task…
  labelHeading?: string
  // Beside the zoom switch: "Sep – Dec 2026 · 6 projects".
  summary?: ReactNode
  // The key at the right of the toolbar (wide screens only).
  legend?: boolean
  // Shown when there are no items.
  empty?: ReactNode
  // A row's cell in the names column. The name alone if left out.
  renderLabel?: (item: T) => ReactNode
  // Added to the last line of a bar's tooltip: "Lead: Daniel".
  details?: (item: T) => ReactNode
  onItemClick?: (item: T) => void
  className?: string
}) {
  const [zoom, setZoom] = useState(defaultZoom)
  const [trackSpace, setTrackSpace] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  // Today stays in view (on load, on a zoom change and when the card resizes)
  // until the viewer scrolls the timeline themselves.
  const followToday = useRef(true)
  const stopFollowing = () => {
    followToday.current = false
  }

  const scale = useMemo(() => timescale(start, end), [start, end])
  const hasToday = today !== undefined && today >= start && today <= end

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setTrackSpace(el.clientWidth - (labelRef.current?.offsetWidth ?? 0))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Months fits the whole range into the card at any width; floor it so rounding never adds a scrollbar.
  const px = zoom === 'weeks'
    ? WEEK_PX
    : Math.max(0, Math.floor((trackSpace / scale.totalDays) * 100) / 100)
  const showWeeks = 7 * px >= MIN_WEEK_PX
  const trackWidth = scale.totalDays * px
  const todayX = hasToday ? (scale.index(today) + 0.5) * px : 0

  const scrollTo = useCallback((x: number, behavior: ScrollBehavior) => {
    scrollRef.current?.scrollTo({ left: Math.max(0, x), behavior })
  }, [])

  // Today a third of the way in, or the start when today is not on the chart.
  const scrollToToday = useCallback((behavior: ScrollBehavior) => {
    const visible = (scrollRef.current?.clientWidth ?? 0) - (labelRef.current?.offsetWidth ?? 0)
    scrollTo(hasToday ? todayX - visible / 3 : 0, behavior)
  }, [scrollTo, todayX, hasToday])

  // trackSpace changes whenever the card resizes.
  useLayoutEffect(() => {
    if (followToday.current) scrollToToday('auto')
  }, [scrollToToday, trackSpace])

  return (
    <article className={cn('bg-card min-w-0 overflow-hidden rounded-lg border', className)}>
      <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={zoom}
          onValueChange={(v) => {
            if (!v) return
            followToday.current = true
            setZoom(v as GanttZoom)
          }}
          aria-label="Zoom"
        >
          <ToggleGroupItem value="weeks">Weeks</ToggleGroupItem>
          <ToggleGroupItem value="months">Months</ToggleGroupItem>
        </ToggleGroup>
        {hasToday && (
          <Button
            variant="outline"
            onClick={() => {
              followToday.current = true
              scrollToToday('smooth')
            }}
          >
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} data-icon="inline-start" />
            Today
          </Button>
        )}
        {summary && <span className="text-muted-foreground text-xs">{summary}</span>}
        {legend && <GanttLegend today={hasToday} />}
      </header>

      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain"
        onWheel={(e) => {
          // Only a sideways scroll: an up-down wheel over the chart scrolls the page.
          if (e.deltaX || e.shiftKey) stopFollowing()
        }}
        onPointerDown={stopFollowing}
        onKeyDown={stopFollowing}
      >
        <div className="relative w-max min-w-full [--gantt-sticky-left:calc(var(--label-w)+8px)] [--label-w:8.5rem] sm:[--label-w:12rem]">
          <GanttGrid scale={scale} px={px} weekends={zoom === 'weeks'} weeks={showWeeks} />

          {/* Before the rows, so the last row stays :last-child. Clipped to the
              timeline, so the pill never widens the chart on its first or last day. */}
          {hasToday && (
            <div className="pointer-events-none absolute inset-y-0 overflow-hidden" style={{ left: 'var(--label-w)', width: trackWidth }}>
              <TimeMarker
                label="Today"
                description={`Today, ${formatShortDate(today, { utc: true })}`}
                className="top-6 bottom-0"
                style={{ left: todayX }}
              />
            </div>
          )}

          <div className="flex h-11 border-b">
            <div
              ref={labelRef}
              className="bg-card text-muted-foreground sticky left-0 z-20 flex w-(--label-w) shrink-0 items-end border-r px-3 pb-1.5 text-[11px] font-medium"
            >
              {labelHeading}
            </div>
            <GanttTimescale scale={scale} px={px} weeks={showWeeks} />
          </div>

          {items.map((item) => (
            <GanttRow
              key={item.id}
              item={item}
              scale={scale}
              px={px}
              renderLabel={renderLabel}
              details={details}
              onClick={(left) => (onItemClick ? onItemClick(item) : scrollTo(left - 16, 'smooth'))}
            />
          ))}
          {items.length === 0 && (
            <div className="flex h-20">
              <div className="bg-card sticky left-0 z-20 w-(--label-w) shrink-0 border-r" />
              <p className="text-muted-foreground bg-card sticky left-(--label-w) z-20 self-center px-3 text-xs">{empty}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// The key: what the shaded fill, the diamond and the line mean.
function GanttLegend({ today }: { today: boolean }) {
  return (
    <div className="text-muted-foreground ml-auto hidden items-center gap-3 text-[11px] md:flex">
      <span className="flex items-center gap-1.5">
        <span className="relative h-2 w-4 overflow-hidden rounded-sm bg-[color-mix(in_oklch,var(--muted-foreground)_25%,var(--card))]">
          <span className="bg-muted-foreground/60 absolute inset-y-0 left-0 w-2" />
        </span>
        Progress
      </span>
      <span className="flex items-center gap-1.5">
        <MilestoneMarker size="sm" />
        Milestone
      </span>
      {today && (
        <span className="flex items-center gap-1.5">
          <span className="bg-brand h-3 w-px" />
          Today
        </span>
      )}
    </div>
  )
}

// Behind the rows: weekends shaded, a dashed line each Monday, a solid one each month.
function GanttGrid({ scale, px, weekends, weeks }: { scale: Scale; px: number; weekends: boolean; weeks: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0"
      style={{ left: 'var(--label-w)', width: scale.totalDays * px }}
    >
      {weekends && scale.weekends.map((i) => (
        <div key={i} className="bg-muted/50 absolute top-11 bottom-0" style={{ left: i * px, width: px }} />
      ))}
      {weeks && scale.mondays.map((w) => (
        <div key={w.index} className="absolute top-6 bottom-0 border-l border-dashed" style={{ left: w.index * px }} />
      ))}
      {/* The first month starts at the names column's border, which already draws a line. */}
      {scale.months.slice(1).map((m) => (
        <div key={m.key} className="border-foreground/10 absolute inset-y-0 border-l" style={{ left: m.offset * px }} />
      ))}
    </div>
  )
}

// The header over the timeline: month names, and each Monday's date under them.
function GanttTimescale({ scale, px, weeks }: { scale: Scale; px: number; weeks: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: scale.totalDays * px }}>
      {scale.months.map((m) => (
        <div
          key={m.key}
          className="absolute top-0 h-6 truncate px-2 text-xs leading-6 font-medium"
          style={{ left: m.offset * px, width: m.days * px }}
        >
          {m.days * px >= LONG_MONTH_PX ? m.label : m.short}
        </div>
      ))}
      {/* A Monday too near the end has no room for its date, which would widen the chart. */}
      {weeks && scale.mondays.filter((w) => (scale.totalDays - w.index) * px >= WEEK_LABEL_PX).map((w) => (
        <div
          key={w.index}
          className="text-muted-foreground absolute bottom-0 flex h-5 items-center pl-1 text-[10px] tabular-nums"
          style={{ left: w.index * px }}
        >
          {w.label}
        </div>
      ))}
    </div>
  )
}

// One item: its cell in the names column, its bar, its milestones, and its
// name beside the bar when it doesn't fit inside.
function GanttRow<T extends GanttItem>({ item, scale, px, renderLabel, details, onClick }: {
  item: T
  scale: Scale
  px: number
  renderLabel?: (item: T) => ReactNode
  details?: (item: T) => ReactNode
  onClick: (left: number) => void
}) {
  const first = scale.index(item.start)
  const days = scale.index(item.end) - first + 1
  const left = first * px
  const width = days * px
  const trackWidth = scale.totalDays * px
  const progress = item.progress ?? 0
  const milestones = item.milestones ?? []
  const range = `${formatShortDate(item.start, { utc: true })} → ${formatShortDate(item.end, { utc: true })}`
  const more = details?.(item)

  // So a milestone never covers the bar's text: one near either end pushes the
  // text inward, and one in the middle ends the name. One on the first or last
  // day sticks out past the bar, and a name beside the bar keeps clear of it.
  let padLeft = 8
  let padRight = 8
  let nameEnd = width
  let overLeft = 0
  let overRight = 0
  for (const m of milestones) {
    const x = (scale.index(m.date) - first + 0.5) * px
    overLeft = Math.max(overLeft, MARK_R - x)
    overRight = Math.max(overRight, x + MARK_R - width)
    if (x < width / 2 && x < MARK_EDGE) padLeft = Math.max(padLeft, x + MARK_R)
    else if (x >= width / 2 && x > width - MARK_EDGE) padRight = Math.max(padRight, width - x + MARK_R)
    else nameEnd = Math.min(nameEnd, x - MARK_R)
  }

  // The name's full width, from a hidden copy in the bar's type.
  const measureRef = useRef<HTMLSpanElement>(null)
  const [nameWidth, setNameWidth] = useState(0)
  useLayoutEffect(() => {
    let live = true
    const measure = () => {
      if (live && measureRef.current) setNameWidth(measureRef.current.offsetWidth)
    }
    measure()
    // Inter may still be loading; measure again once it has.
    document.fonts.ready.then(measure)
    return () => {
      live = false
    }
  }, [item.name])

  // The name goes inside the bar when it fits before any milestone in the way.
  // If not, it goes beside the bar when it fits there: after it, or before it
  // when the timeline ends first, so it never makes the chart wider. Failing
  // both, it stays inside, cut short.
  const roomInside = Math.min(nameEnd, width - padRight) - padLeft
  const nameLeft = left + width + overRight + NAME_GAP
  const nameRight = trackWidth - left + overLeft + NAME_GAP
  const roomAfter = Math.max(0, trackWidth - nameLeft)
  const roomBefore = Math.max(0, trackWidth - nameRight)
  const inside = width >= LABEL_INSIDE_PX && (nameWidth <= roomInside || Math.max(roomAfter, roomBefore) < nameWidth)
  const nameAfter = roomAfter >= nameWidth || roomAfter >= roomBefore
  const showProgress = width >= 150 && width - padLeft - padRight - nameWidth >= PROGRESS_ROOM

  return (
    <div className="flex h-10 border-b last:border-b-0">
      <div className="bg-card sticky left-0 z-20 flex w-(--label-w) shrink-0 items-center gap-2 border-r px-3">
        {renderLabel ? renderLabel(item) : <span className="min-w-0 flex-1 truncate text-xs font-medium">{item.name}</span>}
      </div>

      <div className="relative shrink-0" style={{ width: trackWidth }}>
        {/* Anchored right: if it is wider than the timeline, it overflows to the left, which never scrolls. */}
        <span ref={measureRef} aria-hidden className={cn(GANTT_LABEL, 'invisible absolute top-0 right-0 w-max whitespace-nowrap')}>
          {item.name}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <GanttBar
              colour={item.colour}
              progress={progress}
              label={inside ? item.name : undefined}
              showProgress={inside && showProgress}
              inset={{ start: padLeft, end: padRight, labelEnd: nameEnd < width ? nameEnd : undefined }}
              onClick={() => onClick(left)}
              aria-label={`${item.name}: ${range}, ${progress}% complete`}
              className="absolute top-2"
              style={{ left, width }}
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="grid gap-0.5">
              <span className="font-medium">{item.name}</span>
              <span className="opacity-70">{range} · {days} days</span>
              <span className="opacity-70">{progress}% complete{more && <> · {more}</>}</span>
            </div>
          </TooltipContent>
        </Tooltip>

        {!inside && (
          <span
            className={cn(GANTT_LABEL, 'text-muted-foreground pointer-events-none absolute top-2 h-6 truncate leading-6')}
            style={nameAfter ? { left: nameLeft, maxWidth: roomAfter } : { right: nameRight, maxWidth: roomBefore }}
          >
            {item.name}
          </span>
        )}

        {milestones.map((m) => (
          <Tooltip key={m.name}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Milestone: ${m.name}, ${formatShortDate(m.date, { utc: true })}`}
                className="focus-visible:ring-ring/50 absolute top-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm outline-none focus-visible:ring-2"
                style={{ left: (scale.index(m.date) + 0.5) * px }}
              >
                <MilestoneMarker colour={item.colour} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="grid gap-0.5">
                <span className="font-medium">{m.name}</span>
                <span className="opacity-70">{formatShortDate(m.date, { utc: true })} · {item.name}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
