import type { ComponentType, ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'

// The ERP template's model. Terms follow docs/glossary.md.

export type Role = 'admin' | 'sales' | 'operations' | 'finance' | 'hr'

export type Value = string | number | boolean
export type Row = { id: string } & Record<string, Value>

export type EntityId =
  | 'leads' | 'opportunities' | 'accounts' | 'contacts' | 'activities'
  | 'quotations' | 'salesOrders' | 'deliveries' | 'priceLists'
  | 'items' | 'stock' | 'transfers' | 'adjustments' | 'warehouses'
  | 'requisitions' | 'purchaseOrders' | 'goodsReceipts' | 'vendors'
  | 'invoices' | 'bills' | 'payments' | 'journals' | 'ledgerAccounts'
  | 'employees' | 'leave' | 'payroll'
  | 'users' | 'audit'

export type Data = Record<EntityId, Row[]>

// How a cell shows its value. Dates are ISO strings ("2026-10-01"); a
// datetime adds the time ("2026-10-01 14:05").
export type ColumnKind = 'text' | 'id' | 'money' | 'number' | 'date' | 'datetime' | 'status' | 'person' | 'percent' | 'bool'

export type Column = {
  key: string
  label: string
  kind?: ColumnKind
  // Hidden while the content area is narrower than this container size.
  hide?: 'md' | 'lg' | 'xl' | '2xl'
}

export type Field = {
  key: string
  label: string
  type: 'text' | 'email' | 'number' | 'date' | 'select'
  options?: string[]
  required?: boolean
  placeholder?: string
}

// A saved view: a named filter shown as a tab above the list.
export type SavedView = { id: string; label: string; match?: (row: Row) => boolean }

export type ListSpec = {
  entity: EntityId
  singular: string
  plural: string
  // Prefix for the number of a new record, e.g. "INV-2026-".
  prefix?: string
  // The column that names the record (its title in the side panel).
  primary: string
  columns: Column[]
  views?: SavedView[]
  create?: { fields: Field[]; defaults?: Record<string, Value> }
  // Bulk actions: set these fields on every selected row.
  bulk?: { label: string; patch: Record<string, Value> }[]
}

export type ErpPage = {
  id: string
  label: string
  icon: IconSvgElement
  // A sidebar heading this page sits under, such as "Receivables".
  group?: string
  list?: ListSpec
  render?: () => ReactNode
  // A number shown next to the page in the sidebar (open items, overdue…).
  badge?: (data: Data) => number
  // Only in the ERP + AI edition (see edition.ts).
  assistant?: boolean
  // The page's own part of the sidebar, under its module's pages, in place
  // of Recent (the Assistant's chat history).
  sidebar?: ComponentType<{ onNavigate?: () => void }>
}

export type ErpModule = {
  id: string
  name: string
  icon: IconSvgElement
  colour: string
  description: string
  roles: Role[]
  // The letter for "G then …" in the command palette.
  key: string
  pages: ErpPage[]
  // One line of live numbers for the launchpad tile.
  metric?: (data: Data) => string
}
