import type { ReactNode } from 'react'
import { cn } from 'cn'
import { Progress } from '@/components/ui/progress'

// How much of a limit is used: a line with a label and a count, a thin bar,
// and an optional note line under it. For plan usage (seats, storage, API
// calls), a credits meter in a sidebar foot, or a usage card.
//   sm: an 11px muted line and a 4px bar, for a sidebar or a small card
//   md: a medium label, a 12px line and a 6px bar, for a panel
// It sets no padding or border; pass them in className to make it a card,
// and put an action (an Upgrade button) in `children`.

const SIZE = {
  sm: { line: 'gap-x-2 text-[11px]', label: 'text-muted-foreground', bar: '' },
  md: { line: 'gap-x-3 text-xs', label: 'font-medium', bar: 'h-1.5' },
} as const

const TONE_BAR = {
  warning: '[&>[data-slot=progress-indicator]]:bg-status-progress',
  danger: '[&>[data-slot=progress-indicator]]:bg-destructive',
} as const

export function UsageMeter({
  value, label, count, amount, note, noteEnd, barLabel, warnAt, dangerAt, size = 'sm', children, className,
}: {
  // Percent used, 0 to 100.
  value: number
  // On the left of the top line, such as "Storage" or "62% of monthly credits".
  label?: ReactNode
  // On the right of the top line, such as "180 / 250" or "Resets 1 Oct".
  count?: ReactNode
  // A larger figure between the line and the bar, such as 12 / 50 GB.
  amount?: ReactNode
  // Under the bar, such as "70 left" or "Files and attachments".
  note?: ReactNode
  // Under the bar on the right, such as when it resets.
  noteEnd?: ReactNode
  // The bar's name for screen readers. Defaults to "<label> used" for a text
  // label, otherwise "N% used".
  barLabel?: string
  // From this percent the bar turns amber (near the limit).
  warnAt?: number
  // From this percent the bar and the note turn red (at the limit).
  dangerAt?: number
  size?: keyof typeof SIZE
  // Under everything, such as an Upgrade button.
  children?: ReactNode
  className?: string
}) {
  const percent = Math.min(100, Math.max(0, value))
  const level = dangerAt !== undefined && percent >= dangerAt
    ? 'danger'
    : warnAt !== undefined && percent >= warnAt ? 'warning' : undefined
  const styles = SIZE[size]

  return (
    <div className={cn('grid gap-1.5', className)}>
      {(label != null || count != null) && (
        <div className={cn('flex flex-wrap items-baseline justify-between gap-y-0.5', styles.line)}>
          {label != null && <span className={styles.label}>{label}</span>}
          {count != null && <span className="text-muted-foreground ml-auto tabular-nums">{count}</span>}
        </div>
      )}
      {amount != null && <span className="text-sm font-medium tabular-nums">{amount}</span>}
      <Progress
        value={percent}
        aria-label={barLabel ?? (typeof label === 'string' ? `${label} used` : `${Math.round(percent)}% used`)}
        className={cn(styles.bar, level && TONE_BAR[level])}
      />
      {(note != null || noteEnd != null) && (
        <div className="text-muted-foreground flex flex-wrap justify-between gap-x-3 text-[11px] tabular-nums">
          {note != null && <span className={cn(level === 'danger' && 'text-destructive')}>{note}</span>}
          {noteEnd != null && <span className="ml-auto flex items-center gap-1">{noteEnd}</span>}
        </div>
      )}
      {children}
    </div>
  )
}
