import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SearchField } from '@/components/search-field'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentCard, type AgentStatus } from './agent-card'
import type { Agent, AgentTemplate } from './agent-types'

// Every agent to pick from, in three tabs: Yours (with a Create agent tile
// first), Shared with you (made by colleagues) and Explore (ready-made
// templates, with category chips). One search runs across names and
// descriptions in the open tab. The grid measures its own box (@container),
// not the window: one column when narrow, two, then three. The tab strip
// scrolls sideways on its own when it does not fit.

export type AgentGalleryTab = 'yours' | 'shared' | 'explore'

const TAB_LABELS: Record<AgentGalleryTab, string> = {
  yours: 'Yours',
  shared: 'Shared with you',
  explore: 'Explore',
}

export type AgentGalleryProps = {
  agents: Agent[]
  shared: Agent[]
  templates: AgentTemplate[]
  // An agent's status and when it last ran. Idle and never run when left out.
  statusOf?: (agent: Agent) => { status?: AgentStatus; lastRunAt?: number } | undefined
  onOpen: (agent: Agent) => void
  onCreate: () => void
  onUseTemplate: (template: AgentTemplate) => void
  // Left out: no Chat buttons.
  onChat?: (agent: Agent) => void
  // Left out: no Run now buttons. Only your own agents run from here.
  onRun?: (agent: Agent) => void
  // The menu items for one of your agents (Edit, Duplicate, Delete…).
  menuFor?: (agent: Agent) => ReactNode
  // The open tab, and each switch. Left out: the gallery keeps its own.
  tab?: AgentGalleryTab
  onTabChange?: (tab: AgentGalleryTab) => void
  // Explore's category chips, in this order. Left out: the templates' own.
  categories?: string[]
  // A connector's name from its id, for event triggers: "in Mail".
  connectorName?: (id: string) => string | undefined
  // The clock "2 h ago" is measured from (a demo clock). Now when left out.
  now?: number
  className?: string
}

const GRID = 'grid grid-cols-1 gap-2 @xl:grid-cols-2 @4xl:grid-cols-3'

function matches(item: { name: string; description: string }, q: string) {
  return !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
}

export function AgentGallery({
  agents, shared, templates, statusOf, onOpen, onCreate, onUseTemplate, onChat, onRun, menuFor, tab: tabProp,
  onTabChange, categories: categoriesProp, connectorName, now, className,
}: AgentGalleryProps) {
  const [ownTab, setOwnTab] = useState<AgentGalleryTab>('yours')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const tab = tabProp ?? ownTab
  const changeTab = (next: string) => {
    setOwnTab(next as AgentGalleryTab)
    onTabChange?.(next as AgentGalleryTab)
  }

  const q = query.trim().toLowerCase()
  const yours = useMemo(() => agents.filter((a) => matches(a, q)), [agents, q])
  const theirs = useMemo(() => shared.filter((a) => matches(a, q)), [shared, q])
  const found = useMemo(() => templates.filter((t) => matches(t, q)), [templates, q])
  const categories = useMemo(
    () => categoriesProp ?? [...new Set(templates.map((t) => t.category))],
    [categoriesProp, templates],
  )
  const inCategory = category === 'all' ? found : found.filter((t) => t.category === category)
  const counts: Record<AgentGalleryTab, number> = { yours: yours.length, shared: theirs.length, explore: found.length }

  const clearSearch = q && <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
  const noMatch = (
    <Empty className="border py-10">
      <EmptyHeader>
        <EmptyTitle>Nothing matches “{query.trim()}”</EmptyTitle>
        <EmptyDescription>Try another word, or look in another tab.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{clearSearch}</EmptyContent>
    </Empty>
  )

  const card = (agent: Agent, own: boolean) => {
    const state = statusOf?.(agent)
    return (
      <li key={agent.id} className="grid min-w-0">
        <AgentCard
          agent={agent}
          status={state?.status}
          lastRunAt={state?.lastRunAt}
          owner={own ? undefined : agent.owner}
          onOpen={() => onOpen(agent)}
          onChat={onChat && (() => onChat(agent))}
          onRun={own && onRun ? () => onRun(agent) : undefined}
          menu={own ? menuFor?.(agent) : undefined}
          connectorName={connectorName}
          now={now}
        />
      </li>
    )
  }

  const panes: Record<AgentGalleryTab, ReactNode> = {
    yours: q && !yours.length ? noMatch : !agents.length ? (
      <Empty className="border py-10">
        <EmptyHeader>
          <span className="bg-muted text-foreground mb-1 grid size-9 place-items-center rounded-lg">
            <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} className="size-5" />
          </span>
          <EmptyTitle>No agents yet</EmptyTitle>
          <EmptyDescription>
            An agent is an assistant you set up once: its instructions, knowledge and tools. Describe one, or start from a template.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={onCreate}>Create agent</Button>
            <Button variant="outline" size="sm" onClick={() => changeTab('explore')}>Browse templates</Button>
          </div>
        </EmptyContent>
      </Empty>
    ) : (
      <ul className={GRID}>
        {!q && (
          <li className="grid min-w-0">
            <CreateTile onClick={onCreate} />
          </li>
        )}
        {yours.map((a) => card(a, true))}
      </ul>
    ),
    shared: q && !theirs.length ? noMatch : !shared.length ? (
      <Empty className="border py-10">
        <EmptyHeader>
          <EmptyTitle>Nothing shared with you yet</EmptyTitle>
          <EmptyDescription>Agents your colleagues share with you, or with everyone in the organisation, show here.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
      <ul className={GRID}>{theirs.map((a) => card(a, false))}</ul>
    ),
    explore: (
      <div className="grid min-w-0 gap-3">
        {categories.length > 1 && (
          <div role="group" aria-label="Filter templates" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {[{ value: 'all', label: 'All', count: found.length }, ...categories.map((c) => ({
              value: c, label: c, count: found.filter((t) => t.category === c).length,
            }))].map((chip) => {
              const active = category === chip.value
              return (
                <Button
                  key={chip.value}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setCategory(chip.value)}
                  className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
                >
                  {chip.label}
                  <span className="text-muted-foreground tabular-nums">{chip.count}</span>
                </Button>
              )
            })}
          </div>
        )}
        {inCategory.length ? (
          <ul className={GRID}>
            {inCategory.map((t) => (
              <li key={t.id} className="grid min-w-0">
                <AgentCard
                  variant="template"
                  agent={t}
                  onOpen={() => onUseTemplate(t)}
                  connectorName={connectorName}
                />
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="border py-10">
            <EmptyHeader>
              <EmptyTitle>{q ? `No templates match “${query.trim()}”` : 'No templates here'}</EmptyTitle>
              <EmptyDescription>
                {q ? 'Try another word, or describe the agent you want and it is built for you.' : 'Pick another category to see more.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                {clearSearch}
                {category !== 'all' && <Button variant="outline" size="sm" onClick={() => setCategory('all')}>Show all</Button>}
                <Button variant="ghost" size="sm" onClick={onCreate}>Create agent</Button>
              </div>
            </EmptyContent>
          </Empty>
        )}
      </div>
    ),
  }

  return (
    <Tabs value={tab} onValueChange={changeTab} className={cn('@container min-w-0 gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="-mx-1 min-w-0 max-w-full overflow-x-auto overflow-y-hidden px-1 [scrollbar-width:none]">
          <TabsList aria-label="Agents" className="w-max">
            {(Object.keys(TAB_LABELS) as AgentGalleryTab[]).map((id) => (
              <TabsTrigger key={id} value={id} className="flex-none px-2.5">
                {TAB_LABELS[id]}
                <span className="text-muted-foreground text-[11px] font-normal tabular-nums">{counts[id]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={tab === 'explore' ? 'Search templates' : 'Search agents'}
          label={`Search ${TAB_LABELS[tab].toLowerCase()}`}
          className="min-w-0 flex-1 basis-48"
        />
      </div>
      {(Object.keys(TAB_LABELS) as AgentGalleryTab[]).map((id) => (
        <TabsContent key={id} value={id} className="min-w-0 text-[13px]">
          {panes[id]}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function CreateTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground hover:bg-accent/40 focus-visible:ring-ring/40 flex min-h-36 min-w-0 flex-col items-start justify-center gap-2.5 rounded-lg border border-dashed p-3 text-left outline-none transition-colors focus-visible:ring-2"
    >
      <span className="bg-brand/10 text-brand grid size-7 shrink-0 place-items-center rounded-md">
        <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} className="size-4" />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-foreground text-xs font-medium">Create agent</span>
        <span className="text-[11px] leading-relaxed">Describe what you want and it is built for you.</span>
      </span>
    </button>
  )
}
