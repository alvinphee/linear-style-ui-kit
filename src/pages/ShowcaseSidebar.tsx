import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowDown01Icon, ArrowRight01Icon, KeyboardIcon, Logout01Icon, Search01Icon,
  Settings01Icon, Tick02Icon, UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { NAV_GROUPS, goTo } from './nav'

// Made-up workspaces: the switcher shows the pattern, only the first is real.
const WORKSPACES = [
  { name: 'Kitchen Sink', short: 'KS', colour: 'var(--primary)' },
  { name: 'Acme Studio', short: 'AS', colour: 'oklch(0.62 0.15 150)' },
  { name: 'Side project', short: 'SP', colour: 'oklch(0.7 0.15 60)' },
]

function WorkspaceMark({ short, colour }: { short: string; colour: string }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded text-[9px] font-semibold text-white" style={{ background: colour }}>
      {short}
    </span>
  )
}

function WorkspaceSwitcher() {
  const current = WORKSPACES[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-sidebar-accent flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 text-left outline-none focus-visible:ring-2"
        >
          <span className="bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded text-[9px] font-semibold">
            {current.short}
          </span>
          <span className="text-foreground truncate text-[13px] font-medium">{current.name}</span>
          <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground ml-auto size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {WORKSPACES.map((w, i) => (
          <DropdownMenuItem
            key={w.name}
            onSelect={() => i > 0 && toast(`Switched to ${w.name}`, { description: 'Demo only. The page stays the same.' })}
          >
            <WorkspaceMark short={w.short} colour={w.colour} />
            <span className="flex-1">{w.name}</span>
            {i === 0 && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => toast('Create workspace', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => goTo('settings')}>
          <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Workspace settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast('Logged out', { description: 'Demo only.' })}>
          <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ShowcaseSidebar({ active, onSearch, onShortcuts }: {
  active: string
  onSearch: () => void
  onShortcuts: () => void
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  // Scrolling (or jumping) into a folded group opens it, so the highlight stays visible.
  useEffect(() => {
    const group = NAV_GROUPS.find((g) => g.items.some((i) => i.id === active))
    if (group) setClosed((c) => (c[group.title] ? { ...c, [group.title]: false } : c))
  }, [active])

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r md:flex">
      <div className="flex h-11 items-center px-2">
        <WorkspaceSwitcher />
      </div>

      <div className="px-2">
        <button
          type="button"
          onClick={onSearch}
          className="text-muted-foreground hover:bg-sidebar-accent flex h-7 w-full items-center gap-2 rounded-md border px-2 text-xs"
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5" />
          Search…
          <KbdGroup className="ml-auto">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </button>
      </div>

      <nav className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {NAV_GROUPS.map((group) => {
          const open = !closed[group.title]
          return (
            <div key={group.title} className="mt-3">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setClosed((c) => ({ ...c, [group.title]: open }))}
                className="text-muted-foreground hover:text-foreground flex h-6 w-full items-center gap-1 rounded px-2 text-[11px] font-medium"
              >
                {group.title}
                <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3" />
                <span className="ml-auto tabular-nums opacity-60">{group.items.length}</span>
              </button>
              {open && (
                <div className="mt-0.5 grid gap-px">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(item.id)}
                      data-active={active === item.id}
                      className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground flex h-7 items-center gap-2 rounded-md px-2 text-left text-xs"
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={onShortcuts}
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex h-7 w-full items-center gap-2 rounded-md px-2 text-xs"
        >
          <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} className="size-3.5" />
          Keyboard shortcuts
          <Kbd className="ml-auto">?</Kbd>
        </button>
        <p className="text-muted-foreground px-2 pt-2 text-[11px] leading-4">shadcn/ui Mira · Hugeicons free · Inter</p>
      </div>
    </aside>
  )
}
