import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'
import { DeltaBadge, TONE_TEXT, deltaTone, type KpiDelta, type KpiTone } from '@/components/delta-badge'
import { Sparkline } from '@/components/sparkline'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// The delta and tone types are part of the card's props.
export type { KpiDelta, KpiTone }

// A KPI card: a headline number with its label and icon, and optionally the
// change on the period before (a delta badge), a sparkline of the period,
// a footnote line and a tooltip. Give it `href` or `onClick` and the whole
// card becomes the link or button.
//
// Lay several out with KpiGrid: one column on a phone, two, then four.
// Inside an app whose content area is narrower than the window, use
// breakpoints="container" under an @container element.

export type KpiCardProps = {
  label: string
  value: ReactNode
  icon?: IconSvgElement
  // A short note at the right of the label, such as "total" or "avg / day".
  hint?: ReactNode
  // The exact figure, shown on hover when the value is rounded.
  valueTitle?: string
  delta?: KpiDelta
  sparkline?: { data: number[]; previous?: number[] }
  // A line under the value, after the delta badge if there is one.
  footnote?: ReactNode
  footnoteTone?: KpiTone
  tooltip?: ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

export function KpiCard({
  label, value, icon, hint, valueTitle, delta, sparkline, footnote, footnoteTone, tooltip, href, onClick, className,
}: KpiCardProps) {
  const badge = delta && <DeltaBadge {...delta} />
  const body = (
    <>
      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        {icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0" />}
        <span className="text-foreground truncate font-medium">{label}</span>
        {hint && <span className="ml-auto shrink-0 text-[11px]">{hint}</span>}
      </div>
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="grid min-w-0 gap-1.5">
          <span className="truncate text-xl leading-none font-semibold tracking-tight tabular-nums" title={valueTitle}>
            {value}
          </span>
          {footnote ? (
            <div className="flex min-w-0 items-center gap-1.5">
              {badge}
              <span className={cn('text-muted-foreground truncate text-[11px] tabular-nums', footnoteTone && TONE_TEXT[footnoteTone])}>
                {footnote}
              </span>
            </div>
          ) : badge}
        </div>
        {sparkline && (
          <Sparkline data={sparkline.data} previous={sparkline.previous} tone={delta ? deltaTone(delta) : undefined} />
        )}
      </div>
    </>
  )

  const interactive = !!(href || onClick || tooltip)
  // content-start keeps the rows at the top when a taller neighbour stretches the card.
  const box = cn(
    'bg-card grid min-w-0 content-start gap-2.5 rounded-lg border p-3',
    interactive && 'hover:border-foreground/15 focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-2',
    className,
  )
  const card = href ? (
    <a href={href} onClick={onClick} className={box}>{body}</a>
  ) : onClick ? (
    <button type="button" onClick={onClick} className={cn(box, 'text-start')}>{body}</button>
  ) : (
    // Focusable so the tooltip opens from the keyboard too.
    <div tabIndex={tooltip ? 0 : undefined} className={box}>{body}</div>
  )

  if (!tooltip) return card
  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

const COLUMNS = {
  viewport: 'sm:grid-cols-2 lg:grid-cols-4',
  container: '@sm:grid-cols-2 @4xl:grid-cols-4',
}

export function KpiGrid({ children, breakpoints = 'viewport', className }: {
  children: ReactNode
  // viewport: columns follow the window. container: they follow the nearest @container.
  breakpoints?: keyof typeof COLUMNS
  className?: string
}) {
  return <div className={cn('grid min-w-0 grid-cols-1 gap-3', COLUMNS[breakpoints], className)}>{children}</div>
}
