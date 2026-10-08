import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Agreement01Icon, Alert02Icon, AlertDiamondIcon, ArrowRight01Icon, Award01Icon,
  BankIcon, Briefcase01Icon, Calendar03Icon, Certificate01Icon, Clock01Icon, Coins01Icon, DeliveryTruck01Icon, Exchange01Icon,
  Invoice01Icon, Invoice03Icon, PackageIcon, PackageReceiveIcon, PackageRemoveIcon, PercentCircleIcon, QuoteDownIcon,
  ReceiptTextIcon, SearchAreaIcon, Target02Icon, UserAdd01Icon, UserMultipleIcon, Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { format } from 'date-fns'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { cn } from 'cn'
import { KpiCard, KpiGrid } from '@/blocks/kpi-card'
import { PeriodPicker } from '@/blocks/period-picker'
import { BarList } from '@/components/bar-list'
import type { KpiDelta, KpiTone } from '@/components/delta-badge'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Button } from '@/components/ui/button'
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { formatMoney, formatNumber } from '@/lib/format'
import { pluralWord } from '@/lib/text'
import { useSvgId } from '@/lib/use-svg-id'
import { TODAY, addDays, daysBetween, formatDate, formatMoneyShort } from '../format'
import { moduleById, specFor } from '../modules'
import { erpHref } from '../route'
import { useErp } from '../store'
import { INSPECTION_CATEGORY, type EntityId, type ErpModule, type Row } from '../types'
import { ApproveReject, PAGE_HEADER, StatusBadge, Worklist, type WorkItem } from '../ui'

// The Overview page of each module: KPIs, a chart, a breakdown and a list of
// what needs attention. Everything is worked out from the live records on
// each render, so a change made anywhere in the app shows here at once.

// ---------------------------------------------------------------------------
// Helpers

const num = (r: Row, key: string) => Number(r[key] ?? 0)
const str = (r: Row, key: string) => String(r[key] ?? '')
const sum = (rows: Row[], key: string) => rows.reduce((t, r) => t + num(r, key), 0)
const is = (...statuses: string[]) => (r: Row) => statuses.includes(str(r, 'status'))
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)
// A count and its word, with thousands separators: "1,204 items".
const count = (n: number, one: string, many?: string) => `${formatNumber(n)} ${pluralWord(n, one, many)}`
const money = (n: number) => formatMoney(n, false)
const byDate = (key: string) => (a: Row, b: Row) => str(a, key).localeCompare(str(b, key))
const tint = (colour: string, amount: number) => `color-mix(in oklch, ${colour} ${amount}%, transparent)`

// Days from a date to the demo's today: positive in the past, negative ahead.
const age = (iso: string) => daysBetween(iso, TODAY)
const within = (iso: string, days: number) => iso !== '' && age(iso) >= 0 && age(iso) < days

// "2026-09" → "Sep". date-fns, not Intl: newer Intl data writes "Sept".
const monthOf = (period: string) => format(new Date(`${period}-01T00:00:00`), 'MMM')

// Totals per group, largest first. Counts rows unless a value is given.
function groupSum(rows: Row[], by: string, value: (r: Row) => number = () => 1) {
  const totals = new Map<string, { value: number; count: number }>()
  for (const r of rows) {
    const g = totals.get(str(r, by)) ?? { value: 0, count: 0 }
    g.value += value(r)
    g.count += 1
    totals.set(str(r, by), g)
  }
  return [...totals].map(([label, t]) => ({ label, ...t })).sort((a, b) => b.value - a.value)
}

// ---------------------------------------------------------------------------
// Page frame

const PERIODS = [
  { value: '30d', label: '30 days' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
]

function Header({ mod, description, create }: { mod: ErpModule; description: string; create: EntityId }) {
  const { startCreate } = useErp()
  // Visual only: the sample records span about ten weeks, so every period would read the same.
  const [period, setPeriod] = useState('30d')
  return (
    <PageHeader
      className={PAGE_HEADER}
      title={`${mod.name} overview`}
      description={`${description}, as of ${formatDate(TODAY, true)}.`}
      actions={
        <>
          <PeriodPicker periods={PERIODS} value={period} onChange={setPeriod} size="sm" aria-label="Period" />
          <Button size="sm" onClick={() => startCreate(create)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New {specFor(create)?.singular ?? 'record'}
          </Button>
        </>
      }
    />
  )
}

type Kpi = {
  label: string
  value: string
  sub: string
  icon: IconSvgElement
  // The module page the card links to.
  page?: string
  // Colours the sub line.
  tone?: KpiTone
  // A change, shown as a badge before the sub line.
  delta?: KpiDelta
  // The exact figure, shown on hover when the value is rounded.
  title?: string
}

const Note = ({ children }: { children: ReactNode }) => (
  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{children}</span>
)

function Overview({ mod, description, create, kpis, chart, side, list }: {
  mod: ErpModule
  description: string
  create: EntityId
  kpis: Kpi[]
  chart: ReactNode
  side: ReactNode
  list: ReactNode
}) {
  return (
    <div className="pb-8">
      <Header mod={mod} description={description} create={create} />
      <div className="grid gap-3 px-4 @2xl:px-6">
        <KpiGrid breakpoints="container">
          {kpis.map((k) => (
            <KpiCard
              key={k.label}
              label={k.label}
              value={k.value}
              valueTitle={k.title}
              icon={k.icon}
              delta={k.delta}
              footnote={k.sub}
              footnoteTone={k.tone}
              href={k.page && erpHref(mod.id, k.page)}
            />
          ))}
        </KpiGrid>
        <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {chart}
          {side}
        </div>
        {list}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Charts

// A bar or point. The tooltip is headed by `title` (else the axis label) and
// `note`; `fill` colours one bar.
type Point = { label: string; title?: string; note?: string; fill?: string } & Record<string, string | number | undefined>
type Series = { key: string; label: string; colour: string }

const configOf = (series: Series[]): ChartConfig =>
  Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.colour }]))

function tooltip(format: (n: number) => string) {
  return (
    <ChartTooltipContent
      labelFormatter={(label, payload) => {
        const point = payload?.[0]?.payload as Point | undefined
        const title = point?.title ?? label
        return point?.note ? `${title} · ${point.note}` : title
      }}
      formatter={(value, name, item) => (
        <div className="flex w-full items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: item.payload?.fill ?? item.color }} />
          <span className="text-muted-foreground flex-1">{name}</span>
          <span className="text-foreground font-mono font-medium tabular-nums">{format(Number(value))}</span>
        </div>
      )}
    />
  )
}

type ChartProps = {
  data: Point[]
  format: (n: number) => string
  axis: (n: number) => string
  className?: string
}

function Columns({ data, series, format, axis, className = 'h-56' }: ChartProps & { series: Series[] }) {
  return (
    <ChartContainer config={configOf(series)} className={cn('aspect-auto w-full', className)}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={44} tickMargin={4} allowDecimals={false} tickFormatter={(v: number) => axis(v)} />
        <ChartTooltip content={tooltip(format)} />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={`var(--color-${s.key})`} radius={[3, 3, 0, 0]} maxBarSize={36} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

function HBars({ data, series, format, axis, labelWidth, className = 'h-56' }: ChartProps & { series: Series; labelWidth: number }) {
  return (
    <ChartContainer config={configOf([series])} className={cn('aspect-auto w-full', className)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={(v: number) => axis(v)} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={labelWidth}
          tickMargin={6}
          tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
        />
        <ChartTooltip content={tooltip(format)} />
        <Bar dataKey={series.key} name={series.label} fill={`var(--color-${series.key})`} radius={[0, 3, 3, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  )
}

function TrendArea({ data, series, format, axis, className = 'h-56' }: ChartProps & { series: Series }) {
  const gradientId = `ov-${useSvgId()}`
  return (
    <ChartContainer config={configOf([series])} className={cn('aspect-auto w-full', className)}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(--color-${series.key})`} stopOpacity={0.28} />
            <stop offset="100%" stopColor={`var(--color-${series.key})`} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} width={44} tickMargin={4} tickFormatter={(v: number) => axis(v)} />
        <ChartTooltip content={tooltip(format)} />
        <Area
          dataKey={series.key}
          name={series.label}
          type="monotone"
          stroke={`var(--color-${series.key})`}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 3.5 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

// ---------------------------------------------------------------------------
// Lists

const MAX_ROWS = 6

// A worklist in a panel, headed by its count, with a link to the full list.
function ListCard({ title, module, page, items, empty }: {
  title: string
  module: string
  page: string
  items: WorkItem[]
  empty: string
}) {
  const more = items.length - MAX_ROWS
  return (
    <Panel
      as="section"
      title={<>{title}<span className="text-muted-foreground ml-2 text-[11px] font-normal tabular-nums">{items.length}</span></>}
      action={
        <a
          href={erpHref(module, page)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex shrink-0 items-center gap-1 rounded text-[11px] outline-none focus-visible:ring-2"
        >
          View all <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
        </a>
      }
      bodyClassName="p-0"
    >
      <Worklist items={items.slice(0, MAX_ROWS)} empty={empty} />
      {more > 0 && (
        <p className="text-muted-foreground border-t px-3.5 py-2 text-[11px]">
          {more} more in <a href={erpHref(module, page)} className="hover:text-foreground underline underline-offset-2">the full list</a>
        </p>
      )}
    </Panel>
  )
}

const Late = ({ days, label = 'late' }: { days: number; label?: string }) =>
  days > 0 ? <span className="text-destructive shrink-0 text-[11px] whitespace-nowrap tabular-nums">{count(days, 'day')} {label}</span> : null

// ---------------------------------------------------------------------------
// CRM

function CrmOverview({ mod }: { mod: ErpModule }) {
  const { data, update } = useErp()
  const open = data.opportunities.filter((r) => !['Won', 'Lost'].includes(str(r, 'stage')))
  const weightOf = (rows: Row[]) => rows.reduce((t, r) => t + (num(r, 'amount') * num(r, 'probability')) / 100, 0)
  const pipeline = sum(open, 'amount')
  const weighted = weightOf(open)
  const won = data.opportunities.filter((r) => r.stage === 'Won').length
  const lost = data.opportunities.filter((r) => r.stage === 'Lost').length
  const leads = data.leads.filter((r) => within(str(r, 'created'), 30))

  const stages = [...new Set(['Discovery', 'Proposal', 'Negotiation', ...open.map((r) => str(r, 'stage'))])].map((stage) => {
    const rows = open.filter((r) => r.stage === stage)
    return { label: stage, amount: sum(rows, 'amount'), weighted: Math.round(weightOf(rows)), note: count(rows.length, 'opportunity', 'opportunities') }
  })
  const sources = groupSum(leads, 'source')
  const late = data.activities
    .filter((r) => r.status === 'Overdue' || (r.status === 'Scheduled' && str(r, 'due') < TODAY))
    .sort(byDate('due'))

  return (
    <Overview
      mod={mod}
      description="Pipeline, win rate and new leads"
      create="opportunities"
      kpis={[
        {
          label: 'Open pipeline', value: formatMoneyShort(pipeline), title: money(pipeline), icon: Target02Icon, page: 'opportunities',
          sub: count(open.length, 'open opportunity', 'open opportunities'),
        },
        {
          label: 'Weighted pipeline', value: formatMoneyShort(weighted), title: money(weighted), icon: Coins01Icon, page: 'opportunities',
          sub: `Amount × probability · ${pct(weighted, pipeline)}% of open`,
        },
        { label: 'Win rate', value: `${pct(won, won + lost)}%`, sub: `${won} won · ${lost} lost`, icon: Award01Icon, page: 'opportunities' },
        {
          label: 'New leads', value: formatNumber(leads.length), icon: UserAdd01Icon, page: 'leads',
          sub: `Last 30 days · ${leads.filter(is('Qualified')).length} qualified`,
        },
      ]}
      chart={
        <Panel as="section" title="Pipeline by stage" action={<Note>{formatMoneyShort(pipeline)} open</Note>}>
          <Columns
            data={stages}
            series={[
              { key: 'amount', label: 'Amount', colour: mod.colour },
              { key: 'weighted', label: 'Weighted', colour: tint(mod.colour, 45) },
            ]}
            format={money}
            axis={formatMoneyShort}
          />
        </Panel>
      }
      side={
        <Panel as="section" title="New leads by source" action={<Note>Last 30 days</Note>}>
          <BarList
            colour={mod.colour}
            empty="No new leads in the last 30 days."
            items={sources.map((s) => ({ id: s.label, label: s.label, value: s.value, display: formatNumber(s.value) }))}
          />
        </Panel>
      }
      list={
        <ListCard
          title="Overdue activities"
          module={mod.id}
          page="activities"
          empty="No overdue activities."
          items={late.map((r) => ({
            id: r.id,
            entity: 'activities',
            title: str(r, 'subject'),
            detail: `${str(r, 'type')} · ${str(r, 'owner')} · due ${formatDate(str(r, 'due'))}`,
            aside: <Late days={age(str(r, 'due'))} />,
            actions: (
              <Button size="sm" variant="outline" onClick={() => {
                update('activities', [r.id], { status: 'Completed' })
                toast.success('Activity completed', { description: str(r, 'subject') })
              }}>
                Mark completed
              </Button>
            ),
          }))}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Sales

const WEEKS = 5

function SalesOverview({ mod }: { mod: ErpModule }) {
  const { data, update } = useErp()
  const openOrders = data.salesOrders.filter(is('Confirmed', 'Processing'))
  const booked = data.salesOrders.filter((r) => r.status !== 'Cancelled')
  const sent = data.quotations.filter(is('Sent'))
  const issued = data.quotations.filter(is('Sent', 'Accepted', 'Rejected', 'Expired'))
  const accepted = data.quotations.filter(is('Accepted')).length
  const toPick = data.deliveries.filter(is('Ready to pick', 'Scheduled')).sort(byDate('scheduled'))
  const late = toPick.filter((r) => str(r, 'scheduled') < TODAY).length

  // Rolling 7-day windows ending today, so the latest point is a full week
  // rather than a part week that always looks like a drop.
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const end = addDays(TODAY, (i - WEEKS + 1) * 7)
    const start = addDays(end, -6)
    const rows = booked.filter((r) => str(r, 'ordered') >= start && str(r, 'ordered') <= end)
    return { label: formatDate(start), title: `${formatDate(start)} – ${formatDate(end)}`, value: sum(rows, 'amount'), note: count(rows.length, 'order') }
  })
  const weeksTotal = weeks.reduce((t, w) => t + w.value, 0)
  const customers = groupSum(booked, 'customer', (r) => num(r, 'amount')).slice(0, 5)
  const openValue = sum(openOrders, 'amount')

  return (
    <Overview
      mod={mod}
      description="Quotations, sales orders and deliveries"
      create="quotations"
      kpis={[
        {
          label: 'Open sales orders', value: formatMoneyShort(openValue), title: money(openValue), icon: Agreement01Icon, page: 'orders',
          sub: `${count(openOrders.length, 'order')} confirmed or processing`,
        },
        {
          label: 'Quotations sent', value: formatNumber(sent.length), icon: QuoteDownIcon, page: 'quotations',
          sub: `${formatMoneyShort(sum(sent, 'amount'))} awaiting a reply`,
        },
        {
          label: 'Conversion rate', value: `${pct(accepted, issued.length)}%`, icon: PercentCircleIcon, page: 'quotations',
          sub: `${accepted} of ${count(issued.length, 'quotation')} accepted`,
        },
        {
          label: 'Deliveries to pick', value: formatNumber(toPick.length), icon: DeliveryTruck01Icon, page: 'deliveries',
          sub: late ? `${late} past the scheduled date` : 'All on schedule', tone: late ? 'negative' : undefined,
        },
      ]}
      chart={
        <Panel as="section" title="Sales orders by week" action={<Note>{formatMoneyShort(weeksTotal)} in {WEEKS} weeks</Note>}>
          <TrendArea data={weeks} series={{ key: 'value', label: 'Order value', colour: mod.colour }} format={money} axis={formatMoneyShort} />
        </Panel>
      }
      side={
        <Panel as="section" title="Top customers" action={<Note>By order value</Note>}>
          <BarList
            colour={mod.colour}
            empty="No sales orders yet."
            items={customers.map((c) => ({ id: c.label, label: c.label, hint: count(c.count, 'order'), value: c.value, display: formatMoneyShort(c.value) }))}
          />
        </Panel>
      }
      list={
        <ListCard
          title="Deliveries to pick"
          module={mod.id}
          page="deliveries"
          empty="Nothing waiting to be picked."
          items={toPick.map((r) => {
            const overdue = str(r, 'scheduled') < TODAY
            return {
              id: r.id,
              entity: 'deliveries',
              title: `${r.id} · ${str(r, 'customer')}`,
              detail: `${str(r, 'order')} · ${str(r, 'warehouse')} · ${str(r, 'carrier')}`,
              aside: (
                <span className="flex shrink-0 items-center gap-2">
                  <span className={cn('text-[11px] whitespace-nowrap tabular-nums', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                    {overdue ? 'Late · ' : ''}{formatDate(str(r, 'scheduled'))}
                  </span>
                  <StatusBadge status={str(r, 'status')} />
                </span>
              ),
              actions: (
                <Button size="sm" variant="outline" onClick={() => {
                  update('deliveries', [r.id], { status: 'In transit' })
                  toast.success(`${r.id} is in transit`, { description: `Sales order ${str(r, 'order')} for ${str(r, 'customer')}.` })
                }}>
                  Mark in transit
                </Button>
              ),
            }
          })}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Inventory

function InventoryOverview({ mod }: { mod: ErpModule }) {
  const { data, openPeek, startCreate } = useErp()
  const valueOf = (r: Row) => num(r, 'onHand') * num(r, 'cost')
  const stockValue = data.items.reduce((t, r) => t + valueOf(r), 0)
  const units = sum(data.items, 'onHand')
  const low = data.items.filter(is('Low stock'))
  const out = data.items.filter(is('Out of stock'))
  const emptyLines = data.stock.filter((r) => num(r, 'onHand') === 0).length
  const transit = data.transfers.filter(is('In transit')).length
  const drafts = data.transfers.filter(is('Draft')).length
  const categories = groupSum(data.items, 'category', valueOf)

  // Emptiest first: out of stock, then the lowest share of the reorder point.
  const fill = (r: Row) => num(r, 'onHand') / Math.max(1, num(r, 'reorderPoint'))
  const reorder = [...low, ...out].sort((a, b) => fill(a) - fill(b))
  const openRequisition = (item: string) =>
    data.requisitions.find((r) => r.item === item && is('Awaiting approval', 'Approved', 'Ordered')(r))

  return (
    <Overview
      mod={mod}
      description="Stock value, reorder alerts and stock transfers"
      create="items"
      kpis={[
        {
          label: 'Stock value', value: formatMoneyShort(stockValue), title: formatMoney(stockValue), icon: PackageIcon, page: 'stock',
          sub: `${formatNumber(units)} units at cost`,
        },
        {
          label: 'Below reorder point', value: formatNumber(low.length + out.length), icon: Alert02Icon, page: 'items',
          sub: `${low.length} low · ${out.length} out of stock`, tone: low.length + out.length ? 'warning' : undefined,
        },
        {
          label: 'Out of stock', value: formatNumber(out.length), icon: PackageRemoveIcon, page: 'items',
          sub: `${count(emptyLines, 'warehouse stock line')} at zero`, tone: out.length ? 'negative' : undefined,
        },
        {
          label: 'Transfers in transit', value: formatNumber(transit), icon: Exchange01Icon, page: 'transfers',
          sub: `${count(drafts, 'draft stock transfer')} not yet sent`,
        },
      ]}
      chart={
        <Panel as="section" title="Stock value by category" action={<Note>At unit cost</Note>}>
          <HBars
            data={categories.map((c) => ({ label: c.label, value: Math.round(c.value), note: count(c.count, 'item') }))}
            series={{ key: 'value', label: 'Stock value', colour: mod.colour }}
            format={money}
            axis={formatMoneyShort}
            labelWidth={88}
            className="h-60"
          />
        </Panel>
      }
      side={
        <Panel as="section" title="Warehouse utilisation">
          <BarList
            colour={mod.colour}
            max={100}
            items={data.warehouses.map((w) => {
              const used = num(w, 'utilisation')
              return {
                id: w.id,
                label: str(w, 'name'),
                hint: `${w.id} · ${str(w, 'city')}`,
                value: used,
                display: `${used}%`,
                colour: used >= 90 ? 'var(--destructive)' : used >= 80 ? 'var(--status-progress)' : undefined,
              }
            })}
          />
        </Panel>
      }
      list={
        <ListCard
          title="Reorder now"
          module={mod.id}
          page="items"
          empty="Every item is above its reorder point."
          items={reorder.map((r) => {
            const name = str(r, 'name')
            const requisition = openRequisition(name)
            const quantity = Math.max(10, Math.ceil((num(r, 'reorderPoint') * 2 - num(r, 'onHand')) / 10) * 10)
            return {
              id: r.id,
              entity: 'items',
              title: name,
              detail: `${r.id} · ${formatNumber(num(r, 'onHand'))} on hand · reorder point ${formatNumber(num(r, 'reorderPoint'))}`,
              aside: <StatusBadge status={str(r, 'status')} />,
              actions: requisition ? (
                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openPeek('requisitions', requisition.id)}>
                  View {requisition.id}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startCreate('requisitions', {
                  item: name, quantity, estimate: Math.round(quantity * num(r, 'cost')), needed: addDays(TODAY, 14),
                })}>
                  Create requisition
                </Button>
              ),
            }
          })}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Purchasing

const PO_STAGES = ['Draft', 'Awaiting approval', 'Approved', 'Partially received', 'Received', 'Closed', 'Rejected']
const stageIndex = (status: string) => (PO_STAGES.includes(status) ? PO_STAGES.indexOf(status) : PO_STAGES.length)

function PurchasingOverview({ mod }: { mod: ErpModule }) {
  const { data, session } = useErp()
  // Matches the launchpad: purchase orders are approved by finance, requisitions by operations too.
  const approvesOrders = session?.role !== 'operations'
  const openOrders = data.purchaseOrders.filter(is('Approved', 'Partially received'))
  const ordersWaiting = data.purchaseOrders.filter(is('Awaiting approval'))
  const requisitionsWaiting = data.requisitions.filter(is('Awaiting approval'))
  const receipts = data.goodsReceipts.filter((r) => within(str(r, 'received'), 30))
  const committed = data.purchaseOrders.filter((r) => !['Draft', 'Rejected', 'Cancelled'].includes(str(r, 'status')))
  const totalSpend = sum(committed, 'amount')
  const spend = groupSum(committed, 'vendor', (r) => num(r, 'amount'))
  const top = spend[0]
  const statuses = groupSum(data.purchaseOrders, 'status', (r) => num(r, 'amount'))
    .sort((a, b) => stageIndex(a.label) - stageIndex(b.label))
  const openValue = sum(openOrders, 'amount')
  const waiting = ordersWaiting.length + requisitionsWaiting.length

  const items: WorkItem[] = [
    ...ordersWaiting.map((r): WorkItem => ({
      id: r.id,
      entity: 'purchaseOrders',
      title: `${r.id} · ${str(r, 'vendor')}`,
      detail: `${formatMoney(num(r, 'amount'))} · ${str(r, 'buyer')} · expected ${formatDate(str(r, 'expected'))}`,
      actions: approvesOrders
        ? <ApproveReject entity="purchaseOrders" id={r.id} />
        : <span className="text-muted-foreground text-[11px]">Needs finance approval</span>,
    })),
    ...requisitionsWaiting.map((r): WorkItem => ({
      id: r.id,
      entity: 'requisitions',
      title: `${r.id} · ${str(r, 'item')}`,
      detail: `${formatNumber(num(r, 'quantity'))} units · est. ${formatMoney(num(r, 'estimate'))} · needed by ${formatDate(str(r, 'needed'))}`,
      actions: <ApproveReject entity="requisitions" id={r.id} />,
    })),
  ]

  return (
    <Overview
      mod={mod}
      description="Purchase orders, approvals and vendor spend"
      create="purchaseOrders"
      kpis={[
        {
          label: 'Open purchase orders', value: formatMoneyShort(openValue), title: money(openValue), icon: ReceiptTextIcon, page: 'orders',
          sub: `${count(openOrders.length, 'order')} approved or partly received`,
        },
        {
          label: 'Awaiting approval', value: formatNumber(waiting), icon: Clock01Icon, page: 'orders',
          sub: `${count(ordersWaiting.length, 'purchase order')} · ${count(requisitionsWaiting.length, 'requisition')}`,
          tone: waiting ? 'warning' : undefined,
        },
        {
          label: 'Goods receipts', value: formatNumber(receipts.length), icon: PackageReceiveIcon, page: 'receipts',
          sub: `Last 30 days · ${receipts.filter(is('Pending')).length} pending`,
        },
        {
          label: 'Top vendor by spend', value: top?.label ?? '—', title: top?.label, icon: Briefcase01Icon, page: 'vendors',
          sub: top ? `${formatMoneyShort(top.value)} · ${pct(top.value, totalSpend)}% of committed spend` : 'No committed spend yet',
        },
      ]}
      chart={
        <Panel as="section" title="Spend by vendor" action={<Note>{formatMoneyShort(totalSpend)} committed</Note>}>
          <HBars
            data={spend.slice(0, 6).map((v) => ({ label: v.label, value: v.value, note: count(v.count, 'purchase order') }))}
            series={{ key: 'value', label: 'Committed spend', colour: mod.colour }}
            format={money}
            axis={formatMoneyShort}
            labelWidth={132}
          />
        </Panel>
      }
      side={
        <Panel as="section" title="Purchase orders by status">
          <BarList
            colour={mod.colour}
            empty="No purchase orders yet."
            items={statuses.map((s) => ({
              id: s.label,
              label: <StatusBadge status={s.label} />,
              hint: count(s.count, 'order'),
              value: s.value,
              display: formatMoneyShort(s.value),
            }))}
          />
        </Panel>
      }
      list={<ListCard title="Awaiting approval" module={mod.id} page="orders" empty="Nothing is waiting for approval." items={items} />}
    />
  )
}

// ---------------------------------------------------------------------------
// Accounting

function AccountingOverview({ mod }: { mod: ErpModule }) {
  const { data, update } = useErp()
  const receivable = data.invoices.filter((r) => !['Paid', 'Draft', 'Void', 'Cancelled'].includes(str(r, 'status')) && num(r, 'balance') > 0)
  const ar = sum(receivable, 'balance')
  // Past the due date, whatever the status says: a part-paid invoice can be overdue too.
  const overdue = receivable.filter((r) => age(str(r, 'due')) > 0).sort((a, b) => age(str(b, 'due')) - age(str(a, 'due')))
  const overdueValue = sum(overdue, 'balance')
  const payable = data.bills.filter(is('Open', 'Overdue'))
  const billsLate = payable.filter((r) => age(str(r, 'due')) > 0).length
  const cashAccount = data.ledgerAccounts.find((r) => r.id === '1000')
  const cash = cashAccount ? num(cashAccount, 'balance') : 0
  const recent = data.payments.filter((r) => within(str(r, 'date'), 30))
  const net = sum(recent.filter((r) => r.direction === 'Received'), 'amount') - sum(recent.filter((r) => r.direction === 'Sent'), 'amount')

  const ageing = [
    { label: 'Current', test: (d: number) => d <= 0, fill: mod.colour },
    { label: '1–30 days', test: (d: number) => d >= 1 && d <= 30, fill: 'var(--status-progress)' },
    { label: '31–60 days', test: (d: number) => d >= 31 && d <= 60, fill: 'color-mix(in oklch, var(--status-progress), var(--destructive))' },
    { label: '60+ days', test: (d: number) => d > 60, fill: 'var(--destructive)' },
  ].map((b) => {
    const rows = receivable.filter((r) => b.test(age(str(r, 'due'))))
    return { label: b.label, value: sum(rows, 'balance'), fill: b.fill, note: count(rows.length, 'invoice') }
  })

  const dueBuckets = [
    { label: 'Overdue', test: (d: number) => d > 0, colour: 'var(--destructive)' },
    { label: 'Due in 7 days', test: (d: number) => d <= 0 && d >= -7, colour: 'var(--status-progress)' },
    { label: 'Due in 8–30 days', test: (d: number) => d < -7 && d >= -30 },
    { label: 'Due later', test: (d: number) => d < -30 },
  ].map((b) => {
    const rows = payable.filter((r) => b.test(age(str(r, 'due'))))
    const value = sum(rows, 'amount')
    return { id: b.label, label: b.label, hint: count(rows.length, 'bill'), value, display: formatMoneyShort(value), colour: b.colour }
  })

  return (
    <Overview
      mod={mod}
      description="Receivables, payables and cash"
      create="invoices"
      kpis={[
        {
          label: 'Accounts receivable', value: formatMoneyShort(ar), title: money(ar), icon: Invoice01Icon, page: 'invoices',
          sub: count(receivable.length, 'open invoice'),
        },
        {
          label: 'Overdue receivables', value: formatMoneyShort(overdueValue), title: money(overdueValue), icon: Alert02Icon, page: 'invoices',
          sub: `${count(overdue.length, 'invoice')} past due · ${pct(overdueValue, ar)}% of AR`, tone: overdue.length ? 'negative' : undefined,
        },
        {
          label: 'Accounts payable', value: formatMoneyShort(sum(payable, 'amount')), title: money(sum(payable, 'amount')), icon: Invoice03Icon, page: 'bills',
          sub: `${count(payable.length, 'open bill')} · ${billsLate} overdue`, tone: billsLate ? 'warning' : undefined,
        },
        {
          label: 'Cash position', value: formatMoneyShort(cash), title: money(cash), icon: BankIcon, page: 'ledger',
          delta: { direction: net >= 0 ? 'up' : 'down', text: formatMoneyShort(Math.abs(net)) },
          sub: 'net payments, last 30 days',
        },
      ]}
      chart={
        <Panel as="section" title="Accounts receivable ageing" action={<Note>Days past due</Note>}>
          <Columns data={ageing} series={[{ key: 'value', label: 'Balance due', colour: mod.colour }]} format={money} axis={formatMoneyShort} />
        </Panel>
      }
      side={
        <Panel as="section" title="Accounts payable by due date" action={<Note>Open bills</Note>}>
          <BarList colour={mod.colour} items={dueBuckets} />
        </Panel>
      }
      list={
        <ListCard
          title="Overdue customer invoices"
          module={mod.id}
          page="invoices"
          empty="No customer invoices are past due."
          items={overdue.map((r) => {
            const balance = num(r, 'balance')
            return {
              id: r.id,
              entity: 'invoices',
              title: `${r.id} · ${str(r, 'customer')}`,
              detail: `${formatMoney(balance)} due ${formatDate(str(r, 'due'))}`,
              aside: (
                <span className="flex shrink-0 items-center gap-2">
                  <Late days={age(str(r, 'due'))} label="overdue" />
                  <StatusBadge status={str(r, 'status')} />
                </span>
              ),
              actions: (
                <>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => {
                    toast.success(`Reminder sent for ${r.id}`, { description: `To ${str(r, 'customer')}'s accounts team.` })
                  }}>
                    Send reminder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    update('invoices', [r.id], { status: 'Paid', balance: 0 })
                    toast.success(`Payment recorded for ${r.id}`, { description: `${formatMoney(balance)} from ${str(r, 'customer')}.` })
                  }}>
                    Record payment
                  </Button>
                </>
              ),
            }
          })}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Human resources

function HrOverview({ mod }: { mod: ErpModule }) {
  const { data } = useErp()
  const staff = data.employees.filter((r) => !['Inactive', 'Terminated'].includes(str(r, 'status')))
  // Marked on leave, or covered by an approved leave request that includes today.
  const away = new Set([
    ...data.employees.filter(is('On leave')).map((r) => str(r, 'name')),
    ...data.leave
      .filter((r) => r.status === 'Approved' && str(r, 'from') <= TODAY && TODAY <= str(r, 'to'))
      .map((r) => str(r, 'employee')),
  ])
  const pending = data.leave.filter(is('Pending')).sort(byDate('from'))
  const runs = [...data.payroll].sort(byDate('period'))
  const paid = runs.filter((r) => r.status !== 'Draft' && str(r, 'payDate') <= TODAY)
  const last = paid.at(-1)
  const previous = paid.at(-2)
  const change = last && previous && num(previous, 'gross')
    ? ((num(last, 'gross') - num(previous, 'gross')) / num(previous, 'gross')) * 100
    : null
  const departments = groupSum(staff, 'department')

  return (
    <Overview
      mod={mod}
      description="Headcount, leave and payroll"
      create="employees"
      kpis={[
        {
          label: 'Headcount', value: formatNumber(staff.length), icon: UserMultipleIcon, page: 'employees',
          sub: `${staff.filter(is('Probation')).length} on probation`,
        },
        {
          label: 'On leave today', value: formatNumber(away.size), icon: Calendar03Icon, page: 'employees',
          sub: `${pct(away.size, staff.length)}% of headcount`,
        },
        {
          label: 'Pending leave requests', value: formatNumber(pending.length), icon: Clock01Icon, page: 'leave',
          sub: `${count(sum(pending, 'days'), 'day')} requested`, tone: pending.length ? 'warning' : undefined,
        },
        {
          label: 'Last payroll gross',
          value: last ? formatMoneyShort(num(last, 'gross')) : '—',
          title: last ? money(num(last, 'gross')) : undefined,
          icon: Wallet01Icon,
          page: 'payroll',
          delta: change !== null && previous
            ? { direction: change >= 0 ? 'up' : 'down', tone: 'neutral', text: `${Math.abs(change).toFixed(1)}%` }
            : undefined,
          sub: last
            ? `${change !== null && previous ? `on ${monthOf(str(previous, 'period'))} · ` : ''}${monthOf(str(last, 'period'))} payroll run`
            : 'No payroll run yet',
        },
      ]}
      chart={
        <Panel as="section" title="Payroll gross by period" action={<Note>{count(runs.length, 'payroll run')}</Note>}>
          <Columns
            data={runs.map((r) => ({
              label: monthOf(str(r, 'period')),
              value: num(r, 'gross'),
              note: `${str(r, 'status')} · ${count(num(r, 'employees'), 'employee')}`,
              // Every bar sets its own fill, since an undefined one would wipe out the series colour.
              fill: r.status === 'Draft' ? tint(mod.colour, 40) : mod.colour,
            }))}
            series={[{ key: 'value', label: 'Gross pay', colour: mod.colour }]}
            format={money}
            axis={formatMoneyShort}
          />
        </Panel>
      }
      side={
        <Panel as="section" title="Headcount by department">
          <BarList
            colour={mod.colour}
            empty="No employees yet."
            items={departments.map((d) => ({ id: d.label, label: d.label, value: d.value, display: formatNumber(d.value) }))}
          />
        </Panel>
      }
      list={
        <ListCard
          title="Pending leave requests"
          module={mod.id}
          page="leave"
          empty="No leave requests are waiting."
          items={pending.map((r) => {
            const days = num(r, 'days')
            const from = str(r, 'from')
            const starts = -age(from)
            return {
              id: r.id,
              entity: 'leave',
              title: `${str(r, 'employee')} · ${str(r, 'type')}`,
              detail: [
                count(days, 'day'),
                days > 1 ? `${formatDate(from)} – ${formatDate(str(r, 'to'))}` : formatDate(from),
                starts > 0 ? `starts in ${count(starts, 'day')}` : starts === 0 ? 'starts today' : 'already started',
              ].join(' · '),
              actions: <ApproveReject entity="leave" id={r.id} />,
            }
          })}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Workplace safety and health

const WSH_WEEKS = 6

function WshOverview({ mod }: { mod: ErpModule }) {
  const { data, update } = useErp()
  // The last incident reported through the forms, for the days-since counter.
  const incidents = data.submissions
    .filter((r) => r.formId === 'incident-report')
    .map((r) => str(r, 'submittedAt').slice(0, 10))
    .sort()
  const lastIncident = incidents.at(-1)
  const recentIncidents = incidents.filter((d) => within(d, 30)).length

  // Inspections are submitted inspection checklists; their result is Passed or Failed.
  const done = data.submissions.filter((r) => r.category === INSPECTION_CATEGORY)
  const passed = done.filter((r) => r.result === 'Passed').length
  const thisWeek = done.filter((r) => within(str(r, 'submittedAt').slice(0, 10), 7))
  const expired = data.certifications.filter(is('Expired'))
  const expiring = data.certifications.filter(is('Expiring'))
  const reviews = [...data.safetyDocuments.filter(is('Review due')), ...data.riskAssessments.filter(is('Review due'))]
  const highRisk = data.riskAssessments.filter((r) => r.rating === 'High')

  // Rolling 7-day windows ending today: inspections passed and failed in each.
  const weeks = Array.from({ length: WSH_WEEKS }, (_, i) => {
    const end = addDays(TODAY, (i - WSH_WEEKS + 1) * 7)
    const start = addDays(end, -6)
    const rows = done.filter((r) => str(r, 'submittedAt').slice(0, 10) >= start && str(r, 'submittedAt').slice(0, 10) <= end)
    return {
      label: formatDate(start), title: `${formatDate(start)} – ${formatDate(end)}`,
      passed: rows.filter((r) => r.result === 'Passed').length, failed: rows.filter((r) => r.result === 'Failed').length, note: count(rows.length, 'inspection'),
    }
  })

  // Share of each course's certificates still valid.
  const courses = groupSum(data.certifications, 'course').map((c) => {
    const rows = data.certifications.filter((r) => r.course === c.label)
    const valid = rows.filter(is('Valid', 'Expiring')).length
    return { label: c.label, total: rows.length, valid, pct: pct(valid, rows.length) }
  }).sort((a, b) => a.pct - b.pct)

  const startReview = (entity: EntityId, r: Row, title: string) => (
    <Button size="sm" variant="outline" onClick={() => {
      update(entity, [r.id], { status: 'In review' })
      toast.success('Review started', { description: title })
    }}>
      Start review
    </Button>
  )

  // Everything due for renewal or review, soonest first.
  const due: (WorkItem & { date: string })[] = [
    ...[...expired, ...expiring].map((r) => ({
      id: r.id, entity: 'certifications' as const, date: str(r, 'expires'),
      title: `${str(r, 'employee')} · ${str(r, 'course')}`,
      detail: `Certificate · ${r.status === 'Expired' ? 'expired' : 'expires'} ${formatDate(str(r, 'expires'))} · ${str(r, 'provider')}`,
      aside: r.status === 'Expired' ? <Late days={age(str(r, 'expires'))} label="ago" /> : <StatusBadge status="Expiring" />,
      actions: (
        <Button size="sm" variant="outline" onClick={() => toast.success(`Refresher booked for ${str(r, 'employee')}`, { description: `${str(r, 'course')}, next available date at ${str(r, 'provider')}.` })}>
          Book refresher
        </Button>
      ),
    })),
    ...data.safetyDocuments.filter(is('Review due')).map((r) => ({
      id: r.id, entity: 'safetyDocuments' as const, date: str(r, 'reviewDue'),
      title: `${str(r, 'title')} v${str(r, 'version')}`,
      detail: `${str(r, 'type')} · review was due ${formatDate(str(r, 'reviewDue'))} · ${str(r, 'owner')}`,
      aside: <Late days={age(str(r, 'reviewDue'))} />,
      actions: startReview('safetyDocuments', r, str(r, 'title')),
    })),
    ...data.riskAssessments.filter(is('Review due')).map((r) => ({
      id: r.id, entity: 'riskAssessments' as const, date: str(r, 'reviewDue'),
      title: str(r, 'activity'),
      detail: `Risk assessment · ${str(r, 'rating').toLowerCase()} risk · review was due ${formatDate(str(r, 'reviewDue'))}`,
      aside: <Late days={age(str(r, 'reviewDue'))} />,
      actions: startReview('riskAssessments', r, str(r, 'activity')),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <Overview
      mod={mod}
      description="Incidents, inspections, training and reviews"
      create="toolboxMeetings"
      kpis={[
        {
          label: 'Days since last incident', value: lastIncident ? formatNumber(age(lastIncident)) : '—', icon: Alert02Icon, page: 'checklists',
          sub: recentIncidents ? `${count(recentIncidents, 'incident')} reported in 30 days` : 'None reported in 30 days',
          tone: recentIncidents ? 'warning' : 'positive',
        },
        {
          label: 'Inspection pass rate', value: `${pct(passed, done.length)}%`, icon: SearchAreaIcon, page: 'inspections',
          sub: `${passed} passed · ${done.length - passed} failed · ${count(thisWeek.length, 'inspection')} this week`,
          tone: thisWeek.some((r) => r.result === 'Failed') ? 'negative' : undefined,
        },
        {
          label: 'Certificates to renew', value: formatNumber(expired.length + expiring.length), icon: Certificate01Icon, page: 'training',
          sub: `${expired.length} expired · ${expiring.length} expire within 60 days`, tone: expired.length ? 'negative' : expiring.length ? 'warning' : undefined,
        },
        {
          label: 'Reviews due', value: formatNumber(reviews.length), icon: AlertDiamondIcon, page: 'risk-assessments',
          sub: `${count(highRisk.length, 'high-risk activity', 'high-risk activities')} · ${count(data.safetyDocuments.length, 'document')}`,
          tone: reviews.length ? 'warning' : undefined,
        },
      ]}
      chart={
        <Panel as="section" title="Inspections by week" action={<Note>{count(done.length, 'inspection')} submitted</Note>}>
          <Columns
            data={weeks}
            series={[
              { key: 'passed', label: 'Passed', colour: 'var(--status-done)' },
              { key: 'failed', label: 'Failed', colour: mod.colour },
            ]}
            format={(n) => count(n, 'inspection')}
            axis={String}
          />
        </Panel>
      }
      side={
        <Panel as="section" title="Training compliance by course" action={<Note>Valid certificates</Note>}>
          <BarList
            colour={mod.colour}
            max={100}
            empty="No certificates recorded."
            items={courses.map((c) => ({ id: c.label, label: c.label, hint: `${c.valid}/${c.total}`, value: c.pct, display: `${c.pct}%` }))}
          />
        </Panel>
      }
      list={
        <ListCard
          title="Due for renewal or review"
          module={mod.id}
          page="training"
          empty="Nothing is due. Every certificate is valid and every document and assessment is within its review date."
          items={due}
        />
      }
    />
  )
}

// ---------------------------------------------------------------------------

export function ModuleOverview({ module }: { module: string }) {
  const mod = moduleById(module)
  if (mod) {
    switch (module) {
      case 'crm': return <CrmOverview mod={mod} />
      case 'sales': return <SalesOverview mod={mod} />
      case 'inventory': return <InventoryOverview mod={mod} />
      case 'purchasing': return <PurchasingOverview mod={mod} />
      case 'accounting': return <AccountingOverview mod={mod} />
      case 'hr': return <HrOverview mod={mod} />
      case 'wsh': return <WshOverview mod={mod} />
    }
  }
  return (
    <PageHeader
      className={PAGE_HEADER}
      title={mod ? `${mod.name} overview` : 'Overview'}
      description="This module has no dashboard yet. Open one of its pages from the sidebar."
    />
  )
}
