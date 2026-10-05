import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { KanbanIcon, LeftToRightListBulletIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Toggle } from '@/components/ui/toggle'

// The Display menu (Linear's name for it): how a list or board is laid out,
// in a popover behind a "Display" button. Its sections, top to bottom, each
// shown only when you pass it: layout tiles (list, board…), selects (grouping,
// ordering…), switches ("Show empty groups"), property chips (which fields
// each row or card shows) and "Reset to default".
//
// Controlled: the page keeps the values, and every change applies at once.
// Option lists are the page's too, so a board can leave out "No grouping".
// Place it in a list's toolbar, or in the filter bar's `display` slot.

// One choice in a select, or one property chip.
export type DisplayOption = { id: string; label: string }

// A layout tile: a label and its icon.
export type DisplayLayout = DisplayOption & { icon: IconSvgElement }

// A labelled select, such as Grouping or Ordering.
export type DisplaySelect = {
  id: string
  label: string
  value: string
  options: DisplayOption[]
  onChange: (value: string) => void
}

// A labelled switch, such as "Show empty groups".
export type DisplaySwitch = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

// The usual pair of layouts: a list and a board.
export const LIST_AND_BOARD: DisplayLayout[] = [
  { id: 'list', label: 'List', icon: LeftToRightListBulletIcon },
  { id: 'board', label: 'Board', icon: KanbanIcon },
]

// The "Display" button and its popover. Pass only the sections the view needs.
export function DisplayMenu({
  layout,
  selects = [],
  switches = [],
  properties,
  changed = false,
  onReset,
  label = 'Display',
  labelClassName,
  align = 'end',
  className,
}: {
  // Layout tiles at the top. `options` defaults to list and board.
  layout?: { value: string; onChange: (layout: string) => void; options?: DisplayLayout[] }
  selects?: DisplaySelect[]
  switches?: DisplaySwitch[]
  // Chips that show or hide a field on each row or card.
  properties?: {
    // The heading above the chips: "Display properties", "Card properties"…
    label?: string
    options: DisplayOption[]
    // Which ones are shown, by id.
    value: Record<string, boolean>
    onChange: (id: string, shown: boolean) => void
  }
  // The values differ from the defaults: marks the button with a dot and
  // enables Reset.
  changed?: boolean
  // Adds "Reset to default" at the foot.
  onReset?: () => void
  label?: string
  // For the button's text, such as "hidden @md:inline" to show only the icon in a narrow frame.
  labelClassName?: string
  align?: 'start' | 'center' | 'end'
  // For the popover.
  className?: string
}) {
  const id = useId()
  // The sections in order; each after the first gets a rule above it.
  const sections: { key: string; className: string; group?: string; node: ReactNode }[] = []

  if (layout) {
    const options = layout.options ?? LIST_AND_BOARD
    sections.push({
      key: 'layout',
      className: 'grid auto-cols-fr grid-flow-col gap-1.5',
      group: 'Layout',
      node: options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={layout.value === option.id}
          onClick={() => layout.onChange(option.id)}
          className="text-muted-foreground hover:bg-accent/60 hover:text-foreground aria-pressed:bg-accent aria-pressed:text-foreground aria-pressed:border-border focus-visible:ring-ring/40 flex flex-col items-center gap-1 rounded-md border border-transparent py-2 text-xs outline-none focus-visible:ring-2"
        >
          <HugeiconsIcon icon={option.icon} strokeWidth={2} className="size-4" />
          {option.label}
        </button>
      )),
    })
  }

  if (selects.length) {
    sections.push({
      key: 'selects',
      className: 'grid gap-2',
      node: selects.map((select) => (
        <div key={select.id} className="flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-${select.id}`} className="text-muted-foreground font-normal">{select.label}</Label>
          <Select value={select.value} onValueChange={select.onChange}>
            <SelectTrigger id={`${id}-${select.id}`} size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {select.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )),
    })
  }

  if (switches.length) {
    sections.push({
      key: 'switches',
      className: 'grid gap-2.5',
      node: switches.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-${item.id}`} className="font-normal">{item.label}</Label>
          <Switch id={`${id}-${item.id}`} checked={item.checked} onCheckedChange={item.onChange} />
        </div>
      )),
    })
  }

  if (properties) {
    sections.push({
      key: 'properties',
      className: 'grid gap-2',
      node: (
        <>
          <span className="text-muted-foreground">{properties.label ?? 'Display properties'}</span>
          <div className="flex flex-wrap gap-1">
            {properties.options.map((option) => (
              <Toggle
                key={option.id}
                size="sm"
                variant="outline"
                pressed={!!properties.value[option.id]}
                onPressedChange={(on) => properties.onChange(option.id, on)}
                className="text-muted-foreground data-[state=on]:text-foreground text-xs data-[state=on]:border-transparent"
              >
                {option.label}
              </Toggle>
            ))}
          </div>
        </>
      ),
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative" aria-label={changed ? `${label} options, changed` : `${label} options`}>
          <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          <span className={labelClassName}>{label}</span>
          {changed && <span className="bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn('w-72 gap-3', className)}>
        {sections.map((section, i) => (
          <div
            key={section.key}
            role={section.group && 'group'}
            aria-label={section.group}
            className={cn(section.className, i > 0 && 'border-t pt-3')}
          >
            {section.node}
          </div>
        ))}
        {onReset && (
          <div className={cn('flex justify-end', sections.length > 0 && 'border-t pt-2')}>
            <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={!changed} onClick={onReset}>
              Reset to default
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
