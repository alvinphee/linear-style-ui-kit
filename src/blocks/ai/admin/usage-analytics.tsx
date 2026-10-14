import { useId, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon, ArrowUp01Icon, BubbleChatIcon, Coins01Icon, Download01Icon, RoboticIcon, UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { cn } from 'cn'
import { KpiCard, KpiGrid, type KpiDelta, type KpiTone } from '@/blocks/kpi-card'
import { PeriodBar, type Period } from '@/blocks/period-picker'
import { BarList, type BarListItem } from '@/components/bar-list'
import { IconMark } from '@/components/mark'
import { Panel } from '@/components/panel'
import { Person } from '@/components/person'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatAgo, formatDateRange, formatNumber, formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'

// Usage analytics for an AI workspace's admins: how many people use the
// assistant, how much, with which models, and what it costs in credits.
//   - a period switch (7, 30 or 90 days) with Export CSV
//   - KPI cards: active users, messages, agent runs and credits used, each
//     with the change on the period before and a sparkline
//   - messages by model as stacked bars, a bar a day (a bar a week over 90
//     days, so the bars stay readable), with each model's total as the legend
//   - credits by team, the busiest agents, and the top users as a sortable table
// It works nothing out itself: the app passes the period's figures in, and
// the period before for the deltas. It measures its own box (@container):
// one column when narrow, two from 48rem.

export type UsagePeriod = '7d' | '30d' | '90d'

export const USAGE_PERIODS: Period<UsagePeriod>[] = [
  { value: '7d', label: 'Last 7 days', short: '7 days' },
  { value: '30d', label: 'Last 30 days', short: '30 days' },
  { value: '90d', label: 'Last 90 days', short: '90 days' },
]

// A period's headline figures. activePeople counts each person once.
export type UsageTotals = {
  activePeople: number
  messages: number
  agentRuns: number
  credits: number
}

// One day. activePeople is that day's active users; byModel is messages per model id.
export type UsageDay = UsageTotals & {
  // The day's midnight, in ms.
  date: number
  byModel: Record<string, number>
}

// A model, in the order and colour the chart stacks it, with its totals for the period.
export type UsageModel = {
  id: string
  name: string
  // A CSS colour. Defaults to var(--chart-1…5) by position.
  colour?: string
  icon?: IconSvgElement
  messages: number
  credits: number
}

export type UsageTeam = {
  id: string
  name: string
  credits: number
  // Active users in the team over the period.
  people: number
}

export type UsagePersonRow = {
  id: string
  name: string
  email?: string
  team?: string
  messages: number
  agentRuns: number
  credits: number
  // When they last sent a message, in ms.
  lastActive?: number
}

export type UsageAgentRow = {
  id: string
  name: string
  icon?: IconSvgElement
  colour?: string
  // Who made it.
  owner?: string
  runs: number
}

export type UsageAnalyticsProps = {
  // The period, a day each, oldest first.
  series: UsageDay[]
  // The period before, the same length, drawn dashed behind the sparklines.
  previous?: UsageDay[]
  totals: UsageTotals
  // The period before's figures, for the deltas. Leave out to hide them.
  previousTotals?: UsageTotals
  byModel: UsageModel[]
  byTeam: UsageTeam[]
  topPeople: UsagePersonRow[]
  topAgents: UsageAgentRow[]
  period: UsagePeriod
  onPeriodChange: (period: UsagePeriod) => void
  // Shows Export CSV. The app builds and downloads the file.
  onExport?: () => void
  // The clock "Last active" is counted from. Defaults to now.
  now?: number
  // Rows of the top users shown before "Show all".
  peopleShown?: number
  className?: string
}

const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%')

function change(current: number, before: number | undefined, tone?: KpiTone): KpiDelta | undefined {
  if (before === undefined || before === 0) return undefined
  const value = ((current - before) / before) * 100
  return {
    direction: value >= 0 ? 'up' : 'down',
    text: `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`,
    tone,
  }
}

const modelColour = (model: UsageModel, i: number) => model.colour ?? `var(--chart-${(i % 5) + 1})`

// Daily rows for the chart, or weekly ones when there are too many days for
// readable bars. Weeks are counted back from the last day, so the newest bar
// is a whole week and the oldest may be short.
function chartRows(series: UsageDay[], models: UsageModel[]) {
  const weekly = series.length > 45
  const size = weekly ? 7 : 1
  const groups: UsageDay[][] = []
  for (let end = series.length; end > 0; end -= size) groups.unshift(series.slice(Math.max(0, end - size), end))
  return {
    weekly,
    rows: groups.map((days) => {
      const first = days[0]
      const last = days[days.length - 1]
      const row: Record<string, number | string> = {
        label: formatShortDate(first.date),
        tip: weekly ? formatDateRange(first.date, last.date) : dayLabel(first.date),
      }
      for (const m of models) row[m.id] = days.reduce((sum, d) => sum + (d.byModel[m.id] ?? 0), 0)
      return row
    }),
  }
}

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const dayLabel = (date: number) => `${WEEKDAY.format(date)} ${formatShortDate(date)}`

export function UsageAnalytics({
  series, previous, totals, previousTotals, byModel, byTeam, topPeople, topAgents, period, onPeriodChange, onExport,
  now, peopleShown = 8, className,
}: UsageAnalyticsProps) {
  const days = USAGE_PERIODS.find((p) => p.value === period)?.label.toLowerCase().replace('last ', '') ?? 'period'
  const versus = `vs previous ${days}`
  const range = series.length ? formatDateRange(series[0].date, series[series.length - 1].date, { year: true }) : undefined
  const spark = (key: keyof UsageTotals) => ({
    data: series.map((d) => d[key]),
    previous: previous?.map((d) => d[key]),
  })

  return (
    <div className={cn('@container min-w-0', className)}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 @3xl:grid-cols-2">
        <PeriodBar
          className="@3xl:col-span-2"
          periods={USAGE_PERIODS}
          value={period}
          onChange={onPeriodChange}
          size="sm"
          aria-label="Usage period"
          description={range}
          actions={onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export CSV
            </Button>
          )}
        />

        <KpiGrid breakpoints="container" className="@3xl:col-span-2">
          <KpiCard
            label="Active users"
            icon={UserMultiple02Icon}
            value={formatNumber(totals.activePeople)}
            delta={change(totals.activePeople, previousTotals?.activePeople)}
            footnote={previousTotals && versus}
            sparkline={spark('activePeople')}
          />
          <KpiCard
            label="Messages"
            icon={BubbleChatIcon}
            value={formatNumber(totals.messages)}
            delta={change(totals.messages, previousTotals?.messages)}
            footnote={previousTotals && versus}
            sparkline={spark('messages')}
          />
          <KpiCard
            label="Agent runs"
            icon={RoboticIcon}
            value={formatNumber(totals.agentRuns)}
            delta={change(totals.agentRuns, previousTotals?.agentRuns)}
            footnote={previousTotals && versus}
            sparkline={spark('agentRuns')}
          />
          <KpiCard
            label="Credits used"
            icon={Coins01Icon}
            value={formatNumber(Math.round(totals.credits))}
            // More credits used is spend, neither good nor bad news by itself.
            delta={change(totals.credits, previousTotals?.credits, 'neutral')}
            footnote={previousTotals && versus}
            sparkline={spark('credits')}
          />
        </KpiGrid>

        <MessagesByModel series={series} models={byModel} total={totals.messages} range={range} className="@3xl:col-span-2" />

        <Panel title="Credits by team" note={plural(byTeam.length, 'team')}>
          <BarList
            items={byTeam.map((team): BarListItem => ({
              id: team.id,
              label: team.name,
              hint: plural(team.people, 'user'),
              value: team.credits,
              display: formatNumber(Math.round(team.credits)),
              secondary: percent(team.credits, totals.credits),
            }))}
            empty="No credits used in this period."
          />
        </Panel>

        <Panel title="Top agents" note="By runs">
          <BarList
            ranked
            colour="var(--chart-2)"
            items={topAgents.slice(0, 6).map((agent): BarListItem => ({
              id: agent.id,
              label: agent.name,
              hint: agent.owner,
              value: agent.runs,
              display: formatNumber(agent.runs),
              start: agent.icon && <IconMark icon={agent.icon} colour={agent.colour ?? 'var(--chart-2)'} size="sm" />,
            }))}
            empty="No agent runs in this period."
          />
        </Panel>

        <TopPeople rows={topPeople} shown={peopleShown} now={now} className="@3xl:col-span-2" />
      </div>
    </div>
  )
}

function MessagesByModel({ series, models, total, range, className }: {
  series: UsageDay[]
  models: UsageModel[]
  total: number
  range?: string
  className?: string
}) {
  const titleId = useId()
  const { weekly, rows } = useMemo(() => chartRows(series, models), [series, models])
  const config = Object.fromEntries(
    models.map((m, i) => [m.id, { label: m.name, color: modelColour(m, i) }]),
  ) satisfies ChartConfig
  // Read out instead of the bars: the total, and each model's share.
  const summary = `${formatNumber(total)} messages${range ? ` from ${range}` : ''}, ${weekly ? 'by week' : 'by day'}. `
    + models.map((m) => `${m.name}: ${formatNumber(m.messages)} (${percent(m.messages, total)})`).join(', ')
    + '.'

  return (
    <Panel title="Messages by model" note={weekly ? 'A bar a week' : 'A bar a day'} className={className}>
      <figure aria-labelledby={titleId} className="grid min-w-0 gap-3">
        <figcaption id={titleId} className="sr-only">{summary}</figcaption>
        {series.length ? (
          <ChartContainer config={config} className="aspect-auto h-52 w-full" aria-hidden>
            <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} accessibilityLayer={false}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tickMargin={4}
                allowDecimals={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k` : String(v))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent labelFormatter={(_, payload) => String(payload?.[0]?.payload?.tip ?? '')} />
                }
              />
              {models.map((m, i) => (
                <Bar
                  key={m.id}
                  dataKey={m.id}
                  stackId="models"
                  fill={`var(--color-${m.id})`}
                  // A thin line in the card's colour keeps the stacked segments apart.
                  stroke="var(--card)"
                  strokeWidth={1}
                  maxBarSize={28}
                  radius={i === models.length - 1 ? [3, 3, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-muted-foreground py-10 text-center text-xs">No messages in this period.</p>
        )}
        <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
          {models.map((m, i) => (
            <li key={m.id} className="flex min-w-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-[2px]" style={{ background: modelColour(m, i) }} />
              <span>{m.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatNumber(m.messages)} · {percent(m.messages, total)}
              </span>
            </li>
          ))}
        </ul>
      </figure>
    </Panel>
  )
}

type SortKey = 'messages' | 'agentRuns' | 'credits' | 'lastActive'

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'messages', label: 'Messages', className: 'hidden @md:table-cell' },
  { key: 'agentRuns', label: 'Agent runs', className: 'hidden @lg:table-cell' },
  { key: 'credits', label: 'Credits', className: 'pr-3.5 @xl:pr-2' },
  { key: 'lastActive', label: 'Last active', className: 'hidden pr-3.5 @xl:table-cell' },
]

function TopPeople({ rows, shown, now, className }: {
  rows: UsagePersonRow[]
  shown: number
  now?: number
  className?: string
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'credits', desc: true })
  const [all, setAll] = useState(false)
  const sorted = useMemo(() => {
    const value = (row: UsagePersonRow) => row[sort.key] ?? 0
    return [...rows].sort((a, b) => (sort.desc ? value(b) - value(a) : value(a) - value(b)))
  }, [rows, sort])
  const visible = all ? sorted : sorted.slice(0, shown)
  const clock = now ?? Date.now()

  const header = (key: SortKey, label: ReactNode) => {
    const active = sort.key === key
    return (
      <button
        type="button"
        onClick={() => setSort({ key, desc: active ? !sort.desc : true })}
        className="hover:text-foreground focus-visible:ring-ring/40 -mx-1 inline-flex items-center gap-1 rounded px-1 outline-none focus-visible:ring-2"
      >
        {label}
        {active && <HugeiconsIcon icon={sort.desc ? ArrowDown01Icon : ArrowUp01Icon} strokeWidth={2} className="size-3" />}
      </button>
    )
  }

  return (
    <Panel
      title="Top users"
      note={plural(rows.length, 'user')}
      className={className}
      bodyClassName="p-0"
    >
      {rows.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent [&>th]:text-muted-foreground [&>th]:h-8 [&>th]:text-[11px]">
                <TableHead className="pl-3.5">User</TableHead>
                {COLUMNS.map((c) => (
                  <TableHead
                    key={c.key}
                    aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : undefined}
                    className={cn('text-right', c.className)}
                  >
                    {header(c.key, c.label)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-0 min-w-40 pl-3.5">
                    <Person name={row.name} />
                    {(row.team || row.email) && (
                      <span className="text-muted-foreground mt-0.5 block truncate pl-7 text-[11px]">
                        {row.team ?? row.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums @md:table-cell">{formatNumber(row.messages)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums @lg:table-cell">{formatNumber(row.agentRuns)}</TableCell>
                  <TableCell className="pr-3.5 text-right tabular-nums @xl:pr-2">{formatNumber(Math.round(row.credits))}</TableCell>
                  <TableCell className="text-muted-foreground hidden pr-3.5 text-right @xl:table-cell">
                    {row.lastActive ? formatAgo(row.lastActive, clock) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > shown && (
            <div className="border-t px-3.5 py-2">
              <Button variant="ghost" size="sm" className="-ml-2" aria-expanded={all} onClick={() => setAll((a) => !a)}>
                {all ? 'Show fewer' : `Show all ${rows.length}`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted-foreground py-8 text-center text-xs">Nobody used the assistant in this period.</p>
      )}
    </Panel>
  )
}
