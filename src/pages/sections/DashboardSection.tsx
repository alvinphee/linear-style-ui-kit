import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { DollarCircleIcon, Download01Icon, Target02Icon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { cn } from 'cn'
import { KpiCard, KpiGrid } from '@/blocks/kpi-card'
import { PeriodBar } from '@/blocks/period-picker'
import { BarList } from '@/components/bar-list'
import { LegendLine, LegendRow } from '@/components/chart-legend'
import { DeltaBadge, type KpiDelta } from '@/components/delta-badge'
import { LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateRange, formatMoney, formatNumber, formatShortDate } from '@/lib/format'
import { seededRandom } from '@/lib/random'
import { useSvgId } from '@/lib/use-svg-id'
import { Panel, Section } from './shared'

type Range = '7d' | '30d' | '90d'
const RANGES: { value: Range; label: string; short: string; days: number }[] = [
  { value: '7d', label: 'Last 7 days', short: '7d', days: 7 },
  { value: '30d', label: 'Last 30 days', short: '30d', days: 30 },
  { value: '90d', label: 'Last 90 days', short: '90d', days: 90 },
]
const rangeOf = (range: Range) => RANGES.find((r) => r.value === range) ?? RANGES[1]!

// All dates are UTC midnights so the day maths never trips over a DST change.
const DAY = 86_400_000
const END = Date.UTC(2026, 8, 30)
// Two 90-day periods, plus a week so the 7-day smoothing has data before the first day.
const SMOOTH = 7
const HISTORY_DAYS = 180 + SMOOTH - 1

const shortDate = (t: number) => formatShortDate(t, { utc: true })
const usd = (v: number) => formatMoney(v, false)

// A product launch mid-September: the extra signups make the last 7 days look down.
const LAUNCH: Record<number, number> = {
  [Date.UTC(2026, 8, 16)]: 70, [Date.UTC(2026, 8, 17)]: 52,
  [Date.UTC(2026, 8, 18)]: 34, [Date.UTC(2026, 8, 19)]: 18,
}

type Metric = 'revenue' | 'users' | 'signups' | 'conversion'
type DayStats = { t: number } & Record<Metric, number>

// Made-up numbers from a fixed seed: steady growth, quieter weekends, some noise.
const HISTORY: DayStats[] = (() => {
  const rand = seededRandom(1)
  return Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const t = END - (HISTORY_DAYS - 1 - i) * DAY
    const weekday = new Date(t).getUTCDay()
    const weekend = weekday === 0 || weekday === 6
    return {
      t,
      revenue: Math.round(3400 * (1 + 0.0032 * i) * (weekend ? 0.7 : 1) * (0.9 + 0.2 * rand())),
      users: Math.round(1650 * (1 + 0.0024 * i) * (weekend ? 0.6 : 1) * (0.94 + 0.12 * rand())),
      signups: Math.round(38 * (1 + 0.0025 * i) * (weekend ? 0.55 : 1) * (0.8 + 0.4 * rand()) + (LAUNCH[t] ?? 0)),
      conversion: Math.round((3.2 + 0.35 * Math.sin(i / 11) + (rand() - 0.5) * 0.5) * 100) / 100,
    }
  })
})()

function periods(range: Range) {
  const n = rangeOf(range).days
  const end = HISTORY.length
  return { current: HISTORY.slice(end - n), previous: HISTORY.slice(end - 2 * n, end - n), start: end - n }
}

const spanLabel = (days: DayStats[]) => formatDateRange(days[0]?.t ?? END, days.at(-1)?.t ?? END, { utc: true })

type Kpi = {
  key: Metric
  label: string
  hint: string
  icon: IconSvgElement
  total: 'sum' | 'avg'
  // Rates change in points, counts in percent.
  change: 'pct' | 'pts'
  format: (v: number) => string
}

const compactUsd = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : usd(v))

const KPIS: Kpi[] = [
  { key: 'revenue', label: 'Revenue', hint: 'total', icon: DollarCircleIcon, total: 'sum', change: 'pct', format: compactUsd },
  { key: 'users', label: 'Active users', hint: 'avg / day', icon: UserGroupIcon, total: 'avg', change: 'pct', format: (v) => formatNumber(Math.round(v)) },
  { key: 'signups', label: 'New signups', hint: 'total', icon: UserAdd01Icon, total: 'sum', change: 'pct', format: (v) => formatNumber(Math.round(v)) },
  { key: 'conversion', label: 'Conversion', hint: 'avg', icon: Target02Icon, total: 'avg', change: 'pts', format: (v) => `${v.toFixed(2)}%` },
]

const KPI_BY_KEY = Object.fromEntries(KPIS.map((k) => [k.key, k])) as Record<Metric, Kpi>

function totalOf(days: DayStats[], kpi: Kpi) {
  const sum = days.reduce((s, d) => s + d[kpi.key], 0)
  return kpi.total === 'sum' ? sum : sum / Math.max(1, days.length)
}

function changeOf(current: number, previous: number, kpi: Kpi): KpiDelta {
  const value = kpi.change === 'pts' ? current - previous : (current / previous - 1) * 100
  const sign = value >= 0 ? '+' : '−'
  const text = kpi.change === 'pts'
    ? `${sign}${Math.abs(value).toFixed(2)} pts`
    : `${sign}${Math.abs(value).toFixed(1)}%`
  return { direction: value >= 0 ? 'up' : 'down', text }
}

// Trailing 7-day average, so the longer sparklines show a trend rather than weekend zigzags.
function smoothed(start: number, length: number, key: Metric) {
  return Array.from({ length }, (_, i) => {
    const end = start + i + 1
    const days = HISTORY.slice(Math.max(0, end - SMOOTH), end)
    return days.reduce((s, d) => s + d[key], 0) / days.length
  })
}

function sparkSeries(range: Range, key: Metric) {
  const n = rangeOf(range).days
  const { start } = periods(range)
  if (n <= SMOOTH) {
    return {
      current: HISTORY.slice(start, start + n).map((d) => d[key]),
      previous: HISTORY.slice(start - n, start).map((d) => d[key]),
    }
  }
  return { current: smoothed(start, n, key), previous: smoothed(start - n, n, key) }
}

function DashboardKpi({ kpi, range, compare }: { kpi: Kpi; range: Range; compare: boolean }) {
  const { current, previous } = periods(range)
  const value = totalOf(current, kpi)
  const before = totalOf(previous, kpi)
  const spark = sparkSeries(range, kpi.key)

  return (
    <KpiCard
      label={kpi.label}
      hint={kpi.hint}
      icon={kpi.icon}
      value={kpi.format(value)}
      delta={changeOf(value, before, kpi)}
      sparkline={{ data: spark.current, previous: compare ? spark.previous : undefined }}
      tooltip={
        <div className="grid gap-0.5">
          <span className="font-medium">Previous period: {kpi.format(before)}</span>
          <span className="opacity-70">{spanLabel(previous)}</span>
        </div>
      }
    />
  )
}

type ChartMetric = 'revenue' | 'users'
const CHART_METRICS: { value: ChartMetric; label: string; format: (v: number) => string; axis: (v: number) => string }[] = [
  { value: 'revenue', label: 'Revenue', format: usd, axis: (v) => `$${Math.round(v / 1000)}k` },
  { value: 'users', label: 'Active users', format: formatNumber, axis: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`) },
]

const mainConfig = {
  current: { label: 'This period', color: 'var(--chart-1)' },
  previous: { label: 'Previous period', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

type Point = { day: string; prevDay: string; current: number; previous: number | undefined }

function MetricChart({ metric, range, compare }: { metric: (typeof CHART_METRICS)[number]; range: Range; compare: boolean }) {
  const gradientId = `dash-${useSvgId()}`
  const { current, previous } = periods(range)
  const data: Point[] = current.map((d, i) => ({
    day: shortDate(d.t),
    prevDay: previous[i] ? shortDate(previous[i].t) : '',
    current: d[metric.value],
    previous: previous[i]?.[metric.value],
  }))

  return (
    <ChartContainer config={mainConfig} className="aspect-auto h-64 w-full">
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
        <YAxis tickLine={false} axisLine={false} width={40} tickMargin={4} tickFormatter={metric.axis} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!p) return null
                return compare ? `${p.day} vs ${p.prevDay}` : p.day
              }}
              formatter={(value, name) => (
                <div className="flex w-full items-center gap-2">
                  <span
                    className={cn(
                      'h-2.5 shrink-0 rounded-[2px]',
                      name === 'previous' ? 'w-0 border-l-[1.5px] border-dashed' : 'w-1',
                    )}
                    style={name === 'previous'
                      ? { borderColor: 'var(--color-previous)' }
                      : { backgroundColor: 'var(--color-current)' }}
                  />
                  <span className="text-muted-foreground flex-1">
                    {name === 'previous' ? 'Previous period' : 'This period'}
                  </span>
                  <span className="text-foreground font-mono font-medium tabular-nums">{metric.format(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        {compare && (
          <Line
            dataKey="previous"
            type="monotone"
            stroke="var(--color-previous)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 3 }}
          />
        )}
        <Area
          dataKey="current"
          type="monotone"
          stroke="var(--color-current)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 3.5 }}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

function PerformancePanel({ range, compare }: { range: Range; compare: boolean }) {
  const [metric, setMetric] = useState<ChartMetric>('revenue')
  const { current, previous } = periods(range)

  return (
    <Panel title="Performance" note={`${spanLabel(current)}${compare ? ` vs ${spanLabel(previous)}` : ''}`} wide>
      <Tabs value={metric} onValueChange={(v) => setMetric(v as ChartMetric)} className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <TabsList>
            {CHART_METRICS.map((m) => (
              <TabsTrigger key={m.value} value={m.value}>{m.label}</TabsTrigger>
            ))}
          </TabsList>
          <LegendRow>
            <LegendLine colour="var(--chart-1)" label="This period" />
            {compare && <LegendLine colour="var(--muted-foreground)" label="Previous period" dashed />}
          </LegendRow>
        </div>
        {CHART_METRICS.map((m) => {
          const kpi = KPI_BY_KEY[m.value]
          const value = totalOf(current, kpi)
          const before = totalOf(previous, kpi)
          return (
            <TabsContent key={m.value} value={m.value} className="grid gap-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xl font-semibold tracking-tight tabular-nums">
                  {m.value === 'revenue' ? usd(value) : formatNumber(Math.round(value))}
                </span>
                <DeltaBadge {...changeOf(value, before, kpi)} />
                <span className="text-muted-foreground text-xs">
                  {m.value === 'revenue' ? 'total' : 'average per day'} · vs {kpi.format(before)} the period before
                </span>
              </div>
              <MetricChart metric={m} range={range} compare={compare} />
            </TabsContent>
          )
        })}
      </Tabs>
    </Panel>
  )
}

// Made-up customers. Shares are of all revenue in the range, so the ranking moves between ranges.
const CUSTOMERS: { name: string; plan: string; share: Record<Range, number> }[] = [
  { name: 'Kestrel Labs', plan: 'Enterprise', share: { '7d': 0.112, '30d': 0.094, '90d': 0.088 } },
  { name: 'Northpeak', plan: 'Enterprise', share: { '7d': 0.071, '30d': 0.082, '90d': 0.079 } },
  { name: 'Brightline Studio', plan: 'Business', share: { '7d': 0.078, '30d': 0.066, '90d': 0.061 } },
  { name: 'Juniper Analytics', plan: 'Business', share: { '7d': 0.049, '30d': 0.054, '90d': 0.058 } },
  { name: 'Harbor & Co', plan: 'Business', share: { '7d': 0.052, '30d': 0.047, '90d': 0.043 } },
  { name: 'Oakridge Health', plan: 'Team', share: { '7d': 0.031, '30d': 0.036, '90d': 0.039 } },
]

function TopCustomersPanel({ range }: { range: Range }) {
  const revenue = totalOf(periods(range).current, KPI_BY_KEY.revenue)
  const ranked = [...CUSTOMERS].sort((a, b) => b.share[range] - a.share[range])
  const combined = ranked.reduce((s, c) => s + c.share[range], 0)

  return (
    <Panel title="Top customers" note={`By revenue, ${rangeOf(range).label.toLowerCase()}`}>
      <BarList
        ranked
        colour="color-mix(in oklab, var(--muted-foreground) 45%, transparent)"
        items={ranked.map((c, i) => {
          const share = c.share[range]
          return {
            id: c.name,
            label: <span className="font-medium">{c.name}</span>,
            // The plan only fits beside the name from the sm breakpoint up.
            hint: <span className="hidden sm:inline">{c.plan}</span>,
            value: share,
            display: usd(Math.round(revenue * share)),
            secondary: `${(share * 100).toFixed(1)}%`,
            start: (
              <span aria-hidden className="shrink-0">
                <LetterMark text={c.name[0]} colour="var(--muted)" className="text-muted-foreground rounded-md text-[10px] font-medium" />
              </span>
            ),
            colour: i === 0 ? 'var(--brand)' : undefined,
          }
        })}
      />
      <p className="text-muted-foreground mt-3 border-t pt-3 text-[11px] tabular-nums">
        These {ranked.length} customers bring in {(combined * 100).toFixed(0)}% of revenue.
      </p>
    </Panel>
  )
}

const b = (text: string) => <span className="text-foreground font-medium">{text}</span>

// Made-up events; the people are the sample team.
const ACTIVITY: { id: string; who: string; text: ReactNode; time: string; at: string }[] = [
  { id: 'a1', who: 'Mei Ling', text: <>upgraded {b('Kestrel Labs')} to Enterprise</>, time: '12m', at: '12 minutes ago' },
  { id: 'a2', who: 'Daniel', text: <>closed a {b('$4,800')} deal with {b('Northpeak')}</>, time: '48m', at: '48 minutes ago' },
  { id: 'a3', who: 'Siti', text: <>invited 3 teammates to {b('Juniper Analytics')}</>, time: '2h', at: '2 hours ago' },
  { id: 'a4', who: 'Ravi', text: <>renewed {b('Brightline Studio')} for 12 months</>, time: '4h', at: '4 hours ago' },
  { id: 'a5', who: 'Ali', text: <>refunded {b('$120')} to {b('Harbor & Co')}</>, time: '1d', at: 'Yesterday' },
  { id: 'a6', who: 'Mei Ling', text: <>added {b('Oakridge Health')} as a customer</>, time: '2d', at: '2 days ago' },
]

function ActivityPanel() {
  return (
    <Panel title="Recent activity" note="Across the workspace">
      <ul className="-my-1 divide-y">
        {ACTIVITY.map((a) => (
          <li key={a.id} className="flex min-w-0 items-center gap-2.5 py-2">
            <UserAvatar name={a.who} className="size-6" />
            <p className="text-muted-foreground min-w-0 flex-1 text-xs text-pretty">
              {b(a.who)} {a.text}
            </p>
            <time className="text-muted-foreground shrink-0 text-[11px] tabular-nums" title={a.at}>{a.time}</time>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export default function DashboardSection() {
  const [range, setRange] = useState<Range>('30d')
  const [compare, setCompare] = useState(true)
  const { current } = periods(range)

  function exportData() {
    toast.success(`Exported ${rangeOf(range).label.toLowerCase()}`, {
      description: `dashboard-${range}-2026-09-30.csv · revenue, users, signups and conversion`,
    })
  }

  return (
    <Section id="dashboard" title="Dashboard" description="KPI cards, sparklines and a range switch">
      <PeriodBar
        className="lg:col-span-2"
        periods={RANGES}
        value={range}
        onChange={setRange}
        compare={compare}
        onCompareChange={setCompare}
        description={`${spanLabel(current)} 2026`}
        actions={
          <Button variant="outline" onClick={exportData}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
            Export
          </Button>
        }
      />

      <KpiGrid className="lg:col-span-2">
        {KPIS.map((kpi) => (
          <DashboardKpi key={kpi.key} kpi={kpi} range={range} compare={compare} />
        ))}
      </KpiGrid>

      <PerformancePanel range={range} compare={compare} />
      <TopCustomersPanel range={range} />
      <ActivityPanel />
    </Section>
  )
}
