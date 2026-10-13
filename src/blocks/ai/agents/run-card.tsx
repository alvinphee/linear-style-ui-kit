import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Shield01Icon, StopCircleIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { AgentRun } from './agent-types'
import { currentStep, RunAgentMark, RunStatusBadge, RunTrigger, runStatusLabel, runTiming, type RunAgent } from './run-status'

// One run in a list: which agent, what it is doing, how it started and how
// long it has been going. While it runs it shows a progress bar and the step
// it is on; when it is waiting for approval, what it wants to do with Allow
// once and Deny right there, so a quick yes needs no detour; when it failed,
// the error. A dot marks a run that finished or started waiting since it was
// last opened. The whole card opens the run.

export function RunCard({ run, agent, onOpen, onApprove, onDeny, onCancel, now = Date.now(), className }: {
  run: AgentRun
  agent: RunAgent
  onOpen: () => void
  // Allow once, from the card. Always allow is in the run's detail.
  onApprove?: () => void
  onDeny?: () => void
  onCancel?: () => void
  // The time "Started 4 min ago" counts from; pass a ticking value to keep it fresh.
  now?: number
  className?: string
}) {
  const running = run.status === 'running' || run.status === 'queued'
  const awaiting = run.status === 'awaiting' && run.approval?.state === 'pending'
  const step = currentStep(run)
  const progress = run.progress ?? (run.status === 'queued' ? 0 : undefined)
  const unread = !run.seen

  return (
    <article
      className={cn(
        'bg-card hover:bg-accent/40 focus-within:ring-ring/30 relative min-w-0 rounded-lg border p-3 transition-colors focus-within:ring-2',
        awaiting && 'border-brand/40',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <RunAgentMark agent={agent} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-muted-foreground min-w-0 truncate text-[11px]">{agent.name}</span>
            {unread && (
              <span className="bg-brand size-1.5 shrink-0 rounded-full">
                <span className="sr-only">Not opened yet</span>
              </span>
            )}
            <RunStatusBadge status={run.status} className="ml-auto" />
          </div>
          <button
            type="button"
            onClick={onOpen}
            aria-label={`${run.title}. ${agent.name}, ${runStatusLabel(run.status)}${unread ? ', not opened yet' : ''}`}
            className={cn(
              'min-w-0 truncate text-left text-[13px] outline-none after:absolute after:inset-0 after:rounded-lg',
              unread ? 'font-semibold' : 'font-medium',
            )}
          >
            {run.title}
          </button>
          <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px]">
            <RunTrigger trigger={run.trigger} />
            <span aria-hidden="true">·</span>
            <span className="min-w-0 truncate">{runTiming(run, now)}</span>
          </p>
        </div>
      </div>

      {running && (
        <div className="mt-2.5 grid min-w-0 gap-1.5">
          <Progress
            value={progress ?? 0}
            aria-label={`${run.title}: ${progress ?? 0}% done`}
            className="[&_[data-slot=progress-indicator]]:bg-brand motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
          />
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground min-w-0 flex-1 truncate text-[11px]">
              {run.status === 'queued' ? 'Waiting to start' : step?.label ?? 'Working…'}
            </span>
            {onCancel && (
              <Button variant="ghost" size="xs" onClick={onCancel} className="text-muted-foreground relative z-10">
                <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} data-icon="inline-start" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {awaiting && run.approval && (
        <div className="border-brand/30 bg-brand/5 relative z-10 mt-2.5 flex min-w-0 flex-wrap items-center gap-2 rounded-md border px-2.5 py-2">
          <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} aria-hidden="true" className="text-brand size-3.5 shrink-0" />
          <span className="min-w-0 flex-[1_1_10rem] text-xs">{run.approval.title}</span>
          {(onApprove || onDeny) && (
            <span className="ml-auto flex shrink-0 gap-1.5">
              {onDeny && <Button variant="ghost" size="sm" onClick={onDeny}>Deny</Button>}
              {onApprove && <Button size="sm" onClick={onApprove}>Allow once</Button>}
            </span>
          )}
        </div>
      )}

      {run.status === 'failed' && run.error && (
        <p className="text-destructive mt-2 flex min-w-0 items-start gap-1.5 text-xs">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0">{run.error}</span>
        </p>
      )}
    </article>
  )
}
