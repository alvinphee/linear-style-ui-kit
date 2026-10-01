import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon, ArrowRight01Icon, BookmarkAdd01Icon, Building03Icon, Cancel01Icon,
  FilterHorizontalIcon, FullSignalIcon, KanbanIcon, Search01Icon, SlidersHorizontalIcon, Tag01Icon,
  TimeHalfPassIcon, UserCircleIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import { CUSTOMERS, LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

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

function sameFilters(a: Filters, b: Filters) {
  return FIELD_ORDER.every((field) => {
    const x = a[field] ?? []
    const y = b[field] ?? []
    return x.length === y.length && x.every((v) => y.includes(v))
  })
}

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
  const activeView = SAVED_VIEWS.find((v) => sameFilters(v.filters, filters))
  const active = FIELD_ORDER.filter((f) => filters[f]?.length)
  const narrowed = active.length > 0 || search.trim() !== ''

  function setField(field: FilterField, values: string[]) {
    const next = { ...filters }
    if (values.length) next[field] = values
    else delete next[field]
    onFiltersChange(next)
  }

  function toggleValue(field: FilterField, value: string) {
    const current = filters[field] ?? []
    setField(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Saved views" className="flex flex-wrap items-center gap-1">
          {SAVED_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              aria-pressed={activeView?.id === view.id}
              onClick={() => onFiltersChange(view.filters)}
              className="text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/30 aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:border-border inline-flex h-6 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2"
            >
              {view.visual}
              {view.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => toast.success('View saved', { description: 'Demo only: saved views are not stored.' })}
        >
          <HugeiconsIcon icon={BookmarkAdd01Icon} strokeWidth={2} data-icon="inline-start" />
          Save view
        </Button>

        <div className="flex w-full min-w-0 items-center gap-1.5 sm:ml-auto sm:w-auto">
          <InputGroup className="flex-1 sm:w-48 sm:flex-none">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search title or ID"
              aria-label="Search jobs by title or ID"
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onSearchChange('')}>
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <DisplayMenu display={display} onChange={onDisplayChange} />
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <FilterMenu filters={filters} onToggle={toggleValue} />
        {active.map((field) => (
          <FilterChip key={field} field={field} values={filters[field]!} onChange={(v) => setField(field, v)} />
        ))}
        {active.length > 0 && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onFiltersChange({})}>
            Clear
          </Button>
        )}
        <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
          {narrowed ? `${shown} of ${total} jobs` : `${total} ${total === 1 ? 'job' : 'jobs'}`}
        </span>
      </div>
    </div>
  )
}

export function FilterMenu({ filters, onToggle }: { filters: Filters; onToggle: (field: FilterField, value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [field, setField] = useState<FilterField | null>(null)
  const [query, setQuery] = useState('')

  function goTo(next: FilterField | null) {
    setField(next)
    setQuery('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Reset on open, not on close, so the content does not swap mid fade-out.
        if (next) goTo(null)
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 gap-0 p-0">
        {/* A new key per step resets cmdk's highlighted item along with the search. */}
        <Command key={field ?? 'fields'} className="rounded-lg">
          {field && (
            <div className="px-1 pt-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => goTo(null)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                {FIELDS[field].label}
              </Button>
            </div>
          )}
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={field ? `Filter by ${FIELDS[field].label.toLowerCase()}…` : 'Filter by…'}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !query && field) {
                e.preventDefault()
                goTo(null)
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            {field ? (
              <CommandGroup>
                {FIELDS[field].options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={filters[field]?.includes(option.value) ?? false}
                    onSelect={() => onToggle(field, option.value)}
                  >
                    {/* Wrapped so the item's highlight style does not recolour status icons. */}
                    <span className="flex shrink-0">{option.visual}</span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup>
                {FIELD_ORDER.map((f) => {
                  const count = filters[f]?.length ?? 0
                  return (
                    <CommandItem
                      key={f}
                      value={FIELDS[f].label}
                      onSelect={() => goTo(f)}
                      className="[&>svg:last-child]:hidden"
                    >
                      <HugeiconsIcon icon={FIELDS[f].icon} strokeWidth={2} className="text-muted-foreground" />
                      {FIELDS[f].label}
                      {count > 0 && <span className="text-muted-foreground ml-auto tabular-nums">{count}</span>}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className={cn('text-muted-foreground', count === 0 && 'ml-auto')}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const SEGMENT = 'flex items-center border-l outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40'

export function FilterChip({ field, values, onChange }: {
  field: FilterField
  values: string[]
  onChange: (values: string[]) => void
}) {
  const config = FIELDS[field]
  const chosen = config.options.filter((o) => values.includes(o.value))
  if (!chosen.length) return null
  const summary = chosen.length === 1 ? chosen[0].label : `${chosen[0].label} +${chosen.length - 1}`
  const name = config.label.toLowerCase()

  return (
    <div className="bg-card flex h-6 max-w-full min-w-0 items-stretch overflow-hidden rounded-md border text-xs">
      <span className="flex shrink-0 items-center gap-1 px-1.5">
        <HugeiconsIcon icon={config.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
        {config.label}
      </span>
      <span className="text-muted-foreground flex shrink-0 items-center border-l px-1.5">
        {chosen.length === 1 ? 'is' : 'is any of'}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(SEGMENT, 'min-w-0 gap-1.5 px-1.5')}
          aria-label={`Edit ${name} filter: ${chosen.map((o) => o.label).join(', ')}`}
        >
          <span className="flex shrink-0 items-center gap-0.5">
            {chosen.slice(0, 3).map((o) => (
              <span key={o.value} className="flex">{o.visual}</span>
            ))}
          </span>
          <span className="truncate">{summary}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>{config.label}</DropdownMenuLabel>
          {config.options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={values.includes(o.value)}
              // Keep the menu open so several values can be ticked in a row.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) => onChange(on ? [...values, o.value] : values.filter((v) => v !== o.value))}
            >
              {o.visual}
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        aria-label={`Remove ${name} filter`}
        onClick={() => onChange([])}
        className={cn(SEGMENT, 'text-muted-foreground hover:text-foreground px-1')}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
      </button>
    </div>
  )
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
