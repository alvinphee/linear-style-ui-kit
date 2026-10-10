import { HugeiconsIcon } from '@hugeicons/react'
import { BookOpen01Icon, FileSearchIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatTokens } from '@/lib/token-estimate'

// How much of a project's context its knowledge takes. A bar with a tick at
// the point where the assistant stops reading every file in full and starts
// searching them instead (search mode). Search mode is not a failure, so it
// shows in the accent, not in red. Near the tick the bar turns amber.
//
// ContextModeBadge names the mode in use, with a one-line tooltip on what it
// means. The app works the mode out; both parts only show it.

// Full context: every file goes to the model in each chat (long context).
// Search: only the parts that match the question do (retrieval, RAG).
export type ContextMode = 'full' | 'search'

const MODE = {
  full: {
    label: 'Full context',
    icon: BookOpen01Icon,
    tip: 'Every file is read in full in each chat, so nothing is left out.',
    className: 'bg-muted text-muted-foreground',
  },
  search: {
    label: 'Search mode',
    icon: FileSearchIcon,
    tip: 'There is too much to read in full, so the assistant searches the files and reads the parts that match.',
    className: 'bg-brand/10 text-brand',
  },
} as const

export function ContextModeBadge({ mode, className }: { mode: ContextMode; className?: string }) {
  const m = MODE[mode]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            'focus-visible:ring-ring/40 inline-flex h-5 shrink-0 items-center gap-1 rounded-full pr-2 pl-1.5 text-[11px] font-medium outline-none focus-visible:ring-2',
            m.className,
            className,
          )}
        >
          <HugeiconsIcon icon={m.icon} strokeWidth={2} className="size-3" aria-hidden />
          {m.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{m.tip}</TooltipContent>
    </Tooltip>
  )
}

const SIZE = {
  sm: { line: 'text-[11px]', label: 'text-muted-foreground', bar: 'h-1', tick: '-inset-y-0.5' },
  md: { line: 'text-xs', label: 'font-medium', bar: 'h-1.5', tick: '-inset-y-1' },
} as const

const TONE_BAR = {
  normal: '',
  warning: '[&>[data-slot=progress-indicator]]:bg-status-progress',
  search: '[&>[data-slot=progress-indicator]]:bg-brand',
} as const

export function ContextMeter({ used, limit, threshold = 0.8, mode, size = 'md', className }: {
  // Tokens the knowledge takes, and the most the project's context holds.
  used: number
  limit: number
  // The share of `limit` (0 to 1) at which search mode starts. The tick.
  threshold?: number
  // The mode in use. Left out: search from the threshold up.
  mode?: ContextMode
  // sm: an 11px line and a 4px bar, no note. md: a 12px line, a 6px bar and
  // a note on where search mode starts.
  size?: keyof typeof SIZE
  className?: string
}) {
  const share = limit > 0 ? used / limit : 0
  const percent = Math.round(share * 100)
  const tickAt = Math.min(100, Math.max(0, threshold * 100))
  const inUse = mode ?? (share >= threshold ? 'search' : 'full')
  // Amber over the last tenth before the tick: one more file may tip it.
  const tone = inUse === 'search' ? 'search' : share >= threshold - 0.1 && used > 0 ? 'warning' : 'normal'
  const styles = SIZE[size]
  const label = percent > 100 ? `Knowledge is ${percent}% of project context` : `Using ${percent}% of project context`

  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5', styles.line)}>
        <span className={styles.label}>{label}</span>
        <span className="text-muted-foreground ml-auto tabular-nums">
          {formatTokens(used)} / {formatTokens(limit)} tokens
        </span>
      </div>
      <div className="relative">
        <Progress
          value={Math.min(100, Math.max(0, percent))}
          aria-label="Project context used"
          aria-valuetext={label}
          className={cn(styles.bar, TONE_BAR[tone])}
        />
        <span
          aria-hidden
          title={`Search mode from ${Math.round(tickAt)}%`}
          className={cn('bg-foreground/50 absolute w-0.5 -translate-x-1/2 rounded-full', styles.tick)}
          style={{ left: `${tickAt}%` }}
        />
      </div>
      {size === 'md' && (
        <p className={cn('text-muted-foreground text-[11px]', tone === 'warning' && 'text-status-progress')}>
          {tone === 'warning'
            ? `Nearly full: from ${Math.round(tickAt)}% the assistant switches to searching.`
            : inUse === 'search'
              ? `Past ${Math.round(tickAt)}%, so the assistant searches the knowledge.`
              : `Search mode starts at ${Math.round(tickAt)}%.`}
        </p>
      )}
    </div>
  )
}
