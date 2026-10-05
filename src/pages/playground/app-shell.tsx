import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ComputerIcon, InboxIcon, KeyboardIcon, Logout01Icon, Moon02Icon, PaintBoardIcon, Settings01Icon,
  Sun03Icon, Task01Icon, UserCircleIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { NavGroup, NavItem } from '@/components/nav-item'
import { UsageMeter } from '@/components/usage-meter'
import {
  DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountMenu } from '@/blocks/account-menu'
import { WorkspaceSwitcher, type WorkspaceOption } from '@/blocks/workspace-switcher'
import { Demos, Gallery, Playground, bool, component, element, imports, indent, lit, str, unless, type Values } from './Playground'

// The blocks at the top and the foot of an app's sidebar: the workspace
// switcher and the account menu. The workspaces and people are made up.

/* ---------- Shared ---------- */

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

// The sidebar's own background, where the hover colours are meant to be seen.
const SIDEBAR_BOX = 'bg-sidebar text-sidebar-foreground grid gap-px rounded-lg border p-2'

const WORKSPACES: WorkspaceOption[] = [
  { id: 'acme', name: 'Acme Labs', short: 'AL', colour: 'var(--primary)' },
  { id: 'northwind', name: 'Northwind', colour: 'oklch(0.64 0.15 155)' },
  { id: 'brightline', name: 'Brightline Studio', short: 'BS', colour: 'oklch(0.7 0.14 65)' },
]

const PERSON = { name: 'Maya Ross', email: 'maya@example.com', title: 'Product designer' }

/* ---------- Workspace switcher ---------- */

const SWITCHER_VARIANTS = ['default', 'compact', 'icon'] as const

type SwitcherVariant = (typeof SWITCHER_VARIANTS)[number]

// Where each variant is meant to sit: a sidebar, a top bar, a rail.
const SWITCHER_BOX: Record<SwitcherVariant, string> = {
  default: cn(SIDEBAR_BOX, 'w-60'),
  compact: 'bg-background @container flex h-11 w-80 max-w-full items-center gap-1 rounded-lg border px-2',
  icon: 'bg-sidebar flex w-12 flex-col items-center gap-1 rounded-lg border py-2',
}

function SwitcherPreview({ variant, detail, label, extras }: {
  variant: SwitcherVariant
  detail?: string
  label?: string
  extras: boolean
}) {
  const [current, setCurrent] = useState('acme')
  return (
    <div className={SWITCHER_BOX[variant]}>
      <WorkspaceSwitcher
        workspaces={WORKSPACES}
        currentId={current}
        onSelect={(id) => {
          setCurrent(id)
          toast(`Switched to ${WORKSPACES.find((w) => w.id === id)?.name}`, { description: 'Demo only.' })
        }}
        variant={variant}
        detail={detail}
        label={label}
        side={variant === 'icon' ? 'right' : undefined}
      >
        {extras && (
          <>
            <DropdownMenuItem onSelect={demo('Create workspace')}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={demo('Workspace settings')}>
              <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Workspace settings
            </DropdownMenuItem>
          </>
        )}
      </WorkspaceSwitcher>
      {variant === 'default' && (
        <div className="mt-1.5 grid gap-px">
          <NavItem icon={InboxIcon} label="Inbox" count={3} onClick={() => {}} />
          <NavItem icon={Task01Icon} label="My issues" active onClick={() => {}} />
        </div>
      )}
      {variant === 'compact' && (
        <>
          <span className="text-muted-foreground/60 text-xs">/</span>
          <span className="truncate text-xs">Website refresh</span>
        </>
      )}
      {variant === 'icon' && (
        <>
          <span className="bg-border my-1 h-px w-6" />
          <NavItem rail icon={InboxIcon} label="Inbox" onClick={() => {}} />
          <NavItem rail icon={Task01Icon} label="My issues" active onClick={() => {}} />
        </>
      )}
    </div>
  )
}

function switcherCode(v: Values) {
  const variant = str(v, 'variant') as SwitcherVariant
  const extras = bool(v, 'extras')
  const detail = str(v, 'detail')
  const head = imports({
    react: ['useState'],
    '@hugeicons/react': extras ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': extras ? ['Add01Icon'] : [],
    '@/components/ui/dropdown-menu': extras ? ['DropdownMenuItem'] : [],
    '@/blocks/workspace-switcher': ['WorkspaceSwitcher', 'type WorkspaceOption'],
  })
  const list = `const workspaces: WorkspaceOption[] = [\n${WORKSPACES.map((w) => indent(`${lit(w)},`)).join('\n')}\n]`
  const body = element('WorkspaceSwitcher', [
    'workspaces={workspaces}',
    'currentId={current}',
    'onSelect={setCurrent}',
    unless(variant, 'default') && `variant="${variant}"`,
    detail && `detail="${detail}"`,
    unless(str(v, 'label'), 'Workspaces') && `label="${str(v, 'label')}"`,
    variant === 'icon' && 'side="right"',
  ], extras
    ? [
      '<DropdownMenuItem onSelect={createWorkspace}>',
      '  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Create workspace',
      '</DropdownMenuItem>',
    ].join('\n')
    : undefined)
  return `${head}\n\n${list}\n\n${component('Switcher', ["const [current, setCurrent] = useState('acme')"], body)}`
}

/* ---------- Account menu ---------- */

const ACCOUNT_SIZES = ['sm', 'md'] as const
const ACCOUNT_HEADINGS = ['email', 'label', 'none'] as const
const ACCOUNT_SIDES = ['top', 'right', 'bottom'] as const

type AccountSize = (typeof ACCOUNT_SIZES)[number]
type AccountHeading = (typeof ACCOUNT_HEADINGS)[number]
type AccountSide = (typeof ACCOUNT_SIDES)[number]

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun03Icon },
  { value: 'dark', label: 'Dark', icon: Moon02Icon },
  { value: 'system', label: 'System', icon: ComputerIcon },
]

// The menu's items: the account, a theme sub-menu, sign out. The theme here
// is the demo's own; it does not change the kit's.
function AccountItems({ theme = true }: { theme?: boolean }) {
  const [mode, setMode] = useState('system')
  return (
    <>
      <DropdownMenuItem onSelect={demo('Profile')}>
        <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Profile
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={demo('Settings')}>
        <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
        <DropdownMenuShortcut>G S</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={demo('Keyboard shortcuts')}>
        <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} /> Keyboard shortcuts
      </DropdownMenuItem>
      {theme && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} /> Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-36">
            <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
              {THEMES.map((t) => (
                <DropdownMenuRadioItem key={t.value} value={t.value}>
                  <HugeiconsIcon icon={t.icon} strokeWidth={2} /> {t.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={demo('Signed out')}>
        <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out
      </DropdownMenuItem>
    </>
  )
}

function accountCode(v: Values) {
  const heading = str(v, 'heading') as AccountHeading
  const detail = str(v, 'detail')
  const head = imports({
    '@hugeicons/react': ['HugeiconsIcon'],
    '@hugeicons/core-free-icons': ['Logout01Icon', 'Settings01Icon', 'UserIcon'],
    '@/components/ui/dropdown-menu': ['DropdownMenuItem', 'DropdownMenuSeparator'],
    '@/blocks/account-menu': ['AccountMenu'],
  })
  const body = element('AccountMenu', [
    `name="${PERSON.name}"`,
    detail && `detail="${detail}"`,
    heading === 'email' && `email="${PERSON.email}"`,
    heading === 'label' && `label="${PERSON.email}"`,
    unless(str(v, 'size'), 'sm') && `size="${str(v, 'size')}"`,
    unless(str(v, 'side'), 'top') && `side="${str(v, 'side')}"`,
    'className="hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent"',
  ], [
    '<DropdownMenuItem onSelect={openProfile}>',
    '  <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Profile',
    '</DropdownMenuItem>',
    '<DropdownMenuItem onSelect={openSettings}>',
    '  <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings',
    '</DropdownMenuItem>',
    '<DropdownMenuSeparator />',
    '<DropdownMenuItem onSelect={signOut}>',
    '  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out',
    '</DropdownMenuItem>',
  ].join('\n'))
  return `${head}\n\n${body}`
}

/* ---------- Together ---------- */

// A whole sidebar: the switcher at the top, the pages, and at the foot a
// usage meter over the account menu.
function MiniSidebar() {
  const [current, setCurrent] = useState('acme')
  const [page, setPage] = useState('issues')
  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-96 w-60 flex-col rounded-lg border p-2">
      <WorkspaceSwitcher workspaces={WORKSPACES} currentId={current} onSelect={setCurrent} detail="Pro plan" />
      <div className="mt-2 grid gap-px">
        <NavItem icon={InboxIcon} label="Inbox" count={3} active={page === 'inbox'} onClick={() => setPage('inbox')} />
        <NavItem icon={Task01Icon} label="My issues" active={page === 'issues'} onClick={() => setPage('issues')} />
        <NavItem icon={UserCircleIcon} label="Members" active={page === 'members'} onClick={() => setPage('members')} />
      </div>
      <NavGroup title="Favourites">
        <NavItem icon={Task01Icon} label="Website refresh" active={page === 'refresh'} onClick={() => setPage('refresh')} />
      </NavGroup>
      <div className="mt-auto grid gap-2">
        <UsageMeter
          value={72}
          label="Issues used"
          count="180 / 250"
          className="bg-background/60 rounded-lg border p-2.5"
        />
        <AccountMenu
          name={PERSON.name}
          detail={PERSON.email}
          size="md"
          menuClassName="w-52"
          className="hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent"
        >
          <AccountItems theme={false} />
        </AccountMenu>
      </div>
    </div>
  )
}

export default function AppShellDemos() {
  return (
    <Demos>
      <Playground
        title="WorkspaceSwitcher"
        description="The top of a sidebar: the current workspace, opening a menu of them all"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: SWITCHER_VARIANTS, initial: 'default' },
          { kind: 'text', name: 'detail', label: 'Detail (blank: none)', initial: 'Pro plan' },
          { kind: 'text', name: 'label', label: 'Menu heading (label)', initial: 'Workspaces' },
          { kind: 'switch', name: 'extras', label: 'Extra items (children)', initial: true },
        ]}
        render={(v) => (
          <SwitcherPreview
            // A fresh preview per variant, so each starts on the first workspace.
            key={str(v, 'variant')}
            variant={str(v, 'variant') as SwitcherVariant}
            detail={str(v, 'detail') || undefined}
            label={str(v, 'label') || undefined}
            extras={bool(v, 'extras')}
          />
        )}
        code={switcherCode}
      />

      <Playground
        title="AccountMenu"
        description="The foot of a sidebar: who is signed in, opening their menu"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: ACCOUNT_SIZES, initial: 'md' },
          { kind: 'text', name: 'detail', label: 'Detail (blank: none)', initial: PERSON.title },
          { kind: 'select', name: 'heading', label: 'Menu heading', options: ACCOUNT_HEADINGS, initial: 'email' },
          { kind: 'select', name: 'side', label: 'Opens to (side)', options: ACCOUNT_SIDES, initial: 'top' },
        ]}
        render={(v) => {
          const heading = str(v, 'heading') as AccountHeading
          return (
            <div className="bg-sidebar text-sidebar-foreground w-60 rounded-lg border p-2">
              <AccountMenu
                name={PERSON.name}
                detail={str(v, 'detail') || undefined}
                email={heading === 'email' ? PERSON.email : undefined}
                label={heading === 'label' ? PERSON.email : undefined}
                size={str(v, 'size') as AccountSize}
                side={str(v, 'side') as AccountSide}
                className="hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent"
              >
                <AccountItems />
              </AccountMenu>
            </div>
          )
        }}
        code={accountCode}
      />

      <Gallery
        title="A sidebar's top and foot"
        note="WorkspaceSwitcher, NavItem, NavGroup, UsageMeter and AccountMenu together"
        items={[{ label: 'sidebar', node: <MiniSidebar /> }]}
      />
    </Demos>
  )
}
