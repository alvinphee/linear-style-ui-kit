import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowRight01Icon, Cancel01Icon, CopyPlusIcon, Delete02Icon, Download01Icon, Edit02Icon, Folder01Icon,
  FolderOpenIcon, FolderRemoveIcon, FolderTransferIcon, MoreHorizontalIcon, PencilEdit02Icon, PinIcon, PinOffIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { startOfDay, subDays } from 'date-fns'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { SearchField } from '@/components/search-field'
import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { relativeDay } from '@/lib/format'
import { plural } from '@/lib/text'

// The chat history: the sidebar of an AI chat app. From the top: New chat
// (with its keys, if you pass them), a search over chat titles, projects
// (folders that fold open on their chats, with a count), pinned chats, then
// every other chat grouped by date: Today, Yesterday, Previous 7 days, Older
// (or under each chat's own `group`). A row opens its chat; double-click
// renames it in place; its menu (the … button, or a right click) offers pin,
// rename, move to project, duplicate, export and delete, which asks first.
// Only the actions you pass a callback for are offered. `footer` sits at the
// bottom: UsageMeter (components/usage-meter) and AccountMenu
// (blocks/account-menu) are made for it.
//
// It fills its parent's height, so put it in a fixed-width column (an aside
// or a sheet). The New chat keys are only shown; handle them yourself.
//
// ChatMenuItems, RenameInput and DeleteChatDialog are exported so a chat
// header can offer the same menu, rename and confirm.

export type HistoryChat = {
  id: string
  title: string
  // The project it sits in; left out (or null) for the plain history.
  projectId?: string | null
  pinned?: boolean
  // When it last changed, in ms. Sorts the list and picks its date group.
  updatedAt: number
  // A reply is being written: the row shows a spinner.
  running?: boolean
  // A heading to list it under instead of its date group.
  group?: string
}

export type HistoryProject = {
  id: string
  name: string
  // A CSS colour for the folder, built from theme tokens: var(--chart-2).
  colour?: string
}

// Today, Yesterday, Previous 7 days or Older, in calendar days from `now`.
export function dateGroup(time: number, now = Date.now()) {
  const day = relativeDay(time, now)
  if (day) return day
  return time >= subDays(startOfDay(now), 7).getTime() ? 'Previous 7 days' : 'Older'
}

// A chat's actions, for the history's row menus and a chat header's menu.
// The same items render in the … dropdown and the right-click menu: pass a
// menu kit. `extra` goes after Duplicate (and Export), before Delete.
export function ChatMenuItems({ kit, chat, projects, onPin, onRename, onMove, onDuplicate, onExport, onDelete, extra }: {
  kit: MenuKit
  chat: Pick<HistoryChat, 'pinned' | 'projectId'>
  projects?: HistoryProject[]
  onPin?: (pinned: boolean) => void
  onRename?: () => void
  onMove?: (projectId: string | null) => void
  onDuplicate?: () => void
  onExport?: () => void
  onDelete?: () => void
  extra?: ReactNode
}) {
  const K = kit
  return (
    <>
      {onPin && (
        <K.Item onSelect={() => onPin(!chat.pinned)}>
          <HugeiconsIcon icon={chat.pinned ? PinOffIcon : PinIcon} strokeWidth={2} />
          {chat.pinned ? 'Unpin' : 'Pin'}
        </K.Item>
      )}
      {onRename && (
        <K.Item onSelect={onRename}>
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          Rename
        </K.Item>
      )}
      {onMove && projects && (
        <K.Sub>
          <K.SubTrigger>
            <HugeiconsIcon icon={FolderTransferIcon} strokeWidth={2} />
            Move to project
          </K.SubTrigger>
          <K.SubContent className="w-48">
            {projects.map((project) => (
              <K.Item key={project.id} disabled={chat.projectId === project.id} onSelect={() => onMove(project.id)}>
                <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} style={{ color: project.colour }} />
                <span className="min-w-0 truncate">{project.name}</span>
                {chat.projectId === project.id && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto" />}
              </K.Item>
            ))}
            {!projects.length && <K.Item disabled>No projects yet</K.Item>}
            {chat.projectId && (
              <>
                <K.Separator />
                <K.Item onSelect={() => onMove(null)}>
                  <HugeiconsIcon icon={FolderRemoveIcon} strokeWidth={2} />
                  Remove from project
                </K.Item>
              </>
            )}
          </K.SubContent>
        </K.Sub>
      )}
      {onDuplicate && (
        <K.Item onSelect={onDuplicate}>
          <HugeiconsIcon icon={CopyPlusIcon} strokeWidth={2} />
          Duplicate
        </K.Item>
      )}
      {onExport && (
        <K.Item onSelect={onExport}>
          <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
          Export
        </K.Item>
      )}
      {extra}
      {onDelete && (
        <>
          <K.Separator />
          <K.Item variant="destructive" onSelect={onDelete}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete
          </K.Item>
        </>
      )}
    </>
  )
}

// A small input that edits a name in place: Enter or leaving it saves,
// Escape cancels. It takes focus and selects its text when it appears.
export function RenameInput({ initial, label, onDone, className }: {
  initial: string
  label: string
  // null means cancelled (or left empty).
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

// "Delete this chat?" Give it the chat's title while open; it keeps showing
// that title while it animates out. `onDeleted` is where focus should go once
// the chat, and the button that opened this, are gone.
export function DeleteChatDialog({ open, title, onClose, onConfirm, onDeleted }: {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
  onDeleted?: () => void
}) {
  // Keeps the title on screen while the dialog animates closed.
  const shown = useRef(title)
  if (title) shown.current = title
  return (
    <DeleteConfirm
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Delete this chat?"
      description={<>“{shown.current}” and all its replies will be deleted. This cannot be undone.</>}
      icon={null}
      onConfirm={() => {
        if (!open) return
        onConfirm()
        onClose()
      }}
      afterConfirm={onDeleted}
    />
  )
}

type RowActions = {
  projects?: HistoryProject[]
  onRename?: (title: string) => void
  onPin?: (pinned: boolean) => void
  onMove?: (projectId: string | null) => void
  onDuplicate?: () => void
  onExport?: () => void
  onDelete?: () => void
}

function ChatRow({ chat, active, onOpen, actions }: {
  chat: HistoryChat
  active: boolean
  onOpen: () => void
  actions: RowActions
}) {
  const [renaming, setRenaming] = useState(false)
  const skipFocusReturn = useRef(false)
  const rowRef = useRef<HTMLButtonElement>(null)
  const { projects, onRename, onPin, onMove, onDuplicate, onExport, onDelete } = actions
  const hasMenu = !!(onRename || onPin || (onMove && projects) || onDuplicate || onExport || onDelete)

  function startRename() {
    skipFocusReturn.current = true
    setRenaming(true)
  }
  const onCloseAutoFocus = (e: Event) => {
    if (!skipFocusReturn.current) return
    e.preventDefault()
    skipFocusReturn.current = false
  }
  const items = (kit: MenuKit) => (
    <ChatMenuItems
      kit={kit}
      chat={chat}
      projects={projects}
      onPin={onPin}
      onRename={onRename && startRename}
      onMove={onMove}
      onDuplicate={onDuplicate}
      onExport={onExport}
      onDelete={onDelete}
    />
  )

  const row = (
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
            if (title) onRename?.(title)
            requestAnimationFrame(() => rowRef.current?.focus())
          }}
        />
      ) : (
        <button
          ref={rowRef}
          type="button"
          onClick={onOpen}
          onDoubleClick={onRename && startRename}
          aria-current={active ? 'page' : undefined}
          title={chat.title}
          className="focus-visible:ring-ring/30 h-7 min-w-0 flex-1 truncate rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2"
        >
          {chat.title}
        </button>
      )}
      {chat.running && <Spinner className="text-muted-foreground mr-1 size-3" aria-label="Replying" />}
      {!renaming && hasMenu && (
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
            {items(DROPDOWN_MENU_KIT)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )

  if (!hasMenu) return row
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent className="w-48" onCloseAutoFocus={onCloseAutoFocus}>
        {items(CONTEXT_MENU_KIT)}
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

export function ChatHistory({
  chats, projects, activeChatId = null, activeProjectId = null, now, onNewChat, newChatLabel = 'New chat',
  newChatShortcut, newChatRef, onOpenChat, onOpenProject, onCreateProject, onRenameChat, onPinChat, onMoveChat,
  onDuplicateChat, onExportChat, onDeleteChat, onNavigate, onClose, searchPlaceholder = 'Search chats',
  emptyText = 'No chats yet. Start one above.', footer, className,
}: {
  chats: HistoryChat[]
  // Shows the Projects group (with New project, given onCreateProject).
  projects?: HistoryProject[]
  activeChatId?: string | null
  activeProjectId?: string | null
  // The time the date groups count from: a number or a clock. Defaults to now.
  now?: number | (() => number)
  onNewChat?: () => void
  newChatLabel?: string
  // Shown at the end of New chat, such as <Shortcut keys={['mod', 'shift', 'O']} />.
  newChatShortcut?: ReactNode
  newChatRef?: Ref<HTMLButtonElement>
  onOpenChat: (id: string) => void
  onOpenProject?: (id: string) => void
  onCreateProject?: (name: string) => void
  onRenameChat?: (id: string, title: string) => void
  onPinChat?: (id: string, pinned: boolean) => void
  onMoveChat?: (id: string, projectId: string | null) => void
  onDuplicateChat?: (id: string) => void
  onExportChat?: (id: string) => void
  // Called once the person has confirmed.
  onDeleteChat?: (id: string) => void
  // Called after moving somewhere (a chat, a project, New chat), so a sheet can close.
  onNavigate?: () => void
  // Shows a close button beside New chat, for a sheet.
  onClose?: () => void
  searchPlaceholder?: string
  emptyText?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const newChatButton = useRef<HTMLButtonElement | null>(null)

  const setNewChatRef = useCallback((el: HTMLButtonElement | null) => {
    newChatButton.current = el
    if (typeof newChatRef === 'function') newChatRef(el)
    else if (newChatRef) newChatRef.current = el
  }, [newChatRef])

  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats])
  const pinned = sorted.filter((c) => c.pinned)
  const history = sorted.filter((c) => !c.pinned && !c.projectId)
  const q = query.trim().toLowerCase()
  const results = q ? sorted.filter((c) => c.title.toLowerCase().includes(q)) : []
  const toDelete = chats.find((c) => c.id === deleteId)
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  // Sorted newest first, so the date groups come out in order.
  const groups: { label: string; chats: HistoryChat[] }[] = []
  for (const chat of history) {
    const label = chat.group ?? dateGroup(chat.updatedAt, time)
    const group = groups.find((g) => g.label === label)
    if (group) group.chats.push(chat)
    else groups.push({ label, chats: [chat] })
  }

  const go = (fn: () => void) => {
    fn()
    onNavigate?.()
  }

  const row = (chat: HistoryChat) => (
    <ChatRow
      key={chat.id}
      chat={chat}
      active={chat.id === activeChatId}
      onOpen={() => go(() => onOpenChat(chat.id))}
      actions={{
        projects,
        onRename: onRenameChat && ((title) => onRenameChat(chat.id, title)),
        onPin: onPinChat && ((value) => onPinChat(chat.id, value)),
        onMove: onMoveChat && ((projectId) => onMoveChat(chat.id, projectId)),
        onDuplicate: onDuplicateChat && (() => onDuplicateChat(chat.id)),
        onExport: onExportChat && (() => onExportChat(chat.id)),
        onDelete: onDeleteChat && (() => setDeleteId(chat.id)),
      }}
    />
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="grid gap-2 p-2">
        {(onNewChat || onClose) && (
          <div className="flex items-center gap-1">
            {onNewChat && (
              <Button ref={setNewChatRef} variant="outline" className="min-w-0 flex-1 justify-start" onClick={() => go(onNewChat)}>
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                {newChatLabel}
                {newChatShortcut && <span className="ml-auto flex items-center">{newChatShortcut}</span>}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" aria-label="Close sidebar" className={cn(!onNewChat && 'ml-auto')} onClick={onClose}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            )}
          </div>
        )}
        <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} label="Search chats by title" className="text-xs" />
      </div>

      <nav aria-label="Chats" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {q ? (
          <section aria-label="Search results">
            <GroupLabel>{results.length ? plural(results.length, 'result') : 'Results'}</GroupLabel>
            {results.map(row)}
            {!results.length && <p className="text-muted-foreground px-2 py-3 text-xs">No chats match “{query.trim()}”.</p>}
          </section>
        ) : (
          <>
            {projects && (projects.length > 0 || onCreateProject) && (
              <section aria-label="Projects">
                <GroupLabel
                  action={onCreateProject && (
                    <Button variant="ghost" size="icon-xs" aria-label="New project" className="text-muted-foreground" onClick={() => setCreating(true)}>
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    </Button>
                  )}
                >
                  Projects
                </GroupLabel>
                {creating && onCreateProject && (
                  <div className="flex h-7 items-center gap-1.5 px-1">
                    <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="text-muted-foreground ml-1 size-3.5 shrink-0" />
                    <RenameInput
                      initial=""
                      label="Project name"
                      onDone={(name) => {
                        setCreating(false)
                        if (name) go(() => onCreateProject(name))
                      }}
                    />
                  </div>
                )}
                {projects.map((project) => {
                  const mine = sorted.filter((c) => c.projectId === project.id)
                  const open = !collapsed.includes(project.id)
                  const toggle = () => setCollapsed((c) => (open ? [...c, project.id] : c.filter((id) => id !== project.id)))
                  return (
                    <div key={project.id}>
                      <div className={cn('flex h-7 min-w-0 items-center rounded-md', project.id === activeProjectId ? 'bg-accent' : 'hover:bg-accent/60')}>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`${open ? 'Collapse' : 'Expand'} ${project.name}`}
                          onClick={toggle}
                          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 grid h-7 w-5 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2"
                        >
                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className={cn('size-3 transition-transform', open && 'rotate-90')} />
                        </button>
                        <button
                          type="button"
                          onClick={onOpenProject ? () => go(() => onOpenProject(project.id)) : toggle}
                          aria-current={project.id === activeProjectId ? 'page' : undefined}
                          className="focus-visible:ring-ring/30 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-left text-xs outline-none focus-visible:ring-2"
                        >
                          <HugeiconsIcon icon={open && mine.length ? FolderOpenIcon : Folder01Icon} strokeWidth={2} className="size-3.5 shrink-0" style={{ color: project.colour }} />
                          <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                          <span className="text-muted-foreground text-[11px] tabular-nums" aria-label={plural(mine.length, 'chat')}>{mine.length}</span>
                        </button>
                      </div>
                      {open && mine.length > 0 && (
                        <div className="border-border ml-[13px] border-l pl-1.5">{mine.map(row)}</div>
                      )}
                    </div>
                  )
                })}
              </section>
            )}

            {pinned.length > 0 && (
              <section aria-label="Pinned" className="mt-3">
                <GroupLabel>Pinned</GroupLabel>
                {pinned.map(row)}
              </section>
            )}

            {groups.map((group) => (
              <section key={group.label} aria-label={group.label} className="mt-3">
                <GroupLabel>{group.label}</GroupLabel>
                {group.chats.map(row)}
              </section>
            ))}
            {!chats.length && <p className="text-muted-foreground px-2 py-3 text-xs">{emptyText}</p>}
          </>
        )}
      </nav>

      {footer && <footer className="grid gap-2 border-t p-2">{footer}</footer>}

      {onDeleteChat && (
        <DeleteChatDialog
          open={!!toDelete}
          title={toDelete?.title ?? ''}
          onClose={() => setDeleteId(null)}
          onConfirm={() => toDelete && onDeleteChat(toDelete.id)}
          onDeleted={() => newChatButton.current?.focus()}
        />
      )}
    </div>
  )
}
