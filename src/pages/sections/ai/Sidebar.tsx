import { memo, useMemo, type ReactNode, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, DashboardSquare01Icon, Logout01Icon, RefreshIcon, Settings01Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AccountMenu } from '@/blocks/account-menu'
import {
  ChatHistory, ChatMenuItems as ChatMenu, DeleteChatDialog as DeleteChatConfirm, type HistoryChat,
} from '@/blocks/ai/chat/chat-history'
import type { MenuKit } from '@/components/menu-kit'
import { Shortcut } from '@/components/shortcut'
import { UsageMeter } from '@/components/usage-meter'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useActions } from './context'
import { CHAT_TYPES, USER, now } from './data'
import type { Chat, Project, View } from './types'

// The workspace's sidebar: the chat-history block wired to the workspace's
// actions, with its credits and account menu in the footer. From the top:
// + New chat, Search chats and All chats, Projects (each with a menu: new
// chat in it, edit on its page, delete), Pinned, then Chats (by date or one
// list, any type or one). Every chat shows its type's icon. Incognito is the
// toggle at the top right of the chat, not a row here.

// A chat as the sidebar shows it, with its type (chatTypeOf) and that type's icon.
export type ChatSummary = Pick<Chat, 'id' | 'title' | 'projectId' | 'pinned' | 'updatedAt'>
  & Pick<HistoryChat, 'type' | 'icon' | 'iconColour'>

// The same actions in the hover menu, the right-click menu and the chat header.
export function ChatMenuItems({ kit, chat, projects, onRename, onDelete, extra }: {
  kit: MenuKit
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

export const Sidebar = memo(function Sidebar({
  chats, projects, view, credits, runningChatId, groupByDate, onNavigate, onClose, newChatRef, kitLink,
}: {
  chats: ChatSummary[]
  projects: Project[]
  view: View
  credits: number
  runningChatId: string | null
  groupByDate: boolean
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
      newChatIcon={Add01Icon}
      newChatRef={newChatRef}
      newChatShortcut={<Shortcut keys={['mod', 'shift', 'O']} />}
      types={CHAT_TYPES}
      onNewChat={() => actions.newChat(null)}
      onOpenChat={actions.openChat}
      onOpenProject={actions.openProject}
      // A new project opens on its page, where its instructions and files go.
      onCreateProject={(name) => actions.openProject(actions.createProject(name))}
      onNewChatInProject={(id) => actions.newChat(id)}
      onEditProject={actions.openProject}
      onDeleteProject={actions.deleteProject}
      onViewAll={actions.openLibrary}
      viewAllActive={view.kind === 'library'}
      groupByDate={groupByDate}
      onGroupByDateChange={actions.setGroupByDate}
      onRenameChat={actions.renameChat}
      onPinChat={actions.pinChat}
      onMoveChat={actions.moveChat}
      onDuplicateChat={actions.duplicateChat}
      onDeleteChat={actions.deleteChat}
      onNavigate={onNavigate}
      onClose={onClose}
      footer={(
        <>
          <UsageMeter
            value={credits}
            label={`${Math.round(credits)}% of monthly credits`}
            count="Resets 1 Oct"
            className="px-1.5 pt-1"
          />
          <AccountMenu name={USER.name} detail={USER.plan} label={USER.email}>
            <DropdownMenuItem onSelect={() => actions.openSettings()}>
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.openSettings('billing')}>
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
