import { useMemo, useState } from 'react'
import { NotificationsMenu as NotificationsPopover } from '@/blocks/notifications-menu'
import { useJobs, type Activity } from '../../jobs-store'

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

// The shared notifications block, fed from the job store.
export function NotificationsMenu({ notes, onOpenJob, className }: {
  notes: Notifications
  onOpenJob: (id: string) => void
  className?: string
}) {
  const { jobs } = useJobs()
  const items = notes.items.map((a) => {
    const job = jobs.find((j) => j.id === a.jobId)!
    return {
      id: a.id,
      jobId: a.jobId,
      actor: a.actor,
      text: describe(a),
      quote: a.kind === 'comment' ? a.text : undefined,
      detail: <><span className="tabular-nums">{job.id}</span> · {job.title}</>,
      time: a.at,
      unread: !notes.isRead(a.id),
    }
  })

  return (
    <NotificationsPopover
      items={items}
      onOpen={(item) => onOpenJob(item.jobId)}
      onMarkRead={notes.markRead}
      onMarkAllRead={notes.markAllRead}
      className={className}
    />
  )
}
