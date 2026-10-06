import type { CSSProperties } from 'react'
import { cn } from 'cn'

export type TimeMarkerTone = 'brand' | 'destructive'

const TONES: Record<TimeMarkerTone, { pill: string; line: string }> = {
  brand: { pill: 'bg-brand text-primary-foreground', line: 'bg-brand' },
  destructive: { pill: 'bg-destructive text-white', line: 'bg-destructive' },
}

const ORIENTATION = {
  vertical: { box: 'w-0 flex-col', line: 'w-px' },
  horizontal: { box: 'h-0 flex-row', line: 'h-px' },
} as const

// One moment on a timeline, such as today on a roadmap or now on a schedule:
// a line down the rows, with its label in a pill at the top. Give it the
// height it should run (top and bottom in className) and its place on the
// timeline in style ({ left: 240 }); it centres on that point. It sits above
// the bars (z-10), under a sticky column of names (z-20).
//
// On a timeline that runs down the page (a day by the hour), make it
// horizontal: a line across the columns with its pill at the left. Give it
// left and right in className and its place in style ({ top: 240 }).
//
// With `description` ("Today, 30 Sep") screen readers read it; without, it is
// decoration, so say the date in text nearby.
export function TimeMarker({ label, tone = 'brand', orientation = 'vertical', description, className, style }: {
  // In the pill: "Today", "14:05". Leave it out for the line alone.
  label?: string
  tone?: TimeMarkerTone
  orientation?: keyof typeof ORIENTATION
  description?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      role={description ? 'img' : undefined}
      aria-label={description}
      aria-hidden={description ? undefined : true}
      className={cn('pointer-events-none absolute z-10 flex items-center', ORIENTATION[orientation].box, className)}
      style={style}
    >
      {label && (
        <span className={cn('shrink-0 rounded px-1.5 text-[10px] leading-4 font-medium whitespace-nowrap tabular-nums', TONES[tone].pill)}>
          {label}
        </span>
      )}
      <span className={cn('flex-1', ORIENTATION[orientation].line, TONES[tone].line)} />
    </div>
  )
}
