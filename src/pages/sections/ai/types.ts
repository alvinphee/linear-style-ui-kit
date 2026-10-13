import type { Job } from '../../data'
import type { FileKind } from '@/components/file-chip'
import type { Memory } from '@/blocks/ai/memory/memory-manager'
import type { ProjectKnowledgeLink, ProjectKnowledgeText } from '@/blocks/ai/knowledge/project-knowledge'
import type { ProjectChatVisibility, ProjectMemberPermission } from '@/blocks/ai/projects/project-sharing'
import type { ScheduledTask } from '@/blocks/ai/schedules/scheduled-task-dialog'
import type { ShareAccess, ShareMember } from '@/blocks/share-dialog'
import type { ShareChatAccess, ShareChatMode } from '@/blocks/ai/chat/share-chat-dialog'

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

// Deep research: a plan, many searches, then a report with sources.
export type Modes = { web: boolean; deep: boolean; research?: boolean }

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
  // The rest is optional, so projects saved before it existed still load
  // (ai/projects/defaults.ts fills it in).
  // An icon id from ai/projects/templates.ts.
  icon?: string
  starred?: boolean
  archived?: boolean
  // Connectors and skills this project may use, by id.
  connectors?: Record<string, boolean>
  skills?: Record<string, boolean>
  memoryOn?: boolean
  memories?: Memory[]
  schedules?: ScheduledTask[]
  sharing?: ProjectSharing
  // Project knowledge beyond its files: pasted text, web pages, files left
  // out of the context, and the knowledge bases it searches (by id).
  texts?: ProjectKnowledgeText[]
  links?: ProjectKnowledgeLink[]
  excludedFiles?: string[]
  knowledgeBases?: string[]
}

// Who a project is shared with, as the share dialog edits it.
export type ProjectSharing = {
  members: ShareMember[]
  access: ShareAccess
  // What everyone in the organisation may do, when access is 'organisation'.
  accessRole: string
  chats: ProjectChatVisibility
  membersCan: ProjectMemberPermission
}

export type StepState = 'pending' | 'running' | 'done' | 'failed'
export type PlanStep = { label: string; state: StepState; ms?: number; startedAt?: number }

export type ToolName =
  | 'search_jobs' | 'read_job' | 'web_search' | 'run_query' | 'update_jobs' | 'read_file' | 'search_knowledge'
  | 'search_invoices' | 'send_reminders'
type ToolState = 'running' | 'done' | 'error' | 'stopped'

// A web page, or (kind 'document') a passage of a project file, as the
// Markdown block's Citation describes it.
export type Source = {
  title: string
  url: string
  domain: string
  snippet: string
  kind?: 'web' | 'document'
  passage?: string
  page?: number
  from?: string
  documentKind?: FileKind
}

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

// One version of a user message. Editing a message adds a branch, and the
// messages after it belong to that branch, so the old conversation is kept.
export type MessageBranch = {
  text: string
  attachments: FileRef[]
  at: number
  // The messages after this one in this branch. Empty for the branch on
  // screen: its messages are the chat's own, after this message.
  after: Message[]
}

export type UserMessage = {
  id: string
  role: 'user'
  // The text, attachments and time of the branch on screen.
  text: string
  attachments: FileRef[]
  at: number
  // Left out (never edited, or saved before branching existed): one branch,
  // the message itself.
  branches?: MessageBranch[]
  // The branch on screen, an index into `branches`.
  branch?: number
}

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
  // Incognito: kept out of the history and the saved state, deleted when you leave it.
  temporary?: boolean
  // Its shared link, if it has one. The address is built from its id.
  share?: ChatShare
}

// A chat's shared link. A snapshot shows the first `messageCount` messages;
// a live link shows the chat as it is whenever it is opened.
export type ChatShare = {
  id: string
  createdAt: number
  mode: ShareChatMode
  access: ShareChatAccess
  includeArtifacts: boolean
  messageCount: number
  views: number
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
  // A project's page, at one of its tabs (Overview when left out).
  | { kind: 'project'; projectId: string; tab?: string }
  // All chats: the chat library.
  | { kind: 'library' }
  // Knowledge bases: the library, or one at a tab.
  | { kind: 'knowledge'; baseId?: string; tab?: string }
  // Agents: the gallery (at a tab), the builder for a new one ('new'), one
  // agent at a tab, or its builder (tab 'edit').
  | { kind: 'agents'; agentId?: string; tab?: string }
  // The runs inbox, with one run open.
  | { kind: 'runs'; runId?: string }
