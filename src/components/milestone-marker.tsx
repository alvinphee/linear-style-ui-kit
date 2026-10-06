import type { ComponentProps } from 'react'
import { cn } from 'cn'

// A milestone: a diamond marking a key date in a project, such as a beta or a
// release. A Gantt chart draws it on the item's row, in the item's colour; a
// legend draws it small and grey. It is the diamond alone and hidden from
// screen readers: to make it clickable or give it a tooltip, put it in a
// button with a label that says the milestone and its date.
export function MilestoneMarker({ colour = 'var(--muted-foreground)', size = 'default', className, style, ...props }: ComponentProps<'span'> & {
  // Any CSS colour, such as oklch(0.6 0.17 300) or var(--chart-2).
  colour?: string
  // sm: for a legend or beside text.
  size?: 'sm' | 'default'
}) {
  return (
    <span
      aria-hidden
      {...props}
      className={cn(
        'bg-card block shrink-0 rotate-45',
        size === 'sm' ? 'size-2 rounded-[1px] border-[1.5px]' : 'size-2.5 rounded-[2px] border-2',
        className,
      )}
      style={{ borderColor: colour, ...style }}
    />
  )
}
