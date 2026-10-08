import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiChat02Icon, BubbleChatIcon, DashboardSquare01Icon, Home01Icon, InboxIcon, Logout01Icon, Menu01Icon, QrCodeScanIcon,
  Search01Icon, SparklesIcon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  MobileFab, MobileGroup, MobileMenu, MobileMenuButton, MobileMenuLink, MobileMenuSection, MobileOption, MobileRow,
  MobileFloatingTabBar, MobileSheet, MobileShell, MobileTabBar, MobileTopAction, MobileTopBar, type MobileTab,
} from '@/blocks/mobile-shell'
import { IconMark, LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { QrScanner } from '@/components/qr-scanner'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePath } from '@/lib/router'
import { useTheme, type Theme } from '@/lib/theme'
import { COMPANIES, DEMO_USERS, ROLE_LABEL } from './data'
import { edition } from './edition'
import { openScanned } from './forms/FormsPages'
import { pagesOf } from './modules'
import { openModule } from './phone'
import { go, goScreen } from './route'
import { CompanySwitcher, allowedModules, moduleDescription, moduleLabel, useAlerts } from './Shell'
import { useErp, type PhoneNav, type StartPage, type TabStyle } from './store'
import type { ErpModule, ErpPage } from './types'

// The ERP on a phone: the kit's mobile shell block in place of the sidebar
// and the two header rows. The tab bar holds Home (the launchpad, and every
// module under it), Inbox (what needs you), Scan (a form's QR code), Ask AI
// and More (modules, company, role, theme, sign out). Home is a stack of
// screens made from the route: launchpad › a module's pages › a page › one
// thing on it, each with a back arrow to the one under it, so the phone's
// Back button and the arrow agree. A record opens as a full-width panel over
// the page. Inbox and More sit over the page without leaving it, so a list
// keeps its search and a half-filled form its answers.
//
// The Navigation setting (in More) swaps the tab bar for a menu screen:
// "Menu" in the top bar opens everything full screen under it, in big type
// (as shadcn's own site does on a phone): Home, Ask AI, Inbox and Scan; the
// open module's pages; every module; and the account. Then each module page
// is a first screen of its own, and only one thing on a page (a form being
// filled in) keeps a back arrow. "Both" keeps a tab bar under the menu, for
// the screens used all day (Home, Inbox, Scan, Ask AI).
//
// Tab bar style: classic, along the bottom; or floating, as iOS 26 draws it,
// a capsule over the page with Scan among the tabs and search as a
// round button beside it, shrinking to the current tab while you scroll down.

type Tab = 'home' | 'inbox' | 'more'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// How deep a screen sits in the Home stack: a deeper one slides in.
function depthOf(module: ErpModule, page: ErpPage, index: boolean, rest: string | null) {
  if (module.id === 'home') return page.id === 'launchpad' || page.id === 'assistant' ? 0 : 1
  return index ? 1 : rest ? 3 : 2
}

export function PhoneShell({ module, page, index, rest, aside, children }: {
  module: ErpModule
  page: ErpPage
  // The module's list of pages, in place of a page (…/<module> with no page).
  index: boolean
  // One thing on the page (a form being filled in): it covers the tab bar.
  rest: string | null
  aside?: ReactNode
  children: ReactNode
}) {
  const { data, pageTitle, setPaletteOpen, copilotOpen, setCopilotOpen, startCreate, openPeek, phoneNav, tabStyle, session, setRole } = useErp()
  const path = usePath()
  const alerts = useAlerts()
  const [tab, setTab] = useState<Tab>('home')
  const [read, setRead] = useState<Set<string>>(() => new Set())
  const [scanning, setScanning] = useState(false)
  const [choosingRole, setChoosingRole] = useState(false)
  const [chatsOpen, setChatsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuMode = phoneNav !== 'tabs'
  const withTabs = phoneNav !== 'menu' && !rest
  const floating = withTabs && tabStyle === 'floating'

  // Going anywhere returns to Home's stack, with the new screen's top in view.
  useEffect(() => {
    setTab('home')
    setScrolled(false)
    setMenuOpen(false)
    setChatsOpen(false)
  }, [path])

  // The menu has no More: switching to it there goes back to the page.
  useEffect(() => {
    if (menuMode) setTab((t) => (t === 'more' ? 'home' : t))
  }, [menuMode])

  const depth = depthOf(module, page, index, rest)
  // Inbox and More open at their top; the page under them keeps its place in the tree.
  useEffect(() => {
    document.getElementById('erp-main')?.scrollTo({ top: 0 })
  }, [tab])

  const lastDepth = useRef(depth)
  const pushed = depth > lastDepth.current
  useEffect(() => {
    lastDepth.current = depth
  }, [depth])

  const visiblePages = pagesOf(module).filter((p) => !p.hidden)
  const unread = alerts.filter((a) => !read.has(a.id)).length
  const ai = edition().assistant
  const onAssistant = module.id === 'home' && page.id === 'assistant'
  const current = (ai ? onAssistant && tab === 'home' : copilotOpen) ? 'ai' : tab

  // Where the back arrow goes, and what it is called: the screen under this one.
  let back: { label: string; onClick: () => void } | undefined
  if (menuMode) {
    // With the menu, every page is a first screen; only one thing on a page goes back to it.
    if (rest) back = { label: page.label, onClick: () => go(module.id, page.id) }
  } else if (module.id === 'home') {
    if (depth > 0) back = { label: 'Assistant', onClick: () => go('home', 'assistant') }
  } else if (index) {
    back = { label: 'Home', onClick: () => go('home', 'launchpad') }
  } else if (rest) {
    back = { label: page.label, onClick: () => go(module.id, page.id) }
  } else {
    back = visiblePages.length > 1
      ? { label: moduleLabel(module), onClick: () => go(module.id) }
      : { label: 'Home', onClick: () => go('home', 'launchpad') }
  }

  const Extra = page.sidebar
  // The floating bar has search beside it, so the top bar leaves it out.
  const search = !floating && <MobileTopAction label="Search" icon={Search01Icon} onClick={() => setPaletteOpen(true)} />
  const create = !index && !rest && page.list?.create ? page.list : undefined

  const markAllRead = unread > 0 && (
    <button type="button" className="text-brand px-2 text-xs" onClick={() => setRead(new Set(alerts.map((a) => a.id)))}>
      Mark all read
    </button>
  )

  let header: ReactNode
  if (menuMode && !back) {
    header = (
      <MobileTopBar
        title={<MobileMenuButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} controls="erp-menu" />}
        actions={!menuOpen && (
          <>
            {tab === 'home' && Extra && <MobileTopAction label="Chats" icon={BubbleChatIcon} onClick={() => setChatsOpen(true)} />}
            {search}
          </>
        )}
      />
    )
  } else if (tab === 'inbox') {
    header = (
      <MobileTopBar
        title="Inbox"
        large
        actions={markAllRead}
      />
    )
  } else if (tab === 'more') {
    header = <MobileTopBar title="More" large />
  } else if (module.id === 'home' && page.id === 'launchpad') {
    // Home's first screen: the company, which you can switch, and search.
    header = <MobileTopBar title={<div className="max-w-56"><CompanySwitcher variant="compact" /></div>} actions={search} />
  } else {
    header = (
      <MobileTopBar
        title={index ? moduleLabel(module) : pageTitle ?? page.label}
        // A big title for a tab's first screen, unless it names a chat.
        large={!back && !pageTitle}
        back={back}
        // The page's own heading says it until it scrolls away.
        titleHidden={!!back && !scrolled}
        actions={
          <>
            {Extra && <MobileTopAction label="Chats" icon={BubbleChatIcon} onClick={() => setChatsOpen(true)} />}
            {search}
          </>
        }
      />
    )
  }

  // More only without the menu, which holds the same. Floating, Scan is a
  // tab; classic, it is the round button in the middle.
  const tabs: MobileTab[] = [
    { id: 'home', label: 'Home', icon: Home01Icon },
    { id: 'inbox', label: 'Inbox', icon: InboxIcon, badge: unread },
    ...(floating ? [{ id: 'scan', label: 'Scan', icon: QrCodeScanIcon }] : []),
    { id: 'ai', label: 'Ask AI', icon: ai ? AiChat02Icon : SparklesIcon },
    ...(menuMode ? [] : [{ id: 'more', label: 'More', icon: Menu01Icon }]),
  ]

  // Goes somewhere from the menu screen, which closes even when it stays put.
  const fromMenu = (action: () => void) => () => {
    setMenuOpen(false)
    setCopilotOpen(false)
    setTab('home')
    action()
  }
  const allowed = allowedModules(session?.role).filter((m) => m.id !== 'home')

  const menu = menuMode && menuOpen && (
    <MobileMenu id="erp-menu" onClose={() => setMenuOpen(false)}>
      <MobileMenuSection title="Menu">
        <MobileMenuLink current={tab === 'home' && module.id === 'home' && page.id === 'launchpad'} onClick={fromMenu(() => go('home', 'launchpad'))}>
          Home
        </MobileMenuLink>
        {ai ? (
          <MobileMenuLink current={tab === 'home' && onAssistant} onClick={fromMenu(() => go('home', 'assistant'))}>Assistant</MobileMenuLink>
        ) : (
          <MobileMenuLink onClick={fromMenu(() => setCopilotOpen(true))}>Ask AI</MobileMenuLink>
        )}
        <MobileMenuLink current={tab === 'inbox'} count={unread} onClick={fromMenu(() => setTab('inbox'))}>Inbox</MobileMenuLink>
        <MobileMenuLink onClick={fromMenu(() => setScanning(true))}>Scan a code</MobileMenuLink>
      </MobileMenuSection>
      {module.id !== 'home' && (
        <MobileMenuSection title={moduleLabel(module)}>
          {visiblePages.map((p) => (
            <MobileMenuLink
              key={p.id}
              current={tab === 'home' && !index && p.id === page.id}
              count={p.badge?.(data)}
              onClick={fromMenu(() => go(module.id, p.id))}
            >
              {p.label}
            </MobileMenuLink>
          ))}
        </MobileMenuSection>
      )}
      <MobileMenuSection title="Modules">
        {allowed.map((m) => (
          // Its pages are in this menu, so a module opens on its first page.
          <MobileMenuLink key={m.id} current={m.id === module.id} onClick={fromMenu(() => go(m.id, m.pages[0].id))}>
            {moduleLabel(m)}
          </MobileMenuLink>
        ))}
      </MobileMenuSection>
      <MobileMenuSection title="Account">
        {/* Like every choice here, it closes the menu first: a sheet over the open menu loses focus to it and shuts. */}
        <MoreScreen modules={false} onChooseRole={fromMenu(() => setChoosingRole(true))} className="p-0 pt-1" />
      </MobileMenuSection>
    </MobileMenu>
  )

  function selectTab(id: string) {
    if (id === 'scan') {
      setScanning(true)
      return
    }
    if (id === 'ai') {
      setTab('home')
      if (ai) go('home', 'assistant')
      else setCopilotOpen(!copilotOpen)
      return
    }
    setCopilotOpen(false)
    // Home again, from Home: back to the launchpad, as phone apps go to a tab's first screen.
    if (id === 'home' && tab === 'home') go('home', 'launchpad')
    setTab(id as Tab)
  }

  return (
    <>
      <MobileShell
        className="h-svh"
        header={header}
        bodyId="erp-main"
        bodyClassName="@container"
        screenKey={path}
        pushed={tab === 'home' && pushed}
        onBodyScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}
        fab={tab === 'home' && create && <MobileFab label={`New ${create.singular}`} onClick={() => startCreate(create.entity)} />}
        menu={menu}
        floatingBar={floating ? ({ minimized, expand }) => (
          <MobileFloatingTabBar
            tabs={tabs}
            current={current}
            onSelect={selectTab}
            search={{ label: 'Search', icon: Search01Icon, onClick: () => setPaletteOpen(true) }}
            minimized={minimized}
            onExpand={expand}
          />
        ) : undefined}
        tabBar={withTabs && !floating && (
          <MobileTabBar tabs={tabs} current={current} onSelect={selectTab} centre={{ label: 'Scan a code', icon: QrCodeScanIcon, onClick: () => setScanning(true) }} />
        )}
      >
        {/* The page stays mounted under Inbox and More, so it keeps its state. */}
        {/* h-full, so a page that fills the screen (the Assistant's chat) can. */}
        <div className={cn('h-full', tab !== 'home' && 'hidden')}>
          {index && <ModuleIndex module={module} />}
          {children}
        </div>
        {tab === 'inbox' && menuMode && (
          // No top bar title with the menu: the screen says what it is.
          <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
            <h2 className="text-xl font-semibold tracking-tight">Inbox</h2>
            {markAllRead}
          </div>
        )}
        {tab === 'inbox' && (
          <ul className="divide-y">
            {alerts.map((a) => {
              const isNew = !read.has(a.id)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRead((r) => new Set(r).add(a.id))
                      openPeek(a.entity, a.id)
                    }}
                    className="hover:bg-accent focus-visible:bg-accent flex w-full items-start gap-3 px-4 py-3 text-left outline-none"
                  >
                    <span className="relative shrink-0">
                      <UserAvatar name={a.actor} className="size-8" />
                      {isNew && <span className="bg-brand ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2" />}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn('text-[13px]', isNew ? 'font-medium' : 'text-muted-foreground')}>
                        {isNew && <span className="sr-only">New: </span>}
                        {a.actor} {a.text}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10.5px]">{a.id}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[11px]">{a.time}</span>
                  </button>
                </li>
              )
            })}
            {alerts.length === 0 && <li className="text-muted-foreground p-4 text-xs">Nothing needs you.</li>}
          </ul>
        )}
        {tab === 'more' && <MoreScreen onModule={() => setTab('home')} onChooseRole={() => setChoosingRole(true)} />}
      </MobileShell>

      {aside}

      {/* Out here rather than in More, so the menu screen, which shows More's settings, never holds a dialog. */}
      {session && (
        <MobileSheet open={choosingRole} onOpenChange={setChoosingRole} title="Role" description="See the app as another role would. Demo only.">
          {DEMO_USERS.map((u) => (
            <MobileOption
              key={u.role}
              label={ROLE_LABEL[u.role]}
              selected={u.role === session.role}
              onClick={() => {
                setChoosingRole(false)
                if (u.role === session.role) return
                setRole(u.role, u.title)
                toast(`Viewing as ${ROLE_LABEL[u.role]}`, { description: 'Your modules and the launchpad now show this role’s.' })
                go('home', 'launchpad')
              }}
            />
          ))}
        </MobileSheet>
      )}

      <MobileSheet
        open={scanning}
        onOpenChange={setScanning}
        title="Scan a code"
        description="Point the camera at a form's QR code, or enter the code or link."
        showDescription
      >
        <div className="px-4 pt-1">
          {scanning && (
            <QrScanner
              onScan={(value) => {
                setScanning(false)
                openScanned(value)
              }}
            />
          )}
        </div>
      </MobileSheet>

      {/* A page's own part of the sidebar (the Assistant's chats), from the top bar. */}
      {Extra && (
        <Sheet open={chatsOpen} onOpenChange={setChatsOpen}>
          <SheetContent side="left" showCloseButton={false} className="bg-sidebar gap-0 p-0 pt-[env(safe-area-inset-top)] data-[side=left]:w-80 data-[side=left]:max-w-[88vw]">
            <SheetTitle className="sr-only">Chats</SheetTitle>
            <SheetDescription className="sr-only">Your chats and projects.</SheetDescription>
            <div className="flex min-h-0 flex-1 flex-col pt-2">
              <Extra onNavigate={() => setChatsOpen(false)} pageId={page.id} />
            </div>
          </SheetContent>
        </Sheet>
      )}

    </>
  )
}

// A module's pages, as the sidebar lists them: under their headings, with
// their counts. The screen between the launchpad and a page.
function ModuleIndex({ module }: { module: ErpModule }) {
  const { data } = useErp()
  const groups = useMemo(() => {
    const out: { title?: string; pages: ErpPage[] }[] = []
    for (const p of pagesOf(module).filter((p) => !p.hidden)) {
      const last = out[out.length - 1]
      if (last && last.title === p.group) last.pages.push(p)
      else out.push({ title: p.group, pages: [p] })
    }
    return out
  }, [module])
  return (
    <div className="grid gap-5 p-4 pt-2">
      <div className="flex items-center gap-3">
        <IconMark icon={module.icon} colour={module.colour} size="lg" />
        <div className="grid min-w-0 gap-0.5">
          <h2 className="text-xl font-semibold tracking-tight">{moduleLabel(module)}</h2>
          <p className="text-muted-foreground text-xs">{moduleDescription(module)}</p>
        </div>
      </div>
      {module.metric && <p className="text-xs tabular-nums">{module.metric(data)}</p>}
      {groups.map((g, i) => (
        <MobileGroup key={g.title ?? i} title={g.title}>
          {g.pages.map((p) => {
            const count = p.badge?.(data)
            return (
              <MobileRow
                key={p.id}
                icon={p.icon}
                label={p.label}
                detail={count ? <span className="tabular-nums">{count}</span> : undefined}
                chevron
                onClick={() => go(module.id, p.id)}
              />
            )
          })}
        </MobileGroup>
      ))}
    </div>
  )
}

// More: who you are, your modules, the company, and the settings the
// account menu holds on a computer. The menu screen shows it too, without
// the modules (it lists them itself).
function MoreScreen({ onModule, onChooseRole, modules: showModules = true, className }: {
  onModule?: () => void
  onChooseRole: () => void
  modules?: boolean
  className?: string
}) {
  const { session, company, setCompany, signOut, startPage, setStartPage, phoneNav, setPhoneNav, tabStyle, setTabStyle } = useErp()
  const { theme, setTheme } = useTheme()
  if (!session) return null
  const modules = allowedModules(session.role).filter((m) => m.id !== 'home')

  return (
    <div className={cn('grid gap-5 p-4 pt-1', className)}>
      <div className="flex items-center gap-3">
        <UserAvatar name={session.name} className="size-11" />
        <div className="grid min-w-0">
          <span className="text-[13px] font-medium">{session.name}</span>
          <span className="text-muted-foreground truncate text-xs">{session.title} · {session.email}</span>
        </div>
      </div>

      {showModules && <MobileGroup title="Modules">
        {modules.map((m) => (
          <MobileRow
            key={m.id}
            visual={<IconMark icon={m.icon} colour={m.colour} size="sm" />}
            label={moduleLabel(m)}
            chevron
            onClick={() => {
              onModule?.()
              openModule(m)
            }}
          />
        ))}
      </MobileGroup>}

      <MobileGroup title="Company">
        {COMPANIES.map((c) => (
          <MobileRow
            key={c.id}
            visual={<LetterMark text={c.short} colour={c.colour} size="xs" />}
            label={c.name}
            detail={c.id === company?.id ? 'Current' : c.country}
            onClick={c.id === company?.id ? undefined : () => {
              setCompany(c.id)
              toast(`Switched to ${c.name}`, { description: 'Demo data is shared between companies.' })
            }}
          />
        ))}
      </MobileGroup>

      <MobileGroup title="Settings">
        <MobileRow icon={UserSwitchIcon} label="Role" detail={ROLE_LABEL[session.role]} chevron onClick={onChooseRole} />
        <MobileRow label="Navigation">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={phoneNav}
            onValueChange={(v) => v && setPhoneNav(v as PhoneNav)}
            aria-label="Navigation"
            className="w-full"
          >
            <ToggleGroupItem value="tabs" className="h-9 flex-1">Tab bar</ToggleGroupItem>
            <ToggleGroupItem value="menu" className="h-9 flex-1">Menu</ToggleGroupItem>
            <ToggleGroupItem value="both" className="h-9 flex-1">Both</ToggleGroupItem>
          </ToggleGroup>
        </MobileRow>
        {phoneNav !== 'menu' && (
          <MobileRow label="Tab bar style">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={tabStyle}
              onValueChange={(v) => v && setTabStyle(v as TabStyle)}
              aria-label="Tab bar style"
              className="w-full"
            >
              <ToggleGroupItem value="classic" className="h-9 flex-1">Classic</ToggleGroupItem>
              <ToggleGroupItem value="floating" className="h-9 flex-1">Floating</ToggleGroupItem>
            </ToggleGroup>
          </MobileRow>
        )}
        <MobileRow label="Theme">
          <ToggleGroup type="single" variant="outline" spacing={0} value={theme} onValueChange={(v) => v && setTheme(v as Theme)} aria-label="Theme" className="w-full">
            {THEMES.map((t) => <ToggleGroupItem key={t.value} value={t.value} className="h-9 flex-1">{t.label}</ToggleGroupItem>)}
          </ToggleGroup>
        </MobileRow>
        {edition().assistant && (
          <MobileRow label="Start page">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={startPage}
              onValueChange={(v) => {
                if (!v) return
                setStartPage(v as StartPage)
                toast(`You'll start on the ${v === 'assistant' ? 'Assistant' : 'launchpad'}`, { description: 'From your next sign-in.' })
              }}
              aria-label="Start page"
              className="w-full"
            >
              <ToggleGroupItem value="launchpad" className="h-9 flex-1">Launchpad</ToggleGroupItem>
              <ToggleGroupItem value="assistant" className="h-9 flex-1">Assistant</ToggleGroupItem>
            </ToggleGroup>
          </MobileRow>
        )}
      </MobileGroup>

      <MobileGroup>
        <MobileRow icon={DashboardSquare01Icon} label="Back to the UI kit" onClick={() => { window.location.hash = '#/overview' }} />
        <MobileRow
          visual={<HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="text-destructive size-4" />}
          label={<span className="text-destructive">Sign out</span>}
          onClick={() => {
            signOut()
            goScreen('login')
          }}
        />
      </MobileGroup>

    </div>
  )
}
