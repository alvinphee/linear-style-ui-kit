import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon, FullSignalIcon, KanbanIcon, SlidersHorizontalIcon, Tag01Icon, TimeHalfPassIcon, UserCircleIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  FilterBar as FilterBarBlock, FilterChip as FilterChipBlock, FilterMenu as FilterMenuBlock, type FilterFieldConfig,
} from '@/blocks/filter-bar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { CUSTOMERS, LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

// The job pages' filter set-up: the fields, saved views, matching and
// ordering. The filter bar itself is the block in src/blocks/filter-bar.

export type FilterField = 'status' | 'priority' | 'assignee' | 'label' | 'customer'
export type Filters = Partial<Record<FilterField, string[]>>
export type Ordering = 'priority' | 'due' | 'title'
export type CardProperty = 'id' | 'priority' | 'labels' | 'assignee' | 'due' | 'photos'

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

// Filter value for jobs with nobody assigned (Job.driver is '').
export const UNASSIGNED = 'unassigned'

export function NoAssignee({ className }: { className?: string }) {
  return (
    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border border-dashed', className)}>
      <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="text-muted-foreground size-2.5" />
    </span>
  )
}

export function LabelDot({ colour, className }: { colour: string; className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full', className)} style={{ backgroundColor: colour }} />
}

type Option = { value: string; label: string; visual: ReactNode }

const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low', 'none']

export const FIELD_ORDER: FilterField[] = ['status', 'priority', 'assignee', 'label', 'customer']

export const FIELDS: Record<FilterField, { label: string; icon: IconSvgElement; options: Option[] }> = {
  status: {
    label: 'Status',
    icon: TimeHalfPassIcon,
    options: (Object.keys(STATUS) as Status[]).map((s) => ({
      value: s, label: STATUS[s].label, visual: <StatusIcon status={s} />,
    })),
  },
  priority: {
    label: 'Priority',
    icon: FullSignalIcon,
    options: PRIORITY_ORDER.map((p) => ({
      value: p,
      label: PRIORITY[p].label,
      visual: <PriorityIcon priority={p} />,
    })),
  },
  assignee: {
    label: 'Assignee',
    icon: UserCircleIcon,
    options: [
      { value: UNASSIGNED, label: 'No assignee', visual: <NoAssignee /> },
      ...PEOPLE.map((name) => ({ value: name, label: name, visual: <Initials name={name} className="size-4" /> })),
    ],
  },
  label: {
    label: 'Label',
    icon: Tag01Icon,
    options: LABELS.map((l) => ({ value: l.id, label: l.name, visual: <LabelDot colour={l.colour} /> })),
  },
  customer: {
    label: 'Customer',
    icon: Building03Icon,
    options: CUSTOMERS.map((c) => ({
      value: c,
      label: c,
      visual: <HugeiconsIcon icon={Building03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />,
    })),
  },
}

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

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// The sample data writes due dates as words ("Today") or "2 Oct", relative to 30 Sep.
// Only the order matters, so a month counts as 31 days.
function dueRank(due: string) {
  if (!due) return 9999
  if (due === 'Today') return 0
  if (due === 'Tomorrow') return 1
  if (due === 'Next week') return 7
  const [day, month] = due.split(' ')
  const m = MONTHS.indexOf(month)
  return m < 0 ? 999 : (m - 8) * 31 + Number(day) - 30
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

export const SAVED_VIEWS: { id: string; label: string; visual: ReactNode; filters: Filters }[] = [
  {
    id: 'all', label: 'All jobs', filters: {},
    visual: <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} className="size-3.5" />,
  },
  { id: 'urgent', label: 'Urgent', filters: { priority: ['urgent', 'high'] }, visual: <PriorityIcon priority="urgent" /> },
  {
    id: 'export', label: 'Export', filters: { label: ['export'] },
    visual: <LabelDot colour={LABELS.find((l) => l.id === 'export')!.colour} />,
  },
]

// The fields in menu order, in the block's shape.
const FIELD_LIST: FilterFieldConfig[] = FIELD_ORDER.map((id) => ({ id, ...FIELDS[id] }))

const PROPERTIES: { id: CardProperty; label: string }[] = [
  { id: 'id', label: 'ID' },
  { id: 'priority', label: 'Priority' },
  { id: 'labels', label: 'Labels' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'due', label: 'Due date' },
  { id: 'photos', label: 'Photos' },
]

const ORDERINGS: { id: Ordering; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'due', label: 'Due date' },
  { id: 'title', label: 'Title' },
]

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
  return (
    <FilterBarBlock
      fields={FIELD_LIST}
      filters={filters}
      onFiltersChange={(next) => onFiltersChange(next as Filters)}
      views={SAVED_VIEWS}
      onSaveView={() => toast.success('View saved', { description: 'Demo only: saved views are not stored.' })}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search title or ID"
      searchLabel="Search jobs by title or ID"
      display={<DisplayMenu display={display} onChange={onDisplayChange} />}
      shown={shown}
      total={total}
      noun={['job', 'jobs']}
    />
  )
}

export function FilterMenu({ filters, onToggle }: { filters: Filters; onToggle: (field: FilterField, value: string) => void }) {
  return <FilterMenuBlock fields={FIELD_LIST} filters={filters} onToggle={(field, value) => onToggle(field as FilterField, value)} />
}

export function FilterChip({ field, values, onChange }: {
  field: FilterField
  values: string[]
  onChange: (values: string[]) => void
}) {
  return <FilterChipBlock field={{ id: field, ...FIELDS[field] }} values={values} onChange={onChange} />
}

function DisplayMenu({ display, onChange }: { display: DisplayOptions; onChange: (display: DisplayOptions) => void }) {
  const id = useId()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          Display
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-ordering`} className="text-muted-foreground font-normal">Ordering</Label>
          <Select value={display.ordering} onValueChange={(v) => onChange({ ...display, ordering: v as Ordering })}>
            <SelectTrigger id={`${id}-ordering`} size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {ORDERINGS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 border-t pt-3">
          <span className="text-muted-foreground">Card properties</span>
          <div className="flex flex-wrap gap-1">
            {PROPERTIES.map((p) => (
              <Toggle
                key={p.id}
                size="sm"
                variant="outline"
                pressed={display.properties[p.id]}
                onPressedChange={(on) => onChange({ ...display, properties: { ...display.properties, [p.id]: on } })}
                className="text-muted-foreground data-[state=on]:text-foreground text-xs data-[state=on]:border-transparent"
              >
                {p.label}
              </Toggle>
            ))}
          </div>
        </div>

        <div className="grid gap-2.5 border-t pt-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-empty`} className="font-normal">Show empty columns</Label>
            <Switch
              id={`${id}-empty`}
              checked={display.showEmpty}
              onCheckedChange={(on) => onChange({ ...display, showEmpty: on })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-cancelled`} className="font-normal">Show Cancelled column</Label>
            <Switch
              id={`${id}-cancelled`}
              checked={display.showCancelled}
              onCheckedChange={(on) => onChange({ ...display, showCancelled: on })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
