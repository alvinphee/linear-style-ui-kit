import { DisplayMenu as DisplayMenuBlock } from '@/blocks/display-menu'
import { JOB_PROPERTIES, ORDERINGS, type Ordering } from '../../job-options'
import { DEFAULT_LIST_DISPLAY, GROUPINGS, sameDisplay, type Grouping, type Layout, type ListDisplay } from './display'

// The app shells' Display menu (the shared block): layout, grouping,
// ordering, a few switches and the properties each row or card shows.
// Everything applies as you change it.
export function DisplayMenu({ display, onChange, layout, onLayout }: {
  display: ListDisplay
  onChange: (display: ListDisplay) => void
  layout: Layout
  onLayout: (layout: Layout) => void
}) {
  const board = layout === 'board'
  // A board has no "No grouping": it shows status columns instead.
  const grouping = board && display.grouping === 'none' ? 'status' : display.grouping
  const set = (patch: Partial<ListDisplay>) => onChange({ ...display, ...patch })

  return (
    <DisplayMenuBlock
      layout={{ value: layout, onChange: (v) => onLayout(v as Layout) }}
      selects={[
        {
          id: 'grouping', label: board ? 'Columns' : 'Grouping', value: grouping,
          options: GROUPINGS.filter((g) => !board || g.id !== 'none'),
          onChange: (v) => set({ grouping: v as Grouping }),
        },
        { id: 'ordering', label: 'Ordering', value: display.ordering, options: ORDERINGS, onChange: (v) => set({ ordering: v as Ordering }) },
      ]}
      switches={[
        {
          id: 'empty', label: board ? 'Show empty columns' : 'Show empty groups', checked: display.showEmpty,
          onChange: (on) => set({ showEmpty: on }),
        },
        { id: 'completed', label: 'Show completed issues', checked: display.showCompleted, onChange: (on) => set({ showCompleted: on }) },
      ]}
      properties={{
        options: JOB_PROPERTIES,
        value: display.properties,
        onChange: (id, on) => set({ properties: { ...display.properties, [id]: on } }),
      }}
      changed={!sameDisplay(display, DEFAULT_LIST_DISPLAY)}
      onReset={() => onChange(DEFAULT_LIST_DISPLAY)}
      labelClassName="hidden @md:inline"
    />
  )
}
