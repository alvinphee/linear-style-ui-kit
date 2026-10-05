import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { AlertSquareIcon, FullSignalIcon, LowSignalIcon, MediumSignalIcon, NoSignalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

// A priority as an icon: signal bars for low to high, and a red alert square
// for urgent. Decorative by default; pass `label` when it stands alone.

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export const PRIORITIES: Record<Priority, { label: string; icon: IconSvgElement; className: string }> = {
  none: { label: 'No priority', icon: NoSignalIcon, className: 'text-muted-foreground' },
  low: { label: 'Low', icon: LowSignalIcon, className: 'text-muted-foreground' },
  medium: { label: 'Medium', icon: MediumSignalIcon, className: 'text-muted-foreground' },
  high: { label: 'High', icon: FullSignalIcon, className: 'text-foreground' },
  urgent: { label: 'Urgent', icon: AlertSquareIcon, className: 'text-status-blocked' },
}

// Most urgent first, for menus and sorting.
export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

export function PriorityIcon({ priority, label, className }: {
  priority: Priority
  // Say the priority out loud (true for its name, or your own words).
  label?: boolean | string
  className?: string
}) {
  const p = PRIORITIES[priority]
  const name = label === true ? `Priority: ${p.label}` : label || undefined
  return (
    <HugeiconsIcon
      icon={p.icon}
      strokeWidth={2}
      className={cn('size-3.5 shrink-0', p.className, className)}
      aria-hidden={name ? undefined : true}
      aria-label={name}
      role={name ? 'img' : undefined}
    />
  )
}
