import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleIcon, Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon, Copy01Icon, InformationCircleIcon,
  LogsIcon, PauseCircleIcon, RefreshIcon, StopCircleIcon, StopIcon, Tick02Icon, UserIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { ThinkingTrail, type TrailStep, type TrailStepStatus } from '@/blocks/ai/thinking-trail'
import { ShimmerText, formatDuration } from '@/components/thinking-indicator'
import { Panel } from '../shared'
import { AiLabel, IconAction, copyText } from './shared'

type RunStatus = 'queued' | 'running' | 'approval' | 'done' | 'failed' | 'stopped'
type LogKind = 'info' | 'step' | 'success' | 'approval' | 'error' | 'user'
type LogEntry = { at: number; kind: LogKind; text: string }

type Run = {
  id: string
  title: string
  status: RunStatus
  elapsed: number
  progress: number
  total: number
  pace: number
  untilNext: number
  steps: string[]
  approvalAt?: number
  approvalText?: string
  approved: boolean
  // The first attempt fails when progress reaches this step.
  failAt?: number
  error?: string
  attempt: number
  queuedAt: number
  result: string
  log: LogEntry[]
}

type Action =
  | { type: 'tick'; dt: number; at: number }
  | { type: 'stop' | 'approve' | 'reject' | 'retry'; id: string; at: number }

const INBOX = [
  'Bay 4 closes at 5 pm', 'Pallet count for DO-24817', 'Proof photo is blurry', 'Can we move pickup to 3 pm?',
  'Invoice for September', 'Crates still at Tuas', 'New site contact', 'Forklift booking', 'Customs form missing',
  'Driver ETA?', 'Re: temperature log', 'Thanks for the quick turnaround',
]
const LAST_WEEK = ['DO-24798', 'DO-24797', 'DO-24795', 'DO-24794', 'DO-24792', 'DO-24791', 'DO-24790', 'DO-24788', 'DO-24786']

function initialRuns(now: number): Run[] {
  const ago = (s: number) => now - s * 1000
  return [
    {
      id: 'replies', title: 'Draft replies to 12 inbox items', status: 'running', elapsed: 38, progress: 4, total: 12,
      pace: 2.2, untilNext: 1, approved: false, attempt: 1, queuedAt: ago(40),
      steps: INBOX.map((s) => `Drafting a reply to “${s}”`),
      result: '12 drafts saved to Drafts. Nothing was sent.',
      log: [
        { at: ago(38), kind: 'info', text: 'Started. Found 12 unread items in the shared inbox.' },
        { at: ago(36), kind: 'info', text: 'Read 30 days of past replies to match the team’s tone.' },
        ...INBOX.slice(0, 4).map((s, i) => ({ at: ago(30 - i * 8), kind: 'step' as const, text: `Drafted a reply to “${s}”` })),
      ],
    },
    {
      id: 'tags', title: 'Tag last week’s jobs', status: 'queued', elapsed: 0, progress: 0, total: 10, pace: 1.5,
      untilNext: 1.5, approvalAt: 9, approvalText: 'Add 14 labels to 9 jobs?', approved: false, attempt: 1, queuedAt: ago(20),
      steps: [...LAST_WEEK.map((id) => `Reading ${id} and choosing labels`), 'Applying 14 labels'],
      result: 'Added 14 labels to 9 jobs.',
      log: [{ at: ago(20), kind: 'info', text: 'Queued. Waits for the inbox run to finish.' }],
    },
    {
      id: 'photos', title: 'Chase 3 missing delivery photos', status: 'approval', elapsed: 21, progress: 2, total: 4, pace: 1.4,
      untilNext: 1.4, approvalAt: 2, approvalText: 'Send photo reminders to Ravi, Daniel and Siti?', approved: false,
      attempt: 1, queuedAt: ago(90),
      steps: ['Finding done jobs without a delivery photo', 'Drafting reminders to the drivers', 'Sending 3 reminders', 'Noting the reminder on each job'],
      result: '3 reminders sent and noted on each job. Demo only: nothing left the page.',
      log: [
        { at: ago(90), kind: 'info', text: 'Started by Mei Ling.' },
        { at: ago(80), kind: 'step', text: 'Found 3 done jobs without a delivery photo' },
        { at: ago(69), kind: 'step', text: 'Drafted 3 reminders' },
        { at: ago(69), kind: 'approval', text: 'Waiting for approval before sending anything.' },
      ],
    },
    {
      id: 'report', title: 'Export September delivery report', status: 'failed', elapsed: 47, progress: 3, total: 5, pace: 1.3,
      untilNext: 1.3, failAt: 3, approved: false, attempt: 1, queuedAt: ago(300),
      error: 'Upload timed out after 30 s. The file store did not answer.',
      steps: ['Collecting 214 September jobs', 'Adding proof photos', 'Building charts', 'Uploading delivery-report-sep.pdf', 'Sharing the link with Operations'],
      result: 'delivery-report-sep.pdf is ready and shared with Operations.',
      log: [
        { at: ago(300), kind: 'info', text: 'Started on a schedule (1st of the month).' },
        { at: ago(288), kind: 'step', text: 'Collected 214 September jobs' },
        { at: ago(271), kind: 'step', text: 'Added 1,106 proof photos' },
        { at: ago(262), kind: 'step', text: 'Built 4 charts' },
        { at: ago(232), kind: 'error', text: 'Upload timed out after 30 s. The file store did not answer.' },
      ],
    },
  ]
}

function reducer(runs: Run[], action: Action): Run[] {
  const log = (run: Run, kind: LogKind, text: string): Run => ({ ...run, log: [...run.log, { at: action.at, kind, text }] })

  if (action.type === 'tick') {
    let next = runs.map((run) => {
      if (run.status !== 'running') return run
      let r: Run = { ...run, elapsed: run.elapsed + action.dt, untilNext: run.untilNext - action.dt }
      if (r.untilNext > 0) return r
      r = log({ ...r, progress: r.progress + 1, untilNext: r.pace }, 'step', r.steps[r.progress])
      if (r.failAt !== undefined && r.attempt === 1 && r.progress === r.failAt) {
        return log({ ...r, status: 'failed', error: 'Upload timed out after 30 s. The file store did not answer.' }, 'error', 'Upload timed out after 30 s.')
      }
      if (r.approvalAt !== undefined && !r.approved && r.progress === r.approvalAt) {
        return log({ ...r, status: 'approval' }, 'approval', `Waiting for approval: ${r.approvalText}`)
      }
      if (r.progress >= r.total) return log({ ...r, status: 'done' }, 'success', r.result)
      return r
    })
    // One run at a time. Approved runs were already under way, so they go first.
    if (!next.some((r) => r.status === 'running')) {
      const first = next
        .filter((r) => r.status === 'queued')
        .sort((a, b) => Number(b.approved) - Number(a.approved) || a.queuedAt - b.queuedAt)[0]
      if (first) {
        next = next.map((r) => (r.id === first.id ? log({ ...r, status: 'running' }, 'info', r.progress ? 'Resumed' : 'Started') : r))
      }
    }
    return next
  }

  return runs.map((run) => {
    if (run.id !== action.id) return run
    switch (action.type) {
      case 'stop':
        return run.status === 'queued'
          ? log({ ...run, status: 'stopped' }, 'user', 'Removed from the queue by you.')
          : log({ ...run, status: 'stopped' }, 'user', `Stopped by you after ${run.progress} of ${run.total} steps.`)
      case 'approve':
        return log({ ...run, approved: true, status: 'queued', queuedAt: action.at }, 'user', 'Approved by you.')
      case 'reject':
        return log({ ...run, status: 'stopped' }, 'user', 'Rejected by you. Nothing was changed.')
      case 'retry':
        return log(
          { ...run, status: 'queued', progress: 0, elapsed: 0, untilNext: run.pace, approved: false, error: undefined, attempt: run.attempt + 1, queuedAt: action.at },
          'user',
          `Retry requested by you (attempt ${run.attempt + 1}).`,
        )
    }
  })
}

const STATUS_META: Record<RunStatus, { label: string; icon?: IconSvgElement; className: string }> = {
  queued: { label: 'Queued', icon: Clock01Icon, className: 'text-muted-foreground' },
  running: { label: 'Running', className: 'text-brand' },
  approval: { label: 'Needs approval', icon: PauseCircleIcon, className: 'text-status-progress' },
  done: { label: 'Done', icon: CheckmarkCircle02Icon, className: 'text-status-done' },
  failed: { label: 'Failed', icon: AlertCircleIcon, className: 'text-destructive' },
  stopped: { label: 'Stopped', icon: StopCircleIcon, className: 'text-muted-foreground' },
}

const LOG_ICONS: Record<LogKind, { icon: IconSvgElement; className: string }> = {
  info: { icon: InformationCircleIcon, className: 'text-muted-foreground' },
  step: { icon: Tick02Icon, className: 'text-muted-foreground' },
  success: { icon: CheckmarkCircle02Icon, className: 'text-status-done' },
  approval: { icon: PauseCircleIcon, className: 'text-status-progress' },
  error: { icon: AlertCircleIcon, className: 'text-destructive' },
  user: { icon: UserIcon, className: 'text-muted-foreground' },
}

function duration(seconds: number) {
  const s = Math.floor(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function clock(at: number) {
  const d = new Date(at)
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':')
}

export function AgentRunsPanel() {
  const [runs, dispatch] = useReducer(reducer, undefined, () => initialRuns(Date.now()))
  // The id outlives `logOpen` so the sheet keeps its content while it slides out.
  const [logId, setLogId] = useState<string | null>(null)
  const [logOpen, setLogOpen] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = runs.some((r) => r.status === 'running' || r.status === 'queued')

  // The runs only move while the panel is on screen, so the live part is not
  // over before anyone scrolls down to it.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!active || !onScreen) return
    const timer = setInterval(() => dispatch({ type: 'tick', dt: 0.5, at: Date.now() }), 500)
    return () => clearInterval(timer)
  }, [active, onScreen])

  const act = (type: 'stop' | 'approve' | 'reject' | 'retry', id: string) => dispatch({ type, id, at: Date.now() })
  const running = runs.find((r) => r.status === 'running')
  const counts = (['running', 'queued', 'approval'] as const)
    .map((s) => [s, runs.filter((r) => r.status === s).length] as const)
    .filter(([, n]) => n > 0)
  const logRun = runs.find((r) => r.id === logId)

  return (
    <Panel title="Agent runs" note="Background tasks, one at a time">
      <div ref={rootRef} className="grid min-w-0 gap-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <AiLabel>Agents</AiLabel>
          <span className="text-muted-foreground" aria-live="polite">
            {counts.length
              ? counts.map(([s, n]) => `${n} ${s === 'approval' ? 'waiting for you' : s}`).join(' · ')
              : 'Nothing running'}
          </span>
        </div>

        <ul aria-label="Agent runs" className="@container divide-y overflow-hidden rounded-lg border">
          {runs.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              position={run.status === 'queued' ? queuePosition(runs, run) : 0}
              blocker={run.status === 'queued' ? running?.title : undefined}
              onAct={(type) => act(type, run.id)}
              onLog={() => {
                setLogId(run.id)
                setLogOpen(true)
              }}
            />
          ))}
        </ul>
      </div>

      <Sheet open={logOpen && !!logRun} onOpenChange={setLogOpen}>
        {logRun && <LogSheet run={logRun} onAct={(type) => act(type, logRun.id)} />}
      </Sheet>
    </Panel>
  )
}

function queuePosition(runs: Run[], run: Run) {
  return runs.filter(
    (r) => r.status === 'queued'
      && (Number(r.approved) > Number(run.approved) || (r.approved === run.approved && r.queuedAt <= run.queuedAt)),
  ).length
}

function StatusGlyph({ status, className }: { status: RunStatus; className?: string }) {
  const meta = STATUS_META[status]
  if (!meta.icon) return <Spinner className={cn('size-4 shrink-0', meta.className, className)} />
  return <HugeiconsIcon icon={meta.icon} strokeWidth={2} className={cn('size-4 shrink-0', meta.className, className)} />
}

type RunAction = 'stop' | 'approve' | 'reject' | 'retry'

function RunActions({ run, onAct }: { run: Run; onAct: (type: RunAction) => void }) {
  if (run.status === 'running') {
    return (
      <Button variant="ghost" size="sm" onClick={() => onAct('stop')}>
        <HugeiconsIcon icon={StopIcon} strokeWidth={2} data-icon="inline-start" />
        Stop
      </Button>
    )
  }
  if (run.status === 'queued') {
    return <Button variant="ghost" size="sm" onClick={() => onAct('stop')}>Cancel</Button>
  }
  if (run.status === 'approval') {
    return (
      <>
        <Button size="sm" onClick={() => onAct('approve')}>
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
          Approve
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAct('reject')}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
          Reject
        </Button>
      </>
    )
  }
  if (run.status === 'failed' || run.status === 'stopped') {
    return (
      <Button variant="outline" size="sm" onClick={() => onAct('retry')}>
        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
        Retry
      </Button>
    )
  }
  return null
}

function RunRow({ run, position, blocker, onAct, onLog }: {
  run: Run
  position: number
  blocker?: string
  onAct: (type: RunAction) => void
  onLog: () => void
}) {
  const meta = STATUS_META[run.status]
  const time = run.status === 'queued'
    ? position === 1 ? 'next in line' : `#${position} in line`
    : run.status === 'done' ? `took ${duration(run.elapsed)}` : duration(run.elapsed)
  const showProgress = run.status !== 'queued' && run.status !== 'done'
  // Once a run has started, its steps show as a thinking trail.
  const started = run.status !== 'queued' && (run.status === 'running' || run.progress > 0)

  let detail: ReactNode = null
  if (run.status === 'queued') detail = run.approved ? 'Approved. Continues when a slot is free.' : blocker ? `Starts after “${blocker}”` : 'Starts in a moment'
  if (run.status === 'failed') detail = <span className="text-destructive">{run.error}</span>
  if (run.status === 'stopped') detail = run.log[run.log.length - 1]?.text
  if (run.status === 'done') {
    detail = (
      <span className="flex min-w-0 items-start gap-1.5">
        <AiLabel className="mt-px" />
        <span className="min-w-0">{run.result}</span>
      </span>
    )
  }

  return (
    <li className="grid min-w-0 gap-1.5 px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <StatusGlyph status={run.status} />
        <div className="min-w-32 flex-1">
          <p className="truncate text-xs font-medium">{run.title}</p>
          <p className="text-[11px]">
            <span className={meta.className}>{meta.label}</span>
            <span className="text-muted-foreground tabular-nums"> · {time}</span>
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <RunActions run={run} onAct={onAct} />
          <IconAction label="View log" onClick={onLog} icon={LogsIcon} />
        </div>
      </div>

      {showProgress && (
        <div className="flex items-center gap-2 pl-6.5">
          <Progress
            value={(run.progress / run.total) * 100}
            aria-label={`${run.title}: ${run.progress} of ${run.total} steps`}
            className={cn(
              'flex-1',
              run.status === 'approval' && '[&>[data-slot=progress-indicator]]:bg-status-progress',
              run.status === 'failed' && '[&>[data-slot=progress-indicator]]:bg-destructive',
              run.status === 'stopped' && '[&>[data-slot=progress-indicator]]:bg-muted-foreground',
            )}
          />
          <span className="text-muted-foreground w-10 text-right text-[11px] tabular-nums">{run.progress}/{run.total}</span>
        </div>
      )}

      {started && <RunTrail run={run} />}

      {run.status === 'approval' ? (
        <div className="bg-status-progress/10 ml-6.5 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs">
          <AiLabel className="mt-px" />
          <span className="min-w-0">{run.approvalText}</span>
        </div>
      ) : (
        detail && <div className="text-muted-foreground min-w-0 pl-6.5 text-[11px] break-words">{detail}</div>
      )}
    </li>
  )
}

// The step a run is on: running, failed there, or stopped there.
const CURRENT_STEP: Partial<Record<RunStatus, TrailStepStatus>> = { running: 'running', failed: 'error', stopped: 'stopped' }

// The run's steps as a thinking trail: one live line while it works, folded
// to "Worked for 26s · 12 steps" after, the full plan one click away.
function RunTrail({ run }: { run: Run }) {
  const steps = run.steps.map((label, i): TrailStep => ({
    id: String(i),
    kind: 'plan',
    label,
    status: i < run.progress ? 'done' : i === run.progress ? CURRENT_STEP[run.status] ?? 'pending' : 'pending',
  }))
  const ms = run.elapsed * 1000
  return (
    <div className="min-w-0 pl-6.5">
      <ThinkingTrail
        steps={steps}
        live={run.status === 'running'}
        activity={`${run.steps[run.progress]}…`}
        // The row above already counts the time while it runs.
        duration={run.status === 'running' ? undefined : ms}
        summary={
          run.status === 'approval' ? `Paused for approval after ${formatDuration(ms)}`
            : run.status === 'stopped' ? `Stopped after ${formatDuration(ms)}`
            : undefined
        }
        meta={run.status === 'done' ? `${run.total} steps` : `${run.progress} of ${run.total} steps`}
        autoOpen={false}
      />
    </div>
  )
}

function LogSheet({ run, onAct }: { run: Run; onAct: (type: RunAction) => void }) {
  const listRef = useRef<HTMLOListElement>(null)
  const meta = STATUS_META[run.status]

  // Follow new entries while the run is live.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [run.log.length])

  function copyLog() {
    const lines = run.log.map((e) => `${clock(e.at)}  ${e.text}`)
    copyText(`${run.title}\n${lines.join('\n')}`, 'Log copied')
  }

  return (
    <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
      <SheetHeader className="border-b p-4 pr-12">
        <SheetTitle>{run.title}</SheetTitle>
        <SheetDescription className="flex flex-wrap items-center gap-x-1.5">
          <StatusGlyph status={run.status} className="size-3.5" />
          <span className={meta.className}>{meta.label}</span>
          <span>· {duration(run.elapsed)} · attempt {run.attempt} · step {run.progress} of {run.total}</span>
        </SheetDescription>
      </SheetHeader>

      <ol ref={listRef} aria-label="Run log" className="grid flex-1 content-start gap-2.5 overflow-y-auto p-4">
        {run.log.map((entry, i) => {
          const icon = LOG_ICONS[entry.kind]
          return (
            <li key={i} className="flex gap-2.5 text-xs">
              <span className="text-muted-foreground w-14 shrink-0 pt-px text-[11px] tabular-nums">{clock(entry.at)}</span>
              <HugeiconsIcon icon={icon.icon} strokeWidth={2} className={cn('mt-0.5 size-3.5 shrink-0', icon.className)} />
              <span className={cn('min-w-0 break-words', entry.kind === 'error' && 'text-destructive')}>{entry.text}</span>
            </li>
          )
        })}
        {run.status === 'running' && (
          <li className="flex gap-2.5 text-xs">
            <span className="w-14 shrink-0" />
            <Spinner className="text-brand mt-0.5 size-3.5 shrink-0" />
            <ShimmerText className="min-w-0">{run.steps[run.progress]}…</ShimmerText>
          </li>
        )}
      </ol>

      <SheetFooter className="flex-row flex-wrap justify-end gap-1.5 border-t p-3">
        <Button variant="ghost" size="sm" className="mr-auto" onClick={copyLog}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
          Copy log
        </Button>
        <RunActions run={run} onAct={onAct} />
      </SheetFooter>
    </SheetContent>
  )
}
