import { useEffect, useMemo } from 'react'
import { ChatHistory, type HistoryChat } from '@/blocks/ai/chat-history'
import { ChatThread, ChatWelcome, PromptStarters } from '@/blocks/ai/chat-thread'
import { toast } from 'sonner'
import { greeting } from '@/lib/text'
import { ROLE_LABEL } from '../data'
import { MODULES } from '../modules'
import { go } from '../route'
import { useErp } from '../store'
import type { EntityId } from '../types'
import { PROMPTS, firstName, starterPrompts } from './answers'
import { parseRecordHref, useAssistant } from './store'
import { Composer, Turns } from './Turns'

// The full-page Assistant (ERP + AI edition): Home › Assistant. The chat
// fills the page; its history is in the app's own sidebar (AssistantSidebar),
// so there is still one sidebar. The chats are the side panel's too.

export function AssistantPage() {
  const { session, company, openPeek, setPageTitle } = useErp()
  const { active, busy, send } = useAssistant()
  const role = session?.role ?? 'admin'
  const messages = active?.messages ?? []

  // The breadcrumb ends with the chat's title.
  const title = active?.title ?? null
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

  if (!active || !messages.length) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <ChatWelcome
          title={`${greeting()}, ${firstName(session?.name ?? '')}`}
          headingAs="h1"
          description={`Ask about the records in ${company?.name ?? 'your company'}: invoices, orders, stock, approvals, leave and more. I answer from the live data, within what the ${ROLE_LABEL[role]} role can open.`}
          starters={<PromptStarters items={starters.map((s) => ({ ...s, onSelect: () => send(s.title) }))} />}
        >
          <Composer placeholder={`Ask anything about ${company?.name ?? 'your company'}…`} autoFocus />
        </ChatWelcome>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatThread resetKey={active.id} count={messages.length} follow={messages} label="Conversation" busy={busy}>
        <Turns chat={active} onLink={openLink} onOpenPage={(link) => go(link.module, link.page)} />
      </ChatThread>
      <div className="mx-auto w-full max-w-3xl min-w-0 px-4 pb-3">
        <Composer placeholder="Ask a follow-up…" autoFocus />
      </div>
    </div>
  )
}

// The Assistant's part of the app sidebar, under the Home pages: New chat,
// search, pinned chats and the rest by date. From the kit's ChatHistory block.
export function AssistantSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { chats, active, runningChatId, newChat, openChat, renameChat, pinChat, deleteChat } = useAssistant()

  // New rows only when a row would look different, not on every streamed word.
  const signature = chats.map((c) => `${c.id}|${c.title}|${c.pinned}|${c.updatedAt}`).join('\n')
  const rows = useMemo((): HistoryChat[] => chats.map(({ id, title, pinned, updatedAt }) => ({ id, title, pinned, updatedAt })), [signature])
  const shown = useMemo(() => rows.map((r) => (r.id === runningChatId ? { ...r, running: true } : r)), [rows, runningChatId])

  return (
    <ChatHistory
      chats={shown}
      activeChatId={active?.id ?? null}
      onNewChat={newChat}
      onOpenChat={openChat}
      onRenameChat={renameChat}
      onPinChat={(id, pinned) => {
        pinChat(id, pinned)
        toast(pinned ? 'Pinned' : 'Unpinned')
      }}
      onDeleteChat={(id) => {
        deleteChat(id)
        toast('Chat deleted')
      }}
      onNavigate={onNavigate}
      emptyText="No chats yet. Ask something to start one."
      className="h-auto min-h-0 flex-1"
    />
  )
}
