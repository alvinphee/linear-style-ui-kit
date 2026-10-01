import type { ReactNode } from 'react'
import { cn } from 'cn'

// A status shown as a small pill with a coloured dot: "Paid", "Overdue",
// "Awaiting approval". The tone says how to read it; which statuses map to
// which tone is up to the app (see toneOf in the ERP template).
//   soft:    tinted background, for dense tables and side panels
//   outline: a bordered pill, for lighter pages

export type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger'

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-[color-mix(in_oklch,var(--brand),transparent_86%)] text-brand',
  progress: 'bg-[color-mix(in_oklch,var(--status-progress),transparent_85%)] text-status-progress',
  success: 'bg-[color-mix(in_oklch,var(--status-done),transparent_85%)] text-status-done',
  warning: 'bg-[color-mix(in_oklch,oklch(0.75_0.15_75),transparent_82%)] text-[oklch(0.62_0.14_70)] dark:text-[oklch(0.8_0.14_80)]',
  danger: 'bg-destructive/10 text-destructive',
}

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/50',
  info: 'bg-brand',
  progress: 'bg-status-progress',
  success: 'bg-status-done',
  warning: 'bg-[oklch(0.75_0.15_75)]',
  danger: 'bg-destructive',
}

export function StatusBadge({ tone = 'neutral', variant = 'soft', dot = true, dotClassName, children, className }: {
  tone?: Tone
  variant?: 'soft' | 'outline'
  dot?: boolean
  // Overrides the tone's dot colour, for a status with a colour of its own.
  dotClassName?: string
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium whitespace-nowrap',
        variant === 'soft' ? TONE_CLASS[tone] : 'text-foreground border font-normal',
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', TONE_DOT[tone], dotClassName)} />}
      {children}
    </span>
  )
}
