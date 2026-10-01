import { useId } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { KanbanIcon, LeftToRightListBulletIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'
import type { Ordering } from '../FilterBar'
import {
  DEFAULT_LIST_DISPLAY, GROUPINGS, ORDERINGS, PROPERTIES, sameDisplay, type Grouping, type Layout, type ListDisplay,
} from './display'

// Linear's Display menu: layout, grouping, ordering, a few switches and the
// properties each row or card shows. Everything applies as you change it.
export function DisplayMenu({ display, onChange, layout, onLayout }: {
  display: ListDisplay
  onChange: (display: ListDisplay) => void
  layout: Layout
  onLayout: (layout: Layout) => void
}) {
  const id = useId()
  const changed = !sameDisplay(display, DEFAULT_LIST_DISPLAY)
  const board = layout === 'board'
  // A board has no "No grouping": it shows status columns instead.
  const grouping = board && display.grouping === 'none' ? 'status' : display.grouping
  const set = (patch: Partial<ListDisplay>) => onChange({ ...display, ...patch })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative" aria-label={changed ? 'Display options, changed' : 'Display options'}>
          <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          <span className="hidden @md:inline">Display</span>
          {changed && <span className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3">
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Layout">
          {(['list', 'board'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={layout === value}
              onClick={() => onLayout(value)}
              className="text-muted-foreground hover:bg-accent/60 hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:border-border focus-visible:ring-ring/40 flex flex-col items-center gap-1 rounded-md border border-transparent py-2 text-xs outline-none focus-visible:ring-2"
            >
              <HugeiconsIcon icon={value === 'list' ? LeftToRightListBulletIcon : KanbanIcon} strokeWidth={2} className="size-4" />
              {value === 'list' ? 'List' : 'Board'}
            </button>
          ))}
        </div>

        <div className="grid gap-2 border-t pt-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-grouping`} className="text-muted-foreground font-normal">{board ? 'Columns' : 'Grouping'}</Label>
            <Select value={grouping} onValueChange={(v) => set({ grouping: v as Grouping })}>
              <SelectTrigger id={`${id}-grouping`} size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {GROUPINGS.filter((g) => !board || g.id !== 'none').map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-ordering`} className="text-muted-foreground font-normal">Ordering</Label>
            <Select value={display.ordering} onValueChange={(v) => set({ ordering: v as Ordering })}>
              <SelectTrigger id={`${id}-ordering`} size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {ORDERINGS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2.5 border-t pt-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-empty`} className="font-normal">{board ? 'Show empty columns' : 'Show empty groups'}</Label>
            <Switch id={`${id}-empty`} checked={display.showEmpty} onCheckedChange={(on) => set({ showEmpty: on })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-completed`} className="font-normal">Show completed issues</Label>
            <Switch id={`${id}-completed`} checked={display.showCompleted} onCheckedChange={(on) => set({ showCompleted: on })} />
          </div>
        </div>

        <div className="grid gap-2 border-t pt-3">
          <span className="text-muted-foreground">Display properties</span>
          <div className="flex flex-wrap gap-1">
            {PROPERTIES.map((p) => (
              <Toggle
                key={p.id}
                size="sm"
                variant="outline"
                pressed={display.properties[p.id]}
                onPressedChange={(on) => set({ properties: { ...display.properties, [p.id]: on } })}
                className="text-muted-foreground data-[state=on]:text-foreground text-xs data-[state=on]:border-transparent"
              >
                {p.label}
              </Toggle>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={!changed} onClick={() => onChange(DEFAULT_LIST_DISPLAY)}>
            Reset to default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
