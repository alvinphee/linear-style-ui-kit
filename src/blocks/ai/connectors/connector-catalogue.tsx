import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, GridViewIcon, ListViewIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CONNECTOR_CATEGORIES, ConnectorCard, type Connector, type ConnectorCategory } from './connector-card'

// Every connector to pick from: a search, filter chips (All, Connected, then
// each category that has connectors, then Custom) and the connectors as a
// grid of cards or a list of rows. The grid measures its own box
// (@container), not the window: one column when narrow, two, then three.
// With `onAddCustom`, an "Add custom connector" tile ends the Custom group,
// for a remote MCP server the catalogue does not list. Connectors marked
// `custom` sit in that group, after the others.

export type ConnectorFilter = 'all' | 'connected' | ConnectorCategory

const ORDER = Object.keys(CONNECTOR_CATEGORIES) as ConnectorCategory[]

export function ConnectorCatalogue({
  connectors, onOpen, onAddCustom, view: viewProp, onViewChange, defaultView = 'grid', viewSwitch = true,
  searchPlaceholder = 'Search connectors', actions, className,
}: {
  connectors: Connector[]
  onOpen: (connector: Connector) => void
  // Turns on the "Add custom connector" tile.
  onAddCustom?: () => void
  // Grid of cards or list of rows. Leave out view to let the catalogue keep it.
  view?: 'grid' | 'list'
  onViewChange?: (view: 'grid' | 'list') => void
  defaultView?: 'grid' | 'list'
  viewSwitch?: boolean
  searchPlaceholder?: string
  // More buttons in the toolbar.
  actions?: ReactNode
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ConnectorFilter>('all')
  const [ownView, setOwnView] = useState(defaultView)
  const view = viewProp ?? ownView
  const setView = (v: 'grid' | 'list') => {
    setOwnView(v)
    onViewChange?.(v)
  }

  const q = query.trim().toLowerCase()
  const matching = useMemo(
    () => q
      ? connectors.filter((c) => [c.name, c.description, CONNECTOR_CATEGORIES[c.category], ...c.tools.map((t) => t.name)]
        .some((t) => t.toLowerCase().includes(q)))
      : connectors,
    [connectors, q],
  )
  const isConnected = (c: Connector) => c.status === 'connected' || c.status === 'error'
  const inFilter = (c: Connector) =>
    filter === 'all' ? true : filter === 'connected' ? isConnected(c) : (c.custom ? 'custom' : c.category) === filter
  const shown = matching.filter(inFilter)
  const builtIn = shown.filter((c) => !c.custom)
  const custom = shown.filter((c) => c.custom)

  // Only categories with connectors; their counts follow the search.
  const categoryOf = (c: Connector): ConnectorCategory => (c.custom ? 'custom' : c.category)
  const chips: { value: ConnectorFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: matching.length },
    { value: 'connected', label: 'Connected', count: matching.filter(isConnected).length },
    ...ORDER
      .filter((cat) => connectors.some((c) => categoryOf(c) === cat))
      .map((cat) => ({ value: cat, label: CONNECTOR_CATEGORIES[cat], count: matching.filter((c) => categoryOf(c) === cat).length })),
  ]

  const showAddTile = !!onAddCustom && (filter === 'all' || filter === 'custom')
  const showCustom = custom.length > 0 || showAddTile
  const nothing = shown.length === 0

  const items = (list: Connector[], tile: boolean) => {
    const add = tile && onAddCustom && <AddCustomTile view={view} onClick={onAddCustom} />
    return view === 'grid' ? (
      <ul className="grid grid-cols-1 gap-2 @lg:grid-cols-2 @3xl:grid-cols-3">
        {list.map((c) => (
          <li key={c.id} className="grid min-w-0">
            <ConnectorCard connector={c} onOpen={() => onOpen(c)} />
          </li>
        ))}
        {add && <li className="grid min-w-0">{add}</li>}
      </ul>
    ) : (
      <ul className="bg-card divide-y rounded-lg border">
        {list.map((c) => (
          <li key={c.id} className="min-w-0 first:rounded-t-lg last:rounded-b-lg">
            <ConnectorCard variant="row" connector={c} onOpen={() => onOpen(c)} className="rounded-[inherit]" />
          </li>
        ))}
        {add && <li className="min-w-0 first:rounded-t-lg last:rounded-b-lg">{add}</li>}
      </ul>
    )
  }

  return (
    <div className={cn('@container grid min-w-0 gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} label="Search connectors" className="min-w-0 flex-1 basis-48" />
        {viewSwitch && (
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            onValueChange={(v) => v && setView(v as 'grid' | 'list')}
            aria-label="Show connectors as"
          >
            <ToggleGroupItem value="grid" aria-label="Grid">
              <HugeiconsIcon icon={GridViewIcon} strokeWidth={2} />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List">
              <HugeiconsIcon icon={ListViewIcon} strokeWidth={2} />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        {actions}
      </div>

      <div role="group" aria-label="Filter connectors" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {chips.map((chip) => {
          const active = filter === chip.value
          return (
            <Button
              key={chip.value}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={active}
              onClick={() => setFilter(chip.value)}
              className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
            >
              {chip.label}
              <span className="text-muted-foreground tabular-nums">{chip.count}</span>
            </Button>
          )
        })}
      </div>

      {nothing && !showAddTile ? (
        <Empty className="border py-10">
          <EmptyHeader>
            <EmptyTitle>{q ? 'No connectors match' : filter === 'connected' ? 'Nothing connected yet' : 'No connectors here'}</EmptyTitle>
            <EmptyDescription>
              {q
                ? 'Try another word, or clear the search.'
                : filter === 'connected'
                  ? 'Connect an app and the assistant can use it in your chats.'
                  : 'Pick another filter to see more.'}
            </EmptyDescription>
          </EmptyHeader>
          {(q || filter !== 'all') && (
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                {q && <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
                {filter !== 'all' && <Button variant="outline" size="sm" onClick={() => setFilter('all')}>Show all</Button>}
                {onAddCustom && <Button variant="ghost" size="sm" onClick={onAddCustom}>Add custom connector</Button>}
              </div>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          {builtIn.length > 0 && (
            <section aria-label="Connectors" className="grid min-w-0 gap-1.5">
              {showCustom && <h3 className="text-muted-foreground px-0.5 text-[11px] font-medium">Apps</h3>}
              {items(builtIn, false)}
            </section>
          )}
          {builtIn.length === 0 && q && (
            <p className="text-muted-foreground px-0.5 text-[11px]">No connectors match “{query.trim()}”. Add it as a custom connector.</p>
          )}
          {showCustom && (
            <section aria-label="Custom connectors" className="grid min-w-0 gap-1.5">
              <h3 className="text-muted-foreground px-0.5 text-[11px] font-medium">Custom</h3>
              {items(custom, showAddTile)}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function AddCustomTile({ view, onClick }: { view: 'grid' | 'list'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-accent/40 focus-visible:ring-ring/40 flex min-w-0 items-center gap-3 text-left outline-none transition-colors focus-visible:ring-2',
        view === 'grid' ? 'min-h-24 rounded-lg border border-dashed p-3' : 'w-full rounded-[inherit] px-3 py-2.5',
      )}
    >
      <span className="bg-muted text-foreground grid size-7 shrink-0 place-items-center rounded-md">
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-foreground text-xs font-medium">Add custom connector</span>
        <span className="text-[11px] leading-4">Connect a remote MCP server by its URL.</span>
      </span>
    </button>
  )
}
