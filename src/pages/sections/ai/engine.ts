import { now, uid } from './data'
import { code, files, general, plan, research, revise, translate } from './scenarios-assist'
import { continueReminders, reminders } from './scenarios-invoices'
import { compare, continueUpdate, email, summary, update } from './scenarios-jobs'
import { Builder, type AgentContext, type ArtifactDraft, type BuilderContext, type ScriptEvent } from './script'
import type { ApprovalRequest, Model, Part, PartOf, PlanStep } from './types'

// The scripted agent. Nothing here calls a model: a prompt is matched to a
// scenario by keywords, the scenario writes a script of events (script.ts),
// and play() runs the script with timers that can be cancelled.

export type { AgentContext, ArtifactDraft, ScriptEvent } from './script'

export type Intent =
  | 'summary' | 'email' | 'update' | 'reminders' | 'compare' | 'code' | 'research' | 'translate' | 'plan' | 'revise' | 'files'
  | 'general'

function detectIntent(ctx: Pick<AgentContext, 'prompt' | 'modes' | 'lastArtifact' | 'attachments'>): Intent {
  const p = ctx.prompt.toLowerCase()
  const command = p.match(/^\/(\w+)/)?.[1]
  if (ctx.attachments.length && !command && /\b(attach\w*|files?|documents?|look at|read (this|these|it))\b/.test(p)) return 'files'
  if (command === 'summarise' || command === 'summarize') return 'summary'
  if (command === 'draft') return 'email'
  if (command === 'translate') return 'translate'
  if (command === 'plan') return 'plan'
  if (/\btranslat|\bin (french|spanish)\b|^now in\b/.test(p)) return 'translate'
  if (ctx.lastArtifact && /\b(shorter|shorten|condense|tighten|trim|longer|expand|more detail|formal|polite|warmer|friendlier|revise|rewrite|add a|add an)\b/.test(p)) {
    return 'revise'
  }
  if (/\b(invoices?|unpaid|payment reminders?|late payments?)\b|\boverdue\b(?! (jobs?|deliver))|\bremind\w*\b.*\bpay/.test(p)) {
    return 'reminders'
  }
  if (/\b(email|e-mail|draft|write to|reply to|letter)\b/.test(p)) return 'email'
  if (/\b(assign|reassign|unassign|mark|set|move|change|close|reopen)\b|\bupdate (the |all |my )?(jobs?|do-)/.test(p)) return 'update'
  if (/\b(code|script|function|snippet|typescript|javascript|sql|regex)\b/.test(p)) return 'code'
  if (/\b(compare|comparison|chart|graph|workload|breakdown|versus|vs|per driver|by driver|by customer|by status|how many)\b/.test(p)) return 'compare'
  if (/\b(plan|schedule|itinerary|checklist)\b/.test(p)) return 'plan'
  if (/\b(summar\w*|urgent|report|attention|overview|priorit\w*|due today)\b/.test(p)) return 'summary'
  if (/\b(research|rules?|regulations?|guidelines?|best practice|latest|news|compliance|standards?|what (is|are)|how (do|to)|why)\b/.test(p)) {
    return 'research'
  }
  return ctx.modes.web ? 'research' : 'general'
}

const SCENARIOS: Record<Intent, (b: Builder, ctx: AgentContext) => void> = {
  summary, email, update, reminders, compare, code, research, translate, plan, revise, files, general,
}

export function buildScript(ctx: AgentContext) {
  const b = new Builder(ctx)
  const intent = detectIntent(ctx)
  SCENARIOS[intent](b, ctx)
  return b.events
}

// The rest of the script once the person approves or denies.
export function continueAfterApproval(request: ApprovalRequest, decision: 'approved' | 'denied', ctx: BuilderContext) {
  return request.kind === 'reminders' ? continueReminders(request, decision, ctx) : continueUpdate(request, decision, ctx)
}

export function titleFor(prompt: string) {
  let t = prompt
    .replace(/^\/(\w+)\s*/, (_, c: string) => `${c[0].toUpperCase()}${c.slice(1)} `)
    .replace(/@/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?.!:]+$/, '')
  if (!t) return 'New chat'
  t = t[0].toUpperCase() + t.slice(1)
  return t.length > 44 ? `${t.slice(0, 43).trimEnd()}…` : t
}

// ---------------------------------------------------------------------------
// The player. One interpreter drives both the live timers and the seeded
// history: it yields how long to wait, and the caller decides how to wait.

export type Sink = {
  addPart: (part: Part) => void
  patchPart: (id: string, patch: Partial<Part>) => void
  activity: (text: string | undefined) => void
  artifact: (draft: ArtifactDraft) => { artifactId: string; version: number }
  followUps: (items: string[]) => void
  finish: (status: 'done' | 'awaiting' | 'error') => void
}

function* interpret(
  events: ScriptEvent[],
  sink: Sink,
  model: Model,
  clock: () => number,
  resumePlan?: PartOf<'plan'>,
): Generator<number, void, undefined> {
  let plan: { id: string; steps: PlanStep[] } | null = resumePlan
    ? { id: resumePlan.id, steps: resumePlan.steps.map((s) => ({ ...s })) }
    : null
  let text: { id: string; text: string } | null = null

  for (const ev of events) {
    switch (ev.type) {
      case 'pause':
        yield ev.ms
        break
      case 'activity':
        sink.activity(ev.text)
        break
      case 'think': {
        sink.activity('Thinking…')
        const id = uid('p')
        sink.addPart({ id, type: 'thinking', text: '', state: 'running', ms: 0, startedAt: clock() })
        text = null
        const ticks = Math.max(4, Math.round(ev.ms / 120))
        for (let i = 1; i <= ticks; i++) {
          yield ev.ms / ticks
          sink.patchPart(id, { text: ev.text.slice(0, Math.ceil((ev.text.length * i) / ticks)) })
        }
        sink.patchPart(id, { state: 'done', ms: ev.ms, text: ev.text })
        break
      }
      case 'plan':
        plan = { id: uid('p'), steps: ev.steps.map((label): PlanStep => ({ label, state: 'pending' })) }
        sink.activity('Planning…')
        sink.addPart({ id: plan.id, type: 'plan', steps: plan.steps.map((s) => ({ ...s })) })
        text = null
        yield 350
        break
      case 'step': {
        const step = plan?.steps[ev.index]
        if (!plan || !step) break
        const t = clock()
        if (ev.state === 'running') {
          step.state = 'running'
          step.startedAt = t
        } else {
          step.state = ev.state
          step.ms = step.startedAt ? t - step.startedAt : 0
        }
        sink.patchPart(plan.id, { steps: plan.steps.map((s) => ({ ...s })) })
        break
      }
      case 'tool': {
        sink.activity(ev.activity)
        const id = uid('p')
        sink.addPart({ id, type: 'tool', name: ev.name, input: ev.input, state: 'running', ms: 0, startedAt: clock() })
        text = null
        yield ev.ms
        sink.patchPart(id, ev.error
          ? { state: 'error', error: ev.error, ms: ev.ms }
          : { state: 'done', output: ev.output, summary: ev.summary, ms: ev.ms })
        break
      }
      case 'text': {
        sink.activity('Writing…')
        let base = ''
        if (text) base = `${text.text}\n\n`
        else {
          text = { id: uid('p'), text: '' }
          sink.addPart({ id: text.id, type: 'text', text: '', streaming: true })
        }
        const full = base + ev.text
        let shown = base.length
        while (shown < full.length) {
          let next = Math.min(full.length, shown + model.charsPerTick)
          const space = full.indexOf(' ', next)
          if (space !== -1 && space - next < 10) next = space
          shown = next
          sink.patchPart(text.id, { text: full.slice(0, shown), streaming: true })
          yield 50
        }
        text.text = full
        sink.patchPart(text.id, { text: full, streaming: false })
        break
      }
      case 'sources':
        sink.addPart({ id: uid('p'), type: 'sources', sources: ev.sources })
        text = null
        yield 150
        break
      case 'artifact': {
        sink.activity('Saving the artifact…')
        yield 450
        const ref = sink.artifact(ev.draft)
        sink.addPart({ id: uid('p'), type: 'artifact', artifactId: ref.artifactId, version: ref.version, title: ev.draft.title, kind: ev.draft.kind })
        text = null
        break
      }
      case 'approval':
        sink.addPart({ id: uid('p'), type: 'approval', request: ev.request, state: 'pending' })
        sink.activity(undefined)
        sink.finish('awaiting')
        return
      case 'error':
        sink.addPart({ id: uid('p'), type: 'error', message: ev.message, detail: ev.detail })
        sink.activity(undefined)
        sink.finish('error')
        return
      case 'followUps':
        sink.followUps(ev.items)
        break
    }
  }
  sink.activity(undefined)
  sink.finish('done')
}

export type Controller = { stop: () => void }

export function play(events: ScriptEvent[], sink: Sink, model: Model, resumePlan?: PartOf<'plan'>): Controller {
  const run = interpret(events, sink, model, now, resumePlan)
  let timer: number | undefined
  let stopped = false
  const advance = () => {
    timer = undefined
    if (stopped) return
    const next = run.next()
    if (!next.done) timer = window.setTimeout(advance, next.value)
  }
  advance()
  return {
    stop() {
      stopped = true
      if (timer !== undefined) window.clearTimeout(timer)
      run.return(undefined)
    },
  }
}

// Runs a script instantly on a virtual clock. Used to build the seeded chats.
export function materialise(events: ScriptEvent[], sink: Sink, model: Model, start: number, resumePlan?: PartOf<'plan'>) {
  let t = start
  const run = interpret(events, sink, model, () => t, resumePlan)
  for (let next = run.next(); !next.done; next = run.next()) t += next.value
  return t
}
