import { useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon, Calendar03Icon, Camera01Icon, Cancel01Icon, FilterHorizontalIcon, FullSignalIcon,
  Search01Icon, SearchRemoveIcon, SparklesIcon, Tag01Icon, TextIcon, TimeHalfPassIcon, UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { FollowUps } from '@/blocks/ai/chat/chat-message'
import { FilterChip, FilterPill, FilterPillValue, type FilterFieldConfig } from '@/blocks/filter-bar'
import { GroupedList, GroupedListRow, type GroupedListRowState } from '@/blocks/grouped-list'
import { AiLabel } from '@/components/ai/ai-label'
import { LabelChip, LabelDot } from '@/components/label-dot'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { Shortcut } from '@/components/shortcut'
import { StatusIcon } from '@/components/status-icon'
import { Thinking } from '@/components/ai/thinking-indicator'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { plural } from '@/lib/text'
import { useTimers } from '@/lib/use-timers'
import { LABELS, LABEL_BY_ID, UNASSIGNED, type Job, type Priority, type Status } from '../../data'
import { useJobs } from '../../jobs-store'
import { goTo } from '../../nav'
import { sortJobs } from '../FilterBar'
import { Panel } from '../shared'
import { matchesFilter, parseQuery, valueLabel, type NlField, type NlFilter } from './nl-search'

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

// `parsed` is what the words were understood as; `filters` is what is left
// after the chips were edited.
type Search =
  | { phase: 'idle' }
  | { phase: 'understanding'; query: string }
  | { phase: 'done'; query: string; parsed: NlFilter[]; filters: NlFilter[] }

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
    later(() => {
      const parsed = parseQuery(q)
      setSearch({ phase: 'done', query: q, parsed, filters: parsed })
    }, 750)
  }

  function clear() {
    clearAll()
    setQuery('')
    setSearch({ phase: 'idle' })
    inputRef.current?.focus()
  }

  // No values left takes the filter away.
  function setValues(id: string, values: string[]) {
    if (search.phase !== 'done') return
    setSearch({
      ...search,
      filters: values.length
        ? search.filters.map((f) => (f.id === id ? { ...f, values } : f))
        : search.filters.filter((f) => f.id !== id),
    })
  }

  function open(job: Job) {
    select(job.id)
    goTo('issue')
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
                <Shortcut keys={['enter']} className="hidden sm:inline-flex" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <div className="flex min-w-0 items-start gap-1.5">
          <span className="text-muted-foreground mt-1 shrink-0 text-[11px]">Try</span>
          <FollowUps items={EXAMPLES} onPick={submit} label="Example searches" icon={Search01Icon} className="min-w-0 flex-1" />
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
              {filters.map((f) => (f.field === 'text' ? (
                <TextChip key={f.id} words={f.values} onRemove={() => setValues(f.id, [])} />
              ) : (
                <FilterChip
                  key={f.id}
                  field={chipField(search.parsed.find((p) => p.id === f.id) ?? f)}
                  values={f.values}
                  onChange={(values) => setValues(f.id, values)}
                />
              )))}
              {!filters.length && <span className="text-muted-foreground text-xs">No filters left</span>}
              <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
                {plural(results.length, 'job')}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!filters.length}
                onClick={() =>
                  toast.success('Opened as filters', {
                    description: `Demo only. ${plural(filters.length, 'filter')} would open in the filter bar.`,
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
                <div className="overflow-hidden rounded-lg border">
                  <GroupedList
                    aria-label="Matching jobs"
                    groups={[{ id: 'results', title: 'Matching jobs', items: visible }]}
                    headers={false}
                    framed
                    itemName={{ one: 'job', other: 'jobs' }}
                    renderRow={(job, row) => <ResultRow job={job} row={row} onOpen={() => open(job)} />}
                  />
                </div>
                {results.length > FIRST_RESULTS && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground justify-self-start" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? 'Show fewer' : `Show all ${results.length}`}
                  </Button>
                )}
              </div>
            ) : (
              <Empty className="rounded-lg border px-4 py-7">
                <EmptyHeader className="max-w-72">
                  <EmptyMedia className="mb-1">
                    <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} className="text-muted-foreground size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">No jobs match “{search.query}”</EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    Remove a filter above, or ask in other words: a status, a person, a label or a date.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
  if (field === 'assignee') return value === UNASSIGNED ? <NoAssignee /> : <UserAvatar name={value} className="size-4" />
  if (field === 'label') {
    const label = LABEL_BY_ID[value]
    return label ? <LabelDot colour={label.colour} /> : null
  }
  return null
}

// A parsed filter in the filter bar's chip. Its menu offers the values the
// words were understood as, so unticking one narrows the search; the full
// lists are in the filter bar, behind "Edit as filters".
function chipField(parsed: NlFilter): FilterFieldConfig {
  return {
    id: parsed.id,
    ...FIELD_META[parsed.field],
    options: parsed.values.map((value) => ({
      value,
      label: valueLabel(parsed.field, value),
      visual: <ChipVisual field={parsed.field} value={value} />,
    })),
  }
}

// The words left over, matched against titles: "Title contains “…”".
function TextChip({ words, onRemove }: { words: string[]; onRemove: () => void }) {
  const meta = FIELD_META.text
  return (
    <FilterPill icon={meta.icon} label={meta.label} operator="contains" removeLabel={`Remove ${meta.label.toLowerCase()} filter`} onRemove={onRemove}>
      <FilterPillValue>“{words.join(' ')}”</FilterPillValue>
    </FilterPill>
  )
}

function ResultRow({ job, row, onOpen }: { job: Job; row: GroupedListRowState; onOpen: () => void }) {
  const labels = LABELS.filter((l) => job.labels.includes(l.id))
  return (
    <GroupedListRow row={row} onOpen={onOpen}>
      <PriorityIcon priority={job.priority} />
      <span className="text-muted-foreground hidden w-[4.75rem] shrink-0 tabular-nums sm:inline">{job.id}</span>
      <StatusIcon status={job.status} />
      <span className="min-w-0 flex-1 truncate font-medium">{job.title || 'Untitled job'}</span>
      {labels.length > 0 && (
        <span className="hidden shrink-0 items-center gap-1 md:flex">
          {labels.map((l) => <LabelChip key={l.id} name={l.name} colour={l.colour} />)}
        </span>
      )}
      <span className="text-muted-foreground hidden w-16 shrink-0 text-right sm:inline">{job.due}</span>
      {job.driver ? <UserAvatar name={job.driver} className="size-5" /> : <NoAssignee className="size-5" />}
    </GroupedListRow>
  )
}
