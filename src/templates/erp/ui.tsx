import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { IconMark } from '@/components/mark'
import { PageHeader as KitPageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Person } from '@/components/person'
import { StatusBadge as KitStatusBadge } from '@/components/status-badge'
import { formatDate, formatMoney, formatNumber, toneOf } from './format'
import type { Column, Value } from './types'

// The ERP's names for kit components, with its own data rules on top
// (which status reads as which tone, page padding). The look is the kit's.

export { Person }
export { IS_MAC, MOD } from '@/components/shortcut'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <KitStatusBadge tone={toneOf(status)} className={className}>{status}</KitStatusBadge>
}

// One cell, formatted by its column's kind.
export function CellValue({ column, value }: { column: Column; value: Value | undefined }) {
  if (value === undefined || value === '') return <span className="text-muted-foreground">—</span>
  switch (column.kind) {
    case 'id':
      return <span className="text-muted-foreground font-mono text-[11.5px] whitespace-nowrap">{String(value)}</span>
    case 'money':
      return <span className="tabular-nums whitespace-nowrap">{formatMoney(Number(value))}</span>
    case 'number':
      return <span className="tabular-nums">{formatNumber(Number(value))}</span>
    case 'percent':
      return <span className="tabular-nums">{Number(value)}%</span>
    case 'date':
      return <span className="whitespace-nowrap">{formatDate(String(value))}</span>
    case 'datetime': {
      const [date, time] = String(value).split(' ')
      return <span className="whitespace-nowrap tabular-nums">{formatDate(date)}, {time}</span>
    }
    case 'status':
      return <StatusBadge status={String(value)} />
    case 'person':
      return <Person name={String(value)} />
    case 'bool':
      return value
        ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-4" aria-label="On" />
        : <span className="text-muted-foreground">Off</span>
    default:
      // Table cells grow to their content, so the cap goes on the text itself.
      return <span className="block max-w-36 truncate @md:max-w-56 @4xl:max-w-72">{String(value)}</span>
  }
}

export const isNumeric = (column: Column) => column.kind === 'money' || column.kind === 'number' || column.kind === 'percent'

// A module's icon on a tint of its colour.
export const ModuleMark = IconMark

// The kit's page header, padded for an app page.
export function PageHeader({ title, description, actions, children }: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return <KitPageHeader title={title} description={description} actions={actions} className="px-4 pt-5 pb-3 @2xl:px-6">{children}</KitPageHeader>
}

// A boxed area on a dashboard or settings page: the kit's Panel.
// bodyClassName="p-0" for a list or table that runs to the edges.
export function Card({ title, note, action, children, className, bodyClassName }: {
  title?: ReactNode
  note?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return <Panel as="section" title={title} note={note} action={action} className={className} bodyClassName={bodyClassName}>{children}</Panel>
}
