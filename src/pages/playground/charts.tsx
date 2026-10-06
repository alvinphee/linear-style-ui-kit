import { BarList, type BarListItem } from '@/components/bar-list'
import { LegendLine, LegendRow } from '@/components/chart-legend'
import { DeltaBadge } from '@/components/delta-badge'
import { LetterMark } from '@/components/mark'
import { Sparkline } from '@/components/sparkline'
import {
  COLOURS, COLOUR_NAMES, Demos, Gallery, Playground, bool, colourOf, element, imports, indent, jsx, lit, str,
  type Values,
} from './Playground'

/* ---------- Chart legend ---------- */

function LegendDemos() {
  return (
    <>
      <Playground
        title="LegendLine"
        description="A line chart's key, drawn outside the chart. Dashed for a comparison."
        controls={[
          { kind: 'text', name: 'label', label: 'Label', initial: 'This period' },
          { kind: 'select', name: 'colour', label: 'Colour', options: COLOUR_NAMES, initial: 'chart-1' },
          { kind: 'switch', name: 'dashed', label: 'Dashed', initial: false },
          { kind: 'switch', name: 'previous', label: 'Add a previous period', initial: true },
        ]}
        render={(v) => (
          <LegendRow>
            <LegendLine label={str(v, 'label') || 'This period'} colour={colourOf(v)} dashed={bool(v, 'dashed')} />
            {bool(v, 'previous') && <LegendLine label="Previous period" colour={COLOURS.muted} dashed />}
          </LegendRow>
        )}
        code={(v) => {
          const line = jsx('LegendLine', { label: str(v, 'label') || 'This period', colour: colourOf(v), dashed: bool(v, 'dashed') })
          const previous = bool(v, 'previous') ? jsx('LegendLine', { label: 'Previous period', colour: COLOURS.muted, dashed: true }) : ''
          return `${imports({ '@/components/chart-legend': ['LegendLine', 'LegendRow'] })}\n\n${jsx('LegendRow', {}, [line, previous])}`
        }}
      />

      <Gallery
        title="Chart legend in use"
        note="LegendRow wraps on a narrow screen"
        items={[
          {
            label: 'in a panel header',
            node: (
              <div className="bg-card w-72 rounded-lg border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                  <span className="text-xs font-medium">Monthly recurring revenue</span>
                  <LegendRow>
                    <LegendLine label="2026" colour={COLOURS['chart-1']} />
                    <LegendLine label="2025" colour={COLOURS.muted} dashed />
                  </LegendRow>
                </div>
                <div className="text-muted-foreground grid h-16 place-items-center text-[11px]">The chart goes here</div>
              </div>
            ),
          },
          {
            label: 'beside a sparkline',
            node: (
              <div className="grid gap-1.5">
                <Sparkline data={[12, 14, 13, 17, 16, 19, 22, 21, 24, 27]} previous={[15, 16, 15, 17, 18, 17, 19, 18, 19, 20]} className="w-40" />
                <LegendRow>
                  <LegendLine label="Signups" colour="var(--status-done)" />
                  <LegendLine label="Last month" colour={COLOURS.muted} dashed />
                </LegendRow>
              </div>
            ),
          },
          {
            label: 'a target line',
            node: (
              <LegendRow>
                <LegendLine label="Remaining" colour={COLOURS['chart-1']} />
                <LegendLine label="Ideal" colour={COLOURS.muted} dashed />
                <LegendLine label="Scope added" colour={COLOURS['chart-3']} />
              </LegendRow>
            ),
          },
        ]}
      />
    </>
  )
}

/* ---------- Bar list ---------- */

const BAR_DATA = ['revenue by customer', 'storage by team'] as const

type BarData = (typeof BAR_DATA)[number]

type Row = { id: string; label: string; hint: string; value: number; display: string; letters: string; mark: string }

// Revenue this quarter, largest first.
const CUSTOMERS: Row[] = [
  { id: 'northwind', label: 'Northwind Traders', hint: '14 invoices', value: 48200, display: '$48.2k', letters: 'NT', mark: 'oklch(0.6 0.17 265)' },
  { id: 'acme', label: 'Acme Corp', hint: '9 invoices', value: 36900, display: '$36.9k', letters: 'AC', mark: 'oklch(0.64 0.15 155)' },
  { id: 'globex', label: 'Globex', hint: '11 invoices', value: 21400, display: '$21.4k', letters: 'GL', mark: 'oklch(0.7 0.14 65)' },
  { id: 'initech', label: 'Initech', hint: '4 invoices', value: 12750, display: '$12.8k', letters: 'IN', mark: 'oklch(0.62 0.12 200)' },
  { id: 'brightline', label: 'Brightline Media', hint: '3 invoices', value: 6300, display: '$6.3k', letters: 'BM', mark: 'oklch(0.64 0.16 340)' },
]

// Share of each team's storage allowance, out of 100.
const TEAMS_STORAGE: Row[] = [
  { id: 'design', label: 'Design', hint: '36 of 50 GB', value: 72, display: '72%', letters: 'DE', mark: 'oklch(0.64 0.15 155)' },
  { id: 'engineering', label: 'Engineering', hint: '27 of 50 GB', value: 54, display: '54%', letters: 'EN', mark: 'oklch(0.6 0.17 265)' },
  { id: 'marketing', label: 'Marketing', hint: '14 of 50 GB', value: 28, display: '28%', letters: 'MK', mark: 'oklch(0.64 0.16 340)' },
  { id: 'support', label: 'Support', hint: '6 of 50 GB', value: 12, display: '12%', letters: 'SU', mark: 'oklch(0.7 0.14 65)' },
]

const ROWS: Record<BarData, Row[]> = { 'revenue by customer': CUSTOMERS, 'storage by team': TEAMS_STORAGE }

const share = (rows: Row[], row: Row) => `${Math.round((row.value / rows.reduce((n, r) => n + r.value, 0)) * 100)}%`

type BarOptions = { data: BarData; hints: boolean; secondary: boolean; marks: boolean; empty: boolean }

function barOptions(v: Values): BarOptions {
  return {
    data: str(v, 'data') as BarData,
    hints: bool(v, 'hints'),
    secondary: bool(v, 'secondary'),
    marks: bool(v, 'marks'),
    empty: bool(v, 'empty'),
  }
}

function barItems({ data, hints, secondary, marks, empty }: BarOptions): BarListItem[] {
  if (empty) return []
  const rows = ROWS[data]
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    hint: hints ? row.hint : undefined,
    value: row.value,
    display: row.display,
    // A share of the total only means something for revenue.
    secondary: secondary && data === 'revenue by customer' ? share(rows, row) : undefined,
    start: marks ? <LetterMark text={row.letters} colour={row.mark} size="xs" /> : undefined,
  }))
}

function barCode(v: Values) {
  const o = barOptions(v)
  const rows = ROWS[o.data]
  const percent = o.data === 'storage by team'
  const head = imports({
    '@/components/bar-list': ['BarList', 'type BarListItem'],
    '@/components/mark': o.marks && !o.empty ? ['LetterMark'] : [],
  })
  const items = o.empty
    ? 'const items: BarListItem[] = []'
    : `const items: BarListItem[] = [\n${rows.map((row) => {
      const plain = lit({
        id: row.id,
        label: row.label,
        hint: o.hints ? row.hint : undefined,
        value: row.value,
        display: row.display,
        secondary: o.secondary && !percent ? share(rows, row) : undefined,
      })
      const start = o.marks ? `, start: <LetterMark text="${row.letters}" colour="${row.mark}" size="xs" />` : ''
      return indent(`${plain.replace(/ }$/, `${start} }`)},`)
    }).join('\n')}\n]`
  const body = element('BarList', [
    'items={items}',
    str(v, 'colour') !== 'brand' && `colour="${colourOf(v)}"`,
    percent && 'max={100}',
    bool(v, 'ranked') && 'ranked',
    o.empty && 'empty="No revenue this quarter yet."',
    'className="w-80"',
  ])
  return `${head}\n\n${items}\n\n${body}`
}

function BarListDemos() {
  return (
    <>
      <Playground
        title="BarList"
        description="A ranked breakdown, lighter than a chart. The value is in text; the bar is decoration."
        controls={[
          { kind: 'select', name: 'data', label: 'Data', options: BAR_DATA, initial: 'revenue by customer' },
          { kind: 'select', name: 'colour', label: 'Colour', options: COLOUR_NAMES, initial: 'brand' },
          { kind: 'switch', name: 'ranked', label: 'Ranked', initial: false },
          { kind: 'switch', name: 'hints', label: 'Hints', initial: true },
          { kind: 'switch', name: 'secondary', label: 'Share of total (secondary)', initial: false },
          { kind: 'switch', name: 'marks', label: 'Marks (start)', initial: false },
          { kind: 'switch', name: 'empty', label: 'No items', initial: false },
        ]}
        render={(v) => {
          const o = barOptions(v)
          return (
            <div className="bg-card w-80 max-w-full rounded-lg border p-3.5">
              <BarList
                items={barItems(o)}
                colour={colourOf(v)}
                max={o.data === 'storage by team' ? 100 : undefined}
                ranked={bool(v, 'ranked')}
                empty={o.empty ? 'No revenue this quarter yet.' : undefined}
              />
            </div>
          )
        }}
        code={barCode}
      />

      <Gallery
        title="BarList in use"
        items={[
          {
            label: 'ranked, with marks',
            node: (
              <div className="w-64">
                <BarList items={barItems({ data: 'revenue by customer', hints: false, secondary: false, marks: true, empty: false }).slice(0, 3)} ranked />
              </div>
            ),
          },
          {
            label: 'a colour per bar',
            node: (
              <div className="w-64">
                <BarList
                  max={100}
                  items={[
                    { id: 'done', label: 'Done', value: 58, display: '58%', colour: 'var(--status-done)' },
                    { id: 'progress', label: 'In progress', value: 27, display: '27%', colour: 'var(--status-progress)' },
                    { id: 'blocked', label: 'Blocked', value: 15, display: '15%', colour: 'var(--status-blocked)' },
                  ]}
                />
              </div>
            ),
          },
          {
            label: 'in a panel',
            node: (
              <div className="bg-card w-72 rounded-lg border">
                <div className="flex items-baseline justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">Signups by source</span>
                  <span className="text-muted-foreground text-[11px]">Last 30 days</span>
                </div>
                <BarList
                  colour={COLOURS['chart-2']}
                  className="p-3"
                  items={[
                    { id: 'search', label: 'Search', value: 412, hint: 'Organic' },
                    { id: 'referral', label: 'Referrals', value: 268 },
                    { id: 'ads', label: 'Ads', value: 154, hint: 'Paid' },
                    { id: 'social', label: 'Social', value: 97 },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

// --- Sparkline -----------------------------------------------------------

// Ten points of this period and the one before. Made up and fixed.
const SPARK_UP = [12, 14, 13, 17, 16, 19, 22, 21, 24, 27]

const SPARK_DOWN = [27, 25, 26, 22, 23, 19, 18, 19, 15, 13]

const SPARK_FLAT = [18, 19, 17, 18, 20, 19, 18, 19, 18, 19]

const SPARK_PREVIOUS = [15, 16, 15, 17, 18, 17, 19, 18, 19, 20]

export default function ChartsDemos() {
  return (
    <Demos>
      <LegendDemos />

      <BarListDemos />

      <Gallery
        title="Sparkline"
        note="The dashed line is the period before. Decorative: keep the number beside it."
        items={[
          { label: 'tone="positive"', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} /> },
          { label: 'no previous', node: <Sparkline data={SPARK_UP} /> },
          { label: 'tone="negative"', node: <Sparkline data={SPARK_DOWN} previous={SPARK_PREVIOUS} tone="negative" /> },
          { label: 'tone="warning"', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} tone="warning" /> },
          { label: 'tone="neutral"', node: <Sparkline data={SPARK_FLAT} previous={SPARK_PREVIOUS} tone="neutral" /> },
          { label: 'h-12 w-40', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} className="h-12 w-40" /> },
          {
            label: 'beside its number',
            node: (
              <div className="flex items-end gap-3">
                <div className="grid gap-0.5">
                  <span className="text-muted-foreground text-[11px]">Open pipeline</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-base font-semibold tabular-nums">$48.2k</span>
                    <DeltaBadge direction="up" text="+12.4%" />
                  </span>
                </div>
                <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} />
              </div>
            ),
          },
        ]}
      />
    </Demos>
  )
}
