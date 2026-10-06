import type { ComponentProps } from 'react'
import { cn } from 'cn'

// The type of a bar's name. A Gantt chart that draws a name beside a bar, or
// measures one to see if it fits inside, uses it too.
export const GANTT_LABEL = 'text-[11px] font-medium'

const tint = (colour: string, percent: number) => `color-mix(in oklch, ${colour} ${percent}%, var(--card))`

// One item's bar on a Gantt chart: tinted in its colour, filled in from the
// left as far as it has got, with its name inside and its progress at the
// end. The chart places it; on its own it takes the width you give it in
// className or style. Other props go on the button, so it can open the item
// or carry a tooltip.
//
// On a timeline that scrolls sideways, the name sticks to the left edge of the
// view, so a bar that starts off screen still shows it. Set
// --gantt-sticky-left on the timeline to where that edge is (just past a
// sticky column of names, say). The bar clips with overflow: clip, not
// hidden: hidden would make the bar a scroller, and the name would stick to
// the bar instead.
export function GanttBar({
  colour, progress = 0, label, showProgress = false, inset, className, style, ...props
}: Omit<ComponentProps<'button'>, 'children'> & {
  // Any CSS colour, such as oklch(0.6 0.17 300) or var(--chart-2).
  colour: string
  // 0 to 100.
  progress?: number
  // The name inside the bar. Leave it out to draw the name beside the bar.
  label?: string
  // "62%" at the end of the bar.
  showProgress?: boolean
  // Room the text keeps clear, in pixels from the bar's start: where it
  // starts, how far from the end it stops, and where the name must end. For
  // a milestone drawn on the bar.
  inset?: { start?: number; end?: number; labelEnd?: number }
}) {
  const start = inset?.start ?? 8
  const end = inset?.end ?? 8
  const filled = Math.min(100, Math.max(0, progress))

  return (
    <button
      type="button"
      {...props}
      className={cn(
        'relative flex h-6 min-w-0 items-center overflow-clip rounded-md border text-left outline-none',
        'hover:ring-foreground/15 focus-visible:ring-ring/50 hover:ring-2 focus-visible:ring-2',
        className,
      )}
      style={{
        backgroundColor: tint(colour, 20),
        borderColor: `color-mix(in oklch, ${colour} 55%, transparent)`,
        ...style,
      }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${filled}%`, backgroundColor: tint(colour, 48) }} />
      {label && (
        <span
          className={cn(GANTT_LABEL, 'relative flex min-w-0 flex-1 items-center gap-2')}
          style={{ paddingLeft: start, paddingRight: end }}
        >
          {/* A sticky element only moves inside its parent: this one spans the room the name may use. */}
          <span
            className="min-w-0 flex-1"
            style={{ maxWidth: inset?.labelEnd !== undefined ? Math.max(0, inset.labelEnd - start) : undefined }}
          >
            <span className="sticky block w-fit max-w-full truncate" style={{ left: 'var(--gantt-sticky-left, 0px)' }}>
              {label}
            </span>
          </span>
          {showProgress && <span className="ml-auto tabular-nums opacity-60">{filled}%</span>}
        </span>
      )}
    </button>
  )
}
