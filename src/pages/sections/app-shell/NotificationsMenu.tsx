import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Notification03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useJobs, type Activity } from '../../jobs-store'
import { Initials } from '../StatusSection'

const SHOWN = 12
const FIRST_UNREAD = 3

export type Notifications = ReturnType<typeof useNotifications>

// Teammates' activity from the shared job store, newest first. Your own
// changes never notify you. Read state lives with the shell, so it survives
// switching between header styles.
export function useNotifications() {
  const { activity, jobs } = useJobs()
  const items = useMemo(
    () => activity.filter((a) => a.actor !== 'You' && jobs.some((j) => j.id === a.jobId)).slice(-SHOWN).reverse(),
    [activity, jobs],
  )
  const [read, setRead] = useState<Set<string>>(() => new Set(items.slice(FIRST_UNREAD).map((a) => a.id)))
  const unread = items.filter((a) => !read.has(a.id)).length
  return {
    items,
    unread,
    isRead: (id: string) => read.has(id),
    markRead: (id: string) => setRead((r) => new Set(r).add(id)),
    markAllRead: () => setRead(new Set(items.map((a) => a.id))),
  }
}

function describe(a: Activity) {
  if (a.kind === 'comment') return 'commented'
  if (a.kind === 'created') return 'created an issue'
  return a.text
}

export function NotificationsMenu({ notes, onOpenJob, className }: {
  notes: Notifications
  onOpenJob: (id: string) => void
  className?: string
}) {
  const { jobs } = useJobs()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={notes.unread ? `Notifications, ${notes.unread} unread` : 'Notifications'}
          className={cn('relative', className)}
        >
          <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
          {notes.unread > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full px-1 text-[9px] font-semibold tabular-nums">
              {notes.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] gap-0 p-0">
        <div className="flex items-center justify-between gap-2 border-b py-1.5 pr-1.5 pl-3">
          <span className="text-xs font-medium">
            Notifications
            {notes.unread > 0 && <span className="text-muted-foreground ml-1.5 font-normal tabular-nums">{notes.unread} unread</span>}
          </span>
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={!notes.unread} onClick={notes.markAllRead}>
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" /> Mark all read
          </Button>
        </div>
        {notes.items.length ? (
          <ul className="max-h-80 overflow-y-auto py-1">
            {notes.items.map((a) => {
              const job = jobs.find((j) => j.id === a.jobId)!
              const unread = !notes.isRead(a.id)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      notes.markRead(a.id)
                      setOpen(false)
                      onOpenJob(a.jobId)
                    }}
                    className="hover:bg-accent focus-visible:bg-accent flex w-full items-start gap-2.5 px-3 py-2 text-left outline-none"
                  >
                    <Initials name={a.actor} className="mt-0.5 size-6" />
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn('text-xs', !unread && 'text-muted-foreground')}>
                        <span className={cn('font-medium', unread && 'text-foreground')}>{a.actor}</span> {describe(a)}
                      </span>
                      {a.kind === 'comment' && <span className="text-muted-foreground line-clamp-2 text-[11px]">“{a.text}”</span>}
                      <span className="text-muted-foreground truncate text-[11px]">
                        <span className="tabular-nums">{job.id}</span> · {job.title}
                      </span>
                    </span>
                    <span className="grid shrink-0 justify-items-end gap-1.5">
                      <span className="text-muted-foreground text-[10px] whitespace-nowrap">{a.at}</span>
                      {unread && <span className="bg-primary size-1.5 rounded-full"><span className="sr-only">Unread</span></span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground px-3 py-6 text-center text-xs">You are all caught up.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
