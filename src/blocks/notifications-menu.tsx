import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Notification03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// The notifications menu: a bell with an unread count that opens a popover
// of what happened, newest first. Each row shows who, what, an optional quote
// and the record it is about; opening one marks it read and closes the menu.
//
// Two triggers: 'icon', a ghost icon button for a header, and 'row', a full
// width row for a sidebar footer (put it in a column with a definite width).
// Read state is yours when you pass `onMarkRead` and `onMarkAllRead` and set
// `unread` on the items; leave both out and the menu keeps it, starting from
// the items' `unread`.

export type NotificationItem = {
  id: string
  // Who did it. Also gives the avatar's initials.
  actor: string
  // What happened, read after the actor's name: "commented", "asked you to approve PO-8001".
  text: ReactNode
  // An excerpt under the line, such as the comment itself. Shown in quotes.
  quote?: ReactNode
  // The record it is about, in a muted line: "JOB-104 · Replace the boiler".
  detail?: ReactNode
  time: string
  unread?: boolean
  // In place of the initials.
  avatar?: ReactNode
}

export function NotificationsMenu<T extends NotificationItem>({
  items,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  variant = 'icon',
  side = 'bottom',
  align = 'end',
  title = 'Notifications',
  emptyLabel = 'You are all caught up.',
  className,
}: {
  // Newest first.
  items: T[]
  onOpen?: (item: T) => void
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  variant?: 'icon' | 'row'
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  title?: string
  emptyLabel?: ReactNode
  // On the trigger.
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [readHere, setReadHere] = useState<ReadonlySet<string>>(() => new Set())
  const controlled = onMarkRead !== undefined || onMarkAllRead !== undefined
  const isUnread = (item: T) => !!item.unread && (controlled || !readHere.has(item.id))
  const unread = items.filter(isUnread).length
  const label = unread ? `${title}, ${unread} unread` : title

  function markRead(id: string) {
    if (controlled) onMarkRead?.(id)
    else setReadHere((r) => new Set(r).add(id))
  }

  function markAllRead() {
    if (controlled) onMarkAllRead?.()
    else setReadHere(new Set(items.map((i) => i.id)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === 'row' ? (
          <button
            type="button"
            aria-label={label}
            className={cn('hover:bg-sidebar-accent focus-visible:ring-ring/40 aria-expanded:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2', className)}
          >
            <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} className="size-3.5 opacity-80" />
            {title}
            {unread > 0 && (
              <span className="bg-primary text-primary-foreground ml-auto grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
                {unread}
              </span>
            )}
          </button>
        ) : (
          <Button variant="ghost" size="icon" aria-label={label} className={cn('relative', className)}>
            <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
            {unread > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full px-1 text-[9px] font-semibold tabular-nums">
                {unread}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-3">
          <span className="text-xs font-medium">
            {title}
            {unread > 0 && <span className="text-muted-foreground ml-1.5 font-normal tabular-nums">{unread} unread</span>}
          </span>
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={!unread} onClick={markAllRead}>
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" /> Mark all read
          </Button>
        </div>
        {items.length ? (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => {
              const fresh = isUnread(item)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(item.id)
                      setOpen(false)
                      onOpen?.(item)
                    }}
                    className="hover:bg-accent focus-visible:bg-accent flex w-full items-start gap-2.5 px-3 py-2 text-left outline-none"
                  >
                    {item.avatar ?? <UserAvatar name={item.actor} className="mt-0.5" />}
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn('text-xs', !fresh && 'text-muted-foreground')}>
                        <span className={cn('font-medium', fresh && 'text-foreground')}>{item.actor}</span> {item.text}
                      </span>
                      {item.quote != null && <span className="text-muted-foreground line-clamp-2 text-[11px]">“{item.quote}”</span>}
                      {item.detail != null && <span className="text-muted-foreground truncate text-[11px]">{item.detail}</span>}
                    </span>
                    <span className="grid shrink-0 justify-items-end gap-1.5">
                      <span className="text-muted-foreground text-[10px] whitespace-nowrap">{item.time}</span>
                      {fresh && <span className="bg-primary size-1.5 rounded-full"><span className="sr-only">Unread</span></span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground px-3 py-6 text-center text-xs">{emptyLabel}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
