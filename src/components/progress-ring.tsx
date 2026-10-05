import { useEffect, useState, type ReactNode } from 'react'
import { cn } from 'cn'

// Progress as a ring that fills clockwise from the top: a checklist's steps
// done, a target met. Put the number in the middle as children ("3/5",
// "92%"); it takes its type size from className. With `label` it is an image
// with that name for screen readers; without, it is decorative, so put the
// numbers in text nearby. `animateIn` fills it from empty when it appears.
export function ProgressRing({ value, size = 40, strokeWidth = 3, colour = 'var(--brand)', label, animateIn, children, className }: {
  // 0 to 100.
  value: number
  // Width and height, in pixels.
  size?: number
  // The ring's thickness, in pixels.
  strokeWidth?: number
  // Any CSS colour, such as var(--chart-4).
  colour?: string
  // The accessible name: "On time: 92%".
  label?: string
  animateIn?: boolean
  children?: ReactNode
  className?: string
}) {
  const [shown, setShown] = useState(!animateIn)

  // Start empty and fill on the next frame, so the transition runs.
  useEffect(() => {
    if (!animateIn) return
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [animateIn])

  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const filled = shown ? Math.min(100, Math.max(0, value)) : 0

  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative grid shrink-0 place-items-center tabular-nums', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-foreground/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - filled / 100)}
          // A round cap draws a dot even at 0%, so hide the arc when empty.
          strokeOpacity={filled === 0 ? 0 : 1}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>
      {children !== undefined && <span className="relative">{children}</span>}
    </div>
  )
}
