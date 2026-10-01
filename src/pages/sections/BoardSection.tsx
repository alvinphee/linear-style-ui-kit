import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, Camera01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { KanbanBoard, type KanbanCardState } from '@/blocks/kanban-board'
import { LABELS, STATUS, type Job, type Status } from '../data'
import { useJobs } from '../jobs-store'
import {
  DEFAULT_DISPLAY, FilterBar, LabelDot, NoAssignee, applyFilters, sortJobs, type DisplayOptions,
  type Filters,
} from './FilterBar'
import { Section } from './shared'
import { JobContextMenu, JobDropdownMenu, JobPeek, openFullPage } from './JobActions'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

const COLUMNS: Status[] = ['backlog', 'todo', 'progress', 'done']
const ALL_STATUSES: Status[] = [...COLUMNS, 'cancelled']
const LABEL_BY_ID = Object.fromEntries(LABELS.map((l) => [l.id, l]))

export default function BoardSection() {
  const { jobs, selectedId, select, updateJob, addJob } = useJobs()
  const [filters, setFilters] = useState<Filters>({})
  const [search, setSearch] = useState('')
  const [display, setDisplay] = useState<DisplayOptions>(DEFAULT_DISPLAY)
  const [hidden, setHidden] = useState<Status[]>([])
  const [peekId, setPeekId] = useState<string | null>(null)

  const statuses = display.showCancelled ? ALL_STATUSES : COLUMNS
  const onBoard = jobs.filter((j) => statuses.includes(j.status) && !hidden.includes(j.status))
  const visible = sortJobs(applyFilters(jobs, filters, search), display.ordering)
  const columns = statuses.map((status) => ({ id: status, title: STATUS[status].label, visual: <StatusIcon status={status} /> }))

  // Board order, column by column, for the peek's previous / next.
  const order = statuses
    .filter((s) => !hidden.includes(s))
    .flatMap((s) => visible.filter((j) => j.status === s).map((j) => j.id))
  const shown = order.length

  function move(id: string, status: Status) {
    const job = jobs.find((j) => j.id === id)
    if (!job || job.status === status) return
    updateJob(id, { status })
    toast(`Moved ${id} to ${STATUS[status].label}`)
  }

  function add(status: Status) {
    const job = addJob(status)
    toast.success(`Created ${job.id}`, { description: `Added to ${STATUS[status].label}.` })
  }

  return (
    <Section id="board" title="Board" description="Filter bar and a Kanban board. Drag cards between columns.">
      <article className="bg-card min-w-0 rounded-lg border lg:col-span-2">
        <header className="border-b px-3 py-2">
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            display={display}
            onDisplayChange={setDisplay}
            shown={shown}
            total={onBoard.length}
          />
        </header>

        <KanbanBoard
          columns={columns}
          items={visible}
          columnOf={(job) => job.status}
          onMove={move}
          onAdd={(column) => add(column.id)}
          addLabel={(column) => `Add job to ${column.title}`}
          hidden={hidden}
          onHiddenChange={setHidden}
          hideEmpty={!display.showEmpty}
          itemName={{ one: 'job', other: 'jobs' }}
          renderCard={(job, card) => (
            <BoardCard
              job={job}
              display={display}
              card={card}
              selected={job.id === peekId || job.id === selectedId}
              onOpen={() => setPeekId(job.id)}
              onOpenFull={() => openFullPage(select, job.id)}
            />
          )}
        />
      </article>
      <JobPeek jobId={peekId} order={order} onNavigate={setPeekId} onClose={() => setPeekId(null)} />
    </Section>
  )
}

function BoardCard({ job, display, card, selected, onOpen, onOpenFull }: {
  job: Job
  display: DisplayOptions
  card: KanbanCardState<Status>
  selected: boolean
  onOpen: () => void
  onOpenFull: () => void
}) {
  const show = display.properties
  const labels = show.labels ? job.labels.map((id) => LABEL_BY_ID[id]).filter(Boolean) : []
  const topRow = show.id || show.priority
  const photos = show.photos && job.photos > 0
  const due = show.due && job.due !== ''
  const bottomRow = labels.length > 0 || photos || due || show.assignee

  return (
    <div className="group/card relative">
      {/* The menu button sits beside this element, not inside it, so no button is nested in a button. */}
      <JobContextMenu job={job} onOpen={onOpen} onOpenFull={onOpenFull}>
        <div
          role="button"
          tabIndex={0}
          {...card.cardProps}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen()
            }
          }}
          data-selected={selected}
          className="bg-card hover:ring-foreground/10 focus-visible:ring-ring/40 data-[selected=true]:border-brand/40 grid cursor-grab gap-1.5 rounded-md border p-2.5 shadow-xs transition-[box-shadow,opacity] outline-none hover:ring-1 focus-visible:ring-2 active:cursor-grabbing data-[dragging=true]:opacity-40"
        >
          {topRow && (
            <div className="flex h-5 items-center gap-1.5 pr-6 text-xs">
              {show.priority && <PriorityIcon priority={job.priority} />}
              {show.id && <span className="text-muted-foreground tabular-nums">{job.id}</span>}
            </div>
          )}
          <p className={`line-clamp-2 leading-snug font-medium ${topRow ? '' : 'pr-6'}`}>{job.title}</p>
          {bottomRow && (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {labels.map((l) => (
                <span
                  key={l.id}
                  className="text-muted-foreground inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px] whitespace-nowrap"
                >
                  <LabelDot colour={l.colour} className="size-1.5" />
                  {l.name}
                </span>
              ))}
              {photos && (
                <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                  <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} className="size-3.5" />
                  <span className="tabular-nums">{job.photos}</span>
                  <span className="sr-only">{job.photos === 1 ? 'photo' : 'photos'}</span>
                </span>
              )}
              {due && (
                <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px] whitespace-nowrap">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                  <span className="sr-only">Due</span>
                  {job.due}
                </span>
              )}
              {show.assignee && (
                <span className="ml-auto" title={job.driver || 'No assignee'}>
                  {job.driver ? <Initials name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />}
                  <span className="sr-only">{job.driver ? `Assigned to ${job.driver}` : 'No assignee'}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </JobContextMenu>
      <JobDropdownMenu job={job} onOpen={onOpen} onOpenFull={onOpenFull} className="bg-card absolute top-2 right-2" />
    </div>
  )
}
