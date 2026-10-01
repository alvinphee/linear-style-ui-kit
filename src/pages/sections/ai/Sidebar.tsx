import { memo, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowRight01Icon, Cancel01Icon, CopyPlusIcon, Delete02Icon, Edit02Icon, Folder01Icon,
  DashboardSquare01Icon, FolderOpenIcon, FolderRemoveIcon, FolderTransferIcon, Logout01Icon, MoreHorizontalIcon, PencilEdit02Icon,
  PinIcon, PinOffIcon, RefreshIcon, Search01Icon, Settings01Icon, SparklesIcon, Tick02Icon, UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub,
  ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { UserAvatar } from '@/components/person'
import { useActions } from './context'
import { DAY, USER, now } from './data'
import type { Chat, Project, View } from './types'

export type ChatSummary = Pick<Chat, 'id' | 'title' | 'projectId' | 'pinned' | 'updatedAt'>

export const DROPDOWN_KIT = {
  Item: DropdownMenuItem, Sub: DropdownMenuSub, SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent, Separator: DropdownMenuSeparator,
}
const CONTEXT_KIT = {
  Item: ContextMenuItem, Sub: ContextMenuSub, SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent, Separator: ContextMenuSeparator,
}
type Kit = typeof DROPDOWN_KIT | typeof CONTEXT_KIT

// The same actions in the hover menu, the right-click menu and the chat header.
export function ChatMenuItems({ kit, chat, projects, onRename, onDelete, extra }: {
  kit: Kit
  chat: ChatSummary
  projects: Project[]
  onRename: () => void
  onDelete: () => void
  extra?: ReactNode
}) {
  const actions = useActions()
  const K = kit
  return (
    <>
      <K.Item onSelect={() => actions.pinChat(chat.id, !chat.pinned)}>
        <HugeiconsIcon icon={chat.pinned ? PinOffIcon : PinIcon} strokeWidth={2} />
        {chat.pinned ? 'Unpin' : 'Pin'}
      </K.Item>
      <K.Item onSelect={onRename}>
        <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
        Rename
      </K.Item>
      <K.Sub>
        <K.SubTrigger>
          <HugeiconsIcon icon={FolderTransferIcon} strokeWidth={2} />
          Move to project
        </K.SubTrigger>
        <K.SubContent className="w-48">
          {projects.map((project) => (
            <K.Item key={project.id} disabled={chat.projectId === project.id} onSelect={() => actions.moveChat(chat.id, project.id)}>
              <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} style={{ color: project.colour }} />
              <span className="min-w-0 truncate">{project.name}</span>
              {chat.projectId === project.id && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto" />}
            </K.Item>
          ))}
          {!projects.length && <K.Item disabled>No projects yet</K.Item>}
          {chat.projectId && (
            <>
              <K.Separator />
              <K.Item onSelect={() => actions.moveChat(chat.id, null)}>
                <HugeiconsIcon icon={FolderRemoveIcon} strokeWidth={2} />
                Remove from project
              </K.Item>
            </>
          )}
        </K.SubContent>
      </K.Sub>
      <K.Item onSelect={() => actions.duplicateChat(chat.id)}>
        <HugeiconsIcon icon={CopyPlusIcon} strokeWidth={2} />
        Duplicate
      </K.Item>
      {extra}
      <K.Separator />
      <K.Item variant="destructive" onSelect={onDelete}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        Delete
      </K.Item>
    </>
  )
}

export function RenameInput({ initial, label, onDone, className }: {
  initial: string
  label: string
  // null means cancelled.
  onDone: (value: string | null) => void
  className?: string
}) {
  const [value, setValue] = useState(initial)
  const done = useRef(false)
  const ref = useRef<HTMLInputElement>(null)

  // After a menu closes, wait a tick so its focus handling is finished.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      ref.current?.focus()
      ref.current?.select()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function finish(save: boolean) {
    if (done.current) return
    done.current = true
    onDone(save && value.trim() ? value.trim() : null)
  }

  return (
    <input
      ref={ref}
      value={value}
      aria-label={label}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(true)
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          finish(false)
        }
      }}
      onBlur={() => finish(true)}
      className={cn('bg-background border-ring/60 ring-ring/20 h-6 min-w-0 flex-1 rounded-md border px-1.5 text-xs ring-2 outline-none', className)}
    />
  )
}

function ChatRow({ chat, active, running, projects, onOpen, onDelete }: {
  chat: ChatSummary
  active: boolean
  running: boolean
  projects: Project[]
  onOpen: () => void
  onDelete: () => void
}) {
  const actions = useActions()
  const [renaming, setRenaming] = useState(false)
  const skipFocusReturn = useRef(false)
  const rowRef = useRef<HTMLButtonElement>(null)

  function startRename() {
    skipFocusReturn.current = true
    setRenaming(true)
  }
  const onCloseAutoFocus = (e: Event) => {
    if (!skipFocusReturn.current) return
    e.preventDefault()
    skipFocusReturn.current = false
  }
  const items = (kit: Kit) => (
    <ChatMenuItems kit={kit} chat={chat} projects={projects} onRename={startRename} onDelete={onDelete} />
  )

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'group/row relative flex h-7 min-w-0 items-center rounded-md transition-colors',
            active ? 'bg-accent text-foreground' : 'text-foreground/85 hover:bg-accent/60',
          )}
        >
          {renaming ? (
            <RenameInput
              initial={chat.title}
              label="Chat title"
              className="mx-0.5"
              onDone={(title) => {
                setRenaming(false)
                if (title) actions.renameChat(chat.id, title)
                requestAnimationFrame(() => rowRef.current?.focus())
              }}
            />
          ) : (
            <button
              ref={rowRef}
              type="button"
              onClick={onOpen}
              onDoubleClick={startRename}
              aria-current={active ? 'page' : undefined}
              title={chat.title}
              className="focus-visible:ring-ring/30 h-7 min-w-0 flex-1 truncate rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2"
            >
              {chat.title}
            </button>
          )}
          {running && <Spinner className="text-muted-foreground mr-1 size-3" aria-label="Replying" />}
          {!renaming && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Options for ${chat.title}`}
                  className="text-muted-foreground mr-1 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48" onCloseAutoFocus={onCloseAutoFocus}>
                {items(DROPDOWN_KIT)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48" onCloseAutoFocus={onCloseAutoFocus}>
        {items(CONTEXT_KIT)}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function GroupLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex h-7 items-center justify-between gap-2 pr-1 pl-2">
      <span className="text-muted-foreground text-[11px] font-medium">{children}</span>
      {action}
    </div>
  )
}

const HISTORY = ['Today', 'Yesterday', 'Previous 7 days', 'Older'] as const

function historyGroup(time: number): (typeof HISTORY)[number] {
  const start = new Date(now()).setHours(0, 0, 0, 0)
  if (time >= start) return 'Today'
  if (time >= start - DAY) return 'Yesterday'
  if (time >= start - 7 * DAY) return 'Previous 7 days'
  return 'Older'
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
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats])
  const activeChatId = view.kind === 'chat' ? view.chatId : null
  const activeProjectId = view.kind === 'project' ? view.projectId : null
  const pinned = sorted.filter((c) => c.pinned)
  const history = sorted.filter((c) => !c.pinned && !c.projectId)
  const q = query.trim().toLowerCase()
  const results = q ? sorted.filter((c) => c.title.toLowerCase().includes(q)) : []
  const toDelete = chats.find((c) => c.id === deleteId)

  const go = (fn: () => void) => {
    fn()
    onNavigate?.()
  }

  const row = (chat: ChatSummary) => (
    <ChatRow
      key={chat.id}
      chat={chat}
      active={chat.id === activeChatId}
      running={chat.id === runningChatId}
      projects={projects}
      onOpen={() => go(() => actions.openChat(chat.id))}
      onDelete={() => setDeleteId(chat.id)}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid gap-2 p-2">
        <div className="flex items-center gap-1">
          <Button ref={newChatRef} variant="outline" className="min-w-0 flex-1 justify-start" onClick={() => go(() => actions.newChat(null))}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
            New chat
            <KbdGroup className="ml-auto">
              <Kbd>Ctrl</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>O</Kbd>
            </KbdGroup>
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" aria-label="Close sidebar" onClick={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          )}
        </div>
        <label className="bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 flex h-7 items-center gap-1.5 rounded-md border px-2 focus-within:ring-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.stopPropagation()
                setQuery('')
              }
            }}
            placeholder="Search chats"
            aria-label="Search chats by title"
            className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-xs outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Button variant="ghost" size="icon-xs" aria-label="Clear search" className="text-muted-foreground -mr-1" onClick={() => setQuery('')}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          )}
        </label>
      </div>

      <nav aria-label="Chats" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {q ? (
          <section aria-label="Search results">
            <GroupLabel>{results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Results'}</GroupLabel>
            {results.map(row)}
            {!results.length && <p className="text-muted-foreground px-2 py-3 text-xs">No chats match “{query.trim()}”.</p>}
          </section>
        ) : (
          <>
            <section aria-label="Projects">
              <GroupLabel
                action={(
                  <Button variant="ghost" size="icon-xs" aria-label="New project" className="text-muted-foreground" onClick={() => setCreating(true)}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  </Button>
                )}
              >
                Projects
              </GroupLabel>
              {creating && (
                <div className="flex h-7 items-center gap-1.5 px-1">
                  <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="text-muted-foreground ml-1 size-3.5 shrink-0" />
                  <RenameInput
                    initial=""
                    label="Project name"
                    onDone={(name) => {
                      setCreating(false)
                      if (name) go(() => actions.openProject(actions.createProject(name)))
                    }}
                  />
                </div>
              )}
              {projects.map((project) => {
                const mine = sorted.filter((c) => c.projectId === project.id)
                const open = !collapsed.includes(project.id)
                return (
                  <div key={project.id}>
                    <div className={cn('flex h-7 min-w-0 items-center rounded-md', project.id === activeProjectId ? 'bg-accent' : 'hover:bg-accent/60')}>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={`${open ? 'Collapse' : 'Expand'} ${project.name}`}
                        onClick={() => setCollapsed((c) => (open ? [...c, project.id] : c.filter((id) => id !== project.id)))}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 grid h-7 w-5 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2"
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className={cn('size-3 transition-transform', open && 'rotate-90')} />
                      </button>
                      <button
                        type="button"
                        onClick={() => go(() => actions.openProject(project.id))}
                        aria-current={project.id === activeProjectId ? 'page' : undefined}
                        className="focus-visible:ring-ring/30 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left text-xs outline-none focus-visible:ring-2"
                      >
                        <HugeiconsIcon icon={open && mine.length ? FolderOpenIcon : Folder01Icon} strokeWidth={2} className="size-3.5 shrink-0" style={{ color: project.colour }} />
                        <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                        <span className="text-muted-foreground text-[11px] tabular-nums" aria-label={`${mine.length} chats`}>{mine.length}</span>
                      </button>
                    </div>
                    {open && mine.length > 0 && (
                      <div className="border-border ml-[13px] border-l pl-1.5">{mine.map(row)}</div>
                    )}
                  </div>
                )
              })}
            </section>

            {pinned.length > 0 && (
              <section aria-label="Pinned" className="mt-3">
                <GroupLabel>Pinned</GroupLabel>
                {pinned.map(row)}
              </section>
            )}

            {HISTORY.map((group) => {
              const list = history.filter((c) => historyGroup(c.updatedAt) === group)
              if (!list.length) return null
              return (
                <section key={group} aria-label={group} className="mt-3">
                  <GroupLabel>{group}</GroupLabel>
                  {list.map(row)}
                </section>
              )
            })}
            {!chats.length && <p className="text-muted-foreground px-2 py-3 text-xs">No chats yet. Start one above.</p>}
          </>
        )}
      </nav>

      <footer className="grid gap-2 border-t p-2">
        <div className="grid gap-1.5 px-1.5 pt-1">
          <div className="flex items-baseline justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">{Math.round(credits)}% of monthly credits</span>
            <span className="text-muted-foreground">Resets 1 Oct</span>
          </div>
          <Progress value={credits} aria-label={`${Math.round(credits)}% of monthly credits used`} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hover:bg-accent/60 focus-visible:ring-ring/30 aria-expanded:bg-accent flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-left outline-none focus-visible:ring-2"
            >
              <UserAvatar name={USER.name} />
              <span className="grid min-w-0 flex-1 leading-4">
                <span className="truncate text-xs font-medium">{USER.name}</span>
                <span className="text-muted-foreground truncate text-[11px]">{USER.plan}</span>
              </span>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>{USER.email}</DropdownMenuLabel>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>

      <DeleteChatDialog
        chatId={toDelete ? toDelete.id : null}
        title={toDelete?.title ?? ''}
        onClose={() => setDeleteId(null)}
        onDeleted={() => newChatRef.current?.focus()}
      />
    </div>
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
  const deleted = useRef(false)
  // Keeps the title on screen while the dialog animates out.
  const shown = useRef(title)
  if (title) shown.current = title
  return (
    <AlertDialog open={!!chatId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          if (!deleted.current) return
          e.preventDefault()
          deleted.current = false
          onDeleted()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
          <AlertDialogDescription>
            “{shown.current}” and all its replies will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (!chatId) return
              deleted.current = true
              actions.deleteChat(chatId)
              onClose()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
