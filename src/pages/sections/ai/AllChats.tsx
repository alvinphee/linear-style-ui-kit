import { useMemo, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LibraryIcon } from '@hugeicons/core-free-icons'
import { ChatLibrary, type LibraryChat } from '@/blocks/ai/chat/chat-library'
import { useActions } from './context'
import { CHAT_TYPES, now } from './data'
import { chatTypeOf } from './engine'
import { currentReply, replyText } from './helpers'
import type { Chat, Project } from './types'

// All chats: every chat in the history, with a search and filter chips by
// type, under the workspace's header row. The kit's ChatLibrary block.

// The start of a chat's last reply as plain words: no Markdown marks, and
// no tables or code, which read as noise in one line.
function previewOf(chat: Chat) {
  const last = [...chat.messages].reverse().find((m) => m.role === 'assistant')
  if (last?.role !== 'assistant') return undefined
  const text = replyText(currentReply(last))
    .replace(/```[\s\S]*?(```|$)/g, '\n')
    .split('\n')
    .filter((line) => !line.trim().startsWith('|'))
    .map((line) => line.replace(/^\s*([-*+]|\d+\.)\s+/, ''))
    .join(' ')
    .replace(/[#*_`>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s([:;,.!?])/g, '$1')
    .trim()
  return text ? (text.length > 160 ? `${text.slice(0, 159).replace(/\s+\S*$/, '')}…` : text) : undefined
}

export function AllChats({ chats, projects, runningChatId, sidebarToggle }: {
  // The history: no incognito chats.
  chats: Chat[]
  projects: Project[]
  runningChatId: string | null
  sidebarToggle: ReactNode
}) {
  const actions = useActions()
  const rows = useMemo((): LibraryChat[] => chats.map((c) => ({
    id: c.id,
    title: c.title,
    pinned: c.pinned,
    updatedAt: c.updatedAt,
    running: c.id === runningChatId,
    type: chatTypeOf(c),
    project: projects.find((p) => p.id === c.projectId)?.name,
    preview: previewOf(c),
  })), [chats, projects, runningChatId])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {sidebarToggle}
        <HugeiconsIcon icon={LibraryIcon} strokeWidth={2} className="text-muted-foreground ml-1 size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium">All chats</span>
      </header>
      <ChatLibrary
        chats={rows}
        types={CHAT_TYPES}
        headingAs="h3"
        now={now}
        onOpenChat={actions.openChat}
        onNewChat={() => actions.newChat(null)}
        emptyText="No chats yet. Start one with New chat."
        className="min-h-0 flex-1"
      />
    </div>
  )
}
