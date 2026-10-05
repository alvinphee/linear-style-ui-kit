import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, FilterHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FilterFieldConfig, FilterValues } from './filters'

// A "Filter" button that opens a two-step, searchable menu: pick a field,
// then tick its values. Backspace in the empty search goes back a step.
export function FilterMenu({ fields, filters, onToggle }: {
  fields: FilterFieldConfig[]
  filters: FilterValues
  onToggle: (field: string, value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [fieldId, setFieldId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const field = fields.find((f) => f.id === fieldId) ?? null

  function goTo(next: string | null) {
    setFieldId(next)
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
        <Command key={field?.id ?? 'fields'} className="rounded-lg">
          {field && (
            <div className="px-1 pt-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => goTo(null)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                {field.label}
              </Button>
            </div>
          )}
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={field ? `Filter by ${field.label.toLowerCase()}…` : 'Filter by…'}
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
                {field.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={filters[field.id]?.includes(option.value) ?? false}
                    onSelect={() => onToggle(field.id, option.value)}
                  >
                    {/* Wrapped so the item's highlight style does not recolour status icons. */}
                    {option.visual && <span className="flex shrink-0">{option.visual}</span>}
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup>
                {fields.map((f) => {
                  const count = filters[f.id]?.length ?? 0
                  return (
                    <CommandItem
                      key={f.id}
                      value={f.label}
                      onSelect={() => goTo(f.id)}
                      className="[&>svg:last-child]:hidden"
                    >
                      <HugeiconsIcon icon={f.icon} strokeWidth={2} className="text-muted-foreground" />
                      {f.label}
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

// The chip's frame, for any filter: "Field | operator | value | ×". The value
// is yours (plain text, or a menu trigger with the SEGMENT look); × removes
// it. FilterChip is this with an options menu; use it alone for a filter that
// has no options, such as "Title contains “late”".
export function FilterPill({ icon, label, operator, removeLabel, onRemove, children }: {
  icon: IconSvgElement
  label: ReactNode
  // "is", "is any of", "contains"…
  operator: ReactNode
  // Names the × button: "Remove status filter".
  removeLabel: string
  onRemove: () => void
  // The value segment.
  children: ReactNode
}) {
  return (
    <div className="bg-card flex h-6 max-w-full min-w-0 items-stretch overflow-hidden rounded-md border text-xs">
      <span className="flex shrink-0 items-center gap-1 px-1.5">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
        {label}
      </span>
      <span className="text-muted-foreground flex shrink-0 items-center border-l px-1.5">{operator}</span>
      {children}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className={cn(SEGMENT, 'text-muted-foreground hover:text-foreground px-1')}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
      </button>
    </div>
  )
}

// A value segment that is plain text, for FilterPill.
export function FilterPillValue({ children }: { children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center border-l px-1.5">
      <span className="truncate">{children}</span>
    </span>
  )
}

// One active filter as a chip: "Field | is any of | values | ×". The values
// segment reopens the field's options; × removes the filter.
export function FilterChip({ field, values, onChange }: {
  field: FilterFieldConfig
  values: string[]
  onChange: (values: string[]) => void
}) {
  const chosen = field.options.filter((o) => values.includes(o.value))
  if (!chosen.length) return null
  const summary = chosen.length === 1 ? chosen[0].label : `${chosen[0].label} +${chosen.length - 1}`
  const name = field.label.toLowerCase()

  return (
    <FilterPill
      icon={field.icon}
      label={field.label}
      operator={chosen.length === 1 ? 'is' : 'is any of'}
      removeLabel={`Remove ${name} filter`}
      onRemove={() => onChange([])}
    >
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
          <DropdownMenuLabel>{field.label}</DropdownMenuLabel>
          {field.options.map((o) => (
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
    </FilterPill>
  )
}
