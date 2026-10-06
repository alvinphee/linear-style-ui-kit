import { useEffect, useState, type ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, AiBrain02Icon, AiChat02Icon, BubbleChatIcon, Calculator01Icon, ChartColumnIcon, IncognitoIcon, Invoice01Icon,
  Mail01Icon, PackageIcon, ShoppingCart01Icon, SparklesIcon, Target02Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Thinking } from '@/components/thinking-indicator'
import { AssistantMessage, UserMessage } from '@/blocks/ai/chat-message'
import { ChatHistory, type ChatType, type HistoryChat, type HistoryProject } from '@/blocks/ai/chat-history'
import { ChatLibrary, type LibraryChat, type LibraryType } from '@/blocks/ai/chat-library'
import { ChatThread, ChatWelcome, PromptStarters, type PromptStarter } from '@/blocks/ai/chat-thread'
import { PromptBox } from '@/blocks/ai/prompt-box'
import { Markdown } from '@/blocks/markdown'
import { Demos, Gallery, Playground, bool, element, imports, indent, jsx, lit, pick, str, type Values } from './Playground'

// The chat screen's blocks: the welcome screen a new chat opens on, the
// thread that scrolls and follows a streaming reply, the prompt starter
// cards, and the chat library (All chats). All content is made up.

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

/* ---------- Chat history ---------- */

// The sample chats below are aged in hours.
const HOUR = 3_600_000

const NEW_PROJECT_MODES = ['dialog', 'inline', 'none'] as const
type NewProjectMode = (typeof NEW_PROJECT_MODES)[number]

const HISTORY_PROJECTS: HistoryProject[] = [
  { id: 'month-end', name: 'Month-end close', colour: 'var(--chart-4)' },
  { id: 'ops', name: 'Weekly operations review', colour: 'var(--chart-2)' },
]

// What a chat is about: its type, and that type's icon (a module, or a chat
// bubble for the rest).
const HISTORY_TYPES: ChatType[] = [
  { value: 'sales', label: 'Sales', icon: ShoppingCart01Icon, colour: 'var(--chart-2)' },
  { value: 'inventory', label: 'Inventory', icon: PackageIcon, colour: 'var(--chart-3)' },
  { value: 'accounting', label: 'Accounting', icon: Calculator01Icon, colour: 'var(--chart-4)' },
  { value: 'crm', label: 'CRM', icon: Target02Icon, colour: 'var(--chart-1)' },
  { value: 'general', label: 'General', icon: BubbleChatIcon },
]
const ABOUT = Object.fromEntries(HISTORY_TYPES.map((t) => [t.value, { type: t.value, icon: t.icon, iconColour: t.colour }]))

// Made-up chats, aged in hours from when the page loads.
const HISTORY_CHATS: HistoryChat[] = [
  { id: 'h1', title: 'Overdue invoices this week', about: 'accounting', ago: 2, projectId: 'month-end' },
  { id: 'h2', title: 'Sales orders waiting to ship', about: 'sales', ago: 3 },
  { id: 'h3', title: 'What needs my attention today?', about: 'general', ago: 5 },
  { id: 'h4', title: 'Quotations expiring this week', about: 'sales', ago: 20, pinned: true },
  { id: 'h5', title: 'Stock transfers in transit', about: 'inventory', ago: 27, projectId: 'ops' },
  { id: 'h6', title: 'Largest open opportunities', about: 'crm', ago: 30 },
  { id: 'h7', title: 'Items below their reorder point', about: 'inventory', ago: 80 },
  { id: 'h8', title: 'Vendor bills due this month', about: 'accounting', ago: 400 },
].map(({ about, ago, ...chat }) => ({ ...chat, ...ABOUT[about], updatedAt: Date.now() - ago * HOUR }))

// A working history: rename, pin, move and delete change the demo's own list.
function HistoryPreview({ projects, projectMenu, newProject, icons, types, plus, viewAll, link }: {
  projects: boolean
  projectMenu: boolean
  newProject: NewProjectMode
  icons: boolean
  types: boolean
  plus: boolean
  viewAll: boolean
  link: boolean
}) {
  const [chats, setChats] = useState(HISTORY_CHATS)
  const [folders, setFolders] = useState(HISTORY_PROJECTS)
  const [active, setActive] = useState('h2')
  const say = (title: string) => toast(title, { description: 'Demo only.' })
  const patch = (id: string, change: Partial<HistoryChat>) => setChats((list) => list.map((c) => (c.id === id ? { ...c, ...change } : c)))
  const nameOf = (id: string) => folders.find((p) => p.id === id)?.name ?? 'the project'

  return (
    <div className="bg-sidebar text-sidebar-foreground h-[30rem] w-64 overflow-hidden rounded-lg border">
      <ChatHistory
        chats={icons ? chats : chats.map(({ icon: _icon, iconColour: _colour, ...c }) => c)}
        projects={projects ? folders : undefined}
        activeChatId={active}
        newChatIcon={plus ? Add01Icon : undefined}
        types={types ? HISTORY_TYPES : undefined}
        links={link ? [{ id: 'incognito', label: 'Incognito chat', icon: IncognitoIcon, onSelect: () => say('Incognito chat') }] : undefined}
        onNewChat={() => say('New chat')}
        onOpenChat={setActive}
        onCreateProject={newProject === 'inline'
          ? (name) => setFolders((list) => [...list, { id: `p-${list.length}-${name}`, name, colour: 'var(--chart-1)' }])
          : undefined}
        onNewProject={newProject === 'dialog' ? () => say('Your project setup opens here: a dialog with its name and instructions') : undefined}
        onNewChatInProject={projectMenu ? (id) => say(`New chat in ${nameOf(id)}`) : undefined}
        onEditProject={projectMenu ? (id) => say(`Edit ${nameOf(id)}: its name and instructions`) : undefined}
        onDeleteProject={projectMenu
          ? (id) => {
            setFolders((list) => list.filter((p) => p.id !== id))
            setChats((list) => list.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)))
          }
          : undefined}
        onRenameChat={(id, title) => patch(id, { title })}
        onPinChat={(id, pinned) => patch(id, { pinned })}
        onMoveChat={projects ? (id, projectId) => patch(id, { projectId }) : undefined}
        onDeleteChat={(id) => setChats((list) => list.filter((c) => c.id !== id))}
        onViewAll={viewAll ? () => say('All chats opens here: the chat library') : undefined}
      />
    </div>
  )
}

function HistoryDemos() {
  return (
    <Playground
      title="Chat history"
      description="The sidebar of a chat app: New chat, links, Projects, Pinned, then Chats (its options: by date or one list, and which type)"
      controls={[
        { kind: 'switch', name: 'projects', label: 'Projects (projects)', initial: true },
        { kind: 'switch', name: 'menu', label: 'Project menu (onEditProject…)', initial: true },
        { kind: 'select', name: 'newProject', label: 'New project', options: NEW_PROJECT_MODES, initial: 'dialog' },
        { kind: 'switch', name: 'icons', label: 'Icons by type (chat.icon)', initial: true },
        { kind: 'switch', name: 'types', label: 'Type filter (types)', initial: true },
        { kind: 'switch', name: 'plus', label: '+ New chat (newChatIcon)', initial: true },
        { kind: 'switch', name: 'viewAll', label: 'All chats row (onViewAll)', initial: true },
        { kind: 'switch', name: 'link', label: 'Incognito row (links)', initial: false },
      ]}
      render={(v) => (
        <HistoryPreview
          // A fresh list when the projects come and go.
          key={String(bool(v, 'projects'))}
          projects={bool(v, 'projects')}
          projectMenu={bool(v, 'menu')}
          newProject={str(v, 'newProject') as NewProjectMode}
          icons={bool(v, 'icons')}
          types={bool(v, 'types')}
          plus={bool(v, 'plus')}
          viewAll={bool(v, 'viewAll')}
          link={bool(v, 'link')}
        />
      )}
      code={(v) => {
        const projects = bool(v, 'projects')
        const menu = projects && bool(v, 'menu')
        const mode = str(v, 'newProject') as NewProjectMode
        return [
          imports({
            '@hugeicons/core-free-icons': [bool(v, 'plus') && 'Add01Icon', bool(v, 'link') && 'IncognitoIcon'].filter((n): n is string => !!n),
            '@/blocks/ai/chat-history': ['ChatHistory'],
          }),
          '',
          '// chats: { id, title, updatedAt, pinned?, projectId?, type?, icon?, iconColour? }[]',
          element('ChatHistory', [
            'chats={chats}',
            projects && 'projects={projects}',
            'activeChatId={activeId}',
            bool(v, 'plus') && 'newChatIcon={Add01Icon}',
            bool(v, 'link') && "links={[{ id: 'incognito', label: 'Incognito chat', icon: IncognitoIcon, onSelect: startIncognito }]}",
            bool(v, 'types') && 'types={types}',
            'onNewChat={newChat}',
            'onOpenChat={openChat}',
            projects && mode === 'dialog' && 'onNewProject={openProjectSetup}',
            projects && mode === 'inline' && 'onCreateProject={createProject}',
            menu && 'onNewChatInProject={newChatIn}',
            menu && 'onEditProject={openProjectSetup}',
            menu && 'onDeleteProject={deleteProject}',
            'onRenameChat={renameChat}',
            'onPinChat={pinChat}',
            projects && 'onMoveChat={moveChat}',
            'onDeleteChat={deleteChat}',
            bool(v, 'viewAll') && 'onViewAll={openAllChats}',
          ]),
        ].join('\n')
      }}
    />
  )
}

/* ---------- Chat library ---------- */

const LIBRARY_TYPES: LibraryType[] = [
  { value: 'sales', label: 'Sales', icon: ShoppingCart01Icon, colour: 'var(--chart-2)' },
  { value: 'inventory', label: 'Inventory', icon: PackageIcon, colour: 'var(--chart-3)' },
  { value: 'accounting', label: 'Accounting', icon: Calculator01Icon, colour: 'var(--chart-4)' },
  { value: 'general', label: 'General', icon: SparklesIcon },
]

// Made-up chats, aged from when the page loads.
const LIBRARY_CHATS: LibraryChat[] = [
  { id: 'l1', title: 'Overdue invoices this week', type: 'accounting', ago: 1, project: 'Month-end close', preview: 'Seven invoices are overdue, $184,200 in all. The oldest is INV-2026-0407…' },
  { id: 'l2', title: 'Sales orders waiting to ship', type: 'sales', ago: 5, pinned: true, preview: 'Twelve orders are confirmed but not shipped. Four are past their promised date…' },
  { id: 'l3', title: 'Items below their reorder point', type: 'inventory', ago: 26, preview: 'Nine items are below their reorder point; three are out of stock…' },
  { id: 'l4', title: 'Vendor bills due this week', type: 'accounting', ago: 30, project: 'Month-end close', preview: 'Five bills fall due by Friday, $41,350 in all…' },
  { id: 'l5', title: 'What needs my attention today?', type: 'general', ago: 74, preview: 'Two purchase orders await your approval, and one invoice is overdue…' },
  { id: 'l6', title: 'Largest open opportunities', type: 'sales', ago: 150, preview: 'The five largest open opportunities add up to $1.2M…' },
  { id: 'l7', title: 'Stock transfers in transit', type: 'inventory', ago: 320, preview: 'Three transfers are on the road between warehouses…' },
].map(({ ago, ...chat }) => ({ ...chat, updatedAt: Date.now() - ago * HOUR }))

function LibraryDemos() {
  return (
    <Playground
      title="Chat library"
      description="Every chat on one page, with a search and filters by type: an assistant's All chats"
      controls={[
        { kind: 'switch', name: 'types', label: 'Types (types, chat.type)', initial: true },
        { kind: 'switch', name: 'preview', label: 'Previews (chat.preview)', initial: true },
        { kind: 'switch', name: 'project', label: 'Projects (chat.project)', initial: true },
        { kind: 'switch', name: 'empty', label: 'No chats yet', initial: false },
      ]}
      render={(v) => {
        const chats = bool(v, 'empty') ? [] : LIBRARY_CHATS.map((c) => ({
          ...c,
          type: bool(v, 'types') ? c.type : undefined,
          preview: bool(v, 'preview') ? c.preview : undefined,
          project: bool(v, 'project') ? c.project : undefined,
        }))
        return (
          <div className="bg-background h-[28rem] w-[min(40rem,80vw)] overflow-hidden rounded-lg border">
            <ChatLibrary
              chats={chats}
              types={bool(v, 'types') ? LIBRARY_TYPES : []}
              headingAs="h3"
              onOpenChat={(id) => toast(LIBRARY_CHATS.find((c) => c.id === id)?.title ?? 'Chat', { description: 'Demo only. This would open the chat.' })}
              onNewChat={() => toast('New chat', { description: 'Demo only.' })}
              emptyText="No chats yet. Ask something to start one."
            />
          </div>
        )
      }}
      code={(v) => [
        imports({ '@/blocks/ai/chat-library': ['ChatLibrary', 'type LibraryChat', 'type LibraryType'] }),
        '',
        bool(v, 'types') && "const types: LibraryType[] = [{ value: 'sales', label: 'Sales', icon: ShoppingCart01Icon, colour: 'var(--chart-2)' }, …]",
        "// chats: { id, title, updatedAt, pinned?, running?, type?, preview?, project? }[]",
        '',
        element('ChatLibrary', [
          'chats={chats}',
          bool(v, 'types') && 'types={types}',
          'onOpenChat={openChat}',
          'onNewChat={newChat}',
        ]),
      ].filter((line) => line !== false).join('\n')}
    />
  )
}

export default function AiWorkspaceDemos() {
  return (
    <Demos>
      <WelcomeDemos />
      <ThreadDemos />
      <StartersDemos />
      <HistoryDemos />
      <LibraryDemos />
    </Demos>
  )
}
