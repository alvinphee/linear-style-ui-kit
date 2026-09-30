import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Status } from '../data'
import { Section } from './shared'
import { Initials, StatusIcon } from './StatusSection'

// All dates are UTC midnights so day maths never trips over a DST change.
const DAY = 86_400_000
const date = (month: number, day: number) => Date.UTC(2026, month - 1, day)
const START = date(9, 1)
const END = date(12, 31)
const TODAY = date(9, 30)
const TOTAL_DAYS = Math.round((END - START) / DAY) + 1
const dayIndex = (t: number) => Math.round((t - START) / DAY)

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })

type Milestone = { name: string; date: number }
type Project = {
  id: string
  name: string
  lead: string
  status: Status
  start: number
  end: number
  progress: number
  // Fixed like label colours: a project reads the same in every theme.
  colour: string
  milestones: Milestone[]
}

// Made-up projects.
const PROJECTS: Project[] = [
  {
    id: 'onboarding', name: 'New onboarding', lead: 'Mei Ling', status: 'done',
    start: date(9, 1), end: date(9, 25), progress: 100, colour: 'oklch(0.62 0.15 250)',
    milestones: [{ name: 'Shipped to all workspaces', date: date(9, 25) }],
  },
  {
    id: 'billing', name: 'Usage-based billing', lead: 'Daniel', status: 'progress',
    start: date(9, 8), end: date(10, 23), progress: 62, colour: 'oklch(0.6 0.17 300)',
    milestones: [{ name: 'Invoices beta', date: date(10, 5) }],
  },
  {
    id: 'mobile', name: 'Mobile app', lead: 'Siti', status: 'progress',
    start: date(9, 15), end: date(11, 27), progress: 34, colour: 'oklch(0.7 0.12 215)',
    milestones: [{ name: 'Internal beta', date: date(10, 16) }, { name: 'Store release', date: date(11, 27) }],
  },
  {
    id: 'design', name: 'Design system 2.0', lead: 'Ravi', status: 'progress',
    start: date(9, 21), end: date(12, 11), progress: 18, colour: 'oklch(0.68 0.14 155)',
    milestones: [{ name: 'Tokens frozen', date: date(10, 30) }],
  },
  {
    id: 'search', name: 'Search API', lead: 'Ali', status: 'todo',
    start: date(10, 12), end: date(11, 20), progress: 0, colour: 'oklch(0.74 0.15 70)',
    milestones: [{ name: 'Public docs', date: date(11, 20) }],
  },
  {
    id: 'audit', name: 'Audit log', lead: 'Mei Ling', status: 'backlog',
    start: date(11, 9), end: date(12, 18), progress: 0, colour: 'oklch(0.65 0.18 10)',
    milestones: [],
  },
]

const MONTHS = [9, 10, 11, 12].map((m) => ({
  key: m,
  label: monthName.format(date(m, 1)),
  offset: dayIndex(date(m, 1)),
  days: new Date(Date.UTC(2026, m, 0)).getUTCDate(),
}))

const DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => new Date(START + i * DAY))
const MONDAYS = DAYS.flatMap((d, i) => (d.getUTCDay() === 1 ? [{ index: i, label: d.getUTCDate() }] : []))
const WEEKENDS = DAYS.flatMap((d, i) => (d.getUTCDay() === 0 || d.getUTCDay() === 6 ? [i] : []))

type Zoom = 'weeks' | 'months'
const WEEK_PX = 22
const MIN_MONTH_PX = 6
// Below this width a bar's name moves outside it.
const LABEL_INSIDE_PX = 96

export default function RoadmapSection() {
  const [zoom, setZoom] = useState<Zoom>('weeks')
  const [trackSpace, setTrackSpace] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () => setTrackSpace(el.clientWidth - (labelRef.current?.offsetWidth ?? 0))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Months fits the whole range into the card; floor it so rounding never adds a scrollbar.
  const px = zoom === 'weeks'
    ? WEEK_PX
    : Math.max(MIN_MONTH_PX, Math.floor((trackSpace / TOTAL_DAYS) * 100) / 100)
  const trackWidth = TOTAL_DAYS * px
  const todayX = (dayIndex(TODAY) + 0.5) * px

  const scrollTo = useCallback((x: number, behavior: ScrollBehavior) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: Math.max(0, x), behavior })
  }, [])

  const scrollToToday = useCallback((behavior: ScrollBehavior) => {
    const visible = (scrollRef.current?.clientWidth ?? 0) - (labelRef.current?.offsetWidth ?? 0)
    scrollTo(todayX - visible / 3, behavior)
  }, [scrollTo, todayX])

  // Keep today in view whenever the scale changes.
  useLayoutEffect(() => {
    scrollToToday('auto')
  }, [scrollToToday])

  return (
    <Section id="roadmap" title="Roadmap" description="A timeline of projects">
      <article className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={zoom}
            onValueChange={(v) => v && setZoom(v as Zoom)}
            aria-label="Zoom"
          >
            <ToggleGroupItem value="weeks">Weeks</ToggleGroupItem>
            <ToggleGroupItem value="months">Months</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={() => scrollToToday('smooth')}>
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} data-icon="inline-start" />
            Today
          </Button>
          <span className="text-muted-foreground text-xs">
            Sep – Dec 2026 · {PROJECTS.length} projects
          </span>
          <div className="text-muted-foreground ml-auto hidden items-center gap-3 text-[11px] md:flex">
            <span className="flex items-center gap-1.5">
              <span className="relative h-2 w-4 overflow-hidden rounded-sm bg-[color-mix(in_oklch,var(--muted-foreground)_25%,var(--card))]">
                <span className="bg-muted-foreground/60 absolute inset-y-0 left-0 w-2" />
              </span>
              Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="border-muted-foreground bg-card size-2 rotate-45 rounded-[1px] border-[1.5px]" />
              Milestone
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-brand h-3 w-px" />
              Today
            </span>
          </div>
        </header>

        <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain">
          <div className="relative w-max min-w-full [--label-w:8.5rem] sm:[--label-w:12rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0"
              style={{ left: 'var(--label-w)', width: trackWidth }}
            >
              {zoom === 'weeks' && WEEKENDS.map((i) => (
                <div key={i} className="bg-muted/50 absolute top-11 bottom-0" style={{ left: i * px, width: px }} />
              ))}
              {MONDAYS.map((w) => (
                <div key={w.index} className="absolute top-6 bottom-0 border-l border-dashed" style={{ left: w.index * px }} />
              ))}
              {/* The first month starts at the label column border, which already draws a line. */}
              {MONTHS.slice(1).map((m) => (
                <div key={m.key} className="border-foreground/10 absolute inset-y-0 border-l" style={{ left: m.offset * px }} />
              ))}
            </div>

            {/* Before the rows, so the last row stays :last-child. */}
            <div
              aria-hidden
              className="bg-brand pointer-events-none absolute top-10 bottom-0 z-10 w-px"
              style={{ left: `calc(var(--label-w) + ${todayX}px)` }}
            />

            <div className="flex h-11 border-b">
              <div
                ref={labelRef}
                className="bg-card text-muted-foreground sticky left-0 z-20 flex w-(--label-w) shrink-0 items-end border-r px-3 pb-1.5 text-[11px] font-medium"
              >
                Project
              </div>
              <div className="relative shrink-0" style={{ width: trackWidth }}>
                {MONTHS.map((m) => (
                  <div
                    key={m.key}
                    className="absolute top-0 flex h-6 items-center truncate px-2 text-xs font-medium"
                    style={{ left: m.offset * px, width: m.days * px }}
                  >
                    {m.label}
                  </div>
                ))}
                {MONDAYS.map((w) => (
                  <div
                    key={w.index}
                    className="text-muted-foreground absolute bottom-0 flex h-5 items-center pl-1 text-[10px] tabular-nums"
                    style={{ left: w.index * px }}
                  >
                    {w.label}
                  </div>
                ))}
                <div
                  className="bg-brand text-primary-foreground absolute bottom-1 z-10 -translate-x-1/2 rounded px-1.5 text-[10px] leading-4 font-medium"
                  style={{ left: todayX }}
                >
                  Today
                </div>
              </div>
            </div>

            {PROJECTS.map((p) => (
              <ProjectRow key={p.id} project={p} px={px} onJump={(x) => scrollTo(x - 16, 'smooth')} />
            ))}

          </div>
        </div>
      </article>
    </Section>
  )
}

function ProjectRow({ project: p, px, onJump }: { project: Project; px: number; onJump: (x: number) => void }) {
  const days = dayIndex(p.end) - dayIndex(p.start) + 1
  const left = dayIndex(p.start) * px
  const width = days * px
  const inside = width >= LABEL_INSIDE_PX
  const range = `${shortDate.format(p.start)} → ${shortDate.format(p.end)}`

  return (
    <div className="flex h-10 border-b last:border-b-0">
      <div className="bg-card sticky left-0 z-20 flex w-(--label-w) shrink-0 items-center gap-2 border-r px-3">
        <StatusIcon status={p.status} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.name}</span>
        <Initials name={p.lead} className="hidden size-5 sm:flex" />
      </div>

      <div className="relative shrink-0" style={{ width: TOTAL_DAYS * px }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onJump(left)}
              aria-label={`${p.name}: ${range}, ${p.progress}% complete`}
              className="hover:ring-foreground/15 focus-visible:ring-ring/50 absolute top-2 flex h-6 items-center overflow-hidden rounded-md border text-left outline-none hover:ring-2 focus-visible:ring-2"
              style={{
                left,
                width,
                backgroundColor: `color-mix(in oklch, ${p.colour} 20%, var(--card))`,
                borderColor: `color-mix(in oklch, ${p.colour} 55%, transparent)`,
              }}
            >
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${p.progress}%`,
                  backgroundColor: `color-mix(in oklch, ${p.colour} 48%, var(--card))`,
                }}
              />
              {inside && (
                <span className="relative flex min-w-0 flex-1 items-center gap-2 px-2 text-[11px] font-medium">
                  <span className="truncate">{p.name}</span>
                  {width >= 150 && <span className="ml-auto tabular-nums opacity-60">{p.progress}%</span>}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="grid gap-0.5">
              <span className="font-medium">{p.name}</span>
              <span className="opacity-70">{range} · {days} days</span>
              <span className="opacity-70">{p.progress}% complete · Lead: {p.lead}</span>
            </div>
          </TooltipContent>
        </Tooltip>

        {!inside && (
          <span
            className="text-muted-foreground pointer-events-none absolute top-2 flex h-6 items-center text-[11px] whitespace-nowrap"
            style={{ left: left + width + 6 }}
          >
            {p.name}
          </span>
        )}

        {p.milestones.map((m) => (
          <Tooltip key={m.name}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Milestone: ${m.name}, ${shortDate.format(m.date)}`}
                className="bg-card focus-visible:ring-ring/50 absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border-2 outline-none after:absolute after:-inset-1.5 focus-visible:ring-2"
                style={{ left: (dayIndex(m.date) + 0.5) * px, borderColor: p.colour }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="grid gap-0.5">
                <span className="font-medium">{m.name}</span>
                <span className="opacity-70">{shortDate.format(m.date)} · {p.name}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
