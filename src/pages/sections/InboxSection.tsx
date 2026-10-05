import { useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlarmClockIcon, Archive01Icon, ArrowLeft01Icon, ArrowUpRight01Icon, AtIcon, BubbleChatIcon,
  Clock01Icon, InboxIcon, RefreshIcon, TickDouble01Icon, UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconAction } from '@/components/icon-action'
import { Mention } from '@/components/mention'
import { STATUS, type Job, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { Section } from './shared'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'

type Kind = 'mention' | 'assigned' | 'status' | 'comment' | 'due'
type Tab = 'all' | 'unread' | 'mentions'

type Note = {
  id: string
  kind: Kind
  // Missing for reminders the app sends itself.
  actor?: string
  jobId: string
  status?: Status
  title: string
  snippet: string
  body: string
  time: string
  at: string
  unread: boolean
}

// Made-up sample notifications about the sample jobs.
const SEED: Note[] = [
  {
    id: 'n1', kind: 'mention', actor: 'Mei Ling', jobId: 'DO-24817', time: '5m', at: '5 minutes ago', unread: false,
    title: 'Mei Ling mentioned you', snippet: 'Bay 4 closes at 5 pm. Can you arrive before then?',
    body: '@you The site contact says bay 4 closes at 5 pm today. Can you arrive before then? If not, I will book bay 6 instead.',
  },
  {
    id: 'n2', kind: 'assigned', actor: 'Daniel', jobId: 'DO-24812', time: '25m', at: '25 minutes ago', unread: true,
    title: 'Daniel assigned you a job', snippet: 'Wrap and label export cargo',
    body: 'You are now the assignee. The cargo is temperature-sensitive: keep it between 2 and 8 °C, and print the export labels before wrapping.',
  },
  {
    id: 'n3', kind: 'status', actor: 'Ravi', jobId: 'DO-24815', status: 'progress', time: '1h', at: '1 hour ago', unread: true,
    title: 'Ravi started a job', snippet: 'Moved from Todo to In progress',
    body: 'Ravi moved this job from Todo to In progress. About 40 empty crates to collect, so he took the flatbed.',
  },
  {
    id: 'n4', kind: 'due', jobId: 'DO-24817', time: '2h', at: '2 hours ago', unread: true,
    title: 'Due today', snippet: 'Deliver 12 pallets to Jurong warehouse. 2 of 4 steps left.',
    body: 'This job is due today before 5 pm. Two of its four steps are still open: deliver and get a signature, and a photo of the delivered goods.',
  },
  {
    id: 'n5', kind: 'mention', actor: 'Ali', jobId: 'DO-24806', time: '3h', at: '3 hours ago', unread: true,
    title: 'Ali mentioned you', snippet: 'Photos of the broken pallets are attached.',
    body: '@you Photos of the three broken pallets are attached. Please check them before we send the report to the customer.',
  },
  {
    id: 'n6', kind: 'comment', actor: 'Siti', jobId: 'DO-24809', time: '5h', at: '5 hours ago', unread: false,
    title: 'Siti commented', snippet: 'The container arrives at 9 am. Please book the forklift.',
    body: 'The container arrives at 9 am on 2 Oct. Please book the forklift for 8:30 so we can start stuffing straight away.',
  },
  {
    id: 'n7', kind: 'status', actor: 'Mei Ling', jobId: 'DO-24798', status: 'done', time: '1d', at: 'Yesterday at 4:12 pm', unread: false,
    title: 'Mei Ling completed a job', snippet: 'Moved from In progress to Done',
    body: 'Mei Ling picked up the fumigation certificate and marked the job as done. The certificate scan is in the job files.',
  },
  {
    id: 'n8', kind: 'due', jobId: 'DO-24809', time: '1d', at: 'Yesterday at 9:00 am', unread: false,
    title: 'Due in 2 days', snippet: 'Container stuffing, 40ft. No steps yet.',
    body: 'This job is due on 2 Oct and has no steps yet. Add a checklist so the driver knows what to photograph.',
  },
  {
    id: 'n9', kind: 'comment', actor: 'Ravi', jobId: 'DO-24801', time: '3d', at: '3 days ago', unread: false,
    title: 'Ravi commented', snippet: 'Signed delivery note is uploaded.',
    body: 'Delivered all 4 crates. The signed delivery note and 6 photos are uploaded.',
  },
]

const KIND: Record<Exclude<Kind, 'status'>, { icon: IconSvgElement; className: string }> = {
  mention: { icon: AtIcon, className: 'text-brand' },
  assigned: { icon: UserAdd01Icon, className: 'text-muted-foreground' },
  comment: { icon: BubbleChatIcon, className: 'text-muted-foreground' },
  due: { icon: Clock01Icon, className: 'text-status-progress' },
}

const SNOOZE = [
  { label: 'Later today', hint: '6:00 pm', until: 'until 6:00 pm' },
  { label: 'Tomorrow', hint: '9:00 am', until: 'until tomorrow, 9:00 am' },
  { label: 'Next week', hint: 'Mon 9:00 am', until: 'until Monday, 9:00 am' },
  { label: 'In a month', hint: '30 Oct', until: 'until 30 Oct' },
]

const EMPTY_TEXT: Record<Tab, string> = {
  all: 'No notifications',
  unread: 'No unread notifications',
  mentions: 'No mentions',
}

function inView(notes: Note[], tab: Tab, keep: string | null) {
  if (tab === 'unread') return notes.filter((n) => n.unread || n.id === keep)
  if (tab === 'mentions') return notes.filter((n) => n.kind === 'mention')
  return notes
}

export default function InboxSection() {
  const { jobs, select } = useJobs()
  const [notes, setNotes] = useState(SEED)
  const [tab, setTab] = useState<Tab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(SEED[0].id)
  // On narrow cards the detail replaces the list.
  const [showDetail, setShowDetail] = useState(false)
  // Keeps a just-read row in the Unread tab so it doesn't vanish under the pointer.
  const [justRead, setJustRead] = useState<string | null>(null)

  const list = inView(notes, tab, justRead)
  const selected = notes.find((n) => n.id === selectedId) ?? null
  const unread = notes.filter((n) => n.unread).length
  const detailOpen = showDetail && selected !== null

  function view(id: string) {
    setSelectedId(id)
    if (notes.find((n) => n.id === id)?.unread) {
      setNotes((all) => all.map((n) => (n.id === id ? { ...n, unread: false } : n)))
      setJustRead(id)
    }
  }

  function open(id: string) {
    view(id)
    setShowDetail(true)
  }

  function changeTab(value: string) {
    const next = value as Tab
    setTab(next)
    setJustRead(null)
    if (selectedId && !inView(notes, next, null).some((n) => n.id === selectedId)) {
      setSelectedId(null)
      setShowDetail(false)
    }
  }

  function markAllRead() {
    setNotes((all) => all.map((n) => ({ ...n, unread: false })))
    setJustRead(selectedId)
    toast.success('All caught up', { description: `${unread} marked as read` })
  }

  function dismiss(id: string, message: string) {
    const index = notes.findIndex((n) => n.id === id)
    const note = notes[index]
    if (!note) return
    const position = list.findIndex((n) => n.id === id)
    const next = list[position + 1] ?? list[position - 1]
    setNotes((all) => all.filter((n) => n.id !== id))
    if (next) view(next.id)
    else {
      setSelectedId(null)
      setShowDetail(false)
    }
    toast(message, {
      action: {
        label: 'Undo',
        onClick: () =>
          setNotes((all) => (all.some((n) => n.id === id) ? all : [...all.slice(0, index), note, ...all.slice(index)])),
      },
    })
  }

  function openJob(jobId: string) {
    select(jobId)
    document.getElementById('issue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function onListKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-note]'))
    if (!rows.length) return
    e.preventDefault()
    const current = rows.indexOf(document.activeElement as HTMLButtonElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    const row = rows[current === -1 ? 0 : Math.min(rows.length - 1, Math.max(0, current + step))]
    row.focus()
    view(row.dataset.note!)
  }

  return (
    <Section id="inbox" title="Inbox" description="Notifications in a split view">
      <article className="bg-card @container flex h-[26rem] min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <div
          className={cn(
            'min-w-0 flex-col @2xl:flex @2xl:w-72 @2xl:shrink-0 @2xl:border-r @4xl:w-80',
            detailOpen ? 'hidden' : 'flex w-full',
          )}
        >
          <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
            <Tabs value={tab} onValueChange={changeTab} className="min-w-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unread > 0 && <span className="text-muted-foreground tabular-nums">{unread}</span>}
                </TabsTrigger>
                <TabsTrigger value="mentions">Mentions</TabsTrigger>
              </TabsList>
            </Tabs>
            <IconAction
              label="Mark all as read"
              icon={TickDouble01Icon}
              disabled={!unread}
              onClick={markAllRead}
              className="text-foreground"
            />
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto" role="group" aria-label="Notifications" onKeyDown={onListKey}>
            {list.map((note) => (
              <NoteRow key={note.id} note={note} selected={note.id === selectedId} onOpen={() => open(note.id)} />
            ))}
            {list.length === 0 && (
              <Empty className="h-full gap-3">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                  </EmptyMedia>
                  <EmptyTitle>{EMPTY_TEXT[tab]}</EmptyTitle>
                  <EmptyDescription>You are all caught up.</EmptyDescription>
                </EmptyHeader>
                {notes.length === 0 && (
                  <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => setNotes(SEED)}>
                      <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                      Restore sample notifications
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            )}
          </div>
        </div>

        <div className={cn('min-w-0 flex-1 flex-col', detailOpen ? 'flex' : 'hidden @2xl:flex')}>
          {selected ? (
            <NoteDetail
              note={selected}
              job={jobs.find((j) => j.id === selected.jobId)}
              onBack={() => setShowDetail(false)}
              onOpenJob={() => openJob(selected.jobId)}
              onSnooze={(until) => dismiss(selected.id, `Snoozed ${until}`)}
              onArchive={() => dismiss(selected.id, 'Notification archived')}
            />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>{notes.length ? 'Nothing selected' : 'No notifications'}</EmptyTitle>
                <EmptyDescription>
                  {notes.length ? 'Pick a notification to read it here.' : 'Archived and snoozed items leave the inbox.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </article>
    </Section>
  )
}

function Actor({ note, large }: { note: Note; large?: boolean }) {
  const badge = note.kind === 'status' ? STATUS[note.status ?? 'todo'] : KIND[note.kind]

  if (!note.actor) {
    return (
      <span className={cn('bg-muted grid shrink-0 place-items-center rounded-full', large ? 'size-8' : 'size-6')}>
        <HugeiconsIcon icon={badge.icon} strokeWidth={2} className={cn(large ? 'size-4' : 'size-3.5', badge.className)} />
      </span>
    )
  }

  return (
    <span className="relative shrink-0">
      <UserAvatar name={note.actor} className={large ? 'size-8' : undefined} />
      <span className="bg-card ring-border absolute -right-1 -bottom-1 grid size-3.5 place-items-center rounded-full ring-1">
        <HugeiconsIcon icon={badge.icon} strokeWidth={2} className={cn('size-2.5', badge.className)} />
      </span>
    </span>
  )
}

function NoteRow({ note, selected, onOpen }: { note: Note; selected: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-note={note.id}
      onClick={onOpen}
      aria-current={selected || undefined}
      className="hover:bg-accent/60 aria-[current=true]:bg-accent focus-visible:bg-accent flex w-full min-w-0 items-start gap-2 border-b py-2.5 pr-3 pl-2 text-left outline-none"
    >
      <span className={cn('mt-2.5 size-1.5 shrink-0 rounded-full', note.unread ? 'bg-brand' : 'bg-transparent')} />
      <Actor note={note} />
      <span className="grid min-w-0 flex-1 gap-0.5 pl-1">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className={cn('min-w-0 flex-1 truncate text-xs', note.unread && 'font-semibold')}>
            {note.unread && <span className="sr-only">Unread: </span>}
            {note.title}
          </span>
          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{note.time}</span>
        </span>
        <span className="text-muted-foreground truncate text-[11px]">
          <span className="tabular-nums">{note.jobId}</span> · {note.snippet}
        </span>
      </span>
    </button>
  )
}

function NoteBody({ text }: { text: string }) {
  const parts = text.split('@you')
  return (
    <p className="text-xs/relaxed">
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <Mention>@you</Mention>}
          {part}
        </span>
      ))}
    </p>
  )
}

function NoteDetail({ note, job, onBack, onOpenJob, onSnooze, onArchive }: {
  note: Note
  job: Job | undefined
  onBack: () => void
  onOpenJob: () => void
  onSnooze: (until: string) => void
  onArchive: () => void
}) {
  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        <Button variant="ghost" size="icon-sm" className="@2xl:hidden" aria-label="Back to inbox" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </Button>
        <span className="text-muted-foreground min-w-0 flex-1 truncate px-1 text-xs">
          <span className="tabular-nums">{note.jobId}</span>
          {job && <span className="hidden @lg:inline"> · {job.title}</span>}
        </span>
        <Button variant="outline" size="sm" onClick={onOpenJob} disabled={!job}>
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-start" />
          Open job
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconAction label="Snooze" icon={AlarmClockIcon} className="text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Snooze until</DropdownMenuLabel>
            {SNOOZE.map((option) => (
              <DropdownMenuItem key={option.label} onSelect={() => onSnooze(option.until)}>
                {option.label}
                <span className="text-muted-foreground ml-auto text-[11px]">{option.hint}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <IconAction label="Archive" icon={Archive01Icon} onClick={onArchive} className="text-foreground" />
      </header>

      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
        <div className="flex items-start gap-2.5">
          <Actor note={note} large />
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium">{note.title}</h3>
            <p className="text-muted-foreground text-[11px]">
              {note.actor ?? 'Reminder'} · {note.at}
            </p>
          </div>
        </div>

        <NoteBody text={note.body} />

        {job ? (
          <div className="grid gap-1.5 rounded-md border p-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <StatusIcon status={job.status} />
              <span className="truncate text-xs font-medium">{job.title}</span>
            </div>
            <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <PriorityIcon priority={job.priority} />
              <span className="tabular-nums">{job.id}</span>
              <span>{STATUS[job.status].label}</span>
              {job.customer && <span className="truncate">· {job.customer}</span>}
              {job.due && <span>· Due {job.due}</span>}
              {job.driver && <UserAvatar name={job.driver} className="ml-auto size-5" />}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground rounded-md border border-dashed p-2.5 text-xs">
            {note.jobId} was deleted, so there is nothing to open.
          </p>
        )}
      </div>
    </>
  )
}
