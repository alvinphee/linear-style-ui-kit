import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, Alert02Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowRight02Icon, CancelCircleIcon,
  CheckmarkCircle02Icon, Shield01Icon, Tick02Icon, Wrench01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AiMotion, Elapsed, PulseDot, StreamCaret } from '@/components/thinking-indicator'
import { formatDuration } from '@/lib/format'
import { plural } from '@/lib/text'

// The thinking trail: what an agent did on the way to its answer, in one
// quiet line. While it works the line shimmers ("Searching jobs…") with a
// timer; once done it folds to "Worked for 8s · 3 steps · 2 tools ›", and the
// reasoning, plan steps and tool calls (with their input and output) stay
// one click away. Claude and ChatGPT show their reasoning the same way.
//
// Also here: ApprovalCard, the agent asking before it changes anything.
//
// Wrap the page in an @container: the step counts and tool summaries show
// from @sm up, the approval card's waiting note from @md.

export type TrailStepStatus = 'pending' | 'running' | 'done' | 'error' | 'stopped'

export type TrailStep = {
  id: string
  // thinking: the reasoning, as text; plan: one step of the plan; tool: a tool call.
  kind: 'thinking' | 'plan' | 'tool'
  // thinking: the reasoning itself. plan: the step. tool: what it did, in
  // plain words ("Searched jobs"), not the tool's name.
  label: string
  // Shown instead of `label` while running ("Searching jobs").
  activeLabel?: string
  // tool: what it was called with, after the label (“urgent”, DO-24817).
  // plan: a second line under the step, such as why it failed.
  detail?: string
  // tool: its icon. Defaults to a wrench.
  icon?: IconSvgElement
  status: TrailStepStatus
  // How long it took, once done.
  ms?: number
  // While running, the step's own timer counts from here.
  startedAt?: number
  // tool: the raw tool name, input and output, shown when the call is opened.
  name?: string
  input?: unknown
  output?: unknown
  error?: string
  // tool: a short result shown beside the time ("12 jobs").
  summary?: string
}

const STEP_LABEL: Record<TrailStepStatus, string> = {
  pending: 'Pending', running: 'Running', done: 'Done', error: 'Failed', stopped: 'Stopped',
}

function StepMark({ status }: { status: TrailStepStatus }) {
  if (status === 'running') return <PulseDot className="mt-[7px]" />
  if (status === 'done') return <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-muted-foreground mt-[3px] size-3 shrink-0" />
  if (status === 'error') return <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="text-destructive mt-[3px] size-3 shrink-0" />
  return <span className="border-muted-foreground/50 mt-[5px] size-2 shrink-0 rounded-full border" />
}

function stepTime(step: TrailStep, clock?: () => number) {
  if (step.status === 'running' && step.startedAt) return <Elapsed since={step.startedAt} interval={200} clock={clock} />
  return step.status !== 'pending' && step.ms ? formatDuration(step.ms) : null
}

export function ThinkingTrail({ steps, live, activity, startedAt, duration, summary, meta, autoOpen = true, clock, className }: {
  steps: TrailStep[]
  // True while the agent is still adding to this trail.
  live: boolean
  // The live line ("Searching the web…"). Defaults to "Thinking…" or "Working…".
  activity?: string
  // While live, the header's timer counts from here…
  startedAt?: number
  // …or shows this, in ms. Once done, the "Worked for" time. Defaults to the
  // time spent thinking and in tools (plan steps run alongside those).
  duration?: number
  // Replaces the folded line ("Worked for 8s").
  summary?: string
  // Replaces the counts beside it ("3 steps · 2 tools").
  meta?: string
  // Unfold the details while live and fold them when done. With false they
  // stay folded until opened.
  autoOpen?: boolean
  // The clock the timers read; see useNow.
  clock?: () => number
  className?: string
}) {
  const [choice, setChoice] = useState<boolean | null>(null)
  const open = choice ?? (autoOpen && live)
  const thinking = steps.filter((s) => s.kind === 'thinking')
  const plan = steps.filter((s) => s.kind === 'plan')
  const tools = steps.filter((s) => s.kind === 'tool')
  const failed = steps.some((s) => s.status === 'error')
  const stopped = !failed && steps.some((s) => s.status === 'stopped')
  const total = duration ?? [...thinking, ...tools].reduce((n, s) => n + (s.ms ?? 0), 0)
  const onlyThinking = !plan.length && !tools.length

  const label = live
    ? activity || (thinking.some((s) => s.status === 'running') || !steps.length ? 'Thinking…' : 'Working…')
    : summary ?? (failed ? `Stopped on an error after ${formatDuration(total)}`
      : stopped ? `Stopped after ${formatDuration(total)}`
      : onlyThinking ? `Thought for ${formatDuration(total)}` : `Worked for ${formatDuration(total)}`)
  const counts = meta ?? [
    plan.length ? plural(plan.length, 'step') : '',
    tools.length ? plural(tools.length, 'tool') : '',
  ].filter(Boolean).join(' · ')
  const hasDetails = thinking.some((s) => !!s.label) || plan.length > 0 || tools.length > 0
  const timer = startedAt !== undefined
    ? <Elapsed since={startedAt} clock={clock} />
    : duration !== undefined ? <span className="tabular-nums">{formatDuration(duration)}</span> : null

  return (
    <Collapsible open={open && hasDetails} onOpenChange={setChoice} className={cn('min-w-0', className)}>
      <AiMotion />
      <CollapsibleTrigger
        disabled={!hasDetails}
        className="group/trail text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 -mx-1 inline-flex h-6 max-w-full items-center gap-1.5 rounded-md px-1 text-xs outline-none focus-visible:ring-2 disabled:pointer-events-none"
      >
        {live
          ? <PulseDot />
          : failed
            ? <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-3.5 shrink-0" />
            : <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="size-3.5 shrink-0" />}
        <span className={cn('min-w-0 truncate', live && 'ai-shimmer font-medium')}>{label}</span>
        {live
          ? timer && <span className="shrink-0 opacity-70">{timer}</span>
          : counts && <span className="hidden shrink-0 opacity-70 @sm:inline">· {counts}</span>}
        {hasDetails && (
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3 shrink-0 transition-transform group-data-[state=open]/trail:rotate-90" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
        <ol className="mt-1 ml-[6px] grid min-w-0 gap-0.5 border-l py-0.5 pl-3.5">
          {thinking.map((step) => step.label && (
            <li key={step.id} className="ai-in text-muted-foreground py-0.5 text-xs/relaxed whitespace-pre-wrap">
              {step.label}
              {step.status === 'running' && <StreamCaret />}
            </li>
          ))}
          {plan.map((step) => (
            <li key={step.id} className="ai-in flex min-h-6 min-w-0 items-start gap-2 py-0.5 text-xs">
              <StepMark status={step.status} />
              <span className={cn(
                'min-w-0 flex-1',
                step.status === 'running' && 'ai-shimmer font-medium',
                step.status === 'done' && 'text-muted-foreground',
                (step.status === 'pending' || step.status === 'stopped') && 'text-muted-foreground/70',
                step.status === 'error' && 'text-destructive',
              )}>
                <span className="sr-only">{STEP_LABEL[step.status]}: </span>
                {step.status === 'running' ? step.activeLabel ?? step.label : step.label}
                {step.detail && <span className="block text-[11px] opacity-80">{step.detail}</span>}
              </span>
              <span className="text-muted-foreground/80 shrink-0 text-[11px] tabular-nums">{stepTime(step, clock)}</span>
            </li>
          ))}
          {tools.map((step) => <TrailTool key={step.id} step={step} clock={clock} />)}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

function json(value: unknown, max = 40) {
  const text = JSON.stringify(value, null, 2) ?? String(value)
  const lines = text.split('\n')
  if (lines.length <= max) return text
  return `${lines.slice(0, max).join('\n')}\n… ${lines.length - max} more lines`
}

function JsonBlock({ label, value, max }: { label: string; value: unknown; max?: number }) {
  return (
    <div className="grid min-w-0 gap-1">
      <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">{label}</span>
      <pre className="bg-muted/60 max-h-48 overflow-auto rounded-md px-2.5 py-2 font-mono text-[11px] leading-4">{json(value, max)}</pre>
    </div>
  )
}

function ToolStatus({ step, clock }: { step: TrailStep; clock?: () => number }) {
  if (step.status === 'running') {
    return (
      <span className="text-muted-foreground/80 shrink-0 text-[11px]">
        {step.startedAt ? <Elapsed since={step.startedAt} interval={200} clock={clock} /> : null}
      </span>
    )
  }
  if (step.status === 'error') {
    return <span className="text-destructive shrink-0 text-[11px] tabular-nums">Failed · {formatDuration(step.ms ?? 0)}</span>
  }
  if (step.status === 'stopped') return <span className="text-muted-foreground/80 shrink-0 text-[11px]">Stopped</span>
  if (step.status === 'pending') return null
  return (
    <span className="text-muted-foreground/80 shrink-0 text-[11px] tabular-nums">
      <span className="hidden @sm:inline">{step.summary && `${step.summary} · `}</span>
      {formatDuration(step.ms ?? 0)}
    </span>
  )
}

function TrailTool({ step, clock }: { step: TrailStep; clock?: () => number }) {
  const [open, setOpen] = useState(false)
  const running = step.status === 'running'
  const label = running ? step.activeLabel ?? step.label : step.label
  const state = step.status === 'error' ? 'failed' : step.status
  const hasDetails = !!step.name || step.input !== undefined || step.output !== undefined || !!step.error
  return (
    <Collapsible open={open && hasDetails} onOpenChange={setOpen} className="ai-in min-w-0">
      <CollapsibleTrigger
        disabled={!hasDetails}
        aria-label={`${[label, step.detail].filter(Boolean).join(' ')}, ${state}${hasDetails ? `. Show input and output${step.name ? ` (${step.name})` : ''}` : ''}`}
        className="group/tool hover:text-foreground focus-visible:ring-ring/30 -mx-1 flex min-h-6 w-full min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left text-xs outline-none focus-visible:ring-2 disabled:pointer-events-none"
      >
        <HugeiconsIcon
          icon={step.icon ?? Wrench01Icon}
          strokeWidth={2}
          className={cn('size-3 shrink-0', step.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}
        />
        <span className={cn(
          'min-w-0 truncate',
          running ? 'ai-shimmer font-medium' : step.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {label}
          {step.detail && <span className="opacity-80"> {step.detail}</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <ToolStatus step={step} clock={clock} />
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-3 opacity-0 transition group-disabled/tool:hidden group-hover/tool:opacity-100 group-focus-visible/tool:opacity-100 group-data-[state=open]/tool:rotate-180 group-data-[state=open]/tool:opacity-100"
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
        <div className="bg-muted/40 my-1 grid min-w-0 gap-2 rounded-md p-2.5">
          {step.name && <p className="text-muted-foreground font-mono text-[10px]">{step.name}</p>}
          {step.input !== undefined && <JsonBlock label="Input" value={step.input} />}
          {step.error ? (
            <div className="grid gap-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">Error</span>
              <p className="text-destructive bg-destructive/5 rounded-md px-2.5 py-2 font-mono text-[11px]">{step.error}</p>
            </div>
          ) : step.output !== undefined ? (
            <JsonBlock label="Output" value={step.output} max={16} />
          ) : (
            <p className="text-muted-foreground text-[11px]">{running ? 'Waiting for the result…' : 'No output.'}</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* ---------- Approval: the agent asks before it changes anything ---------- */

export type ApprovalDecision = 'pending' | 'approved' | 'denied'

// One change the agent wants to make: a record, a field, from → to.
export type ApprovalChange = {
  // The record's number or id, shown first (DO-24817, INV-2026-0012).
  record: string
  // The record's name, after the number.
  title?: string
  field: string
  from?: string
  to: string
  // Shown before the values: a status icon, an avatar…
  fromIcon?: ReactNode
  toIcon?: ReactNode
}

function ChangeValue({ value, icon, before }: { value: string; icon?: ReactNode; before?: boolean }) {
  const text = <span className={cn('truncate', before ? 'text-muted-foreground' : 'font-medium')}>{value}</span>
  if (!icon) return text
  return <span className="inline-flex min-w-0 items-center gap-1">{icon}{text}</span>
}

export function ApprovalCard({
  title, description, changes = [], children, state, onApprove, onDeny, disabled, icon = Shield01Icon,
  waitingNote = 'The agent is waiting for you', approveLabel = 'Approve', denyLabel = 'Deny',
  approvedNote = 'Approved', deniedNote = 'Denied, nothing changed', className,
}: {
  title: string
  description?: ReactNode
  changes?: ApprovalChange[]
  // Anything else to show under the changes.
  children?: ReactNode
  state: ApprovalDecision
  onApprove: () => void
  onDeny: () => void
  disabled?: boolean
  icon?: IconSvgElement
  waitingNote?: string
  approveLabel?: string
  denyLabel?: string
  approvedNote?: string
  deniedNote?: string
  className?: string
}) {
  const pending = state === 'pending'
  return (
    <div role="group" aria-label="Approval request" className={cn('bg-card min-w-0 overflow-hidden rounded-lg border', pending && 'border-brand/40', className)}>
      <div className={cn('flex items-start gap-2.5 p-3', pending && 'bg-brand/5')}>
        <span className="bg-brand/10 text-brand grid size-7 shrink-0 place-items-center rounded-md">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{title}</p>
          {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
      </div>
      {changes.length > 0 && (
        <ul className="divide-y border-t">
          {changes.map((change, i) => (
            <li key={i} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
              {/* Needs 10rem before the change sits beside it; narrower, the change wraps below. */}
              <span className="min-w-0 flex-[1_1_10rem]">
                <span className="font-medium whitespace-nowrap tabular-nums">{change.record}</span>
                {change.title && <span className="text-muted-foreground"> · {change.title}</span>}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="text-muted-foreground">{change.field}</span>
                {change.from !== undefined && (
                  <>
                    <ChangeValue value={change.from} icon={change.fromIcon} before />
                    <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" aria-label="to" />
                  </>
                )}
                <ChangeValue value={change.to} icon={change.toIcon} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {children && <div className="border-t px-3 py-2 text-xs">{children}</div>}
      <div className="flex min-h-11 items-center justify-end gap-2 border-t px-3 py-2">
        {pending ? (
          <>
            <span className="text-muted-foreground mr-auto hidden text-[11px] @md:inline">{waitingNote}</span>
            <Button variant="ghost" disabled={disabled} onClick={onDeny}>{denyLabel}</Button>
            <Button disabled={disabled} onClick={onApprove}>
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
              {approveLabel}
            </Button>
          </>
        ) : state === 'approved' ? (
          <span className="text-status-done mr-auto flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" /> {approvedNote}
          </span>
        ) : (
          <span className="text-muted-foreground mr-auto flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-3.5" /> {deniedNote}
          </span>
        )}
      </div>
    </div>
  )
}
