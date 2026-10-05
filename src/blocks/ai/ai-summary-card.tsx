import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Copy01Icon, RefreshIcon, StopIcon, ThumbsDownIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { AiLabel } from '@/components/ai-label'
import { IconAction } from '@/components/icon-action'
import { Thinking } from '@/components/thinking-indicator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Feedback } from './chat-message'

// An AI summary card: a few points the AI wrote about a record or a day,
// labelled as AI. It shows the four steps of writing one:
//   idle       nothing yet (pass `idle`, such as a Summarise button)
//   thinking   skeleton lines while it reads
//   streaming  the text appearing (children), with Stop
//   done       the text, then Regenerate, Copy and thumbs up or down
// A stale summary (the record changed since) gets a notice with Regenerate.
// The card writes nothing itself: the app streams the text into children.

export type SummaryPhase = 'idle' | 'thinking' | 'streaming' | 'done'

export function AiSummaryCard({
  title = 'Summary', label, phase, idle, thinkingLabel = 'Reading…', lines = 3, stale, note, footerAction, actions,
  feedback = null, onFeedback, feedbackLabels = ['Good summary', 'Bad summary'], onStop, onRegenerate, onCopy,
  children, className,
}: {
  title?: ReactNode
  // The card's accessible name, such as "AI summary of DO-24817".
  label?: string
  phase: SummaryPhase
  // What the card shows before it has a summary.
  idle?: ReactNode
  thinkingLabel?: ReactNode
  // How many skeleton lines to show while thinking.
  lines?: number
  // Why the summary is out of date; shown above it with Regenerate.
  stale?: ReactNode
  // The footer's note, such as "Written just now from 4 sources".
  note?: ReactNode
  // A button in the footer, such as "Ask a follow-up".
  footerAction?: ReactNode
  // More buttons in the header, before Regenerate and Copy.
  actions?: ReactNode
  feedback?: Feedback | null
  onFeedback?: (value: Feedback | null) => void
  feedbackLabels?: [string, string]
  onStop?: () => void
  onRegenerate?: () => void
  onCopy?: () => void
  // The summary itself, as far as it has streamed.
  children?: ReactNode
  className?: string
}) {
  const writing = phase === 'thinking' || phase === 'streaming'
  return (
    <section aria-label={label} className={cn('bg-subtle min-w-0 rounded-lg border', className)}>
      <header className="flex h-9 min-w-0 items-center gap-1.5 border-b pr-1.5 pl-3">
        <span className="min-w-0 truncate text-xs font-medium">{title}</span>
        <span aria-hidden className="text-muted-foreground">·</span>
        <AiLabel />
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {actions}
          {phase === 'streaming' && onStop && (
            <Button variant="ghost" size="sm" onClick={onStop}>
              <HugeiconsIcon icon={StopIcon} strokeWidth={2} data-icon="inline-start" />
              Stop
            </Button>
          )}
          {phase === 'done' && (
            <>
              {onRegenerate && <IconAction label="Regenerate" onClick={onRegenerate} icon={RefreshIcon} />}
              {onCopy && <IconAction label="Copy summary" onClick={onCopy} icon={Copy01Icon} />}
            </>
          )}
        </div>
      </header>

      {stale && phase === 'done' && (
        <div className="bg-status-progress/10 text-status-progress flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-1.5 text-xs">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5 shrink-0" />
          {stale}
          {onRegenerate && (
            <Button variant="link" size="xs" className="text-status-progress ml-auto h-auto px-0" onClick={onRegenerate}>
              Regenerate
            </Button>
          )}
        </div>
      )}

      <div className="px-3 py-2.5" aria-busy={writing}>
        {phase === 'idle' && idle}
        {phase === 'thinking' && (
          <div className="grid gap-2 py-0.5">
            <Thinking label={thinkingLabel} />
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="size-1.5 rounded-full" />
                <Skeleton className={cn('h-3', i % 3 === 1 ? 'w-3/4' : i % 3 === 2 ? 'w-2/3' : 'w-full')} />
              </div>
            ))}
          </div>
        )}
        {(phase === 'streaming' || phase === 'done') && children}
      </div>

      {phase === 'done' && (note || footerAction || onFeedback) && (
        <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t py-1 pr-1.5 pl-3">
          <span className="text-muted-foreground mr-auto text-[11px]">{note}</span>
          {feedback && <span className="text-muted-foreground text-[11px]" aria-live="polite">Thanks for the feedback</span>}
          {footerAction}
          {onFeedback && (
            <>
              <IconAction
                label={feedbackLabels[0]}
                pressed={feedback === 'up'}
                onClick={() => onFeedback(feedback === 'up' ? null : 'up')}
                icon={ThumbsUpIcon}
              />
              <IconAction
                label={feedbackLabels[1]}
                pressed={feedback === 'down'}
                onClick={() => onFeedback(feedback === 'down' ? null : 'down')}
                icon={ThumbsDownIcon}
              />
            </>
          )}
        </footer>
      )}
    </section>
  )
}

// Bullet points with the kit's brand dots, for a summary's body.
export function SummaryBullets({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn('grid gap-1.5 text-[13px] leading-5', className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="bg-brand/60 mt-2 size-1.5 shrink-0 rounded-full" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  )
}
