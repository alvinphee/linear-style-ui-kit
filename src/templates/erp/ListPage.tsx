import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon, Cancel01Icon, Delete02Icon,
  Download01Icon, FilterHorizontalIcon, MoreHorizontalIcon, Search01Icon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useErp } from './store'
import type { Column, ListSpec, Row } from './types'
import { CellValue, PageHeader, StatusBadge, isNumeric } from './ui'

const PAGE_SIZE = 20

// The shared Checkbox only styles checked/unchecked, so draw the "some selected" dash here.
const MIXED =
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary ' +
  'data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden ' +
  'data-[state=indeterminate]:before:absolute data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 ' +
  'data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current'

// Columns drop out as the content area narrows (container queries on the
// inset card), so a list never scrolls sideways.
const SHOW: Record<NonNullable<Column['hide']>, string> = {
  md: 'hidden @2xl:table-cell',
  lg: 'hidden @3xl:table-cell',
  xl: 'hidden @4xl:table-cell',
  '2xl': 'hidden @5xl:table-cell',
}

// On a phone (inset under @md) only the essentials stay: the record's name,
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

const hideClass = (c: Column, keep: Set<string>) => (c.hide ? SHOW[c.hide] : keep.has(c.key) ? '' : 'hidden @md:table-cell')

function toCsv(rows: Row[], columns: Column[]) {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [columns.map((c) => escape(c.label)).join(','), ...rows.map((r) => columns.map((c) => escape(r[c.key])).join(','))].join('\n')
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  URL.revokeObjectURL(url)
}

// `embedded`: inside a page that has its own title and actions (such as the
// opportunity pipeline's list view), so only the views, toolbar and table show.
export function ListPage({ spec, embedded = false }: { spec: ListSpec; embedded?: boolean }) {
  const { data, openPeek, startCreate, update, remove, peek } = useErp()
  const rows = data[spec.entity]
  const statusColumn = spec.columns.find((c) => c.kind === 'status')
  const keep = useMemo(() => essentials(spec), [spec])
  const [view, setView] = useState(spec.views?.[0]?.id ?? 'all')
  const [query, setQuery] = useState('')
  const [statuses, setStatuses] = useState<string[]>([])
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [confirming, setConfirming] = useState(false)

  const activeView = spec.views?.find((v) => v.id === view)
  const statusValues = useMemo(
    () => (statusColumn ? [...new Set(rows.map((r) => String(r[statusColumn.key])))].sort() : []),
    [rows, statusColumn],
  )

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((r) =>
      (!activeView?.match || activeView.match(r))
      && (!statuses.length || (statusColumn && statuses.includes(String(r[statusColumn.key]))))
      && (!q || spec.columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q)) || r.id.toLowerCase().includes(q)),
    )
    if (sort) {
      list = [...list].sort((a, b) => {
        const x = a[sort.key]
        const y = b[sort.key]
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })) * sort.dir
      })
    }
    return list
  }, [rows, activeView, statuses, statusColumn, query, sort, spec.columns])

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = shown.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  const picked = shown.filter((r) => selected.has(r.id))
  const allPicked = visible.length > 0 && visible.every((r) => selected.has(r.id))
  const narrowed = !!query.trim() || statuses.length > 0

  function reset() {
    setSelected(new Set())
    setPage(0)
  }

  function toggleSort(key: string) {
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null))
  }

  function toggleAll() {
    setSelected((s) => {
      const next = new Set(s)
      for (const r of visible) {
        if (allPicked) next.delete(r.id)
        else next.add(r.id)
      }
      return next
    })
  }

  function bulk(label: string, patch: Record<string, string | number | boolean>) {
    const ids = picked.map((r) => r.id)
    update(spec.entity, ids, patch)
    toast.success(`${label}: ${ids.length} ${ids.length === 1 ? spec.singular : spec.plural.toLowerCase()}`)
    setSelected(new Set())
  }

  const singularTitle = spec.singular[0].toUpperCase() + spec.singular.slice(1)

  const exportButton = (
    <Button variant="outline" size="sm" onClick={() => {
      download(`${spec.entity}.csv`, toCsv(shown, spec.columns))
      toast(`Exported ${shown.length} rows`)
    }}>
      <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export
    </Button>
  )

  const controls = (
    <>
      {spec.views && (
        <nav aria-label="Saved views" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {spec.views.map((v) => {
            const n = v.match ? rows.filter(v.match).length : rows.length
            const on = v.id === view
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setView(v.id)
                  reset()
                }}
                className="text-muted-foreground hover:bg-accent/60 hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:border-border focus-visible:ring-ring/40 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-2"
              >
                {v.label}
                <span className="text-muted-foreground tabular-nums">{n}</span>
              </button>
            )
          })}
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <InputGroup className="h-7 w-full max-w-xs @md:w-64">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              reset()
            }}
            placeholder={`Search ${spec.plural.toLowerCase()}`}
            aria-label={`Search ${spec.plural.toLowerCase()}`}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQuery('')}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        {statusColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={statuses.length ? 'secondary' : 'ghost'} size="sm">
                <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                {statusColumn.label}
                {statuses.length > 0 && <span className="text-muted-foreground tabular-nums">{statuses.length}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>{statusColumn.label} is any of</DropdownMenuLabel>
              {statusValues.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statuses.includes(s)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(on) => {
                    setStatuses((list) => (on ? [...list, s] : list.filter((x) => x !== s)))
                    reset()
                  }}
                >
                  <StatusBadge status={s} />
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {narrowed && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => {
            setQuery('')
            setStatuses([])
            reset()
          }}>
            Clear
          </Button>
        )}
        <span className="text-muted-foreground ml-auto text-[11px] tabular-nums" aria-live="polite">
          {shown.length === rows.length ? `${shown.length} shown` : `${shown.length} of ${rows.length}`}
        </span>
        {embedded && exportButton}
      </div>
    </>
  )

  return (
    <div className="flex min-h-full flex-col">
      {embedded ? (
        <div className="grid gap-3 px-4 pb-3 @2xl:px-6">{controls}</div>
      ) : (
        <PageHeader
          title={spec.plural}
          description={`${rows.length.toLocaleString()} ${rows.length === 1 ? spec.singular : 'records'}`}
          actions={
            <>
              {exportButton}
              {spec.create && (
                <Button size="sm" onClick={() => startCreate(spec.entity)}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New {spec.singular}
                </Button>
              )}
            </>
          }
        >
          {controls}
        </PageHeader>
      )}

      {shown.length === 0 ? (
        <Empty className="flex-1 border-t">
          <EmptyHeader>
            <EmptyTitle>{narrowed ? `No ${spec.plural.toLowerCase()} match` : `No ${spec.plural.toLowerCase()} yet`}</EmptyTitle>
            <EmptyDescription>{narrowed ? 'Try another search or clear the filters.' : `Create the first ${spec.singular} to see it here.`}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {narrowed
              ? <Button variant="outline" size="sm" onClick={() => { setQuery(''); setStatuses([]) }}>Clear filters</Button>
              : spec.create && <Button size="sm" onClick={() => startCreate(spec.entity)}>New {spec.singular}</Button>}
          </EmptyContent>
        </Empty>
      ) : (
        <div className="border-t">
          <Table>
            <TableHeader className="bg-subtle sticky top-0 z-[1]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9 pl-4 @2xl:pl-6">
                  <Checkbox
                    checked={allPicked ? true : visible.some((r) => selected.has(r.id)) ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on this page"
                    className={MIXED}
                  />
                </TableHead>
                {spec.columns.map((c) => {
                  const dir = sort?.key === c.key ? sort.dir : 0
                  return (
                    <TableHead
                      key={c.key}
                      className={cn(hideClass(c, keep), isNumeric(c) && 'text-right')}
                      aria-sort={dir === 1 ? 'ascending' : dir === -1 ? 'descending' : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn('hover:text-foreground focus-visible:ring-ring/40 inline-flex items-center gap-1 rounded outline-none focus-visible:ring-2', isNumeric(c) && 'flex-row-reverse')}
                      >
                        {c.label}
                        {dir !== 0 && <HugeiconsIcon icon={dir === 1 ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-3" />}
                      </button>
                    </TableHead>
                  )
                })}
                <TableHead className="hidden w-10 pr-4 @md:table-cell @2xl:pr-6"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const on = selected.has(row.id)
                return (
                  <TableRow
                    key={row.id}
                    data-state={on ? 'selected' : undefined}
                    aria-current={peek?.id === row.id ? 'true' : undefined}
                    onClick={() => openPeek(spec.entity, row.id)}
                    className="group/row aria-[current=true]:bg-accent cursor-default"
                  >
                    <TableCell className="pl-4 @2xl:pl-6" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={on}
                        onCheckedChange={() => setSelected((s) => {
                          const next = new Set(s)
                          if (on) next.delete(row.id)
                          else next.add(row.id)
                          return next
                        })}
                        aria-label={`Select ${row.id}`}
                      />
                    </TableCell>
                    {spec.columns.map((c, i) => (
                      <TableCell key={c.key} className={cn(hideClass(c, keep), isNumeric(c) && 'text-right', i === 1 && 'font-medium')}>
                        {/* The first column opens the record from the keyboard too. */}
                        {i === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPeek(spec.entity, row.id)
                            }}
                            className="focus-visible:ring-ring/40 max-w-full truncate rounded text-left outline-none focus-visible:ring-2"
                          >
                            <CellValue column={c} value={row[c.key]} />
                          </button>
                        ) : (
                          <>
                            <CellValue column={c} value={row[c.key]} />
                            {c.key === spec.primary && numberUnderName(spec) && (
                              <span className="text-muted-foreground block font-mono text-[10.5px] font-normal @md:hidden">{row.id}</span>
                            )}
                          </>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="hidden pr-4 text-right @md:table-cell @2xl:pr-6" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Actions for ${row.id}`}
                            className="pointer-fine:opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="truncate">{row.id}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openPeek(spec.entity, row.id)}>Open</DropdownMenuItem>
                          {spec.bulk?.map((b) => (
                            <DropdownMenuItem key={b.label} onSelect={() => {
                              update(spec.entity, [row.id], b.patch)
                              toast.success(`${b.label}: ${row.id}`)
                            }}>
                              {b.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onSelect={() => {
                            navigator.clipboard?.writeText(row.id).catch(() => {})
                            toast(`Copied ${row.id}`)
                          }}>
                            Copy number
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => {
                            remove(spec.entity, [row.id])
                            toast(`Deleted ${row.id}`)
                          }}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <div className="text-muted-foreground flex items-center justify-between gap-3 border-t px-4 py-2 text-[11px] @2xl:px-6">
            <span className="tabular-nums">
              {current * PAGE_SIZE + 1}–{Math.min(shown.length, (current + 1) * PAGE_SIZE)} of {shown.length}
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
                </Button>
                <span className="px-1 tabular-nums">Page {current + 1} of {pages}</span>
                <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {picked.length > 0 && (
        <div className="pointer-events-none sticky bottom-3 z-10 mt-auto flex justify-center px-3 pt-3">
          <div role="toolbar" aria-label="Bulk actions" className="bg-popover pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1 shadow-lg">
            <span className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-medium tabular-nums">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" /> {picked.length} selected
            </span>
            {spec.bulk?.map((b) => (
              <Button key={b.label} variant="ghost" size="sm" className="shrink-0" onClick={() => bulk(b.label, b.patch)}>{b.label}</Button>
            ))}
            <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => setConfirming(true)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" /> Delete
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Clear selection" className="shrink-0" onClick={() => setSelected(new Set())}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {picked.length} {picked.length === 1 ? spec.singular : spec.plural.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {singularTitle} records are removed for everyone in this company. The deletion is kept in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              remove(spec.entity, picked.map((r) => r.id))
              toast(`Deleted ${picked.length}`)
              setSelected(new Set())
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
