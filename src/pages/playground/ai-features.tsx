import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain01Icon, AiBrain02Icon, BalanceScaleIcon, Calculator01Icon, Clock01Icon, FileViewIcon, FlashIcon,
  Globe02Icon, Search01Icon, SparklesIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { StreamCaret } from '@/components/ai/thinking-indicator'
import { Button } from '@/components/ui/button'
import { AiSummaryCard, SummaryBullets, type SummaryPhase } from '@/blocks/ai/ai-summary-card'
import {
  AssistantMessage, FeedbackDialog, FollowUps, MessageActions, SourcesRow, UserMessage, type Feedback,
} from '@/blocks/ai/chat/chat-message'
import { PromptBox, type PromptMode, type PromptModel } from '@/blocks/ai/chat/prompt-box'
import {
  ApprovalCard, ThinkingTrail, type ApprovalChange, type ApprovalDecision, type TrailStep,
} from '@/blocks/ai/reasoning/thinking-trail'
import { Markdown, type Citation } from '@/blocks/markdown'
import { copyText } from '@/lib/clipboard'
import {
  Demos, Example, Playground, Surface, bool, component, element, imports, indent, jsx, lit, pick, str,
} from './Playground'

// The kit's AI blocks: thinking trail, approval card, AI summary card, chat
// messages, Markdown and prompt box. The small AI components they are made
// of (AI label, thinking indicator, icon action, file chip) have their own
// page, ai-components. All content is made up.

/* ---------- Snippet helpers ---------- */

// An object literal whose "key: value," parts are packed into lines of `width`.
function wrapObject(parts: string[], width = 84) {
  const lines: string[] = []
  for (const part of parts) {
    const last = lines[lines.length - 1]
    if (last !== undefined && last.length + part.length + 1 <= width) lines[lines.length - 1] = `${last} ${part}`
    else lines.push(part)
  }
  return `{\n${indent(lines.join('\n'))}\n}`
}

/* ---------- Preview helpers ---------- */

// The time a preview mounted, for timers that count from "now".
const useSince = () => useState(Date.now)[0]

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

// The chat's Copy buttons show their own tick, so only a failure toasts.
const copyQuietly = (text: string) => {
  void copyText(text, { success: false })
}

/* ---------- Thinking trail and approval card ---------- */

const TRAIL_STATES = ['live', 'done', 'error', 'stopped'] as const
type TrailState = (typeof TRAIL_STATES)[number]

const REASONING: TrailStep = {
  id: 'think',
  kind: 'thinking',
  status: 'done',
  label: 'They want this month’s overdue invoices and the total owed. I’ll search open invoices past their due date, open the largest one, then add them up.',
  ms: 2300,
}

// Made-up tool calls, all finished. buildTrail sets where the run is.
const TOOLS: TrailStep[] = [
  {
    id: 'search', kind: 'tool', status: 'done', label: 'Searched customer invoices', activeLabel: 'Searching customer invoices',
    detail: '“overdue”', icon: Search01Icon, ms: 1400, summary: '3 invoices', name: 'search_invoices',
    input: { status: 'overdue', dueBefore: '2026-10-01' },
    output: { count: 3, ids: ['INV-2026-0409', 'INV-2026-0415', 'INV-2026-0421'] },
  },
  {
    id: 'read', kind: 'tool', status: 'done', label: 'Read', activeLabel: 'Reading', detail: 'INV-2026-0409',
    icon: FileViewIcon, ms: 600, summary: '$6,200.00', name: 'read_invoice',
    input: { id: 'INV-2026-0409' },
    output: { customer: 'Northwind Traders', amount: 6200, currency: 'USD', dueDate: '2026-09-13', daysLate: 18 },
  },
  {
    id: 'total', kind: 'tool', status: 'done', label: 'Calculated overdue total', activeLabel: 'Calculating overdue total',
    icon: Calculator01Icon, ms: 900, summary: '$12,940.00', name: 'run_report',
    input: { metric: 'sum(amount)', where: { status: 'overdue' } },
    output: { total: 12940, currency: 'USD', invoices: 3 },
  },
  {
    id: 'history', kind: 'tool', status: 'done', label: 'Checked payment history', activeLabel: 'Checking payment history',
    detail: 'Northwind Traders', icon: Clock01Icon, ms: 1100, summary: '2 late payments', name: 'payment_history',
    input: { customer: 'Northwind Traders', months: 12 },
    output: { paid: 10, late: 2, averageDaysLate: 6 },
  },
]

// The trail's live line while each tool runs.
const TOOL_ACTIVITY: Record<string, string> = {
  search: 'Searching customer invoices…',
  read: 'Reading INV-2026-0409…',
  total: 'Calculating the overdue total…',
  history: 'Checking Northwind’s payment history…',
}

const TOOL_ICON_NAMES = new Map<unknown, string>([
  [Search01Icon, 'Search01Icon'],
  [FileViewIcon, 'FileViewIcon'],
  [Calculator01Icon, 'Calculator01Icon'],
  [Clock01Icon, 'Clock01Icon'],
])

// The trail for a state: the first `count` tool calls, the last of them
// running, failed or stopped (all done for "done").
function buildTrail(state: TrailState, count: number, io: boolean, reasoning: boolean, since: number) {
  const last = count - 1
  const tools = TOOLS.slice(0, count).map((tool, i): TrailStep => {
    const step: TrailStep = io ? { ...tool } : { ...tool, name: undefined, input: undefined, output: undefined }
    if (i < last || state === 'done') return step
    const unfinished = { ...step, output: undefined, summary: undefined }
    if (state === 'live') return { ...unfinished, status: 'running', ms: undefined, startedAt: since }
    if (state === 'error') return { ...unfinished, status: 'error', ms: 10_000, error: 'The billing service did not answer within 10s.' }
    // Stopped 0.7s in: the time counts toward "Stopped after".
    return { ...unfinished, status: 'stopped', ms: 700 }
  })
  const steps = reasoning ? [REASONING, ...tools] : tools
  return {
    steps,
    live: state === 'live',
    activity: state === 'live' ? TOOL_ACTIVITY[tools[last].id] : undefined,
  }
}

function stepCode(step: TrailStep) {
  const parts = Object.entries(step)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (key === 'icon') return `icon: ${TOOL_ICON_NAMES.get(value) ?? 'Wrench01Icon'},`
      if (key === 'startedAt') return 'startedAt,'
      return `${key}: ${lit(value)},`
    })
  return wrapObject(parts)
}

function trailCode(state: TrailState, count: number, io: boolean, reasoning: boolean) {
  const trail = buildTrail(state, count, io, reasoning, 0)
  const icons = [...new Set(trail.steps.map((s) => (s.icon ? TOOL_ICON_NAMES.get(s.icon) : undefined)))]
  const head = imports({
    react: trail.live ? ['useState'] : [],
    '@hugeicons/core-free-icons': pick(...icons).sort(),
    '@/blocks/ai/reasoning/thinking-trail': ['ThinkingTrail', 'type TrailStep'],
  })
  const steps = `const steps: TrailStep[] = [\n${trail.steps.map((s) => indent(`${stepCode(s)},`)).join('\n')}\n]`
  const body = jsx('div', { className: '@container' }, jsx('ThinkingTrail', {
    steps: '{steps}',
    live: trail.live ? true : '{false}',
    activity: trail.activity,
    startedAt: trail.live ? '{startedAt}' : undefined,
  }))
  if (!trail.live) return `${head}\n\n${steps}\n\n${body}`
  return `${head}\n\n${component('AgentTrail', ['const [startedAt] = useState(Date.now)', steps], body)}`
}

function TrailPreview({ state, count, io, reasoning }: { state: TrailState; count: number; io: boolean; reasoning: boolean }) {
  const since = useSince()
  const trail = buildTrail(state, count, io, reasoning, since)
  return (
    <Surface className="max-w-md">
      <ThinkingTrail
        steps={trail.steps}
        live={trail.live}
        activity={trail.activity}
        startedAt={trail.live ? since : undefined}
      />
    </Surface>
  )
}

const CHANGES: ApprovalChange[] = [
  { record: 'INV-2026-0409', title: 'Northwind Traders', field: 'Status', from: 'Overdue', to: 'Reminder sent' },
  { record: 'INV-2026-0415', title: 'Acme Corp', field: 'Status', from: 'Overdue', to: 'Reminder sent' },
  { record: 'INV-2026-0421', title: 'Globex', field: 'Status', from: 'Overdue', to: 'Reminder sent' },
]

const approvalDescription = (count: number) =>
  `${count ? `${count} overdue ${count === 1 ? 'invoice' : 'invoices'}. ` : ''}Each billing contact gets one short email.`

function ApprovalPreview({ initial, count }: { initial: ApprovalDecision; count: number }) {
  const [state, setState] = useState(initial)
  return (
    <div className="grid w-full max-w-lg min-w-0 justify-items-center gap-2">
      <div className="@container w-full min-w-0">
        <ApprovalCard
          title="Send payment reminders?"
          description={approvalDescription(count)}
          changes={CHANGES.slice(0, count)}
          state={state}
          onApprove={() => setState('approved')}
          onDeny={() => setState('denied')}
        />
      </div>
      {state !== initial && (
        <Button variant="link" size="xs" className="text-muted-foreground" onClick={() => setState(initial)}>Ask again</Button>
      )}
    </div>
  )
}

function TrailDemos() {
  return (
    <>
      <Playground
        title="Thinking trail"
        description="Live, it shimmers; done, it folds to one line"
        controls={[
          { kind: 'select', name: 'state', label: 'State', options: TRAIL_STATES, initial: 'live' },
          { kind: 'select', name: 'steps', label: 'Steps', options: ['1', '2', '3', '4'], initial: '3' },
          { kind: 'switch', name: 'io', label: 'Tool input and output', initial: true },
          { kind: 'switch', name: 'reasoning', label: 'Reasoning', initial: true },
        ]}
        render={(v) => (
          <TrailPreview
            // A fresh timer for each run.
            key={`${str(v, 'state')}-${str(v, 'steps')}`}
            state={str(v, 'state') as TrailState}
            count={Number(str(v, 'steps'))}
            io={bool(v, 'io')}
            reasoning={bool(v, 'reasoning')}
          />
        )}
        code={(v) => trailCode(str(v, 'state') as TrailState, Number(str(v, 'steps')), bool(v, 'io'), bool(v, 'reasoning'))}
      />

      <Playground
        title="Approval card"
        description="The agent asks before it changes anything"
        controls={[
          { kind: 'select', name: 'state', label: 'State', options: ['pending', 'approved', 'denied'], initial: 'pending' },
          { kind: 'select', name: 'changes', label: 'Changes', options: ['0', '1', '2', '3'], initial: '2' },
        ]}
        render={(v) => (
          <ApprovalPreview
            key={`${str(v, 'state')}-${str(v, 'changes')}`}
            initial={str(v, 'state') as ApprovalDecision}
            count={Number(str(v, 'changes'))}
          />
        )}
        code={(v) => {
          const count = Number(str(v, 'changes'))
          const head = imports({
            react: ['useState'],
            '@/blocks/ai/reasoning/thinking-trail': ['ApprovalCard', 'type ApprovalDecision'],
          })
          const body = element('ApprovalCard', [
            'title="Send payment reminders?"',
            `description="${approvalDescription(count)}"`,
            count > 0 && `changes={[\n${CHANGES.slice(0, count).map((c) => indent(`${lit(c)},`)).join('\n')}\n]}`,
            'state={state}',
            "onApprove={() => setState('approved')}",
            "onDeny={() => setState('denied')}",
          ])
          const state = `const [state, setState] = useState<ApprovalDecision>('${str(v, 'state')}')`
          return `${head}\n\n${component('ReminderApproval', [state], `<div className="@container">\n${indent(body)}\n</div>`)}`
        }}
      />
    </>
  )
}

/* ---------- AI summary card ---------- */

const SUMMARY_PHASES = ['idle', 'thinking', 'streaming', 'done'] as const satisfies readonly SummaryPhase[]
const SUMMARY_FEEDBACK = ['none', 'up', 'down'] as const
type SummaryFeedback = 'up' | 'down' | null

const SUMMARY_LABEL = 'AI summary of INV-2026-0409'
const SUMMARY_THINKING = 'Reading the invoice and its payments…'
const SUMMARY_NOTE = 'Written just now from 4 sources'
const SUMMARY_IDLE = 'Get three quick points on this invoice: what is owed, what happened last and what to do next.'
const SUMMARY_STALE = ['Out of date', 'A payment was recorded since it was written.'] as const

const SUMMARY_POINTS = [
  'Northwind Traders owes $6,200.00 on this invoice, now 18 days past its due date.',
  'A payment reminder went out on 20 September, with no reply so far.',
  'They paid late twice this year, by 6 days on average, but always in full. The policy says to call after 14 days.',
]

const SUMMARY_WORDS = SUMMARY_POINTS.reduce((n, point) => n + point.split(' ').length, 0)
const SUMMARY_TICK_MS = 70
// About two seconds on the whole summary before it streams again.
const SUMMARY_PAUSE_TICKS = 28

// The points as far as the first `shown` words, the caret after the last one.
function streamedPoints(shown: number): ReactNode[] {
  let left = shown
  const parts = SUMMARY_POINTS.map((point) => {
    const words = point.split(' ')
    const take = Math.max(0, Math.min(words.length, left))
    left -= words.length
    return words.slice(0, take).join(' ')
  }).filter(Boolean)
  return parts.map((text, i) => (i === parts.length - 1 ? <>{text}<StreamCaret /></> : text))
}

// Streams the points a word at a time, rests on the whole text, then starts again.
function StreamingPoints() {
  const [shown, setShown] = useState(1)
  useEffect(() => {
    let tick = 1
    const timer = window.setInterval(() => {
      tick = tick >= SUMMARY_WORDS + SUMMARY_PAUSE_TICKS ? 1 : tick + 1
      setShown(Math.min(tick, SUMMARY_WORDS))
    }, SUMMARY_TICK_MS)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="grid min-w-0">
      {/* The whole text, hidden, holds the height so the card does not jump while it streams. */}
      <div aria-hidden="true" className="invisible col-start-1 row-start-1 min-w-0">
        <SummaryBullets items={SUMMARY_POINTS} />
      </div>
      <SummaryBullets items={streamedPoints(shown)} className="col-start-1 row-start-1" />
    </div>
  )
}

function SummaryPreview({ phase, stale, footerAction, initialFeedback }: {
  phase: SummaryPhase
  stale: boolean
  footerAction: boolean
  initialFeedback: SummaryFeedback
}) {
  const [feedback, setFeedback] = useState(initialFeedback)
  return (
    <div className="w-full max-w-md min-w-0">
      <AiSummaryCard
        label={SUMMARY_LABEL}
        phase={phase}
        idle={(
          <div className="grid justify-items-start gap-2.5 py-1">
            <p className="text-muted-foreground text-xs">{SUMMARY_IDLE}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast('Summarise', { description: 'Demo only. Set Phase to thinking or streaming for the next steps.' })}
            >
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" className="text-brand" />
              Summarise
            </Button>
          </div>
        )}
        thinkingLabel={SUMMARY_THINKING}
        stale={stale && (
          <>
            <span className="font-medium">{SUMMARY_STALE[0]}</span>
            <span className="text-muted-foreground">{SUMMARY_STALE[1]}</span>
          </>
        )}
        note={SUMMARY_NOTE}
        footerAction={footerAction && <Button variant="outline" size="sm" onClick={demo('Ask a follow-up')}>Ask a follow-up</Button>}
        feedback={feedback}
        onFeedback={setFeedback}
        onStop={demo('Stopped')}
        onRegenerate={demo('Regenerating the summary')}
        onCopy={() => {
          void copyText(SUMMARY_POINTS.map((point) => `- ${point}`).join('\n'), { success: 'Summary copied' })
        }}
      >
        {phase === 'streaming' ? <StreamingPoints /> : <SummaryBullets items={SUMMARY_POINTS} />}
      </AiSummaryCard>
    </div>
  )
}

// Each phase shows the props it uses; Stale and Footer action add theirs.
function summaryCode(phase: SummaryPhase, stale: boolean, footerAction: boolean, feedback: SummaryFeedback) {
  const idle = phase === 'idle'
  const streaming = phase === 'streaming'
  const done = phase === 'done'
  const head = imports({
    react: done ? ['useState'] : [],
    '@hugeicons/react': idle ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': idle ? ['SparklesIcon'] : [],
    '@/components/ai/thinking-indicator': streaming ? ['StreamCaret'] : [],
    '@/components/ui/button': idle || footerAction ? ['Button'] : [],
    '@/blocks/ai/ai-summary-card': done || streaming ? ['AiSummaryCard', 'SummaryBullets'] : ['AiSummaryCard'],
  })
  const points = done
    ? `const points = [\n${SUMMARY_POINTS.map((point) => indent(`${lit(point)},`)).join('\n')}\n]\n\n`
    : streaming ? '// points: the text streamed so far, one string per point.\n\n' : ''
  const body = element('AiSummaryCard', [
    `label="${SUMMARY_LABEL}"`,
    `phase="${phase}"`,
    idle && [
      'idle={',
      '  <div className="grid justify-items-start gap-2.5 py-1">',
      `    <p className="text-muted-foreground text-xs">${SUMMARY_IDLE}</p>`,
      '    <Button variant="outline" size="sm" onClick={summarise}>',
      '      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" className="text-brand" />',
      '      Summarise',
      '    </Button>',
      '  </div>',
      '}',
    ].join('\n'),
    phase === 'thinking' && `thinkingLabel="${SUMMARY_THINKING}"`,
    stale && [
      'stale={',
      '  <>',
      `    <span className="font-medium">${SUMMARY_STALE[0]}</span>`,
      `    <span className="text-muted-foreground">${SUMMARY_STALE[1]}</span>`,
      '  </>',
      '}',
    ].join('\n'),
    done && `note="${SUMMARY_NOTE}"`,
    footerAction && 'footerAction={<Button variant="outline" size="sm" onClick={askFollowUp}>Ask a follow-up</Button>}',
    done && 'feedback={feedback}',
    done && 'onFeedback={setFeedback}',
    streaming && 'onStop={stop}',
    done && 'onRegenerate={regenerate}',
    done && 'onCopy={copy}',
  ], done
    ? '<SummaryBullets items={points} />'
    : streaming
      ? [
        '<SummaryBullets',
        '  items={points.map((point, i) => (',
        '    i === points.length - 1 ? <>{point}<StreamCaret /></> : point',
        '  ))}',
        '/>',
      ].join('\n')
      : undefined)
  const state = done ? [`const [feedback, setFeedback] = useState<'up' | 'down' | null>(${feedback ? lit(feedback) : 'null'})`] : []
  return `${head}\n\n${points}${component('InvoiceSummary', state, body)}`
}

function SummaryCardDemos() {
  return (
    <Playground
      title="AI summary card"
      description="Idle, thinking, streaming and done: the steps of writing one"
      controls={[
        { kind: 'select', name: 'phase', label: 'Phase', options: SUMMARY_PHASES, initial: 'done' },
        { kind: 'switch', name: 'stale', label: 'Stale', initial: false },
        { kind: 'switch', name: 'footerAction', label: 'Footer action', initial: false },
        { kind: 'select', name: 'feedback', label: 'Feedback', options: SUMMARY_FEEDBACK, initial: 'none' },
      ]}
      render={(v) => {
        const feedback = str(v, 'feedback')
        return (
          <SummaryPreview
            // The thumbs start from the Feedback control each time it changes.
            key={feedback}
            phase={str(v, 'phase') as SummaryPhase}
            stale={bool(v, 'stale')}
            footerAction={bool(v, 'footerAction')}
            initialFeedback={feedback === 'none' ? null : (feedback as 'up' | 'down')}
          />
        )
      }}
      code={(v) => {
        const feedback = str(v, 'feedback')
        return summaryCode(
          str(v, 'phase') as SummaryPhase,
          bool(v, 'stale'),
          bool(v, 'footerAction'),
          feedback === 'none' ? null : (feedback as 'up' | 'down'),
        )
      }}
    />
  )
}

/* ---------- Chat messages ---------- */

const CHAT_QUESTION = 'Which invoices are overdue this month, and how much is outstanding? The aging report is attached.'

const CHAT_SOURCES: Citation[] = [
  { title: 'Accounts receivable aging, September 2026', url: 'https://app.example.com/reports/ar-aging', domain: 'app.example.com' },
  { title: 'Northwind Traders: payment history', url: 'https://app.example.com/customers/northwind/payments', domain: 'app.example.com' },
  { title: 'Late payment policy', url: 'https://docs.example.com/finance/late-payments', domain: 'docs.example.com' },
]

const CHAT_REPLY = `You have **3 overdue invoices**, worth **$12,940.00** in total [1].

- **Northwind Traders** owes the most and is 18 days late. It has paid late twice this year [2].
- The policy is a reminder at 7 days and a call at 14 days [3], so Northwind is due a call.

| Invoice | Customer | Days late | Amount |
|---|---|---:|---:|
| INV-2026-0409 | Northwind Traders | 18 | 6,200.00 |
| INV-2026-0415 | Acme Corp | 9 | 4,320.00 |
| INV-2026-0421 | Globex | 3 | 2,420.00 |`

const CHAT_STEPS: TrailStep[] = [REASONING, ...TOOLS]

const FOLLOW_UPS = ['Draft the reminder emails', 'Show invoices due next week', 'Which customers pay late most often?']

const FEEDBACK_REASONS = ['Wrong numbers', 'Missed something', 'Too long', 'Not what I asked']

function ChatPreview() {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [asking, setAsking] = useState(false)
  return (
    <div className="mx-auto grid max-w-2xl min-w-0 gap-6">
      <UserMessage
        text={CHAT_QUESTION}
        attachments={[{ id: 'aging', name: 'aging-report.pdf', size: 248_000 }]}
        onCopy={copyQuietly}
        onEdit={(text) => toast('Edited and sent again', { description: text })}
      />
      <AssistantMessage
        name="Assistant"
        meta="Balanced"
        actions={
          <div className="grid gap-3">
            <MessageActions
              onCopy={() => copyQuietly(CHAT_REPLY)}
              onRegenerate={demo('Regenerating the reply')}
              feedback={feedback}
              onFeedback={(value) => {
                setFeedback(value ?? null)
                if (value === 'down') setAsking(true)
              }}
            />
            <FollowUps items={FOLLOW_UPS} onPick={(text) => toast('Asked', { description: text })} />
          </div>
        }
      >
        <ThinkingTrail steps={CHAT_STEPS} live={false} />
        <Markdown text={CHAT_REPLY} sources={CHAT_SOURCES} />
        <SourcesRow sources={CHAT_SOURCES} />
      </AssistantMessage>
      <FeedbackDialog
        open={asking}
        onOpenChange={setAsking}
        reasons={FEEDBACK_REASONS}
        onSubmit={(reasons, note) => {
          toast('Thanks for the feedback', { description: [...reasons, note.trim()].filter(Boolean).join(' · ') })
        }}
      />
    </div>
  )
}

const CHAT_CODE = `${imports({
  react: ['useState'],
  '@/blocks/ai/chat/chat-message': [
    'AssistantMessage', 'FeedbackDialog', 'FollowUps', 'MessageActions', 'SourcesRow', 'UserMessage', 'type Feedback',
  ],
  '@/blocks/ai/reasoning/thinking-trail': ['ThinkingTrail'],
  '@/blocks/markdown': ['Markdown'],
})}

// steps, reply and sources: see the Thinking trail and Markdown playgrounds.

function Chat() {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [asking, setAsking] = useState(false)
  return (
    <div className="@container grid gap-6">
      <UserMessage
        text="Which invoices are overdue this month?"
        attachments={[{ id: 'aging', name: 'aging-report.pdf', size: 248000 }]}
        onCopy={copy}
        onEdit={resend}
      />
      <AssistantMessage
        name="Assistant"
        meta="Balanced"
        actions={
          <div className="grid gap-3">
            <MessageActions
              onCopy={() => copy(reply)}
              onRegenerate={regenerate}
              feedback={feedback}
              onFeedback={(value) => {
                setFeedback(value ?? null)
                if (value === 'down') setAsking(true)
              }}
            />
            <FollowUps items={followUps} onPick={send} />
          </div>
        }
      >
        <ThinkingTrail steps={steps} live={false} />
        <Markdown text={reply} sources={sources} />
        <SourcesRow sources={sources} />
      </AssistantMessage>
      <FeedbackDialog open={asking} onOpenChange={setAsking} reasons={reasons} onSubmit={sendFeedback} />
    </div>
  )
}`

function ChatDemos() {
  return (
    <Example title="Chat messages" note="Thumbs down opens the feedback dialog" code={CHAT_CODE}>
      <ChatPreview />
    </Example>
  )
}

/* ---------- Markdown ---------- */

const SAMPLES = {
  list: `Here's where the quarter stands:

- Revenue is up **12%** on last quarter.
- Churn held at 1.8%, the same as in Q2.
- Two enterprise deals are waiting on legal review.

Next steps:

1. Send reminders for the 3 overdue invoices.
2. Call *Northwind Traders* about \`INV-2026-0409\`.

- [x] Export the aging report
- [ ] Share it with the finance team`,
  table: `Overdue invoices by customer:

| Customer | Invoices | Days late | Amount |
|---|---|---:|---:|
| Northwind Traders | 2 | 18 | 6,200.00 |
| Acme Corp | 1 | 9 | 4,320.00 |
| Globex | 1 | 3 | 2,420.00 |
| **Total** | 4 | | 12,940.00 |

Numbers line up on the right by themselves.`,
  'code block': `Here's a query that lists overdue invoices:

\`\`\`sql
select number, customer, due_date, amount
from invoices
where status = 'open'
  and due_date < current_date
order by due_date;
\`\`\`

Run it from **Reports**, or ask me to schedule it every Monday.`,
  citations: `Late payments drop when reminders go out before the due date [1]. Teams that send a short note three days early see about **20% fewer** overdue invoices [2].

> Keep the first reminder short, and link straight to the invoice [3].`,
} as const

type SampleName = keyof typeof SAMPLES
const SAMPLE_NAMES = Object.keys(SAMPLES) as SampleName[]

const MD_SOURCES: Citation[] = [
  { title: 'Payment reminders that get invoices paid', url: 'https://example.com/blog/payment-reminders', domain: 'example.com' },
  { title: 'Late payment benchmarks 2026', url: 'https://research.example.org/late-payments-2026', domain: 'research.example.org' },
  { title: 'Writing a good reminder email', url: 'https://help.example.com/articles/reminder-emails', domain: 'help.example.com' },
]

const CHARS_PER_TICK = 4
const PAUSE_TICKS = 50

// Replays `text` a few characters at a time, rests on the full text for two
// seconds, then starts again.
function StreamingMarkdown({ text, sources }: { text: string; sources?: Citation[] }) {
  const [length, setLength] = useState(0)
  useEffect(() => {
    const end = Math.ceil(text.length / CHARS_PER_TICK)
    let tick = 0
    const timer = window.setInterval(() => {
      tick = tick >= end + PAUSE_TICKS ? 0 : tick + 1
      setLength(Math.min(tick * CHARS_PER_TICK, text.length))
    }, 40)
    return () => window.clearInterval(timer)
  }, [text])
  return <Markdown text={text.slice(0, length)} streaming={length < text.length} sources={sources} />
}

function MarkdownPreview({ text, sources, streaming }: { text: string; sources?: Citation[]; streaming: boolean }) {
  return (
    <Surface className="grid max-w-lg">
      {streaming ? (
        <>
          {/* The full text, hidden, holds the height so the page does not jump while it streams. */}
          <div aria-hidden="true" className="invisible col-start-1 row-start-1 min-w-0">
            <Markdown text={text} sources={sources} />
          </div>
          <div className="col-start-1 row-start-1 min-w-0">
            <StreamingMarkdown key={text} text={text} sources={sources} />
          </div>
        </>
      ) : (
        <Markdown text={text} sources={sources} />
      )}
    </Surface>
  )
}

function MarkdownDemos() {
  return (
    <Playground
      title="Markdown"
      description="AI replies, rendered without injecting HTML"
      controls={[
        { kind: 'select', name: 'sample', label: 'Sample', options: SAMPLE_NAMES, initial: 'table' },
        { kind: 'switch', name: 'streaming', label: 'Streaming', initial: false },
      ]}
      render={(v) => {
        const sample = str(v, 'sample') as SampleName
        return (
          <MarkdownPreview
            text={SAMPLES[sample]}
            sources={sample === 'citations' ? MD_SOURCES : undefined}
            streaming={bool(v, 'streaming')}
          />
        )
      }}
      code={(v) => {
        const sample = str(v, 'sample') as SampleName
        const cites = sample === 'citations'
        const head = imports({ '@/blocks/markdown': cites ? ['Markdown', 'type Citation'] : ['Markdown'] })
        const reply = 'const reply = `' + SAMPLES[sample].replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${') + '`'
        const sources = cites ? `\n\nconst sources: Citation[] = [\n${MD_SOURCES.map((s) => indent(`${lit(s)},`)).join('\n')}\n]` : ''
        const body = jsx('Markdown', {
          text: '{reply}',
          streaming: bool(v, 'streaming'),
          sources: cites ? '{sources}' : undefined,
        })
        return `${head}\n\n${reply}${sources}\n\n${body}`
      }}
    />
  )
}

/* ---------- Prompt box ---------- */

const PROMPT_MODES: Omit<PromptMode, 'on'>[] = [
  { id: 'web', label: 'Web search', icon: Globe02Icon },
  { id: 'deep', label: 'Deep think', icon: AiBrain01Icon },
]

const PROMPT_MODELS: PromptModel[] = [
  { id: 'swift', name: 'Swift', icon: FlashIcon, description: 'Fastest. Short answers for quick questions.' },
  { id: 'balanced', name: 'Balanced', icon: BalanceScaleIcon, description: 'Good for most work.' },
  { id: 'depth', name: 'Depth', icon: AiBrain02Icon, description: 'Reasons step by step. Slower, more thorough.', badge: 'New' },
]

const MODEL_ICON_NAMES: Record<string, string> = { swift: 'FlashIcon', balanced: 'BalanceScaleIcon', depth: 'AiBrain02Icon' }

const modelCode = (m: PromptModel) =>
  `{ id: ${lit(m.id)}, name: ${lit(m.name)}, icon: ${MODEL_ICON_NAMES[m.id]}, description: ${lit(m.description)}${m.badge ? `, badge: ${lit(m.badge)}` : ''} }`

function PromptPreview({ placeholder, running, modes, models, attachments }: {
  placeholder?: string
  running: boolean
  modes: boolean
  models: boolean
  attachments: boolean
}) {
  const [on, setOn] = useState<Record<string, boolean>>({ web: false, deep: false })
  const [model, setModel] = useState('balanced')
  return (
    <div className="w-full max-w-xl min-w-0">
      <PromptBox
        placeholder={placeholder}
        running={running}
        onStop={() => toast('Stopped', { description: 'Demo only. The reply would end here.' })}
        modes={modes ? PROMPT_MODES.map((m) => ({ ...m, on: on[m.id] })) : undefined}
        onModeToggle={(id) => setOn((current) => ({ ...current, [id]: !current[id] }))}
        models={models ? PROMPT_MODELS : undefined}
        model={model}
        onModelChange={setModel}
        defaultModel="balanced"
        maxAttachments={attachments ? 5 : 0}
        onSubmit={(text, files) => {
          const description = [
            text && `“${text}”`,
            files.length > 0 && `${files.length} ${files.length === 1 ? 'file' : 'files'}: ${files.map((f) => f.name).join(', ')}`,
            models && PROMPT_MODELS.find((m) => m.id === model)?.name,
            modes && PROMPT_MODES.filter((m) => on[m.id]).map((m) => m.label).join(', '),
          ].filter(Boolean).join(' · ')
          toast('Sent', { description })
        }}
      />
    </div>
  )
}

function PromptBoxDemos() {
  return (
    <Playground
      title="Prompt box"
      description="Enter sends, Shift+Enter adds a line"
      controls={[
        { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Ask about invoices, customers or reports' },
        { kind: 'switch', name: 'running', label: 'Running', initial: false },
        { kind: 'switch', name: 'modes', label: 'Modes', initial: true },
        { kind: 'switch', name: 'models', label: 'Model picker', initial: true },
        { kind: 'switch', name: 'attachments', label: 'Attachments allowed', initial: true },
      ]}
      render={(v) => (
        <PromptPreview
          placeholder={str(v, 'placeholder') || undefined}
          running={bool(v, 'running')}
          modes={bool(v, 'modes')}
          models={bool(v, 'models')}
          attachments={bool(v, 'attachments')}
        />
      )}
      code={(v) => {
        const placeholder = str(v, 'placeholder')
        const running = bool(v, 'running')
        const modes = bool(v, 'modes')
        const models = bool(v, 'models')
        const head = imports({
          react: modes || models ? ['useState'] : [],
          '@hugeicons/core-free-icons': pick(
            modes && 'AiBrain01Icon', models && 'AiBrain02Icon', models && 'BalanceScaleIcon', models && 'FlashIcon', modes && 'Globe02Icon',
          ),
          sonner: ['toast'],
          '@/blocks/ai/chat/prompt-box': models ? ['PromptBox', 'type PromptModel'] : ['PromptBox'],
        })
        const modelList = models
          ? `const models: PromptModel[] = [\n${PROMPT_MODELS.map((m) => indent(`${modelCode(m)},`)).join('\n')}\n]\n\n`
          : ''
        const state = pick(
          modes && 'const [modes, setModes] = useState<Record<string, boolean>>({ web: false, deep: false })',
          models && "const [model, setModel] = useState('balanced')",
        )
        const body = element('PromptBox', [
          placeholder && `placeholder="${placeholder}"`,
          running && 'running',
          running && "onStop={() => toast('Stopped')}",
          modes && [
            'modes={[',
            "  { id: 'web', label: 'Web search', icon: Globe02Icon, on: modes.web },",
            "  { id: 'deep', label: 'Deep think', icon: AiBrain01Icon, on: modes.deep },",
            ']}',
          ].join('\n'),
          modes && 'onModeToggle={(id) => setModes((m) => ({ ...m, [id]: !m[id] }))}',
          models && 'models={models}',
          models && 'model={model}',
          models && 'onModelChange={setModel}',
          !bool(v, 'attachments') && 'maxAttachments={0}',
          // Braces: toast returns an id, and onSubmit may only return a boolean.
          "onSubmit={(text) => { toast('Sent', { description: text }) }}",
        ])
        return `${head}\n\n${modelList}${component('Composer', state, body)}`
      }}
    />
  )
}

export default function AiFeaturesDemos() {
  return (
    <Demos>
      <TrailDemos />
      <SummaryCardDemos />
      <ChatDemos />
      <MarkdownDemos />
      <PromptBoxDemos />
    </Demos>
  )
}
