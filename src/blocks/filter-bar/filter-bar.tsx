import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BookmarkAdd01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/text'
import { FilterChip, FilterMenu } from './filter-menu'
import {
  activeFields, sameFilters, setFieldValues, toggleFieldValue, type FilterFieldConfig, type FilterValues,
} from './filters'

// A Linear-style filter bar: saved views as pills, a search box, a slot for a
// Display menu, then the Filter menu, one chip per active filter, Clear and a
// count. Controlled: the page keeps the filters and search, and does the
// matching. Place it in a list's header, above the rows.
//
// The pieces are exported too (SavedViews, FilterMenu, FilterChip) for
// toolbars laid out another way. The search box is the SearchField component.

export type SavedViewItem = {
  id: string
  label: string
  // Shown before the label.
  visual?: ReactNode
  // Shown after the label, muted: how many rows the view holds.
  count?: number
}

export function SavedViews({ views, value, onChange, wrap = true, label = 'Saved views', className }: {
  views: SavedViewItem[]
  // The active view's id, if any view matches the current filters.
  value: string | undefined
  onChange: (id: string) => void
  // false keeps the pills on one line that scrolls sideways, for narrow screens.
  wrap?: boolean
  label?: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex items-center gap-1',
        wrap ? 'flex-wrap' : '-mx-1 -my-0.5 min-w-0 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]',
        className,
      )}
    >
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={value === view.id}
          onClick={() => onChange(view.id)}
          className={cn(
            'text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring/30 aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:border-border inline-flex h-6 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2',
            !wrap && 'shrink-0',
          )}
        >
          {view.visual}
          {view.label}
          {view.count !== undefined && <span className="text-muted-foreground tabular-nums">{view.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function FilterBar({
  fields, filters, onFiltersChange, views, onSaveView, search, onSearchChange, searchPlaceholder = 'Search',
  searchLabel, display, shown, total, noun = ['item', 'items'], className,
}: {
  fields: FilterFieldConfig[]
  filters: FilterValues
  onFiltersChange: (filters: FilterValues) => void
  // Saved views: picking one replaces the filters with its own.
  views?: (SavedViewItem & { filters: FilterValues })[]
  // Shows a "Save view" button.
  onSaveView?: () => void
  search?: string
  onSearchChange?: (search: string) => void
  searchPlaceholder?: string
  searchLabel?: string
  // After the search box: a Display menu, a layout switch…
  display?: ReactNode
  // For the count at the end: "4 of 12 jobs", or "12 jobs" with nothing narrowed.
  shown?: number
  total?: number
  noun?: [one: string, other: string]
  className?: string
}) {
  const activeView = views?.find((v) => sameFilters(v.filters, filters))
  const active = activeFields(fields, filters)
  const query = search ?? ''
  const narrowed = active.length > 0 || query.trim() !== ''
  const hasSearch = onSearchChange !== undefined

  return (
    <div className={cn('grid min-w-0 gap-2', className)}>
      {(views || onSaveView || hasSearch || display) && (
        <div className="flex flex-wrap items-center gap-2">
          {views && (
            <SavedViews
              views={views}
              value={activeView?.id}
              onChange={(id) => onFiltersChange(views.find((v) => v.id === id)?.filters ?? {})}
            />
          )}
          {onSaveView && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onSaveView}>
              <HugeiconsIcon icon={BookmarkAdd01Icon} strokeWidth={2} data-icon="inline-start" />
              Save view
            </Button>
          )}

          {(hasSearch || display) && (
            <div className="flex w-full min-w-0 items-center gap-1.5 sm:ml-auto sm:w-auto">
              {hasSearch && (
                <SearchField
                  value={query}
                  onChange={onSearchChange}
                  placeholder={searchPlaceholder}
                  label={searchLabel}
                  className="flex-1 sm:w-48 sm:flex-none"
                />
              )}
              {display}
            </div>
          )}
        </div>
      )}

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <FilterMenu fields={fields} filters={filters} onToggle={(f, v) => onFiltersChange(toggleFieldValue(filters, f, v))} />
        {active.map((field) => (
          <FilterChip
            key={field.id}
            field={field}
            values={filters[field.id]!}
            onChange={(v) => onFiltersChange(setFieldValues(filters, field.id, v))}
          />
        ))}
        {active.length > 0 && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onFiltersChange({})}>
            Clear
          </Button>
        )}
        {total !== undefined && (
          <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap tabular-nums" aria-live="polite">
            {narrowed ? `${shown ?? total} of ${total} ${noun[1]}` : plural(total, noun[0], noun[1])}
          </span>
        )}
      </div>
    </div>
  )
}
