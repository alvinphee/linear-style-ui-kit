import type { ReactNode } from 'react'
import { cn } from 'cn'

// A legend for a line chart drawn outside the chart, such as in a panel's
// header: a short stroke in the series' colour (dashed for a comparison or
// target line) and its name. Put a few in a LegendRow.
export function LegendLine({ label, colour, dashed, className }: {
  label: ReactNode
  // Any CSS colour, such as var(--chart-1).
  colour: string
  dashed?: boolean
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <svg width="16" height="6" aria-hidden className="shrink-0">
        <line x1="0" y1="3" x2="16" y2="3" stroke={colour} strokeWidth="2" strokeDasharray={dashed ? '3 3' : undefined} />
      </svg>
      {label}
    </span>
  )
}

// A row of LegendLines in small grey type, wrapping on narrow screens.
export function LegendRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-muted-foreground flex flex-wrap items-center gap-3 text-[11px]', className)}>{children}</div>
}
