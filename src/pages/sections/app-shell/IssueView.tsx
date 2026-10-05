import { HugeiconsIcon } from '@hugeicons/react'
import { Camera01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { GroupedList } from '@/blocks/grouped-list'
import { KanbanBoard, KanbanCard, type KanbanCardState } from '@/blocks/kanban-board'
import { LabelChip } from '@/components/label-dot'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { LABEL_BY_ID, type Job } from '../../data'
import { useJobs } from '../../jobs-store'
import { JobContextMenu, JobDropdownMenu, JobRow } from '../JobActions'
import type { Group, ListDisplay } from './display'

type Openers = {
  selectedId: string | null
  onOpen: (id: string) => void
  onOpenFull: (id: string) => void
}

// List: one header per group (fold it with the chevron), then dense rows,
// from the shared GroupedList block and job row. Click a row for the side
// panel, right-click or … for actions.
export function IssueList({ groups, display, onAdd, selectedId, onOpen, onOpenFull }: Openers & {
  groups: Group[]
  display: ListDisplay
  onAdd: (group: Group) => void
}) {
  return (
    <GroupedList
      groups={groups.map((g) => ({ ...g, id: g.key, title: g.label, items: g.jobs }))}
      headers={display.grouping !== 'none'}
      stickyHeaders
      inset="pr-2 pl-3 @lg:pl-5"
      onAdd={onAdd}
      addLabel={(group) => `New issue in ${group.title}`}
      itemName={{ one: 'issue', other: 'issues' }}
      renderRow={(job, row) => (
        <JobRow
          job={job}
          row={row}
          properties={display.properties}
          active={selectedId === job.id}
          onOpen={() => onOpen(job.id)}
          onOpenFull={() => onOpenFull(job.id)}
        />
      )}
    />
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
  const labels = p.labels ? job.labels.slice(0, 3).map((id) => LABEL_BY_ID[id]).filter(Boolean) : []
  return (
    <JobContextMenu job={job} onOpen={open} onOpenFull={openFull}>
      <KanbanCard
        card={card}
        onOpen={open}
        selected={selectedId === job.id}
        aria-label={`${job.id} ${job.title}`}
        // The menu sits beside the card, left of the assignee in its top row.
        menu={<JobDropdownMenu job={job} onOpen={open} onOpenFull={openFull} />}
        menuClassName={p.assignee ? 'right-8' : undefined}
      >
        <div className="text-muted-foreground flex h-5 items-center gap-1.5 text-[11px] tabular-nums">
          {p.id && job.id}
          {p.assignee && (
            <span className="ml-auto flex items-center">
              {job.driver ? <UserAvatar name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />}
            </span>
          )}
        </div>
        <span className="line-clamp-2 font-medium">{job.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {p.priority && <PriorityIcon priority={job.priority} />}
          {/* The column already says the status (a board without grouping uses status columns). */}
          {p.status && display.grouping !== 'status' && display.grouping !== 'none' && <StatusIcon status={job.status} />}
          {labels.map((l) => <LabelChip key={l.id} name={l.name} colour={l.colour} />)}
          {p.customer && job.customer && <span className="text-muted-foreground truncate text-[11px]">{job.customer}</span>}
          {p.photos && job.photos > 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3" />
              <span className="tabular-nums">{job.photos}</span>
            </span>
          )}
          {p.due && job.due && <span className="text-muted-foreground ml-auto text-[11px]">{job.due}</span>}
        </div>
      </KanbanCard>
    </JobContextMenu>
  )
}
