import type { RowData } from '@tanstack/react-table'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { isTableFiltered, type DataTableInstance } from './features'

export type DataTableCsv<TData extends RowData> = {
  // The file name before the date: "customers" saves customers-2026-10-01.csv.
  filename: string
  // Column id → cell text. Only these columns go into the file, in the order
  // shown. Without it, every visible data column goes in as its raw value.
  values?: Partial<Record<string, (row: TData) => string>>
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

export function downloadCsv(filename: string, lines: string[][]) {
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

// Saves the rows that pass the filters, in the current order and across
// every page, with the visible columns. Says what happened in a toast.
export function exportTableCsv<TData extends RowData>(table: DataTableInstance<TData>, { filename, values }: DataTableCsv<TData>) {
  const visible = table.getVisibleLeafColumns()
  const cols = values ? visible.filter((c) => values[c.id]) : visible.filter((c) => c.accessorFn)
  const rows = table.getPrePaginatedRowModel().rows
  if (!rows.length) {
    toast.error('Nothing to export', { description: 'No rows match the current filters.' })
    return
  }
  downloadCsv(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
    cols.map((c) => c.columnDef.meta?.label ?? c.id),
    ...rows.map((row) => cols.map((c) => (values ? values[c.id]!(row.original) : String(row.getValue(c.id) ?? '')))),
  ])
  toast.success(`Exported ${plural(rows.length, 'row')}`, {
    description: isTableFiltered(table) ? 'Only rows that match the filters, in the current order.' : 'All rows, in the current order.',
  })
}
