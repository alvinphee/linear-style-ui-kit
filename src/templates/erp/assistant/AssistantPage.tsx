import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, BubbleChatIcon, Folder01Icon, IncognitoIcon } from '@hugeicons/core-free-icons'
import { ChatHistory, type HistoryChat } from '@/blocks/ai/chat-history'
import { ChatLibrary, type LibraryChat, type LibraryType } from '@/blocks/ai/chat-library'
import { ChatThread, ChatWelcome, PromptStarters } from '@/blocks/ai/chat-thread'
import { FormDialog } from '@/blocks/form-dialog'
import type { FormField } from '@/blocks/form-fields'
import { IncognitoToggle } from '@/components/incognito-toggle'
import { toast } from 'sonner'
import { greeting } from '@/lib/text'
import { ROLE_LABEL } from '../data'
import { MODULES } from '../modules'
import { go } from '../route'
import { useErp } from '../store'
import type { EntityId } from '../types'
import { PROMPTS, firstName, starterPrompts } from './answers'
import { parseRecordHref, useAssistant, type Chat } from './store'
import { Composer, Turns } from './Turns'

// The full-page Assistant (ERP + AI edition): Home › Assistant. The chat
// fills the page; its history is in the app's own sidebar (AssistantSidebar),
// so there is still one sidebar. The chats are the side panel's too. A slim
// row over the chat shows its project and the incognito toggle.

const shorten = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text)

export function AssistantPage() {
  const { session, company, openPeek, setPageTitle } = useErp()
  const { active, busy, send, projects, draftProjectId, incognito, setIncognito } = useAssistant()
  const role = session?.role ?? 'admin'
  const messages = active?.messages ?? []
  const project = projects.find((p) => p.id === (active ? active.projectId : draftProjectId)) ?? null

  // The breadcrumb ends with the chat's title.
  const title = active ? (active.temporary ? 'Incognito chat' : active.title) : null
  useEffect(() => {
    setPageTitle(title)
  }, [title, setPageTitle])
  useEffect(() => () => setPageTitle(null), [setPageTitle])

  function openLink(href: string) {
    const target = parseRecordHref(href)
    if (target) openPeek(target.entity as EntityId, target.id)
  }

  // A starter per module the role can open: its first suggested question.
  const starters = useMemo(() => {
    const modules = MODULES.filter((m) => m.id !== 'home' && m.roles.includes(role))
    const fromModules = modules.map((m) => ({ id: m.id, icon: m.icon, colour: m.colour, title: PROMPTS[m.id][0], hint: m.name }))
    const home = MODULES[0]
    const fromHome = starterPrompts(role).slice(0, 1).map((q) => ({ id: 'home', icon: home.icon, colour: home.colour, title: q, hint: 'Across your modules' }))
    return [...fromHome, ...fromModules].slice(0, 4)
  }, [role])

  const top = (
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
      {project ? (
        <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-xs">
          <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-3.5 shrink-0" style={{ color: project.colour }} />
          <span className="truncate">{project.name}</span>
        </span>
      ) : <span />}
      <IncognitoToggle pressed={incognito} onPressedChange={setIncognito} />
    </div>
  )

  if (!active || !messages.length) {
    const welcome = incognito
      ? {
        icon: IncognitoIcon,
        title: 'Incognito chat',
        description: "This chat isn't saved to your chats, and it's deleted when you leave it. Answers still come from the live records.",
      }
      : project
        ? {
          icon: Folder01Icon,
          title: `New chat in ${project.name}`,
          description: project.instructions
            ? <>Replies in this project follow its instructions: “{shorten(project.instructions, 140)}”</>
            : 'This project has no instructions yet. Add them from its menu in the sidebar.',
        }
        : {
          icon: undefined,
          title: `${greeting()}, ${firstName(session?.name ?? '')}`,
          description: `Ask about the records in ${company?.name ?? 'your company'}: invoices, orders, stock, approvals, leave and more. I answer from the live data, within what the ${ROLE_LABEL[role]} role can open.`,
        }
    return (
      <div className="flex h-full min-h-0 flex-col">
        {top}
        <ChatWelcome
          icon={welcome.icon}
          title={welcome.title}
          headingAs="h1"
          description={welcome.description}
          starters={<PromptStarters items={starters.map((s) => ({ ...s, onSelect: () => send(s.title) }))} />}
        >
          <Composer
            placeholder={project && !incognito ? `Ask anything in ${project.name}…` : `Ask anything about ${company?.name ?? 'your company'}…`}
            autoFocus
          />
        </ChatWelcome>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {top}
      <ChatThread resetKey={active.id} count={messages.length} follow={messages} label="Conversation" busy={busy}>
        <Turns chat={active} onLink={openLink} onOpenPage={(link) => go(link.module, link.page)} />
      </ChatThread>
      <div className="mx-auto w-full max-w-3xl min-w-0 px-4 pb-3">
        {active.temporary && (
          <p className="text-muted-foreground mb-2 flex items-center justify-center gap-1.5 text-[11px]">
            <HugeiconsIcon icon={IncognitoIcon} strokeWidth={2} className="size-3" />
            Incognito: this chat isn't saved, and is deleted when you leave it.
          </p>
        )}
        <Composer placeholder="Ask a follow-up…" autoFocus />
      </div>
    </div>
  )
}

const PROJECT_FIELDS: FormField[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Month-end close', requiredMessage: 'Give the project a name.' },
  {
    key: 'instructions', label: 'Instructions', type: 'textarea', hint: 'Optional', rows: 6, maxLength: 1000,
    placeholder: "Who you are, what to focus on and how to answer. For example: I'm the finance controller. List overdue invoices first, amounts rounded to the dollar.",
    description: 'The assistant follows these in every chat in this project.',
  },
]

// New project, or Edit project: its name and the instructions the assistant
// follows in each of its chats. The kit's FormDialog block.
function ProjectDialog({ editing, onClose, onCreated }: {
  // "new", a project's id, or null when closed.
  editing: string | null
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const { projects, createProject, updateProject } = useAssistant()
  // Keeps the title while the dialog animates closed.
  const last = useRef(editing)
  if (editing) last.current = editing
  const project = last.current && last.current !== 'new' ? projects.find((p) => p.id === last.current) : undefined
  return (
    <FormDialog
      open={editing !== null}
      onOpenChange={(open) => !open && onClose()}
      title={project ? 'Edit project' : 'New project'}
      description="A project keeps related chats together, with instructions the assistant follows in each of them."
      fields={PROJECT_FIELDS}
      initialValues={project ? { name: project.name, instructions: project.instructions } : undefined}
      submitLabel={project ? 'Save' : 'Create project'}
      onSubmit={(values) => {
        const name = String(values.name)
        const instructions = String(values.instructions ?? '')
        if (project) {
          updateProject(project.id, { name, instructions })
          toast('Project saved')
          return
        }
        const id = createProject({ name, instructions })
        toast(`Created ${name}`, { description: 'A new chat in it is ready.' })
        onCreated(id)
      }}
      className="sm:max-w-lg"
    />
  )
}

// The Assistant's part of the app sidebar, under the Home pages: + New chat,
// then Search chats and All chats, then Projects (with their instructions),
// Pinned and Chats (by date or one list, any type or one). Incognito is the
// toggle at the top right of the chat, not a row here.
// Every chat shows the icon of the module it is about. From the kit's
// ChatHistory block. Shown on the Assistant and All chats pages.
export function AssistantSidebar({ onNavigate, pageId }: { onNavigate?: () => void; pageId?: string }) {
  const {
    chats, projects, active, draftProjectId, runningChatId, newChat, openChat, renameChat, pinChat,
    deleteChat, moveChat, deleteProject,
  } = useAssistant()
  const { groupByDate, setGroupByDate } = useErp()
  const [editing, setEditing] = useState<string | null>(null)

  // New rows only when a row would look different, not on every streamed word.
  const signature = chats.map((c) => `${c.id}|${c.title}|${c.pinned}|${c.updatedAt}|${c.projectId}|${c.topic}`).join('\n')
  const rows = useMemo((): HistoryChat[] => chats.map(({ id, title, pinned, updatedAt, projectId, topic }) => {
    const type = chatType(topic)
    return { id, title, pinned, updatedAt, projectId, type: type.value, icon: type.icon, iconColour: type.colour }
  }), [signature])
  const shown = useMemo(() => rows.map((r) => (r.id === runningChatId ? { ...r, running: true } : r)), [rows, runningChatId])
  const toChat = () => go('home', 'assistant')

  return (
    <>
      <ChatHistory
        chats={shown}
        projects={projects}
        activeChatId={pageId === 'assistant' && active && !active.temporary ? active.id : null}
        activeProjectId={pageId === 'assistant' && !active ? draftProjectId : null}
        newChatIcon={Add01Icon}
        types={getChatTypes()}
        onNewChat={() => {
          newChat()
          toChat()
        }}
        onOpenChat={(id) => {
          openChat(id)
          toChat()
        }}
        onNewProject={() => setEditing('new')}
        onEditProject={setEditing}
        onNewChatInProject={(id) => {
          newChat(id)
          toChat()
        }}
        onDeleteProject={(id) => {
          deleteProject(id)
          toast('Project deleted', { description: 'Its chats are back in your history.' })
        }}
        onRenameChat={renameChat}
        onPinChat={(id, pinned) => {
          pinChat(id, pinned)
          toast(pinned ? 'Pinned' : 'Unpinned')
        }}
        onMoveChat={(id, projectId) => {
          moveChat(id, projectId)
          toast(projectId ? `Moved to ${projects.find((p) => p.id === projectId)?.name ?? 'the project'}` : 'Removed from the project')
        }}
        onDeleteChat={(id) => {
          deleteChat(id)
          toast('Chat deleted')
        }}
        groupByDate={groupByDate}
        onGroupByDateChange={setGroupByDate}
        onViewAll={() => go('home', 'chats')}
        viewAllActive={pageId === 'chats'}
        onNavigate={onNavigate}
        emptyText="No chats yet. Ask something to start one."
        className="h-auto min-h-0 flex-1"
      />
      <ProjectDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onCreated={(id) => {
          newChat(id)
          toChat()
          onNavigate?.()
        }}
      />
    </>
  )
}

// The start of a chat's last reply, for its row in All chats.
function previewOf(chat: Chat) {
  const reply = [...chat.messages].reverse().find((m) => m.role === 'assistant')
  return reply && reply.role === 'assistant' ? shorten(reply.plain.replace(/\s+/g, ' ').trim(), 160) : undefined
}

// Every module as a chat type, with its icon and colour; "home" (questions
// across modules) is General, with a chat bubble. Built on first use:
// modules.tsx imports this file, so MODULES is not ready while it loads.
let chatTypes: LibraryType[] | null = null
const getChatTypes = () => (chatTypes ??= MODULES.map((m) => (m.id === 'home'
  ? { value: m.id, label: 'General', icon: BubbleChatIcon }
  : { value: m.id, label: m.name, icon: m.icon, colour: m.colour })))
const chatType = (topic: string | null) => getChatTypes().find((t) => t.value === (topic ?? 'home')) ?? getChatTypes()[0]

// Home › All chats (ERP + AI): every chat, with a search and filter chips by
// type (the module each chat is about). From the kit's ChatLibrary block.
export function AllChatsPage() {
  const { chats, projects, runningChatId, openChat, newChat } = useAssistant()
  const rows = useMemo((): LibraryChat[] => chats.map((c) => ({
    id: c.id,
    title: c.title,
    pinned: c.pinned,
    updatedAt: c.updatedAt,
    running: c.id === runningChatId,
    type: c.topic ?? 'home',
    project: projects.find((p) => p.id === c.projectId)?.name,
    preview: previewOf(c),
  })), [chats, projects, runningChatId])

  return (
    <ChatLibrary
      chats={rows}
      types={getChatTypes()}
      onOpenChat={(id) => {
        openChat(id)
        go('home', 'assistant')
      }}
      onNewChat={() => {
        newChat()
        go('home', 'assistant')
      }}
      emptyText="No chats yet. Ask the Assistant something to start one."
    />
  )
}
