import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, BubbleChatIcon, CancelCircleIcon, CheckmarkCircle02Icon, Loading03Icon, MinusSignCircleIcon,
  RefreshIcon, Shield01Icon, StopCircleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApprovalCard, type ApprovalDecision } from '@/blocks/ai/reasoning/thinking-trail'
import { Markdown } from '@/blocks/markdown'
import { formatAgo, formatDuration } from '@/lib/format'
import type { AgentRun, RunApproval, RunStep } from './agent-types'
import {
  currentStep, RunAgentMark, RunStatusBadge, RunTrigger, runStatusLabel, runTiming, type RunAgent,
} from './run-status'

// One run, start to finish: the agent and the run's title, its status and
// timing, then the steps as a timeline (each with its tool and how long it
// took). When it is waiting, the approval: what it wants to do, line by
// line, with Allow once, Always allow and Deny (human in the loop). Then the
// outcome: the result in Markdown, or the error with Retry. Cancel stops a
// run that is still going; Open in chat goes to the chat its result lives in.
// RunSheet shows it in a panel from the right.

export type ApprovalMode = 'once' | 'always'

const STEP_STATE: Record<RunStep['state'], string> = {
  pending: 'To do', running: 'Running', done: 'Done', failed: 'Failed', skipped: 'Skipped',
}

function StepIcon({ step, waiting }: { step: RunStep; waiting: boolean }) {
  const box = 'bg-card relative z-10 grid size-4 shrink-0 place-items-center'
  if (waiting) return <span className={box}><HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="text-brand size-3.5" /></span>
  switch (step.state) {
    case 'running':
      return <span className={box}><HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="text-status-progress size-3.5 animate-spin motion-reduce:animate-none" /></span>
    case 'done':
      return <span className={box}><HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-3.5" /></span>
    case 'failed':
      return <span className={box}><HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="text-destructive size-3.5" /></span>
    case 'skipped':
      return <span className={box}><HugeiconsIcon icon={MinusSignCircleIcon} strokeWidth={2} className="text-muted-foreground size-3.5" /></span>
    default:
      return <span className={box}><span className="border-muted-foreground/50 size-2.5 rounded-full border" /></span>
  }
}

function stepTime(step: RunStep, now: number) {
  if (!step.startedAt || step.state === 'skipped') return null
  if (step.state === 'running') return formatDuration(Math.max(0, now - step.startedAt))
  if (step.finishedAt) return formatDuration(step.finishedAt - step.startedAt)
  return null
}

function RunTimeline({ run, now }: { run: AgentRun; now: number }) {
  const waitingOn = run.status === 'awaiting' ? currentStep(run)?.id : undefined
  return (
    <ol className="relative grid min-w-0">
      {run.steps.map((step, i) => {
        const waiting = step.id === waitingOn
        const last = i === run.steps.length - 1
        return (
          <li key={step.id} className="relative flex min-w-0 gap-2.5 pb-3 last:pb-0">
            {!last && <span aria-hidden="true" className="bg-border absolute top-4 bottom-0 left-[7.5px] w-px" />}
            <span className="mt-0.5"><StepIcon step={step} waiting={waiting} /></span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className={cn(
                  'min-w-0 flex-1 text-xs',
                  step.state === 'running' && 'font-medium',
                  (step.state === 'pending' && !waiting) && 'text-muted-foreground',
                  step.state === 'skipped' && 'text-muted-foreground line-through decoration-muted-foreground/50',
                  step.state === 'failed' && 'text-destructive',
                )}>
                  <span className="sr-only">{waiting ? 'Waiting for approval' : STEP_STATE[step.state]}: </span>
                  {step.label}
                </span>
                <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{stepTime(step, now)}</span>
              </div>
              {(step.tool || step.detail || waiting) && (
                <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                  {step.tool && <code className="bg-muted rounded px-1 py-px font-mono text-[10.5px] break-all">{step.tool}</code>}
                  {waiting ? <span className="text-brand">Waiting for your approval</span> : step.detail && <span className="min-w-0">{step.detail}</span>}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const DECISION: Record<RunApproval['state'], ApprovalDecision> = { pending: 'pending', allowed: 'approved', denied: 'denied' }

function RunApprovalCard({ approval, active, onApprove, onDeny }: {
  approval: RunApproval
  // Whether the run is waiting on it now; a decided or stale approval is read only.
  active: boolean
  onApprove: (mode: ApprovalMode) => void
  onDeny: () => void
}) {
  // The run keeps only allowed or denied; remember here that it was Always allow.
  const [always, setAlways] = useState(false)
  const state = DECISION[approval.state]
  return (
    <ApprovalCard
      title={approval.title}
      description={approval.summary}
      state={state === 'pending' && !active ? 'pending' : state}
      disabled={state === 'pending' && !active}
      always={always}
      onApprove={() => { setAlways(false); onApprove('once') }}
      onAlwaysAllow={() => { setAlways(true); onApprove('always') }}
      onDeny={onDeny}
      deniedNote="Denied. That step was skipped."
    >
      <div className="grid min-w-0 gap-1.5">
        <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">It will</span>
        <ul className="grid min-w-0 list-disc gap-0.5 pl-4">
          {approval.actions.map((action, i) => <li key={i} className="min-w-0 break-words">{action}</li>)}
        </ul>
        {approval.tool && (
          <p className="text-muted-foreground text-[11px]">
            Using <code className="bg-muted rounded px-1 py-px font-mono text-[10.5px]">{approval.tool}</code>
            {approval.connectorId && <> from {approval.connectorId}</>}
          </p>
        )}
      </div>
    </ApprovalCard>
  )
}

export type RunDetailProps = {
  run: AgentRun
  agent: RunAgent
  onApprove: (mode: ApprovalMode) => void
  onDeny: () => void
  onCancel: () => void
  onRetry: () => void
  // Shown when the run has a chat.
  onOpenChat?: (chatId: string) => void
  // Timers and "Started 4 min ago" count from this; pass a ticking value.
  now?: number
  className?: string
}

export function RunDetail({ run, agent, onApprove, onDeny, onCancel, onRetry, onOpenChat, now = Date.now(), className }: RunDetailProps) {
  const active = run.status === 'queued' || run.status === 'running' || run.status === 'awaiting'
  const step = currentStep(run)
  const doneSteps = run.steps.filter((s) => s.state === 'done').length
  return (
    <div className={cn('grid min-w-0 gap-4', className)}>
      <header className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <RunAgentMark agent={agent} size="sm" />
          <span className="text-muted-foreground min-w-0 truncate text-xs">{agent.name}</span>
          <RunStatusBadge status={run.status} className="ml-auto" />
        </div>
        <p className="text-sm font-semibold tracking-tight break-words">{run.title}</p>
        <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
          <RunTrigger trigger={run.trigger} />
          <span aria-hidden="true">·</span>
          <span>{runTiming(run, now)}</span>
          {run.finishedAt !== undefined && !active && (
            <>
              <span aria-hidden="true">·</span>
              <span>Finished {formatAgo(run.finishedAt, now)}</span>
            </>
          )}
        </p>
        {(active || run.status === 'failed' || run.status === 'cancelled' || (run.chatId && onOpenChat)) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {active && (
              <Button variant="outline" onClick={onCancel}>
                <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} data-icon="inline-start" />
                Cancel run
              </Button>
            )}
            {(run.status === 'failed' || run.status === 'cancelled') && (
              <Button variant="outline" onClick={onRetry}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                {run.status === 'failed' ? 'Retry' : 'Run again'}
              </Button>
            )}
            {run.chatId && onOpenChat && (
              <Button variant="ghost" onClick={() => onOpenChat(run.chatId!)}>
                <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} data-icon="inline-start" />
                Open in chat
              </Button>
            )}
          </div>
        )}
      </header>

      {run.status === 'running' && (
        <div className="grid min-w-0 gap-1.5">
          <Progress
            value={run.progress ?? 0}
            aria-label={`${run.progress ?? 0}% done`}
            className="[&_[data-slot=progress-indicator]]:bg-brand motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
          />
          <p className="text-muted-foreground flex min-w-0 justify-between gap-2 text-[11px]">
            <span className="min-w-0 truncate">{step?.label ?? 'Working…'}</span>
            <span className="shrink-0 tabular-nums">{doneSteps} of {run.steps.length} steps</span>
          </p>
        </div>
      )}

      {run.approval && (
        <RunApprovalCard
          key={run.id}
          approval={run.approval}
          active={run.status === 'awaiting'}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      )}

      {run.status === 'failed' && (
        <div role="alert" className="border-destructive/30 bg-destructive/5 flex min-w-0 flex-wrap items-start gap-2 rounded-lg border p-3">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} aria-hidden="true" className="text-destructive mt-0.5 size-4 shrink-0" />
          <div className="grid min-w-0 flex-[1_1_12rem] gap-0.5">
            <p className="text-[13px] font-medium">The run failed</p>
            <p className="text-muted-foreground text-xs break-words">{run.error ?? 'Something went wrong.'}</p>
          </div>
          <Button size="sm" onClick={onRetry} className="ml-auto">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
            Retry
          </Button>
        </div>
      )}

      {run.status === 'cancelled' && (
        <p className="text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 text-xs">
          Cancelled. The steps left were not done{run.finishedAt ? `, ${formatAgo(run.finishedAt, now)}` : ''}.
        </p>
      )}

      <section aria-label="Steps" className="grid min-w-0 gap-2">
        <h4 className="text-muted-foreground text-[11px] font-medium">Steps</h4>
        {run.steps.length ? <RunTimeline run={run} now={now} /> : <p className="text-muted-foreground text-xs">No steps yet.</p>}
      </section>

      {run.status === 'succeeded' && run.result && (
        <section aria-label="Result" className="grid min-w-0 gap-2">
          <h4 className="text-muted-foreground text-[11px] font-medium">Result</h4>
          <div className="bg-muted/30 min-w-0 overflow-x-auto rounded-lg border px-3.5 py-3">
            <Markdown text={run.result} />
          </div>
        </section>
      )}
    </div>
  )
}

// RunDetail in a panel from the right. Closed while `run` or `agent` is missing.
export function RunSheet({ run, agent, open, onOpenChange, ...detail }: Omit<RunDetailProps, 'run' | 'agent' | 'className'> & {
  run: AgentRun | null
  agent?: RunAgent
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const shown = run && agent ? { run, agent } : null
  return (
    <Sheet open={open && !!shown} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>{shown?.run.title ?? 'Run'}</SheetTitle>
          <SheetDescription>
            {shown ? `${shown.agent.name} run, ${runStatusLabel(shown.run.status).toLowerCase()}` : 'An agent run'}
          </SheetDescription>
        </SheetHeader>
        {shown && <RunDetail run={shown.run} agent={shown.agent} {...detail} className="p-4 pt-12 sm:p-5 sm:pt-12" />}
      </SheetContent>
    </Sheet>
  )
}
