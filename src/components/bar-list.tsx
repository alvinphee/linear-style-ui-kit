import type { ReactNode } from 'react'
import { cn } from 'cn'

// A breakdown as labelled horizontal bars, largest first: revenue by
// customer, leads by source, warehouse use. Lighter than a chart, and it
// never crowds on a phone. Each bar's length is its value against the
// largest (or against `max`, such as 100 for percentages). `ranked` numbers
// the rows. The bars are decorative: the value is shown as text beside them.

export type BarListItem = {
  id: string
  label: ReactNode
  // Grey text after the label: "12 orders", "Enterprise".
  hint?: ReactNode
  value: number
  // The value as it should read: "$48.2k", "72%". Defaults to the number.
  display?: ReactNode
  // A second, grey figure at the far right, such as the share of the total.
  secondary?: ReactNode
  // Before the label: a mark, an avatar, an icon.
  start?: ReactNode
  // This bar's colour, instead of the list's.
  colour?: string
}

export function BarList({ items, colour = 'var(--brand)', max, ranked, empty = 'Nothing to show yet.', className }: {
  items: BarListItem[]
  // Any CSS colour, such as a module's colour.
  colour?: string
  // The value of a full bar. Defaults to the largest value.
  max?: number
  ranked?: boolean
  // Shown when there are no items.
  empty?: ReactNode
  className?: string
}) {
  if (!items.length) return <p className={cn('text-muted-foreground py-6 text-center text-xs', className)}>{empty}</p>
  const top = max ?? Math.max(1, ...items.map((item) => item.value))
  const List = ranked ? 'ol' : 'ul'

  return (
    <List className={cn('grid gap-3', className)}>
      {items.map((item, i) => (
        <li key={item.id} className="grid gap-1.5">
          <div className="flex min-w-0 items-center gap-2.5 text-xs">
            {ranked && <span className="text-muted-foreground w-3 shrink-0 text-right text-[11px] tabular-nums">{i + 1}</span>}
            {item.start}
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate">{item.label}</span>
              {item.hint !== undefined && <span className="text-muted-foreground shrink-0 text-[11px]">{item.hint}</span>}
            </span>
            <span className="ml-auto shrink-0 pl-0.5 font-medium tabular-nums">{item.display ?? item.value}</span>
            {item.secondary !== undefined && (
              <span className="text-muted-foreground w-10 shrink-0 text-right text-[11px] tabular-nums">{item.secondary}</span>
            )}
          </div>
          <div aria-hidden className={cn('bg-muted h-1.5 overflow-hidden rounded-full', ranked && 'ml-[1.375rem]')}>
            <div
              className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
              style={{ width: `${Math.min(100, Math.max(0, (item.value / top) * 100))}%`, background: item.colour ?? colour }}
            />
          </div>
        </li>
      ))}
    </List>
  )
}
