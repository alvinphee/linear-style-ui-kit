import { useState, type ComponentProps, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, AiChat02Icon, ChartLineData01Icon, ComputerIcon, CubeIcon, HelpCircleIcon, Home01Icon, InboxIcon,
  Layers01Icon, Menu01Icon, Message01Icon, Moon02Icon, MoreHorizontalIcon, PaintBoardIcon, PanelLeftCloseIcon,
  PanelLeftOpenIcon, PencilEdit02Icon, RefreshIcon, Search01Icon, Settings01Icon, Share08Icon, SidebarLeftIcon,
  StarIcon, Sun03Icon, Task01Icon, Tick02Icon, UnfoldMoreIcon, UserAdd01Icon, UserCircleIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AccountMenu } from '@/blocks/account-menu'
import { FilterBar as FilterBarBlock, activeFields } from '@/blocks/filter-bar'
import { FoldingBreadcrumb, type Crumb } from '@/blocks/folding-breadcrumb'
import { GlobalHeader } from '@/blocks/global-header'
import { WorkspaceSwitcher, type WorkspaceOption } from '@/blocks/workspace-switcher'
import { IconAction } from '@/components/icon-action'
import { LetterMark } from '@/components/mark'
import { NavGroup, NavItem } from '@/components/nav-item'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/person'
import { SearchField } from '@/components/search-field'
import { SearchTrigger } from '@/components/search-trigger'
import { MOD, Shortcut } from '@/components/shortcut'
import { ThemeToggle } from '@/components/theme-toggle'
import { UsageMeter } from '@/components/usage-meter'
import { LIST_BOARD_VIEWS, ViewSwitch } from '@/components/view-switch'
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme, type Theme } from '@/lib/theme'
import { PEOPLE, type Job, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { DisplayMenu } from './app-shell/DisplayMenu'
import { DEFAULT_LIST_DISPLAY, arrangeJobs, type Group, type JobPatch, type Layout, type ListDisplay } from './app-shell/display'
import { IssueBoard, IssueList } from './app-shell/IssueView'
import { NotificationsMenu, useNotifications, type Notifications } from './app-shell/NotificationsMenu'
import { FILTER_FIELDS, applyFilters, type Filters } from './FilterBar'
import { QuickCreateDialog } from './FormModalsSection'
import { JobPeek, openFullPage } from './JobActions'
import { Section } from './shared'

type SidebarStyle = 'teams' | 'rail' | 'inset' | 'icons' | 'top'
type HeaderStyle = 'breadcrumb' | 'title' | 'toolbar' | 'search' | 'crumbs-search' | 'two-rows'
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
  { value: 'two-rows', label: 'Two rows', note: 'Search and account on a top row, the breadcrumb on a row under it' },
]

// Made-up workspaces and teams. Pages are ids; team pages are "team:page".
const WORKSPACES: (WorkspaceOption & { plan: string })[] = [
  { id: 'acme', name: 'Acme', plan: 'Business plan', colour: 'var(--primary)' },
  { id: 'nimbus', name: 'Nimbus Labs', plan: 'Free plan', colour: 'oklch(0.62 0.15 150)' },
  { id: 'side', name: 'Side project', plan: 'Free plan', colour: 'oklch(0.7 0.15 60)' },
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
  const [overSidebar, setOverSidebar] = useState(false)
  const [footAccount, setFootAccount] = useState(false)
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
        // aria-pressed rather than `pressed`: the button keeps its plain look either way.
        <IconAction
          label={sidebar === 'icons' ? (folded ? 'Show labels' : 'Fold to icons') : folded ? 'Open sidebar' : 'Hide sidebar'}
          icon={SidebarLeftIcon}
          size="icon"
          aria-pressed={folded}
          onClick={() => setFolded((f) => !f)}
          className="text-foreground hidden @2xl:inline-flex"
        />
      )}
    </>
  )

  // Each header applies only the controls it shows: tabs and layout (title,
  // toolbar), filters and display options (toolbar), search (the search ones).
  const hasTabs = header === 'title' || header === 'toolbar'
  const toolbar = header === 'toolbar'
  const twoRows = header === 'two-rows'
  // Two rows: the top row sits over the page only, the sidebar keeping its
  // full height (content), or across the whole app, over the sidebar (app).
  const topRow = twoRows ? (overSidebar ? 'app' : 'content') : undefined
  // A sidebar beside the page (from @2xl). Without one, the top row shows the
  // workspace switcher, and the account when it is set to sit in the sidebar.
  const sidebarShown = sidebar !== 'top' && (sidebar === 'icons' || !folded)
  const accountInSidebar = twoRows && footAccount && sidebar !== 'top'
  const searching = header === 'search' || header === 'crumbs-search' || twoRows
  const layout: Layout = hasTabs ? view : 'list'
  const shownDisplay = toolbar ? display : DEFAULT_LIST_DISPLAY
  const statuses = hasTabs ? TABS.find((t) => t.value === tab)?.statuses : null
  const inTab = issuesFor(page, jobs).filter((j) => !statuses || statuses.includes(j.status))
  const activeFilters = toolbar ? filters : {}
  const activeQuery = searching ? query : ''
  const groups = arrangeJobs(applyFilters(inTab, activeFilters, activeQuery), shownDisplay, layout)
  const order = groups.flatMap((g) => g.jobs.map((j) => j.id))
  const narrowed = activeFields(FILTER_FIELDS, activeFilters).length > 0 || activeQuery.trim() !== ''

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
    page, tab, setTab, view, setView, filters, setFilters, display, setDisplay, query, setQuery,
    // Two rows: the sidebar buttons sit in the global header instead.
    lead: twoRows ? null : lead,
    topNav: sidebar === 'top',
    longTrail,
    onPage: nav.onPage,
    counts: { shown: order.length, total: inTab.length },
    notes,
    onOpenJob: setPeekId,
    onNew: () => setCreateOpen(true),
  }

  const topRowProps = {
    ...ws, lead, query, setQuery, issues: showsIssues(page), notes, onOpenJob: setPeekId, onPage: nav.onPage,
    account: accountInSidebar && sidebarShown ? ('narrow' as const) : ('always' as const),
  }
  // What the sidebars show at their foot: the account, when it sits there.
  const foot: Foot = { topRow, footAccount: accountInSidebar }

  const main = (
    <div className="flex min-w-0 flex-1 flex-col">
      {topRow === 'content' && (
        <ShellTopRow {...topRowProps} place="content" switcher={sidebarShown ? 'narrow' : 'always'} />
      )}
      {sidebar === 'top' && <TopNav {...nav} {...ws} notes={notes} onOpenJob={setPeekId} tabsOnly={twoRows} />}
      {/* Two rows: the breadcrumb header is the second row, under the top row. */}
      <ContentHeader variant={twoRows ? 'breadcrumb' : header} {...headerProps} />
      <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
    </div>
  )

  const shell = (
    <>
      {sidebar === 'teams' && !folded && (
        <aside className="bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-r @2xl:flex">
          <TeamsSidebar {...nav} {...ws} onNew={() => setCreateOpen(true)} {...foot} />
        </aside>
      )}
      {sidebar === 'rail' && !folded && (
        <div className="hidden shrink-0 @2xl:flex">
          <RailSidebar {...nav} {...foot} />
        </div>
      )}
      {sidebar === 'inset' && !folded && (
        <aside className="text-sidebar-foreground hidden w-56 shrink-0 flex-col @2xl:flex">
          <InsetSidebar {...nav} {...ws} {...foot} />
        </aside>
      )}
      {sidebar === 'icons' && (
        <aside
          className={cn(
            'bg-sidebar text-sidebar-foreground hidden shrink-0 flex-col border-r transition-[width] duration-200 @2xl:flex',
            folded ? 'w-12' : 'w-52',
          )}
        >
          <IconsSidebar {...nav} iconOnly={folded} onToggle={() => setFolded((f) => !f)} {...foot} />
        </aside>
      )}

      {sidebar === 'inset' ? (
        <div className={cn('flex min-w-0 flex-1 p-2 @2xl:pl-0', topRow === 'app' && 'pt-0')}>
          <div className="bg-background flex min-w-0 flex-1 overflow-hidden rounded-lg border shadow-sm">{main}</div>
        </div>
      ) : main}
    </>
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
          <span className="text-muted-foreground text-[11px]">Try it with Breadcrumb, Crumb + search or Two rows</span>
        </div>
        {twoRows && (
          <div className="grid min-w-0 gap-1.5">
            <span className="text-muted-foreground text-[11px]">Two rows</span>
            <label className="flex h-6 items-center gap-2 text-xs">
              <Switch checked={overSidebar} onCheckedChange={setOverSidebar} />
              Top row over the sidebar
            </label>
            <label className="flex h-6 items-center gap-2 text-xs">
              <Switch checked={footAccount} onCheckedChange={setFootAccount} />
              Account at the sidebar's foot
            </label>
            <span className="text-muted-foreground text-[11px]">
              {overSidebar ? 'Across the whole app' : 'Over the page only; the sidebar keeps its full height'}
              {footAccount && sidebar !== 'top' && '. The avatar shows in the top row only when the sidebar is hidden'}
            </span>
          </div>
        )}
      </div>

      <div className="@container lg:col-span-2">
        <div
          className={cn(
            'text-foreground relative flex h-[34rem] overflow-hidden rounded-lg border',
            topRow === 'app' && 'flex-col',
            sidebar === 'inset' ? 'bg-sidebar' : 'bg-background',
          )}
        >
          {topRow === 'app' ? (
            <>
              <ShellTopRow {...topRowProps} place="app" switcher="always" inset={sidebar === 'inset'} />
              <div className="flex min-h-0 flex-1">{shell}</div>
            </>
          ) : shell}
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

type Ws = { workspace: (typeof WORKSPACES)[number]; setWorkspace: (w: (typeof WORKSPACES)[number]) => void }

// The shared workspace switcher block, over the demo's workspaces.
function WorkspaceMenu({ workspace, setWorkspace, ...props }: Ws & Pick<
  ComponentProps<typeof WorkspaceSwitcher>, 'detail' | 'variant' | 'badgeClassName' | 'className'
>) {
  return (
    <WorkspaceSwitcher
      workspaces={WORKSPACES}
      currentId={workspace.id}
      onSelect={(id) => setWorkspace(WORKSPACES.find((w) => w.id === id)!)}
      {...props}
    >
      <DropdownMenuItem onSelect={() => toast('Create workspace', { description: 'Demo only.' })}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace
      </DropdownMenuItem>
    </WorkspaceSwitcher>
  )
}

const EMAIL = 'ravi@example.com'

const THEMES: { value: Theme; label: string; icon: IconSvgElement }[] = [
  { value: 'light', label: 'Light', icon: Sun03Icon },
  { value: 'dark', label: 'Dark', icon: Moon02Icon },
  { value: 'system', label: 'System', icon: ComputerIcon },
]

// The account menu's items, in both of its places: the inset sidebar's foot
// and the global header. Theme switches the kit's own light and dark mode.
function AccountItems({ onPage }: { onPage: (id: string) => void }) {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <DropdownMenuItem onSelect={() => onPage('settings')}>
        <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
      </DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} /> Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-36">
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            {THEMES.map((t) => (
              <DropdownMenuRadioItem key={t.value} value={t.value}>
                <HugeiconsIcon icon={t.icon} strokeWidth={2} /> {t.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => toast('Logged out', { description: 'Demo only.' })}>
        <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} /> Switch account
      </DropdownMenuItem>
    </>
  )
}

// The Two rows header's first row: the shared GlobalHeader block. Left: the
// menu and sidebar buttons, and the workspace. Middle: search. Right: Ask AI,
// notifications, the light / dark toggle and the account. The page's
// breadcrumb is the second row (the Breadcrumb header). It sits in one of
// two places:
//   content  over the page only, on the page's colour; the sidebar keeps its
//            full height and its own workspace switcher, so the row shows the
//            switcher only when no sidebar is beside it (switcher="narrow")
//   app      across the whole app, over the sidebar, on the sidebar's colour
// The account can sit at the sidebar's foot instead (account="narrow"): the
// avatar then shows here only when no sidebar is beside the page.
// On a phone the search box becomes an icon that opens over the row.
function ShellTopRow({ place, switcher, account, inset, lead, query, setQuery, issues, notes, onOpenJob, onPage, ...ws }: Ws & {
  place: 'content' | 'app'
  // narrow: only below @2xl, where the sidebar is hidden (a menu button opens it).
  switcher: 'always' | 'narrow'
  account: 'always' | 'narrow'
  // Across the app over the inset sidebar, the content card already sets the row apart: no border.
  inset?: boolean
  lead: ReactNode
  query: string
  setQuery: (q: string) => void
  issues: boolean
  notes: Notifications
  onOpenJob: (id: string) => void
  onPage: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const surface = place === 'app' ? 'bg-sidebar text-sidebar-foreground' : 'bg-background'
  return (
    <GlobalHeader
      className={cn('h-11', surface, !(place === 'app' && inset) && 'border-b')}
      start={
        <>
          {lead}
          <WorkspaceMenu
            {...ws}
            variant="compact"
            detail={ws.workspace.plan.replace(' plan', '')}
            badgeClassName="hidden @md:inline"
            className={cn(switcher === 'narrow' && '@2xl:hidden')}
          />
        </>
      }
      center={<SearchBox query={query} setQuery={setQuery} issues={issues} className="h-7 w-full" />}
      centerClassName="hidden @md:flex"
      end={
        <>
          <Button variant="ghost" size="icon" className="relative @md:hidden" aria-label="Search" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
            {query && <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" />}
          </Button>
          <Button variant="outline" size="sm" aria-label="Ask AI" onClick={() => onPage('ai')}>
            <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} data-icon="inline-start" />
            <span className="hidden @lg:inline">Ask AI</span>
          </Button>
          <NotificationsMenu notes={notes} onOpenJob={onOpenJob} />
          <ThemeToggle />
          <AccountMenu
            variant="avatar"
            name={PEOPLE[0]}
            email={EMAIL}
            menuClassName="w-52"
            className={cn(account === 'narrow' && '@2xl:hidden')}
          >
            <AccountItems onPage={onPage} />
          </AccountMenu>
        </>
      }
    >
      {open && (
        <div
          className={cn('absolute inset-0 z-10 flex items-center gap-2 px-2 @md:hidden', surface)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          <SearchBox query={query} setQuery={setQuery} issues={issues} autoFocus className="h-8 flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      )}
    </GlobalHeader>
  )
}

// 1. Teams: the classic layout

// With the Two rows header (`topRow`), search and the account are in its top
// row. Across the whole app (app), so are the workspace and New issue, and
// the sidebar starts with the pages. `footAccount` puts the account back at
// the sidebar's foot.
type TopRow = 'content' | 'app' | undefined
type Foot = { topRow?: TopRow; footAccount?: boolean }

// The account at a sidebar's foot: a row, or the avatar alone in a narrow
// sidebar (rail, icons), its menu opening to the right.
function SidebarAccount({ onPage, iconOnly }: { onPage: (id: string) => void; iconOnly?: boolean }) {
  return iconOnly ? (
    <AccountMenu variant="avatar" name={PEOPLE[0]} email={EMAIL} side="right" align="end" menuClassName="w-52" className="hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent">
      <AccountItems onPage={onPage} />
    </AccountMenu>
  ) : (
    <AccountMenu
      name={PEOPLE[0]}
      detail={EMAIL}
      size="md"
      menuClassName="w-52"
      className="hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent"
    >
      <AccountItems onPage={onPage} />
    </AccountMenu>
  )
}

function TeamsSidebar({ page, onPage, onNew, topRow, footAccount, ...ws }: Nav & Ws & Foot & { onNew: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({ design: true })
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {topRow !== 'app' && (
        <div className="flex h-11 shrink-0 items-center gap-1 px-2">
          <WorkspaceMenu {...ws} className="flex-1" />
          <IconAction
            label="New issue"
            icon={PencilEdit02Icon}
            shortcut={['C']}
            variant="outline"
            onClick={onNew}
            className="text-foreground"
          />
        </div>
      )}
      {!topRow && (
        <div className="px-2">
          <SearchTrigger
            onClick={() => toast('Search', { description: `${MOD}+K opens the real command menu.` })}
            className="hover:bg-sidebar-accent hover:text-muted-foreground"
          />
        </div>
      )}

      <nav className={cn('min-h-0 flex-1 overflow-y-auto px-2 pb-3', topRow === 'app' && 'pt-0.5')}>
        <div className="mt-3 grid gap-px">
          <NavItem icon={InboxIcon} label="Inbox" count={INBOX_COUNT} active={page === 'inbox'} onClick={() => onPage('inbox')} />
          <NavItem icon={UserCircleIcon} label="My issues" active={page === 'my-issues'} onClick={() => onPage('my-issues')} />
        </div>
        <NavGroup title="Workspace">
          <NavItem icon={CubeIcon} label="Projects" active={page === 'projects'} onClick={() => onPage('projects')} />
          <NavItem icon={Layers01Icon} label="Views" active={page === 'views'} onClick={() => onPage('views')} />
        </NavGroup>
        <NavGroup title="Favourites">
          <NavItem
            icon={StarIcon}
            label="Urgent this week"
            active={page === 'urgent'}
            onClick={() => onPage('urgent')}
          />
        </NavGroup>
        <NavGroup title="Your teams">
          {TEAMS.map((team) => {
            const open = !closed[team.id]
            return (
              <div key={team.id}>
                <NavItem
                  mark={<LetterMark size="xs" text={team.short} colour={team.colour} />}
                  label={team.name}
                  expanded={open}
                  onClick={() => setClosed((c) => ({ ...c, [team.id]: open }))}
                />
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
        </NavGroup>
      </nav>

      <div className="grid gap-1 border-t p-2">
        {footAccount && <SidebarAccount onPage={onPage} />}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => toast('Invite people', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" /> Invite
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground ml-auto" aria-label="Help" onClick={() => toast('Help', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 2. Rail and panel

function RailSidebar({ page, onPage, topRow, footAccount }: Nav & Foot) {
  const current = [...RAIL, RAIL_SETTINGS].find((m) => m.links.some((l) => l.id === page)) ?? RAIL[1]

  function railButton(m: (typeof RAIL)[number]) {
    return (
      <NavItem
        key={m.id}
        rail
        icon={m.icon}
        label={m.label}
        count={m.count}
        active={m.id === current.id}
        onClick={() => onPage(m.links[0].id)}
      />
    )
  }

  return (
    <>
      <div className="bg-sidebar flex w-12 shrink-0 flex-col items-center gap-1 border-r py-2">
        {topRow !== 'app' && <LetterMark size="xs" text="A" colour="var(--primary)" className="mb-2 size-6 text-[10px]" />}
        {RAIL.map(railButton)}
        <div className="mt-auto grid gap-1">
          {railButton(RAIL_SETTINGS)}
          {!topRow && <UserAvatar name={PEOPLE[0]} className="mt-1" />}
          {footAccount && <SidebarAccount onPage={onPage} iconOnly />}
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
            <NavGroup title="Teams">
              {TEAMS.map((t) => (
                <NavItem
                  key={t.id}
                  icon={Task01Icon}
                  mark={<LetterMark size="xs" text={t.short} colour={t.colour} />}
                  label={t.name}
                  active={page === `${t.id}:issues` && !current.links.some((l) => l.id === page)}
                  onClick={() => onPage(`${t.id}:issues`)}
                />
              ))}
            </NavGroup>
          </div>
        )}
      </aside>
    </>
  )
}

// 3. Inset: the content sits in a card on the sidebar's colour

function InsetSidebar({ page, onPage, topRow, footAccount, ...ws }: Nav & Ws & Foot) {
  const items = ['home', 'inbox', 'my-issues', 'projects', 'analytics', 'ai']
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {topRow !== 'app' && (
        <div className="p-2">
          <WorkspaceMenu {...ws} detail={ws.workspace.plan} />
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2">
        <NavGroup title="Platform">
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
        </NavGroup>
        <NavGroup title="Teams">
          {TEAMS.map((t) => (
            <NavItem
              key={t.id}
              icon={Task01Icon}
              mark={<LetterMark size="xs" text={t.short} colour={t.colour} />}
              label={t.name}
              active={page === `${t.id}:issues`}
              onClick={() => onPage(`${t.id}:issues`)}
            />
          ))}
        </NavGroup>
      </nav>

      <div className="grid gap-2 p-2">
        <UsageMeter
          value={72}
          label={<span className="text-foreground font-medium">Issues used</span>}
          count="180 / 250"
          barLabel="Issues used"
          className="bg-background/60 gap-2 rounded-lg border p-2.5"
        >
          <Button size="sm" variant="outline" onClick={() => toast('Upgrade', { description: 'Demo only.' })}>Upgrade plan</Button>
        </UsageMeter>
        {(!topRow || footAccount) && <SidebarAccount onPage={onPage} />}
      </div>
    </div>
  )
}

// 4. Icons: folds down to a strip of icons

function IconsSidebar({ page, onPage, iconOnly, onToggle, topRow, footAccount }: Nav & Foot & {
  iconOnly: boolean
  onToggle: () => void
}) {
  const main = ['home', 'inbox', 'my-issues', 'ops:issues', 'ops:cycles', 'projects', 'analytics']
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {topRow !== 'app' && (
        <div className={cn('flex h-11 shrink-0 items-center gap-2', iconOnly ? 'justify-center' : 'px-3')}>
          <LetterMark size="xs" text="A" colour="var(--primary)" className="size-6 text-[10px]" />
          {!iconOnly && <span className="truncate text-[13px] font-medium">Acme</span>}
        </div>
      )}
      <nav className={cn('grid min-h-0 flex-1 content-start gap-px overflow-y-auto px-2', topRow === 'app' && 'pt-2')}>
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
        {footAccount && (
          <div className={cn('mt-1', iconOnly && 'flex justify-center')}>
            <SidebarAccount onPage={onPage} iconOnly={iconOnly} />
          </div>
        )}
      </div>
    </div>
  )
}

// 5. Top nav: no sidebar

// With the Two rows header, the global header takes the first row's place,
// so only the tabs are left (`tabsOnly`).
function TopNav({ page, onPage, notes, onOpenJob, tabsOnly, ...ws }: Nav & Ws & {
  notes: Notifications
  onOpenJob: (id: string) => void
  tabsOnly?: boolean
}) {
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
      {!tabsOnly && <div className="flex h-11 items-center gap-1.5 px-3">
        <LetterMark size="xs" text="A" colour="var(--primary)" className="size-6 text-[10px]" />
        <span className="text-muted-foreground/40 px-0.5 text-base font-light">/</span>
        <WorkspaceMenu
          {...ws}
          variant="compact"
          detail={ws.workspace.plan.replace(' plan', '')}
          badgeClassName="hidden @md:inline"
        />
        <span className="text-muted-foreground/40 hidden px-0.5 text-base font-light @md:inline">/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hover:bg-accent hidden h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium @md:flex">
              <LetterMark size="xs" text={team.short} colour={team.colour} />
              <span className="truncate">{team.name}</span>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Teams</DropdownMenuLabel>
            {TEAMS.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => onPage(`${t.id}:issues`)}>
                <LetterMark size="xs" text={t.short} colour={t.colour} />
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
          <UserAvatar name={PEOPLE[0]} />
        </div>
      </div>}
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
            {issues && <ViewSwitch views={LIST_BOARD_VIEWS} value={p.view} onChange={p.setView} />}
            <NewButton onClick={p.onNew} />
          </div>
        </div>
        <PageHeader
          as="h3"
          title={
            <span className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={info.icon} strokeWidth={2} className="text-muted-foreground size-4" />
              {info.label}
              {info.team && <span className="text-muted-foreground text-xs font-normal tracking-normal">· {info.team.name}</span>}
            </span>
          }
          description={issues ? 'Everything the team is working on, newest first.' : `The ${info.label.toLowerCase()} page of this demo workspace.`}
          className="pt-1 pb-2"
        />
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
    const filtered = activeFields(FILTER_FIELDS, p.filters).length > 0
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
          <div className="flex min-h-9 items-start gap-1.5 px-2 py-1.5 @lg:px-3">
            {/* The filter bar block's filter row: Filter menu, chips, Clear and the count. Unfiltered, the
                count is what the list shows (the Display menu can hide completed issues). */}
            <FilterBarBlock
              fields={FILTER_FIELDS}
              filters={p.filters}
              onFiltersChange={(next) => p.setFilters(next as Filters)}
              shown={shown}
              total={filtered ? total : shown}
              noun={['issue', 'issues']}
              className="min-w-0 flex-1"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <ViewSwitch views={LIST_BOARD_VIEWS} value={p.view} onChange={p.setView} />
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
              <UserAvatar name={PEOPLE[0]} />
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
          {PEOPLE.slice(0, 3).map((name) => <UserAvatar key={name} name={name} className="size-6" />)}
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
    icon: c.team && <LetterMark size="xs" text={c.team.short} colour={c.team.colour} />,
    onSelect: () => (c.page ? onPage(c.page) : toast(c.label, { description: 'Demo only.' })),
  }))

  return (
    <>
      <FoldingBreadcrumb trail={trail} current={info.label} />
      <IconAction
        label="Add to favourites"
        icon={StarIcon}
        onClick={() => toast('Added to favourites', { description: 'Demo only.' })}
        className="shrink-0"
      />
      {more && (
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hidden shrink-0 @md:inline-flex" aria-label="More" onClick={() => toast('More actions', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      )}
    </>
  )
}

// The kit's SearchField, set up for the shell's headers: the ⌘K hint shows while it is empty.
function SearchBox({ query, setQuery, issues, autoFocus, className }: {
  query: string
  setQuery: (q: string) => void
  issues: boolean
  autoFocus?: boolean
  className?: string
}) {
  return (
    <SearchField
      value={query}
      onChange={setQuery}
      placeholder={issues ? 'Search issues…' : 'Search…'}
      label="Search issues"
      end={<Shortcut keys={['mod', 'K']} className="hidden @md:inline-flex" />}
      autoFocus={autoFocus}
      className={className}
    />
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
