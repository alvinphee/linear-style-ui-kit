import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon, Calendar03Icon, Camera01Icon, Cancel01Icon, FilterHorizontalIcon, FullSignalIcon,
  SearchRemoveIcon, SparklesIcon, Tag01Icon, TextIcon, TimeHalfPassIcon, UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { LABELS, type Job, type Priority, type Status } from '../../data'
import { useJobs } from '../../jobs-store'
import { goTo } from '../../nav'
import { LabelDot, NoAssignee, sortJobs } from '../FilterBar'
import { Panel } from '../shared'
import { Initials, PriorityIcon, StatusIcon } from '../StatusSection'
import { UNASSIGNED, matchesFilter, parseQuery, valueLabel, type NlField, type NlFilter } from './nl-search'
import { AiLabel, Thinking, useTimers } from './shared'

const EXAMPLES = ['urgent jobs for Ravi', 'export jobs due this week', 'done last week', 'open jobs without photos']
const FIRST_RESULTS = 6

const FIELD_META: Record<NlField, { label: string; icon: IconSvgElement }> = {
  status: { label: 'Status', icon: TimeHalfPassIcon },
  priority: { label: 'Priority', icon: FullSignalIcon },
  assignee: { label: 'Assignee', icon: UserCircleIcon },
  label: { label: 'Label', icon: Tag01Icon },
  customer: { label: 'Customer', icon: Building03Icon },
  due: { label: 'Due', icon: Calendar03Icon },
  photos: { label: 'Photos', icon: Camera01Icon },
  text: { label: 'Title', icon: TextIcon },
}

type Search =
  | { phase: 'idle' }
  | { phase: 'understanding'; query: string }
  | { phase: 'done'; query: string; filters: NlFilter[] }

export function NlSearchPanel() {
  const { jobs, select } = useJobs()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<Search>({ phase: 'idle' })
  const [showAll, setShowAll] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { later, clearAll } = useTimers()

  function submit(text = query) {
    const q = text.trim()
    if (!q) return
    clearAll()
    setQuery(q)
    setShowAll(false)
    setSearch({ phase: 'understanding', query: q })
    later(() => setSearch({ phase: 'done', query: q, filters: parseQuery(q) }), 750)
  }

  function clear() {
    clearAll()
    setQuery('')
    setSearch({ phase: 'idle' })
    inputRef.current?.focus()
  }

  function removeFilter(id: string) {
    if (search.phase !== 'done') return
    setSearch({ ...search, filters: search.filters.filter((f) => f.id !== id) })
  }

  const filters = search.phase === 'done' ? search.filters : []
  const results = search.phase === 'done'
    ? sortJobs(jobs.filter((job) => filters.every((f) => matchesFilter(job, f))), 'priority')
    : []
  const visible = showAll ? results : results.slice(0, FIRST_RESULTS)
  const onlyText = filters.length === 1 && filters[0].field === 'text'

  return (
    <Panel title="Natural-language search" note="Plain words in, filters out" wide>
      <div className="grid min-w-0 gap-3">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <InputGroup className="h-8">
            <InputGroupAddon>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && (query || search.phase !== 'idle')) {
                  e.preventDefault()
                  clear()
                }
              }}
              placeholder="Ask for jobs in plain words…"
              aria-label="Ask for jobs in plain words"
            />
            <InputGroupAddon align="inline-end">
              {query && search.phase !== 'understanding' && (
                <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={clear}>
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </InputGroupButton>
              )}
              <InputGroupButton type="submit" variant="secondary" disabled={!query.trim() || search.phase === 'understanding'}>
                {search.phase === 'understanding' ? <Spinner className="size-3" /> : null}
                Search
                <Kbd className="hidden sm:inline-flex">↵</Kbd>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-[11px]">Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => submit(example)}
              className="text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/30 inline-flex h-6 max-w-full items-center truncate rounded-full border px-2.5 text-xs transition-colors outline-none focus-visible:ring-2"
            >
              {example}
            </button>
          ))}
        </div>

        {search.phase === 'understanding' && (
          <div className="grid gap-2.5 border-t pt-3">
            <Thinking label="Understanding…" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            <div className="overflow-hidden rounded-lg border">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex h-9 items-center gap-2.5 border-b px-3 last:border-b-0">
                  <Skeleton className="size-3.5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {search.phase === 'done' && (
          <div className="grid min-w-0 gap-2.5 border-t pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <AiLabel>Understood as</AiLabel>
              {filters.map((f) => (
                <ParsedChip key={f.id} filter={f} onRemove={() => removeFilter(f.id)} />
              ))}
              {!filters.length && <span className="text-muted-foreground text-xs">No filters left</span>}
              <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
                {results.length} {results.length === 1 ? 'job' : 'jobs'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!filters.length}
                onClick={() =>
                  toast.success('Opened as filters', {
                    description: `Demo only. ${filters.length} ${filters.length === 1 ? 'filter' : 'filters'} would open in the filter bar.`,
                  })
                }
              >
                <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                Edit as filters
              </Button>
            </div>

            {onlyText && (
              <p className="text-muted-foreground text-[11px]">
                No status, person, label or date recognised, so this searches job titles for the words instead.
              </p>
            )}

            {results.length ? (
              <div className="grid gap-1.5">
                <ul aria-label="Matching jobs" className="overflow-hidden rounded-lg border">
                  {visible.map((job) => (
                    <ResultRow
                      key={job.id}
                      job={job}
                      onOpen={() => {
                        select(job.id)
                        goTo('issue')
                      }}
                    />
                  ))}
                </ul>
                {results.length > FIRST_RESULTS && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground justify-self-start" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show fewer' : `Show all ${results.length}`}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid justify-items-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center">
                <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} className="text-muted-foreground size-5" />
                <p className="text-xs font-medium">No jobs match “{search.query}”</p>
                <p className="text-muted-foreground max-w-72 text-[11px]">
                  Remove a filter above, or ask in other words: a status, a person, a label or a date.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

function ChipVisual({ field, value }: { field: NlField; value: string }) {
  if (field === 'status') return <StatusIcon status={value as Status} />
  if (field === 'priority') return <PriorityIcon priority={value as Priority} />
  if (field === 'assignee') return value === UNASSIGNED ? <NoAssignee /> : <Initials name={value} className="size-4" />
  if (field === 'label') {
    const label = LABELS.find((l) => l.id === value)
    return label ? <LabelDot colour={label.colour} /> : null
  }
  return null
}

function ParsedChip({ filter, onRemove }: { filter: NlFilter; onRemove: () => void }) {
  const meta = FIELD_META[filter.field]
  const op = filter.field === 'text' ? 'contains' : filter.field === 'photos' ? 'are' : filter.values.length > 1 ? 'is any of' : 'is'
  const value = filter.field === 'text'
    ? `“${filter.values.join(' ')}”`
    : filter.values.length > 2
      ? `${valueLabel(filter.field, filter.values[0])} +${filter.values.length - 1}`
      : filter.values.map((v) => valueLabel(filter.field, v)).join(', ')

  return (
    <span className="bg-card flex h-6 max-w-full min-w-0 items-stretch overflow-hidden rounded-md border text-xs">
      <span className="flex shrink-0 items-center gap-1 px-1.5">
        <HugeiconsIcon icon={meta.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
        {meta.label}
      </span>
      <span className="text-muted-foreground flex shrink-0 items-center border-l px-1.5">{op}</span>
      <span className="flex min-w-0 items-center gap-1.5 border-l px-1.5">
        <span className="flex shrink-0 items-center gap-0.5">
          {filter.field !== 'text' && filter.values.slice(0, 3).map((v) => (
            <ChipVisual key={v} field={filter.field} value={v} />
          ))}
        </span>
        <span className="truncate">{value}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${meta.label.toLowerCase()} filter`}
        onClick={onRemove}
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:ring-ring/40 flex items-center border-l px-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
      </button>
    </span>
  )
}

function ResultRow({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const labels = LABELS.filter((l) => job.labels.includes(l.id))
  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="hover:bg-accent/60 focus-visible:bg-accent flex h-9 w-full min-w-0 items-center gap-2.5 px-3 text-left text-xs outline-none"
      >
        <PriorityIcon priority={job.priority} />
        <span className="text-muted-foreground hidden w-[4.75rem] shrink-0 tabular-nums sm:inline">{job.id}</span>
        <StatusIcon status={job.status} />
        <span className="min-w-0 flex-1 truncate font-medium">{job.title || 'Untitled job'}</span>
        <Labels labels={labels} />
        <span className="text-muted-foreground hidden w-16 shrink-0 text-right sm:inline">{job.due}</span>
        {job.driver ? <Initials name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />}
      </button>
    </li>
  )
}

function Labels({ labels }: { labels: typeof LABELS }): ReactNode {
  if (!labels.length) return null
  return (
    <span className="hidden shrink-0 items-center gap-1 md:flex">
      {labels.map((l) => (
        <span key={l.id} className="text-muted-foreground inline-flex h-5 items-center gap-1.5 rounded-full border px-2 text-[11px]">
          <LabelDot colour={l.colour} />
          {l.name}
        </span>
      ))}
    </span>
  )
}
