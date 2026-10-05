import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { KanbanIcon, LeftToRightListBulletIcon } from '@hugeicons/core-free-icons'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Switches how a page shows its records: list or board, or any other views.
// Icon-only by default (each named for screen readers); `showLabels` adds
// the names beside the icons, for a page header with room to spare.

export type ViewOption<V extends string = string> = { value: V; label: string; icon: IconSvgElement }

// The usual pair, for <ViewSwitch views={LIST_BOARD_VIEWS} … />.
export const LIST_BOARD_VIEWS: ViewOption<'list' | 'board'>[] = [
  { value: 'list', label: 'List', icon: LeftToRightListBulletIcon },
  { value: 'board', label: 'Board', icon: KanbanIcon },
]

export function ViewSwitch<V extends string>({ views, value, onChange, showLabels, label = 'View', className }: {
  views: ViewOption<V>[]
  value: V
  onChange: (value: V) => void
  showLabels?: boolean
  // The group's accessible name.
  label?: string
  className?: string
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as V)}
      aria-label={label}
      className={className}
    >
      {views.map((view) => (
        <ToggleGroupItem
          key={view.value}
          value={view.value}
          aria-label={showLabels ? undefined : view.label}
          className={showLabels ? 'text-xs' : undefined}
        >
          <HugeiconsIcon icon={view.icon} strokeWidth={2} data-icon={showLabels ? 'inline-start' : undefined} />
          {showLabels && view.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
