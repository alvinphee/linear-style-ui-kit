import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon, Copy01Icon, Delete02Icon, FileExportIcon, Mail01Icon, PencilEdit02Icon,
  SquareArrowExpand01Icon, UserGroupIcon, UserIcon, ViewIcon,
} from '@hugeicons/core-free-icons'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  BulkDelete, DataTable, RangeFilter, actionsColumn, dataTableColumns, listNames, selectColumn,
  setColumnFilter, useDataTable, type DataTableRowAction,
} from '@/blocks/data-table'
import { RecordSheet, RecordSheetContent } from '@/blocks/record-sheet'
import { Person, UserAvatar } from '@/components/person'
import { StatusBadge, TONE_DOT, type Tone } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { formatMoney, formatShortDate } from '@/lib/format'
import { seededRandom } from '@/lib/random'
import { plural } from '@/lib/text'
import { PEOPLE } from '../data'
import { Section } from './shared'

/* ---------- Sample data ---------- */

type Plan = 'free' | 'starter' | 'pro' | 'enterprise'
type AccountStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

type Customer = {
  id: string
  name: string
  email: string
  plan: Plan
  status: AccountStatus
  // Monthly amount in dollars.
  amount: number
  seats: number
  // Timestamp, so the basic comparator sorts it.
  created: number
  owner: string
}

const PLANS: Record<Plan, { label: string; price: number; rank: number }> = {
  free: { label: 'Free', price: 0, rank: 0 },
  starter: { label: 'Starter', price: 12, rank: 1 },
  pro: { label: 'Pro', price: 29, rank: 2 },
  enterprise: { label: 'Enterprise', price: 59, rank: 3 },
}
const PLAN_KEYS = Object.keys(PLANS) as Plan[]

// `dot` overrides the tone's dot: Canceled keeps the kit's "todo" grey, a
// shade darker than the neutral tone's dot.
const STATUSES: Record<AccountStatus, { label: string; tone: Tone; dot?: string; rank: number }> = {
  active: { label: 'Active', tone: 'success', rank: 0 },
  trialing: { label: 'Trialing', tone: 'progress', rank: 1 },
  past_due: { label: 'Past due', tone: 'danger', rank: 2 },
  canceled: { label: 'Canceled', tone: 'neutral', dot: 'bg-status-todo', rank: 3 },
}
const dotOf = (s: AccountStatus) => STATUSES[s].dot ?? TONE_DOT[STATUSES[s].tone]
const STATUS_KEYS = Object.keys(STATUSES) as AccountStatus[]

const FIRST = [
  'Ava', 'Liam', 'Noah', 'Mia', 'Ethan', 'Zara', 'Kai', 'Nora', 'Leo', 'Iris', 'Omar', 'Hana', 'Ivan', 'Maya', 'Theo',
  'Lena', 'Arjun', 'Sofia', 'Yuki', 'Felix', 'Ines', 'Elena', 'Tomas', 'Priya', 'Jonah', 'Amara', 'Hugo', 'Chloe',
  'Mateo', 'Rhea',
]
const LAST = [
  'Hart', 'Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Reyes', 'Novak', 'Brennan', 'Castillo', 'Haddad', 'Kowalski',
  'Mendes', 'Sato', 'Varga', 'Whitlock', 'Quinn', 'Adeyemi', 'Falk', 'Rossi', 'Dubois',
]

const DAY = 86_400_000

function makeCustomers(count: number): Customer[] {
  // Seeded, so every visitor sees the same 150 rows.
  const rand = seededRandom(20260930)
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]
  const end = new Date(2026, 8, 30, 18).getTime()
  const names = new Set<string>()
  const rows: Omit<Customer, 'id'>[] = []

  while (rows.length < count) {
    const first = pick(FIRST)
    const last = pick(LAST)
    const name = `${first} ${last}`
    if (names.has(name)) continue
    names.add(name)

    const p = rand()
    const plan: Plan = p < 0.12 ? 'free' : p < 0.45 ? 'starter' : p < 0.82 ? 'pro' : 'enterprise'
    const s = rand()
    const status: AccountStatus =
      plan === 'free' ? (s < 0.85 ? 'active' : 'canceled')
        : s < 0.72 ? 'active' : s < 0.84 ? 'trialing' : s < 0.93 ? 'past_due' : 'canceled'
    const seats =
      plan === 'free' ? 1 + Math.floor(rand() * 3)
        : plan === 'starter' ? 2 + Math.floor(rand() * 9)
          : plan === 'pro' ? 5 + Math.floor(rand() * 36)
            : 25 + Math.floor(rand() * 176)
    const discount = plan === 'enterprise' ? 0.85 : 1
    const billed = status === 'active' || status === 'past_due'

    rows.push({
      name,
      email: `${first}.${last}@example.com`.toLowerCase(),
      plan,
      status,
      amount: billed ? Math.round(seats * PLANS[plan].price * discount * 100) / 100 : 0,
      seats,
      created: end - Math.floor(rand() * 640) * DAY - Math.floor(rand() * DAY),
      owner: pick(PEOPLE),
    })
  }

  // IDs follow sign-up order; the table starts newest first.
  return rows
    .sort((a, b) => a.created - b.created)
    .map((row, i) => ({ id: `CUS-${1001 + i}`, ...row }))
    .reverse()
}

const SEED = makeCustomers(150)
const SEED_ORDER = new Map(SEED.map((c, i) => [c.id, i]))

const created = (t: number) => formatShortDate(t, { year: true })

// Copies a row's value for Copy ID / Copy email, naming it in the toast.
const copyValue = (value: string, what: string) =>
  copyText(value, { success: `Copied ${value}`, error: `Could not copy the ${what}` })

/* ---------- Table setup ---------- */

const col = dataTableColumns<Customer>()

const columns = col.columns([
  selectColumn<Customer>(),
  col.accessor('id', {
    header: 'ID',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{getValue()}</span>,
    meta: { label: 'ID', className: 'w-24' },
  }),
  col.accessor('name', {
    header: 'Customer',
    sortFn: 'text',
    cell: ({ getValue }) => <Person name={getValue()} className="font-medium" avatarClassName="font-normal" />,
    meta: { label: 'Customer' },
  }),
  col.accessor('email', {
    header: 'Email',
    sortFn: 'text',
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    meta: { label: 'Email' },
  }),
  col.accessor('plan', {
    header: 'Plan',
    filterFn: 'oneOf',
    sortFn: (a, b, id) => PLANS[a.getValue<Plan>(id)].rank - PLANS[b.getValue<Plan>(id)].rank,
    cell: ({ getValue }) => (
      <span className={cn(getValue() === 'free' && 'text-muted-foreground')}>{PLANS[getValue()].label}</span>
    ),
    meta: { label: 'Plan' },
  }),
  col.accessor('status', {
    header: 'Status',
    filterFn: 'oneOf',
    sortFn: (a, b, id) =>
      STATUSES[a.getValue<AccountStatus>(id)].rank - STATUSES[b.getValue<AccountStatus>(id)].rank,
    cell: ({ getValue }) => <CustomerStatus status={getValue()} />,
    meta: { label: 'Status' },
  }),
  col.accessor('amount', {
    header: 'Amount',
    filterFn: 'inNumberRange',
    sortFn: 'basic',
    cell: ({ getValue }) => (
      <span className={cn(getValue() === 0 && 'text-muted-foreground')}>{formatMoney(getValue())}</span>
    ),
    meta: { label: 'Amount', align: 'right' },
  }),
  col.accessor('seats', {
    header: 'Seats',
    sortFn: 'basic',
    meta: { label: 'Seats', align: 'right' },
  }),
  col.accessor('created', {
    header: 'Created',
    sortFn: 'basic',
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{created(getValue())}</span>,
    meta: { label: 'Created' },
  }),
  col.accessor('owner', {
    header: 'Owner',
    filterFn: 'oneOf',
    sortFn: 'text',
    cell: ({ getValue }) => <Person name={getValue()} />,
    meta: { label: 'Owner' },
  }),
  actionsColumn<Customer>(),
])

// Only these columns go into the CSV, in the order they are shown.
const CSV: Partial<Record<string, (c: Customer) => string>> = {
  id: (c) => c.id,
  name: (c) => c.name,
  email: (c) => c.email,
  plan: (c) => PLANS[c.plan].label,
  status: (c) => STATUSES[c.status].label,
  amount: (c) => c.amount.toFixed(2),
  seats: (c) => String(c.seats),
  created: (c) => format(c.created, 'yyyy-MM-dd'),
  owner: (c) => c.owner,
}

const SEARCHABLE = ['id', 'name', 'email']

const FACETS = [
  {
    column: 'status',
    title: 'Status',
    options: STATUS_KEYS.map((s) => ({
      value: s, label: STATUSES[s].label, visual: <span className={cn('size-1.5 rounded-full', dotOf(s))} />,
    })),
  },
  { column: 'plan', title: 'Plan', options: PLAN_KEYS.map((p) => ({ value: p, label: PLANS[p].label })) },
  {
    column: 'owner',
    title: 'Owner',
    options: PEOPLE.map((name) => ({ value: name, label: name, visual: <UserAvatar name={name} className="size-4" /> })),
  },
]

/* ---------- Section ---------- */

export default function DataTableSection() {
  const [data, setData] = useState(SEED)
  const [peekId, setPeekId] = useState<string | null>(null)

  const table = useDataTable({ data, columns, getRowId: (row) => row.id, search: SEARCHABLE, pageSize: 10 })

  function removeRows(ids: string[]) {
    const gone = new Set(ids)
    const removed = data.filter((c) => gone.has(c.id))
    if (!removed.length) return
    setData((current) => current.filter((c) => !gone.has(c.id)))
    table.setRowSelection((old) => {
      const next = { ...old }
      for (const id of ids) delete next[id]
      return next
    })
    toast(`Deleted ${removed.length === 1 ? removed[0].name : plural(removed.length, 'customer')}`, {
      action: {
        label: 'Undo',
        onClick: () =>
          setData((current) =>
            [...current.filter((c) => !gone.has(c.id)), ...removed].sort(
              (a, b) => SEED_ORDER.get(a.id)! - SEED_ORDER.get(b.id)!,
            ),
          ),
      },
    })
  }

  const amountMax = useMemo(() => Math.max(100, Math.ceil(Math.max(...data.map((c) => c.amount)) / 100) * 100), [data])
  const amount = table.getColumn('amount')?.getFilterValue() as [number, number] | undefined
  // The peek steps through rows in the current filter and sort order, across pages.
  const orderedRows = table.getPrePaginatedRowModel().rows.map((r) => r.original)
  const peeked = peekId ? data.find((c) => c.id === peekId) ?? null : null

  return (
    <Section id="data-table" title="Data table" description="Sort, filter, search, pick columns and page through 150 rows">
      <DataTable
        table={table}
        className="lg:col-span-2"
        title="Customers"
        count={data.length}
        hint="Shift-click headers to sort by more than one column"
        density
        csv={{ filename: 'customers', values: CSV }}
        search={{ placeholder: 'Search name, email or ID', label: 'Search customers by name, email or ID' }}
        facets={FACETS}
        filters={
          <RangeFilter
            title="Amount"
            heading="Monthly amount"
            value={amount}
            max={amountMax}
            step={50}
            format={(n) => formatMoney(n, false)}
            presets={[
              { label: 'Under $100', range: [0, 100] },
              { label: '$100 – $1k', range: [100, 1000] },
              { label: 'Over $1k', range: [1000, amountMax] },
            ]}
            onChange={(v) => setColumnFilter(table, 'amount', v)}
          />
        }
        bulkActions={(rows) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.success(`Exported ${plural(rows.length, 'customer')}`, {
                  description: 'Demo only: nothing was downloaded.',
                })
              }
            >
              <HugeiconsIcon icon={FileExportIcon} strokeWidth={2} data-icon="inline-start" />
              Export selected
            </Button>
            <BulkDelete
              title={`Delete ${plural(rows.length, 'customer')}?`}
              description={`${listNames(rows.map((r) => r.name))} will be removed from the table. You can undo this from the notice that follows.`}
              onConfirm={() => removeRows(rows.map((r) => r.id))}
            />
          </>
        )}
        onRowClick={(c) => setPeekId(c.id)}
        rowActions={(c) => customerActions(c, { open: () => setPeekId(c.id), remove: () => removeRows([c.id]) })}
        rowLabel={(c) => c.name}
        caption="Customers. Sortable columns have a button in their header; hold Shift to sort by more than one."
        empty={{
          action: data.length === 0
            ? <Button variant="outline" size="sm" onClick={() => setData(SEED)}>Restore sample rows</Button>
            : undefined,
        }}
        minTableWidth="54rem"
        scrollClassName="max-h-[30rem]"
      />
      <CustomerPeek
        customer={peeked}
        rows={orderedRows}
        onOpen={setPeekId}
        onClose={() => setPeekId(null)}
        onRemove={(id) => removeRows([id])}
      />
    </Section>
  )
}

/* ---------- Pieces ---------- */

// The kit's outline status badge, kept at this table's pill shape and 10px text.
function CustomerStatus({ status }: { status: AccountStatus }) {
  const s = STATUSES[status]
  return (
    <StatusBadge
      tone={s.tone}
      variant="outline"
      dotClassName={s.dot}
      className="bg-input/20 dark:bg-input/30 rounded-full px-2 text-[10px]"
    >
      {s.label}
    </StatusBadge>
  )
}

/* ---------- Row actions: one list, shown by right-click and by the … button ---------- */

function customerActions(customer: Customer, { open, remove }: { open: () => void; remove: () => void }): DataTableRowAction[] {
  return [
    { label: 'Open', icon: ViewIcon, shortcut: '↵', onSelect: open },
    { label: 'Copy ID', icon: Copy01Icon, onSelect: () => copyValue(customer.id, 'ID') },
    { label: 'Copy email', icon: Mail01Icon, onSelect: () => copyValue(customer.email, 'email') },
    {
      label: 'Edit', icon: PencilEdit02Icon,
      onSelect: () => toast(`Editing ${customer.name}`, { description: 'Demo only: there is no edit form.' }),
    },
    'separator',
    { label: 'Delete', icon: Delete02Icon, destructive: true, onSelect: remove },
  ]
}

/* ---------- Peek: the record sheet block for one row ---------- */

function CustomerPeek({ customer, rows, onOpen, onClose, onRemove }: {
  customer: Customer | null
  rows: Customer[]
  onOpen: (id: string) => void
  onClose: () => void
  onRemove: (id: string) => void
}) {
  const index = customer ? rows.findIndex((r) => r.id === customer.id) : -1
  const prev = index > 0 ? rows[index - 1] : undefined
  const next = index >= 0 && index < rows.length - 1 ? rows[index + 1] : undefined

  return (
    <RecordSheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      {customer && (
        <RecordSheetContent
          number={<span className="font-mono text-[11px]">{customer.id}</span>}
          title={customer.name}
          description={`${customer.name}, ${customer.email}`}
          noun="customer"
          navigation={{
            index,
            total: rows.length,
            onPrevious: prev && (() => onOpen(prev.id)),
            onNext: next && (() => onOpen(next.id)),
          }}
          properties={<span className="text-muted-foreground min-w-0 truncate text-xs">{customer.email}</span>}
          details={[
            { label: 'Status', value: <CustomerStatus status={customer.status} /> },
            { label: 'Plan', value: PLANS[customer.plan].label },
            { label: 'Amount', value: <span className="tabular-nums">{formatMoney(customer.amount)} / month</span> },
            {
              label: 'Seats',
              value: (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                  {customer.seats}
                </span>
              ),
            },
            { label: 'Owner', value: <Person name={customer.owner} className="gap-1.5" /> },
            {
              label: 'Created',
              value: (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                  {created(customer.created)}
                </span>
              ),
            },
          ]}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast('Open full page', { description: 'Demo only: this playground is a single page.' })}
              >
                <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} data-icon="inline-start" />
                Open full page
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyValue(customer.email, 'email')}>
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
                Copy email
              </Button>
            </>
          }
          onDelete={() => onRemove(customer.id)}
          deleteTitle={`Delete ${customer.name}?`}
          deleteDescription="They will be removed from the table. You can undo this from the notice that follows."
        >
          <div className="bg-subtle grid gap-1 rounded-lg border p-3">
            <p className="text-muted-foreground text-[11px] font-medium">Yearly value</p>
            <p className="text-lg font-semibold tabular-nums">{formatMoney(customer.amount * 12, false)}</p>
            <p className="text-muted-foreground text-[11px]">
              {customer.seats > 0 ? `${formatMoney(customer.amount / customer.seats)} per seat each month` : 'No seats yet'}
            </p>
          </div>
        </RecordSheetContent>
      )}
    </RecordSheet>
  )
}
