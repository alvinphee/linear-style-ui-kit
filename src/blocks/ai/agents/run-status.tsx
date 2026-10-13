import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { BotIcon, Calendar03Icon, FlashIcon, Loading03Icon, UserIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { formatAgo, formatTime } from '@/lib/format'
import type { AgentRun, AgentTriggerKind, RunStatus } from './agent-types'

// A run's status as a pill, and the small pieces every run view shares: the
// agent's mark, what started the run and how long it has been going.
// Queued and Cancelled are grey, Running turns a spinner, Needs approval
// takes the accent (it is the one that needs you), Succeeded and Failed
// take the done and destructive colours.

// The agent a run belongs to, as the run views need it.
export type RunAgent = { name: string; icon?: IconSvgElement; colour?: string }

const STATUS: Record<RunStatus, { label: string; tone: Tone }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  running: { label: 'Running', tone: 'progress' },
  awaiting: { label: 'Needs approval', tone: 'info' },
  succeeded: { label: 'Succeeded', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const runStatusLabel = (status: RunStatus) => STATUS[status].label

export const isRunActive = (status: RunStatus) => status === 'queued' || status === 'running' || status === 'awaiting'

export function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const { label, tone } = STATUS[status]
  return (
    <StatusBadge tone={tone} dot={status !== 'running'} className={cn(status === 'cancelled' && 'opacity-80', className)}>
      {status === 'running' && (
        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} aria-hidden="true" className="size-3 animate-spin motion-reduce:animate-none" />
      )}
      {label}
    </StatusBadge>
  )
}

const TRIGGER: Record<AgentTriggerKind, { label: string; icon: IconSvgElement }> = {
  manual: { label: 'Manual', icon: UserIcon },
  schedule: { label: 'Scheduled', icon: Calendar03Icon },
  event: { label: 'Event', icon: FlashIcon },
}

export const runTriggerLabel = (trigger: AgentTriggerKind) => TRIGGER[trigger].label

// What started the run, as an icon and a word ("Scheduled").
export function RunTrigger({ trigger, className }: { trigger: AgentTriggerKind; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1', className)}>
      <HugeiconsIcon icon={TRIGGER[trigger].icon} strokeWidth={2} aria-hidden="true" className="size-3" />
      {TRIGGER[trigger].label}
    </span>
  )
}

export function RunAgentMark({ agent, size = 'md', className }: { agent: RunAgent; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return <IconMark icon={agent.icon ?? BotIcon} colour={agent.colour ?? 'var(--brand)'} size={size} className={className} />
}

// How long a run took, in words: "45 s", "1 min 12 s", "1 h 5 min".
export function formatRunDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`
  return m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 60)} h`
}

// One line about a run's timing: "Started 4 min ago" while it works,
// "14:05 · Took 1 min 12 s" once it is over.
export function runTiming(run: AgentRun, now: number) {
  if (run.status === 'queued') return `Queued ${formatAgo(run.startedAt, now)}`
  if (run.status === 'running' || run.status === 'awaiting' || run.finishedAt === undefined) {
    return `Started ${formatAgo(run.startedAt, now)}`
  }
  return `${formatTime(run.startedAt)} · Took ${formatRunDuration(run.finishedAt - run.startedAt)}`
}

// The step a run is on: the running one, or the first still to do.
export function currentStep(run: AgentRun) {
  return run.steps.find((s) => s.state === 'running') ?? run.steps.find((s) => s.state === 'pending')
}
