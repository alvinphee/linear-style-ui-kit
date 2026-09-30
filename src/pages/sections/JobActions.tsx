import { useRef, useState, type ComponentType, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon, ArrowUp01Icon, Calendar03Icon, Copy01Icon, Delete02Icon, MoreHorizontalIcon,
  SquareArrowExpand01Icon, UserIcon, ViewIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem,
  ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { goTo } from '../nav'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

// One set of job actions and one side panel, shared by the job list and the
// board: right-click, the … button and the peek all offer the same things.

const STATUS_ORDER: Status[] = ['backlog', 'todo', 'progress', 'done', 'cancelled']
const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']
const NO_ASSIGNEE = '__none__'

// The dropdown and context menu kits have identical props, so one list of
// items renders into either. Typed loosely because the two component sets
// are structurally the same but nominally different.
type Kit = Record<'Item' | 'Separator' | 'Shortcut' | 'Sub' | 'SubTrigger' | 'SubContent' | 'RadioGroup' | 'RadioItem', ComponentType<any>>

const DROPDOWN: Kit = {
  Item: DropdownMenuItem, Separator: DropdownMenuSeparator, Shortcut: DropdownMenuShortcut, Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger, SubContent: DropdownMenuSubContent, RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
}
const CONTEXT: Kit = {
  Item: ContextMenuItem, Separator: ContextMenuSeparator, Shortcut: ContextMenuShortcut, Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger, SubContent: ContextMenuSubContent, RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
}

export type JobOpeners = {
  // Opens the side panel.
  onOpen: () => void
  // Jumps to the full issue page.
  onOpenFull: () => void
}

function copyId(id: string) {
  if (!navigator.clipboard) {
    toast.error('Clipboard not available')
    return
  }
  navigator.clipboard.writeText(id).then(
    () => toast.success(`Copied ${id}`),
    () => toast.error('Could not copy the ID'),
  )
}

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

function JobMenuItems({ job, kit, onOpen, onOpenFull }: { job: Job; kit: Kit } & JobOpeners) {
  const { Item, Separator, Shortcut, Sub, SubTrigger, SubContent, RadioGroup, RadioItem } = kit
  const commands = useJobCommands(job)
  return (
    <>
      <Item onSelect={onOpen}>
        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} /> Open
        <Shortcut>↵</Shortcut>
      </Item>
      <Item onSelect={onOpenFull}>
        <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} /> Open full page
      </Item>
      <Separator />
      <Sub>
        <SubTrigger>
          <StatusIcon status={job.status} /> Status
        </SubTrigger>
        <SubContent className="w-44">
          <RadioGroup value={job.status} onValueChange={(v: string) => commands.setStatus(v as Status)}>
            {STATUS_ORDER.map((s) => (
              <RadioItem key={s} value={s}>
                <StatusIcon status={s} /> {STATUS[s].label}
              </RadioItem>
            ))}
          </RadioGroup>
        </SubContent>
      </Sub>
      <Sub>
        <SubTrigger>
          <PriorityIcon priority={job.priority} /> Priority
        </SubTrigger>
        <SubContent className="w-44">
          <RadioGroup value={job.priority} onValueChange={(v: string) => commands.setPriority(v as Priority)}>
            {PRIORITY_ORDER.map((p) => (
              <RadioItem key={p} value={p}>
                <PriorityIcon priority={p} /> {PRIORITY[p].label}
              </RadioItem>
            ))}
          </RadioGroup>
        </SubContent>
      </Sub>
      <Sub>
        <SubTrigger>
          <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Assign
        </SubTrigger>
        <SubContent className="w-44">
          <RadioGroup
            value={job.driver || NO_ASSIGNEE}
            onValueChange={(v: string) => commands.setAssignee(v === NO_ASSIGNEE ? '' : v)}
          >
            <RadioItem value={NO_ASSIGNEE}>
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> No assignee
            </RadioItem>
            {PEOPLE.map((name) => (
              <RadioItem key={name} value={name}>
                <Initials name={name} className="size-4" /> {name}
              </RadioItem>
            ))}
          </RadioGroup>
        </SubContent>
      </Sub>
      <Separator />
      <Item onSelect={() => copyId(job.id)}>
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copy ID
      </Item>
      <Item variant="destructive" onSelect={commands.remove}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
      </Item>
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
          kit={CONTEXT}
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
          kit={DROPDOWN}
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

// Selects the job and scrolls to the full issue page. The delay lets an open
// side panel release its scroll lock first.
export function openFullPage(select: (id: string) => void, id: string) {
  select(id)
  setTimeout(() => goTo('issue'), 250)
}

const LABEL_BY_ID = Object.fromEntries(LABELS.map((l) => [l.id, l]))

// Linear's "peek": the job in a side panel, edited in place, without leaving the list or board.
export function JobPeek({ jobId, order, onNavigate, onClose }: {
  jobId: string | null
  // Job ids in the order the list or board shows them, for previous / next.
  order: string[]
  onNavigate: (id: string) => void
  onClose: () => void
}) {
  const { jobs, activity, select, updateJob, toggleSubtask } = useJobs()
  const job = jobId ? jobs.find((j) => j.id === jobId) : undefined
  const [confirming, setConfirming] = useState(false)
  const leaving = useRef(false)
  const index = job ? order.indexOf(job.id) : -1
  const prev = index > 0 ? order[index - 1] : undefined
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : undefined
  const done = job ? job.subtasks.filter((s) => s.done).length : 0
  const recent = job ? activity.filter((a) => a.jobId === job.id).slice(-4).reverse() : []

  return (
    <Sheet open={!!job} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-md"
        onCloseAutoFocus={(e) => {
          if (leaving.current) e.preventDefault()
          leaving.current = false
        }}
      >
        {job && (
          <JobPeekBody
            job={job}
            index={index}
            total={order.length}
            prev={prev}
            next={next}
            done={done}
            recent={recent}
            onNavigate={onNavigate}
            onTitle={(title) => updateJob(job.id, { title })}
            onToggleSubtask={(id) => toggleSubtask(job.id, id)}
            onOpenFull={() => {
              leaving.current = true
              onClose()
              openFullPage(select, job.id)
            }}
            onDelete={() => setConfirming(true)}
          />
        )}
      </SheetContent>
      {job && (
        <DeleteConfirm
          job={job}
          open={confirming}
          onOpenChange={setConfirming}
          onDeleted={onClose}
        />
      )}
    </Sheet>
  )
}

function JobPeekBody({ job, index, total, prev, next, done, recent, onNavigate, onTitle, onToggleSubtask, onOpenFull, onDelete }: {
  job: Job
  index: number
  total: number
  prev?: string
  next?: string
  done: number
  recent: ReturnType<typeof useJobs>['activity']
  onNavigate: (id: string) => void
  onTitle: (title: string) => void
  onToggleSubtask: (id: string) => void
  onOpenFull: () => void
  onDelete: () => void
}) {
  const commands = useJobCommands(job)
  const labels = job.labels.map((id) => LABEL_BY_ID[id]).filter(Boolean)

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-12">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs tabular-nums">{job.id}</span>
          {index >= 0 && (
            <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
              {index + 1} / {total}
            </span>
          )}
          <Button variant="ghost" size="icon-xs" className={index < 0 ? 'ml-auto' : undefined} aria-label="Previous job" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
            <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Next job" disabled={!next} onClick={() => next && onNavigate(next)}>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
          </Button>
        </div>
        <SheetTitle className="sr-only">{job.title}</SheetTitle>
        <SheetDescription className="sr-only">Job details. Changes save as you make them.</SheetDescription>
        <input
          value={job.title}
          onChange={(e) => onTitle(e.target.value)}
          aria-label="Title"
          className="w-full bg-transparent text-base font-semibold outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          <PropertyMenu label="Status" trigger={<><StatusIcon status={job.status} /> {STATUS[job.status].label}</>}>
            <DropdownMenuRadioGroup value={job.status} onValueChange={(v) => commands.setStatus(v as Status)}>
              {STATUS_ORDER.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  <StatusIcon status={s} /> {STATUS[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          <PropertyMenu label="Priority" trigger={<><PriorityIcon priority={job.priority} /> {PRIORITY[job.priority].label}</>}>
            <DropdownMenuRadioGroup value={job.priority} onValueChange={(v) => commands.setPriority(v as Priority)}>
              {PRIORITY_ORDER.map((p) => (
                <DropdownMenuRadioItem key={p} value={p}>
                  <PriorityIcon priority={p} /> {PRIORITY[p].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          <PropertyMenu
            label="Assignee"
            trigger={job.driver
              ? <><Initials name={job.driver} className="size-4" /> {job.driver}</>
              : <><HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Assign</>}
          >
            <DropdownMenuRadioGroup
              value={job.driver || NO_ASSIGNEE}
              onValueChange={(v) => commands.setAssignee(v === NO_ASSIGNEE ? '' : v)}
            >
              <DropdownMenuRadioItem value={NO_ASSIGNEE}>
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> No assignee
              </DropdownMenuRadioItem>
              {PEOPLE.map((name) => (
                <DropdownMenuRadioItem key={name} value={name}>
                  <Initials name={name} className="size-4" /> {name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </PropertyMenu>
          {job.due && (
            <span className="text-muted-foreground inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" /> {job.due}
            </span>
          )}
          {labels.map((l) => (
            <span key={l.id} className="text-muted-foreground inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px]">
              <span className="size-1.5 rounded-full" style={{ background: l.colour }} /> {l.name}
            </span>
          ))}
        </div>
      </SheetHeader>

      <div className="grid flex-1 content-start gap-5 overflow-y-auto p-4 text-xs">
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
                    <Checkbox checked={s.done} onCheckedChange={() => onToggleSubtask(s.id)} />
                    <span className={cn(s.done && 'text-muted-foreground line-through')}>{s.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recent.length > 0 && (
          <div className="grid gap-2">
            <span className="font-medium">Latest activity</span>
            <ul className="grid gap-2">
              {recent.map((a) => (
                <li key={a.id} className="text-muted-foreground flex gap-2">
                  <Initials name={a.actor} className="size-4 shrink-0" />
                  <span className="min-w-0">
                    <b className="text-foreground font-medium">{a.actor}</b>{' '}
                    {a.kind === 'comment' ? `commented: “${a.text}”` : a.text} · {a.at}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <SheetFooter className="flex-row flex-wrap border-t">
        <Button size="sm" onClick={onOpenFull}>
          <HugeiconsIcon icon={SquareArrowExpand01Icon} strokeWidth={2} data-icon="inline-start" />
          Open full page
        </Button>
        <Button variant="outline" size="sm" onClick={() => copyId(job.id)}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
          Copy ID
        </Button>
        <Button variant="destructive" size="sm" className="ml-auto" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
          Delete
        </Button>
      </SheetFooter>
    </>
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

function DeleteConfirm({ job, open, onOpenChange, onDeleted }: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const commands = useJobCommands(job)
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {job.id}?</AlertDialogTitle>
          <AlertDialogDescription>“{job.title}” and its activity go with it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (commands.remove()) onDeleted()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
