import { useRef, useState, type DragEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowUpRight01Icon, Calendar03Icon, Camera01Icon, MoreHorizontalIcon, ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LABELS, STATUS, type Job, type Status } from '../data'
import { useJobs } from '../jobs-store'
import {
  DEFAULT_DISPLAY, FilterBar, LabelDot, NoAssignee, applyFilters, sortJobs, type DisplayOptions,
  type Filters,
} from './FilterBar'
import { Section } from './shared'
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
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<Status | null>(null)
  // Read synchronously in dragover, before the state update above has rendered.
  const dragRef = useRef<string | null>(null)

  const statuses = display.showCancelled ? ALL_STATUSES : COLUMNS
  const onBoard = jobs.filter((j) => statuses.includes(j.status) && !hidden.includes(j.status))
  const visible = sortJobs(applyFilters(jobs, filters, search), display.ordering)
  const byStatus = (status: Status) => visible.filter((j) => j.status === status)
  const columns = statuses
    .filter((s) => !hidden.includes(s))
    .map((status) => ({ status, jobs: byStatus(status) }))
    .filter((c) => display.showEmpty || c.jobs.length > 0)
  const hiddenColumns = statuses.filter((s) => hidden.includes(s))
  const shown = columns.reduce((n, c) => n + c.jobs.length, 0)

  function openJob(id: string) {
    select(id)
    document.getElementById('issue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  function startDrag(e: DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    dragRef.current = id
    // Deferred so the browser takes the drag image before the card fades.
    setTimeout(() => setDraggingId(id), 0)
  }

  function endDrag() {
    dragRef.current = null
    setDraggingId(null)
    setOverStatus(null)
  }

  function dropTarget(status: Status) {
    return {
      onDragOver: (e: DragEvent) => {
        if (!dragRef.current) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overStatus !== status) setOverStatus(status)
      },
      onDragLeave: (e: DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setOverStatus((s) => (s === status ? null : s))
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        const id = dragRef.current ?? e.dataTransfer.getData('text/plain')
        endDrag()
        if (id) move(id, status)
      },
      'data-over': overStatus === status,
    }
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

        <div className="flex gap-3 overflow-x-auto p-3">
          {columns.map(({ status, jobs: columnJobs }) => (
            <div
              key={status}
              {...dropTarget(status)}
              className="bg-subtle data-[over=true]:border-brand/50 data-[over=true]:bg-brand/5 data-[over=true]:ring-brand/20 flex w-72 shrink-0 flex-col rounded-lg border p-2 transition-colors data-[over=true]:ring-2"
            >
              <ColumnHeader
                status={status}
                count={columnJobs.length}
                onAdd={() => add(status)}
                onHide={() => setHidden((h) => [...h, status])}
              />
              <div className="flex flex-1 flex-col gap-2">
                {columnJobs.length ? (
                  columnJobs.map((job) => (
                    <BoardCard
                      key={job.id}
                      job={job}
                      display={display}
                      selected={job.id === selectedId}
                      dragging={job.id === draggingId}
                      onOpen={() => openJob(job.id)}
                      onMove={(s) => move(job.id, s)}
                      onDragStart={(e) => startDrag(e, job.id)}
                      onDragEnd={endDrag}
                    />
                  ))
                ) : (
                  <div className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-xs">
                    {overStatus === status ? 'Drop here' : 'No jobs'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {columns.length === 0 && (
            <div className="text-muted-foreground flex h-32 flex-1 items-center justify-center rounded-lg border border-dashed text-xs">
              No columns to show
            </div>
          )}

          {hiddenColumns.length > 0 && (
            <div className="flex w-56 shrink-0 flex-col gap-1 p-1">
              <span className="text-muted-foreground px-1 pb-1 text-xs font-medium">Hidden columns</span>
              {hiddenColumns.map((status) => {
                const count = byStatus(status).length
                return (
                  <button
                    key={status}
                    type="button"
                    {...dropTarget(status)}
                    onClick={() => setHidden((h) => h.filter((s) => s !== status))}
                    aria-label={`Show ${STATUS[status].label} column, ${count} ${count === 1 ? 'job' : 'jobs'}`}
                    className="group/hidden bg-subtle hover:bg-accent focus-visible:ring-ring/30 data-[over=true]:border-brand/50 data-[over=true]:bg-brand/5 flex h-8 items-center gap-2 rounded-md border px-2 text-xs outline-none focus-visible:ring-2"
                  >
                    <StatusIcon status={status} />
                    <span className="font-medium">{STATUS[status].label}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                    <HugeiconsIcon
                      icon={ViewIcon}
                      strokeWidth={2}
                      className="text-muted-foreground group-hover/hidden:text-foreground ml-auto size-3.5"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </article>
    </Section>
  )
}

function ColumnHeader({ status, count, onAdd, onHide }: {
  status: Status
  count: number
  onAdd: () => void
  onHide: () => void
}) {
  const label = STATUS[status].label
  return (
    <div className="flex h-7 items-center gap-1.5 px-1 pb-1.5">
      <StatusIcon status={status} />
      <span className="truncate text-xs font-medium">{label}</span>
      <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
      <div className="ml-auto flex items-center gap-0.5">
        <Button variant="ghost" size="icon-xs" aria-label={`Add job to ${label}`} onClick={onAdd}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label={`${label} column options`}>
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={onHide}>
              <HugeiconsIcon icon={ViewOffSlashIcon} strokeWidth={2} />
              Hide column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function BoardCard({ job, display, selected, dragging, onOpen, onMove, onDragStart, onDragEnd }: {
  job: Job
  display: DisplayOptions
  selected: boolean
  dragging: boolean
  onOpen: () => void
  onMove: (status: Status) => void
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
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
      <div
        role="button"
        tabIndex={0}
        draggable
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        data-selected={selected}
        data-dragging={dragging}
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
      <CardMenu job={job} onOpen={onOpen} onMove={onMove} />
    </div>
  )
}

function CardMenu({ job, onOpen, onMove }: { job: Job; onOpen: () => void; onMove: (status: Status) => void }) {
  const opening = useRef(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${job.id}`}
          className="bg-card absolute top-2 right-2 pointer-fine:opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 data-[state=open]:opacity-100"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(e) => {
          // Returning focus to this button would scroll the page back up to the board.
          if (opening.current) e.preventDefault()
          opening.current = false
        }}
      >
        <DropdownMenuItem
          onSelect={() => {
            opening.current = true
            onOpen()
          }}
        >
          <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} />
          Open
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={job.status} onValueChange={(v) => onMove(v as Status)}>
          {ALL_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusIcon status={s} />
              {STATUS[s].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
