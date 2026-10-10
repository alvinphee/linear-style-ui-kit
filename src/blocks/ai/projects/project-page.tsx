import { useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Archive01Icon, ArchiveRestoreIcon, ArrowUp02Icon, BubbleChatIcon, Cancel01Icon, Copy01Icon, Delete02Icon,
  Edit02Icon, Folder01Icon, MoreHorizontalIcon, PencilEdit02Icon, Settings02Icon, StarIcon, UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { fileIcon } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { formatFileSize, formatRelativeDate } from '@/lib/format'

// A project's page in an AI chat app: its name and description, the custom
// instructions the assistant follows in every chat in it, its project
// knowledge (the files the assistant draws on) and its chats. The way
// ChatGPT, Claude and Gemini open a project: a page of its own, not a
// dialog. The app keeps the project; the page reports each edit.
//
// Give it `tabs` and it becomes a workspace: a tab strip under the header
// (Overview, Chats, Knowledge…), each tab's content from the app. The parts
// of the plain page are exported so the app can put them in its tabs:
// ProjectOverviewHeader, ProjectInstructions, ProjectKnowledgeList and
// ProjectChatList, with ProjectStats and ProjectStartChat for an overview.
// The header can also star, share, archive and duplicate the project, each
// shown only when its callback is passed.

// A file in the project's knowledge. The icon follows the name.
export type ProjectFile = { id: string; name: string; size: number }

export type ProjectPageProject = {
  id: string
  name: string
  // A CSS colour for the folder, built from theme tokens: var(--chart-2).
  colour?: string
  description?: string
  instructions: string
  files: ProjectFile[]
}

// A chat in the project, for the list at the foot of the page.
export type ProjectChat = {
  id: string
  title: string
  // When it last changed, in ms.
  updatedAt: number
  // Shown before the title, in `iconColour` or muted. A chat bubble when left out.
  icon?: IconSvgElement
  iconColour?: string
}

// One tab of the project workspace. `count` shows after the label.
export type ProjectPageTab = {
  id: string
  label: string
  icon?: IconSvgElement
  count?: number
  content: ReactNode
}

type ProjectPatch = Partial<Pick<ProjectPageProject, 'name' | 'description' | 'instructions'>>

export type ProjectPageProps = {
  project: ProjectPageProject
  chats?: ProjectChat[]
  // Each edit of the name, description or instructions, as it is typed.
  onChange: (patch: ProjectPatch) => void
  // Files picked for the project's knowledge. Left out: no Add files.
  onAddFiles?: (files: File[]) => void
  onRemoveFile?: (fileId: string) => void
  onNewChat?: () => void
  onOpenChat?: (id: string) => void
  // Called once the person has confirmed. Left out: no Delete project.
  onDelete?: () => void
  // Shown at the start of the header, such as a sidebar toggle.
  start?: ReactNode
  // The header row (folder, name, New chat, menu). Off when the app's own
  // header already names the page.
  header?: boolean
  // The longest the instructions can be.
  maxInstructions?: number
  // Under the Project knowledge heading. Say where the files go.
  filesHint?: string
  // The clock the chats' times are relative to (a demo clock). Now when left out.
  now?: number | (() => number)
  className?: string

  // The workspace tabs. Left out: the plain page, everything on one scroll.
  tabs?: ProjectPageTab[]
  // The open tab, and each switch. Left out: the page keeps its own, first tab first.
  tab?: string
  onTabChange?: (id: string) => void
  // Shown in the header in the project's colour, in place of the folder.
  icon?: IconSvgElement
  // Left out onStarChange: no star.
  starred?: boolean
  onStarChange?: (starred: boolean) => void
  // Left out: no Share button. `sharedLabel` replaces its label: "Shared with 4".
  onShare?: () => void
  sharedLabel?: string
  // Menu items, each shown when passed. Edit details opens the app's dialog.
  onEditDetails?: () => void
  onDuplicate?: () => void
  // Archived shows a banner with Restore. Called with the new state.
  archived?: boolean
  onArchive?: (archived: boolean) => void
}

function Block({ title, hint, action, children, className }: {
  title: string
  hint?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('grid min-w-0 gap-2', className)}>
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-xs font-medium">{title}</h4>
          {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// The project's name and description, edited in place as plain text.
export function ProjectOverviewHeader({ name, description, onChange, nameRef, className }: {
  name: string
  description?: string
  onChange: (patch: { name?: string; description?: string }) => void
  // The name's input, so a Rename menu item can select it.
  nameRef?: Ref<HTMLInputElement>
  className?: string
}) {
  return (
    <div className={cn('grid gap-1', className)}>
      <input
        ref={nameRef}
        aria-label="Project name"
        placeholder="Project name"
        value={name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-lg font-semibold tracking-tight outline-none"
      />
      <textarea
        rows={1}
        aria-label="Description"
        placeholder="Add a description…"
        value={description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        className="placeholder:text-muted-foreground text-muted-foreground field-sizing-content block w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
      />
    </div>
  )
}

// The custom instructions, with a count of what is left.
export function ProjectInstructions({
  value, onChange, max = 1000, hint = 'The assistant follows these in every chat in this project.', className,
}: {
  value: string
  onChange: (value: string) => void
  max?: number
  hint?: string
  className?: string
}) {
  return (
    <Block title="Custom instructions" hint={hint} className={className}>
      <Textarea
        aria-label="Custom instructions"
        placeholder="For example: keep answers short, and use tables for numbers."
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24 text-[13px]"
      />
      <span className="text-muted-foreground justify-self-end text-[11px] tabular-nums">
        {value.length} / {max}
      </span>
    </Block>
  )
}

// The project knowledge: its files, Add files and remove.
export function ProjectKnowledgeList({
  files, onAddFiles, onRemoveFile, hint = 'Files the assistant draws on in every chat in this project.', className,
}: {
  files: ProjectFile[]
  // Left out: no Add files.
  onAddFiles?: (files: File[]) => void
  // Left out: no remove buttons.
  onRemoveFile?: (fileId: string) => void
  hint?: string
  className?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const addFiles = onAddFiles && (
    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
      Add files
    </Button>
  )

  return (
    <Block title="Project knowledge" hint={hint} action={files.length ? addFiles : undefined} className={className}>
      {files.length ? (
        <ul className="divide-y rounded-lg border">
          {files.map((file) => (
            <li key={file.id} className="flex h-10 min-w-0 items-center gap-2.5 pr-1.5 pl-3 text-xs">
              <span className="bg-muted grid size-6 shrink-0 place-items-center rounded">
                <HugeiconsIcon icon={fileIcon(file.name)} strokeWidth={2} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatFileSize(file.size)}</span>
              {onRemoveFile && (
                <IconAction label={`Remove ${file.name}`} icon={Cancel01Icon} onClick={() => onRemoveFile(file.id)} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="gap-2 rounded-lg border px-3 py-5">
          <EmptyDescription>No files yet. Add PDFs, sheets or notes for the assistant to draw on.</EmptyDescription>
          {addFiles && <EmptyContent>{addFiles}</EmptyContent>}
        </Empty>
      )}
      {onAddFiles && (
        <input
          ref={fileRef}
          type="file"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(Array.from(e.target.files))
            e.target.value = ''
          }}
        />
      )}
    </Block>
  )
}

// The project's chats, newest first. The title is "Chats · <count>" unless given.
export function ProjectChatList({ chats, onOpenChat, onNewChat, now, title, className }: {
  chats: ProjectChat[]
  onOpenChat?: (id: string) => void
  // Offered in the empty state as Start one.
  onNewChat?: () => void
  now?: number | (() => number)
  title?: string
  className?: string
}) {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
  const time = typeof now === 'function' ? now() : now ?? Date.now()
  return (
    <Block title={title ?? `Chats · ${sorted.length}`} className={className}>
      {sorted.length ? (
        <ul className="divide-y rounded-lg border">
          {sorted.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => onOpenChat?.(chat.id)}
                className="hover:bg-accent/60 focus-visible:bg-accent flex h-10 w-full min-w-0 items-center gap-2.5 px-3 text-left text-xs outline-none"
              >
                <HugeiconsIcon
                  icon={chat.icon ?? BubbleChatIcon}
                  strokeWidth={2}
                  className="text-muted-foreground size-3.5 shrink-0"
                  style={{ color: chat.iconColour }}
                />
                <span className="min-w-0 flex-1 truncate">{chat.title}</span>
                <span className="text-muted-foreground shrink-0 text-[11px]">
                  {formatRelativeDate(chat.updatedAt, { now: time, time: true })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="gap-2 rounded-lg border px-3 py-5">
          <EmptyDescription>No chats in this project yet.</EmptyDescription>
          {onNewChat && (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={onNewChat}>
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                Start one
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
    </Block>
  )
}

// One number about the project. With onClick the tile is a button (go to its tab).
export type ProjectStat = {
  id: string
  label: string
  value: number | string
  icon?: IconSvgElement
  onClick?: () => void
}

// A row of small stat tiles for an overview: chats, files, connectors, schedules.
export function ProjectStats({ items, className }: { items: ProjectStat[]; className?: string }) {
  return (
    <div className={cn('@container min-w-0', className)}>
      <ul className="grid grid-cols-2 gap-2 @md:grid-cols-4">
        {items.map((item) => {
          const body = (
            <>
              <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]">
                {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-base font-semibold tabular-nums">{item.value}</span>
            </>
          )
          const tile = 'grid min-w-0 gap-0.5 rounded-lg border px-3 py-2 text-left'
          return (
            <li key={item.id} className="min-w-0">
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(tile, 'hover:bg-accent/60 focus-visible:ring-ring/50 w-full outline-none focus-visible:ring-2')}
                >
                  {body}
                </button>
              ) : (
                <div className={tile}>{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// A compact box to start a chat in the project. Enter sends, Shift+Enter
// adds a line. Not the full prompt box: no attachments, models or tools.
export function ProjectStartChat({ projectName, onSend, placeholder, disabled, className }: {
  projectName: string
  onSend: (text: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [text, setText] = useState('')
  const label = `Start a chat in ${projectName || 'this project'}`
  const send = (e?: FormEvent) => {
    e?.preventDefault()
    const value = text.trim()
    if (!value || disabled) return
    onSend(value)
    setText('')
  }
  return (
    <form
      onSubmit={send}
      className={cn(
        'bg-card focus-within:border-ring/60 flex min-w-0 items-end gap-2 rounded-lg border py-1.5 pr-1.5 pl-3 transition-colors',
        className,
      )}
    >
      <textarea
        rows={1}
        aria-label={label}
        placeholder={placeholder ?? `${label}…`}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
          e.preventDefault()
          send()
        }}
        className="placeholder:text-muted-foreground field-sizing-content max-h-40 min-h-7 min-w-0 flex-1 resize-none bg-transparent py-1 text-[13px] leading-relaxed outline-none"
      />
      <Button type="submit" size="icon" aria-label="Send" disabled={disabled || !text.trim()}>
        <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
      </Button>
    </form>
  )
}

export function ProjectPage({
  project, chats = [], onChange, onAddFiles, onRemoveFile, onNewChat, onOpenChat, onDelete, start, header = true,
  maxInstructions = 1000, filesHint = 'Files the assistant draws on in every chat in this project.', now, className,
  tabs, tab, onTabChange, icon, starred = false, onStarChange, onShare, sharedLabel, onEditDetails, onDuplicate,
  archived = false, onArchive,
}: ProjectPageProps) {
  const [confirm, setConfirm] = useState(false)
  const [ownTab, setOwnTab] = useState(tabs?.[0]?.id ?? '')
  const nameRef = useRef<HTMLInputElement>(null)
  const renaming = useRef(false)
  const name = project.name || 'Untitled project'
  const tabbed = !!tabs?.length
  const openTab = tab ?? (tabs?.some((t) => t.id === ownTab) ? ownTab : tabs?.[0]?.id ?? '')
  const changeTab = (id: string) => {
    setOwnTab(id)
    onTabChange?.(id)
  }
  // Rename selects the name on the page, so it needs the plain page's name field.
  const canRename = !tabbed
  const hasMenu = canRename || !!(onEditDetails || onDuplicate || onArchive || onDelete)

  return (
    <div className={cn('@container flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      {header && (
        <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
          {start}
          <HugeiconsIcon icon={icon ?? Folder01Icon} strokeWidth={2} className="ml-1 size-4 shrink-0" style={{ color: project.colour }} />
          <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium">{name}</span>
          {onStarChange && (
            <IconAction
              label="Star project"
              pressed={starred}
              onClick={() => onStarChange(!starred)}
              className="aria-pressed:text-status-progress aria-pressed:bg-transparent dark:aria-pressed:bg-transparent"
            >
              <HugeiconsIcon icon={StarIcon} strokeWidth={2} className={cn(starred && '[&_path]:fill-current')} />
            </IconAction>
          )}
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare} className="text-muted-foreground">
              <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} data-icon="inline-start" />
              <span className="sr-only @md:not-sr-only">{sharedLabel ?? 'Share'}</span>
            </Button>
          )}
          {onNewChat && (
            <Button size="sm" onClick={onNewChat}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
              New chat
            </Button>
          )}
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Project options" className="text-muted-foreground">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                onCloseAutoFocus={(e) => {
                  if (!renaming.current) return
                  renaming.current = false
                  e.preventDefault()
                  nameRef.current?.select()
                }}
              >
                {canRename && (
                  <DropdownMenuItem onSelect={() => { renaming.current = true }}>
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} /> Rename
                  </DropdownMenuItem>
                )}
                {onEditDetails && (
                  <DropdownMenuItem onSelect={onEditDetails}>
                    <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} /> Edit details
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onSelect={onDuplicate}>
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onSelect={() => onArchive(!archived)}>
                    <HugeiconsIcon icon={archived ? ArchiveRestoreIcon : Archive01Icon} strokeWidth={2} />
                    {archived ? 'Restore' : 'Archive'}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    {(canRename || onEditDetails || onDuplicate || onArchive) && <DropdownMenuSeparator />}
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete project
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
      )}

      {archived && (
        <div role="status" className="bg-muted/60 flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-2 text-xs">
          <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">This project is archived.</span>
          {onArchive && (
            <Button variant="outline" size="sm" onClick={() => onArchive(false)}>
              <HugeiconsIcon icon={ArchiveRestoreIcon} strokeWidth={2} data-icon="inline-start" />
              Restore
            </Button>
          )}
        </div>
      )}

      {tabbed ? (
        <Tabs value={openTab} onValueChange={changeTab} className="min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none]">
            <TabsList variant="line" aria-label="Project" className="w-max justify-start gap-0.5 p-0 px-2 group-data-horizontal/tabs:h-10">
              {tabs!.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="h-full flex-none px-2 group-data-horizontal/tabs:after:bottom-0"
                >
                  {t.icon && <HugeiconsIcon icon={t.icon} strokeWidth={2} />}
                  {t.label}
                  {t.count !== undefined && (
                    <span className="text-muted-foreground text-[11px] font-normal tabular-nums">{t.count}</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tabs!.map((t) => (
            <TabsContent key={t.id} value={t.id} className="min-h-0 overflow-y-auto text-[13px]">
              <div className="mx-auto w-full max-w-3xl min-w-0 px-4 py-6">{t.content}</div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-2xl min-w-0 gap-7 px-4 py-6">
            <ProjectOverviewHeader name={project.name} description={project.description} onChange={onChange} nameRef={nameRef} />
            <ProjectInstructions
              value={project.instructions}
              onChange={(instructions) => onChange({ instructions })}
              max={maxInstructions}
            />
            <ProjectKnowledgeList files={project.files} hint={filesHint} onAddFiles={onAddFiles} onRemoveFile={onRemoveFile} />
            <ProjectChatList chats={chats} onOpenChat={onOpenChat} onNewChat={onNewChat} now={now} />
          </div>
        </div>
      )}

      {onDelete && (
        <DeleteConfirm
          open={confirm}
          onOpenChange={setConfirm}
          icon={null}
          title={`Delete “${name}”?`}
          description={`Its instructions and files are removed. Its ${chats.length === 1 ? 'chat moves' : `${chats.length} chats move`} to your history.`}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}
