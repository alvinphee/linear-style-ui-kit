import { useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { addDays, format, isValid, parse } from 'date-fns'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowUp01Icon, Attachment01Icon, Building03Icon, Calendar03Icon,
  Camera01Icon, Cancel01Icon, Clock01Icon, Copy01Icon, CopyPlusIcon, Delete02Icon, Link01Icon,
  MediumSignalIcon, MoreHorizontalIcon, RefreshIcon, StarIcon, Tag01Icon, Tick02Icon, UserCircleIcon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CUSTOMERS, DUE_OPTIONS, LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status,
} from '../data'
import { useJobs, type Activity } from '../jobs-store'
import { Section } from './shared'
import { Person, UserAvatar } from '@/components/person'
import { PriorityIcon, StatusIcon } from './StatusSection'

const SMALL_AVATAR = 'size-5'
const TRIGGER = 'w-full min-w-0 justify-start gap-2 px-1.5 font-normal'

function copyText(text: string, message: string, description?: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
  toast(message, { description })
}

export default function IssueSection() {
  const { jobs, selected, select } = useJobs()
  const index = jobs.findIndex((j) => j.id === selected.id)
  const prev = jobs[index - 1]
  const next = jobs[index + 1]

  // J / K work while focus is anywhere in the card, but never while typing,
  // and never from portalled menus (React bubbles those events through here).
  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const target = e.target as HTMLElement
    if (!e.currentTarget.contains(target) || e.ctrlKey || e.metaKey || e.altKey) return
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return
    const to = e.key === 'j' ? next : e.key === 'k' ? prev : undefined
    if (to) {
      e.preventDefault()
      select(to.id)
    }
  }

  return (
    <Section id="issue" title="Issue detail" description="Linear-style detail page. Edit anything in place.">
      <article
        tabIndex={-1}
        onKeyDown={onKeyDown}
        aria-label={`Job ${selected.id}`}
        className="bg-card min-w-0 overflow-hidden rounded-lg border outline-none lg:col-span-2"
      >
        <TopBar job={selected} position={index + 1} total={jobs.length} prev={prev} next={next} />
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-6">
            <TitleAndDescription job={selected} />
            <SubTasks job={selected} />
            <ActivityFeed job={selected} />
          </div>
          <Properties job={selected} />
        </div>
      </article>
    </Section>
  )
}

function TopBar({ job, position, total, prev, next }: {
  job: Job
  position: number
  total: number
  prev?: Job
  next?: Job
}) {
  const { jobs, select, addJob, removeJobs } = useJobs()
  const [starred, setStarred] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)
  const isStarred = starred.includes(job.id)

  function duplicate() {
    const copy = addJob(job.status, `${job.title} (copy)`)
    select(copy.id)
    toast(`Duplicated as ${copy.id}`)
  }

  function remove() {
    const id = job.id
    removeJobs([id])
    toast(`Deleted ${id}`)
  }

  return (
    <header className="flex h-10 items-center gap-2 border-b px-3">
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink href="#list">Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>›</BreadcrumbSeparator>
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium tabular-nums">{job.id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex shrink-0 items-center gap-0.5">
        <span className="text-muted-foreground mr-1 hidden text-xs tabular-nums sm:inline">
          {position} / {total}
        </span>
        <IconButton label="Previous job" keys="K" disabled={!prev} onClick={() => prev && select(prev.id)}>
          <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
        </IconButton>
        <IconButton label="Next job" keys="J" disabled={!next} onClick={() => next && select(next.id)}>
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
        </IconButton>
        <Separator orientation="vertical" className="mx-1 h-4" />
        <IconButton
          label={isStarred ? 'Unstar job' : 'Star job'}
          aria-pressed={isStarred}
          className={isStarred ? 'text-status-progress hover:text-status-progress aria-expanded:text-status-progress' : undefined}
          onClick={() => setStarred((s) => (isStarred ? s.filter((id) => id !== job.id) : [...s, job.id]))}
        >
          <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
        </IconButton>
        <IconButton
          label="Copy link"
          onClick={() => copyText(`https://app.example.com/jobs/${job.id}`, 'Link copied', `app.example.com/jobs/${job.id}`)}
        >
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
        </IconButton>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button ref={moreRef} variant="ghost" size="icon-sm" aria-label="More actions" className="text-muted-foreground">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => copyText(job.id, `Copied ${job.id}`)}>
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={duplicate}>
              <HugeiconsIcon icon={CopyPlusIcon} strokeWidth={2} /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={jobs.length <= 1} onSelect={() => setConfirmDelete(true)}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            moreRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {job.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{job.title || 'Untitled job'}” disappears from every view. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}

function IconButton({ label, keys, className, children, ...props }: ComponentProps<typeof Button> & {
  label: string
  keys?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-keyshortcuts={keys}
          className={cn('text-muted-foreground', className)}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {keys && <Kbd>{keys}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

function GrowingTextarea({ value, className, ...props }: ComponentProps<'textarea'> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // field-sizing does the job where supported; elsewhere, size to the content.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={cn('field-sizing-content block w-full resize-none overflow-hidden bg-transparent outline-none', className)}
      {...props}
    />
  )
}

function TitleAndDescription({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  return (
    <div className="grid gap-2">
      <input
        aria-label="Job title"
        placeholder="Job title"
        value={job.title}
        onChange={(e) => updateJob(job.id, { title: e.target.value })}
        className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-xl font-semibold tracking-tight outline-none"
      />
      <GrowingTextarea
        aria-label="Description"
        placeholder="Add description…"
        value={job.description}
        onChange={(e) => updateJob(job.id, { description: e.target.value })}
        className="placeholder:text-muted-foreground text-[13px] leading-relaxed"
      />
    </div>
  )
}

function SubTasks({ job }: { job: Job }) {
  const { toggleSubtask, addSubtask } = useJobs()
  const total = job.subtasks.length
  const done = job.subtasks.filter((s) => s.done).length

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="font-medium">Sub-tasks</span>
        {total > 0 && (
          <>
            <span className="text-muted-foreground tabular-nums">{done}/{total}</span>
            <Progress value={(done / total) * 100} aria-label="Sub-tasks done" className="w-16" />
          </>
        )}
      </div>
      <ul className="divide-y overflow-hidden rounded-lg border">
        {job.subtasks.map((task) => (
          <li key={task.id}>
            <label className="hover:bg-accent/60 flex min-h-8 cursor-default items-center gap-2.5 px-3 py-1.5 text-[13px]">
              <Checkbox checked={task.done} onCheckedChange={() => toggleSubtask(job.id, task.id)} />
              <span className={cn('min-w-0 flex-1 break-words', task.done && 'text-muted-foreground line-through')}>
                {task.title}
              </span>
            </label>
          </li>
        ))}
        <li>
          <SubtaskInput key={job.id} onAdd={(title) => addSubtask(job.id, title)} />
        </li>
      </ul>
    </div>
  )
}

function SubtaskInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return (
    <div className="focus-within:bg-accent/40 flex items-center gap-2.5 px-3">
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
      <input
        aria-label="Add sub-task"
        placeholder="Add sub-task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) {
            e.preventDefault()
            onAdd(title.trim())
            setTitle('')
          }
          if (e.key === 'Escape') {
            setTitle('')
            e.currentTarget.blur()
          }
        }}
        className="placeholder:text-muted-foreground h-8 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
      />
    </div>
  )
}

const EVENT_ICONS: Record<Exclude<Activity['kind'], 'comment'>, IconSvgElement> = {
  created: Add01Icon,
  status: RefreshIcon,
  priority: MediumSignalIcon,
  assignee: UserSwitchIcon,
  labels: Tag01Icon,
  due: Calendar03Icon,
}

// The store writes "moved from A to B" / "set priority to B", so B is the new value.
function EventIcon({ entry }: { entry: Activity }) {
  const value = entry.text.split(' to ').pop()
  if (entry.kind === 'status') {
    const status = (Object.keys(STATUS) as Status[]).find((s) => STATUS[s].label === value)
    if (status) return <StatusIcon status={status} />
  }
  if (entry.kind === 'priority') {
    const priority = (Object.keys(PRIORITY) as Priority[]).find((p) => PRIORITY[p].label === value)
    if (priority) return <PriorityIcon priority={priority} />
  }
  const icon = entry.kind === 'comment' ? RefreshIcon : EVENT_ICONS[entry.kind]
  return <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
}

function ActivityFeed({ job }: { job: Job }) {
  const { activity, addComment } = useJobs()
  const entries = activity.filter((a) => a.jobId === job.id)

  return (
    <div className="mt-8">
      <h4 className="mb-3 text-xs font-medium">Activity</h4>
      <ol className="before:bg-border relative grid gap-3 before:absolute before:inset-y-1 before:left-[11.5px] before:w-px">
        {entries.map((entry) =>
          entry.kind === 'comment' ? (
            <li key={entry.id} className="flex items-start gap-2.5">
              <UserAvatar name={entry.actor} className="mt-1" />
              <div className="bg-subtle min-w-0 flex-1 rounded-lg border px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-medium">{entry.actor}</span>
                  <span className="text-muted-foreground text-[11px]">{entry.at}</span>
                </div>
                <p className="mt-0.5 text-[13px] break-words whitespace-pre-wrap">{entry.text}</p>
              </div>
            </li>
          ) : (
            <li key={entry.id} className="flex items-start gap-2.5 text-xs">
              <span className="bg-card relative grid size-6 shrink-0 place-items-center">
                <EventIcon entry={entry} />
              </span>
              <p className="text-muted-foreground min-w-0 py-1 leading-4">
                <span className="text-foreground font-medium">{entry.actor}</span> {entry.text}
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, </span>
                {entry.at}
              </p>
            </li>
          ),
        )}
      </ol>
      <Composer key={job.id} onSubmit={(text) => addComment(job.id, text)} />
    </div>
  )
}

function Composer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')
  const empty = !text.trim()

  function submit() {
    if (empty) return
    onSubmit(text.trim())
    setText('')
  }

  return (
    <div className="bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 mt-4 rounded-lg border transition-colors focus-within:ring-2">
      <Textarea
        aria-label="Comment"
        placeholder="Leave a comment…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            submit()
          }
        }}
        className="min-h-14 border-0 bg-transparent px-3 py-2.5 focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="flex items-center justify-end gap-1 px-2 pb-2">
        <span className="text-muted-foreground mr-auto hidden pl-1 text-[11px] sm:inline">Ctrl + Enter to send</span>
        <IconButton label="Attach a file" onClick={() => toast('Attach a file', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
        </IconButton>
        <Button variant={empty ? 'secondary' : 'default'} disabled={empty} onClick={submit}>
          Comment
        </Button>
      </div>
    </div>
  )
}

function Properties({ job }: { job: Job }) {
  return (
    <aside aria-label="Properties" className="grid content-start gap-0.5 border-t p-3 lg:w-64 lg:shrink-0 lg:border-t-0 lg:border-l">
      <PropertyRow label="Status"><StatusMenu job={job} /></PropertyRow>
      <PropertyRow label="Priority"><PriorityMenu job={job} /></PropertyRow>
      <PropertyRow label="Assignee"><AssigneePicker job={job} /></PropertyRow>
      <LabelsPicker job={job} />
      <PropertyRow label="Due date"><DuePicker job={job} /></PropertyRow>
      <PropertyRow label="Customer"><CustomerSelect job={job} /></PropertyRow>
      <Separator className="my-2" />
      <PropertyRow label="Photos">
        <ReadOnly>
          <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          {job.photos ? `${job.photos} ${job.photos === 1 ? 'photo' : 'photos'}` : 'None yet'}
        </ReadOnly>
      </PropertyRow>
      <PropertyRow label="Created by">
        <ReadOnly>
          <Person name={job.createdBy} />
        </ReadOnly>
      </PropertyRow>
      <PropertyRow label="Created">
        <ReadOnly>
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          {job.created}
        </ReadOnly>
      </PropertyRow>
    </aside>
  )
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-7 items-center gap-2">
      <span className="text-muted-foreground w-20 shrink-0 text-xs">{label}</span>
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  )
}

function ReadOnly({ children }: { children: ReactNode }) {
  return <span className="flex min-w-0 items-center gap-2 px-1.5 text-xs">{children}</span>
}

function StatusMenu({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={TRIGGER} aria-label={`Status: ${STATUS[job.status].label}`}>
          <StatusIcon status={job.status} />
          <span className="truncate">{STATUS[job.status].label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={job.status} onValueChange={(v) => updateJob(job.id, { status: v as Status })}>
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusIcon status={s} /> {STATUS[s].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PriorityMenu({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={TRIGGER} aria-label={`Priority: ${PRIORITY[job.priority].label}`}>
          <PriorityIcon priority={job.priority} />
          <span className={cn('truncate', job.priority === 'none' && 'text-muted-foreground')}>
            {PRIORITY[job.priority].label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={job.priority} onValueChange={(v) => updateJob(job.id, { priority: v as Priority })}>
          {(Object.keys(PRIORITY) as Priority[]).map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              <PriorityIcon priority={p} /> {PRIORITY[p].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AssigneePicker({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  const [open, setOpen] = useState(false)

  function pick(driver: string) {
    updateJob(job.id, { driver })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={TRIGGER} aria-label={`Assignee: ${job.driver || 'Unassigned'}`}>
          {job.driver ? (
            <UserAvatar name={job.driver} className={SMALL_AVATAR} />
          ) : (
            <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="text-muted-foreground size-4" />
          )}
          <span className={cn('truncate', !job.driver && 'text-muted-foreground')}>{job.driver || 'Unassigned'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Assign to…" />
          <CommandList>
            <CommandEmpty>No one found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Unassigned" data-checked={!job.driver} onSelect={() => pick('')}>
                <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="text-muted-foreground size-4" />
                Unassigned
              </CommandItem>
              {PEOPLE.map((person) => (
                <CommandItem key={person} value={person} data-checked={job.driver === person} onSelect={() => pick(person)}>
                  <UserAvatar name={person} className={SMALL_AVATAR} />
                  {person}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function LabelsPicker({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  const chosen = LABELS.filter((l) => job.labels.includes(l.id))

  function toggle(id: string) {
    const next = job.labels.includes(id) ? job.labels.filter((l) => l !== id) : [...job.labels, id]
    updateJob(job.id, { labels: LABELS.filter((l) => next.includes(l.id)).map((l) => l.id) })
  }

  return (
    <>
      <PropertyRow label="Labels">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className={TRIGGER} aria-label={`Labels: ${chosen.map((l) => l.name).join(', ') || 'none'}`}>
              <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="text-muted-foreground" />
              <span className={cn('truncate', !chosen.length && 'text-muted-foreground')}>
                {chosen.length ? `${chosen.length} ${chosen.length === 1 ? 'label' : 'labels'}` : 'Add label'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 gap-0 p-0">
            <Command>
              <CommandInput placeholder="Change labels…" />
              <CommandList>
                <CommandEmpty>No labels found.</CommandEmpty>
                <CommandGroup>
                  {LABELS.map((label) => (
                    <CommandItem
                      key={label.id}
                      value={label.name}
                      data-checked={job.labels.includes(label.id)}
                      onSelect={() => toggle(label.id)}
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: label.colour }} />
                      {label.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </PropertyRow>
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-1 pl-22">
          {chosen.map((label) => (
            <span key={label.id} className="inline-flex h-5 items-center gap-1.5 rounded-full border pr-0.5 pl-2 text-[11px]">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: label.colour }} />
              {label.name}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${label.name}`}
                className="text-muted-foreground size-4 rounded-full"
                onClick={() => toggle(label.id)}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function dueToDate(due: string) {
  const today = new Date()
  if (due === 'Today') return today
  if (due === 'Tomorrow') return addDays(today, 1)
  const parsed = parse(due, 'd MMM', today)
  return isValid(parsed) ? parsed : undefined
}

function DuePicker({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  const [open, setOpen] = useState(false)
  const date = dueToDate(job.due)

  function setDue(due: string) {
    updateJob(job.id, { due })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={TRIGGER} aria-label={`Due date: ${job.due || 'none'}`}>
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground" />
          <span className={cn('truncate', !job.due && 'text-muted-foreground')}>{job.due || 'Set due date'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <div className="grid p-1">
          {[...DUE_OPTIONS, ''].map((option) => (
            <Button key={option || 'none'} variant="ghost" className="justify-start px-2 font-normal" onClick={() => setDue(option)}>
              <span className={cn(!option && 'text-muted-foreground')}>{option || 'No due date'}</span>
              {job.due === option && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="ml-auto" />}
            </Button>
          ))}
        </div>
        <Separator />
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(day) => day && setDue(format(day, 'd MMM'))}
        />
      </PopoverContent>
    </Popover>
  )
}

function CustomerSelect({ job }: { job: Job }) {
  const { updateJob } = useJobs()
  return (
    <Select value={job.customer} onValueChange={(customer) => updateJob(job.id, { customer })}>
      <SelectTrigger
        aria-label="Customer"
        className="hover:bg-muted dark:hover:bg-muted/50 w-full min-w-0 justify-start gap-2 border-transparent bg-transparent px-1.5 dark:bg-transparent [&>svg:last-child]:hidden"
      >
        <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-muted-foreground" />
        <SelectValue placeholder="Set customer" />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {CUSTOMERS.map((c) => (
          <SelectItem key={c} value={c}>{c}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
