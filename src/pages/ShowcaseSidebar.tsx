import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowUpRight01Icon, KeyboardIcon, Logout01Icon, Settings01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { WorkspaceSwitcher, type WorkspaceOption } from '@/blocks/workspace-switcher'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { NavGroup, NavHeading, NavItem } from '@/components/nav-item'
import { SearchTrigger } from '@/components/search-trigger'
import { Shortcut } from '@/components/shortcut'
import { NAV_GROUPS, TEMPLATES, byCategory, goTo } from './nav'

// Made-up workspaces: the switcher shows the pattern, only the first is real.
const WORKSPACES: WorkspaceOption[] = [
  { id: 'kitchen-sink', name: 'Kitchen Sink', short: 'KS', colour: 'var(--primary)' },
  { id: 'acme-studio', name: 'Acme Studio', short: 'AS', colour: 'oklch(0.62 0.15 150)' },
  { id: 'side-project', name: 'Side project', short: 'SP', colour: 'oklch(0.7 0.15 60)' },
]

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

  function switchWorkspace(id: string) {
    const name = WORKSPACES.find((w) => w.id === id)?.name
    toast(`Switched to ${name}`, { description: 'Demo only. The page stays the same.' })
  }

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r md:flex">
      <div className="flex h-11 items-center px-2">
        <WorkspaceSwitcher
          workspaces={WORKSPACES}
          currentId={WORKSPACES[0].id}
          onSelect={switchWorkspace}
          menuClassName="w-60"
        >
          <DropdownMenuItem onSelect={() => toast('Create workspace', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => goTo('settings')}>
            <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Workspace settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast('Logged out', { description: 'Demo only.' })}>
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Log out
          </DropdownMenuItem>
        </WorkspaceSwitcher>
      </div>

      <div className="px-2">
        <SearchTrigger onClick={onSearch} className="hover:bg-sidebar-accent hover:text-muted-foreground" />
      </div>

      <nav className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.title}
            title={group.title}
            count={group.items.length}
            open={!closed[group.title]}
            onOpenChange={(open) => setClosed((c) => ({ ...c, [group.title]: !open }))}
          >
            {byCategory(group.items).map((part) => (
              <div key={part.category ?? 'all'} role={part.category ? 'group' : undefined} aria-label={part.category}>
                {part.category && <NavHeading className="mt-2.5 text-[10px] tracking-wide uppercase opacity-80">{part.category}</NavHeading>}
                {part.items.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={active === item.id}
                    onClick={() => goTo(item.id)}
                  />
                ))}
              </div>
            ))}
          </NavGroup>
        ))}

        <NavGroup title="Templates" foldable={false}>
          {TEMPLATES.map((m) => (
            <NavItem
              key={m.path}
              href={`#${m.path}`}
              title={m.description}
              icon={m.icon}
              label={m.label}
              end={<HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />}
            />
          ))}
        </NavGroup>
      </nav>

      <div className="border-t p-2">
        <NavItem
          icon={KeyboardIcon}
          label="Keyboard shortcuts"
          onClick={onShortcuts}
          end={<Shortcut keys={['?']} />}
          className="text-muted-foreground hover:text-foreground"
        />
        <p className="text-muted-foreground px-2 pt-2 text-[11px] leading-4">shadcn/ui Mira · Hugeicons free · Inter</p>
      </div>
    </aside>
  )
}
