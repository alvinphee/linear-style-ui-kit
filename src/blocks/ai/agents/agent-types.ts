import type { IconSvgElement } from '@hugeicons/react'
import type { Recurrence } from '@/components/recurrence-picker'

// The shapes the agent blocks share. An agent is a saved, named assistant
// (ChatGPT's GPTs, Gemini's Gems): instructions, knowledge, tools and a
// model, used from any chat. Give it triggers and it also works on its own:
// on a schedule or when something happens in a connected app, each time as
// a run that may stop to ask before it acts.

export type ToolPermission = 'always' | 'ask' | 'off'

// What starts a run: someone asking (manual), a schedule, or an event in a
// connected app ("a new email arrives with an invoice attached").
export type AgentTrigger =
  | { id: string; kind: 'manual'; enabled: boolean }
  | { id: string; kind: 'schedule'; enabled: boolean; recurrence: Recurrence }
  | {
      id: string
      kind: 'event'
      enabled: boolean
      // The connector the event comes from (Settings › Connectors), and the
      // event by id and in words ("New email", "New file in a folder").
      connectorId: string
      event: string
      eventLabel: string
      // Narrows it down, in the connector's terms ("from:@supplier.com").
      filter?: string
    }

export type AgentTriggerKind = AgentTrigger['kind']

export type AgentAccess = 'private' | 'people' | 'organisation' | 'link'

export type Agent = {
  id: string
  name: string
  // One line: what it is for. Shown on its card and before a chat.
  description: string
  icon?: IconSvgElement
  // A CSS colour from theme tokens, such as var(--chart-2).
  colour?: string
  instructions: string
  // Conversation starters: one click starts a chat with it.
  starters: string[]
  // A model id; the person's default when left out.
  model?: string
  // Knowledge: files of its own (names and sizes) and knowledge bases by id.
  files: { id: string; name: string; size: number }[]
  knowledgeBases: string[]
  // Tools: connectors by id, each with the permission per tool it may use,
  // and skills by id.
  connectors: Record<string, Record<string, ToolPermission>>
  skills: string[]
  triggers: AgentTrigger[]
  access: AgentAccess
  owner: string
  // Where it came from, when it was made from a template or shared.
  templateId?: string
  createdAt: number
  updatedAt: number
}

// An agent while it is being made or changed: everything but who and when.
export type AgentDraft = Omit<Agent, 'id' | 'owner' | 'createdAt' | 'updatedAt'>

// A ready-made agent to start from, in the gallery's Explore tab.
export type AgentTemplate = AgentDraft & {
  id: string
  category: string
  // Who made it: the product, or a team in the organisation.
  publisher: string
  // How many people use it, for the card.
  uses?: number
}

export type RunStatus = 'queued' | 'running' | 'awaiting' | 'succeeded' | 'failed' | 'cancelled'

// One step of a run: a thought, a tool call, or the wait for a person.
export type RunStep = {
  id: string
  label: string
  state: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
  // The tool it called, in the connector's terms ("mail.search").
  tool?: string
  detail?: string
  startedAt?: number
  finishedAt?: number
}

// What a run is waiting for: a person to allow a tool call.
export type RunApproval = {
  title: string
  summary: string
  // The connector and tool asking, so "Always allow" can remember it.
  connectorId?: string
  tool?: string
  // What it will do, line by line ("Send an email to Northwind Traders").
  actions: string[]
  state: 'pending' | 'allowed' | 'denied'
}

export type AgentRun = {
  id: string
  agentId: string
  // A short title for this run ("Invoices from 3 new emails").
  title: string
  trigger: AgentTriggerKind
  status: RunStatus
  // 0 to 100 while running.
  progress?: number
  steps: RunStep[]
  approval?: RunApproval
  // The outcome in Markdown, once finished.
  result?: string
  error?: string
  // The chat the run's result lives in, when there is one.
  chatId?: string
  startedAt: number
  finishedAt?: number
  // Opened since it finished or started waiting.
  seen?: boolean
}
