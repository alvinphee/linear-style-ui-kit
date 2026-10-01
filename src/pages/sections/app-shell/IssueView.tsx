import { useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowDown01Icon, ArrowRight01Icon, Camera01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { KanbanBoard, type KanbanCardState } from '@/blocks/kanban-board'
import { Button } from '@/components/ui/button'
import { LABELS, type Job } from '../../data'
import { useJobs } from '../../jobs-store'
import { NoAssignee } from '../FilterBar'
import { JobContextMenu, JobDropdownMenu } from '../JobActions'
import { UserAvatar } from '@/components/person'
import { PriorityIcon, StatusIcon } from '../StatusSection'
import type { Group, ListDisplay } from './display'

type Openers = {
  selectedId: string | null
  onOpen: (id: string) => void
  onOpenFull: (id: string) => void
}

const LABEL_BY_ID = Object.fromEntries(LABELS.map((l) => [l.id, l]))

function onActivate(open: () => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }
}

function Labels({ job, max = 2 }: { job: Job; max?: number }) {
  return (
    <>
      {job.labels.slice(0, max).map((id) => {
        const label = LABEL_BY_ID[id]
        return label && (
          <span key={id} className="text-muted-foreground flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px] whitespace-nowrap">
            <span className="size-1.5 rounded-full" style={{ background: label.colour }} />
            {label.name}
          </span>
        )
      })}
    </>
  )
}

// List: one header per group (fold it with the chevron), then dense rows.
// Click a row for the side panel, right-click or … for actions.
export function IssueList({ groups, display, onAdd, ...openers }: Openers & {
  groups: Group[]
  display: ListDisplay
  onAdd: (group: Group) => void
}) {
  const [folded, setFolded] = useState<Set<string>>(() => new Set())
  const grouped = display.grouping !== 'none'

  return (
    <div>
      {groups.map((group) => {
        const open = !folded.has(group.key)
        return (
          <section key={group.key} aria-label={grouped ? `${group.label}, ${group.jobs.length}` : undefined}>
            {grouped && (
              <div className="bg-subtle sticky top-0 z-[1] flex h-8 items-center gap-2 border-b pr-2 pl-3 text-xs @lg:pl-5">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setFolded((f) => {
                    const next = new Set(f)
                    if (open) next.add(group.key)
                    else next.delete(group.key)
                    return next
                  })}
                  className="focus-visible:ring-ring/40 -ml-1 flex min-w-0 items-center gap-2 rounded px-1 py-0.5 outline-none focus-visible:ring-2"
                >
                  <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />
                  <span className="flex shrink-0">{group.visual}</span>
                  <span className="truncate font-medium">{group.label}</span>
                  <span className="text-muted-foreground tabular-nums">{group.jobs.length}</span>
                </button>
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground ml-auto" aria-label={`New issue in ${group.label}`} onClick={() => onAdd(group)}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                </Button>
              </div>
            )}
            {open && (group.jobs.length ? (
              <ul>
                {group.jobs.map((job) => <IssueRow key={job.id} job={job} display={display} {...openers} />)}
              </ul>
            ) : (
              <p className="text-muted-foreground border-b px-3 py-2 text-[11px] @lg:px-5">No issues</p>
            ))}
          </section>
        )
      })}
    </div>
  )
}

function IssueRow({ job, display, selectedId, onOpen, onOpenFull }: Openers & { job: Job; display: ListDisplay }) {
  const p = display.properties
  const open = () => onOpen(job.id)
  const openFull = () => onOpenFull(job.id)
  return (
    <li>
      <JobContextMenu job={job} onOpen={open} onOpenFull={openFull}>
        <div
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={onActivate(open)}
          data-selected={selectedId === job.id}
          aria-label={`${job.id} ${job.title}`}
          className="hover:bg-accent/50 data-[selected=true]:bg-accent focus-visible:bg-accent group/row flex h-9 cursor-default items-center gap-2.5 border-b pr-2 pl-3 text-xs outline-none select-none @lg:pl-5"
        >
          {p.priority && <PriorityIcon priority={job.priority} />}
          {p.id && <span className="text-muted-foreground hidden w-[4.5rem] shrink-0 whitespace-nowrap tabular-nums @md:inline">{job.id}</span>}
          {p.status && <StatusIcon status={job.status} />}
          <span className="min-w-0 flex-1 truncate">{job.title}</span>
          {p.labels && <span className="hidden items-center gap-1 @3xl:flex"><Labels job={job} /></span>}
          {p.customer && job.customer && (
            <span className="text-muted-foreground hidden rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap @4xl:inline">{job.customer}</span>
          )}
          {p.photos && job.photos > 0 && (
            <span className="text-muted-foreground hidden items-center gap-1 @3xl:flex">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5" />
              <span className="tabular-nums">{job.photos}</span>
            </span>
          )}
          {p.due && <span className="text-muted-foreground hidden w-16 shrink-0 text-right text-[11px] @lg:inline">{job.due}</span>}
          {p.assignee && (job.driver ? <UserAvatar name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />)}
          <JobDropdownMenu job={job} onOpen={open} onOpenFull={openFull} />
        </div>
      </JobContextMenu>
    </li>
  )
}

// Board: a column per group, from the shared Kanban block. Drag a card to
// another column to change the field the board is grouped by.
export function IssueBoard({ groups, display, onAdd, ...openers }: Openers & {
  groups: Group[]
  display: ListDisplay
  onAdd: (group: Group) => void
}) {
  const { updateJob } = useJobs()
  const groupOf = new Map(groups.flatMap((g) => g.jobs.map((j) => [j.id, g.key] as const)))
  const byKey = (key: string) => groups.find((g) => g.key === key)!

  return (
    <KanbanBoard
      variant="compact"
      className="h-full"
      columns={groups.map((g) => ({ id: g.key, title: g.label, visual: g.visual }))}
      items={groups.flatMap((g) => g.jobs)}
      columnOf={(job) => groupOf.get(job.id)!}
      onMove={(id, key) => {
        const group = byKey(key)
        updateJob(id, group.patch)
        toast(`${id} moved to ${group.label}`)
      }}
      onAdd={(column) => onAdd(byKey(column.id))}
      addLabel={(column) => `New issue in ${column.title}`}
      itemName={{ one: 'issue', other: 'issues' }}
      emptyLabel="Drop issues here"
      dropLabel="Drop issues here"
      renderCard={(job, card) => <IssueCard job={job} display={display} card={card} {...openers} />}
    />
  )
}

function IssueCard({ job, display, card, selectedId, onOpen, onOpenFull }: Openers & {
  job: Job
  display: ListDisplay
  card: KanbanCardState
}) {
  const p = display.properties
  const open = () => onOpen(job.id)
  const openFull = () => onOpenFull(job.id)
  return (
    <JobContextMenu job={job} onOpen={open} onOpenFull={openFull}>
      <div
        role="button"
        tabIndex={0}
        {...card.cardProps}
        onClick={open}
        onKeyDown={onActivate(open)}
        data-selected={selectedId === job.id}
        aria-label={`${job.id} ${job.title}`}
        className={cn(
          'bg-card hover:border-foreground/15 data-[selected=true]:border-primary/50 focus-visible:ring-ring/40 group/card grid cursor-grab gap-1.5 rounded-md border p-2 text-xs outline-none select-none focus-visible:ring-2 active:cursor-grabbing',
          card.dragging && 'opacity-40',
        )}
      >
        <div className="text-muted-foreground flex h-5 items-center gap-1.5 text-[11px] tabular-nums">
          {p.id && job.id}
          <span className="ml-auto flex items-center gap-1">
            <JobDropdownMenu job={job} onOpen={open} onOpenFull={openFull} />
            {p.assignee && (job.driver ? <UserAvatar name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />)}
          </span>
        </div>
        <span className="line-clamp-2 font-medium">{job.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {p.priority && <PriorityIcon priority={job.priority} />}
          {/* The column already says the status (a board without grouping uses status columns). */}
          {p.status && display.grouping !== 'status' && display.grouping !== 'none' && <StatusIcon status={job.status} />}
          {p.labels && <Labels job={job} max={3} />}
          {p.customer && job.customer && <span className="text-muted-foreground truncate text-[11px]">{job.customer}</span>}
          {p.photos && job.photos > 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3" />
              <span className="tabular-nums">{job.photos}</span>
            </span>
          )}
          {p.due && job.due && <span className="text-muted-foreground ml-auto text-[11px]">{job.due}</span>}
        </div>
      </div>
    </JobContextMenu>
  )
}
