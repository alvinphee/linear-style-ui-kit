import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Archive02Icon, ArrowDown01Icon, ArrowRight01Icon, BubbleChatIcon, Add01Icon, Cancel01Icon, CopyPlusIcon, Delete02Icon,
  Download01Icon, Edit02Icon, Folder01Icon, FolderAddIcon, FolderEditIcon, FolderOpenIcon, FolderRemoveIcon,
  FolderTransferIcon, LibraryIcon, MessageAdd01Icon, MoreHorizontalIcon, PencilEdit02Icon, PinIcon, PinOffIcon,
  Search01Icon, Share08Icon, SlidersHorizontalIcon, StarIcon, StarOffIcon, Tick02Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { startOfDay, subDays } from 'date-fns'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { NavGroup, NavItem } from '@/components/nav-item'
import { SearchField } from '@/components/search-field'
import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { relativeDay } from '@/lib/format'
import { plural } from '@/lib/text'

// The chat history: the sidebar of an AI chat app, laid out like the big
// chat apps, from the kit's sidebar parts (NavItem rows, NavGroup headings
// that fold). From the top:
//   New chat   the main action (its keys at the end, if you pass them)
//   links      Search chats (a row that opens the search box), All chats
//              (onViewAll) and your own `links`, such as an incognito chat;
//              past four, the rest fold under More
//   Projects   folders of chats, each folding open on its chats. + starts
//              one: named in place (onCreateProject) or your own setup
//              (onNewProject), such as a dialog with its instructions. A
//              project's menu offers a new chat in it, star, edit, share,
//              duplicate, archive and delete. Starred projects come first,
//              then the rest A to Z; archived ones are not listed. A row
//              can show the project's own icon, a people icon when it is
//              shared, and a count of results not opened yet.
//   Shared with me  projects colleagues shared with you (sharedProjects),
//              with their owner's name
//   Pinned     pinned chats
//   Chats      the rest, newest first in one list. Its options button groups
//              them under Today, Yesterday, Previous 7 days, Older (or a
//              chat's own `group`; keep that choice with `groupByDate`) and,
//              given `types`, shows one type of chat.
// Every chat has an icon before its title: its `icon` (what it is about,
// such as a module) or a chat bubble. A row opens its chat; double-click
// renames it in place; its menu (the … button, or a right click) offers pin,
// rename, move to project, duplicate, export and delete, which asks first.
// Only the actions you pass a callback for are offered. `footer` sits at the
// bottom: UsageMeter (components/usage-meter) and AccountMenu
// (blocks/account-menu) are made for it.
//
// It fills its parent's height, so put it in a fixed-width column (an aside
// or a sheet) on the sidebar's colour. The New chat keys are only shown;
// handle them yourself.
//
// ChatMenuItems, RenameInput and DeleteChatDialog are exported so a chat
// header can offer the same menu, rename and confirm.

// A kind of chat, for the Chats filter and the chat library's chips: a
// module, a topic, an agent. An icon, or a dot in `colour`.
export type ChatType = { value: string; label: string; icon?: IconSvgElement; colour?: string }

// A row under New chat: a page (All chats, Library) or an action (Incognito chat).
export type ChatLink = { id: string; label: string; icon: IconSvgElement; onSelect: () => void; active?: boolean }

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
  // Shown before the title, such as the icon of what the chat is about, in
  // `iconColour` (a CSS colour from the theme) or muted. A chat bubble when
  // left out.
  icon?: IconSvgElement
  iconColour?: string
  // A ChatType's `value`, for the Chats filter.
  type?: string
  // Has something not opened yet, such as a scheduled task's result: a dot.
  unread?: boolean
}

export type HistoryProject = {
  id: string
  name: string
  // A CSS colour for the folder, built from theme tokens: var(--chart-2).
  colour?: string
  // Shown in place of the folder.
  icon?: IconSvgElement
  // Listed first, with a star.
  starred?: boolean
  // Not listed.
  archived?: boolean
  // Shared with other people: a people icon after the name.
  shared?: boolean
  // Results not opened yet, such as from scheduled tasks: a count.
  unread?: number
  // Who shared it with you, for the Shared with me group.
  owner?: string
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
export function RenameInput({ initial, label, placeholder, onDone, className }: {
  initial: string
  label: string
  // Shown while empty, such as "Project name" for a new project.
  placeholder?: string
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
      placeholder={placeholder}
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
      className={cn('bg-background border-ring/60 ring-ring/20 placeholder:text-muted-foreground h-6 min-w-0 flex-1 rounded-md border px-1.5 text-xs ring-2 outline-none', className)}
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

// A project's actions, for its row's … menu and its right-click menu.
function ProjectMenuItems({ kit, starred, onNewChat, onStar, onEdit, onShare, onDuplicate, onArchive, onDelete }: {
  kit: MenuKit
  starred?: boolean
  onNewChat?: () => void
  onStar?: (starred: boolean) => void
  onEdit?: () => void
  onShare?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
}) {
  const K = kit
  return (
    <>
      {onNewChat && (
        <K.Item onSelect={onNewChat}>
          <HugeiconsIcon icon={MessageAdd01Icon} strokeWidth={2} />
          New chat in project
        </K.Item>
      )}
      {onStar && (
        <K.Item onSelect={() => onStar(!starred)}>
          <HugeiconsIcon icon={starred ? StarOffIcon : StarIcon} strokeWidth={2} />
          {starred ? 'Unstar' : 'Star'}
        </K.Item>
      )}
      {onEdit && (
        <K.Item onSelect={onEdit}>
          <HugeiconsIcon icon={FolderEditIcon} strokeWidth={2} />
          Edit project
        </K.Item>
      )}
      {onShare && (
        <K.Item onSelect={onShare}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
          Share
        </K.Item>
      )}
      {onDuplicate && (
        <K.Item onSelect={onDuplicate}>
          <HugeiconsIcon icon={CopyPlusIcon} strokeWidth={2} />
          Duplicate
        </K.Item>
      )}
      {onArchive && (
        <K.Item onSelect={onArchive}>
          <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} />
          Archive
        </K.Item>
      )}
      {onDelete && (
        <>
          {(onNewChat || onStar || onEdit || onShare || onDuplicate || onArchive) && <K.Separator />}
          <K.Item variant="destructive" onSelect={onDelete}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete project
          </K.Item>
        </>
      )}
    </>
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
        active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent',
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
          className="focus-visible:ring-ring/30 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2"
        >
          <HugeiconsIcon
            icon={chat.icon ?? BubbleChatIcon}
            strokeWidth={2}
            className={cn('size-3.5 shrink-0', !chat.iconColour && 'opacity-60')}
            style={{ color: chat.iconColour }}
          />
          <span className={cn('min-w-0 truncate', chat.unread && 'font-medium')}>{chat.title}</span>
          {chat.unread && (
            <span className="bg-brand ml-auto size-1.5 shrink-0 rounded-full">
              <span className="sr-only">Unread</span>
            </span>
          )}
        </button>
      )}
      {chat.running &&<Spinner className="text-muted-foreground mr-1 size-3" aria-label="Replying" />}
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

// A date inside Chats (Today, Yesterday…): quieter than a section's heading.
function DateLabel({ children }: { children: ReactNode }) {
  return <div className="text-muted-foreground/70 flex h-6 items-end px-2 pb-0.5 text-[10.5px]">{children}</div>
}

// A type's icon, or a dot in its colour.
function TypeMark({ type }: { type: ChatType }) {
  return type.icon
    ? <HugeiconsIcon icon={type.icon} strokeWidth={2} className="size-3.5" style={{ color: type.colour }} />
    : <span aria-hidden className="bg-muted-foreground mx-1 size-1.5 rounded-full" style={{ background: type.colour }} />
}

// Links past this many fold under More.
const MORE_AFTER = 4

export function ChatHistory({
  chats, projects, sharedProjects = [], activeChatId = null, activeProjectId = null, now, onNewChat, newChatLabel = 'New chat',
  newChatIcon = PencilEdit02Icon, newChatShortcut, newChatRef, links = [], onOpenChat, onOpenProject, onCreateProject,
  onNewProject, onNewChatInProject, onEditProject, onDeleteProject, onStarProject, onShareProject, onDuplicateProject,
  onArchiveProject, onRenameChat, onPinChat, onMoveChat,
  onDuplicateChat, onExportChat, onDeleteChat, onNavigate, onClose, historyLabel = 'Chats', groupByDate,
  onGroupByDateChange, types = [], onViewAll, viewAllLabel = 'All chats', viewAllActive = false,
  searchLabel = 'Search chats', searchPlaceholder = 'Search chats', emptyText = 'No chats yet. Start one above.',
  footer, className,
}: {
  chats: HistoryChat[]
  // Shows the Projects group (with New project, given onCreateProject or onNewProject).
  projects?: HistoryProject[]
  // Projects colleagues shared with you, each with its `owner`: the Shared
  // with me group, after Projects. They open like your own.
  sharedProjects?: HistoryProject[]
  activeChatId?: string | null
  activeProjectId?: string | null
  // The time the date groups count from: a number or a clock. Defaults to now.
  now?: number | (() => number)
  onNewChat?: () => void
  newChatLabel?: string
  // The New chat icon: a pencil by default, Add01Icon for "+ New chat".
  newChatIcon?: IconSvgElement
  // Shown at the end of New chat, such as <Shortcut keys={['mod', 'shift', 'O']} />.
  newChatShortcut?: ReactNode
  newChatRef?: Ref<HTMLButtonElement>
  // Rows of your own under All chats, such as Incognito chat.
  links?: ChatLink[]
  onOpenChat: (id: string) => void
  onOpenProject?: (id: string) => void
  // New project: names one in place (onCreateProject), or opens your own
  // setup instead (onNewProject), such as a dialog with its instructions.
  onCreateProject?: (name: string) => void
  onNewProject?: () => void
  // A project's menu: a new chat in it, editing it, deleting it (asks first;
  // its chats should go back to the history).
  onNewChatInProject?: (id: string) => void
  onEditProject?: (id: string) => void
  onDeleteProject?: (id: string) => void
  // More of a project's menu: star or unstar, share, duplicate, archive.
  onStarProject?: (id: string, starred: boolean) => void
  onShareProject?: (id: string) => void
  onDuplicateProject?: (id: string) => void
  onArchiveProject?: (id: string) => void
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
  // The heading over the chats that are not pinned or in a project.
  historyLabel?: string
  // Chats by date, or one list. Leave out to let the options menu keep the
  // choice itself (one list at first).
  groupByDate?: boolean
  onGroupByDateChange?: (groupByDate: boolean) => void
  // The kinds of chat, for the options menu's Show filter (chat.type).
  types?: ChatType[]
  // Adds an All chats row under New chat, for a page of them all.
  onViewAll?: () => void
  viewAllLabel?: string
  // That page is open.
  viewAllActive?: boolean
  searchLabel?: string
  searchPlaceholder?: string
  emptyText?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [byDateState, setByDateState] = useState(false)
  const [show, setShow] = useState('all')
  const byDate = groupByDate ?? byDateState
  const newChatButton = useRef<HTMLButtonElement | null>(null)

  const setNewChatRef = useCallback((el: HTMLButtonElement | null) => {
    newChatButton.current = el
    if (typeof newChatRef === 'function') newChatRef(el)
    else if (newChatRef) newChatRef.current = el
  }, [newChatRef])

  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats])
  const pinned = sorted.filter((c) => c.pinned)
  const history = sorted.filter((c) => !c.pinned && !c.projectId)
  // Only the types the history has; a chosen type that empties stays, to clear it.
  const shownTypes = types.filter((t) => t.value === show || history.some((c) => c.type === t.value))
  const filter = shownTypes.find((t) => t.value === show)
  const listed = filter ? history.filter((c) => c.type === filter.value) : history
  const q = query.trim().toLowerCase()
  const results = q ? sorted.filter((c) => c.title.toLowerCase().includes(q)) : []
  const toDelete = chats.find((c) => c.id === deleteId)
  const projectToDelete = projects?.find((p) => p.id === deleteProjectId)
  // Archived projects are not listed. Once any is starred, starred ones come
  // first, then the rest A to Z; otherwise they keep the order given.
  const listedProjects = useMemo(() => {
    const live = (projects ?? []).filter((p) => !p.archived)
    if (!live.some((p) => p.starred)) return live
    return [...live].sort((a, b) => Number(!!b.starred) - Number(!!a.starred) || a.name.localeCompare(b.name))
  }, [projects])
  const sharedListed = sharedProjects.filter((p) => !p.archived)
  // Keeps the project's name on screen while its dialog animates closed.
  const deletingProject = useRef({ name: '', chats: 0 })
  if (projectToDelete) {
    deletingProject.current = { name: projectToDelete.name, chats: chats.filter((c) => c.projectId === projectToDelete.id).length }
  }
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  // Sorted newest first, so the date groups come out in order.
  const groups: { label: string; chats: HistoryChat[] }[] = []
  for (const chat of listed) {
    const label = chat.group ?? dateGroup(chat.updatedAt, time)
    const group = groups.find((g) => g.label === label)
    if (group) group.chats.push(chat)
    else groups.push({ label, chats: [chat] })
  }

  const allLinks: ChatLink[] = [
    ...(onViewAll ? [{ id: 'all-chats', label: viewAllLabel, icon: LibraryIcon, onSelect: onViewAll, active: viewAllActive }] : []),
    ...links,
  ]
  const folds = allLinks.length > MORE_AFTER
  const shownLinks = folds && !moreOpen ? allLinks.slice(0, MORE_AFTER - 1) : allLinks
  const canCreate = !!(onCreateProject || onNewProject)

  const go = (fn: () => void) => {
    fn()
    onNavigate?.()
  }
  const startProject = () => (onNewProject ? onNewProject() : setCreating(true))

  const row = (chat: HistoryChat) => (
    <ChatRow
      key={chat.id}
      chat={chat}
      active={chat.id === activeChatId}
      onOpen={() => go(() => onOpenChat(chat.id))}
      actions={{
        projects: projects && listedProjects,
        onRename: onRenameChat && ((title) => onRenameChat(chat.id, title)),
        onPin: onPinChat && ((value) => onPinChat(chat.id, value)),
        onMove: onMoveChat && ((projectId) => onMoveChat(chat.id, projectId)),
        onDuplicate: onDuplicateChat && (() => onDuplicateChat(chat.id)),
        onExport: onExportChat && (() => onExportChat(chat.id)),
        onDelete: onDeleteChat && (() => setDeleteId(chat.id)),
      }}
    />
  )

  // A project's row, folding open on its chats. One shared with you offers
  // only a new chat in it, star and duplicate: the rest is its owner's.
  const projectRow = (project: HistoryProject, sharedWithMe = false) => {
    const mine = sorted.filter((c) => c.projectId === project.id)
    const open = !collapsed.includes(project.id)
    const toggle = () => setCollapsed((c) => (open ? [...c, project.id] : c.filter((id) => id !== project.id)))
    const own = <T,>(fn: T) => (sharedWithMe ? undefined : fn)
    const actions = {
      onNewChat: onNewChatInProject && (() => go(() => onNewChatInProject(project.id))),
      onStar: onStarProject && ((value: boolean) => onStarProject(project.id, value)),
      onEdit: own(onEditProject && (() => onEditProject(project.id))),
      onShare: own(onShareProject && (() => onShareProject(project.id))),
      onDuplicate: onDuplicateProject && (() => onDuplicateProject(project.id)),
      onArchive: own(onArchiveProject && (() => onArchiveProject(project.id))),
      onDelete: own(onDeleteProject && (() => setDeleteProjectId(project.id))),
    }
    const hasMenu = Object.values(actions).some(Boolean)
    const menu = (kit: MenuKit) => <ProjectMenuItems kit={kit} starred={project.starred} {...actions} />
    const unread = project.unread ?? 0
    // The folder turns into the fold chevron on hover.
    const head = (
      <div
        data-active={project.id === activeProjectId}
        className="group/row hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent flex h-7 min-w-0 items-center rounded-md"
      >
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${project.name}`}
          onClick={toggle}
          className="focus-visible:ring-ring/40 grid size-7 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2"
        >
          <HugeiconsIcon
            icon={project.icon ?? (open && mine.length ? FolderOpenIcon : Folder01Icon)}
            strokeWidth={2}
            className="size-3.5 group-hover/row:hidden group-focus-within/row:hidden"
            style={{ color: project.colour }}
          />
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className={cn('text-muted-foreground hidden size-3 transition-transform group-hover/row:block group-focus-within/row:block', open && 'rotate-90')}
          />
        </button>
        <button
          type="button"
          onClick={onOpenProject ? () => go(() => onOpenProject(project.id)) : toggle}
          aria-current={project.id === activeProjectId ? 'page' : undefined}
          title={project.owner ? `${project.name}, shared by ${project.owner}` : project.name}
          className={cn(
            'focus-visible:ring-ring/40 flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md text-left text-xs outline-none focus-visible:ring-2',
            hasMenu ? 'pr-1' : 'pr-2',
          )}
        >
          <span className={cn('min-w-0 truncate', unread > 0 && 'font-medium')}>{project.name}</span>
          {project.starred && (
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} role="img" aria-label="Starred" className="text-status-progress size-3 shrink-0" />
          )}
          {project.shared && !sharedWithMe && (
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} role="img" aria-label="Shared" className="text-muted-foreground size-3 shrink-0" />
          )}
          {sharedWithMe && project.owner && (
            <span className="text-muted-foreground max-w-20 min-w-0 shrink truncate text-[11px]">
              <span className="sr-only">shared by </span>{project.owner}
            </span>
          )}
          <span aria-hidden className="flex-1" />
          {unread > 0 && (
            <span
              aria-label={`${unread} not opened`}
              className="bg-brand/15 text-brand grid h-4 min-w-4 shrink-0 place-items-center rounded-full px-1 text-[10px] font-medium tabular-nums"
            >
              {unread}
            </span>
          )}
          <span className="text-muted-foreground text-[11px] tabular-nums" aria-label={plural(mine.length, 'chat')}>{mine.length}</span>
        </button>
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Options for ${project.name}`}
                className="text-muted-foreground mr-1 opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">{menu(DROPDOWN_MENU_KIT)}</DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
    return (
      <div key={project.id}>
        {hasMenu ? (
          <ContextMenu>
            <ContextMenuTrigger asChild>{head}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">{menu(CONTEXT_MENU_KIT)}</ContextMenuContent>
          </ContextMenu>
        ) : head}
        {open && mine.length > 0 && (
          <div className="border-border ml-[13px] grid gap-px border-l pl-1.5">{mine.map(row)}</div>
        )}
      </div>
    )
  }

  // The Chats options: by date or one list, and which type to show.
  const options = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction
          label="Chat list options"
          icon={SlidersHorizontalIcon}
          size="icon-xs"
          className={cn(filter && 'text-primary')}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={byDate}
          onCheckedChange={(on) => {
            setByDateState(!!on)
            onGroupByDateChange?.(!!on)
          }}
        >
          Group by date
        </DropdownMenuCheckboxItem>
        {shownTypes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={filter ? show : 'all'} onValueChange={setShow}>
              <DropdownMenuRadioItem value="all">
                <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} /> All chats
              </DropdownMenuRadioItem>
              {shownTypes.map((t) => (
                <DropdownMenuRadioItem key={t.value} value={t.value}>
                  <TypeMark type={t} /> {t.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="grid gap-px p-2">
        {(onNewChat || onClose) && (
          <div className="mb-1 flex items-center gap-1">
            {onNewChat && (
              <button
                ref={setNewChatRef}
                type="button"
                onClick={() => go(onNewChat)}
                className="bg-background/60 hover:bg-background focus-visible:ring-ring/40 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 text-left text-xs font-medium shadow-xs outline-none focus-visible:ring-2"
              >
                <HugeiconsIcon icon={newChatIcon} strokeWidth={2} className="size-3.5 shrink-0" />
                <span className="truncate">{newChatLabel}</span>
                {newChatShortcut && <span className="ml-auto flex items-center">{newChatShortcut}</span>}
              </button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" aria-label="Close sidebar" className={cn(!onNewChat && 'ml-auto')} onClick={onClose}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            )}
          </div>
        )}
        {searching || query ? (
          // Leaving the box empty puts the row back.
          <div onBlur={(e) => !query && !e.currentTarget.contains(e.relatedTarget) && setSearching(false)}>
            <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} label="Search chats by title" autoFocus className="text-xs" />
          </div>
        ) : (
          <NavItem icon={Search01Icon} label={searchLabel} onClick={() => setSearching(true)} />
        )}
        {shownLinks.map((link) => (
          <NavItem key={link.id} icon={link.icon} label={link.label} active={link.active} onClick={() => go(link.onSelect)} />
        ))}
        {folds && (
          <NavItem
            icon={moreOpen ? ArrowDown01Icon : ArrowRight01Icon}
            label={moreOpen ? 'Less' : 'More'}
            onClick={() => setMoreOpen((o) => !o)}
            className="text-muted-foreground"
          />
        )}
      </div>

      <nav aria-label="Chats" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {q ? (
          <section aria-label="Search results">
            <NavGroup title={results.length ? plural(results.length, 'result') : 'Results'} foldable={false} className="mt-1">
              {results.map(row)}
              {!results.length && <p className="text-muted-foreground px-2 py-3 text-xs">No chats match “{query.trim()}”.</p>}
            </NavGroup>
          </section>
        ) : (
          <>
            {projects && (listedProjects.length > 0 || canCreate) && (
              <section aria-label="Projects">
                <NavGroup
                  title="Projects"
                  className="mt-1"
                  action={canCreate && <IconAction label="New project" icon={Add01Icon} size="icon-xs" onClick={startProject} />}
                >
                  {creating && onCreateProject && (
                    <div className="flex h-7 items-center gap-1.5 px-1">
                      <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="text-muted-foreground ml-1 size-3.5 shrink-0" />
                      <RenameInput
                        initial=""
                        label="Project name"
                        placeholder="Project name, then Enter"
                        onDone={(name) => {
                          setCreating(false)
                          if (name) go(() => onCreateProject(name))
                        }}
                      />
                    </div>
                  )}
                  {listedProjects.map((p) => projectRow(p))}
                  {!listedProjects.length && !creating && (
                    <NavItem icon={FolderAddIcon} label="Group chats into a project" onClick={startProject} className="text-muted-foreground" />
                  )}
                </NavGroup>
              </section>
            )}

            {sharedListed.length > 0 && (
              <section aria-label="Shared with me">
                <NavGroup title="Shared with me" count={sharedListed.length}>
                  {sharedListed.map((p) => projectRow(p, true))}
                </NavGroup>
              </section>
            )}

            {pinned.length > 0 && (
              <section aria-label="Pinned">
                <NavGroup title="Pinned" count={pinned.length}>{pinned.map(row)}</NavGroup>
              </section>
            )}

            {history.length > 0 && (
              <section aria-label={historyLabel}>
                <NavGroup title={filter ? `${historyLabel} · ${filter.label}` : historyLabel} action={options}>
                  {byDate
                    ? groups.map((group) => (
                      <div key={group.label} role="group" aria-label={group.label} className="grid gap-px">
                        <DateLabel>{group.label}</DateLabel>
                        {group.chats.map(row)}
                      </div>
                    ))
                    : listed.map(row)}
                  {!listed.length && (
                    <p className="text-muted-foreground px-2 py-2 text-xs">
                      No {filter?.label ?? ''} chats here.{' '}
                      <button type="button" onClick={() => setShow('all')} className="text-foreground underline-offset-2 hover:underline">
                        Show all
                      </button>
                    </p>
                  )}
                </NavGroup>
              </section>
            )}
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
      {onDeleteProject && (
        <DeleteConfirm
          open={!!projectToDelete}
          onOpenChange={(next) => !next && setDeleteProjectId(null)}
          title="Delete this project?"
          description={(
            <>
              “{deletingProject.current.name}” and its instructions will be deleted.{' '}
              {deletingProject.current.chats === 0
                ? 'It has no chats.'
                : deletingProject.current.chats === 1
                  ? 'Its chat moves to your history.'
                  : `Its ${deletingProject.current.chats} chats move to your history.`}
            </>
          )}
          confirmLabel="Delete project"
          icon={null}
          onConfirm={() => {
            if (projectToDelete) onDeleteProject(projectToDelete.id)
            setDeleteProjectId(null)
          }}
          afterConfirm={() => newChatButton.current?.focus()}
        />
      )}
    </div>
  )
}
