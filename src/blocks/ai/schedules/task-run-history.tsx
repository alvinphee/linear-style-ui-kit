import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, ArrowRight01Icon, CheckmarkCircle02Icon, PlayIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { formatDuration, formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import type { TaskRun } from './scheduled-task-dialog'

// A scheduled task's run history, newest first, as a timeline: each run's
// status, when it started, how long it took, the result in a line (or why
// it failed) and a link to the chat it posted. A count of runs, successes
// and failures heads it. TaskRunsSheet shows it in a panel from the right,
// titled with the task's name.

const STATUS = {
  succeeded: { label: 'Succeeded', className: 'text-status-done' },
  failed: { label: 'Failed', className: 'text-destructive' },
  running: { label: 'Running', className: 'text-status-progress' },
} as const

function RunIcon({ status }: { status: TaskRun['status'] }) {
  if (status === 'running') return <Spinner aria-hidden role={undefined} className="text-status-progress size-3.5" />
  return (
    <HugeiconsIcon
      icon={status === 'succeeded' ? CheckmarkCircle02Icon : AlertCircleIcon}
      strokeWidth={2}
      className={cn('size-3.5', STATUS[status].className)}
    />
  )
}

export function TaskRunHistory({ runs, onOpenChat, now, empty, className }: {
  runs: TaskRun[]
  onOpenChat?: (chatId: string) => void
  // For "Today" and "Yesterday". Defaults to the browser's clock.
  now?: number
  empty?: ReactNode
  className?: string
}) {
  const at = now ?? Date.now()
  const sorted = [...runs].sort((a, b) => b.startedAt - a.startedAt)
  const failed = runs.filter((r) => r.status === 'failed').length
  const succeeded = runs.filter((r) => r.status === 'succeeded').length

  if (runs.length === 0) {
    return (
      <Empty className={cn('border py-8', className)}>
        <EmptyHeader>
          <EmptyTitle>No runs yet</EmptyTitle>
          <EmptyDescription>{empty ?? 'Each run shows here once the task has run, on schedule or with Run now.'}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      <p className="text-muted-foreground flex flex-wrap gap-x-2 text-[11px]">
        <span>{plural(runs.length, 'run')}</span>
        <span aria-hidden>·</span>
        <span className="text-status-done">{succeeded} succeeded</span>
        {failed > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="text-destructive">{failed} failed</span>
          </>
        )}
      </p>
      <ol aria-label="Runs" className="grid min-w-0">
        {sorted.map((run, i) => {
          const s = STATUS[run.status]
          const last = i === sorted.length - 1
          return (
            <li key={run.id} className="relative flex min-w-0 gap-2.5 pb-4 last:pb-0">
              {!last && <span aria-hidden className="bg-border absolute top-5 bottom-0 left-[6.5px] w-px" />}
              <span className="bg-background relative mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full">
                <RunIcon status={run.status} />
              </span>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className={cn('text-xs font-medium', s.className)}>{s.label}</span>
                  <time dateTime={new Date(run.startedAt).toISOString()} className="text-muted-foreground text-[11px]">
                    {formatRelativeDate(run.startedAt, { now: at, time: true })}
                  </time>
                  {run.finishedAt !== undefined && (
                    <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
                      {formatDuration(run.finishedAt - run.startedAt)}
                    </span>
                  )}
                </div>
                {run.status === 'failed' && run.error && <p className="text-muted-foreground line-clamp-2 text-xs">{run.error}</p>}
                {run.status === 'succeeded' && run.summary && <p className="line-clamp-2 text-xs">{run.summary}</p>}
                {run.status === 'running' && <p className="text-muted-foreground text-xs">Working on it. The result posts as a new chat.</p>}
                {run.chatId && onOpenChat && (
                  <Button
                    variant="link"
                    size="xs"
                    className="h-auto w-fit p-0 text-[11px] has-data-[icon=inline-end]:pr-0"
                    onClick={() => onOpenChat(run.chatId!)}
                  >
                    Open chat
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function TaskRunsSheet({ open, onOpenChange, name, description, runs, onOpenChat, onRunNow, now }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // The task's name, the sheet's title.
  name: string
  // Under the title: usually describeRecurrence.
  description?: ReactNode
  runs: TaskRun[]
  onOpenChat?: (chatId: string) => void
  // Left out: no Run now button.
  onRunNow?: () => void
  now?: number
}) {
  const running = runs.some((r) => r.status === 'running')
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="gap-1 border-b p-4 pr-12">
          <SheetTitle className="truncate">{name}</SheetTitle>
          <SheetDescription>{description ?? 'Run history'}</SheetDescription>
          {onRunNow && (
            <Button variant="outline" size="sm" className="mt-2 w-fit" disabled={running} onClick={onRunNow}>
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
              {running ? 'Running…' : 'Run now'}
            </Button>
          )}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TaskRunHistory runs={runs} onOpenChat={onOpenChat} now={now} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
