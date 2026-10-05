import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { plural } from '@/lib/text'

// A grouped list, Linear style: a header per group (its visual, title and
// count, a + button, and a chevron that folds the group), then dense rows.
// Up and Down arrows (Home, End) move focus between rows. With selection on,
// each row gets a checkbox (shown on hover, focus, touch screens, or once
// anything is selected): click it or press X, with Shift for a range.
//
// Give it the groups in order, each with its items, and draw each row with
// `renderRow`: wrap your cells in `GroupedListRow`, which owns the row's
// height, hover, focus, active and selected states and the checkbox. Wrap
// that in a context menu if you like; the row takes the trigger's props.
// Empty states and "select all" are the page's.

// One group: its id, header and items, in the order they should read.
export type ListGroup<T extends { id: string } = { id: string }> = {
  id: string
  title: string
  // Shown before the title: a status icon, a priority icon, an avatar…
  visual?: ReactNode
  items: T[]
}

// What `renderRow` gets for each row; hand it to GroupedListRow.
export type GroupedListRowState = {
  // Spread on the focusable row (GroupedListRow does it for you).
  rowProps: { 'data-grouped-list-row': string }
  // The row's side padding and border, to line up with the group headers.
  className: string
  // Set when the list has selection on.
  selection?: {
    selected: boolean
    // Something in the list is selected, so every checkbox stays visible.
    selecting: boolean
    // Selects or clears this row; `range` runs from the last row toggled.
    toggle: (range: boolean) => void
    // The checkbox's accessible name: "Select DO-24817".
    label: string
  }
}

// The list: group headers, folding, rows from `renderRow`, arrow keys and selection.
export function GroupedList<G extends ListGroup>({
  groups,
  renderRow,
  onAdd,
  addLabel = (group) => `Add to ${group.title}`,
  headers = true,
  collapsible = true,
  stickyHeaders = false,
  framed = false,
  selected,
  onSelectedChange,
  itemLabel = (item) => item.id,
  itemName = { one: 'item', other: 'items' },
  emptyLabel = `No ${itemName.other}`,
  inset = 'px-3',
  className,
  'aria-label': label,
}: {
  // Your own fields on a group (a patch for new items…) come back in onAdd.
  groups: G[]
  renderRow: (item: G['items'][number], row: GroupedListRowState) => ReactNode
  // Shows a + button in each group header.
  onAdd?: (group: G) => void
  addLabel?: (group: G) => string
  // false leaves the headers out, for a list that is not grouped.
  headers?: boolean
  // false drops the chevron, so groups cannot fold.
  collapsible?: boolean
  // Headers stick to the top of the scrolling container (one that scrolls on
  // its own, not the page).
  stickyHeaders?: boolean
  // The list sits in a bordered card: the last line drops its bottom border
  // so it does not double the card's.
  framed?: boolean
  // Turns selection on: the selected ids, and what to do when they change.
  // Ids not in the list are ignored.
  selected?: string[]
  onSelectedChange?: (ids: string[]) => void
  // Names a row for its checkbox: "Select DO-24817". Defaults to the id.
  itemLabel?: (item: G['items'][number]) => string
  // For counts read out by screen readers: "3 jobs".
  itemName?: { one: string; other: string }
  // Shown in an open group with nothing in it.
  emptyLabel?: ReactNode
  // Side padding for headers and rows, so they line up: "pr-2 pl-3 @lg:pl-5".
  inset?: string
  className?: string
  'aria-label'?: string
}) {
  const [folded, setFolded] = useState<Set<string>>(() => new Set())
  const anchor = useRef<string | null>(null)
  const selectable = !!onSelectedChange
  const order = groups.flatMap((g) => g.items.map((item) => item.id))
  const inList = new Set(order)
  // Only rows in the list count: one filtered out drops out of the selection.
  const picked = (selected ?? []).filter((id) => inList.has(id))
  const pickedSet = new Set(picked)
  const last = framed ? groups[groups.length - 1] : undefined
  const counted = (n: number) => plural(n, itemName.one, itemName.other)

  function toggleFold(id: string) {
    setFolded((f) => {
      const next = new Set(f)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  function toggle(id: string, range: boolean) {
    const next = new Set(picked)
    // After the selection is cleared, Shift starts afresh.
    const from = picked.length && anchor.current ? order.indexOf(anchor.current) : -1
    if (range && from !== -1) {
      const to = order.indexOf(id)
      const on = !next.has(id)
      for (const rowId of order.slice(Math.min(from, to), Math.max(from, to) + 1)) {
        if (on) next.add(rowId)
        else next.delete(rowId)
      }
    } else if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    anchor.current = id
    onSelectedChange?.([...next])
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.defaultPrevented || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const target = e.target as HTMLElement
    if (!target.hasAttribute('data-grouped-list-row')) return
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-grouped-list-row]'))
    const at = rows.indexOf(target)
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? rows.length - 1 : at + (e.key === 'ArrowDown' ? 1 : -1)
    if (!rows[to]) return
    e.preventDefault()
    rows[to].focus()
  }

  return (
    <div role={label ? 'group' : undefined} aria-label={label} onKeyDown={onKeyDown} className={className}>
      {groups.map((group) => {
        const open = !headers || !collapsible || !folded.has(group.id)
        const isLast = group === last
        const heading = (
          <>
            {group.visual != null && <span className="flex shrink-0">{group.visual}</span>}
            <span className="truncate font-medium">{group.title}</span>
            <span className="text-muted-foreground tabular-nums">{group.items.length}</span>
          </>
        )
        return (
          <section key={group.id} aria-label={headers ? `${group.title}, ${counted(group.items.length)}` : undefined}>
            {headers && (
              <div
                className={cn(
                  'bg-subtle flex h-8 items-center gap-2 border-b text-xs',
                  inset,
                  stickyHeaders && 'sticky top-0 z-[1]',
                  isLast && !open && 'border-b-0',
                )}
              >
                {collapsible ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggleFold(group.id)}
                    className="focus-visible:ring-ring/40 -ml-1 flex min-w-0 items-center gap-2 rounded px-1 py-0.5 outline-none focus-visible:ring-2"
                  >
                    <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />
                    {heading}
                  </button>
                ) : (
                  <div className="flex min-w-0 items-center gap-2">{heading}</div>
                )}
                {onAdd && (
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground ml-auto" aria-label={addLabel(group)} onClick={() => onAdd(group)}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                  </Button>
                )}
              </div>
            )}
            {open && (group.items.length ? (
              <ul>
                {group.items.map((item, i) => (
                  <li key={item.id}>
                    {renderRow(item, {
                      rowProps: { 'data-grouped-list-row': item.id },
                      className: cn(inset, stickyHeaders && 'scroll-mt-8', isLast && i === group.items.length - 1 && 'border-b-0'),
                      selection: selectable
                        ? {
                            selected: pickedSet.has(item.id),
                            selecting: picked.length > 0,
                            toggle: (range) => toggle(item.id, range),
                            label: `Select ${itemLabel(item)}`,
                          }
                        : undefined,
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn('text-muted-foreground border-b py-2 text-[11px]', inset, isLast && 'border-b-0')}>{emptyLabel}</p>
            ))}
          </section>
        )
      })}
    </div>
  )
}

// The row shell for `renderRow`: a dense, focusable row that opens on click,
// Enter or Space, with the checkbox first when the list has selection on.
// Your cells go inside, in a line. Other props and `ref` go on the row, so it
// works inside an `asChild` trigger such as a context menu's. Inside, use the
// `group/row` class to show things on hover (a … menu).
export function GroupedListRow({
  row,
  onOpen,
  active = false,
  className,
  children,
  ref,
  onClick,
  onKeyDown,
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & {
  row: GroupedListRowState
  onOpen: () => void
  // The row open in the side panel.
  active?: boolean
  children: ReactNode
}) {
  const selection = row.selection
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-keyshortcuts={selection ? 'X' : undefined}
      {...props}
      {...row.rowProps}
      data-active={active}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) onOpen()
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        } else if (selection && e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          selection.toggle(e.shiftKey)
        }
      }}
      className={cn(
        'hover:bg-accent/60 data-[active=true]:bg-accent focus-visible:bg-accent group/row flex h-9 cursor-default items-center gap-2.5 border-b text-xs outline-none select-none',
        selection?.selected && 'bg-brand/5 dark:bg-brand/10',
        row.className,
        className,
      )}
    >
      {selection && (
        <Checkbox
          checked={selection.selected}
          onClick={(e) => {
            e.stopPropagation()
            selection.toggle(e.shiftKey)
          }}
          aria-label={selection.label}
          className={cn(
            'opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100',
            selection.selecting && 'opacity-100',
          )}
        />
      )}
      {children}
    </div>
  )
}
