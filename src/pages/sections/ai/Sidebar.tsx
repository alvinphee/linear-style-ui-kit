import { memo, useMemo, type ReactNode, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare01Icon, Logout01Icon, RefreshIcon, Settings01Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AccountMenu, ChatHistory, ChatMenuItems as ChatMenu, CreditsMeter, DROPDOWN_MENU_KIT,
  DeleteChatDialog as DeleteChatConfirm, type ChatMenuKit, type HistoryChat,
} from '@/blocks/ai/chat-history'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { useActions } from './context'
import { USER, now } from './data'
import type { Chat, Project, View } from './types'

// The workspace's sidebar: the chat-history block wired to the workspace's
// actions, with its credits and account menu in the footer.

export { RenameInput } from '@/blocks/ai/chat-history'

export type ChatSummary = Pick<Chat, 'id' | 'title' | 'projectId' | 'pinned' | 'updatedAt'>

export const DROPDOWN_KIT = DROPDOWN_MENU_KIT

// The same actions in the hover menu, the right-click menu and the chat header.
export function ChatMenuItems({ kit, chat, projects, onRename, onDelete, extra }: {
  kit: ChatMenuKit
  chat: ChatSummary
  projects: Project[]
  onRename: () => void
  onDelete: () => void
  extra?: ReactNode
}) {
  const actions = useActions()
  return (
    <ChatMenu
      kit={kit}
      chat={chat}
      projects={projects}
      onPin={(pinned) => actions.pinChat(chat.id, pinned)}
      onRename={onRename}
      onMove={(projectId) => actions.moveChat(chat.id, projectId)}
      onDuplicate={() => actions.duplicateChat(chat.id)}
      onDelete={onDelete}
      extra={extra}
    />
  )
}

export const Sidebar = memo(function Sidebar({ chats, projects, view, credits, runningChatId, onNavigate, onClose, newChatRef, kitLink }: {
  chats: ChatSummary[]
  projects: Project[]
  view: View
  credits: number
  runningChatId: string | null
  // Called after moving somewhere, so the mobile sheet can close.
  onNavigate?: () => void
  onClose?: () => void
  newChatRef: RefObject<HTMLButtonElement | null>
  // In the full-page mockup, a way back to the kit from the account menu.
  kitLink?: boolean
}) {
  const actions = useActions()
  const rows = useMemo(
    (): HistoryChat[] => chats.map((c) => (c.id === runningChatId ? { ...c, running: true } : c)),
    [chats, runningChatId],
  )

  return (
    <ChatHistory
      chats={rows}
      projects={projects}
      activeChatId={view.kind === 'chat' ? view.chatId : null}
      activeProjectId={view.kind === 'project' ? view.projectId : null}
      now={now}
      newChatRef={newChatRef}
      newChatShortcut={(
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>O</Kbd>
        </KbdGroup>
      )}
      onNewChat={() => actions.newChat(null)}
      onOpenChat={actions.openChat}
      onOpenProject={actions.openProject}
      onCreateProject={(name) => actions.openProject(actions.createProject(name))}
      onRenameChat={actions.renameChat}
      onPinChat={actions.pinChat}
      onMoveChat={actions.moveChat}
      onDuplicateChat={actions.duplicateChat}
      onDeleteChat={actions.deleteChat}
      onNavigate={onNavigate}
      onClose={onClose}
      footer={(
        <>
          <CreditsMeter value={credits} note="Resets 1 Oct" />
          <AccountMenu name={USER.name} detail={USER.plan} label={USER.email}>
            <DropdownMenuItem onSelect={actions.openSettings}>
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Upgrade plan', { description: 'Demo only.' })}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={actions.resetDemo}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} /> Reset demo chats
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Signed out', { description: 'Demo only. You are still signed in.' })}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out
            </DropdownMenuItem>
            {kitLink && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="#/ai-workspace">
                    <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} /> Back to the UI kit
                  </a>
                </DropdownMenuItem>
              </>
            )}
          </AccountMenu>
        </>
      )}
    />
  )
})

export function DeleteChatDialog({ chatId, title, onClose, onDeleted }: {
  chatId: string | null
  title: string
  onClose: () => void
  // Where focus goes once the chat, and the button that opened this, are gone.
  onDeleted: () => void
}) {
  const actions = useActions()
  return (
    <DeleteChatConfirm
      open={!!chatId}
      title={title}
      onClose={onClose}
      onConfirm={() => {
        if (chatId) actions.deleteChat(chatId)
      }}
      onDeleted={onDeleted}
    />
  )
}
