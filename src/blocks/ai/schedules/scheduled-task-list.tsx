import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, AlertCircleIcon, CheckmarkCircle02Icon, Clock01Icon, Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon,
  PlayIcon, RepeatIcon, TimeScheduleIcon, WorkHistoryIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconMark } from '@/components/mark'
import { describeRecurrence, formatRunDate, formatUntil, nextRuns } from '@/components/recurrence-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import type { ScheduledTask, TaskRun } from './scheduled-task-dialog'

// A project's scheduled tasks: prompts the assistant runs on its own on a
// recurrence. Each card shows the task's name, the prompt's first line, its
// schedule in words, when it next runs and how its last run went
// (Succeeded, Failed and why, Running, or Never run), with a switch that
// pauses it and a menu: Run now, Edit, View runs, Delete (after a confirm).
// The last run's status opens the run history too. One column when narrow;
// the details sit in a row once its own box is wide enough (@container).
// With no tasks it says what they are and offers New scheduled task.

// The task's most recent run, if it has run.
export const lastRun = (task: Pick<ScheduledTask, 'runs'>): TaskRun | undefined =>
  task.runs.reduce<TaskRun | undefined>((latest, r) => (!latest || r.startedAt > latest.startedAt ? r : latest), undefined)

export function ScheduledTaskList({
  tasks, onToggle, onRunNow, onEdit, onDelete, onOpenRuns, onCreate, now, empty, className,
}: {
  tasks: ScheduledTask[]
  onToggle?: (id: string, on: boolean) => void
  onRunNow?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onOpenRuns?: (id: string) => void
  // New scheduled task: in the empty state, and above the list when given.
  onCreate?: () => void
  // The time "Next run in 2 days" counts from. Defaults to the browser's clock.
  now?: number
  // The empty state's description.
  empty?: ReactNode
  className?: string
}) {
  const at = now ?? Date.now()
  const create = onCreate && (
    <Button size="sm" onClick={onCreate}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
      New scheduled task
    </Button>
  )

  if (tasks.length === 0) {
    return (
      <Empty className={cn('border', className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon"><HugeiconsIcon icon={TimeScheduleIcon} strokeWidth={2} /></EmptyMedia>
          <EmptyTitle>No scheduled tasks</EmptyTitle>
          <EmptyDescription>
            {empty ?? 'A scheduled task runs a prompt for you on a schedule, such as a summary every Monday at 09:00, and posts the result as a new chat here.'}
          </EmptyDescription>
        </EmptyHeader>
        {create && <EmptyContent>{create}</EmptyContent>}
      </Empty>
    )
  }

  const paused = tasks.filter((t) => !t.enabled).length
  return (
    <div className={cn('@container grid min-w-0 gap-2', className)}>
      {create && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {plural(tasks.length, 'scheduled task')}{paused > 0 && `, ${paused} paused`}
          </p>
          {create}
        </div>
      )}
      <ul aria-label="Scheduled tasks" className="grid min-w-0 gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="grid min-w-0">
            <TaskCard
              task={task}
              now={at}
              onToggle={onToggle && ((on) => onToggle(task.id, on))}
              onRunNow={onRunNow && (() => onRunNow(task.id))}
              onEdit={onEdit && (() => onEdit(task.id))}
              onDelete={onDelete && (() => onDelete(task.id))}
              onOpenRuns={onOpenRuns && (() => onOpenRuns(task.id))}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function LastRunStatus({ run, now }: { run?: TaskRun; now: number }) {
  if (!run) return <span className="text-muted-foreground">Never run</span>
  if (run.status === 'running') {
    return (
      <span className="text-status-progress flex min-w-0 items-center gap-1.5">
        <Spinner aria-hidden role={undefined} className="size-3.5" />
        Running…
      </span>
    )
  }
  const when = formatRelativeDate(run.finishedAt ?? run.startedAt, { now, time: true })
  if (run.status === 'failed') {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="text-destructive size-3.5 shrink-0" />
        <span className="text-destructive shrink-0">Failed</span>
        <span className="text-muted-foreground min-w-0 truncate" title={run.error}>{run.error ? `${when}: ${run.error}` : when}</span>
      </span>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="text-status-done size-3.5 shrink-0" />
      <span className="text-status-done shrink-0">Succeeded</span>
      <span className="text-muted-foreground min-w-0 truncate">{when}</span>
    </span>
  )
}

function TaskCard({ task, now, onToggle, onRunNow, onEdit, onDelete, onOpenRuns }: {
  task: ScheduledTask
  now: number
  onToggle?: (on: boolean) => void
  onRunNow?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onOpenRuns?: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const last = lastRun(task)
  const running = last?.status === 'running'
  const next = task.enabled ? nextRuns(task.recurrence, now, 1)[0] : undefined
  const firstLine = task.prompt.split('\n').find((l) => l.trim())?.trim() ?? ''
  const hasMenu = onRunNow || onEdit || onOpenRuns || onDelete

  return (
    <article
      aria-label={task.name}
      data-paused={!task.enabled || undefined}
      className="bg-card flex min-w-0 flex-col gap-2 rounded-lg border p-3"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <IconMark
          icon={TimeScheduleIcon}
          colour="var(--brand)"
          size="md"
          className={cn(!task.enabled && 'opacity-50 grayscale')}
        />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-[13px] font-medium">{task.name}</h3>
            {!task.enabled && <Badge variant="outline" className="text-muted-foreground font-normal">Paused</Badge>}
          </div>
          {firstLine && <p className="text-muted-foreground truncate text-xs">{firstLine}</p>}
        </div>
        <div className="-mt-0.5 -mr-1 flex shrink-0 items-center gap-1">
          {onToggle && (
            <Switch
              size="sm"
              checked={task.enabled}
              onCheckedChange={onToggle}
              aria-label={task.enabled ? `Pause ${task.name}` : `Resume ${task.name}`}
              className="mx-1.5"
            />
          )}
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button ref={menuButton} variant="ghost" size="icon-xs" aria-label={`More actions for ${task.name}`} className="text-muted-foreground">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onRunNow && (
                  <DropdownMenuItem disabled={running} onSelect={onRunNow}>
                    <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />Run now
                  </DropdownMenuItem>
                )}
                {onEdit && <DropdownMenuItem onSelect={onEdit}><HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />Edit</DropdownMenuItem>}
                {onOpenRuns && (
                  <DropdownMenuItem onSelect={onOpenRuns}><HugeiconsIcon icon={WorkHistoryIcon} strokeWidth={2} />View runs</DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <dl className="text-muted-foreground grid min-w-0 grid-cols-1 gap-x-4 gap-y-1 text-[11px] @lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] @lg:pl-[2.375rem]">
        <div className="flex min-w-0 items-center gap-1.5">
          <dt className="sr-only">Schedule</dt>
          <HugeiconsIcon icon={RepeatIcon} strokeWidth={2} className="size-3.5 shrink-0" />
          <dd className="min-w-0 truncate" title={describeRecurrence(task.recurrence)}>{describeRecurrence(task.recurrence)}</dd>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <dt className="sr-only">Next run</dt>
          <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
          <dd className="min-w-0 truncate">
            {!task.enabled
              ? 'Paused: no runs until resumed'
              : next !== undefined
                ? <>Next run {formatUntil(next, now)} <span aria-hidden>·</span> <span className="text-foreground tabular-nums">{formatRunDate(next, now)}</span></>
                : 'No runs coming up'}
          </dd>
        </div>
        <div className="flex min-w-0 items-center">
          <dt className="sr-only">Last run</dt>
          <dd className="min-w-0">
            {onOpenRuns && last ? (
              <button
                type="button"
                onClick={onOpenRuns}
                aria-label={`Last run: ${last.status}. View runs of ${task.name}`}
                className="hover:bg-accent focus-visible:ring-ring/40 -mx-1 flex max-w-full min-w-0 rounded px-1 outline-none focus-visible:ring-2"
              >
                <LastRunStatus run={last} now={now} />
              </button>
            ) : (
              <LastRunStatus run={last} now={now} />
            )}
          </dd>
        </div>
      </dl>

      {onDelete && (
        <DeleteConfirm
          open={confirming}
          onOpenChange={setConfirming}
          returnFocusRef={menuButton}
          title={`Delete “${task.name}”?`}
          description="It stops running. The chats its runs posted stay in the project."
          onConfirm={onDelete}
          size="sm"
        />
      )}
    </article>
  )
}
