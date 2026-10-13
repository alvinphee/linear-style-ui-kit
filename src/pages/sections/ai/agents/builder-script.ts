import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon, BinocularsIcon, CustomerSupportIcon, Invoice01Icon, LegalDocument01Icon, SparklesIcon, UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import type { AgentDraft, AgentTrigger, ToolPermission } from '@/blocks/ai/agents/agent-types'
import type { BuilderMessage } from '@/blocks/ai/agents/builder-chat'
import { LAST_DAY, describeRecurrence, type Recurrence } from '@/components/recurrence-picker'
import { SAMPLE_KNOWLEDGE_BASES } from '../knowledge/bases-data'
import { CONNECTORS } from '../settings/connectors-data'
import { SAMPLE_SKILLS } from '../settings/skills-data'

// The agent builder's scripted engine: no model, just keywords. The first
// description picks one of seven kinds of agent (invoices, a weekly report,
// support triage, competitor research, contract review, onboarding, or a
// general assistant) and fills in a whole first version: name, icon and
// colour, description, instructions, conversation starters, knowledge,
// connectors with a permission per tool (reading on its own, asking before
// it writes or sends), skills, and a trigger when the words imply one
// ("every Monday", "when an email arrives"). Then it asks three follow-up
// questions, one at a time, and applies each answer on the next turn. After
// that it takes plain requests: "call it …", "make it more formal", "also
// use the calendar", "run it every Friday", or anything else, which goes
// into the instructions.
//
// Where a turn stands is read from the history alone: the builder's first
// version starts with FIRST_VERSION, and each person's message after it
// answers the next question.

export const TIME_ZONE = 'Asia/Singapore'

const FIRST_VERSION = 'Here’s a first version of'
const RESTART = 'Starting over.'

export const EMPTY_DRAFT: AgentDraft = {
  name: '',
  description: '',
  instructions: '',
  starters: [],
  files: [],
  knowledgeBases: [],
  connectors: {},
  skills: [],
  triggers: [],
  access: 'private',
}

export const BUILDER_GREETING = 'Hi! I’ll help you build an agent. Tell me what it should do, in a sentence or two, and I’ll fill in its name, instructions and tools. Then I’ll ask a few questions to get the details right.\n\nYou can change anything yourself in **Configure**, and try it as you go in the **Preview**.'

export const BUILDER_SUGGESTIONS = [
  'Reads supplier emails and files the invoices',
  'Writes a weekly report from our jobs',
  'Triages new support tickets and drafts replies',
  'Keeps an eye on our competitors',
  'Reviews contracts before we sign them',
  'Helps new hires through their first weeks',
]

type Topic = 'invoices' | 'report' | 'support' | 'research' | 'contracts' | 'onboarding' | 'generic'

type Change = { patch: Partial<AgentDraft>; updated: string[]; ack: string }

type Question = {
  ask: (draft: AgentDraft) => string
  apply: (draft: AgentDraft, answer: string) => Change
}

type Profile = {
  name: string
  icon: IconSvgElement
  colour: string
  description: string
  // What it does, in one sentence after the name, for the first reply.
  summary: string
  instructions: string
  starters: string[]
  connectors: string[]
  // Per-tool permissions that differ from the defaults.
  permissions?: Record<string, Record<string, ToolPermission>>
  skills: string[]
  knowledgeBases: string[]
  // An event trigger the kind of agent implies when the words say "new" or "when".
  event?: { connectorId: string; event: string; eventLabel: string; filter?: string }
  questions: Question[]
}

// ---------------------------------------------------------------------------
// Words in, facts out

const lower = (text: string) => text.toLowerCase()
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// An answer as a name: "the Suppliers folder." → "Suppliers folder".
function cleanName(answer: string) {
  const name = answer
    .trim()
    .replace(/^(it should |please |use |watch |file (them )?in(to)? |in(to)? |the |a |an |called |named |our |my )+/i, '')
    .replace(/^["“'‘*]+|["”'’*.!?]+$/g, '')
    .trim()
  return capitalise(name.slice(0, 60))
}

// "pricing, launches and hiring" → ['Pricing', 'Launches', 'Hiring'].
function listOf(answer: string) {
  return answer
    .split(/,|;|\n|\/|\band\b|\bor\b|\bplus\b/i)
    .map((part) => part.trim().replace(/^(the |a |an |for example |e\.g\. )/i, '').replace(/[.!?]+$/, ''))
    .filter((part) => part.length > 1)
    .map(capitalise)
    .slice(0, 8)
}

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n')

const SKIP = /^(skip|not sure|no idea|you (decide|choose|pick)|any|anything|whatever|doesn'?t matter|dunno|idk|up to you|default)\b/i

const TOPIC_WORDS: Record<Exclude<Topic, 'generic'>, [RegExp, RegExp?]> = {
  invoices: [/invoice|bills?\b|billing|receipt|supplier|accounts payable|purchase order/g, /e-?mails?|spreadsheet|sheet/g],
  report: [/report|weekly|status update|operations|\bops\b|kpi|metrics/g, /jobs|summary|numbers/g],
  support: [/support|tickets?|triage|help ?desk|complaint/g, /customers?|replies/g],
  research: [/research|competitor|market|news|keep an eye|monitor|follow/g, /web|websites?|trends?/g],
  contracts: [/contracts?|legal|clauses?|agreements?|\bnda\b|terms/g, /sign|review/g],
  onboarding: [/onboard|new hires?|new starters?|first weeks?|joiners?|new employees?/g, /welcome|hr\b/g],
}

function classify(text: string): Topic {
  const t = lower(text)
  let best: Topic = 'generic'
  let score = 0
  for (const [topic, [strong, weak]] of Object.entries(TOPIC_WORDS) as [Exclude<Topic, 'generic'>, [RegExp, RegExp?]][]) {
    const hits = t.match(strong)?.length ?? 0
    // Supporting words only tip the balance; on their own they say nothing.
    const s = hits * 2 + Math.min(weak ? t.match(weak)?.length ?? 0 : 0, 2) * 0.5
    if (hits > 0 && s > score) {
      best = topic
      score = s
    }
  }
  return best
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// "every Monday at 8:30am" → { kind: 'weekly', days: [1], time: '08:30' }.
// Null when the words name no schedule.
function parseSchedule(text: string): Partial<Recurrence> | null {
  const t = lower(text)
  const out: Partial<Recurrence> = {}
  const twelve = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/)
  const clock = t.match(/\b([01]?\d|2[0-3])[:.](\d{2})\b/)
  if (twelve) {
    let h = Number(twelve[1]) % 12
    if (twelve[3] === 'pm') h += 12
    out.time = `${String(h).padStart(2, '0')}:${twelve[2] ?? '00'}`
  } else if (clock) {
    out.time = `${clock[1].padStart(2, '0')}:${clock[2]}`
  } else if (/\bat (\d{1,2})\b/.test(t)) {
    out.time = `${t.match(/\bat (\d{1,2})\b/)![1].padStart(2, '0')}:00`
  } else if (/\bnoon|midday|lunch/.test(t)) out.time = '12:00'
  else if (/\bend of (the )?day|evening/.test(t)) out.time = '17:00'
  else if (/\bafternoon/.test(t)) out.time = '14:00'
  else if (/\bmorning|start of (the )?day/.test(t)) out.time = '09:00'

  const days = DAY_NAMES.flatMap((d, i) => (new RegExp(`\\b${d.slice(0, 3)}(${d.slice(3)})?s?\\b`).test(t) ? [i] : []))
  if (/weekdays?|every work ?day|monday to friday|mon-fri/.test(t)) out.kind = 'weekdays'
  else if (days.length) {
    out.kind = 'weekly'
    out.days = days
  } else if (/\b(daily|every day|each day|every (morning|evening|night)|each (morning|evening)|nightly)\b/.test(t)) out.kind = 'daily'
  else if (/\b(monthly|every month|each month|(first|start|end|last day) of (the|each|every) month)\b/.test(t)) {
    out.kind = 'monthly'
    out.dayOfMonth = /\b(end|last day) of/.test(t) ? LAST_DAY : 1
  } else if (/\b(weekly|every week|each week|once a week|a week\b)/.test(t)) {
    out.kind = 'weekly'
    out.days = [1]
  }
  return out.kind || out.time ? out : null
}

const NO_SCHEDULE = /\b(only when (i|we|they|someone) ask|on demand|manual(ly)?|no schedule|not on a schedule|don'?t schedule|never)\b|^no\b/i

function scheduleTrigger(r: Partial<Recurrence>, base?: Recurrence): AgentTrigger {
  const kind = r.kind ?? base?.kind ?? 'weekly'
  return {
    id: 'tr-schedule',
    kind: 'schedule',
    enabled: true,
    recurrence: {
      kind,
      time: r.time ?? base?.time ?? '09:00',
      timeZone: base?.timeZone ?? TIME_ZONE,
      ...(kind === 'weekly' ? { days: r.days ?? base?.days ?? [1] } : {}),
      ...(kind === 'monthly' ? { dayOfMonth: r.dayOfMonth ?? base?.dayOfMonth ?? 1 } : {}),
    },
  }
}

// "when an email arrives", "as tickets come in" → an event trigger.
function parseEvent(text: string): AgentTrigger | null {
  const t = lower(text)
  const when = /\b(when|whenever|as soon as|each time|every time|as)\b/.test(t) && /\b(arrive|arrives|come|comes|land|lands|get|gets|new|added|opened|created)\b/.test(t)
  if (!when) return null
  if (/tickets?/.test(t)) return eventTrigger('support-desk', 'new_ticket', 'New ticket')
  if (/e-?mails?|mail|inbox/.test(t)) return eventTrigger('mail', 'new_email', 'New email', /invoice|attach/.test(t) ? 'has:attachment' : undefined)
  if (/files?|folder|drive|upload/.test(t)) return eventTrigger('cloud-drive', 'new_file', 'New file in a folder')
  return null
}

function eventTrigger(connectorId: string, event: string, eventLabel: string, filter?: string): AgentTrigger {
  return { id: 'tr-event', kind: 'event', enabled: true, connectorId, event, eventLabel, ...(filter ? { filter } : {}) }
}

// Connectors a description names in passing: "…and puts them in a spreadsheet".
const CONNECTOR_WORDS: [RegExp, string][] = [
  [/\be-?mails?\b|\bmail\b|\binbox/, 'mail'],
  [/calendar|meetings?\b|schedule (a|the) meeting/, 'calendar'],
  [/spreadsheets?|\bsheets?\b|excel/, 'spreadsheets'],
  [/\bweb\b|websites?|online|internet/, 'web-browser'],
  [/\bdrive\b|\bfiles?\b|folders?|documents?/, 'cloud-drive'],
  [/\bwiki\b/, 'wiki'],
  [/\bchat\b|channel|slack-like|post (it|them) to/, 'team-chat'],
  [/\bcrm\b|deals?|accounts and contacts/, 'crm'],
  [/issues?|\bjobs\b|tracker/, 'issue-tracker'],
  [/\bcode\b|repositor|pull requests?/, 'code-repository'],
  [/tickets?|help ?desk/, 'support-desk'],
  [/transcripts?|meeting notes/, 'meeting-notes'],
]

function connectorsIn(text: string) {
  const t = lower(text)
  return CONNECTOR_WORDS.filter(([re]) => re.test(t)).map(([, id]) => id)
}

const connectorName = (id: string) => CONNECTORS.find((c) => c.id === id)?.name ?? id
const skillName = (id: string) => SAMPLE_SKILLS.find((s) => s.id === id)?.name ?? id
const baseName = (id: string) => SAMPLE_KNOWLEDGE_BASES.find((b) => b.id === id)?.name ?? id

// Every tool of a connector: reading on its own, writing or sending after asking.
function defaultTools(id: string): Record<string, ToolPermission> {
  const connector = CONNECTORS.find((c) => c.id === id)
  return Object.fromEntries((connector?.tools ?? []).map((t) => [t.name, t.kind === 'write' ? 'ask' : 'always']))
}

function withTool(draft: AgentDraft, connectorId: string, tool: string, permission: ToolPermission) {
  const tools = { ...(draft.connectors[connectorId] ?? defaultTools(connectorId)), [tool]: permission }
  return { ...draft.connectors, [connectorId]: tools }
}

// Replaces the "## heading" part of the instructions, or adds it at the end.
function setSection(text: string, heading: string, body: string) {
  const lines = text.trim().split('\n')
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase())
  if (start === -1) return `${text.trim()}\n\n## ${heading}\n${body}`.trim()
  let end = lines.findIndex((l, i) => i > start && /^#{1,2} /.test(l))
  if (end === -1) end = lines.length
  return [...lines.slice(0, start), `## ${heading}`, body, '', ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

const sectionOf = (text: string, heading: string) => {
  const m = text.match(new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n#{1,2} |$)`, 'i'))
  return m?.[1].trim() ?? ''
}

function when(r: Recurrence) {
  const words = describeRecurrence(r)
  return words.charAt(0).toLowerCase() + words.slice(1)
}

function triggerWords(t: AgentTrigger) {
  if (t.kind === 'schedule') return when(t.recurrence)
  if (t.kind === 'event') return `when there’s a ${t.eventLabel.toLowerCase()} in ${connectorName(t.connectorId)}${t.filter ? ` (${t.filter})` : ''}`
  return 'when you ask'
}

const scheduleOf = (draft: AgentDraft) => draft.triggers.find((t): t is Extract<AgentTrigger, { kind: 'schedule' }> => t.kind === 'schedule')
const replaceTrigger = (draft: AgentDraft, trigger: AgentTrigger) => [...draft.triggers.filter((t) => t.kind !== trigger.kind), trigger]

// Asks, does it itself, or never: for a tool that sends or writes.
function permissionFrom(answer: string): ToolPermission {
  const t = lower(answer)
  if (/(itself|on its own|by itself|without asking|don'?t (need to )?ask|automatic|just send|go ahead|send them)/.test(t)) return 'always'
  if (/(never|drafts? only|only drafts?|leave (a )?drafts?|don'?t send|no repl|not send|i'?ll send)/.test(t)) return 'off'
  return 'ask'
}

const PERMISSION_WORDS: Record<ToolPermission, string> = {
  always: 'sends them itself',
  ask: 'asks you before sending each one',
  off: 'only writes drafts, and never sends',
}

// ['a', 'b', 'c'] → "a, b and c".
function joinWords(items: string[]) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

// The agent's name from a description that starts with what it does:
// "Summarises new emails in my inbox" → "Email summariser".
const DOERS: [RegExp, string][] = [
  [/\bsummar/, 'summariser'], [/\bplan/, 'planner'], [/\btrack/, 'tracker'], [/\bremind/, 'reminder'],
  [/\btranslat/, 'translator'], [/\b(draft|write|writes|writing)\b/, 'writer'], [/\breview/, 'reviewer'],
  [/\bschedul/, 'scheduler'], [/\b(sort|organis|organiz|tidy|tidies)/, 'organiser'], [/\b(answer|repl)/, 'helper'],
  [/\bcheck/, 'checker'], [/\bcoach/, 'coach'], [/\bteach|tutor|explain/, 'tutor'],
]
const THINGS: [RegExp, string][] = [
  [/\b(e-?mails?|inbox)\b/, 'Email'], [/\bmeetings?\b/, 'Meeting'], [/\bnotes\b/, 'Notes'], [/\btasks?\b/, 'Task'],
  [/\b(blog|posts?|articles?)\b/, 'Blog'], [/\bcode\b/, 'Code'], [/\b(data|numbers)\b/, 'Data'], [/\bleads?\b/, 'Lead'],
  [/\bexpenses?\b/, 'Expense'], [/\btravel|trips?\b/, 'Travel'], [/\b(meals?|recipes?)\b/, 'Meal'], [/\bnews\b/, 'News'],
]

function doerName(text: string) {
  const t = lower(text)
  const doer = DOERS.find(([re]) => re.test(t))?.[1]
  if (!doer) return null
  const thing = THINGS.find(([re]) => re.test(t))?.[1]
  return thing ? `${thing} ${doer}` : capitalise(doer)
}

// ---------------------------------------------------------------------------
// The seven kinds of agent

// "…, call it Penny" → "Penny".
function calledName(text: string) {
  const call = text.match(/\b(?:call(?:ed)? it|name(?:d)? it|named)\s+["“']?([^"”'.!?,\n]{2,40})/i)
  return call ? capitalise(call[1].trim()) : null
}

function genericName(text: string) {
  const called = calledName(text)
  if (called) return called
  const noun = text.match(/\b(?:an?|the|my)\s+((?:[a-z-]+\s){0,2}?[a-z-]+?)\s+(?:that|who|which|to|for|helping)\b/i)
  if (noun && !/^(agent|assistant|bot|gpt)$/i.test(noun[1])) return capitalise(noun[1])
  return doerName(text) ?? 'My assistant'
}

function sentence(text: string) {
  const first = text.trim().split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, '')
  const cut = first.length > 120 ? `${first.slice(0, 117).trimEnd()}…` : first
  return `${capitalise(cut)}.`
}

function profile(topic: Topic, text: string): Profile {
  switch (topic) {
    case 'invoices': return {
      name: 'Invoice clerk',
      icon: Invoice01Icon,
      colour: 'var(--chart-2)',
      description: 'Reads supplier emails, files each invoice in a spreadsheet and flags the ones that need a look.',
      summary: 'It reads supplier emails, takes the details off each invoice, adds them to a spreadsheet and flags anything that doesn’t match a purchase order.',
      instructions: `You are the invoice clerk for the finance team. Your job is to turn supplier emails into tidy, checked records, so nobody has to type an invoice in by hand.

## For each invoice
1. Find emails from suppliers with an invoice attached (PDF or image).
2. Read the invoice: supplier, invoice number, invoice date, due date, currency, amount before tax, tax and total.
3. Add one row per invoice to the invoice register. Never add the same invoice number twice.

## Checks
- Match each invoice to its purchase order, and flag any line that differs by more than 2%.
- Flag invoices due within 7 days, and any from a supplier you haven’t seen before.
- Use the **Invoice checks** skill for approval limits.

## How to answer
Keep it short: a table of what you filed, then a list of anything that needs a person. Never pay, approve or delete anything.`,
      starters: ['File the invoices from this week’s emails', 'Which invoices are due in the next 7 days?', 'Check INV-20418 against its purchase order', 'Show this month’s totals by supplier'],
      connectors: ['mail', 'spreadsheets', 'cloud-drive'],
      skills: ['sk-invoices', 'sk-sheets'],
      knowledgeBases: [],
      event: { connectorId: 'mail', event: 'new_email', eventLabel: 'New email', filter: 'has:attachment' },
      questions: [
        {
          ask: () => '**Which folder or label should it watch for invoices?** For example *Suppliers* or *Accounts › Invoices*.',
          apply: (draft, answer) => {
            const folder = SKIP.test(answer) ? 'Inbox' : cleanName(answer).replace(/\s+(folder|label)$/i, '') || 'Inbox'
            return {
              patch: {
                triggers: replaceTrigger(draft, eventTrigger('mail', 'new_email', 'New email', `label:"${folder}" has:attachment`)),
                instructions: setSection(draft.instructions, 'Where to look', `Only read emails in **${folder}** that have an attachment. Leave every other email alone.`),
              },
              updated: ['Triggers', 'Instructions'],
              ack: `It will watch **${folder}**, and start a run each time a new email with an attachment lands there.`,
            }
          },
        },
        {
          ask: () => '**Which spreadsheet should it file them in?** A name is enough, such as *Invoice register 2026*.',
          apply: (draft, answer) => {
            const sheet = SKIP.test(answer) ? 'Invoice register' : cleanName(answer).replace(/ (spreadsheet|sheet)$/i, '') || 'Invoice register'
            return {
              patch: { instructions: setSection(draft.instructions, 'Where to file', `Add rows to the **${sheet}** spreadsheet, on its first sheet, keeping its columns in order. Look for an existing row with the same invoice number first.`) },
              updated: ['Instructions'],
              ack: `Invoices will go into **${sheet}**, one row each.`,
            }
          },
        },
        {
          ask: () => '**Should it ask before replying to suppliers, or send replies itself?** It can also never send, and leave drafts for you.',
          apply: (draft, answer) => {
            const permission = SKIP.test(answer) ? 'ask' : permissionFrom(answer)
            return {
              patch: {
                connectors: withTool(draft, 'mail', 'send_message', permission),
                instructions: setSection(draft.instructions, 'Replying to suppliers', permission === 'off'
                  ? 'Don’t send email. When a supplier needs an answer (a missing PO number, a wrong amount), write a draft reply and say so.'
                  : 'When a supplier needs an answer (a missing PO number, a wrong amount), write a short, polite reply that names the invoice number.'),
              },
              updated: ['Tools', 'Instructions'],
              ack: `For replies to suppliers, it ${PERMISSION_WORDS[permission]}.`,
            }
          },
        },
      ],
    }

    case 'report': return {
      name: 'Weekly operations report',
      icon: Analytics01Icon,
      colour: 'var(--chart-4)',
      description: 'Writes the weekly operations report from the job tracker and shares it with the team.',
      summary: 'It reads the week’s jobs from the Issue Tracker and the hours and costs from a spreadsheet, then writes a one-page report with the numbers that changed.',
      instructions: `You write the weekly operations report. Readers are busy managers: they should know in a minute what went well, what is late and what needs a decision.

## What goes in
- Jobs opened and closed this week, against the week before
- Overdue jobs, with their owners and how late they are
- Blocked jobs, and what they are waiting for
- The three biggest risks for next week

## How to write it
Start with a two-line headline. Then a table of the numbers with the change on last week, then short bullets. One page at most. Refer to every job by its number.

## Where the numbers come from
Jobs from the **Issue Tracker**; hours and costs from **Spreadsheets**. Never change a job; only read.`,
      starters: ['Write this week’s operations report', 'What changed since last week?', 'Which jobs are overdue, and who owns them?', 'Turn the report into three slides'],
      connectors: ['issue-tracker', 'spreadsheets', 'team-chat'],
      skills: ['sk-analysis', 'sk-slides'],
      knowledgeBases: [],
      questions: [
        {
          ask: (draft) => {
            const s = scheduleOf(draft)
            if (!s) return '**Should it run on its own each week?** Say a day and time, such as *Monday at 9am*, or *only when I ask*.'
            const day = s.recurrence.kind === 'weekly' && s.recurrence.days?.length ? capitalise(DAY_NAMES[s.recurrence.days[0]]) : 'each run'
            return `**What time on ${day} should it run?** It’s set for ${s.recurrence.time} (Singapore time) for now.`
          },
          apply: (draft, answer) => {
            const s = scheduleOf(draft)
            if (NO_SCHEDULE.test(answer)) {
              return { patch: { triggers: draft.triggers.filter((t) => t.kind !== 'schedule') }, updated: ['Triggers'], ack: 'No schedule, then: it runs only when someone asks.' }
            }
            const trigger = scheduleTrigger(parseSchedule(answer) ?? {}, s?.recurrence) as Extract<AgentTrigger, { kind: 'schedule' }>
            return { patch: { triggers: replaceTrigger(draft, trigger) }, updated: ['Triggers'], ack: `It will run **${when(trigger.recurrence)}**.` }
          },
        },
        {
          ask: () => '**Who reads it?** It can post the report in a Team Chat channel, such as *#operations*, or save it as a file in Cloud Drive.',
          apply: (draft, answer) => {
            const channel = answer.match(/#[\w-]+/)?.[0]
            if (channel || /channel|chat|post/i.test(answer) || SKIP.test(answer)) {
              const name = channel ?? '#operations'
              return {
                patch: {
                  connectors: withTool(draft, 'team-chat', 'post_message', 'ask'),
                  instructions: setSection(draft.instructions, 'Sharing it', `Post the report in **${name}** in Team Chat, with the headline as the first line. Ask before posting.`),
                },
                updated: ['Tools', 'Instructions'],
                ack: `It will post the report in **${name}**, after asking you.`,
              }
            }
            const { ['team-chat']: _chat, ...rest } = draft.connectors
            return {
              patch: {
                connectors: { ...rest, 'cloud-drive': { ...defaultTools('cloud-drive'), create_file: 'always' } },
                instructions: setSection(draft.instructions, 'Sharing it', 'Save each report as a new document in Cloud Drive, named “Operations report, week of …”, and share the link here.'),
              },
              updated: ['Tools', 'Instructions'],
              ack: 'It will save each report as a document in **Cloud Drive** instead of posting it. I took Team Chat off.',
            }
          },
        },
        {
          ask: () => '**Which numbers matter most?** For example jobs closed, overdue jobs, hours logged or cost against budget.',
          apply: (draft, answer) => {
            const items = SKIP.test(answer) ? ['Jobs closed', 'Overdue jobs', 'Hours logged'] : listOf(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Numbers to lead with', `${bullets(items)}\n\nPut these first in the table, in this order.`) },
              updated: ['Instructions'],
              ack: `The report will lead with ${joinWords(items.map((i) => i.toLowerCase()))}.`,
            }
          },
        },
      ],
    }

    case 'support': return {
      name: 'Support triage',
      icon: CustomerSupportIcon,
      colour: 'var(--chart-3)',
      description: 'Reads new support tickets, sets their priority and team, and drafts a first reply.',
      summary: 'It reads each new ticket, sets its priority and team, and drafts a first reply from the support playbook and product docs.',
      instructions: `You triage the support queue. Every new ticket should have a priority, a team and a first reply within minutes, so customers never wait in silence.

## For each new ticket
1. Read the ticket and the customer’s last three tickets.
2. Set the priority: **Urgent** (an outage or lost data), **High** (a customer is blocked), **Normal**, or **Low** (questions and ideas).
3. Set the team: Billing, Technical or Account.
4. Draft a first reply from the **Support playbook** and **Product documentation**, and link the article you used.

## Escalate
Urgent tickets, a customer’s third reply on the same problem, refunds over $500, and anything about security or the law.

## Tone
Warm and plain. No blame, no jargon. Always say what happens next and when.`,
      starters: ['Triage the tickets that came in overnight', 'Draft a reply to the newest urgent ticket', 'Which customers have waited more than a day?', 'Summarise this week’s ticket themes'],
      connectors: ['support-desk', 'team-chat'],
      skills: ['sk-email'],
      knowledgeBases: ['kb-support', 'kb-docs'],
      event: { connectorId: 'support-desk', event: 'new_ticket', eventLabel: 'New ticket' },
      questions: [
        {
          ask: () => '**Should it reply to customers itself, or only draft replies for your team to send?**',
          apply: (draft, answer) => {
            const permission = SKIP.test(answer) ? 'ask' : /draft|team|agent|we send|review/i.test(answer) && !/itself|on its own/i.test(answer) ? 'off' : permissionFrom(answer)
            return {
              patch: {
                connectors: withTool(draft, 'support-desk', 'reply_to_ticket', permission),
                instructions: setSection(draft.instructions, 'Replies', permission === 'off'
                  ? 'Never send a reply. Leave your draft as an internal note on the ticket for the team to send.'
                  : permission === 'always'
                    ? 'Send the first reply yourself when the answer is in the playbook. Leave anything else as an internal note.'
                    : 'Write the first reply, then ask before sending it.'),
              },
              updated: ['Tools', 'Instructions'],
              ack: `For replies to customers, it ${PERMISSION_WORDS[permission]}.`,
            }
          },
        },
        {
          ask: () => '**When a ticket is urgent, who should hear about it?** A Team Chat channel such as *#support-escalations*, or a person.',
          apply: (draft, answer) => {
            const who = SKIP.test(answer) ? '#support-escalations' : answer.match(/#[\w-]+/)?.[0] ?? cleanName(answer)
            return {
              patch: {
                connectors: withTool(draft, 'team-chat', 'post_message', 'always'),
                instructions: setSection(draft.instructions, 'Who to tell', `Tell **${who}** in Team Chat straight away about an urgent ticket: the customer, the problem in one line and the ticket link.`),
              },
              updated: ['Tools', 'Instructions'],
              ack: `Urgent tickets go to **${who}** in Team Chat. It posts those without asking, since speed matters; change that in Configure if you’d rather approve each one.`,
            }
          },
        },
        {
          ask: () => '**Is there anything it must always hand to a person?** For example refunds, legal threats or security reports.',
          apply: (draft, answer) => {
            const items = SKIP.test(answer) || /^no(thing)?\b/i.test(answer) ? ['Refunds', 'Legal threats', 'Security reports'] : listOf(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Always hand to a person', `${bullets(items)}\n\nFor these, don’t draft an answer: assign the ticket to a team lead and say why.`) },
              updated: ['Instructions'],
              ack: `It will hand ${joinWords(items.map((i) => i.toLowerCase()))} straight to a person.`,
            }
          },
        },
      ],
    }

    case 'research': return {
      name: 'Competitor watch',
      icon: BinocularsIcon,
      colour: 'var(--chart-5)',
      description: 'Follows competitors’ websites and news, and writes a short brief on what changed.',
      summary: 'It visits competitors’ public pages, compares them with last time, and writes a short brief with a link for every claim.',
      instructions: `You keep the team up to date on competitors. You read only public pages and say plainly what changed and why it matters to us.

## Each time
1. Visit each competitor’s home, pricing, product and careers pages, and search the news for their name.
2. Compare with your last brief. Note pricing changes, launches, hiring, partnerships and notable reviews.
3. Ignore anything older than 30 days.

## The brief
A one-line headline, then a table (competitor, what changed, why it matters), then three things we might do about it. Link every claim. Mark a guess as a guess.

## Limits
Never sign in anywhere, fill in a form or contact anyone.`,
      starters: ['What changed at our competitors this week?', 'Compare their pricing pages with ours', 'Write a one-page brief on the newest launch', 'Which competitor is hiring fastest?'],
      connectors: ['web-browser', 'wiki'],
      skills: ['sk-analysis'],
      knowledgeBases: [],
      questions: [
        {
          ask: () => '**Which competitors should it follow?** A few names or websites is enough.',
          apply: (draft, answer) => {
            const names = SKIP.test(answer) ? ['Quillstone', 'Larkspur Labs', 'Tidewell'] : listOf(answer)
            return {
              patch: {
                instructions: setSection(draft.instructions, 'Who to follow', bullets(names)),
                starters: [`What’s new at ${names[0]}?`, ...draft.starters.filter((s) => !s.startsWith('What’s new at')).slice(0, 3)],
              },
              updated: ['Instructions', 'Conversation starters'],
              ack: `It will follow ${joinWords(names)}.`,
            }
          },
        },
        {
          ask: () => '**What should it look for first?** Pricing, launches, hiring, reviews, or all of them.',
          apply: (draft, answer) => {
            const items = SKIP.test(answer) || /\ball\b/i.test(answer) ? ['Pricing', 'Launches', 'Hiring', 'Reviews'] : listOf(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Look for', `${bullets(items)}\n\nLead the brief with these, in this order.`) },
              updated: ['Instructions'],
              ack: `Briefs will lead with ${joinWords(items.map((i) => i.toLowerCase()))}.`,
            }
          },
        },
        {
          ask: () => '**Where should each brief go?** A Wiki page, a document in Cloud Drive, or just this chat.',
          apply: (draft, answer) => {
            const t = lower(answer)
            const nudge = scheduleOf(draft) ? '' : ' Say *every Friday at 4pm* if you’d like it to run on its own.'
            if (/drive|doc|file/.test(t)) {
              return {
                patch: {
                  connectors: { ...draft.connectors, 'cloud-drive': { ...defaultTools('cloud-drive'), create_file: 'ask' } },
                  instructions: setSection(draft.instructions, 'Where it goes', 'Save each brief as a document in Cloud Drive, named “Competitor brief, …” with the date.'),
                },
                updated: ['Tools', 'Instructions'],
                ack: `Briefs will be saved in **Cloud Drive**, after asking.${nudge}`,
              }
            }
            if (/chat|here|nowhere|just/.test(t) && !/wiki/.test(t)) {
              const { wiki: _wiki, ...rest } = draft.connectors
              return {
                patch: { connectors: rest, instructions: setSection(draft.instructions, 'Where it goes', 'Answer in the chat. Don’t save the brief anywhere.') },
                updated: ['Tools', 'Instructions'],
                ack: `Briefs will stay in the chat, so I took the Wiki off.${nudge}`,
              }
            }
            return {
              patch: {
                connectors: withTool(draft, 'wiki', 'create_page', 'ask'),
                instructions: setSection(draft.instructions, 'Where it goes', 'Add each brief as a new Wiki page under **Market › Competitors**, and link it in the chat.'),
              },
              updated: ['Tools', 'Instructions'],
              ack: `Each brief becomes a **Wiki** page under Market › Competitors, after asking.${nudge}`,
            }
          },
        },
      ],
    }

    case 'contracts': return {
      name: 'Contract reviewer',
      icon: LegalDocument01Icon,
      colour: 'var(--chart-1)',
      description: 'Reads contracts before you sign, flags risky clauses and suggests changes.',
      summary: 'It reads a contract clause by clause, rates each risk and explains it in plain words, so you know what to push back on before you sign.',
      instructions: `You review contracts before anyone signs them. You are not a lawyer: you find what deserves a lawyer’s eye, and say so in plain words.

## How to review
1. Read the whole contract. Note the parties, the term, renewal, notice period and total value.
2. Go clause by clause with the **Contract review** skill. Rate each risk High, Medium or Low.

## Always flag
- Unlimited liability, or a cap below the contract’s value
- Auto-renewal with more than 30 days’ notice
- Payment terms over 45 days
- Exclusivity, and any assignment of our intellectual property

## The answer
A summary table first, then each flagged clause: the words quoted, the risk, and why. End with: “This is not legal advice.” Never sign, send or accept anything.`,
      starters: ['Review the attached contract', 'What are the riskiest clauses in this agreement?', 'Compare this contract with our standard terms', 'Write a short summary for the sales team'],
      connectors: ['cloud-drive', 'mail'],
      permissions: { mail: { send_message: 'off' }, 'cloud-drive': { create_file: 'off', share_file: 'off' } },
      skills: ['sk-contracts'],
      knowledgeBases: [],
      questions: [
        {
          ask: () => '**Which side are you usually on: buyer, seller, or both?**',
          apply: (draft, answer) => {
            const t = lower(answer)
            const side = /both/.test(t) || SKIP.test(answer) ? 'both' : /sell|vendor|supplier|provider/.test(t) ? 'seller' : 'buyer'
            const body = side === 'both'
              ? 'We are sometimes the buyer and sometimes the seller. Work out which from the parties, say it first, and judge every clause from our side.'
              : `We are usually the **${side}**. Judge every clause from the ${side}’s side.`
            return { patch: { instructions: setSection(draft.instructions, 'Our side', body) }, updated: ['Instructions'], ack: side === 'both' ? 'It will work out which side you’re on from each contract.' : `It will read every clause as the **${side}**.` }
          },
        },
        {
          ask: () => '**Which clauses should it check first?** For example liability caps, auto-renewal or payment terms.',
          apply: (draft, answer) => {
            const items = SKIP.test(answer) ? ['Liability caps', 'Auto-renewal', 'Payment terms'] : listOf(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Check first', `${bullets(items)}\n\nCover these at the top of every review, even when they look fine.`) },
              updated: ['Instructions'],
              ack: `Every review will start with ${joinWords(items.map((i) => i.toLowerCase()))}.`,
            }
          },
        },
        {
          ask: () => '**Should it suggest new wording, or only point out the risks?**',
          apply: (draft, answer) => {
            const redline = !/only|just|point|risks? only|no wording|don'?t/i.test(answer) || /both|wording|redline|suggest/i.test(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Changes', redline ? 'For each High or Medium risk, suggest new wording we could send back, as a redline: the old words struck through, the new words after them.' : 'Point out the risks only. Don’t suggest new wording.') },
              updated: ['Instructions'],
              ack: redline ? 'It will suggest new wording for every High and Medium risk.' : 'It will point out the risks and leave the wording to you.',
            }
          },
        },
      ],
    }

    case 'onboarding': return {
      name: 'Onboarding buddy',
      icon: UserAdd01Icon,
      colour: 'var(--status-done)',
      description: 'Answers new hires’ questions, walks them through their first weeks and books their intro meetings.',
      summary: 'It answers new hires’ questions from the HR policies and the wiki, keeps them on track with their first weeks, and books their intro meetings.',
      instructions: `You help new colleagues through their first weeks. Be friendly and patient: no question is too small, and nobody should feel lost.

## What you do
- Answer questions about leave, expenses, equipment and tools from **HR policies** and the Wiki. Link the page you used.
- Keep a checklist for their first weeks and remind them of what’s next.
- Suggest who to meet in their first two weeks, and find a time with them.

## Limits
Pay, contracts and anything personal go to HR: say so kindly and give the HR contact. Never share anything about another employee.`,
      starters: ['What should I do in my first week?', 'How do I claim expenses?', 'Who should I meet in my first two weeks?', 'Where do I find the holiday calendar?'],
      connectors: ['wiki', 'calendar', 'team-chat'],
      skills: ['sk-email'],
      knowledgeBases: ['kb-hr'],
      questions: [
        {
          ask: () => '**Who will talk to it: new hires themselves, or their managers?**',
          apply: (draft, answer) => {
            const t = lower(answer)
            const who = /both/.test(t) ? 'both' : /manager|lead/.test(t) ? 'managers' : 'new hires'
            const body = who === 'managers'
              ? 'You talk to managers getting a new hire started. Tell them what to prepare and when, and remind them of what their new hire needs this week.'
              : who === 'both'
                ? 'You talk to new hires and to their managers. Ask who you’re talking to if it isn’t clear.'
                : 'You talk to new hires themselves. Use their first name and keep answers short.'
            return { patch: { instructions: setSection(draft.instructions, 'Who you talk to', body) }, updated: ['Instructions'], ack: `It will talk to **${who === 'both' ? 'new hires and their managers' : who}**.` }
          },
        },
        {
          ask: () => '**What should a new hire have done by the end of week one?**',
          apply: (draft, answer) => {
            const items = SKIP.test(answer) ? ['Laptop set up and signed in everywhere', 'Met their manager and team', 'Read the handbook', 'First small task done'] : listOf(answer)
            return {
              patch: { instructions: setSection(draft.instructions, 'Week one', `By the end of week one:\n${bullets(items)}\n\nCheck in on Wednesday and Friday with what’s left.`) },
              updated: ['Instructions'],
              ack: `Week one now has ${items.length} things to tick off, and it checks in on Wednesday and Friday.`,
            }
          },
        },
        {
          ask: () => '**Should it book intro meetings itself, or suggest times first?**',
          apply: (draft, answer) => {
            const permission: ToolPermission = /itself|book them|go ahead|on its own|just book/i.test(answer) ? 'always' : 'ask'
            return {
              patch: { connectors: withTool(draft, 'calendar', 'create_event', permission) },
              updated: ['Tools'],
              ack: permission === 'always' ? 'It will book intro meetings itself.' : 'It will suggest times and ask before booking anything.',
            }
          },
        },
      ],
    }

    case 'generic': {
      const name = genericName(text)
      return {
        name,
        icon: SparklesIcon,
        colour: 'var(--brand)',
        description: sentence(text),
        summary: `I started from your words, “${sentence(text).replace(/\.$/, '')}”, and gave it a few house rules.`,
        instructions: `${name === 'My assistant' ? 'You are a helpful assistant.' : `Your name is **${name}**.`} ${sentence(text)}

## How to help
- Ask one short question when a request is unclear, rather than guessing.
- Put the most useful part first, in plain words. Use a list or a table when it helps.
- Say when you’re not sure, and how to check.`,
        starters: ['What can you help me with?', 'Help me get started', 'Give me three ideas to try this week', 'Check what I’ve written'],
        connectors: [],
        skills: [],
        knowledgeBases: [],
        questions: [
          {
            ask: () => '**Who will use it, and what will they ask most often?**',
            apply: (draft, answer) => SKIP.test(answer)
              ? { patch: {}, updated: [], ack: 'I’ll keep it general for now.' }
              : {
                patch: { instructions: setSection(draft.instructions, 'Who you help', capitalise(answer.trim().replace(/[.!?]*$/, '.'))) },
                updated: ['Instructions'],
                ack: 'Got it: I’ve written who it helps into its instructions.',
              },
          },
          {
            ask: () => '**What tone should it take?** Friendly, formal, brief, or something else.',
            apply: (draft, answer) => {
              const tone = SKIP.test(answer) ? 'friendly and clear' : lower(answer.trim().replace(/[.!?]+$/, ''))
              return {
                patch: { instructions: setSection(draft.instructions, 'Tone', `Be ${tone}.`) },
                updated: ['Instructions'],
                ack: `It will be ${tone}.`,
              }
            },
          },
          {
            ask: () => '**Is there anything it should never do?**',
            apply: (draft, answer) => /^(no|nope|nothing|none)\b/i.test(answer) || SKIP.test(answer)
              ? { patch: {}, updated: [], ack: 'No limits beyond the usual, then.' }
              : {
                patch: { instructions: setSection(draft.instructions, 'Never', bullets(listOf(answer).map((i) => i.replace(/^Never /i, ''))) ) },
                updated: ['Instructions'],
                ack: 'Noted: those limits are in its instructions.',
              },
          },
        ],
      }
    }
  }
}

// ---------------------------------------------------------------------------
// One turn

function firstVersion(draft: AgentDraft, text: string): { reply: string; patch: Partial<AgentDraft>; updated: string[] } {
  const topic = classify(text)
  const p = profile(topic, text)
  const name = calledName(text) ?? p.name

  const ids = [...new Set([...p.connectors, ...connectorsIn(text)])].filter((id) => CONNECTORS.some((c) => c.id === id))
  const connectors = Object.fromEntries(ids.map((id) => [id, { ...defaultTools(id), ...p.permissions?.[id] }]))

  const triggers: AgentTrigger[] = []
  const schedule = parseSchedule(text)
  if (schedule || (topic === 'report' && /\bweek(ly)?\b/i.test(text))) triggers.push(scheduleTrigger(schedule ?? { kind: 'weekly', days: [1] }))
  const event = parseEvent(text) ?? (p.event && /\b(new|when|whenever|as they|arrive|incoming)\b/i.test(text)
    ? eventTrigger(p.event.connectorId, p.event.event, p.event.eventLabel, p.event.filter)
    : null)
  if (event) triggers.push(event)
  for (const t of triggers) if (t.kind === 'event' && !connectors[t.connectorId]) connectors[t.connectorId] = defaultTools(t.connectorId)

  const next: AgentDraft = {
    ...draft,
    name,
    icon: p.icon,
    colour: p.colour,
    description: p.description,
    instructions: p.instructions,
    starters: p.starters,
    knowledgeBases: p.knowledgeBases,
    connectors,
    skills: p.skills,
    triggers,
  }

  const lines = [
    Object.keys(connectors).length > 0 && `- **Tools:** ${joinWords(Object.keys(connectors).map(connectorName))}. It reads on its own, and asks before it writes or sends.`,
    p.skills.length > 0 && `- **Skills:** ${joinWords(p.skills.map(skillName))}`,
    p.knowledgeBases.length > 0 && `- **Knowledge:** ${joinWords(p.knowledgeBases.map(baseName))}`,
    `- **Runs:** ${triggers.length ? triggers.map(triggerWords).join(', and ') : 'when you ask'}`,
  ].filter(Boolean)

  const updated = [
    'Name', 'Icon', 'Description', 'Instructions', 'Conversation starters',
    p.knowledgeBases.length > 0 && 'Knowledge',
    Object.keys(connectors).length > 0 && 'Tools',
    p.skills.length > 0 && 'Skills',
    triggers.length > 0 && 'Triggers',
  ].filter((f): f is string => !!f)

  const reply = `${FIRST_VERSION} **${name}**. ${p.summary}\n\n${lines.join('\n')}\n\n${p.questions[0].ask(next)}`
  return { reply, patch: { ...next }, updated }
}

// A change asked for in so many words, at any point after the first version.
function command(draft: AgentDraft, text: string): Change | null {
  const rename = text.match(/\b(?:call it|name it|rename it(?: to)?|its name (?:is|should be)|change the name to)\s+["“']?([^"”'.!?\n]{2,40})/i)
  if (rename) {
    const name = capitalise(rename[1].trim())
    return { patch: { name }, updated: ['Name'], ack: `Renamed it **${name}**.` }
  }
  const tone = text.match(/\b(?:make it|be|sound|keep it)\s+(?:a bit |much |more |less )?(formal|friendly|casual|concise|brief|shorter|warmer|playful|professional|direct)\b/i)
  if (tone) {
    const word = lower(tone[1])
    return { patch: { instructions: setSection(draft.instructions, 'Tone', `Be ${word}.${/concise|brief|shorter/.test(word) ? ' Keep answers to a few lines unless asked for more.' : ''}`) }, updated: ['Instructions'], ack: `It will be more ${word === 'shorter' ? 'brief' : word} from now on.` }
  }
  if (/\b(only when (i|we) ask|no schedule|stop running|don'?t run it on its own|turn off the schedule)\b/i.test(text)) {
    return { patch: { triggers: draft.triggers.filter((t) => t.kind === 'manual') }, updated: ['Triggers'], ack: 'Triggers removed: it runs only when someone asks.' }
  }
  const schedule = /\b(run|runs|every|each|daily|weekly|monthly|at \d)/i.test(text) ? parseSchedule(text) : null
  if (schedule && (schedule.kind || /\brun/i.test(text))) {
    const trigger = scheduleTrigger(schedule, scheduleOf(draft)?.recurrence) as Extract<AgentTrigger, { kind: 'schedule' }>
    return { patch: { triggers: replaceTrigger(draft, trigger) }, updated: ['Triggers'], ack: `It will run **${when(trigger.recurrence)}**.` }
  }
  const event = parseEvent(text)
  if (event && event.kind === 'event') {
    return {
      patch: { triggers: replaceTrigger(draft, event), connectors: draft.connectors[event.connectorId] ? draft.connectors : { ...draft.connectors, [event.connectorId]: defaultTools(event.connectorId) } },
      updated: ['Triggers'],
      ack: `It will also start on its own ${triggerWords(event)}.`,
    }
  }
  const add = /\b(also|add|connect|give it|hook it up)\b|^(please )?use\b/i.test(text) ? connectorsIn(text).filter((id) => !draft.connectors[id] && CONNECTORS.some((c) => c.id === id)) : []
  if (add.length) {
    return {
      patch: { connectors: { ...draft.connectors, ...Object.fromEntries(add.map((id) => [id, defaultTools(id)])) } },
      updated: ['Tools'],
      ack: `Added ${add.map(connectorName).join(' and ')}: reading on its own, asking before it writes or sends.`,
    }
  }
  const drop = text.match(/\b(?:remove|drop|take off|no more|without)\s+(?:the\s+)?(.+)/i)
  if (drop) {
    const gone = connectorsIn(drop[1]).filter((id) => draft.connectors[id])
    if (gone.length) {
      return {
        patch: { connectors: Object.fromEntries(Object.entries(draft.connectors).filter(([id]) => !gone.includes(id))) },
        updated: ['Tools'],
        ack: `Took ${gone.map(connectorName).join(' and ')} off.`,
      }
    }
  }
  return null
}

const isRestart = (text: string) => /\b(start over|start again|scratch that|from scratch|forget (that|it))\b/i.test(text)

export function builderTurn(draft: AgentDraft, history: BuilderMessage[], text: string): { reply: string; patch: Partial<AgentDraft>; updated: string[] } {
  const said = text.trim()
  // The caller may have added the person's message already.
  const before = history.at(-1)?.role === 'user' && history.at(-1)?.text.trim() === said ? history.slice(0, -1) : history

  let anchor = -1
  before.forEach((m, i) => {
    if (m.role === 'builder' && (m.text.startsWith(FIRST_VERSION) || m.text.startsWith(RESTART))) anchor = i
  })
  const fresh = anchor === -1 || before[anchor].text.startsWith(RESTART)

  if (isRestart(said)) {
    const rest = said.replace(/^.*?\b(start over|start again|scratch that|from scratch|forget (that|it))\b[,.:;!\s-]*/i, '').replace(/^(instead|and|so|make it|make an?)\s+/i, '')
    if (rest.split(/\s+/).length >= 3) return firstVersion(cleared(draft), rest)
    return {
      reply: `${RESTART} I’ve cleared the name, instructions and tools. **What should the new agent do?**`,
      patch: { ...cleared(draft) },
      updated: ['Name', 'Description', 'Instructions', 'Tools'],
    }
  }

  if (fresh) {
    if (said.split(/\s+/).length < 3 && classify(said) === 'generic') {
      return {
        reply: 'Tell me a little more: **what should it do, and for whom?** For example, *“Reads supplier emails and files the invoices in our register.”*',
        patch: {},
        updated: [],
      }
    }
    return firstVersion(draft, said)
  }

  const description = before.slice(0, anchor).filter((m) => m.role === 'user').at(-1)?.text ?? draft.description
  const p = profile(classify(description), description)
  const stage = before.slice(anchor + 1).filter((m) => m.role === 'user').length + 1
  const questions = p.questions

  // A plain request wins over an answer; the pending question is then skipped.
  const asked = command(draft, said)
  const change = asked ?? (stage <= questions.length ? questions[stage - 1].apply(draft, said) : null)

  if (!change) {
    const instructions = setSection(draft.instructions, 'Also', [sectionOf(draft.instructions, 'Also'), `- ${capitalise(said.replace(/[.!?]*$/, '.'))}`].filter(Boolean).join('\n'))
    return {
      reply: 'Added that to its instructions. Try it in the **Preview** to see the difference, or tell me what else to change.',
      patch: { instructions },
      updated: ['Instructions'],
    }
  }

  const applied: AgentDraft = { ...draft, ...change.patch }
  let next = ''
  if (stage < questions.length) next = questions[stage].ask(applied)
  else if (stage === questions.length) {
    next = `**${applied.name || 'Your agent'} is ready to try.** Ask it something in the **Preview**: its conversation starters are a good start. When you’re happy, save it. You can keep telling me what to change, or fine-tune it yourself in **Configure**.`
  } else next = 'Anything else? Try it in the **Preview** to check.'

  return { reply: `${change.ack}\n\n${next}`, patch: change.patch, updated: change.updated }
}

// A clean draft that keeps who can see it and its model.
function cleared(draft: AgentDraft): AgentDraft {
  return { ...EMPTY_DRAFT, access: draft.access, model: draft.model }
}

// ---------------------------------------------------------------------------
// The preview's answers

// A reply in the agent's voice: what it would do with `text`, as it would
// look, and the connectors it would have used. Nothing is run.
export function previewReply(draft: AgentDraft, text: string): { text: string; tools: string[] } {
  if (!draft.name.trim() && !draft.instructions.trim()) {
    return { text: 'I don’t have any instructions yet. Describe me in **Create**, or write my instructions in **Configure**, then try me again.', tools: [] }
  }
  const has = (id: string) => !!draft.connectors[id] && Object.values(draft.connectors[id]).some((p) => p !== 'off')
  const using = (...ids: string[]) => ids.filter(has).map(connectorName)
  const q = lower(text)
  const topic = classify(`${draft.name} ${draft.description} ${draft.instructions.slice(0, 400)}`)
  const noTools = '\n\n*I have no connectors to use for this yet, so I can only work with what you paste here.*'
  const finish = (body: string, tools: string[]) => ({ text: tools.length ? body : body + noTools, tools })

  switch (topic) {
    case 'invoices': {
      const sheet = draft.instructions.match(/rows to the \*\*(.+?)\*\*/)?.[1] ?? 'invoice register'
      if (/due|overdue|next \d+|this week|pay/.test(q)) {
        return finish(`Three invoices are due in the next 7 days:

| Supplier | Invoice | Total | Due |
|---|---|---:|---|
| Harbor Supplies | INV-20418 | $1,240.00 | Thu 16 Oct |
| Blue Peak Logistics | BPL-7731 | $3,905.50 | Fri 17 Oct |
| Greenway Packaging | GP-1182 | $612.80 | Mon 20 Oct |

**Needs a look:** BPL-7731 is $85.50 more than its purchase order (PO-5530).`, using('spreadsheets'))
      }
      if (/check|match|purchase order|\bpo\b/.test(q)) {
        return finish(`**INV-20418** from Harbor Supplies against **PO-5512**:

- 4 of 5 lines match.
- Line 3, *Pallet wrap (50 rolls)*: invoiced at $14.20 a roll, ordered at $13.60. That’s **$30.00 more** (4.4%), over the 2% limit.

I’d hold it and ask Harbor Supplies to confirm the price.`, using('mail', 'spreadsheets', 'cloud-drive'))
      }
      return finish(`I’d search your mail for new supplier emails with invoices attached, read each one and add it to **${sheet}**. In this preview it would look like this:

| Supplier | Invoice | Total | Due | Status |
|---|---|---:|---|---|
| Harbor Supplies | INV-20418 | $1,240.00 | 16 Oct | Filed |
| Blue Peak Logistics | BPL-7731 | $3,905.50 | 17 Oct | Needs a look |
| Greenway Packaging | GP-1182 | $612.80 | 20 Oct | Filed |

**1 needs a person:** BPL-7731 doesn’t match its purchase order.`, using('mail', 'spreadsheets'))
    }
    case 'report':
      return finish(`**Operations, week of 6 October.** Throughput is up and overdue work is down, but two jobs are blocked on parts.

| | This week | Last week | Change |
|---|---:|---:|---:|
| Jobs closed | 42 | 35 | +7 |
| Jobs opened | 38 | 40 | −2 |
| Overdue | 6 | 9 | −3 |
| Blocked | 2 | 1 | +1 |

- **Overdue:** JOB-318 (Sam Lee, 4 days), JOB-322 (Jo Tan, 2 days)
- **Blocked:** JOB-330 and JOB-334, waiting for replacement parts
- **Risk:** the fit-out at Dock 4 could slip a week if parts don’t arrive by Friday`, using('issue-tracker', 'spreadsheets'))
    case 'support':
      return finish(`I’d triage the 4 tickets that came in overnight:

| Ticket | Customer | Priority | Team |
|---|---|---|---|
| #4821 | Brightline Studio | **Urgent**: can’t sign in, whole team | Technical |
| #4822 | Kessler & Co | High: invoice shows the wrong plan | Billing |
| #4824 | Moreno Bakery | Normal: how to export orders | Technical |
| #4825 | Atlas Fitness | Low: idea for dark mode | Account |

**Draft reply for #4821:** “Hi Dana, thanks for letting us know. We can see the sign-in problem too and the team is on it now; I’ll update you within the hour.”`, using('support-desk', 'team-chat'))
    case 'research':
      return finish(`**This week:** one competitor cut prices and another launched an AI feature.

| Competitor | What changed | Why it matters |
|---|---|---|
| Quillstone | Starter plan down from $29 to $19 | Undercuts our entry price |
| Larkspur Labs | Launched “Auto-reports” in beta | Close to what we plan for Q1 |
| Tidewell | 12 new engineering roles | Likely a bigger push next year |

**What we might do:** review the entry price, bring the reports work forward, and watch Tidewell’s launches.`, using('web-browser', 'wiki'))
    case 'contracts':
      return finish(`Here’s how a review would read. Attach a contract, or name one in Cloud Drive, for a real one.

| Clause | Risk | Why |
|---|---|---|
| 9.2 Liability | **High** | Capped at fees for one month, below the contract’s value |
| 3.1 Renewal | **Medium** | Renews for 12 months unless cancelled 90 days before |
| 6.4 Payment | Low | 30 days, in line with our terms |

**Suggested change to 9.2:** “…liability is capped at ~~one month’s~~ **twelve months’** fees.”

*This is not legal advice.*`, using('cloud-drive'))
    case 'onboarding':
      return finish(`Welcome! Here’s your first week:

1. **Monday:** pick up your laptop, sign in everywhere, and have lunch with your team
2. **Tuesday:** read the handbook (the **Leave** and **Expenses** pages first)
3. **Wednesday:** meet your manager for your 30-60-90 day plan
4. **Thursday and Friday:** your first small task, with your buddy

Shall I find 30 minutes with your manager on Wednesday?`, using('wiki', 'calendar'))
    default: {
      const tools = Object.keys(draft.connectors).filter(has).map(connectorName)
      return {
        text: `Happy to help with that. Here’s how I’d go about *“${text.trim().slice(0, 80)}”*:\n\n1. Check what you need and ask if anything is unclear\n2. Do the work${tools.length ? ` with ${tools.join(' and ')}` : ''}\n3. Give you the result first, then the details\n\nWant me to start?`,
        tools,
      }
    }
  }
}
