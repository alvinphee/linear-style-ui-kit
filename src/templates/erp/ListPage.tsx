import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Copy01Icon, Delete02Icon, Download01Icon, PencilEdit02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  BulkDelete, DataTable, actionsColumn, dataTableColumns, exportTableCsv, listNames, selectColumn, useDataTable,
  type ContainerSize, type DataTableColumn, type DataTableRowAction,
} from '@/blocks/data-table'
import { DeleteConfirm } from '@/components/delete-confirm'
import { PageHeader } from '@/components/page-header'
import { TONE_DOT } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { formatNumber } from '@/lib/format'
import { pluralWord } from '@/lib/text'
import { toneOf } from './format'
import { useErp } from './store'
import type { Column, ListSpec, Row, Value } from './types'
import { CellValue, PAGE_HEADER, isNumeric } from './ui'

// A module's list page: the kit's data table block, fed from a ListSpec.

const PAGE_SIZE = 20

// Columns drop out as the table narrows (container queries on the table),
// so a list never scrolls sideways.
const HIDE: Record<NonNullable<Column['hide']>, ContainerSize> = { md: '@2xl', lg: '@3xl', xl: '@4xl', '2xl': '@5xl' }

// On a phone (table under @md) only the essentials stay: the record's name,
// its main amount and its status. A leading document number moves under the
// name. Lists with fewer than three keep their next column. Row actions move
// into the side panel, which a tap opens.
const numberUnderName = (spec: ListSpec) => spec.columns[0].kind === 'id' && spec.columns[0].key !== spec.primary

function essentials(spec: ListSpec) {
  const amount = spec.columns.find((c) => !c.hide && isNumeric(c))
  const keep = new Set(spec.columns.filter((c) => c.key === spec.primary || c.kind === 'status' || c === amount).map((c) => c.key))
  if (!numberUnderName(spec)) keep.add(spec.columns[0].key)
  for (const c of spec.columns) {
    if (keep.size >= 3) break
    if (!c.hide && !(numberUnderName(spec) && c === spec.columns[0])) keep.add(c.key)
  }
  return keep
}

const hideBelow = (c: Column, keep: Set<string>): ContainerSize | undefined =>
  c.hide ? HIDE[c.hide] : keep.has(c.key) ? undefined : '@md'

const col = dataTableColumns<Row>()

function tableColumns(spec: ListSpec): DataTableColumn<Row>[] {
  const keep = essentials(spec)
  const underName = numberUnderName(spec)
  return [
    selectColumn<Row>(),
    ...spec.columns.map((c, i) =>
      col.accessor((row: Row): Value => row[c.key], {
        id: c.key,
        header: c.label,
        sortFn: isNumeric(c) || c.kind === 'bool' ? 'basic' : 'alphanumeric',
        ...(c.kind === 'status' && { filterFn: 'oneOf' as const }),
        cell: ({ row }) => (
          <>
            <CellValue column={c} value={row.original[c.key]} />
            {c.key === spec.primary && underName && (
              <span className="text-muted-foreground block font-mono text-[10.5px] font-normal @md:hidden">{row.original.id}</span>
            )}
          </>
        ),
        meta: {
          label: c.label,
          align: isNumeric(c) ? 'right' : undefined,
          hideBelow: hideBelow(c, keep),
          cellClassName: i === 1 ? 'font-medium' : undefined,
        },
      }),
    ),
    actionsColumn<Row>({ hideBelow: '@md' }),
  ]
}

// `embedded`: inside a page that has its own title and actions (such as the
// opportunity pipeline's list view), so only the views, toolbar and table show.
export function ListPage({ spec, embedded = false }: { spec: ListSpec; embedded?: boolean }) {
  const { data, openPeek, startCreate, update, remove, peek } = useErp()
  const rows = data[spec.entity]
  const statusColumn = spec.columns.find((c) => c.kind === 'status')
  const columns = useMemo(() => tableColumns(spec), [spec])
  const [view, setView] = useState(spec.views?.[0]?.id ?? 'all')
  // Kept after the dialog closes, so its text does not blank out as it fades.
  const [deleting, setDeleting] = useState<Row[]>([])
  const [confirming, setConfirming] = useState(false)

  const activeView = spec.views?.find((v) => v.id === view)
  const viewRows = useMemo(() => (activeView?.match ? rows.filter(activeView.match) : rows), [rows, activeView])
  const search = useMemo(
    () => (row: Row, query: string) =>
      row.id.toLowerCase().includes(query) || spec.columns.some((c) => String(row[c.key] ?? '').toLowerCase().includes(query)),
    [spec],
  )

  const table = useDataTable({ data: viewRows, columns, getRowId: (row) => row.id, search, pageSize: PAGE_SIZE })

  const views = useMemo(
    () => spec.views?.map((v) => ({ id: v.id, label: v.label, count: v.match ? rows.filter(v.match).length : rows.length })),
    [spec, rows],
  )
  const facets = useMemo(() => {
    if (!statusColumn) return undefined
    const values = [...new Set(rows.map((r) => String(r[statusColumn.key] ?? '')))].filter(Boolean).sort()
    return [{
      column: statusColumn.key,
      title: statusColumn.label,
      options: values.map((s) => ({ value: s, label: s, visual: <span className={cn('size-1.5 rounded-full', TONE_DOT[toneOf(s)])} /> })),
    }]
  }, [rows, statusColumn])

  const noun = (n: number) => (n === 1 ? spec.singular : spec.plural.toLowerCase())
  const nameOf = (row: Row) => String(row[spec.primary] || row.id)
  const csv = { filename: spec.entity }

  function changeView(id: string) {
    setView(id)
    table.resetRowSelection(true)
    table.setPageIndex(0)
  }

  function runBulk(selected: Row[], action: { label: string; patch: Record<string, Value> }) {
    update(spec.entity, selected.map((r) => r.id), action.patch)
    toast.success(`${action.label}: ${selected.length} ${noun(selected.length)}`)
    table.resetRowSelection(true)
  }

  function deleteRows(list: Row[]) {
    const ids = list.map((r) => r.id)
    remove(spec.entity, ids)
    toast(list.length === 1 ? `Deleted ${list[0].id}` : `Deleted ${list.length} ${noun(list.length)}`)
    table.setRowSelection((old) => {
      const next = { ...old }
      for (const id of ids) delete next[id]
      return next
    })
  }

  const deleteTitle = (list: Row[]) => (list.length === 1 ? `Delete ${nameOf(list[0])}?` : `Delete ${list.length} ${noun(list.length)}?`)
  const deleteDescription = (list: Row[]) =>
    `${listNames(list.map(nameOf))} will be removed for everyone in this company. The deletion is kept in the audit trail.`

  const rowActions = (row: Row): DataTableRowAction[] => [
    { label: 'Open', icon: ViewIcon, shortcut: '↵', onSelect: () => openPeek(spec.entity, row.id) },
    ...(spec.bulk ?? []).map((b) => ({
      label: b.label,
      icon: PencilEdit02Icon,
      onSelect: () => {
        update(spec.entity, [row.id], b.patch)
        toast.success(`${b.label}: ${row.id}`)
      },
    })),
    { label: 'Copy number', icon: Copy01Icon, onSelect: () => copyText(row.id, { success: `Copied ${row.id}`, error: 'Could not copy the number' }) },
    'separator',
    {
      label: 'Delete',
      icon: Delete02Icon,
      destructive: true,
      onSelect: () => {
        setDeleting([row])
        setConfirming(true)
      },
    },
  ]

  const createButton = spec.create && (
    <Button size="sm" onClick={() => startCreate(spec.entity)}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New {spec.singular}
    </Button>
  )

  return (
    <div className="flex min-h-full flex-col">
      {!embedded && (
        <PageHeader
          className={PAGE_HEADER}
          title={spec.plural}
          description={`${formatNumber(rows.length)} ${pluralWord(rows.length, spec.singular, 'records')}`}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => exportTableCsv(table, csv)}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export CSV
              </Button>
              {createButton}
            </>
          }
        />
      )}

      <DataTable
        table={table}
        variant="flush"
        density
        // Inside another page the export sits in the toolbar; on its own page it is in the header.
        csv={embedded ? csv : undefined}
        views={views && { items: views, value: view, onChange: changeView, wrap: false }}
        search={{ placeholder: `Search ${spec.plural.toLowerCase()}` }}
        facets={facets}
        bulkActions={(selected) => (
          <>
            {spec.bulk?.map((b) => (
              <Button key={b.label} variant="ghost" size="sm" onClick={() => runBulk(selected, b)}>{b.label}</Button>
            ))}
            <BulkDelete title={deleteTitle(selected)} description={deleteDescription(selected)} onConfirm={() => deleteRows(selected)} />
          </>
        )}
        onRowClick={(row) => openPeek(spec.entity, row.id)}
        rowActions={rowActions}
        rowLabel={nameOf}
        isRowActive={(row) => peek?.entity === spec.entity && peek.id === row.id}
        caption={`${spec.plural}. Sortable columns have a button in their header; hold Shift to sort by more than one.`}
        empty={({ filtered }) =>
          filtered
            ? { title: `No ${spec.plural.toLowerCase()} match`, description: 'Try another search or clear the filters.' }
            : rows.length
              ? { title: `Nothing in ${activeView?.label ?? 'this view'}`, description: 'Pick another view to see more.' }
              : {
                title: `No ${spec.plural.toLowerCase()} yet`,
                description: `Create the first ${spec.singular} to see it here.`,
                action: spec.create && <Button size="sm" onClick={() => startCreate(spec.entity)}>New {spec.singular}</Button>,
              }}
      />

      <DeleteConfirm
        open={confirming}
        onOpenChange={setConfirming}
        title={deleting.length ? deleteTitle(deleting) : ''}
        description={deleting.length ? deleteDescription(deleting) : ''}
        onConfirm={() => deleteRows(deleting)}
      />
    </div>
  )
}
