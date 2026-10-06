import { useId, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { DragDropVerticalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import { Shortcut } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { PEOPLE } from '../data'
import { Panel, Section } from './shared'

/* ---------- Drag to reorder ---------- */

type Item = { id: string; key: string; title: string; owner: string; points: number }

const BACKLOG: Item[] = [
  { id: 'b1', key: 'WEB-212', title: 'Fix the sign-in redirect loop', owner: PEOPLE[0], points: 2 },
  { id: 'b2', key: 'WEB-198', title: 'Add CSV export to reports', owner: PEOPLE[1], points: 3 },
  { id: 'b3', key: 'API-87', title: 'Rate-limit the public API', owner: PEOPLE[2], points: 5 },
  { id: 'b4', key: 'WEB-230', title: 'Onboarding checklist, version 2', owner: PEOPLE[3], points: 3 },
  { id: 'b5', key: 'MOB-41', title: 'Offline mode for the mobile app', owner: PEOPLE[4], points: 8 },
  { id: 'b6', key: 'WEB-244', title: 'Dark mode for email templates', owner: PEOPLE[0], points: 1 },
]

function ReorderPanel() {
  const [items, setItems] = useState(BACKLOG)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // Index the dragged row would land before (items.length = after the last row).
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  // Read synchronously in dragover, before the state update has rendered.
  const dragRef = useRef<string | null>(null)
  const rows = useRef(new Map<string, HTMLLIElement>())
  const refocus = useRef<string | null>(null)
  const hintId = useId()

  // A moved row is re-inserted in the DOM, which can drop its focus.
  useLayoutEffect(() => {
    if (!refocus.current) return
    rows.current.get(refocus.current)?.focus()
    refocus.current = null
  }, [items])

  const changed = items.some((item, i) => item.id !== BACKLOG[i].id)
  const from = draggingId ? items.findIndex((i) => i.id === draggingId) : -1
  // Dropping just above or below the dragged row changes nothing, so no line.
  const line = dropAt !== null && dropAt !== from && dropAt !== from + 1 ? dropAt : null

  function move(fromIndex: number, toIndex: number) {
    const item = items[fromIndex]
    if (toIndex < 0 || toIndex >= items.length) {
      setMessage(`${item.title} is already ${toIndex < 0 ? 'first' : 'last'}.`)
      return
    }
    if (toIndex === fromIndex) return
    const next = [...items]
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    setItems(next)
    setMessage(`${item.title} moved to position ${toIndex + 1} of ${next.length}.`)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setDropAt(null)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const id = dragRef.current
    const at = dropAt
    endDrag()
    if (!id || at === null) return
    const fromIndex = items.findIndex((i) => i.id === id)
    move(fromIndex, at > fromIndex ? at - 1 : at)
  }

  function onRowKey(e: KeyboardEvent<HTMLLIElement>, index: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const dir = e.key === 'ArrowUp' ? -1 : 1
    if (e.altKey) {
      refocus.current = items[index].id
      move(index, index + dir)
    } else {
      const target = items[index + dir]
      if (target) rows.current.get(target.id)?.focus()
    }
  }

  return (
    <Panel title="Drag to reorder" note="Native drag and drop, plus keyboard">
      <div className="grid grid-cols-1 gap-3">
        <ol
          aria-label="Backlog, in priority order"
          className="grid grid-cols-1 gap-1"
          onDragOver={(e) => {
            if (dragRef.current) e.preventDefault()
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null)
          }}
          onDrop={onDrop}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              ref={(el) => {
                if (el) rows.current.set(item.id, el)
                else rows.current.delete(item.id)
              }}
              tabIndex={0}
              draggable
              aria-label={`${item.title}, position ${index + 1} of ${items.length}`}
              aria-describedby={hintId}
              data-dragging={item.id === draggingId}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', item.id)
                dragRef.current = item.id
                // Deferred so the browser takes the drag image before the row fades.
                setTimeout(() => setDraggingId(item.id), 0)
              }}
              onDragEnd={endDrag}
              onDragOver={(e) => {
                if (!dragRef.current) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const rect = e.currentTarget.getBoundingClientRect()
                setDropAt(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
              }}
              onKeyDown={(e) => onRowKey(e, index)}
              className="group/row bg-card hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/30 relative flex h-9 min-w-0 cursor-grab items-center gap-2 rounded-md border pr-2 pl-1 text-xs transition-[opacity,background-color] outline-none focus-visible:ring-2 active:cursor-grabbing data-[dragging=true]:opacity-40"
            >
              {line === index && <DropLine edge="top" />}
              {line === items.length && index === items.length - 1 && <DropLine edge="bottom" />}
              <HugeiconsIcon
                icon={DragDropVerticalIcon}
                strokeWidth={2}
                className="text-muted-foreground size-3.5 shrink-0 opacity-60 group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
              />
              <span className="text-muted-foreground w-3 shrink-0 text-right text-[11px] tabular-nums">{index + 1}</span>
              <span className="text-muted-foreground hidden w-14 shrink-0 font-mono text-[11px] sm:inline">{item.key}</span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{item.points} pt</span>
              <UserAvatar name={item.owner} className="size-5" />
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={hintId} className="text-muted-foreground flex flex-wrap items-center gap-1 text-[11px]">
            Drag a row, or focus it and press <Shortcut keys={['alt', '↑', '↓']} />
          </p>
          <Button
            variant="ghost"
            size="xs"
            disabled={!changed}
            onClick={() => {
              setItems(BACKLOG)
              setMessage('Order reset.')
            }}
          >
            Reset order
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">{message}</p>
      </div>
    </Panel>
  )
}

function DropLine({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-brand pointer-events-none absolute inset-x-1 z-10 h-0.5 rounded-full',
        'before:border-brand before:bg-card before:absolute before:-top-[3px] before:-left-1 before:size-2 before:rounded-full before:border-2',
        edge === 'top' ? '-top-[3px]' : '-bottom-[3px]',
      )}
    />
  )
}

export default function SortableListSection() {
  return (
    <Section id="sortable-list" title="Sortable list" description="Rows you drag into a new order, with the mouse or the keyboard">
      <ReorderPanel />
    </Section>
  )
}
