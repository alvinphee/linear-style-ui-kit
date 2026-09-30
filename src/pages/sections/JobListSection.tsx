import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, Camera01Icon, Cancel01Icon, CircleDashedIcon, Delete02Icon,
  FilterHorizontalIcon, NoSignalIcon, Sorting01Icon, UserIcon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { Section } from './shared'
import { JobContextMenu, JobDropdownMenu, JobPeek, openFullPage } from './JobActions'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

const ORDER: Status[] = ['progress', 'todo', 'backlog', 'done', 'cancelled']
const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']
const TABS: Record<string, Status[]> = {
  all: ORDER,
  active: ['progress', 'todo', 'backlog'],
  closed: ['done', 'cancelled'],
}
const UNASSIGNED = 'unassigned'

// The shared Checkbox only styles checked/unchecked, so draw the "some selected" dash here.
const MIXED =
  'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:bg-primary ' +
  'data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:[&_svg]:hidden ' +
  'data-[state=indeterminate]:before:absolute data-[state=indeterminate]:before:h-0.5 data-[state=indeterminate]:before:w-2 ' +
  'data-[state=indeterminate]:before:rounded-full data-[state=indeterminate]:before:bg-current'

const count = (n: number) => (n === 1 ? '1 job' : `${n} jobs`)

function shared<K extends keyof Job>(list: Job[], key: K): Job[K] | undefined {
  const first = list[0]?.[key]
  return list.every((j) => j[key] === first) ? first : undefined
}

export default function JobListSection() {
  const [tab, setTab] = useState('all')
  const { jobs, updateJobs, removeJobs, select } = useJobs()
  const [selected, setSelected] = useState<string | null>('DO-24817')
  const [peekId, setPeekId] = useState<string | null>(null)

  function peek(id: string) {
    setSelected(id)
    setPeekId(id)
  }
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const anchor = useRef<string | null>(null)
  const card = useRef<HTMLElement>(null)

  const groups = useMemo(
    () =>
      TABS[tab]
        .map((status) => ({ status, jobs: jobs.filter((j) => j.status === status) }))
        .filter((g) => g.jobs.length > 0),
    [tab, jobs],
  )
  const visible = useMemo(() => groups.flatMap((g) => g.jobs.map((j) => j.id)), [groups])
  // Only rows in view count as selected: a job moved out of the tab drops out of the selection.
  const pickedJobs = groups.flatMap((g) => g.jobs).filter((j) => checked.has(j.id))
  const picked = pickedJobs.map((j) => j.id)
  const allPicked = visible.length > 0 && picked.length === visible.length
  const headerState = allPicked ? true : picked.length ? 'indeterminate' : false

  function clear() {
    setChecked(new Set())
    anchor.current = null
  }

  function toggle(id: string, range: boolean) {
    const next = new Set(picked)
    const from = anchor.current ? visible.indexOf(anchor.current) : -1
    if (range && from !== -1) {
      const to = visible.indexOf(id)
      const on = !next.has(id)
      for (const rowId of visible.slice(Math.min(from, to), Math.max(from, to) + 1)) {
        if (on) next.add(rowId)
        else next.delete(rowId)
      }
    } else if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    anchor.current = id
    setChecked(next)
  }

  function changeTab(value: string) {
    setTab(value)
    clear()
  }

  useEffect(() => {
    if (!picked.length) return
    function onKey(e: KeyboardEvent) {
      // Radix calls preventDefault when Escape closes one of its menus or dialogs.
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const active = document.activeElement
      if (active && active !== document.body && !card.current?.contains(active)) return
      clear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked.length])

  return (
    <Section id="list" title="Job list" description="A Linear-style list: grouped, dense, keyboard-first">
      {/* overflow-clip, not hidden, so the bulk toolbar can stick to the bottom of the viewport */}
      <article ref={card} className="bg-card relative overflow-clip rounded-lg border lg:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Checkbox
              checked={headerState}
              onCheckedChange={() => (allPicked ? clear() : setChecked(new Set(visible)))}
              disabled={!visible.length}
              aria-label="Select all jobs in this view"
              className={MIXED}
            />
            <Tabs value={tab} onValueChange={changeTab}>
              <TabsList>
                <TabsTrigger value="all">All jobs</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" /> Filter
            </Button>
            <Button variant="ghost" size="sm">
              <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} data-icon="inline-start" /> Display
            </Button>
          </div>
        </header>

        {groups.map((group) => (
          <div key={group.status}>
            <div className="bg-subtle flex items-center gap-2 border-b px-3 py-1.5 text-xs">
              <StatusIcon status={group.status} />
              <span className="font-medium">{STATUS[group.status].label}</span>
              <span className="text-muted-foreground tabular-nums">{group.jobs.length}</span>
              <Button variant="ghost" size="icon-xs" className="ml-auto" aria-label={`Add ${STATUS[group.status].label} job`}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              </Button>
            </div>
            {group.jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                selected={selected === job.id}
                picked={checked.has(job.id)}
                selecting={picked.length > 0}
                onSelect={() => peek(job.id)}
                onOpenFull={() => openFullPage(select, job.id)}
                onToggle={(range) => toggle(job.id, range)}
              />
            ))}
          </div>
        ))}

        {picked.length > 0 && (
          <>
            {/* Room for the toolbar, so it never covers the last row. */}
            <div className="h-12" />
            <div className="pointer-events-none sticky bottom-0 z-10 h-0">
              <div className="absolute inset-x-0 bottom-2 flex justify-center px-2">
                <BulkToolbar
                  jobs={pickedJobs}
                  onStatus={(status) => {
                    updateJobs(picked, { status })
                    toast.success(`${count(picked.length)} moved to ${STATUS[status].label}`)
                  }}
                  onPriority={(priority) => {
                    updateJobs(picked, { priority })
                    toast.success(`${count(picked.length)} set to ${PRIORITY[priority].label.toLowerCase()}`)
                  }}
                  onAssign={(driver) => {
                    updateJobs(picked, { driver })
                    toast.success(driver ? `Assigned ${count(picked.length)} to ${driver}` : `Removed the assignee from ${count(picked.length)}`)
                  }}
                  onDelete={() => {
                    if (picked.length >= jobs.length) {
                      toast.error('Keep at least one job', { description: 'The demo needs something to show.' })
                      return
                    }
                    removeJobs(picked)
                    toast(`Deleted ${count(picked.length)}`)
                    clear()
                  }}
                  onClear={clear}
                />
              </div>
            </div>
          </>
        )}
      </article>
      <JobPeek jobId={peekId} order={visible} onNavigate={peek} onClose={() => setPeekId(null)} />
    </Section>
  )
}

function BulkToolbar({ jobs, onStatus, onPriority, onAssign, onDelete, onClear }: {
  jobs: Job[]
  onStatus: (status: Status) => void
  onPriority: (priority: Priority) => void
  onAssign: (driver: string) => void
  onDelete: () => void
  onClear: () => void
}) {
  const status = shared(jobs, 'status')
  const priority = shared(jobs, 'priority')
  const driver = shared(jobs, 'driver')
  const ids = jobs.map((j) => j.id)
  const named = ids.length > 3 ? `${ids.slice(0, 2).join(', ')} and ${ids.length - 2} more` : ids.join(', ')

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 slide-in-from-bottom-2 pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1 shadow-lg ring-1 duration-150"
    >
      <span className="px-2 text-xs whitespace-nowrap" aria-live="polite">
        <span className="font-medium tabular-nums">{jobs.length}</span> selected
      </span>
      <Separator orientation="vertical" className="my-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full" aria-label="Set status">
            <HugeiconsIcon
              icon={status ? STATUS[status].icon : CircleDashedIcon}
              strokeWidth={2}
              data-icon="inline-start"
              className={cn('size-3.5', status ? STATUS[status].className : 'text-muted-foreground')}
            />
            <span className="hidden sm:inline">Status</span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-44">
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={status} onValueChange={(v) => onStatus(v as Status)}>
            {ORDER.map((s) => (
              <DropdownMenuRadioItem key={s} value={s}>
                <StatusIcon status={s} /> {STATUS[s].label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full" aria-label="Set priority">
            <HugeiconsIcon
              icon={priority ? PRIORITY[priority].icon : NoSignalIcon}
              strokeWidth={2}
              data-icon="inline-start"
              className={cn('size-3.5', priority ? PRIORITY[priority].className : 'text-muted-foreground')}
            />
            <span className="hidden sm:inline">Priority</span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-44">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={priority} onValueChange={(v) => onPriority(v as Priority)}>
            {PRIORITY_ORDER.map((p) => (
              <DropdownMenuRadioItem key={p} value={p}>
                <PriorityIcon priority={p} /> {PRIORITY[p].label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="rounded-full" aria-label="Assign">
            <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} data-icon="inline-start" className="text-muted-foreground" />
            <span className="hidden sm:inline">Assign</span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-44">
          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={driver === undefined ? undefined : driver || UNASSIGNED}
            onValueChange={(v) => onAssign(v === UNASSIGNED ? '' : v)}
          >
            {PEOPLE.map((name) => (
              <DropdownMenuRadioItem key={name} value={name}>
                <Initials name={name} className="size-5" /> {name}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value={UNASSIGNED}>
              <NoAssignee /> No assignee
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 rounded-full"
            aria-label="Delete"
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {count(jobs.length)}?</AlertDialogTitle>
            <AlertDialogDescription>
              {named} and {jobs.length === 1 ? 'its' : 'their'} photos will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Separator orientation="vertical" className="my-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Clear selection" onClick={onClear}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Clear selection <Kbd>Esc</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function NoAssignee() {
  return (
    <span className="text-muted-foreground grid size-5 shrink-0 place-items-center rounded-full border border-dashed border-current/40">
      <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3" />
    </span>
  )
}

function JobRow({ job, selected, picked, selecting, onSelect, onOpenFull, onToggle }: {
  job: Job
  selected: boolean
  picked: boolean
  selecting: boolean
  onSelect: () => void
  onOpenFull: () => void
  onToggle: (range: boolean) => void
}) {
  return (
    <JobContextMenu job={job} onOpen={onSelect} onOpenFull={onOpenFull}>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          } else if (e.key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault()
            onToggle(e.shiftKey)
          }
        }}
        aria-keyshortcuts="X"
        data-selected={selected}
        className={cn(
          'hover:bg-accent/60 data-[selected=true]:bg-accent group/row flex h-9 cursor-default items-center gap-2.5 border-b px-3 text-xs outline-none select-none last:border-b-0 focus-visible:bg-accent',
          picked && 'bg-brand/5 dark:bg-brand/10',
        )}
      >
        <Checkbox
          checked={picked}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(e.shiftKey)
          }}
          aria-label={`Select ${job.id}`}
          className={cn(
            'opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100',
            selecting && 'opacity-100',
          )}
        />
        <PriorityIcon priority={job.priority} />
        <span className="text-muted-foreground w-[4.75rem] shrink-0 whitespace-nowrap tabular-nums">{job.id}</span>
        <StatusIcon status={job.status} />
        <span className="min-w-0 flex-1 truncate font-medium">{job.title}</span>
        {job.photos > 0 && (
          <span className="text-muted-foreground hidden items-center gap-1 md:flex">
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5" />
            <span className="tabular-nums">{job.photos}</span>
          </span>
        )}
        {job.customer && (
          <span className="text-muted-foreground hidden rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap lg:inline">
            {job.customer}
          </span>
        )}
        <span className="text-muted-foreground hidden w-16 text-right sm:inline">{job.due}</span>
        {job.driver ? <Initials name={job.driver} className="size-5" /> : <NoAssignee />}
        <JobDropdownMenu job={job} onOpen={onSelect} onOpenFull={onOpenFull} />
      </div>
    </JobContextMenu>
  )
}
