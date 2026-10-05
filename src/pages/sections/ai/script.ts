import { formatFileSize } from '@/lib/format'
import { plural } from '@/lib/text'
import type { Job } from '../../data'
import type {
  ApprovalRequest, Artifact, ArtifactKind, ArtifactSource, FileRef, Model, Modes, Project, Source, StepState, ToolName,
} from './types'

// The script format and the builder the scenarios use to write one.

export type ArtifactDraft = {
  title: string
  kind: ArtifactKind
  language: string
  content: string
  source: ArtifactSource
  // Set when the draft is a new version of an artifact that already exists.
  reviseId?: string
}

export type ScriptEvent =
  | { type: 'pause'; ms: number }
  | { type: 'activity'; text: string }
  | { type: 'think'; text: string; ms: number }
  | { type: 'plan'; steps: string[] }
  | { type: 'step'; index: number; state: StepState }
  | {
    type: 'tool'
    name: ToolName
    input: unknown
    output?: unknown
    summary?: string
    error?: string
    ms: number
    activity: string
  }
  | { type: 'text'; text: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'artifact'; draft: ArtifactDraft }
  | { type: 'approval'; request: ApprovalRequest }
  | { type: 'error'; message: string; detail?: string }
  | { type: 'followUps'; items: string[] }

export type AgentContext = {
  prompt: string
  model: Model
  modes: Modes
  // A snapshot of the shared job store, taken when the prompt is sent.
  jobs: Job[]
  // Invoices that already got a payment reminder.
  reminded: string[]
  // 0 for the first answer, 1 after one regenerate, and so on.
  attempt: number
  attachments: FileRef[]
  project: Project | null
  // The newest artifact earlier in the chat, for "make it shorter" and translations.
  lastArtifact: { artifact: Artifact; content: string } | null
  // Regenerating a reply that made an artifact adds a version to it.
  reviseId?: string
}


export type BuilderContext = Pick<AgentContext, 'model' | 'modes' | 'project' | 'attachments'> & { reviseId?: string }

const TOOL_MS: Record<ToolName, number> = {
  search_jobs: 900,
  read_job: 650,
  web_search: 1500,
  run_query: 1300,
  update_jobs: 1000,
  read_file: 800,
  search_knowledge: 850,
  search_invoices: 900,
  send_reminders: 1100,
}

function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

export class Builder {
  events: ScriptEvent[] = []
  private readFiles = false
  private said = false

  constructor(private ctx: BuilderContext, firstPause = 700) {
    if (firstPause) this.events.push({ type: 'pause', ms: firstPause })
  }

  get detail(): 1 | 2 | 3 {
    let d = this.ctx.model.detail + (this.ctx.modes.deep ? 1 : 0)
    if (this.ctx.project && /\b(short|brief|concise)\b/i.test(this.ctx.project.instructions)) d -= 1
    return Math.min(3, Math.max(1, d)) as 1 | 2 | 3
  }

  pause(ms: number) {
    this.events.push({ type: 'pause', ms })
  }

  think(base: string[], deeper: string[] = []) {
    const { project, attachments, modes, model } = this.ctx
    const lines: string[] = []
    if (project?.instructions.trim()) {
      const rule = project.instructions.trim().split(/(?<=[.!?])\s/)[0]
      lines.push(`The ${project.name} project asks me to: “${rule}”`)
    }
    if (attachments.length) {
      lines.push(`They attached ${attachments.map((a) => a.name).join(' and ')}, so I will read ${attachments.length === 1 ? 'it' : 'them'} first.`)
    }
    lines.push(...base)
    if (this.detail >= 3 || modes.deep) lines.push(...deeper)
    const ms = modes.deep ? Math.max(model.thinkMs, 4000) + 1500 : model.thinkMs
    this.events.push({ type: 'think', text: lines.join(' '), ms })
    if (!this.readFiles) {
      this.readFiles = true
      for (const file of attachments.slice(0, 3)) {
        this.tool('read_file', { name: file.name }, readFile(file), `Reading ${file.name}…`)
      }
    }
  }

  plan(steps: string[]) {
    this.events.push({ type: 'plan', steps })
  }

  step(index: number, state: StepState) {
    this.events.push({ type: 'step', index, state })
  }

  tool(name: ToolName, input: unknown, result: { output?: unknown; summary?: string; error?: string }, activity: string) {
    const jitter = (hash(JSON.stringify(input) ?? '') % 5) * 100
    this.events.push({ type: 'tool', name, input, ...result, ms: Math.min(2000, TOOL_MS[name] + jitter), activity })
  }

  say(text: string, mentionFiles = true) {
    let body = text
    if (!this.said && mentionFiles && this.ctx.attachments.length) {
      const names = this.ctx.attachments.slice(0, 3).map((a) => `**${a.name}**`).join(' and ')
      body = `I read ${names} as well.\n\n${text}`
    }
    this.said = true
    this.events.push({ type: 'text', text: body })
  }

  sources(sources: Source[]) {
    this.events.push({ type: 'sources', sources })
  }

  artifact(draft: ArtifactDraft) {
    this.events.push({ type: 'artifact', draft: { ...draft, reviseId: draft.reviseId ?? this.ctx.reviseId } })
  }

  approval(request: ApprovalRequest) {
    this.events.push({ type: 'approval', request })
  }

  fail(message: string, detail?: string) {
    this.events.push({ type: 'error', message, detail })
  }

  followUps(items: string[]) {
    this.events.push({ type: 'followUps', items })
  }
}

export function readFile(file: FileRef) {
  const seed = hash(file.name)
  if (file.kind === 'sheet' || file.kind === 'csv') {
    const rows = 20 + (seed % 180)
    return { output: { name: file.name, size: formatFileSize(file.size), rows, columns: 4 + (seed % 8) }, summary: plural(rows, 'row') }
  }
  if (file.kind === 'image') {
    return { output: { name: file.name, size: formatFileSize(file.size), width: 1600, height: 1200, text_found: false }, summary: '1600 × 1200' }
  }
  const pages = 1 + (seed % 12)
  return { output: { name: file.name, size: formatFileSize(file.size), pages, words: pages * 310 }, summary: plural(pages, 'page') }
}
