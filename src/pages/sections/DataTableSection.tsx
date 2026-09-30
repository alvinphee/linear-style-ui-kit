import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon, ArrowDown02Icon, ArrowLeft01Icon, ArrowLeftDoubleIcon, ArrowRight01Icon, ArrowRightDoubleIcon,
  ArrowUp01Icon, ArrowUp02Icon, ArrowUpDownIcon, Calendar03Icon, Cancel01Icon, Copy01Icon, Delete02Icon,
  Download01Icon, FileExportIcon, Mail01Icon, MoreHorizontalIcon, PencilEdit02Icon, PlusSignCircleIcon, Rows2Icon,
  Rows4Icon, Search01Icon, SlidersHorizontalIcon, SquareArrowExpand01Icon, Tick02Icon, UserGroupIcon, UserIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  FlexRender, columnFacetingFeature, columnFilteringFeature, columnVisibilityFeature, constructFilterFn,
  createColumnHelper, createFacetedRowModel, createFacetedUniqueValues, createFilteredRowModel,
  createPaginatedRowModel, createSortedRowModel, filterFn_inNumberRange, filterFn_includesString,
  globalFilteringFeature, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, sortFn_alphanumeric,
  sortFn_basic, sortFn_text, tableFeatures, useTable, type Header, type Row, type Table,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PEOPLE } from '../data'
import { Section } from './shared'
import { Initials } from './StatusSection'

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

const STATUSES: Record<AccountStatus, { label: string; dot: string; rank: number }> = {
  active: { label: 'Active', dot: 'bg-status-done', rank: 0 },
  trialing: { label: 'Trialing', dot: 'bg-status-progress', rank: 1 },
  past_due: { label: 'Past due', dot: 'bg-status-blocked', rank: 2 },
  canceled: { label: 'Canceled', dot: 'bg-status-todo', rank: 3 },
}
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

// Small seeded generator, so every visitor sees the same 150 rows.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000

function makeCustomers(count: number): Customer[] {
  const rand = seeded(20260930)
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

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const wholeMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/* ---------- Table setup ---------- */

type ColumnMeta = { label: string; align?: 'right'; className?: string }
type TableMeta = { removeRows: (ids: string[]) => void; openRow: (id: string) => void }

const filterFn_oneOf = constructFilterFn({
  filter: (dataValue: unknown, filterValue: unknown[]) => filterValue.includes(dataValue),
  autoRemove: (value: unknown) => !Array.isArray(value) || value.length === 0,
})

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnFacetingFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString, inNumberRange: filterFn_inNumberRange, oneOf: filterFn_oneOf },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, basic: sortFn_basic },
  columnMeta: {} as ColumnMeta,
  tableMeta: {} as TableMeta,
})
type Features = typeof features

const SEARCHABLE = ['id', 'name', 'email']

// The shared Checkbox only styles checked/unchecked, so draw the "some selected" dash here.
const MIXED =
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary ' +
  'data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden ' +
  'data-[state=indeterminate]:before:absolute data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 ' +
  'data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current'

const helper = createColumnHelper<Features, Customer>()

const columns = helper.columns([
  helper.display({
    id: 'select',
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <RowCheckbox row={row} />,
    enableHiding: false,
    meta: { label: 'Select', className: 'w-8' },
  }),
  helper.accessor('id', {
    header: 'ID',
    sortFn: 'alphanumeric',
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{getValue()}</span>,
    meta: { label: 'ID', className: 'w-24' },
  }),
  helper.accessor('name', {
    header: 'Customer',
    sortFn: 'text',
    cell: ({ getValue }) => (
      <span className="flex min-w-0 items-center gap-2">
        <Initials name={getValue()} className="size-5" />
        <span className="truncate font-medium">{getValue()}</span>
      </span>
    ),
    meta: { label: 'Customer' },
  }),
  helper.accessor('email', {
    header: 'Email',
    sortFn: 'text',
    cell: ({ getValue }) => <span className="text-muted-foreground">{getValue()}</span>,
    meta: { label: 'Email' },
  }),
  helper.accessor('plan', {
    header: 'Plan',
    filterFn: 'oneOf',
    sortFn: (a, b, id) => PLANS[a.getValue<Plan>(id)].rank - PLANS[b.getValue<Plan>(id)].rank,
    cell: ({ getValue }) => (
      <span className={cn(getValue() === 'free' && 'text-muted-foreground')}>{PLANS[getValue()].label}</span>
    ),
    meta: { label: 'Plan' },
  }),
  helper.accessor('status', {
    header: 'Status',
    filterFn: 'oneOf',
    sortFn: (a, b, id) =>
      STATUSES[a.getValue<AccountStatus>(id)].rank - STATUSES[b.getValue<AccountStatus>(id)].rank,
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    meta: { label: 'Status' },
  }),
  helper.accessor('amount', {
    header: 'Amount',
    filterFn: 'inNumberRange',
    sortFn: 'basic',
    cell: ({ getValue }) => (
      <span className={cn(getValue() === 0 && 'text-muted-foreground')}>{money.format(getValue())}</span>
    ),
    meta: { label: 'Amount', align: 'right' },
  }),
  helper.accessor('seats', {
    header: 'Seats',
    sortFn: 'basic',
    meta: { label: 'Seats', align: 'right' },
  }),
  helper.accessor('created', {
    header: 'Created',
    sortFn: 'basic',
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{format(getValue(), 'd MMM yyyy')}</span>,
    meta: { label: 'Created' },
  }),
  helper.accessor('owner', {
    header: 'Owner',
    filterFn: 'oneOf',
    sortFn: 'text',
    cell: ({ getValue }) => (
      <span className="flex items-center gap-2">
        <Initials name={getValue()} className="size-5" />
        {getValue()}
      </span>
    ),
    meta: { label: 'Owner' },
  }),
  helper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => <RowActions row={row} table={table} />,
    enableHiding: false,
    meta: { label: 'Actions', className: 'w-10' },
  }),
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

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function downloadCsv(filename: string, lines: string[][]) {
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(['﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

type Density = 'compact' | 'comfortable'
const ROW_HEIGHT: Record<Density, string> = { compact: 'h-9', comfortable: 'h-12' }
const CELL_PADDING: Record<Density, string> = { compact: 'py-1', comfortable: 'py-2.5' }
const PAGE_SIZES = [10, 20, 50]

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/* ---------- Section ---------- */

export default function DataTableSection() {
  const [data, setData] = useState(SEED)
  const [density, setDensity] = useState<Density>('compact')
  const [peekId, setPeekId] = useState<string | null>(null)
  const pageSizeId = useId()

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: (column) => SEARCHABLE.includes(column.id),
    // Every column starts ascending, including numbers: asc, then desc, then off.
    sortDescFirst: false,
    // Pages are reset by hand on filter and sort changes, so deleting a row keeps the current page.
    autoResetPageIndex: false,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    meta: { removeRows, openRow: setPeekId },
  })

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

  const { pagination, sorting, columnFilters, globalFilter } = table.state
  const search = String(globalFilter ?? '')
  const filtered = columnFilters.length > 0 || search !== ''
  const filteredCount = table.getFilteredRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const pageRows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const visibleColumns = table.getVisibleLeafColumns()
  const amountMax = useMemo(() => Math.max(100, Math.ceil(Math.max(...data.map((c) => c.amount)) / 100) * 100), [data])
  // The peek steps through rows in the current filter and sort order, across pages.
  const orderedRows = table.getPrePaginatedRowModel().rows.map((r) => r.original)
  const peeked = peekId ? data.find((c) => c.id === peekId) ?? null : null

  // Deleting rows can leave the current page past the end.
  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) table.setPageIndex(Math.max(0, pageCount - 1))
  }, [pagination.pageIndex, pageCount, table])

  function setFilter(columnId: string, value: unknown) {
    table.getColumn(columnId)?.setFilterValue(value)
    table.setPageIndex(0)
  }

  function facet(columnId: string, options: { value: string; label: string; visual?: ReactNode }[]) {
    const column = table.getColumn(columnId)
    const counts = column?.getFacetedUniqueValues()
    return {
      options: options.map((o) => ({ ...o, count: counts?.get(o.value) ?? 0 })),
      selected: (column?.getFilterValue() as string[] | undefined) ?? [],
      onChange: (values: string[]) => setFilter(columnId, values.length ? values : undefined),
    }
  }

  function resetFilters() {
    table.resetColumnFilters(true)
    table.setGlobalFilter('')
    table.setPageIndex(0)
  }

  function exportCsv() {
    const cols = visibleColumns.filter((c) => CSV[c.id])
    const rows = table.getPrePaginatedRowModel().rows.map((r) => r.original)
    if (!rows.length) {
      toast.error('Nothing to export', { description: 'No rows match the current filters.' })
      return
    }
    downloadCsv(`customers-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
      cols.map((c) => c.columnDef.meta?.label ?? c.id),
      ...rows.map((row) => cols.map((c) => CSV[c.id]!(row))),
    ])
    toast.success(`Exported ${plural(rows.length, 'row')}`, {
      description: filtered ? 'Only rows that match the filters, in the current order.' : 'All rows, in the current order.',
    })
  }

  const selectedNames = selectedRows.map((r) => r.original.name)
  const namedSelection =
    selectedNames.length > 3 ? `${selectedNames.slice(0, 2).join(', ')} and ${selectedNames.length - 2} more` : selectedNames.join(', ')

  return (
    <Section id="data-table" title="Data table" description="Sort, filter, search, pick columns and page through 150 rows">
      <article className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="text-xs font-medium">Customers</h3>
            <span className="text-muted-foreground text-[11px] tabular-nums">{data.length}</span>
            <span className="text-muted-foreground hidden text-[11px] md:inline">Shift-click headers to sort by more than one column</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={density}
              onValueChange={(v) => v && setDensity(v as Density)}
              aria-label="Row density"
            >
              <ToggleGroupItem value="compact" aria-label="Compact rows" className="text-xs">
                <HugeiconsIcon icon={Rows4Icon} strokeWidth={2} data-icon="inline-start" />
                <span className="hidden sm:inline">Compact</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="comfortable" aria-label="Comfortable rows" className="text-xs">
                <HugeiconsIcon icon={Rows2Icon} strokeWidth={2} data-icon="inline-start" />
                <span className="hidden sm:inline">Comfortable</span>
              </ToggleGroupItem>
            </ToggleGroup>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    // Keep the menu open so several columns can be switched in a row.
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(on) => column.toggleVisibility(on)}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => table.resetColumnVisibility(true)}>Show all columns</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={exportCsv}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
              Export CSV
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
          <InputGroup className="w-full sm:w-60">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => {
                table.setGlobalFilter(e.target.value)
                table.setPageIndex(0)
              }}
              placeholder="Search name, email or ID"
              aria-label="Search customers by name, email or ID"
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  onClick={() => {
                    table.setGlobalFilter('')
                    table.setPageIndex(0)
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <FacetFilter
            title="Status"
            {...facet('status', STATUS_KEYS.map((s) => ({
              value: s, label: STATUSES[s].label, visual: <span className={cn('size-1.5 rounded-full', STATUSES[s].dot)} />,
            })))}
          />
          <FacetFilter title="Plan" {...facet('plan', PLAN_KEYS.map((p) => ({ value: p, label: PLANS[p].label })))} />
          <FacetFilter
            title="Owner"
            {...facet('owner', PEOPLE.map((name) => ({ value: name, label: name, visual: <Initials name={name} className="size-4" /> })))}
          />
          <AmountFilter
            value={table.getColumn('amount')?.getFilterValue() as [number, number] | undefined}
            max={amountMax}
            onChange={(v) => setFilter('amount', v)}
          />
          {filtered && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-end" />
            </Button>
          )}
          {filtered && (
            <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
              {filteredCount} of {plural(data.length, 'row')}
            </span>
          )}
        </div>

        {selectedRows.length > 0 && (
          <div
            role="toolbar"
            aria-label="Bulk actions"
            className="bg-brand/5 dark:bg-brand/10 flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-1.5"
          >
            <span className="text-xs whitespace-nowrap" aria-live="polite">
              <span className="font-medium tabular-nums">{selectedRows.length}</span> selected
            </span>
            {selectedRows.length < filteredCount && (
              <Button variant="link" size="sm" className="px-1" onClick={() => table.toggleAllRowsSelected(true)}>
                Select all {filteredCount}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast.success(`Exported ${plural(selectedRows.length, 'customer')}`, {
                    description: 'Demo only: nothing was downloaded.',
                  })
                }
              >
                <HugeiconsIcon icon={FileExportIcon} strokeWidth={2} data-icon="inline-start" />
                Export selected
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive">
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete {plural(selectedRows.length, 'customer')}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {namedSelection} will be removed from the table. You can undo this from the notice that follows.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => removeRows(selectedRows.map((r) => r.id))}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={() => table.resetRowSelection(true)}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        )}

        {/* Scrolls both ways, so the sticky header stays put and the page never scrolls sideways. */}
        <div className="@container relative max-h-[30rem] overflow-auto">
          <table className={cn('w-full caption-bottom text-xs', pageRows.length > 0 && 'min-w-[54rem]')}>
            <caption className="sr-only">
              Customers. Sortable columns have a button in their header; hold Shift to sort by more than one.
            </caption>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <HeaderCell
                      key={header.id}
                      header={header}
                      multiSort={sorting.length > 1}
                      onSort={() => table.setPageIndex(0)}
                    />
                  ))}
                </tr>
              ))}
            </thead>
            <TableBody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>
                      <TableRow
                        data-state={row.getIsSelected() ? 'selected' : undefined}
                        tabIndex={0}
                        aria-label={`${row.original.name}. Press Enter to open, or the menu key for actions.`}
                        onClick={(e) => {
                          // Clicks on the checkbox, buttons or menus inside the row keep their own meaning.
                          if ((e.target as HTMLElement).closest('button, a, input, [role=checkbox], [role=menuitem]')) return
                          setPeekId(row.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target === e.currentTarget) setPeekId(row.id)
                        }}
                        className={cn(
                          ROW_HEIGHT[density],
                          'group/row cursor-pointer outline-none focus-visible:bg-accent data-[state=open]:bg-accent',
                          'data-[state=selected]:bg-brand/5 dark:data-[state=selected]:bg-brand/10',
                        )}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                'px-2 first:pl-3 last:pr-3',
                                CELL_PADDING[density],
                                meta?.align === 'right' && 'text-right tabular-nums',
                                meta?.className,
                              )}
                            >
                              <FlexRender cell={cell} />
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuLabel className="truncate">{row.original.name}</ContextMenuLabel>
                      <ActionItems
                        menu="context"
                        actions={customerActions(row.original, { open: () => setPeekId(row.id), remove: () => removeRows([row.id]) })}
                      />
                    </ContextMenuContent>
                  </ContextMenu>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-0">
                    {/* As wide as the scroll box and pinned to its left edge, so it stays centred on a phone. */}
                    <div className="sticky left-0 flex h-40 w-[100cqw] flex-col items-center justify-center gap-2 text-center">
                      <p className="text-muted-foreground">No results.</p>
                      {filtered ? (
                        <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
                      ) : data.length === 0 ? (
                        <Button variant="outline" size="sm" onClick={() => setData(SEED)}>Restore sample rows</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
            </TableBody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-3 py-2 text-xs">
          <span className="text-muted-foreground tabular-nums">
            {selectedRows.length} of {filteredCount} row(s) selected
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={pageSizeId} className="text-muted-foreground font-normal whitespace-nowrap">
                Rows per page
              </Label>
              <Select value={String(pagination.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger id={pageSizeId} size="sm" className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="top" align="end">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="whitespace-nowrap tabular-nums" aria-live="polite">
              Page {Math.min(pagination.pageIndex + 1, Math.max(1, pageCount))} of {Math.max(1, pageCount)}
            </span>
            <div className="flex items-center gap-1">
              <PageButton label="First page" icon={ArrowLeftDoubleIcon} disabled={!table.getCanPreviousPage()} onClick={() => table.firstPage()} />
              <PageButton label="Previous page" icon={ArrowLeft01Icon} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
              <PageButton label="Next page" icon={ArrowRight01Icon} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
              <PageButton label="Last page" icon={ArrowRightDoubleIcon} disabled={!table.getCanNextPage()} onClick={() => table.lastPage()} />
            </div>
          </div>
        </footer>
      </article>
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

function PageButton({ label, icon, disabled, onClick }: {
  label: string
  icon: typeof ArrowLeft01Icon
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button variant="outline" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Button>
  )
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const s = STATUSES[status]
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </Badge>
  )
}

function HeaderCell({ header, multiSort, onSort }: {
  header: Header<Features, Customer, unknown>
  multiSort: boolean
  onSort: () => void
}) {
  const column = header.column
  const meta = column.columnDef.meta
  const right = meta?.align === 'right'
  const canSort = !header.isPlaceholder && column.getCanSort()
  const sorted = column.getIsSorted()

  return (
    <th
      scope="col"
      aria-sort={canSort ? (sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none') : undefined}
      // A shadow, not a border: collapsed table borders do not travel with a sticky cell.
      className={cn(
        'bg-card text-muted-foreground sticky top-0 z-10 h-8 px-2 text-left align-middle font-medium whitespace-nowrap shadow-[inset_0_-1px_0_var(--border)] first:pl-3 last:pr-3',
        right && 'text-right',
        meta?.className,
      )}
    >
      {header.isPlaceholder ? null : canSort ? (
        <button
          type="button"
          onClick={(e) => {
            column.getToggleSortingHandler()?.(e)
            onSort()
          }}
          className={cn(
            'hover:text-foreground focus-visible:ring-ring/30 group/sort -mx-1.5 inline-flex h-6 items-center gap-1 rounded-md px-1.5 outline-none focus-visible:ring-2',
            sorted && 'text-foreground',
            right && 'flex-row-reverse',
          )}
        >
          <FlexRender header={header} />
          <HugeiconsIcon
            icon={sorted === 'asc' ? ArrowUp02Icon : sorted === 'desc' ? ArrowDown02Icon : ArrowUpDownIcon}
            strokeWidth={2}
            className={cn('size-3', !sorted && 'opacity-40 group-hover/sort:opacity-80')}
          />
          {multiSort && sorted && (
            <span className="text-muted-foreground text-[10px] tabular-nums">{column.getSortIndex() + 1}</span>
          )}
        </button>
      ) : (
        <FlexRender header={header} />
      )}
    </th>
  )
}

function SelectAllCheckbox({ table }: { table: Table<Features, Customer> }) {
  const all = table.getIsAllPageRowsSelected()
  const some = table.getIsSomePageRowsSelected()
  return (
    <Checkbox
      checked={all ? true : some ? 'indeterminate' : false}
      onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
      disabled={table.getRowModel().rows.length === 0}
      aria-label="Select all rows on this page"
      className={MIXED}
    />
  )
}

function RowCheckbox({ row }: { row: Row<Features, Customer> }) {
  const selected = row.getIsSelected()
  return (
    <Checkbox
      checked={selected}
      // The handler reads target.checked and shiftKey; Radix checkboxes are buttons, so pass both in.
      onClick={(e) => row.getToggleSelectedHandler()({ target: { checked: !selected }, shiftKey: e.shiftKey })}
      aria-label={`Select ${row.original.name}`}
    />
  )
}

/* ---------- Row actions: one list, shown by right-click and by the … button ---------- */

type RowAction =
  | { label: string; icon: IconSvgElement; shortcut?: string; destructive?: boolean; onSelect: () => void }
  | 'separator'

function copyText(value: string, what: string) {
  if (!navigator.clipboard) {
    toast.error('Clipboard not available')
    return
  }
  navigator.clipboard.writeText(value).then(
    () => toast.success(`Copied ${value}`),
    () => toast.error(`Could not copy the ${what}`),
  )
}

function customerActions(customer: Customer, { open, remove }: { open: () => void; remove: () => void }): RowAction[] {
  return [
    { label: 'Open', icon: ViewIcon, shortcut: '↵', onSelect: open },
    { label: 'Copy ID', icon: Copy01Icon, onSelect: () => copyText(customer.id, 'ID') },
    { label: 'Copy email', icon: Mail01Icon, onSelect: () => copyText(customer.email, 'email') },
    {
      label: 'Edit', icon: PencilEdit02Icon,
      onSelect: () => toast(`Editing ${customer.name}`, { description: 'Demo only: there is no edit form.' }),
    },
    'separator',
    { label: 'Delete', icon: Delete02Icon, destructive: true, onSelect: remove },
  ]
}

function ActionItems({ actions, menu }: { actions: RowAction[]; menu: 'dropdown' | 'context' }) {
  return actions.map((action, i) => {
    if (action === 'separator') {
      return menu === 'dropdown' ? <DropdownMenuSeparator key={i} /> : <ContextMenuSeparator key={i} />
    }
    const variant = action.destructive ? 'destructive' : 'default'
    const body = (
      <>
        <HugeiconsIcon icon={action.icon} strokeWidth={2} />
        {action.label}
        {action.shortcut && (menu === 'dropdown'
          ? <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
          : <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>)}
      </>
    )
    return menu === 'dropdown'
      ? <DropdownMenuItem key={action.label} variant={variant} onSelect={action.onSelect}>{body}</DropdownMenuItem>
      : <ContextMenuItem key={action.label} variant={variant} onSelect={action.onSelect}>{body}</ContextMenuItem>
  })
}

// The … button stays for touch screens and keyboards, but only shows on hover or focus with a mouse.
function RowActions({ row, table }: { row: Row<Features, Customer>; table: Table<Features, Customer> }) {
  const customer = row.original
  const meta = table.options.meta
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${customer.name}`}
          className="opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <ActionItems
          menu="dropdown"
          actions={customerActions(customer, {
            open: () => meta?.openRow(customer.id),
            remove: () => meta?.removeRows([customer.id]),
          })}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- Peek: a side panel for one row, like Linear's issue peek ---------- */

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
    <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        {customer && (
          <>
            <SheetHeader className="border-b pr-12">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground font-mono text-[11px]">{customer.id}</span>
                <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
                  {index + 1} / {rows.length}
                </span>
                <Button variant="ghost" size="icon-xs" aria-label="Previous customer" disabled={!prev} onClick={() => prev && onOpen(prev.id)}>
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label="Next customer" disabled={!next} onClick={() => next && onOpen(next.id)}>
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Initials name={customer.name} className="size-10 text-sm" />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{customer.name}</SheetTitle>
                  <SheetDescription className="truncate">{customer.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="grid flex-1 content-start gap-5 overflow-y-auto p-4">
              <dl className="grid grid-cols-[6.5rem_1fr] items-center gap-x-3 gap-y-2.5 text-xs">
                <dt className="text-muted-foreground">Status</dt>
                <dd><StatusBadge status={customer.status} /></dd>
                <dt className="text-muted-foreground">Plan</dt>
                <dd>{PLANS[customer.plan].label}</dd>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="tabular-nums">{money.format(customer.amount)} / month</dd>
                <dt className="text-muted-foreground">Seats</dt>
                <dd className="flex items-center gap-1.5 tabular-nums">
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                  {customer.seats}
                </dd>
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="flex items-center gap-1.5">
                  <Initials name={customer.owner} className="size-5" /> {customer.owner}
                </dd>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="flex items-center gap-1.5 tabular-nums">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                  {format(customer.created, 'd MMM yyyy')}
                </dd>
              </dl>

              <div className="bg-subtle grid gap-1 rounded-lg border p-3">
                <p className="text-muted-foreground text-[11px] font-medium">Yearly value</p>
                <p className="text-lg font-semibold tabular-nums">{wholeMoney.format(customer.amount * 12)}</p>
                <p className="text-muted-foreground text-[11px]">
                  {customer.seats > 0 ? `${money.format(customer.amount / customer.seats)} per seat each month` : 'No seats yet'}
                </p>
              </div>
            </div>

            <SheetFooter className="flex-row flex-wrap border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast('Open full page', { description: 'Demo only: this playground is a single page.' })}
              >
                <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} data-icon="inline-start" />
                Open full page
              </Button>
              <Button variant="outline" size="sm" onClick={() => copyText(customer.email, 'email')}>
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
                Copy email
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  onRemove(customer.id)
                  onClose()
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
                Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export type FacetOption = { value: string; label: string; visual?: ReactNode; count?: number }

// A dashed "+ Title" button that opens a searchable, multi-select list with counts.
export function FacetFilter({ title, options, selected, onChange }: {
  title: string
  options: FacetOption[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const chosen = options.filter((o) => selected.includes(o.value))

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} data-icon="inline-start" />
          {title}
          {chosen.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 my-1" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {chosen.length === 1 ? chosen[0].label : `${chosen.length} selected`}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-0">
        <Command className="rounded-lg">
          <CommandInput placeholder={`Filter by ${title.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const on = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={on}
                    onSelect={() => toggle(option.value)}
                    // The leading box shows the tick here, so hide the item's own trailing one.
                    className="[&>svg:last-child]:hidden"
                  >
                    <span
                      className={cn(
                        'border-input flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border',
                        on && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />}
                    </span>
                    {option.visual && <span className="flex shrink-0">{option.visual}</span>}
                    <span className="truncate">{option.label}</span>
                    {on && <span className="sr-only">(selected)</span>}
                    {option.count !== undefined && (
                      <span className="text-muted-foreground ml-auto tabular-nums">{option.count}</span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem value="Clear filter" onSelect={() => onChange([])} className="justify-center [&>svg:last-child]:hidden">
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function AmountFilter({ value, max, onChange }: {
  value: [number, number] | undefined
  max: number
  onChange: (value: [number, number] | undefined) => void
}) {
  const current: [number, number] = value ?? [0, max]
  const presets: { label: string; range: [number, number] }[] = [
    { label: 'Under $100', range: [0, 100] },
    { label: '$100 – $1k', range: [100, 1000] },
    { label: 'Over $1k', range: [1000, max] },
  ]

  function commit([a, b]: [number, number]) {
    const lo = Math.max(0, Math.min(a, b))
    const hi = Math.min(max, Math.max(a, b))
    onChange(lo <= 0 && hi >= max ? undefined : [lo, hi])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} data-icon="inline-start" />
          Amount
          {value && (
            <>
              <Separator orientation="vertical" className="mx-0.5 my-1" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal tabular-nums">
                {wholeMoney.format(value[0])} – {wholeMoney.format(value[1])}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">Monthly amount</span>
          <span className="text-muted-foreground tabular-nums">
            {wholeMoney.format(current[0])} – {wholeMoney.format(current[1])}
          </span>
        </div>
        <Slider
          min={0}
          max={max}
          step={50}
          value={current}
          onValueChange={(v) => commit([v[0], v[1]])}
          className="py-1"
        />
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => {
            const active = value?.[0] === p.range[0] && value[1] === p.range[1]
            return (
              <Button key={p.label} variant={active ? 'secondary' : 'ghost'} size="sm" onClick={() => commit(p.range)}>
                {p.label}
              </Button>
            )
          })}
          {value && (
            <Button variant="ghost" size="sm" className="text-muted-foreground ml-auto" onClick={() => onChange(undefined)}>
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
