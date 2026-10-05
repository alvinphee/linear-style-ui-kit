import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Building03Icon, FullSignalIcon, KanbanIcon, Tag01Icon, TimeHalfPassIcon, UserCircleIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { DisplayMenu } from '@/blocks/display-menu'
import { FilterBar as FilterBarBlock, type FilterFieldConfig } from '@/blocks/filter-bar'
import { LabelDot } from '@/components/label-dot'
import { PriorityIcon } from '@/components/priority-icon'
import { LABEL_BY_ID, PRIORITY_RANK, UNASSIGNED, dueRank, type Job } from '../data'
import {
  ASSIGNEE_OPTIONS, CUSTOMER_OPTIONS, LABEL_OPTIONS, ORDERINGS, PRIORITY_OPTIONS, STATUS_OPTIONS, jobProperties,
  type JobOption, type JobProperty, type Ordering,
} from '../job-options'

// The job pages' filter set-up: the fields, saved views, matching and
// ordering. The filter bar itself is the block in src/blocks/filter-bar, and
// the option lists are the shared ones in src/pages/job-options.

export type FilterField = 'status' | 'priority' | 'assignee' | 'label' | 'customer'
export type Filters = Partial<Record<FilterField, string[]>>
// The fields a board card can show.
export type CardProperty = Exclude<JobProperty, 'status' | 'customer'>


export type DisplayOptions = {
  ordering: Ordering
  properties: Record<CardProperty, boolean>
  showEmpty: boolean
  showCancelled: boolean
}

export const DEFAULT_DISPLAY: DisplayOptions = {
  ordering: 'priority',
  properties: { id: true, priority: true, labels: true, assignee: true, due: true, photos: true },
  showEmpty: true,
  showCancelled: false,
}

const FIELD_ORDER: FilterField[] = ['status', 'priority', 'assignee', 'label', 'customer']

const FIELDS: Record<FilterField, { label: string; icon: IconSvgElement; options: JobOption[] }> = {
  status: { label: 'Status', icon: TimeHalfPassIcon, options: STATUS_OPTIONS },
  priority: { label: 'Priority', icon: FullSignalIcon, options: PRIORITY_OPTIONS },
  assignee: { label: 'Assignee', icon: UserCircleIcon, options: ASSIGNEE_OPTIONS },
  label: { label: 'Label', icon: Tag01Icon, options: LABEL_OPTIONS },
  customer: { label: 'Customer', icon: Building03Icon, options: CUSTOMER_OPTIONS },
}

// The fields in menu order, in the filter-bar block's shape.
export const FILTER_FIELDS: FilterFieldConfig[] = FIELD_ORDER.map((id) => ({ id, ...FIELDS[id] }))

function matches(job: Job, field: FilterField, values: string[]) {
  switch (field) {
    case 'status': return values.includes(job.status)
    case 'priority': return values.includes(job.priority)
    case 'assignee': return values.includes(job.driver || UNASSIGNED)
    case 'label': return job.labels.some((l) => values.includes(l))
    case 'customer': return values.includes(job.customer)
  }
}

// Every field narrows the list (AND); values inside one field widen it (OR).
export function applyFilters(jobs: Job[], filters: Filters, search: string) {
  const query = search.trim().toLowerCase()
  return jobs.filter((job) => {
    if (query && !job.title.toLowerCase().includes(query) && !job.id.toLowerCase().includes(query)) return false
    return FIELD_ORDER.every((field) => {
      const values = filters[field]
      return !values?.length || matches(job, field, values)
    })
  })
}

export function sortJobs(jobs: Job[], ordering: Ordering) {
  const list = [...jobs]
  if (ordering === 'priority') {
    list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || dueRank(a.due) - dueRank(b.due))
  } else if (ordering === 'due') {
    list.sort((a, b) => dueRank(a.due) - dueRank(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  } else {
    list.sort((a, b) => a.title.localeCompare(b.title))
  }
  return list
}

const SAVED_VIEWS: { id: string; label: string; visual: ReactNode; filters: Filters }[] = [
  {
    id: 'all', label: 'All jobs', filters: {},
    visual: <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} className="size-3.5" />,
  },
  { id: 'urgent', label: 'Urgent', filters: { priority: ['urgent', 'high'] }, visual: <PriorityIcon priority="urgent" /> },
  { id: 'export', label: 'Export', filters: { label: ['export'] }, visual: <LabelDot colour={LABEL_BY_ID.export.colour} /> },
]

const CARD_PROPERTIES = jobProperties<CardProperty>(['id', 'priority', 'labels', 'assignee', 'due', 'photos'])

export function FilterBar({
  filters, onFiltersChange, search, onSearchChange, display, onDisplayChange, shown, total,
}: {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  search: string
  onSearchChange: (search: string) => void
  display: DisplayOptions
  onDisplayChange: (display: DisplayOptions) => void
  shown: number
  total: number
}) {
  const set = (patch: Partial<DisplayOptions>) => onDisplayChange({ ...display, ...patch })
  return (
    <FilterBarBlock
      fields={FILTER_FIELDS}
      filters={filters}
      onFiltersChange={(next) => onFiltersChange(next as Filters)}
      views={SAVED_VIEWS}
      onSaveView={() => toast.success('View saved', { description: 'Demo only: saved views are not stored.' })}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search title or ID"
      searchLabel="Search jobs by title or ID"
      display={
        <DisplayMenu
          selects={[{
            id: 'ordering', label: 'Ordering', value: display.ordering, options: ORDERINGS,
            onChange: (v) => set({ ordering: v as Ordering }),
          }]}
          switches={[
            { id: 'empty', label: 'Show empty columns', checked: display.showEmpty, onChange: (on) => set({ showEmpty: on }) },
            {
              id: 'cancelled', label: 'Show Cancelled column', checked: display.showCancelled,
              onChange: (on) => set({ showCancelled: on }),
            },
          ]}
          properties={{
            label: 'Card properties',
            options: CARD_PROPERTIES,
            value: display.properties,
            onChange: (id, on) => set({ properties: { ...display.properties, [id]: on } }),
          }}
        />
      }
      shown={shown}
      total={total}
      noun={['job', 'jobs']}
    />
  )
}
