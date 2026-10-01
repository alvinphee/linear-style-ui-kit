import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'

// The change on the period before, as a small badge: an arrow and "+12.4%".
// Up is good news by default and down bad; pass tone when it's the other
// way round (costs, churn) or neither. KPI cards, tables and charts use it.

// positive and negative are good and bad news; warning needs a look;
// neutral is a change that is neither.
export type KpiTone = 'positive' | 'negative' | 'warning' | 'neutral'

export type KpiDelta = {
  direction: 'up' | 'down'
  // Such as "+12.4%" or "−0.31 pts".
  text: ReactNode
  // Defaults to positive when up and negative when down. Pass it when down
  // is good news (costs, churn) or the change is neither.
  tone?: KpiTone
}

export const TONE_TEXT: Record<KpiTone, string> = {
  positive: 'text-status-done',
  negative: 'text-destructive',
  // Plain amber is too faint for 11px text on a light card; a little foreground
  // darkens it in light mode and lightens it in dark.
  warning: 'text-[color-mix(in_oklch,var(--status-progress),var(--foreground)_25%)]',
  neutral: 'text-muted-foreground',
}

export const TONE_LINE: Record<KpiTone, string> = {
  positive: 'var(--chart-1)',
  negative: 'var(--destructive)',
  warning: 'var(--status-progress)',
  neutral: 'var(--chart-1)',
}

export const deltaTone = (delta: KpiDelta): KpiTone => delta.tone ?? (delta.direction === 'up' ? 'positive' : 'negative')

export function DeltaBadge({ className, ...delta }: KpiDelta & { className?: string }) {
  return (
    <Badge variant="outline" className={cn('tabular-nums', TONE_TEXT[deltaTone(delta)], className)}>
      <HugeiconsIcon icon={delta.direction === 'up' ? ArrowUpRight01Icon : ArrowDownRight01Icon} strokeWidth={2} data-icon="inline-start" />
      {delta.text}
    </Badge>
  )
}
