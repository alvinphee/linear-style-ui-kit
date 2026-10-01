import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ComputerIcon, DashboardSquare01Icon, LayoutTopIcon, Logout01Icon, Menu01Icon, Moon02Icon,
  Search01Icon, SidebarLeftIcon, SparklesIcon, Sun03Icon, Tick02Icon, UnfoldMoreIcon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { FoldingBreadcrumb, type Crumb } from '@/blocks/folding-breadcrumb'
import { NotificationsMenu } from '@/blocks/notifications-menu'
import { useTheme } from '@/lib/theme'
import { Initials } from '@/pages/sections/StatusSection'
import { COMPANIES, DEMO_USERS, ROLE_LABEL } from './data'
import { formatMoney } from './format'
import { MODULES } from './modules'
import { go, goScreen } from './route'
import { useErp, type HeaderStyle } from './store'
import type { EntityId, ErpModule, ErpPage, Role } from './types'
import { MOD, ModuleMark } from './ui'

export const allowedModules = (role: Role | undefined) => MODULES.filter((m) => role && m.roles.includes(role))

// The app frame: one sidebar (company, module switcher, the module's pages,
// recent records, and Ask AI, notifications and the account at the foot) and
// the page in an inset card. On a phone the sidebar opens as a sheet.
export function Shell({ module, page, children }: { module: ErpModule; page: ErpPage; children: ReactNode }) {
  const { headerStyle } = useErp()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // "[" folds the sidebar away, like Linear.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (e.key !== '[' || e.metaKey || e.ctrlKey || t.closest('input, textarea, [contenteditable="true"], [role="dialog"]')) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // relative: keeps any visually hidden (sr-only) text inside the frame.
    <div className="bg-sidebar text-foreground relative flex h-svh overflow-hidden">
      {!collapsed && (
        <aside aria-label="Navigation" className="hidden w-60 shrink-0 flex-col md:flex">
          <Sidebar module={module} page={page} showSearch={headerStyle === 'crumbs'} />
        </aside>
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col md:py-2 md:pr-2', collapsed && 'md:pl-2')}>
        <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden md:rounded-xl md:border md:shadow-sm">
          <Header module={module} page={page} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onMenu={() => setMenuOpen(true)} />
          <main id="erp-main" className="@container min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="bg-sidebar gap-0 p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Switch module or open a page.</SheetDescription>
          <Sidebar module={module} page={page} onNavigate={() => setMenuOpen(false)} showSearch={false} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CompanySwitcher() {
  const { company, session, setCompany } = useErp()
  if (!company) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-sidebar-accent focus-visible:ring-ring/40 flex w-full min-w-0 items-center gap-2 rounded-md p-1.5 text-left outline-none focus-visible:ring-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold text-white" style={{ background: company.colour }}>
            {company.short}
          </span>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-[13px] font-medium">{company.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">{session ? ROLE_LABEL[session.role] : ''} · {company.country}</span>
          </span>
          <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Companies</DropdownMenuLabel>
        {COMPANIES.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onSelect={() => {
              setCompany(c.id)
              if (c.id !== company.id) toast(`Switched to ${c.name}`, { description: 'Demo data is shared between companies.' })
            }}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded text-[9px] font-semibold text-white" style={{ background: c.colour }}>{c.short}</span>
            <span className="flex-1 truncate">{c.name}</span>
            {c.id === company.id && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => goScreen('companies')}>All companies</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// The app switcher: every module the role can open, with its G shortcut.
// Used in the sidebar and, while the sidebar is hidden, in the breadcrumb.
function ModuleMenu({ module, onNavigate, children }: { module: ErpModule; onNavigate?: () => void; children: ReactNode }) {
  const { session } = useErp()
  const modules = allowedModules(session?.role)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Switch module</DropdownMenuLabel>
        {modules.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={() => {
              go(m.id, m.pages[0].id)
              onNavigate?.()
            }}
            className="gap-2.5 py-1.5"
          >
            <ModuleMark icon={m.icon} colour={m.colour} />
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{m.id === 'home' ? 'Launchpad' : m.name}</span>
              <span className="text-muted-foreground truncate text-[11px]">{m.description}</span>
            </span>
            {m.id === module.id ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} /> : <DropdownMenuShortcut>G {m.key}</DropdownMenuShortcut>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NavLink({ icon, label, badge, active, onClick }: {
  icon?: IconSvgElement
  label: string
  badge?: number
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-active={active}
      className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground focus-visible:ring-ring/40 flex h-7 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2 data-[active=true]:font-medium"
    >
      {icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0 opacity-80" />}
      <span className="truncate">{label}</span>
      {!!badge && <span className="text-muted-foreground ml-auto text-[11px] tabular-nums">{badge}</span>}
    </button>
  )
}

function SidebarHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-muted-foreground mt-4 mb-0.5 px-2 text-[11px] font-medium">{children}</h3>
}

function Sidebar({ module, page, onNavigate, showSearch }: { module: ErpModule; page: ErpPage; onNavigate?: () => void; showSearch: boolean }) {
  const { data, recent, openPeek, setPaletteOpen } = useErp()
  const open = (m: string, p: string) => {
    go(m, p)
    onNavigate?.()
  }
  // Consecutive pages with the same group share a heading ("Receivables"…).
  const groups = useMemo(() => {
    const out: { title?: string; pages: ErpPage[] }[] = []
    for (const p of module.pages) {
      const last = out[out.length - 1]
      if (last && last.title === p.group) last.pages.push(p)
      else out.push({ title: p.group, pages: [p] })
    }
    return out
  }, [module])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-1.5 p-2">
        <CompanySwitcher />
        <ModuleMenu module={module} onNavigate={onNavigate}>
          <button
            type="button"
            aria-label={`Module: ${module.name}. Switch module`}
            className="bg-background/60 hover:bg-background focus-visible:ring-ring/40 flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg border px-2 text-left shadow-xs outline-none focus-visible:ring-2"
          >
            <ModuleMark icon={module.icon} colour={module.colour} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{module.id === 'home' ? 'Launchpad' : module.name}</span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          </button>
        </ModuleMenu>
        {/* One search at a time: here only when the header has none. */}
        {showSearch && (
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="text-muted-foreground hover:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs"
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5" />
            Search or jump to…
            <KbdGroup className="ml-auto">
              <Kbd>{MOD}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </button>
        )}
      </div>

      <nav aria-label={`${module.name} pages`} className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.map((g, i) => (
          <div key={g.title ?? i} className={cn(!g.title && i === 0 && 'mt-1')}>
            {g.title && <SidebarHeading>{g.title}</SidebarHeading>}
            <div className="grid gap-px">
              {g.pages.map((p) => (
                <NavLink key={p.id} icon={p.icon} label={p.label} badge={p.badge?.(data)} active={p.id === page.id} onClick={() => open(module.id, p.id)} />
              ))}
            </div>
          </div>
        ))}

        {recent.length > 0 && (
          <>
            <SidebarHeading>Recent</SidebarHeading>
            <div className="grid gap-px">
              {recent.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    openPeek(r.entity as EntityId, r.id)
                    onNavigate?.()
                  }}
                  className="hover:bg-sidebar-accent focus-visible:ring-ring/40 flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2"
                >
                  <span className="text-muted-foreground shrink-0 font-mono text-[10.5px]">{r.id}</span>
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      <footer className="grid gap-px border-t p-2">
        <Notifications variant="row" />
        <AccountMenu />
      </footer>
    </div>
  )
}

function SearchPill({ className }: { className?: string }) {
  const { setPaletteOpen } = useErp()
  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className={cn('bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/40 h-8 w-full min-w-0 items-center gap-2 rounded-md border px-2.5 text-xs whitespace-nowrap outline-none focus-visible:ring-2', className)}
    >
      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
      <span className="truncate">Search records, pages and actions</span>
      <KbdGroup className="ml-auto"><Kbd>{MOD}</Kbd><Kbd>K</Kbd></KbdGroup>
    </button>
  )
}

// The header: the path to this page on the left (company › module › section
// › page, folding to fit, from the shared FoldingBreadcrumb block), a search
// box in the middle, and Ask AI. The account menu can drop the search box
// (Header › Breadcrumb only), which moves search back into the sidebar.
function Header({ module, page, collapsed, onToggle, onMenu }: {
  module: ErpModule
  page: ErpPage
  collapsed: boolean
  onToggle: () => void
  onMenu: () => void
}) {
  const { setPaletteOpen, setCopilotOpen, company, headerStyle } = useErp()
  const withSearch = headerStyle === 'crumbs-search' || collapsed
  const sectionStart = page.group ? module.pages.find((p) => p.group === page.group) : undefined

  const trail: Crumb[] = [
    ...(company ? [{
      id: 'company',
      label: company.name,
      icon: <span className="grid size-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-semibold text-white" style={{ background: company.colour }}>{company.short}</span>,
      onSelect: () => goScreen('companies'),
    }] : []),
    ...(module.id !== 'home' ? [{
      id: 'module',
      label: module.name,
      icon: <ModuleMark icon={module.icon} colour={module.colour} size="sm" />,
      onSelect: () => go(module.id, module.pages[0].id),
    }] : []),
    ...(sectionStart ? [{ id: 'section', label: page.group!, onSelect: () => go(module.id, sectionStart.id) }] : []),
  ]

  return (
    <header className={cn(
      'grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-2 md:px-3',
      withSearch && 'md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_minmax(0,1fr)]',
    )}>
      <div className="flex min-w-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open menu" onClick={onMenu}>
          <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden shrink-0 md:inline-flex" aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'} aria-pressed={collapsed} onClick={onToggle}>
              <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{collapsed ? 'Show sidebar' : 'Hide sidebar'} <span className="ml-1 opacity-70">[</span></TooltipContent>
        </Tooltip>
        {/* With the sidebar hidden, the module switcher moves up here. */}
        {collapsed && (
          <ModuleMenu module={module}>
            <Button variant="ghost" size="icon" className="hidden shrink-0 md:inline-flex" aria-label={`Module: ${module.name}. Switch module`}>
              <ModuleMark icon={module.icon} colour={module.colour} size="sm" />
            </Button>
          </ModuleMenu>
        )}
        <FoldingBreadcrumb trail={trail} current={page.label} />
      </div>
      {withSearch && <SearchPill className="hidden md:flex" />}
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className={cn(withSearch && 'md:hidden')} aria-label="Search" onClick={() => setPaletteOpen(true)}>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => setCopilotOpen(true)}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ask AI <span className="ml-1 opacity-70">{MOD} J</span></TooltipContent>
        </Tooltip>
        <div className="md:hidden"><Notifications variant="icon" /></div>
      </div>
    </header>
  )
}

// What needs you: approvals and exceptions from the data, newest first.
function useAlerts() {
  const { data } = useErp()
  return useMemo(() => [
    ...data.purchaseOrders.filter((r) => r.status === 'Awaiting approval').slice(0, 2).map((r) => ({
      id: r.id, entity: 'purchaseOrders' as EntityId, actor: String(r.buyer), text: `asked you to approve ${r.id} for ${formatMoney(Number(r.amount))}`, time: '12 min ago',
    })),
    ...data.leave.filter((r) => r.status === 'Pending').slice(0, 2).map((r) => ({
      id: r.id, entity: 'leave' as EntityId, actor: String(r.employee), text: `requested ${r.days} ${Number(r.days) === 1 ? 'day' : 'days'} of ${String(r.type).toLowerCase()}`, time: '1 h ago',
    })),
    ...data.invoices.filter((r) => r.status === 'Overdue').slice(0, 1).map((r) => ({
      id: r.id, entity: 'invoices' as EntityId, actor: 'Accounts receivable', text: `${r.id} from ${r.customer} is overdue`, time: '3 h ago',
    })),
    ...data.items.filter((r) => r.status === 'Out of stock').slice(0, 1).map((r) => ({
      id: r.id, entity: 'items' as EntityId, actor: 'Inventory', text: `${r.name} is out of stock`, time: 'Yesterday',
    })),
  ].map((alert) => ({ ...alert, unread: true })), [data])
}

// The shared notifications block. It keeps the read state itself, so every
// alert starts unread.
function Notifications({ variant }: { variant: 'row' | 'icon' }) {
  const { openPeek } = useErp()
  const alerts = useAlerts()
  return (
    <NotificationsMenu
      variant={variant}
      side={variant === 'row' ? 'right' : 'bottom'}
      items={alerts}
      onOpen={(a) => openPeek(a.entity, a.id)}
    />
  )
}

function AccountMenu() {
  const { session, setRole, signOut, headerStyle, setHeaderStyle } = useErp()
  const { theme, setTheme } = useTheme()
  if (!session) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="hover:bg-sidebar-accent focus-visible:ring-ring/40 aria-expanded:bg-sidebar-accent mt-1 flex h-10 w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-left outline-none focus-visible:ring-2">
          <Initials name={session.name} className="size-7" />
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-xs font-medium">{session.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">{session.title}</span>
          </span>
          <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="text-foreground text-xs font-medium">{session.name}</span>
          <span className="font-normal">{session.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} /> Switch role <span className="text-muted-foreground ml-auto text-[11px]">Demo</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuRadioGroup value={session.role} onValueChange={(v) => {
              const user = DEMO_USERS.find((u) => u.role === v)!
              setRole(user.role, user.title)
              toast(`Viewing as ${ROLE_LABEL[user.role]}`, { description: 'The module switcher and the launchpad now show this role’s modules.' })
              go('home', 'launchpad')
            }}>
              {DEMO_USERS.map((u) => <DropdownMenuRadioItem key={u.role} value={u.role}>{ROLE_LABEL[u.role]}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={theme === 'light' ? Sun03Icon : theme === 'dark' ? Moon02Icon : ComputerIcon} strokeWidth={2} /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={LayoutTopIcon} strokeWidth={2} /> Header
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuRadioGroup value={headerStyle} onValueChange={(v) => setHeaderStyle(v as HeaderStyle)}>
              <DropdownMenuRadioItem value="crumbs-search">Breadcrumb and search</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="crumbs">Breadcrumb only</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="#/overview">
            <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} /> Back to the UI kit
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {
          signOut()
          goScreen('login')
        }}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
