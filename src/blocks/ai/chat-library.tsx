import { useMemo, useState, type ElementType, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Folder01Icon, PinIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import type { ChatType, HistoryChat } from './chat-history'

// The chat library: every chat on one page, an assistant's "All chats". From
// the top: the title and New chat, a search over titles and previews, filter
// chips by type (All, then each type with its count), and the chats newest
// first. A row shows the title, a line of the chat (`preview`), and its
// type, project, pin and when it last changed; it opens the chat. The types
// are yours: a module, a topic, an agent. The chat history's `onViewAll`
// link is made to open it. It fills its parent's height and scrolls itself.

// A chat's `type` is a LibraryType's `value`, for the filter chips.
export type LibraryChat = HistoryChat & {
  // A line under the title, such as the start of the last reply.
  preview?: string
  // The name of its project.
  project?: string
}

// The chat history's ChatType: a value, a label, and an icon or a colour dot.
export type LibraryType = ChatType

function TypeMark({ type }: { type: LibraryType }) {
  return type.icon
    ? <HugeiconsIcon icon={type.icon} strokeWidth={2} className="size-3 shrink-0" style={{ color: type.colour }} />
    : <span aria-hidden className="bg-muted-foreground size-1.5 shrink-0 rounded-full" style={{ background: type.colour }} />
}

export function ChatLibrary({
  chats, types = [], title = 'All chats', headingAs: Heading = 'h1', now, onOpenChat, onNewChat,
  newChatLabel = 'New chat', searchPlaceholder = 'Search chats', emptyText = 'No chats yet.', className,
}: {
  chats: LibraryChat[]
  // The filter chips, in this order. A type with no chats is left out.
  types?: LibraryType[]
  title?: ReactNode
  headingAs?: ElementType
  // The time "Today" and "Yesterday" count from. Defaults to now.
  now?: number | (() => number)
  onOpenChat: (id: string) => void
  onNewChat?: () => void
  newChatLabel?: string
  searchPlaceholder?: string
  emptyText?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<string | null>(null)
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt - a.updatedAt), [chats])
  const q = query.trim().toLowerCase()
  const matching = q
    ? sorted.filter((c) => c.title.toLowerCase().includes(q) || c.preview?.toLowerCase().includes(q))
    : sorted
  const shown = type ? matching.filter((c) => c.type === type) : matching
  // Only types that have chats; their counts follow the search.
  const chips = types
    .filter((t) => sorted.some((c) => c.type === t.value))
    .map((t) => ({ ...t, count: matching.filter((c) => c.type === t.value).length }))
  const typeOf = (value?: string) => types.find((t) => t.value === value)

  const chip = (value: string | null, label: ReactNode, count: number, mark?: ReactNode) => {
    const active = type === value
    return (
      <Button
        key={value ?? 'all'}
        variant={active ? 'secondary' : 'ghost'}
        size="sm"
        aria-pressed={active}
        onClick={() => setType(value)}
        className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
      >
        {mark}
        {label}
        <span className="text-muted-foreground tabular-nums">{count}</span>
      </Button>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="mx-auto grid w-full max-w-3xl gap-3 px-4 pt-6 pb-3 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-0.5">
            <Heading className="text-lg font-semibold tracking-tight">{title}</Heading>
            <p className="text-muted-foreground text-xs">{plural(chats.length, 'chat')}</p>
          </div>
          {onNewChat && (
            <Button size="sm" onClick={onNewChat}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              {newChatLabel}
            </Button>
          )}
        </div>
        <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} label="Search chats" />
        {chips.length > 0 && (
          <div role="group" aria-label="Filter by type" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {chip(null, 'All', matching.length)}
            {chips.map((t) => chip(t.value, t.label, t.count, <TypeMark type={t} />))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 md:px-6">
          {shown.length > 0 && (
            <ul aria-label="Chats" className="divide-y">
              {shown.map((c) => {
                const t = typeOf(c.type)
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onOpenChat(c.id)}
                      className="hover:bg-accent/50 focus-visible:ring-ring/30 -mx-2 grid w-[calc(100%+1rem)] gap-1 rounded-md px-2 py-2.5 text-left outline-none focus-visible:ring-2"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 truncate text-[13px] font-medium">{c.title}</span>
                        {c.pinned && <HugeiconsIcon icon={PinIcon} strokeWidth={2} aria-label="Pinned" className="text-muted-foreground size-3 shrink-0" />}
                        {c.running && <Spinner className="text-muted-foreground size-3" aria-label="Replying" />}
                        <span className="text-muted-foreground ml-auto shrink-0 text-[11px] tabular-nums">
                          {formatRelativeDate(c.updatedAt, { now: time })}
                        </span>
                      </span>
                      {c.preview && <span className="text-muted-foreground truncate text-xs">{c.preview}</span>}
                      {(t || c.project) && (
                        <span className="text-muted-foreground flex min-w-0 items-center gap-3 text-[11px]">
                          {t && <span className="inline-flex min-w-0 items-center gap-1"><TypeMark type={t} /><span className="truncate">{t.label}</span></span>}
                          {c.project && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="size-3 shrink-0" />
                              <span className="truncate">{c.project}</span>
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {!chats.length && <p className="text-muted-foreground py-10 text-center text-xs">{emptyText}</p>}
          {chats.length > 0 && !shown.length && (
            <div className="grid justify-items-center gap-3 py-10 text-center">
              <p className="text-muted-foreground text-xs">
                {q ? <>No chats match “{query.trim()}”{type ? ` in ${typeOf(type)?.label ?? type}` : ''}.</> : 'No chats of this type.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setType(null)
                }}
              >
                Clear search and filter
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
