import { useMemo } from 'react'
import {
  columnFacetingFeature, columnFilteringFeature, columnVisibilityFeature, constructFilterFn, createColumnHelper,
  createFacetedRowModel, createFacetedUniqueValues, createFilteredRowModel, createPaginatedRowModel,
  createSortedRowModel, filterFn_inNumberRange, filterFn_includesString, globalFilteringFeature, rowPaginationFeature,
  rowSelectionFeature, rowSortingFeature, sortFn_alphanumeric, sortFn_basic, sortFn_text, tableFeatures, useTable,
  type ColumnDef, type ColumnVisibilityState, type FilterFn, type ReactTable, type RowData, type SortingState,
} from '@tanstack/react-table'

// The data table's TanStack v9 set-up: one feature set for every table, so
// column definitions written for one work in any other.

// Container widths a column can drop out under (Tailwind's @container sizes).
export type ContainerSize = '@xs' | '@sm' | '@md' | '@lg' | '@xl' | '@2xl' | '@3xl' | '@4xl' | '@5xl' | '@6xl'

export type DataTableColumnMeta = {
  // The column's name in the View menu and the CSV header.
  label: string
  align?: 'right'
  // On the header and every cell: a width, say.
  className?: string
  // On the body cells only.
  cellClassName?: string
  // Hidden while the table is narrower than this, so a narrow screen shows
  // fewer columns instead of scrolling sideways.
  hideBelow?: ContainerSize
}

// Keeps rows whose value is one of the picked values (a faceted filter).
const filterFn_oneOf = constructFilterFn({
  filter: (dataValue: unknown, filterValue: unknown[]) => filterValue.includes(dataValue),
  autoRemove: (value: unknown) => !Array.isArray(value) || value.length === 0,
})

export const dataTableFeatures = tableFeatures({
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
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures
export type DataTableColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>

// Column helper bound to the data table's features:
// const col = dataTableColumns<Customer>(); col.accessor('name', { … })
export const dataTableColumns = <TData extends RowData>() => createColumnHelper<DataTableFeatures, TData>()

export type UseDataTableOptions<TData extends RowData> = {
  data: TData[]
  columns: DataTableColumn<TData>[]
  getRowId: (row: TData) => string
  // What the search box reads: the ids of the columns to look in, or a test
  // of a whole row against the lower-cased, trimmed query. Every column by default.
  search?: string[] | ((row: TData, query: string) => boolean)
  pageSize?: number
  initialSorting?: SortingState
  initialColumnVisibility?: ColumnVisibilityState
}

function rowSearch<TData extends RowData>(test: (row: TData, query: string) => boolean): FilterFn<DataTableFeatures, TData> {
  return (row, _columnId, value) => {
    const query = String(value ?? '').trim().toLowerCase()
    return !query || test(row.original, query)
  }
}

// The table's state and rows. Hand the result to <DataTable table={…} />, and
// read it for anything the page needs (the rows in their current order, say).
export function useDataTable<TData extends RowData>({
  data, columns, getRowId, search, pageSize = 10, initialSorting, initialColumnVisibility,
}: UseDataTableOptions<TData>): DataTableInstance<TData> {
  const searchColumns = Array.isArray(search) ? search : undefined
  const searchFn = useMemo(() => (typeof search === 'function' ? rowSearch(search) : undefined), [search])
  return useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: (row) => getRowId(row),
    globalFilterFn: searchFn ?? 'includesString',
    getColumnCanGlobalFilter: searchColumns ? (column) => searchColumns.includes(column.id) : undefined,
    // Every column starts ascending, including numbers: asc, then desc, then off.
    sortDescFirst: false,
    // Pages are reset by hand on filter and sort changes, so deleting a row keeps the current page.
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      ...(initialSorting && { sorting: initialSorting }),
      ...(initialColumnVisibility && { columnVisibility: initialColumnVisibility }),
    },
  })
}

// Sets one column's filter and goes back to the first page.
export function setColumnFilter<TData extends RowData>(table: DataTableInstance<TData>, columnId: string, value: unknown) {
  table.getColumn(columnId)?.setFilterValue(value)
  table.setPageIndex(0)
}

// Clears the search and every column filter.
export function resetTableFilters<TData extends RowData>(table: DataTableInstance<TData>) {
  table.resetColumnFilters(true)
  table.setGlobalFilter('')
  table.setPageIndex(0)
}

export function isTableFiltered<TData extends RowData>(table: DataTableInstance<TData>) {
  return table.state.columnFilters.length > 0 || String(table.state.globalFilter ?? '') !== ''
}
