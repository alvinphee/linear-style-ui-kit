import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain01Icon, BubbleChatIcon, Delete02Icon, InformationCircleIcon, PencilEdit02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Textarea } from '@/components/ui/textarea'
import { formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'

// What an assistant remembers about you across chats, and the controls to
// manage it: a search, each memory with the chat it came from and when, an
// inline edit (Enter saves, Shift+Enter a new line, Escape cancels), delete
// per memory and Clear all after a confirm. Deleting is the caller's, so it
// can offer Undo in a toast. With nothing saved it says so; with memory
// switched off the list is greyed under a note, and can still be edited and
// cleared, so turning memory off never traps what was saved.

export type Memory = {
  id: string
  text: string
  // The title of the chat it was learned in. Left out: added by hand.
  source?: string
  createdAt: number
  updatedAt?: number
}

export function MemoryManager({
  memories, enabled = true, onEdit, onDelete, onClearAll, onOpenSource, now, offNote, className,
}: {
  memories: Memory[]
  // False when memory is switched off.
  enabled?: boolean
  onEdit?: (id: string, text: string) => void
  onDelete?: (id: string) => void
  onClearAll?: () => void
  // Opens the chat a memory came from. Without it the chat's title is plain text.
  onOpenSource?: (memory: Memory) => void
  // The time "Today" and "Yesterday" count from. Defaults to now.
  now?: number
  // Shown while memory is off, in place of the standard note.
  offNote?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const time = now ?? Date.now()

  const sorted = [...memories].sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
  const q = query.trim().toLowerCase()
  const shown = q ? sorted.filter((m) => m.text.toLowerCase().includes(q) || m.source?.toLowerCase().includes(q)) : sorted

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      {!enabled && (
        <div role="note" className="bg-muted/60 text-muted-foreground flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0" />
          <p>
            {offNote ?? 'Memory is off. The assistant does not save new memories or use these in chats. They stay here until you delete them.'}
          </p>
        </div>
      )}

      {memories.length === 0 ? (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon"><HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} /></EmptyMedia>
            <EmptyTitle>Nothing remembered yet</EmptyTitle>
            <EmptyDescription>
              {enabled
                ? 'As you chat, the assistant saves details worth keeping, such as your role or how you like answers written. They show here.'
                : 'Turn memory on and the assistant saves details worth keeping as you chat.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className={cn('grid min-w-0 gap-3 transition-opacity', !enabled && 'opacity-60 focus-within:opacity-100 hover:opacity-100')}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <SearchField value={query} onChange={setQuery} placeholder="Search memories" className="h-7 min-w-0 flex-1 basis-48" />
            <span className="text-muted-foreground text-[11px] tabular-nums">{plural(memories.length, 'memory', 'memories')}</span>
            {onClearAll && (
              <DeleteConfirm
                title="Clear all memories?"
                description={`The assistant forgets all ${plural(memories.length, 'memory', 'memories')}. Your chats stay as they are.`}
                confirmLabel="Clear all"
                size="sm"
                onConfirm={onClearAll}
              >
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">Clear all</Button>
              </DeleteConfirm>
            )}
          </div>

          {shown.length > 0 ? (
            <ul aria-label="Memories" className="bg-card divide-y rounded-lg border">
              {shown.map((m) => (
                <MemoryRow
                  key={m.id}
                  memory={m}
                  now={time}
                  editing={editing === m.id}
                  onStartEdit={onEdit && (() => setEditing(m.id))}
                  onSave={(text) => {
                    setEditing(null)
                    if (text !== m.text) onEdit?.(m.id, text)
                  }}
                  onCancel={() => setEditing(null)}
                  onDelete={onDelete && (() => onDelete(m.id))}
                  onOpenSource={onOpenSource && (() => onOpenSource(m))}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-xs">
              No memories match “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MemoryRow({ memory, now, editing, onStartEdit, onSave, onCancel, onDelete, onOpenSource }: {
  memory: Memory
  now: number
  editing: boolean
  onStartEdit?: () => void
  onSave: (text: string) => void
  onCancel: () => void
  onDelete?: () => void
  onOpenSource?: () => void
}) {
  const [text, setText] = useState(memory.text)
  const field = useRef<HTMLTextAreaElement>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)

  useEffect(() => {
    if (editing) {
      setText(memory.text)
      const el = field.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    } else if (wasEditing.current) {
      // Back to the pencil, so the keyboard stays where it was.
      editButton.current?.focus()
    }
    wasEditing.current = editing
  }, [editing, memory.text])

  const save = () => {
    const next = text.replace(/\s+/g, ' ').trim()
    if (next) onSave(next)
    else onCancel()
  }

  const when = formatRelativeDate(memory.updatedAt ?? memory.createdAt, { now })

  return (
    <li className="group/memory flex min-w-0 items-start gap-2 px-3 py-2.5">
      <div className="grid min-w-0 flex-1 gap-1">
        {editing ? (
          <>
            <Textarea
              ref={field}
              value={text}
              rows={1}
              aria-label="Memory"
              className="min-h-7 text-[13px] md:text-[13px]"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  save()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  onCancel()
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs" onClick={save}>Save</Button>
              <Button size="xs" variant="ghost" onClick={onCancel}>Cancel</Button>
              <span className="text-muted-foreground text-[11px]">Enter to save, Esc to cancel</span>
            </div>
          </>
        ) : (
          <p className="text-[13px] leading-snug break-words">{memory.text}</p>
        )}
        <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px]">
          {memory.source ? (
            <>
              <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} className="size-3 shrink-0" />
              {onOpenSource ? (
                <button
                  type="button"
                  onClick={onOpenSource}
                  className="hover:text-foreground focus-visible:ring-ring/40 min-w-0 truncate rounded underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                >
                  {memory.source}
                </button>
              ) : <span className="min-w-0 truncate">{memory.source}</span>}
            </>
          ) : <span>Added by you</span>}
          <span aria-hidden>·</span>
          <span className="shrink-0">{memory.updatedAt ? `Edited ${when}` : when}</span>
        </p>
      </div>
      {!editing && (onStartEdit || onDelete) && (
        <div className="-mr-1 flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 group-hover/memory:opacity-100 md:opacity-0">
          {onStartEdit && (
            <Button ref={editButton} variant="ghost" size="icon-xs" aria-label="Edit memory" className="text-muted-foreground" onClick={onStartEdit}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-xs" aria-label="Delete memory" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
