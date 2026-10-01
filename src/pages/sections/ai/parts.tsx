import { useEffect, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, Alert02Icon, ArrowDown01Icon, ArrowRight01Icon, ArrowRight02Icon, Attachment01Icon, BookOpen01Icon,
  CancelCircleIcon, CheckmarkCircle02Icon, DatabaseIcon, FileTextIcon,
  FileViewIcon, Globe02Icon, PencilEdit02Icon, RefreshIcon, Search01Icon, Shield01Icon, SourceCodeIcon,
  StopCircleIcon, Table01Icon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Spinner } from '@/components/ui/spinner'
import { PRIORITY, STATUS, type Priority, type Status } from '../../data'
import { UserAvatar } from '@/components/person'
import { PriorityIcon, StatusIcon } from '../StatusSection'
import { formatDuration, now } from './data'
import { Caret } from './markdown'
import type { ArtifactKind, Change, PartOf, Source, StepState, ToolName } from './types'

// Keyframes for the shimmer, the typing dots and the voice waveform. React
// hoists this into <head> once, however many workspaces are on the page.
export function AiStyles() {
  return (
    <style href="ai-workspace-motion" precedence="default">{`
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

export function useNow(active: boolean, interval = 1000) {
  const [time, setTime] = useState(now)
  useEffect(() => {
    if (!active) return
    setTime(now())
    const timer = window.setInterval(() => setTime(now()), interval)
    return () => window.clearInterval(timer)
  }, [active, interval])
  return time
}

export function Elapsed({ since, interval = 1000 }: { since: number; interval?: number }) {
  const time = useNow(true, interval)
  return <span className="tabular-nums">{formatDuration(Math.max(0, time - since))}</span>
}

export function TypingDots() {
  return (
    <span className="inline-flex h-5 items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="ai-dot bg-muted-foreground size-1.5 rounded-full" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </span>
  )
}

export function ActivityLine({ text, since }: { text: string; since: number }) {
  return (
    <div className="flex h-6 min-w-0 items-center gap-2 text-xs" aria-hidden="true">
      <Spinner className="text-muted-foreground size-3.5" />
      <span className="ai-shimmer min-w-0 truncate font-medium">{text}</span>
      <span className="text-muted-foreground shrink-0"><Elapsed since={since} /></span>
    </div>
  )
}

/* ---------- The process trail: thinking, plan steps and tool calls in one quiet line ---------- */

export type ProcessPart = PartOf<'thinking'> | PartOf<'plan'> | PartOf<'tool'>

const STEP_LABEL: Record<StepState, string> = { pending: 'Pending', running: 'Running', done: 'Done', failed: 'Failed' }

function StepMark({ state }: { state: StepState }) {
  if (state === 'running') return <span className="ai-pulse bg-brand mt-[7px] size-1.5 shrink-0 rounded-full" />
  if (state === 'done') return <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-muted-foreground mt-[3px] size-3 shrink-0" />
  if (state === 'failed') return <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="text-destructive mt-[3px] size-3 shrink-0" />
  return <span className="border-muted-foreground/50 mt-[5px] size-2 shrink-0 rounded-full border" />
}

function stepTime(step: { state: StepState; ms?: number; startedAt?: number }) {
  if (step.state === 'running' && step.startedAt) return <Elapsed since={step.startedAt} interval={200} />
  return step.state !== 'pending' && step.ms ? formatDuration(step.ms) : null
}

// Claude- and ChatGPT-like: one shimmering line while the agent works, folded
// to "Worked for 8s · 3 tools ›" when it's done. The details stay one click away.
export function ProcessTrail({ parts, live, activity, since }: {
  parts: ProcessPart[]
  // True while this is the part of the reply the agent is working on now.
  live: boolean
  activity?: string
  since: number
}) {
  const [choice, setChoice] = useState<boolean | null>(null)
  const open = choice ?? live
  const thinking = parts.find((p): p is PartOf<'thinking'> => p.type === 'thinking')
  const steps = parts.find((p): p is PartOf<'plan'> => p.type === 'plan')?.steps ?? []
  const tools = parts.filter((p): p is PartOf<'tool'> => p.type === 'tool')
  const failed = tools.some((t) => t.state === 'error') || steps.some((s) => s.state === 'failed')
  const total = (thinking?.ms ?? 0) + tools.reduce((n, t) => n + t.ms, 0)
  const onlyThinking = !steps.length && !tools.length

  const label = live
    ? activity || (thinking?.state === 'running' || !parts.length ? 'Thinking…' : 'Working…')
    : failed ? `Stopped on an error after ${formatDuration(total)}`
    : onlyThinking ? `Thought for ${formatDuration(total)}` : `Worked for ${formatDuration(total)}`
  const meta = [
    steps.length ? `${steps.length} steps` : '',
    tools.length ? `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'}` : '',
  ].filter(Boolean).join(' · ')
  const hasDetails = !!thinking?.text || steps.length > 0 || tools.length > 0

  return (
    <Collapsible open={open && hasDetails} onOpenChange={setChoice} className="min-w-0">
      <CollapsibleTrigger
        disabled={!hasDetails}
        className="group/trail text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 -mx-1 inline-flex h-6 max-w-full items-center gap-1.5 rounded-md px-1 text-xs outline-none focus-visible:ring-2 disabled:pointer-events-none"
      >
        {live
          ? <span className="ai-pulse bg-brand size-1.5 shrink-0 rounded-full" />
          : failed
            ? <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-3.5 shrink-0" />
            : <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="size-3.5 shrink-0" />}
        <span className={cn('min-w-0 truncate', live && 'ai-shimmer font-medium')}>{label}</span>
        {live
          ? <span className="shrink-0 opacity-70"><Elapsed since={since} /></span>
          : meta && <span className="hidden shrink-0 opacity-70 @sm:inline">· {meta}</span>}
        {hasDetails && (
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3 shrink-0 transition-transform group-data-[state=open]/trail:rotate-90" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
        <ol className="mt-1 ml-[6px] grid min-w-0 gap-0.5 border-l py-0.5 pl-3.5">
          {thinking?.text && (
            <li className="ai-in text-muted-foreground py-0.5 text-xs/relaxed whitespace-pre-wrap">
              {thinking.text}
              {thinking.state === 'running' && <Caret />}
            </li>
          )}
          {steps.map((step, i) => (
            <li key={i} className="ai-in flex min-h-6 min-w-0 items-start gap-2 py-0.5 text-xs">
              <StepMark state={step.state} />
              <span className={cn(
                'min-w-0 flex-1',
                step.state === 'running' && 'ai-shimmer font-medium',
                step.state === 'done' && 'text-muted-foreground',
                step.state === 'pending' && 'text-muted-foreground/70',
                step.state === 'failed' && 'text-destructive',
              )}>
                <span className="sr-only">{STEP_LABEL[step.state]}: </span>
                {step.label}
              </span>
              <span className="text-muted-foreground/80 shrink-0 text-[11px] tabular-nums">{stepTime(step)}</span>
            </li>
          ))}
          {tools.map((tool) => <TrailTool key={tool.id} part={tool} />)}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

export const TOOL_ICONS: Record<ToolName, IconSvgElement> = {
  search_jobs: Search01Icon,
  read_job: FileViewIcon,
  web_search: Globe02Icon,
  run_query: DatabaseIcon,
  update_jobs: PencilEdit02Icon,
  read_file: Attachment01Icon,
  search_knowledge: BookOpen01Icon,
}

function inputHint(input: unknown) {
  if (typeof input !== 'object' || input === null) return ''
  const value = input as Record<string, unknown>
  if (typeof value.id === 'string') return value.id
  if (Array.isArray(value.id)) return value.id.join(', ')
  if (typeof value.query === 'string') return `“${value.query}”`
  if (typeof value.sql === 'string') return value.sql.split('\n')[0]
  if (typeof value.name === 'string') return value.name
  if (Array.isArray(value.updates)) {
    const ids = value.updates.flatMap((u) => (u as { ids?: string[] }).ids ?? [])
    return ids.join(', ')
  }
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v === null ? 'none' : String(v)}`)
    .join(' · ')
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

function ToolStatus({ part }: { part: PartOf<'tool'> }) {
  if (part.state === 'running') {
    return (
      <span className="text-muted-foreground/80 shrink-0 text-[11px]">
        {part.startedAt ? <Elapsed since={part.startedAt} interval={200} /> : null}
      </span>
    )
  }
  if (part.state === 'error') {
    return <span className="text-destructive shrink-0 text-[11px] tabular-nums">Failed · {formatDuration(part.ms)}</span>
  }
  if (part.state === 'stopped') return <span className="text-muted-foreground/80 shrink-0 text-[11px]">Stopped</span>
  return (
    <span className="text-muted-foreground/80 shrink-0 text-[11px] tabular-nums">
      <span className="hidden @sm:inline">{part.summary && `${part.summary} · `}</span>
      {formatDuration(part.ms)}
    </span>
  )
}

// Plain-words names, so a tool reads as "Searched jobs", not "search_jobs".
const TOOL_VERBS: Record<ToolName, [running: string, done: string]> = {
  search_jobs: ['Searching jobs', 'Searched jobs'],
  read_job: ['Reading', 'Read'],
  web_search: ['Searching the web', 'Searched the web'],
  run_query: ['Running a query', 'Ran a query'],
  update_jobs: ['Updating', 'Updated'],
  read_file: ['Reading a file', 'Read a file'],
  search_knowledge: ['Searching the knowledge files', 'Searched the knowledge files'],
}

function TrailTool({ part }: { part: PartOf<'tool'> }) {
  const [open, setOpen] = useState(false)
  const running = part.state === 'running'
  const [runningVerb, doneVerb] = TOOL_VERBS[part.name]
  const hint = inputHint(part.input)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="ai-in min-w-0">
      <CollapsibleTrigger
        aria-label={`${running ? runningVerb : doneVerb} ${hint}, ${part.state === 'error' ? 'failed' : part.state}. Show input and output (${part.name})`}
        className="group/tool hover:text-foreground focus-visible:ring-ring/30 -mx-1 flex min-h-6 w-full min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left text-xs outline-none focus-visible:ring-2"
      >
        <HugeiconsIcon
          icon={TOOL_ICONS[part.name]}
          strokeWidth={2}
          className={cn('size-3 shrink-0', part.state === 'error' ? 'text-destructive' : 'text-muted-foreground')}
        />
        <span className={cn(
          'min-w-0 truncate',
          running ? 'ai-shimmer font-medium' : part.state === 'error' ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {running ? runningVerb : doneVerb}
          {hint && <span className="opacity-80"> {hint}</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <ToolStatus part={part} />
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-3 opacity-0 transition group-hover/tool:opacity-100 group-focus-visible/tool:opacity-100 group-data-[state=open]/tool:rotate-180 group-data-[state=open]/tool:opacity-100"
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
        <div className="bg-muted/40 my-1 grid min-w-0 gap-2 rounded-md p-2.5">
          <p className="text-muted-foreground font-mono text-[10px]">{part.name}</p>
          <JsonBlock label="Input" value={part.input} />
          {part.error ? (
            <div className="grid gap-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">Error</span>
              <p className="text-destructive bg-destructive/5 rounded-md px-2.5 py-2 font-mono text-[11px]">{part.error}</p>
            </div>
          ) : part.output !== undefined ? (
            <JsonBlock label="Output" value={part.output} max={16} />
          ) : (
            <p className="text-muted-foreground text-[11px]">{part.state === 'running' ? 'Waiting for the result…' : 'No output.'}</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const STATUS_BY_LABEL = Object.fromEntries((Object.keys(STATUS) as Status[]).map((s) => [STATUS[s].label, s]))
const PRIORITY_BY_LABEL = Object.fromEntries((Object.keys(PRIORITY) as Priority[]).map((p) => [PRIORITY[p].label, p]))

function ChangeValue({ field, value, before }: { field: Change['field']; value: string; before?: boolean }) {
  const text = <span className={cn('truncate', before ? 'text-muted-foreground' : 'font-medium')}>{value}</span>
  if (field === 'Status' && STATUS_BY_LABEL[value]) {
    return <span className="inline-flex min-w-0 items-center gap-1"><StatusIcon status={STATUS_BY_LABEL[value]} />{text}</span>
  }
  if (field === 'Priority' && PRIORITY_BY_LABEL[value]) {
    return <span className="inline-flex min-w-0 items-center gap-1"><PriorityIcon priority={PRIORITY_BY_LABEL[value]} />{text}</span>
  }
  if (field === 'Assignee' && value !== 'Unassigned') {
    return <span className="inline-flex min-w-0 items-center gap-1"><UserAvatar name={value} className="size-4" />{text}</span>
  }
  return text
}

export function ApprovalCard({ part, onDecide, disabled }: {
  part: PartOf<'approval'>
  onDecide: (decision: 'approved' | 'denied') => void
  disabled?: boolean
}) {
  const pending = part.state === 'pending'
  return (
    <div role="group" aria-label="Approval request" className={cn('min-w-0 overflow-hidden rounded-lg border', pending && 'border-brand/40')}>
      <div className={cn('flex items-start gap-2.5 p-3', pending && 'bg-brand/5')}>
        <span className="bg-brand/10 text-brand grid size-7 shrink-0 place-items-center rounded-md">
          <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{part.request.title}</p>
          <p className="text-muted-foreground text-xs">{part.request.summary}</p>
        </div>
      </div>
      <ul className="divide-y border-t">
        {part.request.changes.map((change, i) => (
          <li key={i} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs">
            <span className="min-w-0 flex-1">
              <span className="font-medium tabular-nums">{change.jobId}</span>
              <span className="text-muted-foreground"> · {change.title}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground">{change.field}</span>
              <ChangeValue field={change.field} value={change.from} before />
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" aria-label="to" />
              <ChangeValue field={change.field} value={change.to} />
            </span>
          </li>
        ))}
      </ul>
      <div className="flex min-h-11 items-center justify-end gap-2 border-t px-3 py-2">
        {pending ? (
          <>
            <span className="text-muted-foreground mr-auto hidden text-[11px] @md:inline">The agent is waiting for you</span>
            <Button variant="ghost" disabled={disabled} onClick={() => onDecide('denied')}>Deny</Button>
            <Button disabled={disabled} onClick={() => onDecide('approved')}>
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
              Approve
            </Button>
          </>
        ) : part.state === 'approved' ? (
          <span className="text-status-done mr-auto flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3.5" /> Approved
          </span>
        ) : (
          <span className="text-muted-foreground mr-auto flex items-center gap-1.5 text-xs font-medium">
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-3.5" /> Denied, nothing changed
          </span>
        )}
      </div>
    </div>
  )
}

export function SourcesRow({ sources }: { sources: Source[] }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
        <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-3" />
        {sources.length} sources
      </span>
      <ol className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1">
        {sources.map((source, i) => (
          <li key={source.url} className="w-52 shrink-0">
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:bg-accent/60 focus-visible:ring-ring/30 flex h-full min-w-0 flex-col gap-1.5 rounded-lg border p-2.5 outline-none focus-visible:ring-2"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
                <span aria-hidden="true" className="bg-muted text-muted-foreground grid size-4 shrink-0 place-items-center rounded-[4px] text-[9px] font-semibold uppercase">
                  {source.domain[0]}
                </span>
                <span className="text-muted-foreground min-w-0 truncate">{source.domain}</span>
                <span className="text-muted-foreground ml-auto tabular-nums">{i + 1}</span>
              </span>
              <span className="line-clamp-2 text-xs font-medium">{source.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

export const KIND_ICONS: Record<ArtifactKind, IconSvgElement> = {
  document: FileTextIcon,
  table: Table01Icon,
  code: SourceCodeIcon,
}

export const KIND_LABELS: Record<ArtifactKind, string> = { document: 'Document', table: 'Table', code: 'Code' }

export function ArtifactCard({ part, active, onOpen }: { part: PartOf<'artifact'>; active: boolean; onOpen: () => void }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3 rounded-lg border p-2.5', active && 'border-brand/40 bg-brand/5')}>
      <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-md">
        <HugeiconsIcon icon={KIND_ICONS[part.kind]} strokeWidth={2} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{part.title}</p>
        <p className="text-muted-foreground text-[11px]">{KIND_LABELS[part.kind]} · v{part.version}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onOpen} aria-label={`Open ${part.title}, version ${part.version}`}>
        {active ? 'Showing' : 'Open'}
      </Button>
    </div>
  )
}

export function ErrorCard({ part, onRetry }: { part: PartOf<'error'>; onRetry?: () => void }) {
  return (
    <div role="alert" className="border-destructive/30 bg-destructive/5 flex min-w-0 flex-wrap items-start gap-2.5 rounded-lg border p-3">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive mt-0.5 size-4 shrink-0" />
      <div className="grid min-w-0 flex-1 gap-0.5 text-xs">
        <p className="font-medium">{part.message}</p>
        {part.detail && <p className="text-muted-foreground">{part.detail}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
          Retry
        </Button>
      )}
    </div>
  )
}

export function StoppedNote() {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <HugeiconsIcon icon={StopCircleIcon} strokeWidth={2} className="size-3.5" /> Stopped
    </p>
  )
}
