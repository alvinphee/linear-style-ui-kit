import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Initials } from '@/pages/sections/StatusSection'
import { TONE_CLASS, TONE_DOT, formatDate, formatMoney, formatNumber, toneOf } from './format'
import type { Column, Value } from './types'

// Small pieces every ERP page shares, so lists, panels and dashboards read alike.

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = toneOf(status)
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium whitespace-nowrap', TONE_CLASS[tone], className)}>
      <span className={cn('size-1.5 rounded-full', TONE_DOT[tone])} />
      {status}
    </span>
  )
}

export function Person({ name, className }: { name: string; className?: string }) {
  if (!name) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <Initials name={name} className="size-5" />
      <span className="truncate">{name}</span>
    </span>
  )
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
export function ModuleMark({ icon, colour, size = 'md', className }: {
  icon: IconSvgElement
  colour: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-md',
        size === 'sm' && 'size-5 [&_svg]:size-3',
        size === 'md' && 'size-7 [&_svg]:size-4',
        size === 'lg' && 'size-9 rounded-lg [&_svg]:size-5',
        className,
      )}
      style={{ background: `color-mix(in oklch, ${colour} 16%, transparent)`, color: colour }}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </span>
  )
}

// The title row at the top of a page: name, a line of context, and actions.
export function PageHeader({ title, description, actions, children }: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="grid gap-3 px-4 pt-5 pb-3 @2xl:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="grid min-w-0 gap-0.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

// A boxed area on a dashboard or settings page.
export function Card({ title, action, children, className }: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('bg-card min-w-0 rounded-lg border', className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5">
          <h2 className="text-xs font-medium">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-3.5">{children}</div>
    </section>
  )
}

// Shortcut text that matches the platform: ⌘K on a Mac, Ctrl K elsewhere.
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = IS_MAC ? '⌘' : 'Ctrl'
