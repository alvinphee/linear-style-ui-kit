import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, AiBrain02Icon, BalanceScaleIcon, Calculator01Icon, Clock01Icon, CodeIcon, Copy01Icon, FileViewIcon,
  FlashIcon, Globe02Icon, RefreshIcon, Search01Icon, Share08Icon, ThumbsDownIcon, ThumbsUpIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AiLabel } from '@/components/ai-label'
import { FileChip } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import {
  ActivityLine, Elapsed, PulseDot, ShimmerText, StreamCaret, Thinking, TypingDots, type ThinkingIndicator,
} from '@/components/thinking-indicator'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  AssistantMessage, FeedbackDialog, FollowUps, MessageActions, SourcesRow, UserMessage, type Feedback,
} from '@/blocks/ai/chat-message'
import { Markdown, type Citation } from '@/blocks/ai/markdown'
import { PromptBox, type PromptMode, type PromptModel } from '@/blocks/ai/prompt-box'
import {
  ApprovalCard, ThinkingTrail, type ApprovalChange, type ApprovalDecision, type TrailStep,
} from '@/blocks/ai/thinking-trail'
import { CodeBlock, Demos, Gallery, Playground, Variants, bool, imports, jsx, str } from './Playground'

// The kit's AI building blocks: the small components (label, thinking
// indicator, icon action, file chip) and the blocks they make up (thinking
// trail, approval card, chat messages, Markdown, prompt box). All content is
// made up.

/* ---------- Snippet helpers ---------- */

const pick = (...names: (string | false | undefined)[]) => names.filter((n): n is string => Boolean(n))
// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)
// Indents every non-empty line.
const indent = (text: string, by = '  ') => text.replace(/^(?=.)/gm, by)

// A value as a JavaScript literal, single-quoted: { status: 'overdue' }.
function lit(value: unknown): string {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  if (Array.isArray(value)) return `[${value.map(lit).join(', ')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : lit(k)}: ${lit(v)}`)
    return entries.length ? `{ ${entries.join(', ')} }` : '{}'
  }
  return String(value)
}

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

// A JSX element with one prop per line, for props too long for jsx().
function element(tag: string, attrs: (string | false | undefined)[], children?: string) {
  const open = `<${tag}\n${pick(...attrs).map((a) => indent(a)).join('\n')}\n`
  return children ? `${open}>\n${indent(children)}\n</${tag}>` : `${open}/>`
}

// A snippet that needs state is wrapped in a small component.
function component(name: string, state: string[], body: string) {
  if (!state.length) return body
  return `function ${name}() {\n${indent(state.join('\n'))}\n  return (\n${indent(body, '    ')}\n  )\n}`
}

/* ---------- Preview helpers ---------- */

// The time a preview mounted, for timers that count from "now".
const useSince = () => useState(Date.now)[0]

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => toast.error('Copy failed', { description: 'Your browser blocked the clipboard.' }))
}

// A card under text-heavy previews, so they read well over the dot grid.
// It is an @container, for the blocks' @sm / @md details.
function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-card @container w-full min-w-0 rounded-lg border p-4 shadow-xs', className)}>{children}</div>
}

// A fixed example (no props pane) with its code one click away.
function Example({ title, note, code, children }: { title: string; note?: string; code: string; children: ReactNode }) {
  const [showCode, setShowCode] = useState(false)
  return (
    <article aria-label={title} className="bg-card min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b py-1.5 pr-1.5 pl-3.5">
        <h3 className="text-xs font-medium">{title} <span className="text-muted-foreground font-normal">example</span></h3>
        <div className="flex min-w-0 items-center gap-2">
          {note && <span className="text-muted-foreground hidden truncate text-[11px] sm:inline">{note}</span>}
          <Button variant={showCode ? 'secondary' : 'ghost'} size="sm" aria-pressed={showCode} onClick={() => setShowCode(!showCode)}>
            <HugeiconsIcon icon={CodeIcon} strokeWidth={2} data-icon="inline-start" />
            {showCode ? 'Hide code' : 'Show code'}
          </Button>
        </div>
      </header>
      <div className="@container min-w-0 p-4 sm:p-6">{children}</div>
      {showCode && <CodeBlock code={code} className="rounded-none border-0 border-t" />}
    </article>
  )
}

/* ---------- AI label ---------- */

function AiLabelDemos() {
  return (
    <Gallery
      title="AI label"
      note="Put it on anything a model wrote or proposed"
      items={[
        { label: 'default', node: <AiLabel /> },
        { label: 'AI suggests', node: <AiLabel>AI suggests</AiLabel> },
        { label: 'Understood as', node: <AiLabel>Understood as</AiLabel> },
        {
          label: 'beside a heading',
          node: <span className="flex items-center gap-1.5 text-xs font-medium">Summary <AiLabel /></span>,
        },
        {
          label: 'on a suggestion',
          node: (
            <span className="bg-card flex h-7 items-center gap-2 rounded-md border px-2 text-xs">
              <AiLabel>AI suggests</AiLabel>
              <span className="text-muted-foreground">Priority</span>
              <span className="font-medium">High</span>
            </span>
          ),
        },
      ]}
    />
  )
}

/* ---------- Thinking indicator ---------- */

const INDICATORS = ['sparkle', 'dot', 'spinner', 'dots', 'none'] as const satisfies readonly ThinkingIndicator[]

function ThinkingPreview({ indicator, label, elapsed }: { indicator: ThinkingIndicator; label?: string; elapsed: boolean }) {
  const since = useSince()
  return <Thinking indicator={indicator} label={label} since={elapsed ? since : undefined} />
}

function ActivityPreview() {
  const since = useSince()
  return <ActivityLine text="Reading INV-2026-0409" since={since} className="max-w-60" />
}

function ElapsedPreview() {
  const since = useSince()
  return <span className="text-muted-foreground text-xs"><Elapsed since={since} /></span>
}

function ThinkingDemos() {
  return (
    <>
      <Playground
        title="Thinking indicator"
        description="One status line while the AI works"
        controls={[
          { kind: 'select', name: 'indicator', label: 'Indicator', options: INDICATORS, initial: 'sparkle' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Searching invoices…' },
          { kind: 'switch', name: 'elapsed', label: 'Show elapsed', initial: true },
        ]}
        render={(v) => (
          <ThinkingPreview
            // A fresh timer each time Show elapsed is turned on.
            key={String(bool(v, 'elapsed'))}
            indicator={str(v, 'indicator') as ThinkingIndicator}
            label={str(v, 'label') || undefined}
            elapsed={bool(v, 'elapsed')}
          />
        )}
        code={(v) => {
          const elapsed = bool(v, 'elapsed')
          const label = str(v, 'label')
          const head = imports({
            react: elapsed ? ['useState'] : [],
            '@/components/thinking-indicator': ['Thinking'],
          })
          const body = jsx('Thinking', {
            indicator: unless(str(v, 'indicator'), 'sparkle'),
            label: label === 'Thinking…' ? undefined : label,
            since: elapsed ? '{startedAt}' : undefined,
          })
          return `${head}\n\n${component('WorkingStatus', elapsed ? ['const [startedAt] = useState(Date.now)'] : [], body)}`
        }}
      />

      <Gallery
        title="Working signs"
        note="The pieces Thinking is made of, from @/components/thinking-indicator"
        items={[
          { label: 'ShimmerText', node: <ShimmerText className="text-xs font-medium">Searching customer invoices…</ShimmerText> },
          { label: 'PulseDot', node: <span className="flex h-5 items-center"><PulseDot /></span> },
          { label: 'TypingDots', node: <TypingDots /> },
          { label: 'StreamCaret line', node: <p className="text-[13px]">The overdue total is<StreamCaret /></p> },
          { label: 'StreamCaret block', node: <p className="text-xs">Suggested reply<StreamCaret variant="block" /></p> },
          { label: 'ActivityLine', node: <ActivityPreview /> },
          { label: 'Elapsed', node: <ElapsedPreview /> },
        ]}
      />
    </>
  )
}

/* ---------- Icon action ---------- */

const ACTIONS = ['copy', 'regenerate', 'thumbs up', 'thumbs down', 'share'] as const
type ActionName = (typeof ACTIONS)[number]

const ACTION_ICONS: Record<ActionName, { icon: IconSvgElement; name: string; label: string }> = {
  copy: { icon: Copy01Icon, name: 'Copy01Icon', label: 'Copy' },
  regenerate: { icon: RefreshIcon, name: 'RefreshIcon', label: 'Regenerate' },
  'thumbs up': { icon: ThumbsUpIcon, name: 'ThumbsUpIcon', label: 'Good reply' },
  'thumbs down': { icon: ThumbsDownIcon, name: 'ThumbsDownIcon', label: 'Bad reply' },
  share: { icon: Share08Icon, name: 'Share08Icon', label: 'Share' },
}

function IconActionDemos() {
  return (
    <>
      <Playground
        title="Icon action"
        description="Hover for the tooltip, which is also its name"
        controls={[
          { kind: 'select', name: 'icon', label: 'Icon', options: ACTIONS, initial: 'copy' },
          { kind: 'text', name: 'label', label: 'Label (blank: the icon’s)', initial: '' },
          { kind: 'switch', name: 'pressed', label: 'Pressed', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const label = str(v, 'label') || action.label
          return (
            <IconAction
              label={label}
              icon={action.icon}
              pressed={bool(v, 'pressed') || undefined}
              disabled={bool(v, 'disabled')}
              onClick={demo(label)}
            />
          )
        }}
        code={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const head = imports({
            '@hugeicons/core-free-icons': [action.name],
            '@/components/icon-action': ['IconAction'],
          })
          const body = jsx('IconAction', {
            label: str(v, 'label') || action.label,
            icon: `{${action.name}}`,
            onClick: '{handleClick}',
            pressed: bool(v, 'pressed'),
            disabled: bool(v, 'disabled'),
          })
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="Icon action states"
        note="Pass icon, or children for anything else"
        items={[
          { label: 'rest', node: <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} /> },
          { label: 'pressed', node: <IconAction label="Good reply" icon={ThumbsUpIcon} pressed onClick={demo('Good reply')} /> },
          { label: 'disabled', node: <IconAction label="Regenerate" icon={RefreshIcon} disabled onClick={demo('Regenerate')} /> },
          { label: 'children', node: <IconAction label="Working" onClick={demo('Working')}><Spinner /></IconAction> },
          {
            label: 'a reply bar',
            node: (
              <div className="flex gap-0.5">
                <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} />
                <IconAction label="Regenerate" icon={RefreshIcon} onClick={demo('Regenerate')} />
                <IconAction label="Good reply" icon={ThumbsUpIcon} onClick={demo('Good reply')} />
                <IconAction label="Bad reply" icon={ThumbsDownIcon} onClick={demo('Bad reply')} />
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

/* ---------- File chip ---------- */

const FILE_NAMES = ['report.pdf', 'sales.xlsx', 'notes.md', 'photo.png', 'app.tsx'] as const

const FILE_SIZES: Record<(typeof FILE_NAMES)[number], number> = {
  'report.pdf': 2_516_582,
  'sales.xlsx': 49_152,
  'notes.md': 820,
  'photo.png': 1_258_291,
  'app.tsx': 6_144,
}

function FileChipDemos() {
  return (
    <>
      <Variants
        title="File chip"
        note="name × removable · the icon follows the extension"
        rows={{ name: 'name', values: FILE_NAMES }}
        cols={{ name: 'removable', values: ['off', 'on'] as const }}
        render={(name, removable) => (
          <FileChip
            name={name}
            size={FILE_SIZES[name]}
            onRemove={removable === 'on' ? demo(`Removed ${name}`) : undefined}
          />
        )}
      />

      <Gallery
        title="File chip details"
        items={[
          { label: 'no size', node: <FileChip name="contract.docx" /> },
          { label: 'long name truncates', node: <FileChip name="q3-board-meeting-notes-final-v2.md" size={14_336} className="max-w-48" /> },
          { label: 'unknown type', node: <FileChip name="backup.bin" size={8_912_896} /> },
        ]}
      />
    </>
  )
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
    '@/blocks/ai/thinking-trail': ['ThinkingTrail', 'type TrailStep'],
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
            '@/blocks/ai/thinking-trail': ['ApprovalCard', 'type ApprovalDecision'],
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
        onCopy={copyText}
        onEdit={(text) => toast('Edited and sent again', { description: text })}
      />
      <AssistantMessage
        name="Assistant"
        meta="Balanced"
        actions={
          <div className="grid gap-3">
            <MessageActions
              onCopy={() => copyText(CHAT_REPLY)}
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
  '@/blocks/ai/chat-message': [
    'AssistantMessage', 'FeedbackDialog', 'FollowUps', 'MessageActions', 'SourcesRow', 'UserMessage', 'type Feedback',
  ],
  '@/blocks/ai/markdown': ['Markdown'],
  '@/blocks/ai/thinking-trail': ['ThinkingTrail'],
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
        const head = imports({ '@/blocks/ai/markdown': cites ? ['Markdown', 'type Citation'] : ['Markdown'] })
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
          '@/blocks/ai/prompt-box': models ? ['PromptBox', 'type PromptModel'] : ['PromptBox'],
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
          "onSubmit={(text) => toast('Sent', { description: text })}",
        ])
        return `${head}\n\n${modelList}${component('Composer', state, body)}`
      }}
    />
  )
}

export default function AiFeaturesDemos() {
  return (
    <Demos>
      <AiLabelDemos />
      <ThinkingDemos />
      <IconActionDemos />
      <FileChipDemos />
      <TrailDemos />
      <ChatDemos />
      <MarkdownDemos />
      <PromptBoxDemos />
    </Demos>
  )
}
