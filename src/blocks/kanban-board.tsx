import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, MoreHorizontalIcon, ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// A Kanban board: a column per stage or status, cards dragged between
// columns, and a "Move to…" menu for the keyboard and touch screens, where
// dragging is not available. The board scrolls sideways inside itself, never
// the page. Hidden columns fold into a strip at the end that still takes drops.
//
// Give it the columns in order, the items, and the column each item is in.
// Draw each card with `renderCard`, spreading `card.cardProps` on the element
// that drags (the card, not its menu button), and put `KanbanCardMenu` (or
// `KanbanMoveItems` in your own menu) on it for moving without a mouse.
// `onMove` runs when a card lands in another column. Place the board in a
// container with a definite width, such as a `min-w-0` flex child.

export type KanbanColumn<K extends string = string> = {
  id: K
  title: string
  // Shown before the title: a status icon, a coloured dot, an avatar…
  visual?: ReactNode
  // Shown at the right of the header: a total, a sum…
  extra?: ReactNode
  // A muted second line under the title: a probability, a weighted value…
  description?: ReactNode
  // Shown at the right of this column in "Move to…" menus.
  hint?: ReactNode
}

export type KanbanCardProps = {
  draggable: true
  onDragStart: (e: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  'data-dragging': boolean
  'data-kanban-card': string
}

export type KanbanCardState<K extends string = string> = {
  // Spread on the element that drags.
  cardProps: KanbanCardProps
  dragging: boolean
  // Moves the card from a menu; keyboard focus follows it to its new column.
  moveTo: (column: K) => void
}

// default: bordered columns, for a board that is the page.
// compact: narrower, borderless columns that fill the height and scroll on
// their own, for a board inside an app frame.
export type KanbanVariant = 'default' | 'compact'

const STYLES: Record<KanbanVariant, Record<'board' | 'column' | 'header' | 'row' | 'button' | 'body' | 'empty', string>> = {
  default: {
    board: 'flex gap-3 overflow-x-auto p-3',
    column: 'bg-subtle data-[over=true]:border-brand/50 data-[over=true]:bg-brand/5 data-[over=true]:ring-brand/20 flex w-72 shrink-0 flex-col rounded-lg border p-2 transition-colors data-[over=true]:ring-2',
    header: 'grid gap-0.5 px-1 pb-1.5 text-xs',
    row: 'flex h-5.5 items-center gap-1.5',
    button: '',
    body: 'flex flex-1 flex-col gap-2',
    empty: 'text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-xs',
  },
  compact: {
    board: 'flex gap-2 overflow-x-auto p-2',
    column: 'bg-muted/40 data-[over=true]:bg-accent data-[over=true]:ring-primary/40 flex w-60 shrink-0 flex-col rounded-lg transition-colors data-[over=true]:ring-1',
    header: 'grid gap-0.5 px-2.5 pt-2 pb-1.5 text-xs',
    row: 'flex items-center gap-1.5',
    button: 'text-muted-foreground',
    body: 'grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto px-1.5 pb-1.5',
    empty: 'text-muted-foreground rounded-md border border-dashed px-2 py-4 text-center text-[11px]',
  },
}

export function KanbanBoard<T extends { id: string }, K extends string = string>({
  columns,
  items,
  columnOf,
  renderCard,
  onMove,
  onAdd,
  addLabel = (column) => `Add to ${column.title}`,
  hidden = [],
  onHiddenChange,
  hideEmpty = false,
  itemName = { one: 'card', other: 'cards' },
  emptyLabel = `No ${itemName.other}`,
  dropLabel = 'Drop here',
  noColumnsLabel = 'No columns to show',
  variant = 'default',
  className,
  columnClassName,
}: {
  columns: KanbanColumn<K>[]
  // In the order they should read inside each column.
  items: T[]
  // Items whose column is not in `columns` are left off the board.
  columnOf: (item: T) => K
  renderCard: (item: T, card: KanbanCardState<K>) => ReactNode
  // Only called when the column changes.
  onMove: (itemId: string, column: K) => void
  // Shows a + button in each column header.
  onAdd?: (column: KanbanColumn<K>) => void
  addLabel?: (column: KanbanColumn<K>) => string
  // Columns folded into the strip at the end.
  hidden?: K[]
  // Adds "Hide column" to each header, and lets the strip show them again.
  onHiddenChange?: (hidden: K[]) => void
  // Leaves out columns with no items (hidden ones still list in the strip).
  hideEmpty?: boolean
  // For counts read out by screen readers: "3 jobs".
  itemName?: { one: string; other: string }
  emptyLabel?: ReactNode
  // Shown in an empty column while a card is dragged over it.
  dropLabel?: ReactNode
  noColumnsLabel?: ReactNode
  variant?: KanbanVariant
  className?: string
  columnClassName?: string
}) {
  const s = STYLES[variant]
  const rootRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [over, setOver] = useState<K | null>(null)
  // Read synchronously in dragover, before the state above has rendered.
  const dragRef = useRef<string | null>(null)

  const byColumn = new Map<K, T[]>(columns.map((c) => [c.id, []]))
  for (const item of items) byColumn.get(columnOf(item))?.push(item)
  const cardsIn = (id: K) => byColumn.get(id) ?? []
  const shown = columns.filter((c) => !hidden.includes(c.id) && (!hideEmpty || cardsIn(c.id).length > 0))
  const folded = columns.filter((c) => hidden.includes(c.id))
  const counted = (n: number) => `${n} ${n === 1 ? itemName.one : itemName.other}`

  function move(id: string, column: K) {
    const item = items.find((i) => i.id === id)
    if (item && columnOf(item) !== column) onMove(id, column)
  }

  function moveTo(id: string, column: K) {
    move(id, column)
    // The card remounts in its new column, so keyboard focus follows it there.
    setTimeout(() => rootRef.current?.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(id)}"]`)?.focus(), 0)
  }

  function startDrag(e: DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    dragRef.current = id
    // Deferred so the browser takes the drag image before the card fades.
    setTimeout(() => {
      if (dragRef.current === id) setDraggingId(id)
    }, 0)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setOver(null)
  }

  function dropTarget(column: K) {
    return {
      onDragOver: (e: DragEvent) => {
        // Only cards from this board: a dragged link or file is left alone.
        if (!dragRef.current) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (over !== column) setOver(column)
      },
      onDragLeave: (e: DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setOver((o) => (o === column ? null : o))
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        const id = dragRef.current ?? e.dataTransfer.getData('text/plain')
        endDrag()
        if (id) move(id, column)
      },
      'data-over': over === column,
    }
  }

  return (
    <div ref={rootRef} className={cn(s.board, className)}>
      {shown.map((column) => {
        const cards = cardsIn(column.id)
        return (
          <section
            key={column.id}
            aria-label={`${column.title}, ${counted(cards.length)}`}
            {...dropTarget(column.id)}
            className={cn(s.column, columnClassName)}
          >
            <ColumnHeader
              column={column}
              count={cards.length}
              styles={s}
              addLabel={addLabel(column)}
              onAdd={onAdd && (() => onAdd(column))}
              onHide={onHiddenChange && (() => onHiddenChange([...hidden, column.id]))}
            />
            <ul className={s.body}>
              {cards.length ? (
                cards.map((item) => (
                  <li key={item.id}>
                    {renderCard(item, {
                      cardProps: {
                        draggable: true,
                        onDragStart: (e) => startDrag(e, item.id),
                        onDragEnd: endDrag,
                        'data-dragging': draggingId === item.id,
                        'data-kanban-card': item.id,
                      },
                      dragging: draggingId === item.id,
                      moveTo: (to) => moveTo(item.id, to),
                    })}
                  </li>
                ))
              ) : (
                <li className={s.empty}>{over === column.id ? dropLabel : emptyLabel}</li>
              )}
            </ul>
          </section>
        )
      })}

      {shown.length === 0 && (
        <div className="text-muted-foreground flex h-32 flex-1 items-center justify-center rounded-lg border border-dashed text-xs">
          {noColumnsLabel}
        </div>
      )}

      {folded.length > 0 && (
        <div className="flex w-56 shrink-0 flex-col gap-1 p-1">
          <span className="text-muted-foreground px-1 pb-1 text-xs font-medium">Hidden columns</span>
          {folded.map((column) => (
            <button
              key={column.id}
              type="button"
              {...dropTarget(column.id)}
              onClick={() => onHiddenChange?.(hidden.filter((h) => h !== column.id))}
              aria-label={`Show ${column.title} column, ${counted(cardsIn(column.id).length)}`}
              className="group/hidden bg-subtle hover:bg-accent focus-visible:ring-ring/30 data-[over=true]:border-brand/50 data-[over=true]:bg-brand/5 flex h-8 items-center gap-2 rounded-md border px-2 text-xs outline-none focus-visible:ring-2"
            >
              {column.visual != null && <span className="flex shrink-0">{column.visual}</span>}
              <span className="font-medium">{column.title}</span>
              <span className="text-muted-foreground tabular-nums">{cardsIn(column.id).length}</span>
              <HugeiconsIcon
                icon={ViewIcon}
                strokeWidth={2}
                className="text-muted-foreground group-hover/hidden:text-foreground ml-auto size-3.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnHeader<K extends string>({ column, count, styles, addLabel, onAdd, onHide }: {
  column: KanbanColumn<K>
  count: number
  styles: (typeof STYLES)[KanbanVariant]
  addLabel: string
  onAdd?: () => void
  onHide?: () => void
}) {
  const end = column.extra != null || onAdd || onHide
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {column.visual != null && <span className="flex shrink-0">{column.visual}</span>}
        <span className="truncate font-medium">{column.title}</span>
        <span className="text-muted-foreground tabular-nums">{count}</span>
        {end && (
          <div className="ml-auto flex items-center gap-0.5">
            {column.extra != null && <span className="font-medium tabular-nums">{column.extra}</span>}
            {onAdd && (
              <Button variant="ghost" size="icon-xs" className={styles.button} aria-label={addLabel} onClick={onAdd}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              </Button>
            )}
            {onHide && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-xs" className={styles.button} aria-label={`${column.title} column options`}>
                    <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={onHide}>
                    <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} />
                    Hide column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
      {column.description != null && <p className="text-muted-foreground text-[11px] tabular-nums">{column.description}</p>}
    </header>
  )
}

// "Move to…" and a radio item per column, for a menu of your own.
export function KanbanMoveItems<K extends string>({ columns, value, onMove, label = 'Move to…' }: {
  columns: KanbanColumn<K>[]
  value: K
  onMove: (column: K) => void
  label?: string
}) {
  return (
    <>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={(v) => onMove(v as K)}>
        {columns.map((c) => (
          <DropdownMenuRadioItem key={c.id} value={c.id}>
            {c.visual}
            {c.title}
            {c.hint != null && <span className="text-muted-foreground ml-auto tabular-nums">{c.hint}</span>}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  )
}

// The … button on a card: your own items (children), then "Move to…". Hidden
// until hover or focus on mouse devices, always shown on touch screens. The
// card needs the `group/card` class.
export function KanbanCardMenu<K extends string>({ label, columns, value, onMove, children, className }: {
  // The button's accessible name: "Move OPP-2001 to another stage".
  label: string
  columns: KanbanColumn<K>[]
  value: K
  onMove: (column: K) => void
  children?: ReactNode
  className?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          // A card behind it may open on click; the menu shouldn't.
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'pointer-fine:opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 data-[state=open]:opacity-100',
            className,
          )}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {children}
        {children && <DropdownMenuSeparator />}
        <KanbanMoveItems columns={columns} value={value} onMove={onMove} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
