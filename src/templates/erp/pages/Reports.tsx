import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { cn } from 'cn'
import { KpiCard } from '@/blocks/kpi-card'
import { DeltaBadge, type KpiDelta } from '@/components/delta-badge'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { StatusBadge as KitStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyDescription } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMoney, formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { useErp } from '../store'
import { TODAY, formatDate, formatMoneyShort } from '../format'
import type { Row } from '../types'
import { PAGE_HEADER, StatusBadge } from '../ui'

// Accounting › Financial reports: profit and loss, balance sheet and a cash
// flow summary, all worked out from the chart of accounts and payments in the
// store, so an edit to a ledger account shows here at once.

type Period = 'month' | 'quarter' | 'ytd'

// Ledger balances are year to date; a shorter period takes a fixed share of them.
const PERIODS: Record<Period, { label: string; current: string; prior: string; share: number }> = {
  month: { label: 'This month', current: 'Oct 2026', prior: 'Sep 2026', share: 0.12 },
  quarter: { label: 'This quarter', current: 'Q4 2026', prior: 'Q3 2026', share: 0.35 },
  ytd: { label: 'Year to date', current: 'YTD 2026', prior: 'YTD 2025', share: 1 },
}

const COGS = '5000'
const PRIOR_YEAR_END = '2025-12-31'

// The demo keeps one balance per account, so comparison figures are derived
// from it: a fixed factor per account code (0.84–1.06), the same on every visit.
const drift = (code: string) => 0.84 + ((Number(code) * 7919) % 23) / 100
const round = (n: number) => Math.round(n / 100) * 100
const byCode = (a: Row, b: Row) => a.id.localeCompare(b.id)
const inRange = (r: Row, from: number, to: number) => Number(r.id) >= from && Number(r.id) < to

// Statements show negatives in brackets, as accountants write them.
const amount = (n: number) => (n < 0 ? `(${formatNumber(-n)})` : formatNumber(n))
const short = (n: number) => (n < 0 ? `−${formatMoneyShort(-n)}` : formatMoneyShort(n))

type Pair = { current: number; prior: number }

type Line = {
  kind: 'heading' | 'group' | 'line' | 'subtotal' | 'total' | 'check'
  label: string
  // A ledger account: the line opens it in the side panel.
  code?: string
  note?: string
  current?: number
  prior?: number
  // Which way is good for the change column: up (1), down (-1) or neither.
  better?: 1 | -1
  depth?: 0 | 1 | 2
}

const sum = (lines: Line[]): Pair => ({
  current: lines.reduce((t, l) => t + (l.current ?? 0), 0),
  prior: lines.reduce((t, l) => t + (l.prior ?? 0), 0),
})

function profitAndLoss(ledger: Row[], share: number) {
  const line = (r: Row, better: 1 | -1): Line => {
    const current = round(Number(r.balance) * share)
    return { kind: 'line', code: r.id, label: String(r.name), current, prior: round(current * drift(r.id)), better, depth: 1 }
  }
  const income = ledger.filter((r) => r.type === 'Income').sort(byCode).map((r) => line(r, 1))
  const cogs = ledger.filter((r) => r.type === 'Expense' && r.id === COGS).map((r) => line(r, -1))
  const opex = ledger.filter((r) => r.type === 'Expense' && r.id !== COGS).sort(byCode).map((r) => line(r, -1))

  const revenue = sum(income)
  const cost = sum(cogs)
  const expenses = sum(opex)
  const gross = { current: revenue.current - cost.current, prior: revenue.prior - cost.prior }
  const net = { current: gross.current - expenses.current, prior: gross.prior - expenses.prior }

  const lines: Line[] = [
    { kind: 'heading', label: 'Revenue' },
    ...income,
    { kind: 'subtotal', label: 'Total revenue', ...revenue, better: 1, depth: 0 },
    { kind: 'heading', label: 'Cost of goods sold' },
    ...cogs,
    ...(cogs.length > 1 ? [{ kind: 'subtotal', label: 'Total cost of goods sold', ...cost, better: -1, depth: 0 } as Line] : []),
    { kind: 'total', label: 'Gross profit', ...gross, better: 1 },
    { kind: 'heading', label: 'Operating expenses' },
    ...opex,
    { kind: 'subtotal', label: 'Total operating expenses', ...expenses, better: -1, depth: 0 },
    { kind: 'total', label: 'Net income', ...net, better: 1 },
  ]
  return { lines, opex, revenue, cost, expenses, gross, net }
}

function balanceSheet(ledger: Row[], earnings: Pair) {
  // Accumulated depreciation is a contra account: it reduces assets.
  const line = (r: Row, depth: 1 | 2): Line => {
    const current = /^accumulated/i.test(String(r.name)) ? -Number(r.balance) : Number(r.balance)
    return { kind: 'line', code: r.id, label: String(r.name), current, prior: round(current * drift(r.id)), depth }
  }
  const pick = (type: string, from: number, to: number, depth: 1 | 2) =>
    ledger.filter((r) => r.type === type && inRange(r, from, to)).sort(byCode).map((r) => line(r, depth))
  const group = (label: string, lines: Line[]): Line[] =>
    lines.length ? [{ kind: 'group', label, depth: 1 }, ...lines, { kind: 'subtotal', label: `Total ${label.toLowerCase()}`, ...sum(lines), depth: 1 }] : []

  const currentAssets = pick('Asset', 1000, 1500, 2)
  const fixedAssets = pick('Asset', 1500, 2000, 2)
  const currentLiabilities = pick('Liability', 2000, 2500, 2)
  const longTermLiabilities = pick('Liability', 2500, 3000, 2)
  const equityAccounts = pick('Equity', 3000, 4000, 1)

  const assets = sum([...currentAssets, ...fixedAssets])
  const liabilities = sum([...currentLiabilities, ...longTermLiabilities])
  const booked = sum(equityAccounts)
  // The seeded balances are not a full double-entry ledger, so an opening
  // balance line takes up the difference, as it would after a data migration.
  const opening = {
    current: assets.current - liabilities.current - booked.current - earnings.current,
    prior: assets.prior - liabilities.prior - booked.prior - earnings.prior,
  }
  const equity = { current: booked.current + earnings.current + opening.current, prior: booked.prior + earnings.prior + opening.prior }
  const both = { current: liabilities.current + equity.current, prior: liabilities.prior + equity.prior }
  const difference = { current: assets.current - both.current, prior: assets.prior - both.prior }

  const assetLines: Line[] = [
    { kind: 'heading', label: 'Assets' },
    ...group('Current assets', currentAssets),
    ...group('Non-current assets', fixedAssets),
    { kind: 'total', label: 'Total assets', ...assets },
  ]
  const claimLines: Line[] = [
    { kind: 'heading', label: 'Liabilities' },
    ...group('Current liabilities', currentLiabilities),
    ...group('Non-current liabilities', longTermLiabilities),
    { kind: 'subtotal', label: 'Total liabilities', ...liabilities, depth: 0 },
    { kind: 'heading', label: 'Equity' },
    ...equityAccounts,
    { kind: 'line', label: 'Current year earnings', note: 'Net income, year to date', ...earnings, depth: 1 },
    { kind: 'line', label: 'Opening balance equity', note: 'Balancing entry', ...opening, depth: 1 },
    { kind: 'subtotal', label: 'Total equity', ...equity, depth: 0 },
    { kind: 'total', label: 'Total liabilities and equity', ...both },
    { kind: 'check', label: 'Assets = liabilities + equity', ...difference },
  ]
  return { assetLines, claimLines, assets, liabilities, equity, balanced: difference.current === 0 && difference.prior === 0 }
}

function cashFlow(ledger: Row[], payments: Row[]) {
  // Cash and cash equivalents sit in accounts 1000–1099.
  const cashAccounts = ledger.filter((r) => r.type === 'Asset' && inRange(r, 1000, 1100)).sort(byCode)
  const closing = cashAccounts.reduce((t, r) => t + Number(r.balance), 0)
  const byMethod = (rows: Row[], sign: 1 | -1): Line[] => {
    const methods = [...new Set(rows.map((r) => String(r.method)))].sort()
    return methods.map((method) => {
      const list = rows.filter((r) => r.method === method)
      const total = list.reduce((t, r) => t + Number(r.amount), 0)
      return { kind: 'line', label: method, note: plural(list.length, 'payment'), current: sign * total, depth: 1 }
    })
  }
  const incoming = payments.filter((r) => r.direction === 'Received')
  const outgoing = payments.filter((r) => r.direction === 'Sent')
  const inLines = byMethod(incoming, 1)
  const outLines = byMethod(outgoing, -1)
  const received = sum(inLines).current
  const paid = sum(outLines).current
  const net = received + paid
  const opening = closing - net
  const from = payments.reduce((min, r) => (String(r.date) < min ? String(r.date) : min), TODAY)

  const lines: Line[] = [
    { kind: 'subtotal', label: 'Opening cash balance', current: opening, depth: 0 },
    { kind: 'heading', label: 'Cash received from customers' },
    ...inLines,
    { kind: 'subtotal', label: 'Total cash received', current: received, depth: 0 },
    { kind: 'heading', label: 'Cash paid to vendors' },
    ...outLines,
    { kind: 'subtotal', label: 'Total cash paid', current: paid, depth: 0 },
    { kind: 'total', label: 'Net cash flow', current: net },
    { kind: 'heading', label: 'Cash accounts' },
    ...cashAccounts.map((r): Line => ({ kind: 'line', code: r.id, label: String(r.name), current: Number(r.balance), depth: 1 })),
    { kind: 'total', label: 'Closing cash balance', current: closing },
  ]
  return {
    lines, opening, received, paid, net, closing, from,
    receivedCount: incoming.length, paidCount: outgoing.length, pending: payments.filter((r) => r.status === 'Pending'),
  }
}

const CONTENT = 'grid content-start gap-4 px-4 pt-1 pb-8 text-[13px] @2xl:px-6'

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function FinancialReports() {
  const { data, company, openPeek } = useErp()
  const [period, setPeriod] = useState<Period>('ytd')
  const [tab, setTab] = useState('pnl')
  const p = PERIODS[period]

  const pnl = useMemo(() => profitAndLoss(data.ledgerAccounts, p.share), [data.ledgerAccounts, p.share])
  // Current year earnings on the balance sheet are always the full year to date.
  const ytdNet = useMemo(() => profitAndLoss(data.ledgerAccounts, 1).net, [data.ledgerAccounts])
  const bs = useMemo(() => balanceSheet(data.ledgerAccounts, ytdNet), [data.ledgerAccounts, ytdNet])
  const cash = useMemo(() => cashFlow(data.ledgerAccounts, data.payments), [data.ledgerAccounts, data.payments])

  const asOf = formatDate(TODAY, true)
  const priorYearEnd = formatDate(PRIOR_YEAR_END, true)
  const context = {
    pnl: `${p.current} compared with ${p.prior}`,
    bs: `As of ${asOf} compared with ${priorYearEnd}`,
    cash: `Payments from ${formatDate(cash.from)} to ${formatDate(TODAY)}`,
  }[tab]

  const margin = (n: number) => (pnl.revenue.current ? `${((n / pnl.revenue.current) * 100).toFixed(1)}% margin` : undefined)
  const totalExpenses = (k: keyof Pair) => pnl.cost[k] + pnl.expenses[k]
  const chartData = [
    { period: p.prior, revenue: pnl.revenue.prior, expenses: totalExpenses('prior') },
    { period: p.current, revenue: pnl.revenue.current, expenses: totalExpenses('current') },
  ]
  const opexTotal = pnl.expenses.current || 1
  const opexRanked = [...pnl.opex].sort((a, b) => (b.current ?? 0) - (a.current ?? 0))

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-full gap-0">
      <PageHeader
        className={PAGE_HEADER}
        title="Financial reports"
        description={[company?.name, context, 'amounts in USD'].filter(Boolean).join(' · ')}
        actions={
          <>
            {/* Only the profit and loss covers a period; the other reports are as of today. */}
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)} disabled={tab !== 'pnl'}>
              <SelectTrigger size="sm" className="w-32" aria-label="Reporting period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {(Object.keys(PERIODS) as Period[]).map((k) => (
                  <SelectItem key={k} value={k}>{PERIODS[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => toast('Demo only', { description: 'Export to PDF is not part of this template.' })}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export PDF
            </Button>
          </>
        }
      >
        <TabsList variant="line" className="-mx-1.5">
          <TabsTrigger value="pnl">Profit and loss</TabsTrigger>
          <TabsTrigger value="bs">Balance sheet</TabsTrigger>
          <TabsTrigger value="cash">Cash flow</TabsTrigger>
        </TabsList>
      </PageHeader>

      <TabsContent value="pnl" className={CONTENT}>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          <Kpi label="Revenue" value={pnl.revenue} priorLabel={p.prior} better={1} />
          <Kpi label="Gross profit" value={pnl.gross} priorLabel={p.prior} better={1} hint={margin(pnl.gross.current)} />
          <Kpi label="Operating expenses" value={pnl.expenses} priorLabel={p.prior} better={-1} />
          <Kpi label="Net income" value={pnl.net} priorLabel={p.prior} better={1} hint={margin(pnl.net.current)} />
        </div>
        <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel as="section" title="Profit and loss" note={`${p.current} · USD`} className="overflow-hidden" bodyClassName="p-0">
            <Statement lines={pnl.lines} columns={[p.current, p.prior]} onOpen={(code) => openPeek('ledgerAccounts', code)} />
          </Panel>
          <div className="grid min-w-0 gap-4">
            <Panel as="section" title="Revenue and expenses">
              <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
                <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barGap={2} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} width={44} tickMargin={4} tickFormatter={(v: number) => short(v)} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ChartContainer>
              <p className="text-muted-foreground mt-2 text-[11px]">
                Expenses are cost of goods sold plus operating expenses.
              </p>
            </Panel>
            <Panel as="section" title="Operating expenses by account">
              <ul className="grid gap-2.5">
                {opexRanked.map((l) => {
                  const share = ((l.current ?? 0) / opexTotal) * 100
                  return (
                    <li key={l.code}>
                      <button
                        type="button"
                        onClick={() => openPeek('ledgerAccounts', l.code!)}
                        className="group/bar focus-visible:ring-ring/40 grid w-full gap-1 rounded text-left outline-none focus-visible:ring-2"
                      >
                        <span className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="group-hover/bar:text-foreground truncate">{l.label}</span>
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {short(l.current ?? 0)} · {share.toFixed(0)}%
                          </span>
                        </span>
                        <span className="bg-muted block h-1.5 overflow-hidden rounded-full">
                          <span className="bg-chart-2 block h-full rounded-full" style={{ width: `${Math.max(share, 1)}%` }} />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="bs" className={CONTENT}>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          <Kpi label="Total assets" value={bs.assets} priorLabel={priorYearEnd} />
          <Kpi label="Total liabilities" value={bs.liabilities} priorLabel={priorYearEnd} />
          <Kpi label="Total equity" value={bs.equity} priorLabel={priorYearEnd} />
          <KpiCard
            label="Balance check"
            value={bs.balanced ? <BalancedBadge /> : <StatusBadge status="Out of balance" />}
            footnote="Assets = liabilities + equity"
          />
        </div>
        <div className="grid grid-cols-1 items-start gap-4 @5xl:grid-cols-2">
          <Panel as="section" title="Assets" note={`As of ${asOf} · USD`} className="overflow-hidden" bodyClassName="p-0">
            <Statement lines={bs.assetLines} columns={[asOf, priorYearEnd]} onOpen={(code) => openPeek('ledgerAccounts', code)} />
          </Panel>
          <Panel as="section" title="Liabilities and equity" note={`As of ${asOf} · USD`} className="overflow-hidden" bodyClassName="p-0">
            <Statement lines={bs.claimLines} columns={[asOf, priorYearEnd]} onOpen={(code) => openPeek('ledgerAccounts', code)} />
          </Panel>
        </div>
      </TabsContent>

      <TabsContent value="cash" className={CONTENT}>
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          <Kpi label="Opening cash balance" value={{ current: cash.opening, prior: 0 }} hint={`As of ${formatDate(cash.from)}`} />
          <Kpi label="Cash received" value={{ current: cash.received, prior: 0 }} hint={`${cash.receivedCount} customer payments`} />
          <Kpi label="Cash paid" value={{ current: -cash.paid, prior: 0 }} hint={`${cash.paidCount} vendor payments`} />
          <Kpi label="Closing cash balance" value={{ current: cash.closing, prior: 0 }} hint={`Net ${cash.net < 0 ? 'outflow' : 'inflow'} ${short(Math.abs(cash.net))}`} />
        </div>
        <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel as="section" title="Cash flow summary" note={`${formatDate(cash.from)} – ${formatDate(TODAY)} · USD`} className="overflow-hidden" bodyClassName="p-0">
            <Statement lines={cash.lines} head="Description" columns={['Amount']} compare={false} onOpen={(code) => openPeek('ledgerAccounts', code)} />
          </Panel>
          <Panel as="section" title="Not yet reconciled" action={<span className="text-muted-foreground text-[11px] tabular-nums">{cash.pending.length}</span>}>
            {cash.pending.length ? (
              <ul className="-my-1 grid">
                {cash.pending.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openPeek('payments', r.id)}
                      className="hover:bg-accent/60 focus-visible:ring-ring/40 -mx-1.5 grid w-[calc(100%+0.75rem)] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded-md px-1.5 py-1.5 text-left outline-none focus-visible:ring-2"
                    >
                      <span className="truncate text-xs font-medium">{String(r.party)}</span>
                      <span className={cn('text-xs tabular-nums', r.direction === 'Sent' && 'text-muted-foreground')}>
                        {r.direction === 'Sent' ? '−' : '+'}{formatMoney(Number(r.amount), false)}
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-[11px]">{r.id} · {String(r.method)}</span>
                      <span className="text-muted-foreground text-[11px]">{formatDate(String(r.date))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="p-2">
                <EmptyDescription>Every payment is reconciled.</EmptyDescription>
              </Empty>
            )}
          </Panel>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// The kit's status badge with a tick in place of the dot, a size up.
function BalancedBadge() {
  return (
    <KitStatusBadge tone="success" dot={false} className="h-6 gap-1 px-2 text-xs">
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" /> Balanced
    </KitStatusBadge>
  )
}

// The change on the period before as a delta badge: green when it moved the
// good way (`better`: up 1, down -1), red when not, grey when neither or flat.
function changeOf(current: number, prior: number, better?: 1 | -1): KpiDelta | undefined {
  if (!prior) return undefined
  const pct = ((current - prior) / Math.abs(prior)) * 100
  if (Math.abs(pct) < 0.05) return { direction: 'up', tone: 'neutral', text: '0.0%' }
  const direction = pct > 0 ? 'up' : 'down'
  return {
    direction,
    text: `${pct > 0 ? '+' : '−'}${Math.abs(pct).toFixed(1)}%`,
    tone: !better ? 'neutral' : Math.sign(pct) === better ? 'positive' : 'negative',
  }
}

// A report KPI: the kit's KPI card, with the change on `priorLabel` and a hint.
function Kpi({ label, value, priorLabel, better, hint }: {
  label: string
  value: Pair
  priorLabel?: string
  better?: 1 | -1
  hint?: string
}) {
  const delta = priorLabel ? changeOf(value.current, value.prior, better) : undefined
  const vs = priorLabel && `${delta ? '' : '— '}vs ${priorLabel}`
  return <KpiCard label={label} value={short(value.current)} delta={delta} footnote={[vs, hint].filter(Boolean).join(' · ')} />
}

// A statement's Change column: the delta badge, or a dash with nothing to compare.
function Change({ current, prior, better }: { current: number; prior: number; better?: 1 | -1 }) {
  const delta = changeOf(current, prior, better)
  return delta ? <DeltaBadge {...delta} /> : <span className="text-muted-foreground">—</span>
}

const INDENT = ['pl-3.5', 'pl-6', 'pl-9'] as const

function Statement({ lines, head = 'Account', columns, compare = true, onOpen }: {
  lines: Line[]
  head?: string
  columns: string[]
  compare?: boolean
  onOpen: (code: string) => void
}) {
  const span = compare ? 4 : 2
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-muted-foreground hover:bg-transparent">
          <TableHead className="text-muted-foreground h-8 pl-3.5 text-[11px]">{head}</TableHead>
          <TableHead className={cn('text-muted-foreground h-8 text-right text-[11px]', !compare && 'pr-3.5')}>{columns[0]}</TableHead>
          {compare && (
            <>
              <TableHead className="text-muted-foreground hidden h-8 text-right text-[11px] @xl:table-cell">{columns[1]}</TableHead>
              <TableHead className="text-muted-foreground h-8 pr-3.5 text-right text-[11px]">Change</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((l, i) => {
          const indent = INDENT[l.depth ?? 0]
          if (l.kind === 'heading' || l.kind === 'group') {
            return (
              <TableRow key={i} className="border-b-0 hover:bg-transparent">
                <TableCell
                  colSpan={span}
                  className={cn(
                    indent,
                    l.kind === 'heading' ? 'pt-4 pb-1 text-xs font-semibold' : 'text-muted-foreground pt-2.5 pb-0.5 text-[11px] font-medium',
                    i === 0 && 'pt-3',
                  )}
                >
                  {l.label}
                </TableCell>
              </TableRow>
            )
          }

          const strong = l.kind === 'total' || l.kind === 'check'
          const open = l.code ? () => onOpen(l.code!) : undefined
          return (
            <TableRow
              key={i}
              onClick={open}
              className={cn(
                'tabular-nums',
                l.kind === 'line' ? 'border-b-0' : 'border-t border-b-0 hover:bg-transparent',
                l.kind === 'subtotal' && 'font-medium',
                strong && 'bg-subtle font-semibold',
                !open && l.kind === 'line' && 'hover:bg-transparent',
              )}
            >
              <TableCell className={cn('w-full max-w-0 py-1.5', indent, l.kind === 'subtotal' && 'py-2', strong && 'py-2.5')}>
                {l.kind === 'check' ? (
                  <span className="flex min-w-0 items-center gap-2">
                    {l.current === 0 && (l.prior ?? 0) === 0 ? <BalancedBadge /> : <StatusBadge status="Out of balance" />}
                    <span className="text-muted-foreground truncate text-xs font-normal">{l.label}</span>
                  </span>
                ) : open ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      open()
                    }}
                    className="hover:text-foreground focus-visible:ring-ring/40 flex max-w-full min-w-0 items-baseline gap-2 rounded text-left outline-none focus-visible:ring-2"
                  >
                    <span className="text-muted-foreground shrink-0 font-mono text-[11px]">{l.code}</span>
                    <span className="truncate">{l.label}</span>
                  </button>
                ) : (
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate">{l.label}</span>
                    {l.note && <span className="text-muted-foreground hidden truncate text-[11px] font-normal @md:inline">{l.note}</span>}
                  </span>
                )}
              </TableCell>
              <TableCell className={cn('w-28 text-right', !compare && 'pr-3.5')}>{amount(l.current ?? 0)}</TableCell>
              {compare && (
                <>
                  <TableCell className="text-muted-foreground hidden w-28 text-right @xl:table-cell">{amount(l.prior ?? 0)}</TableCell>
                  <TableCell className="w-20 pr-3.5 text-right">
                    {l.kind === 'check' ? <span className="text-muted-foreground">—</span> : <Change current={l.current ?? 0} prior={l.prior ?? 0} better={l.better} />}
                  </TableCell>
                </>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
