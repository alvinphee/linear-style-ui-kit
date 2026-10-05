import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CancelCircleIcon, CheckmarkCircle02Icon, CircleDashedIcon, CircleIcon, TimeHalfPassIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'

// A workflow status as an icon: backlog, todo, in progress, done, cancelled,
// coloured by the status tokens (--status-todo, --status-progress,
// --status-done). Decorative by default; pass `label` when the icon stands
// alone, so screen readers hear the status.

export type WorkflowStatus = 'backlog' | 'todo' | 'progress' | 'done' | 'cancelled'

export const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; icon: IconSvgElement; className: string }> = {
  backlog: { label: 'Backlog', icon: CircleDashedIcon, className: 'text-status-todo' },
  todo: { label: 'Todo', icon: CircleIcon, className: 'text-status-todo' },
  progress: { label: 'In progress', icon: TimeHalfPassIcon, className: 'text-status-progress' },
  done: { label: 'Done', icon: CheckmarkCircle02Icon, className: 'text-status-done' },
  cancelled: { label: 'Cancelled', icon: CancelCircleIcon, className: 'text-muted-foreground' },
}

export function StatusIcon({ status, label, className }: {
  status: WorkflowStatus
  // Say the status out loud (true for its name, or your own words).
  label?: boolean | string
  className?: string
}) {
  const s = WORKFLOW_STATUS[status]
  const name = label === true ? s.label : label || undefined
  return (
    <HugeiconsIcon
      icon={s.icon}
      strokeWidth={2}
      className={cn('size-3.5 shrink-0', s.className, className)}
      aria-hidden={name ? undefined : true}
      aria-label={name}
      role={name ? 'img' : undefined}
    />
  )
}
