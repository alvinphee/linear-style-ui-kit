import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, AiChat02Icon, ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon, ChartLineData01Icon,
  CubeIcon, HelpCircleIcon, Home01Icon, InboxIcon, KanbanIcon, Layers01Icon,
  LeftToRightListBulletIcon, Menu01Icon, Message01Icon, MoreHorizontalIcon,
  PanelLeftCloseIcon, PanelLeftOpenIcon, PencilEdit02Icon, RefreshIcon, Search01Icon, Settings01Icon,
  Share08Icon, SidebarLeftIcon, StarIcon, Task01Icon, Tick02Icon, UnfoldMoreIcon,
  UserAdd01Icon, UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PEOPLE, type Job, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { DisplayMenu } from './app-shell/DisplayMenu'
import { DEFAULT_LIST_DISPLAY, arrangeJobs, type Group, type JobPatch, type Layout, type ListDisplay } from './app-shell/display'
import { IssueBoard, IssueList } from './app-shell/IssueView'
import { NotificationsMenu, useNotifications, type Notifications } from './app-shell/NotificationsMenu'
import { FIELD_ORDER, FilterChip, FilterMenu, applyFilters, type FilterField, type Filters } from './FilterBar'
import { QuickCreateDialog } from './FormModalsSection'
import { JobPeek, openFullPage } from './JobActions'
import { FoldingBreadcrumb, type Crumb } from '@/blocks/folding-breadcrumb'
import { Section } from './shared'
import { Initials } from './StatusSection'

type SidebarStyle = 'teams' | 'rail' | 'inset' | 'icons' | 'top'
type HeaderStyle = 'breadcrumb' | 'title' | 'toolbar' | 'search' | 'crumbs-search'
type Tab = 'all' | 'active' | 'backlog'

const SIDEBARS: { value: SidebarStyle; label: string; note: string }[] = [
  { value: 'teams', label: 'Teams', note: 'Classic: inbox on top, teams that fold open' },
  { value: 'rail', label: 'Rail', note: 'Icon rail for modules, a second panel for pages' },
  { value: 'inset', label: 'Inset', note: 'Content floats in a card, usage and account at the bottom' },
  { value: 'icons', label: 'Icons', note: 'Folds down to icons with tooltips' },
  { value: 'top', label: 'Top nav', note: 'No sidebar: switchers and tabs across the top' },
]

const HEADERS: { value: HeaderStyle; label: string; note: string }[] = [
  { value: 'breadcrumb', label: 'Breadcrumb', note: 'Path, favourite, people and actions' },
  { value: 'title', label: 'Title + tabs', note: 'Big page title with tabs under it' },
  { value: 'toolbar', label: 'Toolbar', note: 'View pills, then a filter row' },
  { value: 'search', label: 'Search', note: 'A search box in the middle' },
  { value: 'crumbs-search', label: 'Crumb + search', note: 'Breadcrumb on the left, search in the middle' },
]

// Made-up workspaces and teams. Pages are ids; team pages are "team:page".
const WORKSPACES = [
  { name: 'Acme', plan: 'Business plan', colour: 'var(--primary)' },
  { name: 'Nimbus Labs', plan: 'Free plan', colour: 'oklch(0.62 0.15 150)' },
  { name: 'Side project', plan: 'Free plan', colour: 'oklch(0.7 0.15 60)' },
]

const TEAMS = [
  { id: 'ops', name: 'Operations', short: 'OP', colour: 'oklch(0.6 0.16 265)' },
  { id: 'design', name: 'Design', short: 'DE', colour: 'oklch(0.65 0.17 330)' },
]

const PAGES: Record<string, { label: string; icon: IconSvgElement }> = {
  home: { label: 'Home', icon: Home01Icon },
  inbox: { label: 'Inbox', icon: InboxIcon },
  'my-issues': { label: 'My issues', icon: UserCircleIcon },
  projects: { label: 'Projects', icon: CubeIcon },
  views: { label: 'Views', icon: Layers01Icon },
  analytics: { label: 'Analytics', icon: ChartLineData01Icon },
  ai: { label: 'Ask AI', icon: AiChat02Icon },
  settings: { label: 'Settings', icon: Settings01Icon },
  issues: { label: 'Issues', icon: Task01Icon },
  cycles: { label: 'Cycles', icon: RefreshIcon },
  urgent: { label: 'Urgent this week', icon: StarIcon },
}

const TEAM_PAGES = ['issues', 'cycles', 'projects']
const INBOX_COUNT = 3

function pageInfo(id: string) {
  const [first, second] = id.split(':')
  const team = second ? TEAMS.find((t) => t.id === first) : undefined
  return { ...PAGES[second ?? first], team }
}

const showsIssues = (id: string) => id === 'my-issues' || id === 'urgent' || id.endsWith(':issues')

// The issues a page starts from, before tabs, filters and search.
function issuesFor(page: string, jobs: Job[]) {
  if (page === 'my-issues') return jobs.filter((j) => j.driver === PEOPLE[0])
  if (page === 'urgent') return jobs.filter((j) => j.priority === 'high' || j.priority === 'urgent')
  return jobs
}

function pageDefaults(page: string): JobPatch {
  if (page === 'my-issues') return { driver: PEOPLE[0] }
  if (page === 'urgent') return { priority: 'urgent' }
  return {}
}

// Rail modules: each icon opens its first page; the panel lists the rest.
const RAIL: { id: string; label: string; icon: IconSvgElement; count?: number; links: { id: string; label: string }[] }[] = [
  { id: 'home', label: 'Home', icon: Home01Icon, links: [{ id: 'home', label: 'Overview' }, { id: 'analytics', label: 'Analytics' }] },
  {
    id: 'issues', label: 'Issues', icon: Task01Icon, links: [
      { id: 'ops:issues', label: 'All issues' }, { id: 'my-issues', label: 'My issues' },
      { id: 'ops:cycles', label: 'Cycles' },
    ],
  },
  { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: INBOX_COUNT, links: [{ id: 'inbox', label: 'Inbox' }] },
  {
    id: 'projects', label: 'Projects', icon: CubeIcon, links: [
      { id: 'projects', label: 'All projects' }, { id: 'ops:projects', label: 'Operations' },
      { id: 'design:projects', label: 'Design' }, { id: 'views', label: 'Views' },
    ],
  },
  { id: 'ai', label: 'Ask AI', icon: AiChat02Icon, links: [{ id: 'ai', label: 'New chat' }] },
]
const RAIL_SETTINGS = { id: 'settings', label: 'Settings', icon: Settings01Icon, links: [{ id: 'settings', label: 'General' }] }

type Nav = { page: string; onPage: (id: string) => void }

export default function AppShellSection() {
  const [sidebar, setSidebar] = useState<SidebarStyle>('teams')
  const [header, setHeader] = useState<HeaderStyle>('breadcrumb')
  // "Folded": the icon style shows icons only; the others hide the sidebar.
  const [folded, setFolded] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [page, setPage] = useState('ops:issues')
  const [workspace, setWorkspace] = useState(WORKSPACES[0])
  const [tab, setTab] = useState<Tab>('all')
  const [view, setView] = useState<Layout>('list')
  const [filters, setFilters] = useState<Filters>({})
  const [display, setDisplay] = useState<ListDisplay>(DEFAULT_LIST_DISPLAY)
  const [query, setQuery] = useState('')
  const [longTrail, setLongTrail] = useState(false)
  const [peekId, setPeekId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const notes = useNotifications()
  const { jobs, addJob, updateJob, select } = useJobs()

  const nav: Nav = {
    page,
    onPage: (id) => {
      setPage(id)
      setSheetOpen(false)
    },
  }
  const ws = { workspace, setWorkspace }

  function chooseSidebar(value: SidebarStyle) {
    setSidebar(value)
    setFolded(value === 'icons')
  }

  const lead = (
    <>
      {sidebar !== 'top' && (
        <Button variant="ghost" size="icon" className="@2xl:hidden" aria-label="Open menu" onClick={() => setSheetOpen(true)}>
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
        </Button>
      )}
      {sidebar !== 'top' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden @2xl:inline-flex"
              aria-label={folded ? 'Open sidebar' : 'Fold sidebar'}
              aria-pressed={folded}
              onClick={() => setFolded((f) => !f)}
            >
              <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{folded ? 'Open sidebar' : sidebar === 'icons' ? 'Show labels' : 'Hide sidebar'}</TooltipContent>
        </Tooltip>
      )}
    </>
  )

  // Each header applies only the controls it shows: tabs and layout (title,
  // toolbar), filters and display options (toolbar), search (the search ones).
  const hasTabs = header === 'title' || header === 'toolbar'
  const toolbar = header === 'toolbar'
  const searching = header === 'search' || header === 'crumbs-search'
  const layout: Layout = hasTabs ? view : 'list'
  const shownDisplay = toolbar ? display : DEFAULT_LIST_DISPLAY
  const statuses = hasTabs ? TABS.find((t) => t.value === tab)?.statuses : null
  const inTab = issuesFor(page, jobs).filter((j) => !statuses || statuses.includes(j.status))
  const activeFilters = toolbar ? filters : {}
  const activeQuery = searching ? query : ''
  const groups = arrangeJobs(applyFilters(inTab, activeFilters, activeQuery), shownDisplay, layout)
  const order = groups.flatMap((g) => g.jobs.map((j) => j.id))
  const narrowed = FIELD_ORDER.some((f) => activeFilters[f]?.length) || activeQuery.trim() !== ''

  // "+" on a group: a blank issue already in that group, opened for editing.
  function addIn(group: Group) {
    const { status, ...rest } = { ...pageDefaults(page), ...group.patch }
    const job = addJob(status ?? (tab === 'backlog' ? 'backlog' : 'todo'), 'Untitled issue')
    if (Object.keys(rest).length) updateJob(job.id, rest)
    setPeekId(job.id)
  }

  const content = (
    <ShellBody
      page={page}
      onPage={nav.onPage}
      groups={groups}
      display={shownDisplay}
      layout={layout}
      narrowed={narrowed}
      onClear={() => {
        setFilters({})
        setQuery('')
      }}
      selectedId={peekId}
      onOpen={setPeekId}
      onOpenFull={(id) => openFullPage(select, id)}
      onAdd={addIn}
    />
  )

  const headerProps: HeaderProps = {
    page, lead, tab, setTab, view, setView, filters, setFilters, display, setDisplay, query, setQuery,
    topNav: sidebar === 'top',
    longTrail,
    onPage: nav.onPage,
    counts: { shown: order.length, total: inTab.length },
    notes,
    onOpenJob: setPeekId,
    onNew: () => setCreateOpen(true),
  }

  const main = (
    <div className="flex min-w-0 flex-1 flex-col">
      {sidebar === 'top' && <TopNav {...nav} {...ws} notes={notes} onOpenJob={setPeekId} />}
      <ContentHeader variant={header} {...headerProps} />
      <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
    </div>
  )

  return (
    <Section id="app-shell" title="App shells" description="Sidebar and header variations. Mix any sidebar with any header.">
      <div className="bg-card grid gap-x-6 gap-y-2 rounded-lg border px-3 py-2.5 lg:col-span-2 sm:flex sm:flex-wrap sm:items-start">
        <Picker
          label="Sidebar"
          value={sidebar}
          options={SIDEBARS}
          onChange={(v) => chooseSidebar(v as SidebarStyle)}
        />
        <Picker
          label="Header"
          value={header}
          options={HEADERS}
          onChange={(v) => setHeader(v as HeaderStyle)}
        />
        <div className="grid min-w-0 gap-1.5">
          <span className="text-muted-foreground text-[11px]">Stress test</span>
          <label className="flex h-6 items-center gap-2 text-xs">
            <Switch checked={longTrail} onCheckedChange={setLongTrail} />
            Long breadcrumb
          </label>
          <span className="text-muted-foreground text-[11px]">Try it with Breadcrumb or Crumb + search</span>
        </div>
      </div>

      <div className="@container lg:col-span-2">
        <div
          className={cn(
            'text-foreground relative flex h-[34rem] overflow-hidden rounded-lg border',
            sidebar === 'inset' ? 'bg-sidebar' : 'bg-background',
          )}
        >
          {sidebar === 'teams' && !folded && (
            <aside className="bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-r @2xl:flex">
              <TeamsSidebar {...nav} {...ws} onNew={() => setCreateOpen(true)} />
            </aside>
          )}
          {sidebar === 'rail' && !folded && (
            <div className="hidden shrink-0 @2xl:flex">
              <RailSidebar {...nav} />
            </div>
          )}
          {sidebar === 'inset' && !folded && (
            <aside className="text-sidebar-foreground hidden w-56 shrink-0 flex-col @2xl:flex">
              <InsetSidebar {...nav} {...ws} />
            </aside>
          )}
          {sidebar === 'icons' && (
            <aside
              className={cn(
                'bg-sidebar text-sidebar-foreground hidden shrink-0 flex-col border-r transition-[width] duration-200 @2xl:flex',
                folded ? 'w-12' : 'w-52',
              )}
            >
              <IconsSidebar {...nav} iconOnly={folded} onToggle={() => setFolded((f) => !f)} />
            </aside>
          )}

          {sidebar === 'inset' ? (
            <div className="flex min-w-0 flex-1 p-2 @2xl:pl-0">
              <div className="bg-background flex min-w-0 flex-1 overflow-hidden rounded-lg border shadow-sm">{main}</div>
            </div>
          ) : main}
        </div>
      </div>

      <p className="text-muted-foreground text-[11px] leading-4 lg:col-span-2">
        Built by hand here so all five fit in one frame. In a real app, shadcn's <code>sidebar</code> component
        covers the same ground: <code>variant</code> is <code>sidebar</code>, <code>floating</code> or{' '}
        <code>inset</code>, and <code>collapsible</code> is <code>icon</code>, <code>offcanvas</code> or{' '}
        <code>none</code>. Narrow the window to see the menu button and the sheet.
      </p>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="bg-sidebar text-sidebar-foreground gap-0 p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Pages in this demo workspace.</SheetDescription>
          {sidebar === 'inset' ? <InsetSidebar {...nav} {...ws} /> : <TeamsSidebar {...nav} {...ws} onNew={() => setCreateOpen(true)} />}
        </SheetContent>
      </Sheet>
      <JobPeek jobId={peekId} order={order} onNavigate={setPeekId} onClose={() => setPeekId(null)} />
      <QuickCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Section>
  )
}

function Picker({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string; note: string }[]
  onChange: (value: string) => void
}) {
  const current = options.find((o) => o.value === value)
  return (
    <div className="grid min-w-0 gap-1.5">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        value={value}
        onValueChange={(v) => v && onChange(v)}
        aria-label={`${label} style`}
        className="max-w-full flex-wrap"
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value}>{o.label}</ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="text-muted-foreground truncate text-[11px]">{current?.note}</span>
    </div>
  )
}

// Shared bits

function NavItem({ icon, label, active, count, iconOnly, mark, onClick }: {
  icon: IconSvgElement
  label: string
  active?: boolean
  count?: number
  iconOnly?: boolean
  mark?: ReactNode
  onClick: () => void
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      data-active={!!active}
      aria-current={active ? 'page' : undefined}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        'hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:ring-ring/50 relative flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2',
        iconOnly && 'justify-center px-0',
      )}
    >
      {mark ?? <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0 opacity-80" />}
      {!iconOnly && <span className="truncate">{label}</span>}
      {!iconOnly && !!count && <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{count}</span>}
      {iconOnly && !!count && <span className="bg-primary absolute top-1 right-1.5 size-1.5 rounded-full" />}
    </button>
  )
  if (!iconOnly) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}{count ? ` · ${count}` : ''}</TooltipContent>
    </Tooltip>
  )
}

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-3">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground flex h-6 flex-1 items-center gap-1 rounded px-2 text-[11px] font-medium"
        >
          {title}
          <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3" />
        </button>
        {action}
      </div>
      {open && <div className="mt-0.5 grid gap-px">{children}</div>}
    </div>
  )
}

function Mark({ short, colour, className }: { short: string; colour: string; className?: string }) {
  return (
    <span
      className={cn('grid size-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-semibold text-white', className)}
      style={{ background: colour }}
    >
      {short}
    </span>
  )
}

type Ws = { workspace: (typeof WORKSPACES)[number]; setWorkspace: (w: (typeof WORKSPACES)[number]) => void }

function WorkspaceMenu({ workspace, setWorkspace, children }: Ws & { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {WORKSPACES.map((w) => (
          <DropdownMenuItem key={w.name} onSelect={() => setWorkspace(w)}>
            <Mark short={w.name.slice(0, 1)} colour={w.colour} className="size-5 text-[9px]" />
            <span className="flex-1">{w.name}</span>
            {w.name === workspace.name && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast('Create workspace', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchButton() {
  return (
    <button
      type="button"
      onClick={() => toast('Search', { description: 'Ctrl+K opens the real command menu.' })}
      className="text-muted-foreground hover:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md border px-2 text-xs"
    >
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5" />
      Search…
      <KbdGroup className="ml-auto">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </button>
  )
}

// 1. Teams: the classic layout

function TeamsSidebar({ page, onPage, onNew, ...ws }: Nav & Ws & { onNew: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({ design: true })
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1 px-2">
        <WorkspaceMenu {...ws}>
          <button
            type="button"
            className="hover:bg-sidebar-accent flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left outline-none focus-visible:ring-2"
          >
            <Mark short={ws.workspace.name.slice(0, 1)} colour={ws.workspace.colour} className="size-5 text-[9px]" />
            <span className="truncate text-[13px] font-medium">{ws.workspace.name}</span>
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
          </button>
        </WorkspaceMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="New issue" onClick={onNew}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New issue <span className="ml-1 opacity-70">C</span></TooltipContent>
        </Tooltip>
      </div>
      <div className="px-2"><SearchButton /></div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <div className="mt-3 grid gap-px">
          <NavItem icon={InboxIcon} label="Inbox" count={INBOX_COUNT} active={page === 'inbox'} onClick={() => onPage('inbox')} />
          <NavItem icon={UserCircleIcon} label="My issues" active={page === 'my-issues'} onClick={() => onPage('my-issues')} />
        </div>
        <Group title="Workspace">
          <NavItem icon={CubeIcon} label="Projects" active={page === 'projects'} onClick={() => onPage('projects')} />
          <NavItem icon={Layers01Icon} label="Views" active={page === 'views'} onClick={() => onPage('views')} />
        </Group>
        <Group title="Favourites">
          <NavItem
            icon={StarIcon}
            label="Urgent this week"
            active={page === 'urgent'}
            onClick={() => onPage('urgent')}
          />
        </Group>
        <Group title="Your teams">
          {TEAMS.map((team) => {
            const open = !closed[team.id]
            return (
              <div key={team.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setClosed((c) => ({ ...c, [team.id]: open }))}
                  className="hover:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs"
                >
                  <Mark short={team.short} colour={team.colour} />
                  <span className="truncate">{team.name}</span>
                  <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />
                </button>
                {open && (
                  <div className="grid gap-px py-px pl-4">
                    {TEAM_PAGES.map((p) => (
                      <NavItem
                        key={p}
                        icon={PAGES[p].icon}
                        label={PAGES[p].label}
                        active={page === `${team.id}:${p}`}
                        onClick={() => onPage(`${team.id}:${p}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </Group>
      </nav>

      <div className="flex items-center gap-1 border-t p-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toast('Invite people', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" /> Invite
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground ml-auto" aria-label="Help" onClick={() => toast('Help', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

// 2. Rail and panel

function RailSidebar({ page, onPage }: Nav) {
  const current = [...RAIL, RAIL_SETTINGS].find((m) => m.links.some((l) => l.id === page)) ?? RAIL[1]

  function railButton(m: (typeof RAIL)[number]) {
    const active = m.id === current.id
    return (
      <Tooltip key={m.id}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={m.label}
            aria-current={active ? 'page' : undefined}
            data-active={active}
            onClick={() => onPage(m.links[0].id)}
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-foreground focus-visible:ring-ring/50 relative grid size-8 place-items-center rounded-md outline-none focus-visible:ring-2"
          >
            <HugeiconsIcon icon={m.icon} strokeWidth={2} className="size-4" />
            {active && <span className="bg-primary absolute top-1.5 -left-2 h-5 w-0.5 rounded-full" />}
            {!!m.count && <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{m.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <div className="bg-sidebar flex w-12 shrink-0 flex-col items-center gap-1 border-r py-2">
        <Mark short="A" colour="var(--primary)" className="mb-2 size-6 text-[10px]" />
        {RAIL.map(railButton)}
        <div className="mt-auto grid gap-1">
          {railButton(RAIL_SETTINGS)}
          <Initials name={PEOPLE[0]} className="mt-1" />
        </div>
      </div>
      <aside className="bg-sidebar/40 text-sidebar-foreground flex w-48 shrink-0 flex-col border-r">
        <div className="flex h-11 shrink-0 items-center justify-between px-3">
          <span className="text-[13px] font-medium">{current.label}</span>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={`New in ${current.label}`} onClick={() => toast('Create', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
        </div>
        <nav className="grid gap-px px-2">
          {current.links.map((l) => (
            <NavItem key={l.id} icon={pageInfo(l.id).icon} label={l.label} active={page === l.id} onClick={() => onPage(l.id)} />
          ))}
        </nav>
        {current.id === 'issues' && (
          <div className="px-2">
            <Group title="Teams">
              {TEAMS.map((t) => (
                <NavItem
                  key={t.id}
                  icon={Task01Icon}
                  mark={<Mark short={t.short} colour={t.colour} />}
                  label={t.name}
                  active={page === `${t.id}:issues` && !current.links.some((l) => l.id === page)}
                  onClick={() => onPage(`${t.id}:issues`)}
                />
              ))}
            </Group>
          </div>
        )}
      </aside>
    </>
  )
}

// 3. Inset: the content sits in a card on the sidebar's colour

function InsetSidebar({ page, onPage, ...ws }: Nav & Ws) {
  const items = ['home', 'inbox', 'my-issues', 'projects', 'analytics', 'ai']
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <WorkspaceMenu {...ws}>
          <button
            type="button"
            className="hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md p-1.5 text-left outline-none focus-visible:ring-2"
          >
            <Mark short={ws.workspace.name.slice(0, 1)} colour={ws.workspace.colour} className="size-7 rounded-md text-xs" />
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-[13px] font-medium">{ws.workspace.name}</span>
              <span className="text-muted-foreground truncate text-[11px]">{ws.workspace.plan}</span>
            </span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          </button>
        </WorkspaceMenu>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2">
        <Group title="Platform">
          {items.map((id) => {
            const info = pageInfo(id)
            return (
              <NavItem
                key={id}
                icon={info.icon}
                label={info.label}
                count={id === 'inbox' ? INBOX_COUNT : undefined}
                active={page === id}
                onClick={() => onPage(id)}
              />
            )
          })}
        </Group>
        <Group title="Teams">
          {TEAMS.map((t) => (
            <NavItem
              key={t.id}
              icon={Task01Icon}
              mark={<Mark short={t.short} colour={t.colour} />}
              label={t.name}
              active={page === `${t.id}:issues`}
              onClick={() => onPage(`${t.id}:issues`)}
            />
          ))}
        </Group>
      </nav>

      <div className="grid gap-2 p-2">
        <div className="bg-background/60 grid gap-2 rounded-lg border p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium">Issues used</span>
            <span className="text-muted-foreground tabular-nums">180 / 250</span>
          </div>
          <Progress value={72} className="h-1" />
          <Button size="sm" variant="outline" onClick={() => toast('Upgrade', { description: 'Demo only.' })}>Upgrade plan</Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hover:bg-sidebar-accent flex items-center gap-2 rounded-md p-1.5 text-left outline-none focus-visible:ring-2">
              <Initials name={PEOPLE[0]} className="size-7" />
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-xs font-medium">{PEOPLE[0]}</span>
                <span className="text-muted-foreground truncate text-[11px]">ravi@example.com</span>
              </span>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <DropdownMenuItem onSelect={() => onPage('settings')}>
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Logged out', { description: 'Demo only.' })}>
              <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} /> Switch account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// 4. Icons: folds down to a strip of icons

function IconsSidebar({ page, onPage, iconOnly, onToggle }: Nav & { iconOnly: boolean; onToggle: () => void }) {
  const main = ['home', 'inbox', 'my-issues', 'ops:issues', 'ops:cycles', 'projects', 'analytics']
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={cn('flex h-11 shrink-0 items-center gap-2', iconOnly ? 'justify-center' : 'px-3')}>
        <Mark short="A" colour="var(--primary)" className="size-6 text-[10px]" />
        {!iconOnly && <span className="truncate text-[13px] font-medium">Acme</span>}
      </div>
      <nav className="grid min-h-0 flex-1 content-start gap-px overflow-y-auto px-2">
        {main.map((id) => {
          const info = pageInfo(id)
          return (
            <NavItem
              key={id}
              icon={info.icon}
              label={info.team ? `${info.team.name} ${info.label.toLowerCase()}` : info.label}
              count={id === 'inbox' ? INBOX_COUNT : undefined}
              active={page === id}
              iconOnly={iconOnly}
              onClick={() => onPage(id)}
            />
          )
        })}
        <div className="bg-border mx-1 my-2 h-px" />
        <NavItem icon={AiChat02Icon} label="Ask AI" active={page === 'ai'} iconOnly={iconOnly} onClick={() => onPage('ai')} />
      </nav>
      <div className="grid gap-px border-t p-2">
        <NavItem icon={Settings01Icon} label="Settings" active={page === 'settings'} iconOnly={iconOnly} onClick={() => onPage('settings')} />
        <NavItem
          icon={iconOnly ? PanelLeftOpenIcon : PanelLeftCloseIcon}
          label={iconOnly ? 'Show labels' : 'Fold to icons'}
          iconOnly={iconOnly}
          onClick={onToggle}
        />
      </div>
    </div>
  )
}

// 5. Top nav: no sidebar

function TopNav({ page, onPage, notes, onOpenJob, ...ws }: Nav & Ws & { notes: Notifications; onOpenJob: (id: string) => void }) {
  const info = pageInfo(page)
  const team = info.team ?? TEAMS[0]
  const tabs = [
    { id: 'home', label: 'Overview' },
    { id: `${team.id}:issues`, label: 'Issues' },
    { id: `${team.id}:cycles`, label: 'Cycles' },
    { id: 'inbox', label: 'Inbox' },
    { id: 'projects', label: 'Projects' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ]
  return (
    <div className="shrink-0 border-b">
      <div className="flex h-11 items-center gap-1.5 px-3">
        <Mark short="A" colour="var(--primary)" className="size-6 text-[10px]" />
        <span className="text-muted-foreground/40 px-0.5 text-base font-light">/</span>
        <WorkspaceMenu {...ws}>
          <button type="button" className="hover:bg-accent flex h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium">
            <span className="truncate">{ws.workspace.name}</span>
            <span className="text-muted-foreground hidden rounded border px-1 text-[10px] font-normal @md:inline">{ws.workspace.plan.replace(' plan', '')}</span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3" />
          </button>
        </WorkspaceMenu>
        <span className="text-muted-foreground/40 hidden px-0.5 text-base font-light @md:inline">/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hover:bg-accent hidden h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium @md:flex">
              <Mark short={team.short} colour={team.colour} />
              <span className="truncate">{team.name}</span>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Teams</DropdownMenuLabel>
            {TEAMS.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => onPage(`${t.id}:issues`)}>
                <Mark short={t.short} colour={t.colour} />
                <span className="flex-1">{t.name}</span>
                {t.id === team.id && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-muted-foreground hidden @3xl:inline-flex" onClick={() => toast('Feedback', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={Message01Icon} strokeWidth={2} data-icon="inline-start" /> Feedback
          </Button>
          <NotificationsMenu notes={notes} onOpenJob={onOpenJob} />
          <Initials name={PEOPLE[0]} />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none]" aria-label="Sections">
        {tabs.map((t) => {
          const active = page === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPage(t.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative h-9 shrink-0 rounded-md px-2 text-xs transition-colors',
                active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {active && <span className="bg-foreground absolute inset-x-2 bottom-0 h-0.5 rounded-full" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// Content headers

type HeaderProps = {
  page: string
  lead: ReactNode
  tab: Tab
  setTab: (t: Tab) => void
  view: Layout
  setView: (v: Layout) => void
  filters: Filters
  setFilters: (f: Filters) => void
  display: ListDisplay
  setDisplay: (d: ListDisplay) => void
  query: string
  setQuery: (q: string) => void
  topNav: boolean
  longTrail: boolean
  onPage: (id: string) => void
  counts: { shown: number; total: number }
  notes: Notifications
  onOpenJob: (id: string) => void
  onNew: () => void
}

const TABS: { value: Tab; label: string; statuses: Status[] | null }[] = [
  { value: 'all', label: 'All issues', statuses: null },
  { value: 'active', label: 'Active', statuses: ['todo', 'progress'] },
  { value: 'backlog', label: 'Backlog', statuses: ['backlog'] },
]

function NewButton({ label = 'New issue', onClick }: { label?: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
      <span className="hidden @lg:inline">{label}</span>
    </Button>
  )
}

function ViewSwitch({ view, setView }: Pick<HeaderProps, 'view' | 'setView'>) {
  return (
    <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={view} onValueChange={(v) => v && setView(v as Layout)} aria-label="View">
      <ToggleGroupItem value="list" aria-label="List">
        <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} />
      </ToggleGroupItem>
      <ToggleGroupItem value="board" aria-label="Board">
        <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

function ContentHeader({ variant, ...p }: HeaderProps & { variant: HeaderStyle }) {
  const info = pageInfo(p.page)
  const issues = showsIssues(p.page)
  const { jobs } = useJobs()
  const pool = issuesFor(p.page, jobs)

  if (variant === 'title') {
    return (
      <div className="shrink-0 border-b px-3 pt-2 @lg:px-5">
        <div className="flex items-center gap-1">
          {p.lead}
          <div className="ml-auto flex items-center gap-1.5">
            {issues && <ViewSwitch view={p.view} setView={p.setView} />}
            <NewButton onClick={p.onNew} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <HugeiconsIcon icon={info.icon} strokeWidth={2} className="text-muted-foreground size-4" />
          <h3 className="text-base font-semibold tracking-tight">{info.label}</h3>
          {info.team && <span className="text-muted-foreground text-xs">· {info.team.name}</span>}
        </div>
        <p className="text-muted-foreground pt-0.5 pb-2 text-xs">
          {issues ? 'Everything the team is working on, newest first.' : `The ${info.label.toLowerCase()} page of this demo workspace.`}
        </p>
        {issues ? (
          <Tabs value={p.tab} onValueChange={(v) => p.setTab(v as Tab)}>
            <TabsList variant="line" className="-mb-px h-8 px-0">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="flex-none px-2">
                  {t.label}
                  <span className="text-muted-foreground tabular-nums">{t.statuses ? pool.filter((j) => t.statuses!.includes(j.status)).length : pool.length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : <div className="h-1" />}
      </div>
    )
  }

  if (variant === 'toolbar') {
    const active = FIELD_ORDER.filter((f) => p.filters[f]?.length)
    const setField = (field: FilterField, values: string[]) => {
      const next = { ...p.filters }
      if (values.length) next[field] = values
      else delete next[field]
      p.setFilters(next)
    }
    const toggleValue = (field: FilterField, value: string) => {
      const current = p.filters[field] ?? []
      setField(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
    }
    const { shown, total } = p.counts
    return (
      <div className="shrink-0 border-b">
        <div className="flex h-11 items-center gap-1 border-b px-2 @lg:px-3">
          {p.lead}
          <span className="mr-1 shrink-0 text-xs font-medium">{info.label}</span>
          {issues && (
            <div role="group" aria-label="Views" className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
              {TABS.map((t) => (
                <Button
                  key={t.value}
                  variant={p.tab === t.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('shrink-0 rounded-full', p.tab !== t.value && 'text-muted-foreground')}
                  aria-pressed={p.tab === t.value}
                  onClick={() => p.setTab(t.value)}
                >
                  {t.label}
                  <span className="text-muted-foreground tabular-nums">
                    {t.statuses ? pool.filter((j) => t.statuses!.includes(j.status)).length : pool.length}
                  </span>
                </Button>
              ))}
            </div>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            {!p.topNav && <NotificationsMenu notes={p.notes} onOpenJob={p.onOpenJob} />}
            <NewButton onClick={p.onNew} />
          </div>
        </div>
        {issues && (
          <div className="flex min-h-9 flex-wrap items-center gap-1.5 px-2 py-1.5 @lg:px-3">
            <FilterMenu filters={p.filters} onToggle={toggleValue} />
            {active.map((field) => (
              <FilterChip key={field} field={field} values={p.filters[field]!} onChange={(v) => setField(field, v)} />
            ))}
            {active.length > 0 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => p.setFilters({})}>
                Clear
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-muted-foreground hidden text-[11px] whitespace-nowrap tabular-nums @xl:inline" aria-live="polite">
                {active.length ? `${shown} of ${total}` : `${shown} ${shown === 1 ? 'issue' : 'issues'}`}
              </span>
              <ViewSwitch view={p.view} setView={p.setView} />
              <DisplayMenu display={p.display} onChange={p.setDisplay} layout={p.view} onLayout={p.setView} />
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'search') {
    return (
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2 @lg:px-3">
        {p.lead}
        <span className="hidden truncate text-xs font-medium @xl:inline @xl:w-28">{info.label}</span>
        <SearchBox query={p.query} setQuery={p.setQuery} issues={issues} className="mx-auto h-8 w-full max-w-md" />
        <div className="flex items-center gap-1 @xl:w-28 @xl:justify-end">
          {!p.topNav && (
            <>
              <Button variant="ghost" size="icon" className="hidden @md:inline-flex" aria-label="Help" onClick={() => toast('Help', { description: 'Demo only.' })}>
                <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
              </Button>
              <NotificationsMenu notes={p.notes} onOpenJob={p.onOpenJob} />
              <Initials name={PEOPLE[0]} />
            </>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'crumbs-search') return <CrumbsSearchHeader {...p} info={info} issues={issues} />

  // Breadcrumb
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b px-2 @lg:px-3">
      {p.lead}
      <Crumbs info={info} long={p.longTrail} onPage={p.onPage} more />
      <div className="ml-auto flex items-center gap-1.5">
        <AvatarGroup className="mr-1 hidden @3xl:flex">
          {PEOPLE.slice(0, 3).map((name) => <Initials key={name} name={name} className="size-6" />)}
          <AvatarGroupCount className="size-6 text-[10px]">+{PEOPLE.length - 3}</AvatarGroupCount>
        </AvatarGroup>
        <Button variant="outline" size="sm" className="hidden @xl:inline-flex" onClick={() => toast('Link copied', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" /> Share
        </Button>
        <NewButton onClick={p.onNew} />
      </div>
    </div>
  )
}

// Breadcrumb on the left, search in the middle. The trail can never run into
// the box: it folds to fit its half (see Crumbs), and the box keeps a
// minimum width. From @3xl a three-column
// grid keeps the box centred. On a phone the box becomes an icon that opens
// over the whole header.
function CrumbsSearchHeader({ info, issues, ...p }: HeaderProps & { info: ReturnType<typeof pageInfo>; issues: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex h-11 shrink-0 items-center gap-2 border-b px-2 @lg:px-3 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {p.lead}
        <Crumbs info={info} long={p.longTrail} onPage={p.onPage} />
      </div>
      <SearchBox query={p.query} setQuery={p.setQuery} issues={issues} className="hidden h-7 max-w-80 min-w-40 flex-1 @md:flex @3xl:max-w-none" />
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="relative @md:hidden" aria-label="Search" onClick={() => setOpen(true)}>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          {p.query && <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" />}
        </Button>
        <Button variant="outline" size="sm" className="hidden @4xl:inline-flex" onClick={() => toast('Link copied', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" /> Share
        </Button>
        {!p.topNav && (
          <NotificationsMenu notes={p.notes} onOpenJob={p.onOpenJob} className="hidden @xl:inline-flex" />
        )}
        <NewButton onClick={p.onNew} />
      </div>
      {open && (
        <div
          className="bg-background absolute inset-0 z-10 flex items-center gap-2 px-2 @md:hidden"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          <SearchBox query={p.query} setQuery={p.setQuery} issues={issues} autoFocus className="h-8 flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      )}
    </div>
  )
}

type TrailItem = { label: string; team?: (typeof TEAMS)[number]; page?: string }

// The parents above the current page. "Long" adds a workspace and a project
// with long names, to show how the trail folds.
function trailFor(info: ReturnType<typeof pageInfo>, long?: boolean): TrailItem[] {
  const trail: TrailItem[] = []
  if (long) trail.push({ label: 'Acme Logistics International' })
  if (info.team) {
    trail.push({ label: long ? `${info.team.name} and Warehousing` : info.team.name, team: info.team, page: `${info.team.id}:issues` })
  }
  if (long) trail.push({ label: 'Warehouse relocation, phase 2 of 3' })
  return trail
}

// The trail itself is the shared FoldingBreadcrumb block (src/blocks), the
// same one the ERP template's header uses.
function Crumbs({ info, more, long, onPage }: {
  info: ReturnType<typeof pageInfo>
  more?: boolean
  long?: boolean
  onPage: (id: string) => void
}) {
  const trail: Crumb[] = trailFor(info, long).map((c) => ({
    id: c.label,
    label: c.label,
    icon: c.team && <Mark short={c.team.short} colour={c.team.colour} />,
    onSelect: () => (c.page ? onPage(c.page) : toast(c.label, { description: 'Demo only.' })),
  }))

  return (
    <>
      <FoldingBreadcrumb trail={trail} current={info.label} />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground shrink-0" aria-label="Add to favourites" onClick={() => toast('Added to favourites', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add to favourites</TooltipContent>
      </Tooltip>
      {more && (
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hidden shrink-0 @md:inline-flex" aria-label="More" onClick={() => toast('More actions', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      )}
    </>
  )
}

function SearchBox({ query, setQuery, issues, autoFocus, className }: {
  query: string
  setQuery: (q: string) => void
  issues: boolean
  autoFocus?: boolean
  className?: string
}) {
  return (
    <label className={cn('bg-muted/50 focus-within:ring-ring/50 flex min-w-0 items-center gap-2 rounded-md border px-2.5 focus-within:ring-2', className)}>
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={issues ? 'Search issues…' : 'Search…'}
        aria-label="Search issues"
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs outline-none"
      />
      {query ? (
        <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
        </button>
      ) : (
        <KbdGroup className="hidden @md:inline-flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      )}
    </label>
  )
}

// Content: the issue list or board, or a placeholder for other pages

function ShellBody({ page, onPage, groups, display, layout, narrowed, onClear, selectedId, onOpen, onOpenFull, onAdd }: {
  page: string
  onPage: (id: string) => void
  groups: Group[]
  display: ListDisplay
  layout: Layout
  narrowed: boolean
  onClear: () => void
  selectedId: string | null
  onOpen: (id: string) => void
  onOpenFull: (id: string) => void
  onAdd: (group: Group) => void
}) {
  const info = pageInfo(page)

  if (!showsIssues(page)) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={info.icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{info.team ? `${info.team.name} ${info.label.toLowerCase()}` : info.label}</EmptyTitle>
          <EmptyDescription>This demo only fills the Issues pages. The sidebar and header still work.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => onPage('ops:issues')}>Go to issues</Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (!groups.some((g) => g.jobs.length)) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyTitle>{narrowed ? 'No issues match' : 'No issues here'}</EmptyTitle>
          <EmptyDescription>{narrowed ? 'Try fewer filters, or clear them.' : 'Create one, or switch view.'}</EmptyDescription>
        </EmptyHeader>
        {narrowed && (
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={onClear}>Clear filters</Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  const props = { groups, display, selectedId, onOpen, onOpenFull, onAdd }
  return layout === 'board' ? <IssueBoard {...props} /> : <IssueList {...props} />
}
