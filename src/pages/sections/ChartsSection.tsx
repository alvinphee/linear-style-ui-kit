import { useEffect, useId, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Panel, Section } from './shared'

// Made-up numbers. 19–20 and 26–27 Sep are weekends, hence the dips.
const DAILY = [
  { day: '17 Sep', completed: 14 }, { day: '18 Sep', completed: 16 }, { day: '19 Sep', completed: 6 },
  { day: '20 Sep', completed: 4 }, { day: '21 Sep', completed: 17 }, { day: '22 Sep', completed: 19 },
  { day: '23 Sep', completed: 15 }, { day: '24 Sep', completed: 21 }, { day: '25 Sep', completed: 18 },
  { day: '26 Sep', completed: 7 }, { day: '27 Sep', completed: 5 }, { day: '28 Sep', completed: 20 },
  { day: '29 Sep', completed: 23 }, { day: '30 Sep', completed: 22 },
]

const WEEKLY = [
  { week: '24 Aug', done: 14, progress: 6, todo: 10 },
  { week: '31 Aug', done: 17, progress: 8, todo: 9 },
  { week: '7 Sep', done: 15, progress: 9, todo: 7 },
  { week: '14 Sep', done: 21, progress: 7, todo: 8 },
  { week: '21 Sep', done: 19, progress: 10, todo: 6 },
  { week: '28 Sep', done: 24, progress: 8, todo: 5 },
]

const SCOPE = 34
const CYCLE_DAYS = [
  '22 Sep', '23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep', '30 Sep',
  '1 Oct', '2 Oct', '3 Oct', '4 Oct', '5 Oct',
]
const TODAY = '30 Sep'
const REMAINING = [34, 33, 31, 30, 27, 24, 22, 19, 16]
const BURNDOWN = CYCLE_DAYS.map((day, i) => ({
  day,
  ideal: Math.round((SCOPE - (SCOPE * i) / (CYCLE_DAYS.length - 1)) * 10) / 10,
  remaining: REMAINING[i] ?? null,
}))

const areaConfig = {
  completed: { label: 'Completed', color: 'var(--chart-1)' },
} satisfies ChartConfig

const barConfig = {
  done: { label: 'Done', color: 'var(--chart-1)' },
  progress: { label: 'In progress', color: 'var(--chart-3)' },
  todo: { label: 'Todo', color: 'var(--chart-2)' },
} satisfies ChartConfig

const burndownConfig = {
  remaining: { label: 'Remaining', color: 'var(--chart-1)' },
  ideal: { label: 'Ideal', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

// SVG ids end up in url(#…), which does not accept the colons useId can produce.
const useSvgId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

function CompletedPanel() {
  const gradientId = `fill-${useSvgId()}`
  const total = DAILY.reduce((sum, d) => sum + d.completed, 0)

  return (
    <Panel title="Jobs completed" note="AreaChart, last 14 days" wide>
      <div className="grid gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-xl font-semibold tracking-tight tabular-nums">{total}</span>
          <span className="text-muted-foreground text-xs">
            completed · <span className="text-foreground">+12%</span> on the previous 14 days
          </span>
        </div>
        <ChartContainer config={areaConfig} className="aspect-auto h-48 w-full">
          <AreaChart data={DAILY} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-completed)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-completed)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} width={28} tickMargin={4} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="completed"
              type="monotone"
              stroke="var(--color-completed)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 3.5 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </Panel>
  )
}

function StatusBarsPanel() {
  return (
    <Panel title="Issues by status" note="Stacked BarChart per week">
      <ChartContainer config={barConfig} className="aspect-auto h-56 w-full">
        <BarChart data={WEEKLY} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={24} tickMargin={4} allowDecimals={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="done" stackId="status" fill="var(--color-done)" maxBarSize={28} radius={[0, 0, 3, 3]} />
          <Bar dataKey="progress" stackId="status" fill="var(--color-progress)" maxBarSize={28} />
          <Bar dataKey="todo" stackId="status" fill="var(--color-todo)" maxBarSize={28} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

const RINGS = [
  { label: 'On time', value: 92, color: 'var(--brand)', delta: '+3 pts' },
  // status-done is the brand colour, so the success green (chart-4) keeps the rings apart.
  { label: 'Photos complete', value: 76, color: 'var(--chart-4)', delta: '+8 pts' },
  { label: 'Cycle', value: 58, color: 'var(--status-progress)', delta: 'Day 9 of 14' },
]

function Ring({ label, value, color, delta, shown }: (typeof RINGS)[number] & { shown: boolean }) {
  const r = 34
  const circumference = 2 * Math.PI * r
  const length = shown ? (circumference * value) / 100 : 0

  return (
    <figure className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div className="relative size-20">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90" role="img" aria-label={`${label}: ${value}%`}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-foreground/8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${length} ${circumference}`}
            className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-out"
          />
        </svg>
        <span aria-hidden className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
          {value}%
        </span>
      </div>
      <figcaption className="grid gap-0.5">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-muted-foreground text-[11px]">{delta}</span>
      </figcaption>
    </figure>
  )
}

function RingsPanel() {
  const [shown, setShown] = useState(false)

  // Start at 0 and fill on the next frame, so the rings animate in.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Panel title="Progress rings" note="Pure SVG, stroke-dasharray">
      <div className="grid grid-cols-3 gap-2 py-4">
        {RINGS.map((ring) => (
          <Ring key={ring.label} {...ring} shown={shown} />
        ))}
      </div>
      <p className="text-muted-foreground border-t pt-3 text-[11px]">Targets: on time 95%, photos 80%. Compared with last month.</p>
    </Panel>
  )
}

function LegendLine({ dashed, color, label }: { dashed?: boolean; color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="16" height="6" aria-hidden>
        <line x1="0" y1="3" x2="16" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '3 3' : undefined} />
      </svg>
      {label}
    </span>
  )
}

function CyclePanel() {
  const completed = 18
  const started = 9
  const donePct = Math.round((completed / SCOPE) * 100)
  const stats = [
    { label: 'Scope', value: SCOPE },
    { label: 'Started', value: started, dot: 'bg-status-progress' },
    { label: 'Completed', value: completed, dot: 'bg-brand' },
    { label: 'Done', value: `${donePct}%` },
  ]

  return (
    <Panel title="Cycle progress" note="Burn-down with a Today marker" wide>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="text-sm font-medium">Cycle 12</h4>
          <span className="text-muted-foreground text-xs">· 22 Sep – 5 Oct</span>
          <Badge variant="outline">
            <span className="bg-status-progress size-1.5 rounded-full" /> Active
          </Badge>
          <span className="text-muted-foreground ml-auto text-xs">5 days left</span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {stats.map((s) => (
                <div key={s.label} className="bg-subtle grid gap-0.5 rounded-md border px-2.5 py-2">
                  <dt className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    {s.dot && <span className={`size-1.5 rounded-full ${s.dot}`} />}
                    {s.label}
                  </dt>
                  <dd className="text-sm font-semibold tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-1.5">
              <div
                role="img"
                aria-label={`${completed} of ${SCOPE} completed, ${started} started`}
                className="bg-muted flex h-1.5 overflow-hidden rounded-full"
              >
                <span className="bg-brand h-full" style={{ width: `${(completed / SCOPE) * 100}%` }} />
                <span className="bg-status-progress h-full" style={{ width: `${(started / SCOPE) * 100}%` }} />
              </div>
              <p className="text-muted-foreground text-[11px] tabular-nums">
                {SCOPE - completed - started} issues not started
              </p>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-3 text-[11px]">
              <LegendLine color="var(--chart-1)" label="Remaining" />
              <LegendLine color="var(--muted-foreground)" label="Ideal" dashed />
            </div>
          </div>

          <ChartContainer config={burndownConfig} className="aspect-auto h-56 w-full">
            <LineChart data={BURNDOWN} margin={{ top: 20, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} width={24} tickMargin={4} domain={[0, SCOPE]} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ReferenceLine
                x={TODAY}
                stroke="var(--muted-foreground)"
                strokeDasharray="2 3"
                label={{ value: 'Today', position: 'top', fill: 'var(--muted-foreground)', fontSize: 10 }}
              />
              <Line
                dataKey="ideal"
                type="linear"
                stroke="var(--color-ideal)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
              />
              <Line
                dataKey="remaining"
                type="monotone"
                stroke="var(--color-remaining)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3.5 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </Panel>
  )
}

export default function ChartsSection() {
  return (
    <Section id="charts" title="Charts" description="Recharts through the shadcn chart component, coloured by the theme">
      <CompletedPanel />
      <StatusBarsPanel />
      <RingsPanel />
      <CyclePanel />
    </Section>
  )
}
