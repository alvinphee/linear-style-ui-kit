import { useEffect, useState, type ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  AiBrain02Icon, AiChat02Icon, Calculator01Icon, ChartColumnIcon, Invoice01Icon, Mail01Icon, PackageIcon,
  ShoppingCart01Icon, SparklesIcon, Target02Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Thinking } from '@/components/thinking-indicator'
import { AssistantMessage, UserMessage } from '@/blocks/ai/chat-message'
import { ChatThread, ChatWelcome, PromptStarters, type PromptStarter } from '@/blocks/ai/chat-thread'
import { PromptBox } from '@/blocks/ai/prompt-box'
import { Markdown } from '@/blocks/markdown'
import { Demos, Gallery, Playground, bool, element, imports, indent, jsx, lit, pick, str, type Values } from './Playground'

// The chat screen's blocks: the welcome screen a new chat opens on, the
// thread that scrolls and follows a streaming reply, and the prompt starter
// cards. All content is made up.

/* ---------- Snippet helpers ---------- */

// A string prop: name="text", or name={'text'} when it holds a double quote.
const textProp = (name: string, value: string) => (value.includes('"') ? `${name}={${lit(value)}}` : `${name}="${value}"`)

/* ---------- Prompt starters ---------- */

type Starter = { icon: IconSvgElement; iconName: string; colour?: string; title: string; hint: string }

const STARTERS: Starter[] = [
  { icon: Invoice01Icon, iconName: 'Invoice01Icon', title: 'Summarise overdue invoices', hint: 'What is owed, by whom and how late' },
  { icon: Mail01Icon, iconName: 'Mail01Icon', title: 'Draft a payment reminder', hint: 'To Northwind Traders about INV-2026-0409' },
  { icon: ChartColumnIcon, iconName: 'ChartColumnIcon', title: 'Compare revenue by quarter', hint: 'This year against last, as a table' },
  { icon: UserGroupIcon, iconName: 'UserGroupIcon', title: 'Find customers who pay late', hint: 'Average days late over 12 months' },
]

// One per module, each icon in its module's colour, as a copilot would offer.
const MODULE_STARTERS: Starter[] = [
  { icon: Target02Icon, iconName: 'Target02Icon', colour: 'var(--chart-1)', title: 'Opportunities closing this month', hint: 'CRM' },
  { icon: ShoppingCart01Icon, iconName: 'ShoppingCart01Icon', colour: 'var(--chart-2)', title: 'Sales orders waiting to ship', hint: 'Sales' },
  { icon: PackageIcon, iconName: 'PackageIcon', colour: 'var(--chart-3)', title: 'Items below their reorder point', hint: 'Inventory' },
  { icon: Calculator01Icon, iconName: 'Calculator01Icon', colour: 'var(--chart-4)', title: 'Vendor bills due this week', hint: 'Accounting' },
]

function starterItems(list: Starter[], hints = true): PromptStarter[] {
  return list.map(({ icon, colour, title, hint }) => ({
    id: title,
    icon,
    colour,
    title,
    hint: hints ? hint : undefined,
    onSelect: () => toast(title, { description: 'Demo only. This would start a chat with it.' }),
  }))
}

// Narrow enough for a phone, so the cards sit in one column here.
function StarterBox({ children }: { children: ReactNode }) {
  return <div className="@container w-72">{children}</div>
}

function StartersDemos() {
  return (
    <Gallery
      title="Prompt starters"
      note="One column, two from @xl up: put them in an @container"
      items={[
        { label: '2 items', node: <StarterBox><PromptStarters items={starterItems(STARTERS.slice(0, 2))} /></StarterBox> },
        { label: '4 items', node: <StarterBox><PromptStarters items={starterItems(STARTERS)} /></StarterBox> },
        { label: 'no hints', node: <StarterBox><PromptStarters items={starterItems(STARTERS, false)} /></StarterBox> },
        { label: 'module colours', node: <StarterBox><PromptStarters items={starterItems(MODULE_STARTERS)} /></StarterBox> },
      ]}
    />
  )
}

/* ---------- Welcome screen ---------- */

const WELCOME_ICONS = {
  sparkles: { icon: SparklesIcon, name: 'SparklesIcon' },
  chat: { icon: AiChat02Icon, name: 'AiChat02Icon' },
  brain: { icon: AiBrain02Icon, name: 'AiBrain02Icon' },
  invoice: { icon: Invoice01Icon, name: 'Invoice01Icon' },
} satisfies Record<string, { icon: IconSvgElement; name: string }>

type WelcomeIcon = keyof typeof WELCOME_ICONS
const WELCOME_ICON_NAMES = Object.keys(WELCOME_ICONS) as WelcomeIcon[]

function WelcomePreview({ title, description, icon, starters, count, prompt }: {
  title: string
  description?: string
  icon: WelcomeIcon
  starters: boolean
  count: number
  prompt: boolean
}) {
  return (
    <div className="bg-card @container flex h-[28rem] w-full min-w-0 flex-col overflow-hidden rounded-lg border shadow-xs">
      <ChatWelcome
        title={title}
        description={description}
        icon={WELCOME_ICONS[icon].icon}
        // An h4 under the playground's h3. In an app the default h2 fits, so the code leaves it out.
        headingAs="h4"
        starters={starters ? <PromptStarters items={starterItems(STARTERS.slice(0, count))} /> : undefined}
      >
        {prompt && (
          <PromptBox
            onSubmit={(text) => {
              toast('Sent', { description: text })
            }}
          />
        )}
      </ChatWelcome>
    </div>
  )
}

function welcomeCode(v: Values) {
  const description = str(v, 'description')
  const icon = WELCOME_ICONS[str(v, 'icon') as WelcomeIcon]
  const custom = icon.icon !== SparklesIcon
  const starters = bool(v, 'starters')
  const prompt = bool(v, 'prompt')
  const items = STARTERS.slice(0, Number(str(v, 'count')))
  const head = imports({
    // A Set, as the invoice icon can be both the welcome icon and a starter's.
    '@hugeicons/core-free-icons': [...new Set(pick(custom && icon.name, ...(starters ? items.map((s) => s.iconName) : [])))].sort(),
    sonner: starters || prompt ? ['toast'] : [],
    '@/blocks/ai/chat-thread': starters ? ['ChatWelcome', 'PromptStarters'] : ['ChatWelcome'],
    '@/blocks/ai/prompt-box': prompt ? ['PromptBox'] : [],
  })
  const list = starters
    ? `const starters = [\n${items.map((s) => indent(`{ icon: ${s.iconName}, title: ${lit(s.title)}, hint: ${lit(s.hint)} },`)).join('\n')}\n]\n\n`
    : ''
  const welcome = element('ChatWelcome', [
    textProp('title', str(v, 'title')),
    description && textProp('description', description),
    custom && `icon={${icon.name}}`,
    starters && [
      'starters={',
      '  <PromptStarters items={starters.map((s) => ({ ...s, onSelect: () => toast(s.title) }))} />',
      '}',
    ].join('\n'),
  ], prompt ? "<PromptBox onSubmit={(text) => { toast('Sent', { description: text }) }} />" : undefined)
  return `${head}\n\n${list}<div className="@container flex h-[28rem] flex-col">\n${indent(welcome)}\n</div>`
}

function WelcomeDemos() {
  return (
    <Playground
      title="Welcome screen"
      description="What a new chat opens on"
      controls={[
        { kind: 'text', name: 'title', label: 'Title', initial: 'What can I help with?' },
        {
          kind: 'text',
          name: 'description',
          label: 'Description',
          initial: 'Ask about invoices, customers and reports. Answers can be wrong, so check the numbers.',
        },
        { kind: 'select', name: 'icon', label: 'Icon', options: WELCOME_ICON_NAMES, initial: 'sparkles' },
        { kind: 'switch', name: 'starters', label: 'Prompt starters', initial: true },
        { kind: 'select', name: 'count', label: 'Starters shown', options: ['2', '4'], initial: '4' },
        { kind: 'switch', name: 'prompt', label: 'Prompt box', initial: true },
      ]}
      render={(v) => (
        <WelcomePreview
          title={str(v, 'title')}
          description={str(v, 'description') || undefined}
          icon={str(v, 'icon') as WelcomeIcon}
          starters={bool(v, 'starters')}
          count={Number(str(v, 'count'))}
          prompt={bool(v, 'prompt')}
        />
      )}
      code={welcomeCode}
    />
  )
}

/* ---------- Chat thread ---------- */

type ThreadMessage = { id: string; role: 'user' | 'assistant'; text: string }

const CONVERSATION: [string, string][] = [
  [
    'How much do customers owe us right now?',
    'Customers owe **$48,210.00** across 23 open invoices. **$12,940.00** of that is overdue, on 3 invoices.',
  ],
  [
    'Which invoices are overdue?',
    `Three invoices are past their due date:

| Invoice | Customer | Days late | Amount |
|---|---|---:|---:|
| INV-2026-0409 | Northwind Traders | 18 | 6,200.00 |
| INV-2026-0415 | Acme Corp | 9 | 4,320.00 |
| INV-2026-0421 | Globex | 3 | 2,420.00 |`,
  ],
  [
    'Who should I chase first?',
    'Start with **Northwind Traders**. INV-2026-0409 is the largest and the latest, and the late payment policy calls for a phone call after 14 days.',
  ],
  [
    'Draft a short reminder for Acme Corp.',
    `Here’s a draft:

> Hi, a quick reminder that INV-2026-0415 for $4,320.00 was due on 22 September. You can pay it from the link in this email. Thank you!`,
  ],
  [
    'How does this month compare with August?',
    `Overdue receivables are down **8%** on August.

- Average days late fell from 11 to 9.
- Two customers moved to paying on time.
- Globex is the only new late payer.`,
  ],
  [
    'Which invoices fall due next week?',
    `Four invoices worth **$9,870.00**:

1. INV-2026-0433, Initech, 3,150.00
2. INV-2026-0436, Brightline Media, 2,980.00
3. INV-2026-0438, Acme Corp, 2,240.00
4. INV-2026-0441, Oakridge Clinic, 1,500.00`,
  ],
]

const THREAD = CONVERSATION.flatMap(([question, reply], i): ThreadMessage[] => [
  { id: `q${i}`, role: 'user', text: question },
  { id: `a${i}`, role: 'assistant', text: reply },
])

const STREAM_QUESTION = 'Write up receivables for Friday’s finance review.'

const STREAM_REPLY = `## Receivables, end of September

Customers owe **$48,210.00** across 23 open invoices. Most of it is current, and the overdue share fell this month.

- **Overdue:** $12,940.00 on 3 invoices, down 8% on August.
- **Largest:** Northwind Traders, $6,200.00, 18 days late. A call is booked for Monday.
- **Due next week:** $9,870.00 on 4 invoices.

| Ageing | Invoices | Amount |
|---|---:|---:|
| Current | 20 | 35,270.00 |
| 1–30 days | 3 | 12,940.00 |
| 31–60 days | 0 | 0.00 |
| 60+ days | 0 | 0.00 |

**Next steps:** send reminders for INV-2026-0415 and INV-2026-0421 today, and review the credit limit for Northwind Traders before its next order.`

// Where each word of the reply ends, to cut it a word at a time.
const REPLY_ENDS = [...STREAM_REPLY.matchAll(/\S+/g)].map((m) => (m.index ?? 0) + m[0].length)

const WORD_MS = 45
// About half a second of "Thinking…" before the first word.
const THINK_TICKS = 12
// About two seconds on the whole reply before it streams again.
const REST_TICKS = 48

// The reply as far as it has streamed, in a loop while `on`.
function useStreamedReply(on: boolean) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!on) return
    const total = THINK_TICKS + REPLY_ENDS.length + REST_TICKS
    let t = 0
    const timer = window.setInterval(() => {
      t = t >= total ? 0 : t + 1
      setTick(t)
    }, WORD_MS)
    return () => {
      window.clearInterval(timer)
      setTick(0)
    }
  }, [on])
  const words = Math.max(0, Math.min(REPLY_ENDS.length, tick - THINK_TICKS))
  return { text: words ? STREAM_REPLY.slice(0, REPLY_ENDS[words - 1]) : '', done: words === REPLY_ENDS.length }
}

function ThreadPreview({ count, streaming }: { count: number; streaming: boolean }) {
  const reply = useStreamedReply(streaming)
  const messages: ThreadMessage[] = streaming
    ? [
      ...THREAD.slice(0, count),
      { id: 'stream-q', role: 'user', text: STREAM_QUESTION },
      { id: 'stream-a', role: 'assistant', text: reply.text },
    ]
    : THREAD.slice(0, count)
  const last = messages.length - 1
  const writing = streaming && !reply.done
  return (
    <div className="bg-card @container flex h-96 w-full min-w-0 flex-col overflow-hidden rounded-lg border shadow-xs">
      <ChatThread label="Chat messages" count={messages.length} follow={streaming ? reply.text : undefined} busy={writing}>
        {messages.map((m, i) => (m.role === 'user'
          ? <UserMessage key={m.id} text={m.text} />
          : (
            <AssistantMessage key={m.id} name="Assistant">
              {m.text ? <Markdown text={m.text} streaming={writing && i === last} /> : <Thinking indicator="dots" />}
            </AssistantMessage>
          )))}
      </ChatThread>
    </div>
  )
}

function threadCode(streaming: boolean) {
  const head = imports({
    '@/blocks/ai/chat-message': ['AssistantMessage', 'UserMessage'],
    '@/blocks/ai/chat-thread': ['ChatThread'],
    '@/blocks/markdown': ['Markdown'],
  })
  const reply = streaming
    ? '<Markdown text={m.text} streaming={streaming && i === messages.length - 1} />'
    : '<Markdown text={m.text} />'
  const list = [
    `{messages.map((${streaming ? 'm, i' : 'm'}) => (m.role === 'user'`,
    '  ? <UserMessage key={m.id} text={m.text} />',
    '  : (',
    '    <AssistantMessage key={m.id} name="Assistant">',
    `      ${reply}`,
    '    </AssistantMessage>',
    '  )))}',
  ].join('\n')
  const thread = jsx('ChatThread', {
    label: 'Chat messages',
    count: '{messages.length}',
    follow: streaming ? '{messages}' : undefined,
    busy: streaming ? '{streaming}' : undefined,
  }, list)
  const body = jsx('div', { className: 'flex h-96 flex-col' }, thread)
  const props = streaming
    ? '{ messages, streaming }: { messages: Message[]; streaming: boolean }'
    : '{ messages }: { messages: Message[] }'
  const note = streaming ? '// The last reply grows as it streams in; streaming is true until it ends.\n' : ''
  return [
    head,
    "type Message = { id: string; role: 'user' | 'assistant'; text: string }",
    `${note}function Thread(${props}) {\n  return (\n${indent(body, '    ')}\n  )\n}`,
  ].join('\n\n')
}

function ThreadDemos() {
  return (
    <Playground
      title="Chat thread"
      description="Follows a streaming reply until you scroll up"
      controls={[
        { kind: 'select', name: 'messages', label: 'Messages', options: ['2', '6', '12'], initial: '6' },
        { kind: 'switch', name: 'streaming', label: 'Streaming', initial: false },
      ]}
      render={(v) => <ThreadPreview count={Number(str(v, 'messages'))} streaming={bool(v, 'streaming')} />}
      code={(v) => threadCode(bool(v, 'streaming'))}
    />
  )
}

export default function AiWorkspaceDemos() {
  return (
    <Demos>
      <WelcomeDemos />
      <ThreadDemos />
      <StartersDemos />
    </Demos>
  )
}
