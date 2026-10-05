import { useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon, Camera01Icon, Copy01Icon, Delete02Icon, MoreHorizontalIcon, SquareArrowExpand01Icon, UserIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { GroupedListRow, type GroupedListRowState } from '@/blocks/grouped-list'
import { RecordSheet, RecordSheetContent } from '@/blocks/record-sheet'
import { LabelChip } from '@/components/label-dot'
import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ContextMenu, ContextMenuContent, ContextMenuLabel, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { copyText } from '@/lib/clipboard'
import { LABEL_BY_ID, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import {
  ASSIGNEE_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeValue, driverOf, type JobOption, type JobProperty,
} from '../job-options'
import { useJobs } from '../jobs-store'
import { goTo } from '../nav'

// One set of job actions, one side panel and one row, shared by the job
// list, the board and the app shells: right-click, the … button and the peek
// all offer the same things.

export type JobOpeners = {
  // Opens the side panel.
  onOpen: () => void
  // Jumps to the full issue page.
  onOpenFull: () => void
}

const copyId = (id: string) => copyText(id, { success: `Copied ${id}` })

function useJobCommands(job: Job) {
  const { jobs, updateJob, removeJobs } = useJobs()
  return {
    setStatus: (status: Status) => {
      if (status === job.status) return
      updateJob(job.id, { status })
      toast(`Moved ${job.id} to ${STATUS[status].label}`)
    },
    setPriority: (priority: Priority) => updateJob(job.id, { priority }),
    setAssignee: (driver: string) => updateJob(job.id, { driver }),
    remove: () => {
      if (jobs.length <= 1) {
        toast.error('Keep at least one job', { description: 'The demo needs something to show.' })
        return false
      }
      removeJobs([job.id])
      toast(`Deleted ${job.id}`)
      return true
    },
  }
}

// A radio item per option, for a status, priority or Assign menu.
function OptionItems({ kit: K, options }: { kit: MenuKit; options: JobOption[] }) {
  return options.map((o) => (
    <K.RadioItem key={o.value} value={o.value}>
      {o.visual} {o.label}
    </K.RadioItem>
  ))
}

function JobMenuItems({ job, kit: K, onOpen, onOpenFull }: { job: Job; kit: MenuKit } & JobOpeners) {
  const commands = useJobCommands(job)
  return (
    <>
      <K.Item onSelect={onOpen}>
        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} /> Open
        <K.Shortcut>↵</K.Shortcut>
      </K.Item>
      <K.Item onSelect={onOpenFull}>
        <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} /> Open full page
      </K.Item>
      <K.Separator />
      <K.Sub>
        <K.SubTrigger>
          <StatusIcon status={job.status} /> Status
        </K.SubTrigger>
        <K.SubContent className="w-44">
          <K.RadioGroup value={job.status} onValueChange={(v: string) => commands.setStatus(v as Status)}>
            <OptionItems kit={K} options={STATUS_OPTIONS} />
          </K.RadioGroup>
        </K.SubContent>
      </K.Sub>
      <K.Sub>
        <K.SubTrigger>
          <PriorityIcon priority={job.priority} /> Priority
        </K.SubTrigger>
        <K.SubContent className="w-44">
          <K.RadioGroup value={job.priority} onValueChange={(v: string) => commands.setPriority(v as Priority)}>
            <OptionItems kit={K} options={PRIORITY_OPTIONS} />
          </K.RadioGroup>
        </K.SubContent>
      </K.Sub>
      <K.Sub>
        <K.SubTrigger>
          <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Assign
        </K.SubTrigger>
        <K.SubContent className="w-44">
          <K.RadioGroup value={assigneeValue(job.driver)} onValueChange={(v: string) => commands.setAssignee(driverOf(v))}>
            <OptionItems kit={K} options={ASSIGNEE_OPTIONS} />
          </K.RadioGroup>
        </K.SubContent>
      </K.Sub>
      <K.Separator />
      <K.Item onSelect={() => copyId(job.id)}>
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copy ID
      </K.Item>
      <K.Item variant="destructive" onSelect={commands.remove}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
      </K.Item>
    </>
  )
}

// Right-click menu around a row or card. Also opens with the keyboard's menu key or Shift+F10.
export function JobContextMenu({ job, children, onOpen, onOpenFull }: { job: Job; children: ReactNode } & JobOpeners) {
  const leaving = useRef(false)
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className="w-52"
        onCloseAutoFocus={(e) => {
          // Returning focus to the row would scroll the page back after "Open full page".
          if (leaving.current) e.preventDefault()
          leaving.current = false
        }}
      >
        <ContextMenuLabel className="truncate">{job.id} · {job.title}</ContextMenuLabel>
        <JobMenuItems
          job={job}
          kit={CONTEXT_MENU_KIT}
          onOpen={onOpen}
          onOpenFull={() => {
            leaving.current = true
            onOpenFull()
          }}
        />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// The … button. Hidden until hover or focus on mouse devices, always shown on touch screens.
export function JobDropdownMenu({ job, onOpen, onOpenFull, className }: { job: Job; className?: string } & JobOpeners) {
  const leaving = useRef(false)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${job.id}`}
          // The row or card behind it opens the peek on click; the menu shouldn't.
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'pointer-fine:opacity-0 group-hover/row:opacity-100 group-hover/card:opacity-100 group-focus-within/row:opacity-100 group-focus-within/card:opacity-100 data-[state=open]:opacity-100',
            className,
          )}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onCloseAutoFocus={(e) => {
          if (leaving.current) e.preventDefault()
          leaving.current = false
        }}
      >
        <DropdownMenuLabel className="truncate">{job.id}</DropdownMenuLabel>
        <JobMenuItems
          job={job}
          kit={DROPDOWN_MENU_KIT}
          onOpen={onOpen}
          onOpenFull={() => {
            leaving.current = true
            onOpenFull()
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// One job as a row of a GroupedList (pass it the row state from renderRow),
// with the right-click menu around it and the … button at the end.
// `properties` picks the cells; the wider ones appear as the list's
// container grows, so the list needs a @container around it.
export function JobRow({ job, row, properties, active, onOpen, onOpenFull }: {
  job: Job
  row: GroupedListRowState
  properties: Partial<Record<JobProperty, boolean>>
  // The job open in the side panel.
  active?: boolean
} & JobOpeners) {
  const p = properties
  const labels = p.labels ? job.labels.slice(0, 2).map((id) => LABEL_BY_ID[id]).filter(Boolean) : []
  return (
    <JobContextMenu job={job} onOpen={onOpen} onOpenFull={onOpenFull}>
      <GroupedListRow row={row} onOpen={onOpen} active={active} aria-label={`${job.id} ${job.title}`}>
        {p.priority && <PriorityIcon priority={job.priority} />}
        {p.id && (
          <span className="text-muted-foreground hidden w-[4.75rem] shrink-0 whitespace-nowrap tabular-nums @md:inline">{job.id}</span>
        )}
        {p.status && <StatusIcon status={job.status} />}
        <span className="min-w-0 flex-1 truncate font-medium">{job.title}</span>
        {labels.length > 0 && (
          <span className="hidden items-center gap-1 @3xl:flex">
            {labels.map((l) => <LabelChip key={l.id} name={l.name} colour={l.colour} />)}
          </span>
        )}
        {p.customer && job.customer && (
          <span className="text-muted-foreground hidden rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap @4xl:inline">
            {job.customer}
          </span>
        )}
        {p.photos && job.photos > 0 && (
          <span className="text-muted-foreground hidden items-center gap-1 @3xl:flex">
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5" />
            <span className="tabular-nums">{job.photos}</span>
          </span>
        )}
        {p.due && <span className="text-muted-foreground hidden w-16 shrink-0 text-right text-[11px] @lg:inline">{job.due}</span>}
        {p.assignee && (job.driver ? <UserAvatar name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />)}
        <JobDropdownMenu job={job} onOpen={onOpen} onOpenFull={onOpenFull} />
      </GroupedListRow>
    </JobContextMenu>
  )
}

// Selects the job and scrolls to the full issue page. The delay lets an open
// side panel release its scroll lock first.
export function openFullPage(select: (id: string) => void, id: string) {
  select(id)
  setTimeout(() => goTo('issue'), 250)
}

// Linear's "peek": the job in a side panel, edited in place, without leaving the list or board.
export function JobPeek({ jobId, order, onNavigate, onClose }: {
  jobId: string | null
  // Job ids in the order the list or board shows them, for previous / next.
  order: string[]
  onNavigate: (id: string) => void
  onClose: () => void
}) {
  const { jobs, select } = useJobs()
  const job = jobId ? jobs.find((j) => j.id === jobId) : undefined
  const leaving = useRef(false)

  return (
    <RecordSheet
      open={!!job}
      onOpenChange={(open) => !open && onClose()}
      onCloseAutoFocus={(e) => {
        if (leaving.current) e.preventDefault()
        leaving.current = false
      }}
    >
      {job && (
        <JobPeekBody
          job={job}
          order={order}
          onNavigate={onNavigate}
          onOpenFull={() => {
            leaving.current = true
            onClose()
            openFullPage(select, job.id)
          }}
        />
      )}
    </RecordSheet>
  )
}

function JobPeekBody({ job, order, onNavigate, onOpenFull }: {
  job: Job
  order: string[]
  onNavigate: (id: string) => void
  onOpenFull: () => void
}) {
  const { activity, updateJob, toggleSubtask } = useJobs()
  const commands = useJobCommands(job)
  const index = order.indexOf(job.id)
  const prev = index > 0 ? order[index - 1] : undefined
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined
  const done = job.subtasks.filter((s) => s.done).length
  const recent = activity.filter((a) => a.jobId === job.id).slice(-4).reverse()
  const labels = job.labels.map((id) => LABEL_BY_ID[id]).filter(Boolean)

  return (
    <RecordSheetContent
      number={job.id}
      title={job.title}
      onTitleChange={(title) => updateJob(job.id, { title })}
      description="Job details. Changes save as you make them."
      noun="job"
      navigation={{
        index,
        total: order.length,
        onPrevious: prev ? () => onNavigate(prev) : undefined,
        onNext: next ? () => onNavigate(next) : undefined,
      }}
      properties={
        <>
          <PropertyMenu label="Status" trigger={<><StatusIcon status={job.status} /> {STATUS[job.status].label}</>}>
            <DropdownMenuRadioGroup value={job.status} onValueChange={(v) => commands.setStatus(v as Status)}>
              <OptionItems kit={DROPDOWN_MENU_KIT} options={STATUS_OPTIONS} />
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          <PropertyMenu label="Priority" trigger={<><PriorityIcon priority={job.priority} /> {PRIORITY[job.priority].label}</>}>
            <DropdownMenuRadioGroup value={job.priority} onValueChange={(v) => commands.setPriority(v as Priority)}>
              <OptionItems kit={DROPDOWN_MENU_KIT} options={PRIORITY_OPTIONS} />
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          <PropertyMenu
            label="Assignee"
            trigger={job.driver
              ? <><UserAvatar name={job.driver} className="size-4" /> {job.driver}</>
              : <><NoAssignee /> Assign</>}
          >
            <DropdownMenuRadioGroup value={assigneeValue(job.driver)} onValueChange={(v) => commands.setAssignee(driverOf(v))}>
              <OptionItems kit={DROPDOWN_MENU_KIT} options={ASSIGNEE_OPTIONS} />
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          {job.due && (
            <span className="text-muted-foreground inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" /> {job.due}
            </span>
          )}
          {labels.map((l) => <LabelChip key={l.id} name={l.name} colour={l.colour} size="md" />)}
        </>
      }
      activityTitle="Latest activity"
      activity={recent.map((a) => ({
        id: a.id,
        actor: a.actor,
        text: a.kind === 'comment' ? `commented: “${a.text}”` : a.text,
        at: a.at,
      }))}
      footer={
        <>
          <Button size="sm" onClick={onOpenFull}>
            <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} data-icon="inline-start" />
            Open full page
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyId(job.id)}>
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
            Copy ID
          </Button>
        </>
      }
      onDelete={commands.remove}
      deleteTitle={`Delete ${job.id}?`}
      deleteDescription={`“${job.title}” and its activity go with it.`}
    >
      <p className={cn('leading-relaxed', !job.description && 'text-muted-foreground italic')}>
        {job.description || 'No description yet.'}
      </p>

      {job.subtasks.length > 0 && (
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Sub-tasks</span>
            <span className="text-muted-foreground tabular-nums">{done}/{job.subtasks.length}</span>
            <span className="bg-muted relative h-1 w-16 overflow-hidden rounded-full">
              <span className="bg-brand absolute inset-y-0 left-0" style={{ width: `${(done / job.subtasks.length) * 100}%` }} />
            </span>
          </div>
          <ul className="grid gap-1">
            {job.subtasks.map((s) => (
              <li key={s.id}>
                <label className="hover:bg-accent/60 flex h-7 cursor-pointer items-center gap-2 rounded-md px-1.5">
                  <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(job.id, s.id)} />
                  <span className={cn(s.done && 'text-muted-foreground line-through')}>{s.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </RecordSheetContent>
  )
}

function PropertyMenu({ label, trigger, children }: { label: string; trigger: ReactNode; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={label} className="h-6 gap-1.5 px-2 font-normal">
          {trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
