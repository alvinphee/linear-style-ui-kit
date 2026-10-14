import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Copy01Icon, FilterHorizontalIcon,
  Home01Icon, InboxIcon, Layers01Icon, LockIcon, Logout01Icon, MoreHorizontalIcon, Search01Icon, Settings01Icon,
  Share08Icon, SquareArrowUp02Icon, Task01Icon, Tick02Icon, UserCircleIcon, Wifi01Icon, WifiOff01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  MobileAccountButton, MobileCard, MobileChip, MobileChips, MobileFab, MobileGroup, MobileMenu, MobileMenuButton, MobileMenuLink, MobileMenuSection,
  MobileMenuTiles, MobileMenuLauncher, MobileMenuModuleList, MobileModuleSheet, MobileModuleStrip,
  type MobileMenuButtonVariant, type MobileMenuEffect, type MobileSwitcherItem, type MobileSwitcherStyle,
  MobileFloatingTabBar, MobileOption, MobileRow, MobileSheet, MobileShell,
  MobileTabBar, MobileTopAction, MobileTopBar, type MobileTab,
} from '@/blocks/mobile-shell'
import { LabelDot } from '@/components/label-dot'
import { LetterMark } from '@/components/mark'
import { NoAssignee, UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { SearchField } from '@/components/search-field'
import { StatusIcon } from '@/components/status-icon'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme, type Theme } from '@/lib/theme'
import { greeting, plural } from '@/lib/text'
import { LABEL_BY_ID, PRIORITY_RANK, dueRank, type Job, type Status } from '../../data'
import { ASSIGNEE_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeValue, driverOf, type JobOption } from '../../job-options'
import { useJobs, type Activity } from '../../jobs-store'
import { PhoneFrame, PhoneHomeIndicator, PhoneStatusBar } from '../shared'
import type { Notifications } from './NotificationsMenu'

// The App shells page's phone layout, on the kit's jobs: the mobile shell
// block (tab bar, top bar, stacked screens, bottom sheets, cards) in a
// phone-sized frame, so it can be tried on a desktop. The frame adds what
// the phone itself draws: the status bar, the home indicator and, in a
// browser tab, the browser's address bar and toolbar.

export type PhoneDisplay = 'browser' | 'installed'
export type PhoneAction = 'fab' | 'tab' | 'top'
// How you get around: a tab bar, a menu screen behind "Menu" in the top bar, or both.
export type PhoneNav = 'tabs' | 'menu' | 'both'
// The tab bar: a strip along the bottom, or floating over the page (working as iOS 26's).
export type PhoneTabStyle = 'classic' | 'floating'

type TabId = 'home' | 'issues' | 'inbox' | 'more'
// A screen pushed onto a tab's stack: an issue, or one of the pages under More.
type Screen = { kind: 'issue'; id: string } | { kind: 'page'; id: string; label: string }
type Chip = 'all' | 'active' | 'backlog' | 'done'
type Sort = 'priority' | 'due' | 'title'
type Field = 'status' | 'priority' | 'assignee'
type OpenSheet = { kind: 'pick'; field: Field; jobId: string } | { kind: 'filter' } | { kind: 'new' } | null

const ME = 'Ravi'
const EMAIL = 'ravi@example.com'
const ADDRESS = 'app.example.com'

const TABS: (MobileTab & { id: TabId })[] = [
  { id: 'home', label: 'Home', icon: Home01Icon },
  { id: 'issues', label: 'Issues', icon: Task01Icon },
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'more', label: 'More', icon: UserCircleIcon },
]

const CHIPS: { id: Chip; label: string; statuses: Status[] | null }[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'active', label: 'Active', statuses: ['todo', 'progress'] },
  { id: 'backlog', label: 'Backlog', statuses: ['backlog'] },
  { id: 'done', label: 'Done', statuses: ['done', 'cancelled'] },
]

const SORTS: { id: Sort; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'due', label: 'Due date' },
  { id: 'title', label: 'Title' },
]

// The demo's teams, for the menu button as a switcher (the ERP switches modules).
const TEAMS = [
  { id: 'ops', label: 'Operations', short: 'OP', colour: 'oklch(0.6 0.17 265)', detail: 'Jobs and dispatch' },
  { id: 'warehouse', label: 'Warehouse', short: 'WH', colour: 'oklch(0.7 0.14 65)', detail: 'Picking and stock' },
  { id: 'fleet', label: 'Fleet', short: 'FL', colour: 'oklch(0.65 0.15 155)', detail: 'Vehicles and drivers' },
  { id: 'care', label: 'Customer care', short: 'CC', colour: 'oklch(0.62 0.16 330)', detail: 'Cases and returns' },
  { id: 'sales', label: 'Sales', short: 'SA', colour: 'oklch(0.6 0.16 20)', detail: 'Quotes and orders' },
  { id: 'finance', label: 'Finance', short: 'FI', colour: 'oklch(0.58 0.12 200)', detail: 'Invoices and payments' },
  { id: 'hr', label: 'People', short: 'HR', colour: 'oklch(0.62 0.15 300)', detail: 'Leave and payroll' },
  { id: 'safety', label: 'Safety', short: 'SF', colour: 'oklch(0.66 0.16 130)', detail: 'Checks and incidents' },
  { id: 'projects', label: 'Projects', short: 'PR', colour: 'oklch(0.6 0.14 240)', detail: 'Plans and milestones' },
  { id: 'purchasing', label: 'Purchasing', short: 'PU', colour: 'oklch(0.68 0.13 85)', detail: 'Orders and suppliers' },
  { id: 'assets', label: 'Assets', short: 'AS', colour: 'oklch(0.55 0.1 260)', detail: 'Equipment and servicing' },
  { id: 'reports', label: 'Reports', short: 'RE', colour: 'oklch(0.6 0.12 170)', detail: 'Dashboards and exports' },
  { id: 'admin', label: 'Admin', short: 'AD', colour: 'oklch(0.5 0.03 260)', detail: 'Users and settings' },
  { id: 'support', label: 'Support', short: 'SU', colour: 'oklch(0.64 0.16 350)', detail: 'Tickets and chats' },
]

const MORE_PAGES = [
  { id: 'projects', label: 'Projects', icon: Layers01Icon },
  { id: 'settings', label: 'Settings', icon: Settings01Icon },
]

const FIELDS: Record<Field, { title: string; options: JobOption[]; value: (j: Job) => string; patch: (v: string) => Partial<Job> }> = {
  status: { title: 'Status', options: STATUS_OPTIONS, value: (j) => j.status, patch: (v) => ({ status: v as Status }) },
  priority: { title: 'Priority', options: PRIORITY_OPTIONS, value: (j) => j.priority, patch: (v) => ({ priority: v as Job['priority'] }) },
  assignee: { title: 'Assignee', options: ASSIGNEE_OPTIONS, value: (j) => assigneeValue(j.driver), patch: (v) => ({ driver: driverOf(v) }) },
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const isOpen = (j: Job) => j.status === 'todo' || j.status === 'progress'

function sortJobs(jobs: Job[], sort: Sort) {
  const by = {
    priority: (a: Job, b: Job) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    due: (a: Job, b: Job) => dueRank(a.due) - dueRank(b.due),
    title: (a: Job, b: Job) => a.title.localeCompare(b.title),
  }[sort]
  return [...jobs].sort(by)
}

export function PhoneShell({
  display, nav = 'tabs', tabStyle = 'classic', menuButton = 'label', menuEffect = 'fade', switcherStyle = 'tiles', teamCount = 4, action, offline, notes, onInstall,
}: {
  // In a browser tab (the browser's address bar and toolbar show) or installed
  // (standalone: full screen, opened from the home screen).
  display: PhoneDisplay
  nav?: PhoneNav
  tabStyle?: PhoneTabStyle
  // The menu screen's button: ≡ Menu, the bars alone, or the team switcher.
  menuButton?: MobileMenuButtonVariant
  // How the menu screen opens.
  menuEffect?: MobileMenuEffect
  // With the team switcher button: how a team is chosen.
  switcherStyle?: MobileSwitcherStyle
  // How many teams (modules) the app has: 4, 9 or 14.
  teamCount?: number
  // Where the main action (New issue) sits: a floating button, the middle of
  // the tab bar (a floating button with the menu, which has no tab bar), or
  // the top bar.
  action: PhoneAction
  offline: boolean
  notes: Notifications
  onInstall: () => void
}) {
  const { jobs, activity, addJob, updateJob, toggleSubtask } = useJobs()
  const [tab, setTab] = useState<TabId>('home')
  const [stacks, setStacks] = useState<Record<TabId, Screen[]>>({ home: [], issues: [], inbox: [], more: [] })
  const [sheet, setSheet] = useState<OpenSheet>(null)
  const [chip, setChip] = useState<Chip>('active')
  const [sort, setSort] = useState<Sort>('priority')
  const [mine, setMine] = useState(false)
  const [query, setQuery] = useState('')
  const [installHidden, setInstallHidden] = useState(false)
  const [queued, setQueued] = useState(0)
  const [title, setTitle] = useState('')
  // The sheets open inside the phone's screen, not over the window.
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null)

  // Back online: the changes made offline go up, as a service worker's
  // background sync would send them.
  const wasOffline = useRef(offline)
  useEffect(() => {
    if (wasOffline.current && !offline && queued > 0) {
      toast.success(`${plural(queued, 'change')} synced`, { description: 'Made while offline, sent on reconnecting.' })
      setQueued(0)
    }
    wasOffline.current = offline
  }, [offline, queued])

  const stack = stacks[tab]
  const top = stack.at(-1)
  function push(screen: Screen, on: TabId = tab) {
    setTab(on)
    setStacks((s) => ({ ...s, [on]: [...s[on], screen] }))
  }
  const pop = () => setStacks((s) => ({ ...s, [tab]: s[tab].slice(0, -1) }))
  // Tapping the tab you are on goes back to its first screen, as phone apps do.
  function chooseTab(id: TabId) {
    if (id === tab) setStacks((s) => ({ ...s, [id]: [] }))
    setTab(id)
  }
  function showIssues(next: Chip, onlyMine: boolean) {
    setChip(next)
    setMine(onlyMine)
    chooseTab('issues')
  }

  function change(id: string, patch: Partial<Job>) {
    updateJob(id, patch)
    if (offline) setQueued((n) => n + 1)
  }

  function create() {
    const name = title.trim()
    if (!name) return
    const job = addJob('todo', name)
    updateJob(job.id, { driver: ME })
    if (offline) setQueued((n) => n + 1)
    setTitle('')
    setSheet(null)
    push({ kind: 'issue', id: job.id }, 'issues')
    if (offline) toast(`${job.id} saved on this phone`, { description: 'It syncs when you are back online.' })
    else toast(`${job.id} created`)
  }

  const newIssue = () => setSheet({ kind: 'new' })
  const myOpen = jobs.filter((j) => j.driver === ME && isOpen(j))
  const chipStatuses = CHIPS.find((c) => c.id === chip)?.statuses
  const q = query.trim().toLowerCase()
  const listed = sortJobs(
    jobs.filter((j) =>
      (!chipStatuses || chipStatuses.includes(j.status))
      && (!mine || j.driver === ME)
      && (!q || j.title.toLowerCase().includes(q) || j.id.toLowerCase().includes(q))),
    sort,
  )
  const menuMode = nav !== 'tabs'
  const withTabs = nav !== 'menu'
  const floating = withTabs && tabStyle === 'floating'
  // The floating bar's search button goes to Issues with its search box ready.
  const [searching, setSearching] = useState(false)
  const [team, setTeam] = useState(TEAMS[0])
  // More only without the menu, which holds the same.
  const tabs = TABS.filter((t) => !menuMode || t.id !== 'more').map((t) => (t.id === 'inbox' ? { ...t, badge: notes.unread } : t))
  const [menuOpen, setMenuOpen] = useState(false)
  const [teamsOpen, setTeamsOpen] = useState(false)
  const teamItems: MobileSwitcherItem[] = TEAMS.slice(0, teamCount).map((t) => ({
    id: t.id,
    label: t.label,
    mark: <LetterMark text={t.short} colour={t.colour} />,
    detail: t.detail,
    current: t.id === team.id,
    onClick: () => {
      setMenuOpen(false)
      if (t.id === team.id) return
      setTeam(t)
      toast(`Switched to ${t.label}`, { description: 'Demo only: every team shows the same issues.' })
    },
  }))
  // The tab bar's middle button needs a classic tab bar; otherwise it floats.
  const fab = (action === 'fab' || (action === 'tab' && (!withTabs || floating))) && !top && (tab === 'home' || tab === 'issues')
  const backLabel = stack.length > 1 ? screenTitle(stack.at(-2)!) : TABS.find((t) => t.id === tab)!.label
  const newButton = action === 'top' && <MobileTopAction label="New issue" icon={Add01Icon} onClick={newIssue} />
  const issueCard = (j: Job) => (
    <MobileCard
      key={j.id}
      overline={<><StatusIcon status={j.status} label /> <span className="tabular-nums">{j.id}</span></>}
      aside={<PriorityIcon priority={j.priority} label />}
      title={j.title}
      meta={
        <>
          {j.driver ? <UserAvatar name={j.driver} className="size-4" /> : <NoAssignee />}
          <span className="truncate">{j.driver || 'No assignee'}</span>
          {j.due && <span className="shrink-0">· {j.due}</span>}
        </>
      }
      metaEnd={j.labels.length > 0 && (
        <span className="flex gap-1">{j.labels.map((l) => LABEL_BY_ID[l] && <LabelDot key={l} colour={LABEL_BY_ID[l].colour} />)}</span>
      )}
      onClick={() => push({ kind: 'issue', id: j.id })}
    />
  )

  let screen: { title: string; actions?: ReactNode; body: ReactNode; foot?: ReactNode }
  if (top?.kind === 'issue') {
    const job = jobs.find((j) => j.id === top.id)
    screen = job
      ? {
        title: job.id,
        actions: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9" aria-label="More actions">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => toast('Link copied', { description: `${ADDRESS}/issue/${job.id}` })}>
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast('Share', { description: 'The phone’s own share sheet opens here (the Web Share API).' })}>
                <HugeiconsIcon icon={Share08Icon} strokeWidth={2} /> Share…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        body: (
          <IssueScreen
            job={job}
            activity={activity.filter((a) => a.jobId === job.id).slice(-3).reverse()}
            onPick={(field) => setSheet({ kind: 'pick', field, jobId: job.id })}
            onToggleSubtask={(sid) => toggleSubtask(job.id, sid)}
          />
        ),
        // The screen's one big action sits at the bottom, under the thumb.
        foot: (
          <Button
            className="h-10 w-full"
            variant={job.status === 'done' ? 'outline' : 'default'}
            onClick={() => change(job.id, { status: job.status === 'done' ? 'todo' : 'done' })}
          >
            {job.status !== 'done' && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
            {job.status === 'done' ? 'Reopen' : 'Mark as done'}
          </Button>
        ),
      }
      : { title: 'Not found', body: <p className="text-muted-foreground p-4 text-xs">This issue was deleted.</p> }
  } else if (top?.kind === 'page') {
    screen = {
      title: top.label,
      body: (
        <Empty className="h-full border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={MORE_PAGES.find((p) => p.id === top.id)?.icon ?? Layers01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>{top.label}</EmptyTitle>
            <EmptyDescription>Pages that do not earn a tab live under More, one tap deeper.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ),
    }
  } else if (tab === 'home') {
    const counts = [
      { label: 'Assigned to you', value: myOpen.length, onClick: () => showIssues('active', true) },
      { label: 'In progress', value: jobs.filter((j) => j.status === 'progress').length, onClick: () => showIssues('active', false) },
      { label: 'Backlog', value: jobs.filter((j) => j.status === 'backlog').length, onClick: () => showIssues('backlog', false) },
    ]
    screen = {
      title: 'Home',
      actions: (
        <>
          {newButton}
          {/* With the menu, the top bar carries the avatar on every screen. */}
          {!menuMode && (
            <button
              type="button"
              aria-label="Account"
              onClick={() => chooseTab('more')}
              className="focus-visible:ring-ring/50 mx-1 rounded-full outline-none focus-visible:ring-2"
            >
              <UserAvatar name={ME} className="size-7" />
            </button>
          )}
        </>
      ),
      body: (
        <div className="grid gap-4 p-4 pt-1">
          {display === 'browser' && !installHidden && (
            <div className="bg-card grid gap-2 rounded-xl border p-3">
              <div className="flex items-start gap-3">
                <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <HugeiconsIcon icon={SquareArrowUp02Icon} strokeWidth={2} className="size-4.5" />
                </span>
                <div className="grid min-w-0 gap-0.5">
                  <p className="text-[13px] font-medium">Install the app</p>
                  <p className="text-muted-foreground text-xs">Opens full screen from your home screen, and works offline.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setInstallHidden(true)}>Not now</Button>
                <Button size="sm" onClick={onInstall}>Install</Button>
              </div>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs">{greeting()},</p>
            <p className="text-lg font-semibold tracking-tight">{ME}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {counts.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={c.onClick}
                className="bg-card hover:bg-accent focus-visible:ring-ring/50 grid min-w-0 gap-1 rounded-xl border p-2.5 text-left outline-none focus-visible:ring-2"
              >
                <span className="text-lg font-semibold tabular-nums">{c.value}</span>
                <span className="text-muted-foreground truncate text-[11px]">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium">Up next</h3>
              <button type="button" className="text-brand text-xs" onClick={() => showIssues('active', true)}>See all</button>
            </div>
            {sortJobs(myOpen, 'priority').slice(0, 4).map(issueCard)}
            {myOpen.length === 0 && <p className="text-muted-foreground text-xs">Nothing assigned to you.</p>}
          </div>
        </div>
      ),
    }
  } else if (tab === 'issues') {
    screen = {
      title: 'Issues',
      actions: (
        <>
          {newButton}
          <MobileTopAction label="Sort and filter" icon={FilterHorizontalIcon} dot={sort !== 'priority' || mine} onClick={() => setSheet({ kind: 'filter' })} />
        </>
      ),
      body: (
        <div className="grid gap-3 p-4 pt-1">
          <SearchField value={query} onChange={setQuery} placeholder="Search issues" label="Search issues" autoFocus={searching} />
          <MobileChips label="View" items={CHIPS} value={chip} onChange={(id) => setChip(id as Chip)}>
            {mine && (
              <MobileChip onClick={() => setMine(false)} label="Remove filter: assigned to me" className="bg-brand/10 text-brand border-transparent">
                Assigned to me ×
              </MobileChip>
            )}
          </MobileChips>
          <p className="text-muted-foreground text-[11px]" aria-live="polite">{plural(listed.length, 'issue')}</p>
          {listed.map(issueCard)}
          {listed.length === 0 && (
            <Empty className="border-0 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
                <EmptyTitle>No issues here</EmptyTitle>
                <EmptyDescription>Try another view, or clear the search.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      ),
    }
  } else if (tab === 'inbox') {
    screen = {
      title: 'Inbox',
      actions: notes.unread > 0 && (
        <Button variant="ghost" size="sm" className="text-brand h-9" onClick={notes.markAllRead}>Mark all read</Button>
      ),
      body: (
        <ul className="divide-y">
          {notes.items.map((a) => {
            const job = jobs.find((j) => j.id === a.jobId)
            const unread = !notes.isRead(a.id)
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    notes.markRead(a.id)
                    push({ kind: 'issue', id: a.jobId })
                  }}
                  className="hover:bg-accent focus-visible:bg-accent flex w-full items-start gap-3 px-4 py-3 text-left outline-none"
                >
                  <span className="relative shrink-0">
                    <UserAvatar name={a.actor} className="size-8" />
                    {unread && <span className="bg-brand ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2" />}
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className={cn('text-[13px]', unread ? 'font-medium' : 'text-muted-foreground')}>
                      {unread && <span className="sr-only">Unread: </span>}
                      {a.actor} {a.kind === 'comment' ? 'commented' : a.text}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">{job?.title}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[11px]">{a.at}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ),
    }
  } else {
    screen = {
      title: 'More',
      body: (
        <MoreScreen
          display={display}
          offline={offline}
          queued={queued}
          onPage={(p) => push({ kind: 'page', id: p.id, label: p.label })}
          onInstall={onInstall}
        />
      ),
    }
  }

  const field = sheet?.kind === 'pick' ? FIELDS[sheet.field] : undefined
  const pickJob = sheet?.kind === 'pick' ? jobs.find((j) => j.id === sheet.jobId) : undefined

  return (
    // The phone: a bezel round the screen, sized like a 390 × 844 phone and
    // never wider than the space it is given.
    <PhoneFrame screenRef={setScreenEl}>
        <PhoneStatusBar offline={offline} />
        {display === 'browser' && (
          <div className="px-3 pb-1" aria-hidden>
            <div className="bg-muted text-muted-foreground flex h-8 items-center justify-center gap-1.5 rounded-full text-xs">
              <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-3" /> {ADDRESS}
            </div>
          </div>
        )}

        <MobileShell
          className="min-h-0 flex-1"
          header={
            menuMode && !top ? (
              <MobileTopBar
                title={
                  menuButton === 'switcher' && switcherStyle === 'sheet' ? (
                    <div className="flex min-w-0 items-center gap-0.5">
                      <MobileMenuButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} controls="phone-menu" variant="icon" />
                      <MobileMenuButton
                        open={teamsOpen}
                        onClick={() => setTeamsOpen(true)}
                        controls="phone-teams"
                        variant="switcher"
                        mark={<LetterMark text={team.short} colour={team.colour} size="xs" />}
                        label={team.label}
                      />
                    </div>
                  ) : menuButton === 'switcher' ? (
                    <MobileMenuButton
                      open={menuOpen}
                      onClick={() => setMenuOpen(!menuOpen)}
                      controls="phone-menu"
                      variant="switcher"
                      mark={<LetterMark text={team.short} colour={team.colour} size="xs" />}
                      label={team.label}
                    />
                  ) : menuButton === 'icon' ? (
                    <div className="flex min-w-0 items-center gap-1">
                      <MobileMenuButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} controls="phone-menu" variant="icon" />
                      <span className="min-w-0 truncate text-[15px] font-semibold">{screen.title}</span>
                    </div>
                  ) : (
                    <MobileMenuButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} controls="phone-menu" />
                  )
                }
                actions={!menuOpen && (
                  <>
                    {screen.actions}
                    {/* The account lives here, not in the menu. */}
                    <MobileAccountButton
                      name={ME}
                      pressed={tab === 'more' && !top}
                      onClick={() => {
                        setStacks((s) => ({ ...s, more: [] }))
                        setTab(tab === 'more' && !top ? 'home' : 'more')
                      }}
                    />
                  </>
                )}
              />
            ) : (
              <MobileTopBar
                title={screen.title}
                large={!top}
                back={top ? { label: backLabel, onClick: pop } : undefined}
                actions={screen.actions}
              />
            )
          }
          menu={menuMode && menuOpen && (
            <MobileMenu id="phone-menu" effect={menuEffect} onClose={() => setMenuOpen(false)}>
              {menuButton === 'switcher' && switcherStyle !== 'sheet' && switcherStyle !== 'strip' && (
                <MobileMenuSection title="Teams">
                  {switcherStyle === 'launcher' ? (
                    <MobileMenuLauncher items={teamItems} />
                  ) : switcherStyle === 'list' ? (
                    <MobileMenuModuleList items={teamItems} />
                  ) : (
                    <MobileMenuTiles items={teamItems} />
                  )}
                </MobileMenuSection>
              )}
              <MobileMenuSection title="Menu">
                {TABS.slice(0, 3).map((t) => (
                  <MobileMenuLink
                    key={t.id}
                    current={tab === t.id && !top}
                    count={t.id === 'inbox' ? notes.unread : undefined}
                    onClick={() => {
                      setMenuOpen(false)
                      setStacks((s) => ({ ...s, [t.id]: [] }))
                      setTab(t.id)
                    }}
                  >
                    {t.label}
                  </MobileMenuLink>
                ))}
              </MobileMenuSection>
              <MobileMenuSection title="Views">
                {CHIPS.map((c) => (
                  <MobileMenuLink
                    key={c.id}
                    current={tab === 'issues' && !top && chip === c.id && !mine}
                    onClick={() => {
                      setMenuOpen(false)
                      setStacks((s) => ({ ...s, issues: [] }))
                      showIssues(c.id, false)
                    }}
                  >
                    {c.label} issues
                  </MobileMenuLink>
                ))}
              </MobileMenuSection>
              <MobileMenuSection title="Pages">
                {MORE_PAGES.map((p) => (
                  <MobileMenuLink
                    key={p.id}
                    onClick={() => {
                      setMenuOpen(false)
                      push({ kind: 'page', id: p.id, label: p.label }, 'more')
                    }}
                  >
                    {p.label}
                  </MobileMenuLink>
                ))}
              </MobileMenuSection>
            </MobileMenu>
          )}
          banner={(
            <>
              {menuMode && !top && !menuOpen && menuButton === 'switcher' && switcherStyle === 'strip' && (
                <MobileModuleStrip label="Teams" items={teamItems} />
              )}
              {offline && (
                <div role="status" className="bg-muted text-muted-foreground flex shrink-0 items-center gap-2 px-4 py-1.5 text-[11px]">
                  <HugeiconsIcon icon={WifiOff01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                  <span className="min-w-0 truncate">
                    Offline. {queued > 0 ? `${plural(queued, 'change')} waiting to sync.` : 'Changes sync when you reconnect.'}
                  </span>
                </div>
              )}
            </>
          )}
          screenKey={`${tab}:${stack.length}`}
          pushed={!!top}
          fab={fab && <MobileFab label="New issue" onClick={newIssue} />}
          foot={screen.foot}
          floatingBar={floating ? ({ minimized, expand }) => (
            <MobileFloatingTabBar
              tabs={tabs}
              current={tab}
              onSelect={(id) => {
                setSearching(false)
                chooseTab(id as TabId)
              }}
              search={{
                label: 'Search issues',
                icon: Search01Icon,
                onClick: () => {
                  setSearching(true)
                  setStacks((s) => ({ ...s, issues: [] }))
                  setTab('issues')
                },
              }}
              minimized={minimized}
              onExpand={expand}
            />
          ) : undefined}
          tabBar={withTabs && !floating && (
            <MobileTabBar
              tabs={tabs}
              current={tab}
              onSelect={(id) => chooseTab(id as TabId)}
              centre={action === 'tab' ? { label: 'New issue', onClick: newIssue } : undefined}
            />
          )}
        >
          {/* With the menu there is no title in the top bar: a first screen says what it is. */}
          {menuMode && !top && tab !== 'home' && <h2 className="px-4 pt-3 pb-2 text-xl font-semibold tracking-tight">{screen.title}</h2>}
          {screen.body}
        </MobileShell>

        {display === 'browser' && (
          <div aria-hidden className="text-brand flex h-10 shrink-0 items-center justify-around border-t">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-5" />
            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} className="size-5" />
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-5" />
          </div>
        )}
        <PhoneHomeIndicator />

        {/* Bottom sheets, inside the phone: a property's picker, sort and filter, quick create. */}
        {menuMode && menuButton === 'switcher' && switcherStyle === 'sheet' && (
          <MobileModuleSheet open={teamsOpen} onOpenChange={setTeamsOpen} title="Switch team" items={teamItems} container={screenEl} />
        )}
        <MobileSheet
          open={!!field && !!pickJob}
          onOpenChange={(o) => !o && setSheet(null)}
          container={screenEl}
          title={field?.title ?? ''}
          description={field && pickJob ? `Choose the ${field.title.toLowerCase()} of ${pickJob.id}.` : ''}
        >
          {field && pickJob && field.options.map((o) => {
            const selected = field.value(pickJob) === o.value
            return (
              <MobileOption
                key={o.value}
                visual={o.visual}
                label={o.label}
                selected={selected}
                onClick={() => {
                  if (!selected) change(pickJob.id, field.patch(o.value))
                  setSheet(null)
                }}
              />
            )
          })}
        </MobileSheet>

        <MobileSheet
          open={sheet?.kind === 'filter'}
          onOpenChange={(o) => !o && setSheet(null)}
          container={screenEl}
          title="Sort and filter"
          description="How the issues are ordered, and whose are shown."
        >
          <div className="grid gap-4 px-4">
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-[11px]">Sort by</span>
              <ToggleGroup type="single" variant="outline" spacing={0} value={sort} onValueChange={(v) => v && setSort(v as Sort)} aria-label="Sort by" className="w-full">
                {SORTS.map((s) => <ToggleGroupItem key={s.id} value={s.id} className="h-9 flex-1">{s.label}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>
            <label className="flex h-9 items-center justify-between gap-3 text-[13px]">
              Assigned to me only
              <Switch checked={mine} onCheckedChange={setMine} />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 flex-1" onClick={() => { setSort('priority'); setMine(false) }}>Reset</Button>
              <Button className="h-10 flex-1" onClick={() => setSheet(null)}>Show {plural(listed.length, 'issue')}</Button>
            </div>
          </div>
        </MobileSheet>

        <MobileSheet
          open={sheet?.kind === 'new'}
          onOpenChange={(o) => !o && setSheet(null)}
          container={screenEl}
          title="New issue"
          description="Assigned to you, in Todo. Add the rest on the issue."
          showDescription
        >
          <form
            className="grid gap-3 px-4 pt-1"
            onSubmit={(e) => {
              e.preventDefault()
              create()
            }}
          >
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title" aria-label="Issue title" className="h-10 text-[13px]" />
            <Button type="submit" className="h-10" disabled={!title.trim()}>Create issue</Button>
          </form>
        </MobileSheet>
    </PhoneFrame>
  )
}

function screenTitle(screen: Screen) {
  return screen.kind === 'issue' ? screen.id : screen.label
}


// A pushed screen: one issue, full width. Each property is a row that opens
// its picker in a bottom sheet.
function IssueScreen({ job, activity, onPick, onToggleSubtask }: {
  job: Job
  activity: Activity[]
  onPick: (field: Field) => void
  onToggleSubtask: (id: string) => void
}) {
  const label = (field: 'status' | 'priority', value: string) => FIELDS[field].options.find((o) => o.value === value)?.label
  return (
    <div className="grid gap-4 p-4 pt-1">
      <h2 className="text-base font-semibold tracking-tight">{job.title}</h2>
      <MobileGroup>
        <MobileRow label="Status" detail={<span className="text-foreground flex items-center gap-2"><StatusIcon status={job.status} /> {label('status', job.status)}</span>} chevron onClick={() => onPick('status')} />
        <MobileRow label="Priority" detail={<span className="text-foreground flex items-center gap-2"><PriorityIcon priority={job.priority} /> {label('priority', job.priority)}</span>} chevron onClick={() => onPick('priority')} />
        <MobileRow
          label="Assignee"
          detail={<span className="text-foreground flex items-center gap-2">{job.driver ? <UserAvatar name={job.driver} className="size-4" /> : <NoAssignee />} {job.driver || 'No assignee'}</span>}
          chevron
          onClick={() => onPick('assignee')}
        />
        {job.customer && <MobileRow label="Customer" detail={job.customer} />}
        {job.due && <MobileRow label="Due" detail={job.due} />}
      </MobileGroup>
      {job.description && <p className="text-muted-foreground text-[13px] leading-relaxed">{job.description}</p>}
      {job.subtasks.length > 0 && (
        <div className="grid gap-1">
          <h3 className="text-xs font-medium">Subtasks</h3>
          {job.subtasks.map((s) => (
            <label key={s.id} className="flex min-h-10 items-center gap-3 text-[13px]">
              <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(s.id)} className="accent-brand size-4" />
              <span className={cn(s.done && 'text-muted-foreground line-through')}>{s.title}</span>
            </label>
          ))}
        </div>
      )}
      {activity.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-xs font-medium">Latest activity</h3>
          {activity.map((a) => (
            <p key={a.id} className="text-muted-foreground flex gap-2 text-xs">
              <UserAvatar name={a.actor} className="size-4" />
              <span className="min-w-0 flex-1">
                <span className="text-foreground">{a.actor}</span> {a.kind === 'comment' ? `commented: ${a.text}` : a.text}
              </span>
              <span className="shrink-0">{a.at}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// More: the account, the pages that did not earn a tab, the theme, and the
// app's own state (installed or not, changes waiting to sync).
// The menu screen shows it too, without the pages (it lists them itself).
function MoreScreen({ display, offline, queued, onPage, onInstall, className }: {
  display: PhoneDisplay
  offline: boolean
  queued: number
  onPage?: (page: (typeof MORE_PAGES)[number]) => void
  onInstall: () => void
  className?: string
}) {
  const { theme, setTheme } = useTheme()
  return (
    <div className={cn('grid gap-5 p-4 pt-1', className)}>
      <div className="flex items-center gap-3">
        <UserAvatar name={ME} className="size-11" />
        <div className="grid min-w-0">
          <span className="text-[13px] font-medium">{ME}</span>
          <span className="text-muted-foreground truncate text-xs">{EMAIL}</span>
        </div>
      </div>

      {onPage && (
        <MobileGroup title="Pages">
          {MORE_PAGES.map((p) => <MobileRow key={p.id} icon={p.icon} label={p.label} chevron onClick={() => onPage(p)} />)}
        </MobileGroup>
      )}

      <MobileGroup title="Appearance">
        <div className="p-2">
          <ToggleGroup type="single" variant="outline" spacing={0} value={theme} onValueChange={(v) => v && setTheme(v as Theme)} aria-label="Theme" className="w-full">
            {THEMES.map((t) => <ToggleGroupItem key={t.value} value={t.value} className="h-9 flex-1">{t.label}</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
      </MobileGroup>

      <MobileGroup title="App">
        {display === 'browser'
          ? <MobileRow icon={SquareArrowUp02Icon} label="Install on this phone" onClick={onInstall} />
          : <MobileRow visual={<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-4" />} label="Installed" detail="Opens full screen" />}
        <MobileRow
          icon={offline ? WifiOff01Icon : Wifi01Icon}
          label={offline ? 'Offline' : 'Online'}
          detail={queued > 0 ? `${plural(queued, 'change')} to sync` : 'All synced'}
        />
      </MobileGroup>

      <Button variant="outline" className="text-destructive h-10" onClick={() => toast('Signed out', { description: 'Demo only.' })}>
        <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out
      </Button>
    </div>
  )
}
