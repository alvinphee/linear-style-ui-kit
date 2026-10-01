import type { ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Attachment01Icon, BookOpen01Icon, DatabaseIcon, FileTextIcon, FileViewIcon, Globe02Icon, PencilEdit02Icon,
  Search01Icon, SourceCodeIcon, Table01Icon,
} from '@hugeicons/core-free-icons'
import { ArtifactCard as ArtifactCardView, ErrorCard as ErrorCardView } from '@/blocks/ai/chat-message'
import {
  ApprovalCard as ApprovalCardView, ThinkingTrail, type ApprovalChange, type TrailStep, type TrailStepStatus,
} from '@/blocks/ai/thinking-trail'
import { UserAvatar } from '@/components/person'
import {
  ActivityLine as ActivityLineView, AiMotion, Elapsed as ElapsedView, useNow as useClock,
} from '@/components/thinking-indicator'
import { PRIORITY, STATUS, type Priority, type Status } from '../../data'
import { PriorityIcon, StatusIcon } from '../StatusSection'
import { now } from './data'
import type { ArtifactKind, Change, PartOf, StepState, ToolName } from './types'

// The workspace's side of the AI blocks: it turns its reply parts into the
// props of the thinking trail, approval card and artifact card. The timers
// read the workspace's demo clock (`now`), which its parts are stamped with.

export { SourcesRow, StoppedNote } from '@/blocks/ai/chat-message'
export { TypingDots } from '@/components/thinking-indicator'

// Keyframes for the shimmer, the typing dots and the voice waveform. React
// hoists them into <head> once, however many workspaces are on the page.
export function AiStyles() {
  return <AiMotion />
}

export function useNow(active: boolean, interval = 1000) {
  return useClock(active, interval, now)
}

export function Elapsed({ since, interval = 1000 }: { since: number; interval?: number }) {
  return <ElapsedView since={since} interval={interval} clock={now} />
}

export function ActivityLine({ text, since }: { text: string; since: number }) {
  return <ActivityLineView text={text} since={since} clock={now} />
}

/* ---------- The thinking trail: thinking, plan steps and tool calls in one quiet line ---------- */

export type ProcessPart = PartOf<'thinking'> | PartOf<'plan'> | PartOf<'tool'>

export const TOOL_ICONS: Record<ToolName, IconSvgElement> = {
  search_jobs: Search01Icon,
  read_job: FileViewIcon,
  web_search: Globe02Icon,
  run_query: DatabaseIcon,
  update_jobs: PencilEdit02Icon,
  read_file: Attachment01Icon,
  search_knowledge: BookOpen01Icon,
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

const STEP_STATUS: Record<StepState, TrailStepStatus> = { pending: 'pending', running: 'running', done: 'done', failed: 'error' }

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

// The reply's first thinking and first plan, then every tool call.
function trailSteps(thinking: PartOf<'thinking'> | undefined, plan: PartOf<'plan'> | undefined, tools: PartOf<'tool'>[]): TrailStep[] {
  const steps: TrailStep[] = []
  if (thinking) {
    steps.push({ id: thinking.id, kind: 'thinking', label: thinking.text, status: thinking.state, ms: thinking.ms, startedAt: thinking.startedAt })
  }
  plan?.steps.forEach((step, i) => {
    steps.push({ id: `${plan.id}-${i}`, kind: 'plan', label: step.label, status: STEP_STATUS[step.state], ms: step.ms, startedAt: step.startedAt })
  })
  for (const tool of tools) {
    const [running, done] = TOOL_VERBS[tool.name]
    steps.push({
      id: tool.id, kind: 'tool', label: done, activeLabel: running, detail: inputHint(tool.input), icon: TOOL_ICONS[tool.name],
      status: tool.state, ms: tool.ms, startedAt: tool.startedAt, name: tool.name, input: tool.input, output: tool.output,
      error: tool.error, summary: tool.summary,
    })
  }
  return steps
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
  const thinking = parts.find((p): p is PartOf<'thinking'> => p.type === 'thinking')
  const plan = parts.find((p): p is PartOf<'plan'> => p.type === 'plan')
  const tools = parts.filter((p): p is PartOf<'tool'> => p.type === 'tool')
  return (
    <ThinkingTrail
      steps={trailSteps(thinking, plan, tools)}
      live={live}
      activity={activity || (thinking?.state === 'running' || !parts.length ? 'Thinking…' : 'Working…')}
      startedAt={since}
      duration={(thinking?.ms ?? 0) + tools.reduce((n, t) => n + t.ms, 0)}
      clock={now}
    />
  )
}

/* ---------- Approval ---------- */

const STATUS_BY_LABEL = Object.fromEntries((Object.keys(STATUS) as Status[]).map((s) => [STATUS[s].label, s]))
const PRIORITY_BY_LABEL = Object.fromEntries((Object.keys(PRIORITY) as Priority[]).map((p) => [PRIORITY[p].label, p]))

function changeIcon(field: Change['field'], value: string): ReactNode {
  if (field === 'Status' && STATUS_BY_LABEL[value]) return <StatusIcon status={STATUS_BY_LABEL[value]} />
  if (field === 'Priority' && PRIORITY_BY_LABEL[value]) return <PriorityIcon priority={PRIORITY_BY_LABEL[value]} />
  if (field === 'Assignee' && value !== 'Unassigned') return <UserAvatar name={value} className="size-4" />
  return undefined
}

const toChange = (change: Change): ApprovalChange => ({
  record: change.jobId,
  title: change.title,
  field: change.field,
  from: change.from,
  to: change.to,
  fromIcon: changeIcon(change.field, change.from),
  toIcon: changeIcon(change.field, change.to),
})

export function ApprovalCard({ part, onDecide, disabled }: {
  part: PartOf<'approval'>
  onDecide: (decision: 'approved' | 'denied') => void
  disabled?: boolean
}) {
  return (
    <ApprovalCardView
      title={part.request.title}
      description={part.request.summary}
      changes={part.request.changes.map(toChange)}
      state={part.state}
      onApprove={() => onDecide('approved')}
      onDeny={() => onDecide('denied')}
      disabled={disabled}
    />
  )
}

/* ---------- Artifacts and errors ---------- */

export const KIND_ICONS: Record<ArtifactKind, IconSvgElement> = {
  document: FileTextIcon,
  table: Table01Icon,
  code: SourceCodeIcon,
}

export const KIND_LABELS: Record<ArtifactKind, string> = { document: 'Document', table: 'Table', code: 'Code' }

export function ArtifactCard({ part, active, onOpen }: { part: PartOf<'artifact'>; active: boolean; onOpen: () => void }) {
  return (
    <ArtifactCardView
      title={part.title}
      icon={KIND_ICONS[part.kind]}
      kind={KIND_LABELS[part.kind]}
      version={part.version}
      active={active}
      onOpen={onOpen}
    />
  )
}

export function ErrorCard({ part, onRetry }: { part: PartOf<'error'>; onRetry?: () => void }) {
  return <ErrorCardView message={part.message} detail={part.detail} onRetry={onRetry} />
}
