import { StatusBadge, type Tone } from '@/components/status-badge'
import {
  Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format'
import { Demos, Gallery, Playground, bool, str, type Values } from './Playground'

// The plain table the data table block is built on: header, rows, an
// optional footer and caption. For sorting, filters and paging use the data
// table block below. All content is made up.

type Invoice = { id: string; customer: string; status: string; tone: Tone; amount: number }

const INVOICES: Invoice[] = [
  { id: 'INV-2026-0409', customer: 'Northwind Traders', status: 'Overdue', tone: 'danger', amount: 6200 },
  { id: 'INV-2026-0415', customer: 'Acme Corp', status: 'Overdue', tone: 'danger', amount: 4320 },
  { id: 'INV-2026-0418', customer: 'Globex', status: 'Paid', tone: 'success', amount: 2420 },
  { id: 'INV-2026-0421', customer: 'Initech', status: 'Sent', tone: 'info', amount: 1980 },
  { id: 'INV-2026-0428', customer: 'Umbrella Health', status: 'Draft', tone: 'neutral', amount: 910 },
  { id: 'INV-2026-0433', customer: 'Stark Logistics', status: 'Paid', tone: 'success', amount: 12400 },
]

const ROW_COUNTS = ['3', '6'] as const
const DENSITIES = ['default', 'compact'] as const

function InvoiceTable({ rows, density = 'default', status = true, footer = false, caption = false }: {
  rows: number
  density?: (typeof DENSITIES)[number]
  status?: boolean
  footer?: boolean
  caption?: boolean
}) {
  const shown = INVOICES.slice(0, rows)
  const cell = density === 'compact' ? 'py-1' : undefined
  return (
    <Table>
      {caption && <TableCaption>Invoices raised this month.</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          {status && <TableHead>Status</TableHead>}
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shown.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className={cell}><span className="text-muted-foreground tabular-nums">{inv.id}</span></TableCell>
            <TableCell className={cell}>{inv.customer}</TableCell>
            {status && <TableCell className={cell}><StatusBadge tone={inv.tone}>{inv.status}</StatusBadge></TableCell>}
            <TableCell className={`${cell ?? ''} text-right tabular-nums`}>{formatMoney(inv.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {footer && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={status ? 3 : 2}>Total</TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(shown.reduce((n, inv) => n + inv.amount, 0))}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  )
}

function tableCode(v: Values) {
  const compact = str(v, 'density') === 'compact'
  const cell = compact ? ' className="py-1"' : ''
  const lines = [
    "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'",
    '',
    '<Table>',
    ...(bool(v, 'caption') ? ['  <TableCaption>Invoices raised this month.</TableCaption>'] : []),
    '  <TableHeader>',
    '    <TableRow>',
    '      <TableHead>Invoice</TableHead>',
    '      <TableHead>Customer</TableHead>',
    ...(bool(v, 'status') ? ['      <TableHead>Status</TableHead>'] : []),
    '      <TableHead className="text-right">Amount</TableHead>',
    '    </TableRow>',
    '  </TableHeader>',
    '  <TableBody>',
    '    {invoices.map((inv) => (',
    '      <TableRow key={inv.id}>',
    `        <TableCell${cell}>{inv.id}</TableCell>`,
    `        <TableCell${cell}>{inv.customer}</TableCell>`,
    ...(bool(v, 'status') ? [`        <TableCell${cell}><StatusBadge tone={inv.tone}>{inv.status}</StatusBadge></TableCell>`] : []),
    `        <TableCell className="${compact ? 'py-1 ' : ''}text-right tabular-nums">{formatMoney(inv.amount)}</TableCell>`,
    '      </TableRow>',
    '    ))}',
    '  </TableBody>',
    ...(bool(v, 'footer') ? [
      '  <TableFooter>',
      '    <TableRow>',
      `      <TableCell colSpan={${bool(v, 'status') ? 3 : 2}}>Total</TableCell>`,
      '      <TableCell className="text-right tabular-nums">{formatMoney(total)}</TableCell>',
      '    </TableRow>',
      '  </TableFooter>',
    ] : []),
    '</Table>',
  ]
  if (bool(v, 'caption')) lines[0] = lines[0].replace('TableBody, TableCell', 'TableBody, TableCaption, TableCell')
  if (bool(v, 'footer')) lines[0] = lines[0].replace('TableCell, TableHead', 'TableCell, TableFooter, TableHead')
  return lines.join('\n')
}

export default function DataTableDemos() {
  return (
    <Demos>
      <Playground
        title="Table"
        description="the plain table: header, rows, footer and caption. Numbers align right."
        controls={[
          { kind: 'select', name: 'rows', label: 'Rows', options: ROW_COUNTS, initial: '3' },
          { kind: 'select', name: 'density', label: 'Density', options: DENSITIES, initial: 'default' },
          { kind: 'switch', name: 'status', label: 'Status column', initial: true },
          { kind: 'switch', name: 'footer', label: 'Footer (total)', initial: false },
          { kind: 'switch', name: 'caption', label: 'Caption', initial: false },
        ]}
        render={(v) => (
          <div className="w-full max-w-xl min-w-0 overflow-x-auto rounded-lg border">
            <InvoiceTable
              rows={Number(str(v, 'rows'))}
              density={str(v, 'density') as (typeof DENSITIES)[number]}
              status={bool(v, 'status')}
              footer={bool(v, 'footer')}
              caption={bool(v, 'caption')}
            />
          </div>
        )}
        code={tableCode}
      />

      <Gallery
        title="Table in use"
        note="in a bordered card it scrolls sideways on a phone"
        items={[
          { label: 'compact, no status', node: <div className="w-72 overflow-x-auto rounded-lg border"><InvoiceTable rows={3} density="compact" status={false} /></div> },
          { label: 'with a total', node: <div className="w-96 max-w-full overflow-x-auto rounded-lg border"><InvoiceTable rows={3} footer /></div> },
        ]}
      />
    </Demos>
  )
}
