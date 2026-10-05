import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon, Cancel01Icon, CircleDashedIcon, Delete02Icon, FilterHorizontalIcon, NoSignalIcon, Sorting01Icon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { listNames, MIXED } from '@/blocks/data-table'
import { GroupedList } from '@/blocks/grouped-list'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { plural } from '@/lib/text'
import { PRIORITY, STATUS, STATUS_LIST_ORDER, type Job, type Priority, type Status } from '../data'
import {
  ASSIGNEE_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeValue, driverOf, type JobProperty,
} from '../job-options'
import { useJobs } from '../jobs-store'
import { Section } from './shared'
import { JobPeek, JobRow, openFullPage } from './JobActions'

const TABS: Record<string, Status[]> = {
  all: STATUS_LIST_ORDER,
  active: ['progress', 'todo', 'backlog'],
  closed: ['done', 'cancelled'],
}

// The cells each row shows (no labels in this list).
const ROW_PROPERTIES: Partial<Record<JobProperty, boolean>> = {
  priority: true, id: true, status: true, customer: true, photos: true, due: true, assignee: true,
}

const jobCount = (n: number) => plural(n, 'job')

function shared<K extends keyof Job>(list: Job[], key: K): Job[K] | undefined {
  const first = list[0]?.[key]
  return list.every((j) => j[key] === first) ? first : undefined
}

export default function JobListSection() {
  const [tab, setTab] = useState('all')
  const { jobs, addJob, updateJobs, removeJobs, select } = useJobs()
  const [selected, setSelected] = useState<string | null>('DO-24817')
  const [peekId, setPeekId] = useState<string | null>(null)

  function peek(id: string) {
    setSelected(id)
    setPeekId(id)
  }
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const card = useRef<HTMLElement>(null)

  const groups = useMemo(
    () =>
      TABS[tab]
        .map((status) => ({
          id: status, title: STATUS[status].label, visual: STATUS_OPTIONS.find((o) => o.value === status)!.visual,
          items: jobs.filter((j) => j.status === status),
        }))
        .filter((g) => g.items.length > 0),
    [tab, jobs],
  )
  const visible = useMemo(() => groups.flatMap((g) => g.items.map((j) => j.id)), [groups])
  // Only rows in view count as selected: a job moved out of the tab drops out of the selection.
  const pickedJobs = groups.flatMap((g) => g.items).filter((j) => checked.has(j.id))
  const picked = pickedJobs.map((j) => j.id)
  const allPicked = visible.length > 0 && picked.length === visible.length
  const headerState = allPicked ? true : picked.length ? 'indeterminate' : false

  function clear() {
    setChecked(new Set())
  }

  function changeTab(value: string) {
    setTab(value)
    clear()
  }

  // "+" on a group: a new job with that status, opened in the side panel.
  function addTo(status: Status) {
    const job = addJob(status)
    toast.success(`Created ${job.id}`, { description: `Added to ${STATUS[status].label}.` })
    peek(job.id)
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
      {/* overflow-clip, not hidden, so the bulk toolbar can stick to the bottom of the viewport.
          @container: the rows show more cells as the card widens. */}
      <article ref={card} className="bg-card @container relative overflow-clip rounded-lg border lg:col-span-2">
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

        <GroupedList
          groups={groups}
          framed
          selected={picked}
          onSelectedChange={(ids) => setChecked(new Set(ids))}
          onAdd={(group) => addTo(group.id)}
          addLabel={(group) => `Add ${group.title} job`}
          itemName={{ one: 'job', other: 'jobs' }}
          renderRow={(job, row) => (
            <JobRow
              job={job}
              row={row}
              properties={ROW_PROPERTIES}
              active={selected === job.id}
              onOpen={() => peek(job.id)}
              onOpenFull={() => openFullPage(select, job.id)}
            />
          )}
        />

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
                    toast.success(`${jobCount(picked.length)} moved to ${STATUS[status].label}`)
                  }}
                  onPriority={(priority) => {
                    updateJobs(picked, { priority })
                    toast.success(`${jobCount(picked.length)} set to ${PRIORITY[priority].label.toLowerCase()}`)
                  }}
                  onAssign={(driver) => {
                    updateJobs(picked, { driver })
                    toast.success(driver ? `Assigned ${jobCount(picked.length)} to ${driver}` : `Removed the assignee from ${jobCount(picked.length)}`)
                  }}
                  onDelete={() => {
                    if (picked.length >= jobs.length) {
                      toast.error('Keep at least one job', { description: 'The demo needs something to show.' })
                      return
                    }
                    removeJobs(picked)
                    toast(`Deleted ${jobCount(picked.length)}`)
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
  const [nobody, ...people] = ASSIGNEE_OPTIONS

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
            {STATUS_OPTIONS.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                {o.visual} {o.label}
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
            {PRIORITY_OPTIONS.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                {o.visual} {o.label}
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
            value={driver === undefined ? undefined : assigneeValue(driver)}
            onValueChange={(v) => onAssign(driverOf(v))}
          >
            {/* People first, nobody last, under a line. */}
            {people.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                {o.visual} {o.label}
              </DropdownMenuRadioItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuRadioItem value={nobody.value}>
              {nobody.visual} {nobody.label}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirm
        title={`Delete ${jobCount(jobs.length)}?`}
        description={`${listNames(jobs.map((j) => j.id))} and ${jobs.length === 1 ? 'its' : 'their'} photos will be removed. This cannot be undone.`}
        onConfirm={onDelete}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 rounded-full"
          aria-label="Delete"
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </DeleteConfirm>

      <Separator orientation="vertical" className="my-1" />
      <IconAction
        label="Clear selection"
        icon={Cancel01Icon}
        shortcut={['esc']}
        onClick={onClear}
        className="text-foreground rounded-full"
      />
    </div>
  )
}
