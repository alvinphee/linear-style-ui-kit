import type { Job } from '../../data'
import type { FileKind } from '@/components/file-chip'

export type ModelId = 'swift' | 'balanced' | 'depth' | 'depth-max'

export type Model = {
  id: ModelId
  name: string
  description: string
  speed: 1 | 2 | 3
  quality: 1 | 2 | 3
  thinkMs: number
  // 1 = short replies, 3 = long ones.
  detail: 1 | 2 | 3
  charsPerTick: number
  // Share of the monthly credits one reply uses, in percent.
  cost: number
  badge?: string
}

export type Modes = { web: boolean; deep: boolean }

// What a file holds: the kit's file kinds (components/file-chip).
export type { FileKind }
export type FileRef = { id: string; name: string; size: number; kind: FileKind }

export type Project = {
  id: string
  name: string
  // A CSS colour built from theme tokens, e.g. var(--chart-2).
  colour: string
  description: string
  instructions: string
  files: FileRef[]
}

export type StepState = 'pending' | 'running' | 'done' | 'failed'
export type PlanStep = { label: string; state: StepState; ms?: number; startedAt?: number }

export type ToolName =
  | 'search_jobs' | 'read_job' | 'web_search' | 'run_query' | 'update_jobs' | 'read_file' | 'search_knowledge'
  | 'search_invoices' | 'send_reminders'
type ToolState = 'running' | 'done' | 'error' | 'stopped'

export type Source = { title: string; url: string; domain: string; snippet: string }

export type JobPatch = Partial<Pick<Job, 'status' | 'priority' | 'driver'>>
export type Change = { jobId: string; title: string; field: 'Status' | 'Priority' | 'Assignee'; from: string; to: string }

// A customer invoice. `due` is an ISO date.
export type Invoice = { id: string; customer: string; contact: string; amount: number; due: string }

// What the agent asks before it acts: change jobs, or send payment reminders.
// Requests saved before `kind` existed are job changes.
export type UpdateRequest = {
  kind?: 'jobs'
  title: string
  summary: string
  changes: Change[]
  groups: { ids: string[]; patch: JobPatch }[]
}

export type ReminderRequest = { kind: 'reminders'; title: string; summary: string; invoices: Invoice[] }

export type ApprovalRequest = UpdateRequest | ReminderRequest

export type ArtifactKind = 'document' | 'table' | 'code'

// What an artifact was built from, so a revision can rebuild it rather than
// only trimming the text.
export type ArtifactSource =
  | { template: 'email'; jobId: string; tone: EmailTone }
  | { template: 'report' }
  | { template: 'other' }

export type EmailTone = 'standard' | 'warm' | 'formal' | 'short'

export type Part =
  | { id: string; type: 'thinking'; text: string; state: 'running' | 'done'; ms: number; startedAt?: number }
  | { id: string; type: 'plan'; steps: PlanStep[] }
  | {
    id: string
    type: 'tool'
    name: ToolName
    input: unknown
    output?: unknown
    summary?: string
    error?: string
    state: ToolState
    ms: number
    startedAt?: number
  }
  | { id: string; type: 'approval'; request: ApprovalRequest; state: 'pending' | 'approved' | 'denied' }
  | { id: string; type: 'text'; text: string; streaming: boolean }
  | { id: string; type: 'sources'; sources: Source[] }
  | { id: string; type: 'artifact'; artifactId: string; version: number; title: string; kind: ArtifactKind }
  | { id: string; type: 'error'; message: string; detail?: string }

export type PartOf<T extends Part['type']> = Extract<Part, { type: T }>

export type ReplyStatus = 'running' | 'awaiting' | 'done' | 'stopped' | 'error'

export type Reply = {
  id: string
  // Set when this version used a different model from the message's first one.
  model?: ModelId
  status: ReplyStatus
  startedAt: number
  finishedAt?: number
  // The shimmering status line while the agent works ("Searching jobs…").
  activity?: string
  parts: Part[]
  followUps: string[]
  feedback?: 'up' | 'down'
}

export type UserMessage = { id: string; role: 'user'; text: string; attachments: FileRef[]; at: number }

export type AssistantMessage = {
  id: string
  role: 'assistant'
  model: ModelId
  // Every regenerate adds a version; `current` is the one on screen.
  versions: Reply[]
  current: number
}

export type Message = UserMessage | AssistantMessage

export type Chat = {
  id: string
  title: string
  projectId: string | null
  pinned: boolean
  updatedAt: number
  model: ModelId
  messages: Message[]
}

type ArtifactVersion = { content: string; at: number }

export type Artifact = {
  id: string
  title: string
  kind: ArtifactKind
  // markdown, csv, typescript, sql…
  language: string
  source: ArtifactSource
  versions: ArtifactVersion[]
}

export type View =
  | { kind: 'chat'; chatId: string }
  | { kind: 'new'; projectId: string | null }
  | { kind: 'project'; projectId: string }
