import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Spinner } from '@/components/ui/spinner'

// The small signs that an AI is working: a shimmering status line
// ("Thinking…", "Searching jobs…"), typing dots, a pulsing dot, a live
// elapsed timer, and the caret at the end of text that is still streaming.
//
// The motion is plain CSS in <AiMotion />. Each piece here renders it, and
// React 19 hoists it into <head> once (same href), so they work anywhere.

export function AiMotion() {
  return (
    <style href="ai-motion" precedence="default">{`
@keyframes ai-shimmer { from { background-position: 150% 0 } to { background-position: -50% 0 } }
.ai-shimmer {
  background-image: linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 38%, var(--foreground) 50%, var(--muted-foreground) 62%, var(--muted-foreground) 100%);
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ai-shimmer 2.2s linear infinite;
}
@keyframes ai-dot { 0%, 80%, 100% { opacity: .35; transform: translateY(0) } 40% { opacity: 1; transform: translateY(-3px) } }
.ai-dot { animation: ai-dot 1.2s ease-in-out infinite }
@keyframes ai-wave { 0%, 100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
.ai-wave { animation: ai-wave 0.9s ease-in-out infinite; transform-origin: center }
@keyframes ai-in { from { opacity: 0; transform: translateY(2px) } to { opacity: 1; transform: none } }
.ai-in { animation: ai-in .3s ease-out both }
@keyframes ai-pulse { 0%, 100% { opacity: .35; transform: scale(.8) } 50% { opacity: 1; transform: scale(1) } }
.ai-pulse { animation: ai-pulse 1.4s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) {
  .ai-shimmer { animation: none; background: none; color: var(--muted-foreground) }
  .ai-dot, .ai-wave, .ai-in, .ai-pulse { animation: none }
}
`}</style>
  )
}

// "0.4s", "8s", "1m 5s".
export function formatDuration(ms: number) {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

// The time, refreshed every `interval` ms while `active`. `clock` lets an app
// with its own clock (a demo that starts on a fixed date) keep timers in step;
// pass a stable function.
export function useNow(active: boolean, interval = 1000, clock: () => number = Date.now) {
  const [time, setTime] = useState(clock)
  useEffect(() => {
    if (!active) return
    setTime(clock())
    const timer = window.setInterval(() => setTime(clock()), interval)
    return () => window.clearInterval(timer)
  }, [active, interval, clock])
  return time
}

// A running timer from `since`: "3s", "1m 12s".
export function Elapsed({ since, interval = 1000, clock, className }: {
  since: number
  interval?: number
  clock?: () => number
  className?: string
}) {
  const time = useNow(true, interval, clock)
  return <span className={cn('tabular-nums', className)}>{formatDuration(Math.max(0, time - since))}</span>
}

// Text with a light sweeping across it, for whatever the AI is doing now.
export function ShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('ai-shimmer', className)}>
      <AiMotion />
      {children}
    </span>
  )
}

// The brand dot that breathes while an agent works.
export function PulseDot({ className }: { className?: string }) {
  return (
    <span className={cn('ai-pulse bg-brand size-1.5 shrink-0 rounded-full', className)}>
      <AiMotion />
    </span>
  )
}

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-5 items-center gap-1', className)} aria-hidden="true">
      <AiMotion />
      {[0, 1, 2].map((i) => (
        <span key={i} className="ai-dot bg-muted-foreground size-1.5 rounded-full" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  )
}

export type ThinkingIndicator = 'sparkle' | 'dot' | 'spinner' | 'dots' | 'none'

// One status line: an indicator, a shimmering label and, given `since`, the
// time so far.
//   sparkle: a pulsing brand sparkle, for AI features inside the product
//   dot:     the breathing brand dot of the thinking trail
//   spinner: a spinner, for a tool that is running
//   dots:    typing dots, for a reply about to start
export function Thinking({ label = 'Thinking…', indicator = 'sparkle', since, clock, className }: {
  label?: ReactNode
  indicator?: ThinkingIndicator
  since?: number
  clock?: () => number
  className?: string
}) {
  return (
    <span role="status" className={cn('text-muted-foreground inline-flex items-center gap-1.5 text-xs', className)}>
      {indicator === 'sparkle' && <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand size-3.5 shrink-0 animate-pulse" />}
      {indicator === 'dot' && <PulseDot />}
      {indicator === 'spinner' && <Spinner className="size-3.5" />}
      {indicator === 'dots' && <TypingDots className="h-auto" />}
      <ShimmerText>{label}</ShimmerText>
      {since !== undefined && <Elapsed since={since} clock={clock} className="shrink-0 opacity-70" />}
    </span>
  )
}

// The thinking trail's look on its own: spinner, shimmering label, timer.
export function ActivityLine({ text, since, clock, className }: {
  text: string
  since: number
  clock?: () => number
  className?: string
}) {
  return (
    <div className={cn('flex h-6 min-w-0 items-center gap-2 text-xs', className)} aria-hidden="true">
      <Spinner className="text-muted-foreground size-3.5" />
      <ShimmerText className="min-w-0 truncate font-medium">{text}</ShimmerText>
      <span className="text-muted-foreground shrink-0"><Elapsed since={since} clock={clock} /></span>
    </div>
  )
}

// The cursor at the end of streaming text.
//   line:  a thin blinking text cursor, the chat look
//   block: a soft brand block, for short AI text inside the product
export function StreamCaret({ variant = 'line', className }: { variant?: 'line' | 'block'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        variant === 'line'
          ? 'bg-foreground animate-caret-blink ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-[3px] rounded-full'
          : 'bg-brand/70 ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-[1px]',
        className,
      )}
    />
  )
}
