import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import { FlexRender, type RowData } from '@tanstack/react-table'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuLabel, ContextMenuTrigger } from '@/components/ui/context-menu'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { SavedViews, type SavedViewItem } from '@/blocks/filter-bar'
import { plural } from '@/lib/text'
import { exportTableCsv, type DataTableCsv } from './csv'
import { isTableFiltered, resetTableFilters, setColumnFilter, type DataTableInstance } from './features'
import {
  ActionItems, CELL_PADDING, DataTableRowContext, DensityToggle, FacetFilter, HIDE_BELOW, HeaderCell, Pagination,
  ROW_HEIGHT, ViewOptions, type DataTableRowAction, type Density, type FacetOption,
} from './parts'

// The kit's data table: search, faceted filters, column picker, row density,
// sorting (Shift for more than one column), selection with a bulk actions
// bar, CSV export, a right-click and "…" menu per row, an empty state and
// pages. Built on TanStack Table v9.
//
//   const table = useDataTable({ data, columns, getRowId: (r) => r.id })
//   <DataTable table={table} title="Customers" search={…} facets={…} />
//
// Columns are TanStack column definitions (see dataTableColumns); add
// selectColumn() first and actionsColumn() last for the checkbox and "…"
// columns. Each column's meta gives its label, alignment, and the container
// width it hides below. The page keeps the data and does the deleting.
//
// `variant`: "card" is a bordered box with its own scroll area (place it in
// a page section); "flush" runs edge to edge inside a page that scrolls (a
// list page in an app). In "flush", the bulk bar sticks to the top while the
// page scrolls.

export type DataTableFacet = {
  // The column it filters; give that column filterFn: 'oneOf'.
  column: string
  title: string
  options: Omit<FacetOption, 'count'>[]
}

export type DataTableEmpty = {
  // Default "No results."
  title?: ReactNode
  description?: ReactNode
  // Shown when no filters are on (with filters on, the button clears them).
  action?: ReactNode
}

export type DataTableProps<TData extends RowData> = {
  table: DataTableInstance<TData>
  variant?: 'card' | 'flush'
  className?: string

  // The title row. Without a title, the controls move to the end of the toolbar.
  title?: ReactNode
  count?: ReactNode
  hint?: ReactNode
  // Buttons after the built-in controls.
  actions?: ReactNode

  // Built-in controls: row density, the View (columns) menu, Export CSV.
  density?: boolean
  defaultDensity?: Density
  viewOptions?: boolean
  csv?: DataTableCsv<TData>

  // The toolbar: search, a faceted filter per column, then any other filters.
  search?: { placeholder: string; label?: string }
  facets?: DataTableFacet[]
  filters?: ReactNode
  // Saved views as pills above the toolbar. The page filters the data by the view.
  views?: { items: SavedViewItem[]; value: string | undefined; onChange: (id: string) => void; wrap?: boolean }

  // With a select column: the buttons in the bulk bar, for the selected rows.
  bulkActions?: (rows: TData[]) => ReactNode

  // Click or Enter on a row.
  onRowClick?: (row: TData) => void
  // The right-click menu, and the "…" button of actionsColumn().
  rowActions?: (row: TData) => DataTableRowAction[]
  // A row's name, for screen readers and the right-click menu.
  rowLabel?: (row: TData) => string
  // Marks the row that is open elsewhere (in a side panel, say).
  isRowActive?: (row: TData) => boolean

  caption?: string
  empty?: DataTableEmpty | ((ctx: { filtered: boolean }) => DataTableEmpty)
  // The table's minimum width while it has rows; narrower screens scroll it sideways.
  minTableWidth?: string
  // On the scroll area, such as a max height ("max-h-[30rem]") in a card.
  scrollClassName?: string
  pageSizes?: number[]
}

const VARIANT = {
  card: {
    root: 'bg-card min-w-0 overflow-hidden rounded-lg border',
    x: 'px-3',
    edge: 'first:pl-3 last:pr-3',
    surface: 'bg-card',
  },
  flush: {
    root: '@container min-w-0',
    x: 'px-4 @2xl:px-6',
    edge: 'first:pl-4 last:pr-4 @2xl:first:pl-6 @2xl:last:pr-6',
    surface: 'bg-background',
  },
}

export function DataTable<TData extends RowData>({
  table, variant = 'card', className, title, count, hint, actions, density: showDensity = false,
  defaultDensity = 'compact', viewOptions = true, csv, search, facets, filters, views, bulkActions, onRowClick,
  rowActions, rowLabel, isRowActive, caption, empty, minTableWidth, scrollClassName, pageSizes = [10, 20, 50],
}: DataTableProps<TData>) {
  const [density, setDensity] = useState<Density>(defaultDensity)
  const v = VARIANT[variant]
  const card = variant === 'card'

  const { pagination, sorting, globalFilter } = table.state
  const query = String(globalFilter ?? '')
  const filtered = isTableFiltered(table)
  const total = table.getCoreRowModel().rows.length
  const filteredCount = table.getFilteredRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const pageRows = table.getRowModel().rows
  const pageCount = table.getPageCount()
  const visibleColumns = table.getVisibleLeafColumns()
  const selectable = !!table.getColumn('select')
  const label = (row: TData) => rowLabel?.(row)
  const emptyState = typeof empty === 'function' ? empty({ filtered }) : empty

  // Deleting rows can leave the current page past the end.
  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) table.setPageIndex(Math.max(0, pageCount - 1))
  }, [pagination.pageIndex, pageCount, table])

  const hasControls = showDensity || viewOptions || !!csv || !!actions
  const controls = hasControls && (
    <>
      {showDensity && <DensityToggle value={density} onChange={setDensity} />}
      {viewOptions && <ViewOptions table={table} />}
      {csv && (
        <Button variant="outline" size="sm" onClick={() => exportTableCsv(table, csv)}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
          Export CSV
        </Button>
      )}
      {actions}
    </>
  )

  const hasHeader = title !== undefined
  const header = hasHeader && (
    <header className={cn('flex flex-wrap items-center gap-2', card && cn('border-b py-2', v.x))}>
      <div className="flex min-w-0 items-baseline gap-2">
        <h3 className="text-xs font-medium">{title}</h3>
        {count !== undefined && <span className="text-muted-foreground text-[11px] tabular-nums">{count}</span>}
        {hint && <span className="text-muted-foreground hidden text-[11px] md:inline">{hint}</span>}
      </div>
      {hasControls && <div className="ml-auto flex flex-wrap items-center gap-1.5">{controls}</div>}
    </header>
  )

  const viewsRow = views && (
    <SavedViews
      views={views.items}
      value={views.value}
      onChange={views.onChange}
      wrap={views.wrap}
      className={cn(card && cn('border-b py-2', v.x))}
    />
  )

  const countText = filtered ? `${filteredCount} of ${plural(total, 'row')}` : ''
  const countClass = 'text-muted-foreground text-xs whitespace-nowrap tabular-nums'
  const controlsInToolbar = !hasHeader && hasControls
  const hasToolbar = !!search || !!facets?.length || !!filters || controlsInToolbar
  const toolbar = hasToolbar && (
    <div className={cn('flex flex-wrap items-center gap-1.5', card && cn('border-b py-2', v.x))}>
      {search && (
        <SearchField
          value={query}
          onChange={(value) => {
            table.setGlobalFilter(value)
            table.setPageIndex(0)
          }}
          placeholder={search.placeholder}
          label={search.label}
          className="w-full sm:w-60"
        />
      )}
      {facets?.map((facet) => {
        const column = table.getColumn(facet.column)
        const counts = column?.getFacetedUniqueValues()
        return (
          <FacetFilter
            key={facet.column}
            title={facet.title}
            options={facet.options.map((o) => ({ ...o, count: counts?.get(o.value) ?? 0 }))}
            selected={(column?.getFilterValue() as string[] | undefined) ?? []}
            onChange={(values) => setColumnFilter(table, facet.column, values.length ? values : undefined)}
          />
        )
      })}
      {filters}
      {filtered && (
        <Button variant="ghost" size="sm" onClick={() => resetTableFilters(table)}>
          Reset
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      )}
      {controlsInToolbar ? (
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {countText && <span className={countClass} aria-live="polite">{countText}</span>}
          {controls}
        </div>
      ) : countText && (
        <span className={cn(countClass, 'ml-auto')} aria-live="polite">{countText}</span>
      )}
    </div>
  )

  const bulkBar = selectable && selectedRows.length > 0 && (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        'bg-brand/5 dark:bg-brand/10 flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5',
        card ? 'border-b' : 'border-t',
        v.x,
      )}
    >
      <span className="text-xs whitespace-nowrap" aria-live="polite">
        <span className="font-medium tabular-nums">{selectedRows.length}</span> selected
      </span>
      {selectedRows.length < filteredCount && (
        <Button variant="link" size="sm" className="px-1" onClick={() => table.toggleAllRowsSelected(true)}>
          Select all {filteredCount}
        </Button>
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
        {bulkActions?.(selectedRows.map((r) => r.original))}
        <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={() => table.resetRowSelection(true)}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  )

  return (
    <DataTableRowContext.Provider value={{ rowLabel: label, rowActions }}>
      <article className={cn(v.root, className)}>
        {card ? (
          <>
            {header}
            {viewsRow}
            {toolbar}
          </>
        ) : (
          (hasHeader || views || hasToolbar) && (
            <div className={cn('grid gap-3 pb-3', v.x)}>
              {header}
              {viewsRow}
              {toolbar}
            </div>
          )
        )}

        {/* In a page that scrolls, the bar stays in view; the solid layer keeps rows from showing through. */}
        {bulkBar && (card ? bulkBar : <div className="bg-background sticky top-0 z-20">{bulkBar}</div>)}

        {/* Scrolls both ways, so the sticky header stays put and the page never scrolls sideways. */}
        <div className={cn('@container relative overflow-auto', !card && 'border-t', scrollClassName)}>
          <table className="w-full caption-bottom text-xs" style={pageRows.length > 0 && minTableWidth ? { minWidth: minTableWidth } : undefined}>
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <HeaderCell
                      key={header.id}
                      header={header}
                      multiSort={sorting.length > 1}
                      onSort={() => table.setPageIndex(0)}
                      className={cn(v.surface, v.edge)}
                    />
                  ))}
                </tr>
              ))}
            </thead>
            <TableBody>
              {pageRows.length > 0 ? (
                pageRows.map((row) => {
                  const name = label(row.original)
                  const active = isRowActive?.(row.original)
                  const tr = (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      aria-current={active ? 'true' : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-label={onRowClick && name ? `${name}. Press Enter to open${rowActions ? ', or the menu key for actions' : ''}.` : undefined}
                      onClick={onRowClick && ((e) => {
                        // Clicks on the checkbox, buttons or menus inside the row keep their own meaning.
                        if ((e.target as HTMLElement).closest('button, a, input, [role=checkbox], [role=menuitem]')) return
                        onRowClick(row.original)
                      })}
                      onKeyDown={onRowClick && ((e) => {
                        if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row.original)
                      })}
                      className={cn(
                        ROW_HEIGHT[density],
                        'group/row outline-none focus-visible:bg-accent data-[state=open]:bg-accent',
                        onRowClick && 'cursor-pointer',
                        'data-[state=selected]:bg-brand/5 dark:data-[state=selected]:bg-brand/10',
                        isRowActive && 'aria-[current=true]:bg-accent',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'px-2',
                              v.edge,
                              CELL_PADDING[density],
                              meta?.align === 'right' && 'text-right tabular-nums',
                              meta?.hideBelow && HIDE_BELOW[meta.hideBelow],
                              meta?.className,
                              meta?.cellClassName,
                            )}
                          >
                            <FlexRender cell={cell} />
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                  if (!rowActions) return tr
                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>{tr}</ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        {name && <ContextMenuLabel className="truncate">{name}</ContextMenuLabel>}
                        <ActionItems menu="context" actions={rowActions(row.original)} />
                      </ContextMenuContent>
                    </ContextMenu>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-0">
                    {/* As wide as the scroll box and pinned to its left edge, so it stays centred on a phone. */}
                    <div className="sticky left-0 flex min-h-40 w-[100cqw] flex-col items-center justify-center gap-2 py-6 text-center">
                      {emptyState?.description ? (
                        <div className="grid max-w-sm gap-1 px-4">
                          <p className="font-medium">{emptyState.title ?? 'No results.'}</p>
                          <p className="text-muted-foreground">{emptyState.description}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">{emptyState?.title ?? 'No results.'}</p>
                      )}
                      {filtered ? (
                        <Button variant="outline" size="sm" onClick={() => resetTableFilters(table)}>Clear filters</Button>
                      ) : emptyState?.action}
                    </div>
                  </td>
                </tr>
              )}
            </TableBody>
          </table>
        </div>

        <Pagination table={table} pageSizes={pageSizes} selectable={selectable} className={v.x} />
      </article>
    </DataTableRowContext.Provider>
  )
}
