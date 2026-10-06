import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ComputerIcon, DashboardSquare01Icon, Home01Icon, Logout01Icon, Menu01Icon, Moon02Icon, Search01Icon,
  SidebarLeftIcon, SparklesIcon, Sun03Icon, Tick02Icon, UnfoldMoreIcon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AccountMenu as KitAccountMenu } from '@/blocks/account-menu'
import { FoldingBreadcrumb, type Crumb } from '@/blocks/folding-breadcrumb'
import { GlobalHeader } from '@/blocks/global-header'
import { NotificationsMenu } from '@/blocks/notifications-menu'
import { WorkspaceSwitcher } from '@/blocks/workspace-switcher'
import { IconAction } from '@/components/icon-action'
import { IconMark, LetterMark } from '@/components/mark'
import { NavHeading, NavItem } from '@/components/nav-item'
import { SearchTrigger } from '@/components/search-trigger'
import { Shortcut } from '@/components/shortcut'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatMoney } from '@/lib/format'
import { isTyping } from '@/lib/keyboard'
import { plural } from '@/lib/text'
import { useTheme } from '@/lib/theme'
import { COMPANIES, DEMO_USERS, ROLE_LABEL } from './data'
import { edition } from './edition'
import { MODULES, pagesOf } from './modules'
import { go, goScreen } from './route'
import { useErp, type StartPage } from './store'
import type { EntityId, ErpModule, ErpPage, Role } from './types'

export const allowedModules = (role: Role | undefined) => MODULES.filter((m) => role && m.roles.includes(role))

// Home is "Launchpad" while that is its only page; with the Assistant beside
// it (ERP + AI) it is "Home".
const moduleLabel = (m: ErpModule) => (m.id === 'home' && !edition().assistant ? 'Launchpad' : m.name)
const moduleDescription = (m: ErpModule) => (m.id === 'home' && edition().assistant ? 'Your launchpad and the Assistant' : m.description)

// The app frame: a full-height sidebar (company, module switcher, the
// module's pages, recent records, and the account at the foot) beside the
// page. Over the page, two rows: the global header (search, Ask AI,
// notifications and light / dark) and the breadcrumb bar. On a phone the
// sidebar opens as a sheet.
export function Shell({ module, page, children }: { module: ErpModule; page: ErpPage; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // "[" folds the sidebar away, like Linear.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || isTyping(e.target)) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // relative: keeps any visually hidden (sr-only) text inside the frame.
    <div className="bg-background text-foreground relative flex h-svh overflow-hidden">
      {!collapsed && (
        <aside aria-label="Navigation" className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex">
          <Sidebar module={module} page={page} />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopRow module={module} page={page} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onMenu={() => setMenuOpen(true)} />
        <BreadcrumbBar module={module} page={page} />
        <main id="erp-main" className="@container min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" showCloseButton={false} className="bg-sidebar gap-0 p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Switch module or open a page.</SheetDescription>
          <Sidebar module={module} page={page} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// The shared workspace switcher, over the companies (multi-company).
function CompanySwitcher() {
  const { company, session, setCompany } = useErp()
  if (!company) return null
  return (
    <WorkspaceSwitcher
      workspaces={COMPANIES}
      currentId={company.id}
      onSelect={(id) => {
        setCompany(id)
        const next = COMPANIES.find((c) => c.id === id)
        if (next) toast(`Switched to ${next.name}`, { description: 'Demo data is shared between companies.' })
      }}
      label="Companies"
      detail={`${session ? ROLE_LABEL[session.role] : ''} · ${company.country}`}
      menuClassName="w-64"
    >
      <DropdownMenuItem onSelect={() => goScreen('companies')}>All companies</DropdownMenuItem>
    </WorkspaceSwitcher>
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
            <IconMark icon={m.icon} colour={m.colour} />
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{moduleLabel(m)}</span>
              <span className="text-muted-foreground truncate text-[11px]">{moduleDescription(m)}</span>
            </span>
            {m.id === module.id ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} /> : <DropdownMenuShortcut>G {m.key}</DropdownMenuShortcut>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Sidebar({ module, page, onNavigate }: { module: ErpModule; page: ErpPage; onNavigate?: () => void }) {
  const { data, recent, openPeek } = useErp()
  // A page's own part of the sidebar, such as the Assistant's chat history.
  const Extra = page.sidebar
  const open = (m: string, p: string) => {
    go(m, p)
    onNavigate?.()
  }
  // Consecutive pages with the same group share a heading ("Receivables"…).
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-1.5 p-2">
        <CompanySwitcher />
        <ModuleMenu module={module} onNavigate={onNavigate}>
          <button
            type="button"
            aria-label={`Module: ${module.name}. Switch module`}
            className="bg-background/60 hover:bg-background focus-visible:ring-ring/40 flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg border px-2 text-left shadow-xs outline-none focus-visible:ring-2"
          >
            <IconMark icon={module.icon} colour={module.colour} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{moduleLabel(module)}</span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          </button>
        </ModuleMenu>
      </div>

      <nav aria-label={`${module.name} pages`} className={cn('px-2', Extra ? 'shrink-0 pb-1' : 'min-h-0 flex-1 overflow-y-auto pb-3')}>
        {groups.map((g, i) => (
          <div key={g.title ?? i} className={cn(!g.title && i === 0 && 'mt-1')}>
            {g.title && <NavHeading>{g.title}</NavHeading>}
            <div className="grid gap-px">
              {g.pages.map((p) => (
                <NavItem
                  key={p.id}
                  icon={p.icon}
                  label={p.label}
                  count={p.badge?.(data)}
                  active={p.id === page.id}
                  onClick={() => open(module.id, p.id)}
                  className="data-[active=true]:font-medium"
                />
              ))}
            </div>
          </div>
        ))}

        {!Extra && recent.length > 0 && (
          <>
            <NavHeading>Recent</NavHeading>
            <div className="grid gap-px">
              {recent.slice(0, 5).map((r) => (
                <NavItem
                  key={r.id}
                  mark={<span className="text-muted-foreground shrink-0 font-mono text-[10.5px]">{r.id}</span>}
                  label={r.label}
                  onClick={() => {
                    openPeek(r.entity as EntityId, r.id)
                    onNavigate?.()
                  }}
                />
              ))}
            </div>
          </>
        )}
      </nav>
      {Extra && <Extra onNavigate={onNavigate} pageId={page.id} />}

      <footer className="border-t p-2">
        <AccountMenu />
      </footer>
    </div>
  )
}

// The global header, the first of the two rows over the page (the shared
// GlobalHeader block). Left: the menu button (phone), the sidebar toggle,
// and the module switcher while the sidebar is hidden. Middle: search, which
// opens the command palette. Right: Ask AI, notifications, light / dark, and
// the account whenever the sidebar (where it lives) is out of sight.
function TopRow({ module, page, collapsed, onToggle, onMenu }: {
  module: ErpModule
  page: ErpPage
  collapsed: boolean
  onToggle: () => void
  onMenu: () => void
}) {
  const { setPaletteOpen, setCopilotOpen } = useErp()
  const onAssistant = module.id === 'home' && page.id === 'assistant'

  return (
    <GlobalHeader
      className="bg-background border-b md:px-3"
      start={
        <>
          <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open menu" onClick={onMenu}>
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
          {/* aria-pressed, not `pressed`: the button keeps its plain look while the sidebar is hidden. */}
          <IconAction
            label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            icon={SidebarLeftIcon}
            shortcut={['[']}
            size="icon"
            aria-pressed={collapsed}
            onClick={onToggle}
            className="text-foreground hidden shrink-0 md:inline-flex"
          />
          {/* With the sidebar hidden, the module switcher moves up here. */}
          {collapsed && (
            <ModuleMenu module={module}>
              <Button variant="ghost" size="icon" className="hidden shrink-0 md:inline-flex" aria-label={`Module: ${module.name}. Switch module`}>
                <IconMark icon={module.icon} colour={module.colour} size="sm" />
              </Button>
            </ModuleMenu>
          )}
        </>
      }
      center={
        <SearchTrigger
          size="md"
          label="Search records, pages and actions"
          onClick={() => setPaletteOpen(true)}
          className="bg-muted/40 hover:bg-accent w-full"
        />
      }
      centerClassName="hidden md:flex"
      end={
        <>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
          {!onAssistant && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setCopilotOpen(true)}>
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
                  <span className="hidden sm:inline">Ask AI</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ask AI <Shortcut keys={['mod', 'J']} className="ml-1" /></TooltipContent>
            </Tooltip>
          )}
          <Notifications />
          <ThemeToggle />
          <AccountMenu variant="avatar" className={cn(!collapsed && 'md:hidden')} />
        </>
      }
    />
  )
}

// The breadcrumb bar, the second row: where this page sits (company ›
// module › section › page), folding to fit, from the shared
// FoldingBreadcrumb block. The company opens the company list.
function BreadcrumbBar({ module, page }: { module: ErpModule; page: ErpPage }) {
  const { company, pageTitle } = useErp()
  const sectionStart = page.group ? module.pages.find((p) => p.group === page.group) : undefined

  const trail: Crumb[] = [
    ...(company ? [{
      id: 'company',
      label: company.name,
      icon: <LetterMark text={company.short} colour={company.colour} size="xs" />,
      onSelect: () => goScreen('companies'),
    }] : []),
    ...(module.id !== 'home' ? [{
      id: 'module',
      label: module.name,
      icon: <IconMark icon={module.icon} colour={module.colour} size="sm" />,
      onSelect: () => go(module.id, module.pages[0].id),
    }] : []),
    ...(sectionStart ? [{ id: 'section', label: page.group!, onSelect: () => go(module.id, sectionStart.id) }] : []),
    ...(pageTitle ? [{ id: 'page', label: page.label, onSelect: () => go(module.id, page.id) }] : []),
  ]

  return (
    <div className="flex h-10 shrink-0 items-center border-b px-2 md:px-3">
      <FoldingBreadcrumb trail={trail} current={pageTitle ?? page.label} />
    </div>
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
      id: r.id, entity: 'leave' as EntityId, actor: String(r.employee), text: `requested ${plural(Number(r.days), 'day')} of ${String(r.type).toLowerCase()}`, time: '1 h ago',
    })),
    ...data.invoices.filter((r) => r.status === 'Overdue').slice(0, 1).map((r) => ({
      id: r.id, entity: 'invoices' as EntityId, actor: 'Accounts receivable', text: `${r.id} from ${r.customer} is overdue`, time: '3 h ago',
    })),
    ...data.items.filter((r) => r.status === 'Out of stock').slice(0, 1).map((r) => ({
      id: r.id, entity: 'items' as EntityId, actor: 'Inventory', text: `${r.name} is out of stock`, time: 'Yesterday',
    })),
  ].map((alert) => ({ ...alert, unread: true })), [data])
}

// The shared notifications block, the bell in the global header. It keeps
// the read state itself, so every alert starts unread.
function Notifications() {
  const { openPeek } = useErp()
  const alerts = useAlerts()
  return <NotificationsMenu items={alerts} onOpen={(a) => openPeek(a.entity, a.id)} />
}

// The shared account menu, with the ERP's settings as sub-menus: a row at
// the sidebar's foot, or the avatar in the global header (while the sidebar
// is out of sight).
function AccountMenu({ variant = 'row', className }: { variant?: 'row' | 'avatar'; className?: string }) {
  const { session, setRole, signOut, startPage, setStartPage } = useErp()
  const { theme, setTheme } = useTheme()
  if (!session) return null
  return (
    <KitAccountMenu
      name={session.name}
      detail={session.title}
      email={session.email}
      variant={variant}
      size="md"
      menuClassName="w-60"
      className={cn(
        variant === 'row' && 'hover:bg-sidebar-accent focus-visible:ring-ring/40 aria-expanded:bg-sidebar-accent',
        className,
      )}
    >
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
      {edition().assistant && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={Home01Icon} strokeWidth={2} /> Start page
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuLabel>After you sign in</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={startPage} onValueChange={(v) => {
              setStartPage(v as StartPage)
              toast(`You'll start on the ${v === 'assistant' ? 'Assistant' : 'launchpad'}`, { description: 'From your next sign-in.' })
            }}>
              <DropdownMenuRadioItem value="launchpad">Launchpad</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="assistant">Assistant</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
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
    </KitAccountMenu>
  )
}
