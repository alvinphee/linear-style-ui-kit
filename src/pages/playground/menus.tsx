import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Copy01Icon, CursorPointer02Icon, Delete02Icon, Link01Icon, Logout01Icon, MoreHorizontalIcon, PencilEdit02Icon,
  Settings01Icon, UserIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { IconAction } from '@/components/icon-action'
import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'
import { MOD } from '@/components/shortcut'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuCheckboxItem, ContextMenuGroup, ContextMenuItem,
  ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CodeBlock, Demos, Gallery, Playground, bool, imports, jsx, str } from './Playground'

/* Dropdown menu */

const ACTIONS: { label: string; icon: IconSvgElement; iconName: string; keys: string }[] = [
  { label: 'Edit', icon: PencilEdit02Icon, iconName: 'PencilEdit02Icon', keys: 'E' },
  { label: 'Duplicate', icon: Copy01Icon, iconName: 'Copy01Icon', keys: 'Ctrl D' },
  { label: 'Copy link', icon: Link01Icon, iconName: 'Link01Icon', keys: 'Ctrl L' },
]

function DropdownPreview({ side, align, label, shortcuts, checkboxes, destructive }: {
  side: Side
  align: Align
  label: boolean
  shortcuts: boolean
  checkboxes: boolean
  destructive: boolean
}) {
  const [subscribed, setSubscribed] = useState(true)
  const [subIssues, setSubIssues] = useState(false)
  const keys = (k: string) => shortcuts && <DropdownMenuShortcut>{k}</DropdownMenuShortcut>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-48">
        {label && <DropdownMenuLabel>Issue actions</DropdownMenuLabel>}
        <DropdownMenuGroup>
          {ACTIONS.map((a) => (
            <DropdownMenuItem key={a.label} onSelect={() => toast(a.label, { description: 'Demo only.' })}>
              <HugeiconsIcon icon={a.icon} strokeWidth={2} />
              {a.label}
              {keys(a.keys)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {checkboxes && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={subscribed} onCheckedChange={setSubscribed}>Subscribed</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={subIssues} onCheckedChange={setSubIssues}>Show sub-issues</DropdownMenuCheckboxItem>
          </>
        )}
        {destructive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => toast('Issue deleted', { description: 'Demo only. Nothing was removed.' })}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Delete
              {keys('Del')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SortMenu() {
  const [sort, setSort] = useState('priority')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">Sort</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created">Created</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DropdownDemos() {
  return (
    <>
      <Playground
        title="Dropdown menu"
        description="Label, separators, shortcuts and checkbox items"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'bottom' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'start' },
          { kind: 'switch', name: 'label', label: 'Label', initial: true },
          { kind: 'switch', name: 'shortcuts', label: 'Shortcuts', initial: true },
          { kind: 'switch', name: 'checkboxes', label: 'Checkbox items', initial: true },
          { kind: 'switch', name: 'destructive', label: 'Destructive item', initial: true },
        ]}
        render={(v) => (
          <DropdownPreview
            side={str(v, 'side') as Side}
            align={str(v, 'align') as Align}
            label={bool(v, 'label')}
            shortcuts={bool(v, 'shortcuts')}
            checkboxes={bool(v, 'checkboxes')}
            destructive={bool(v, 'destructive')}
          />
        )}
        code={(v) => {
          const label = bool(v, 'label')
          const shortcuts = bool(v, 'shortcuts')
          const checkboxes = bool(v, 'checkboxes')
          const destructive = bool(v, 'destructive')
          const item = (icon: string, text: string, keys: string, variant?: string) =>
            jsx('DropdownMenuItem', { variant }, [ICON(icon), text, shortcuts ? `<DropdownMenuShortcut>${keys}</DropdownMenuShortcut>` : ''])

          const head = imports({
            react: checkboxes ? ['useState'] : [],
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': pick(...ACTIONS.map((a) => a.iconName), destructive && 'Delete02Icon', 'MoreHorizontalIcon'),
            '@/components/ui/button': ['Button'],
            '@/components/ui/dropdown-menu': pick(
              'DropdownMenu', checkboxes && 'DropdownMenuCheckboxItem', 'DropdownMenuContent', 'DropdownMenuGroup',
              'DropdownMenuItem', label && 'DropdownMenuLabel', (checkboxes || destructive) && 'DropdownMenuSeparator',
              shortcuts && 'DropdownMenuShortcut', 'DropdownMenuTrigger',
            ),
          })
          const body = jsx('DropdownMenu', {}, [
            jsx('DropdownMenuTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('MoreHorizontalIcon', 'inline-start'), 'Actions'])),
            jsx('DropdownMenuContent', {
              side: unless(str(v, 'side'), 'bottom'),
              align: unless(str(v, 'align'), 'start'),
              className: 'w-48',
            }, [
              label ? '<DropdownMenuLabel>Issue actions</DropdownMenuLabel>' : '',
              jsx('DropdownMenuGroup', {}, ACTIONS.map((a) => item(a.iconName, a.label, a.keys))),
              checkboxes ? '<DropdownMenuSeparator />' : '',
              checkboxes ? jsx('DropdownMenuCheckboxItem', { checked: '{subscribed}', onCheckedChange: '{setSubscribed}' }, 'Subscribed') : '',
              checkboxes ? jsx('DropdownMenuCheckboxItem', { checked: '{subIssues}', onCheckedChange: '{setSubIssues}' }, 'Show sub-issues') : '',
              destructive ? '<DropdownMenuSeparator />' : '',
              destructive ? item('Delete02Icon', 'Delete', 'Del', 'destructive') : '',
            ]),
          ])
          const state = checkboxes
            ? ['const [subscribed, setSubscribed] = useState(true)', 'const [subIssues, setSubIssues] = useState(false)']
            : []
          return `${head}\n\n${expr(withState('IssueActions', state, body))}`
        }}
      />

      <Gallery
        title="More menu items"
        note="Radio group, submenu, disabled item and an account menu"
        items={[
          { label: 'RadioGroup', node: <SortMenu /> },
          {
            label: 'Sub',
            node: (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Move</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Move to project</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-40">
                      {['Website', 'Mobile app', 'Billing'].map((p) => (
                        <DropdownMenuItem key={p} onSelect={() => toast(`Moved to ${p}`, { description: 'Demo only.' })}>{p}</DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>Move to backlog</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
          {
            label: 'disabled item',
            node: (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <DropdownMenuItem>CSV</DropdownMenuItem>
                  <DropdownMenuItem>JSON</DropdownMenuItem>
                  <DropdownMenuItem disabled>PDF (Pro plan)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
          {
            label: 'account menu',
            node: (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account" className="rounded-full">
                    <Avatar size="sm">
                      <AvatarFallback className="text-[10px] font-medium">AM</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="grid gap-0.5">
                    <span className="text-foreground font-medium">Alex Morgan</span>
                    <span>alex@example.com</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
                    <DropdownMenuShortcut>G S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />
    </>
  )
}

/* ---------- Menu kit ---------- */

// One list of items, written once against a kit, shown as a dropdown (the …
// button) and as a right-click menu, as rows in a list usually offer both.
function RecordMenuItems({ kit }: { kit: MenuKit }) {
  const say = (what: string) => () => toast(what, { description: 'Demo only.' })
  return (
    <>
      <kit.Item onSelect={say('Opened')}>Open</kit.Item>
      <kit.Item onSelect={say('Link copied')}>Copy link<kit.Shortcut>{MOD} L</kit.Shortcut></kit.Item>
      <kit.Sub>
        <kit.SubTrigger>Set status</kit.SubTrigger>
        <kit.SubContent>
          {['Todo', 'In progress', 'Done'].map((s) => <kit.Item key={s} onSelect={say(`Status: ${s}`)}>{s}</kit.Item>)}
        </kit.SubContent>
      </kit.Sub>
      <kit.Separator />
      <kit.Item variant="destructive" onSelect={say('Deleted')}>Delete</kit.Item>
    </>
  )
}

const MENU_KIT_CODE = [
  "import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'",
  '',
  'function RecordMenuItems({ kit }: { kit: MenuKit }) {',
  '  return (',
  '    <>',
  '      <kit.Item onSelect={open}>Open</kit.Item>',
  '      <kit.Separator />',
  '      <kit.Item variant="destructive" onSelect={remove}>Delete</kit.Item>',
  '    </>',
  '  )',
  '}',
  '',
  '<DropdownMenuContent><RecordMenuItems kit={DROPDOWN_MENU_KIT} /></DropdownMenuContent>',
  '<ContextMenuContent><RecordMenuItems kit={CONTEXT_MENU_KIT} /></ContextMenuContent>',
].join('\n')

function MenuKitDemos() {
  return (
    <Gallery
      title="Menu kit"
      note="one list of items as a dropdown and as a right-click menu"
      items={[
        {
          label: 'DROPDOWN_MENU_KIT',
          node: (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconAction label="Record actions" icon={MoreHorizontalIcon} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <RecordMenuItems kit={DROPDOWN_MENU_KIT} />
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
        {
          label: 'CONTEXT_MENU_KIT',
          node: (
            <ContextMenu>
              <ContextMenuTrigger className="text-muted-foreground grid h-16 w-56 place-items-center rounded-md border border-dashed text-xs">
                Right-click here
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <RecordMenuItems kit={CONTEXT_MENU_KIT} />
              </ContextMenuContent>
            </ContextMenu>
          ),
        },
        { label: 'code', node: <CodeBlock code={MENU_KIT_CODE} className="w-[min(34rem,80vw)]" /> },
      ]}
    />
  )
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const

const ALIGNS = ['start', 'center', 'end'] as const

type Side = (typeof SIDES)[number]

type Align = (typeof ALIGNS)[number]

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

// jsx() quotes every string, so a value written as '{…}' is turned back into an expression.
const expr = (snippet: string) => snippet.replace(/="\{([^"]*)\}"/g, '={$1}')

const pick = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

// A snippet that needs state is wrapped in a small component.
function withState(name: string, state: string[], body: string) {
  if (!state.length) return body
  return `function ${name}() {\n${state.map((s) => `  ${s}`).join('\n')}\n  return (\n${body.replace(/^/gm, '    ')}\n  )\n}`
}

const ICON = (name: string, inline?: 'inline-start' | 'inline-end') =>
  `<HugeiconsIcon icon={${name}} strokeWidth={2}${inline ? ` data-icon="${inline}"` : ''} />`

/* Context menu */

const AREA = cn(
  'text-muted-foreground flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/15 text-center outline-none',
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 data-[state=open]:bg-accent/60',
)

const MENU_ACTIONS: { label: string; icon: IconSvgElement; iconName: string; keys: string }[] = [
  { label: 'Edit', icon: PencilEdit02Icon, iconName: 'PencilEdit02Icon', keys: 'E' },
  { label: 'Copy link', icon: Link01Icon, iconName: 'Link01Icon', keys: 'Ctrl L' },
  { label: 'Duplicate', icon: Copy01Icon, iconName: 'Copy01Icon', keys: 'Ctrl D' },
]

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']

function ContextMenuPreview({ label, shortcuts, checkboxes, submenu, destructive }: {
  label: boolean
  shortcuts: boolean
  checkboxes: boolean
  submenu: boolean
  destructive: boolean
}) {
  const [subscribed, setSubscribed] = useState(true)
  const [pinned, setPinned] = useState(false)
  const keys = (k: string) => shortcuts && <ContextMenuShortcut>{k}</ContextMenuShortcut>

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0} role="group" aria-label="Issue card" className={cn(AREA, 'h-28 w-full max-w-xs px-4')}>
          <HugeiconsIcon icon={CursorPointer02Icon} strokeWidth={2} className="size-4" />
          <span className="text-xs">Right-click or long-press here</span>
          <span className="text-[11px]">With the keyboard: focus it, then Shift+F10</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {label && <ContextMenuLabel>Issue actions</ContextMenuLabel>}
        <ContextMenuGroup>
          {MENU_ACTIONS.map((a) => (
            <ContextMenuItem key={a.label} onSelect={() => toast(a.label, { description: 'Demo only.' })}>
              <HugeiconsIcon icon={a.icon} strokeWidth={2} />
              {a.label}
              {keys(a.keys)}
            </ContextMenuItem>
          ))}
          {submenu && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Set priority</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-36">
                {PRIORITIES.map((p) => (
                  <ContextMenuItem key={p} onSelect={() => toast(`Priority set to ${p}`, { description: 'Demo only.' })}>{p}</ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
        </ContextMenuGroup>
        {checkboxes && (
          <>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked={subscribed} onCheckedChange={setSubscribed}>Subscribed</ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>Pinned</ContextMenuCheckboxItem>
          </>
        )}
        {destructive && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onSelect={() => toast('Issue deleted', { description: 'Demo only. Nothing was removed.' })}>
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Delete
              {keys('Del')}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ViewAsMenu() {
  const [view, setView] = useState('list')
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div tabIndex={0} role="group" aria-label="Project view" className={cn(AREA, 'h-20 w-44 px-3 text-[11px]')}>
          Right-click: view as
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuLabel>View as</ContextMenuLabel>
        <ContextMenuRadioGroup value={view} onValueChange={setView}>
          <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
          <ContextMenuRadioItem value="board">Board</ContextMenuRadioItem>
          <ContextMenuRadioItem value="timeline">Timeline</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ContextMenuDemos() {
  return (
    <>
      <Playground
        title="Context menu"
        description="Opens where you right-click"
        controls={[
          { kind: 'switch', name: 'label', label: 'Label', initial: true },
          { kind: 'switch', name: 'shortcuts', label: 'Shortcuts', initial: true },
          { kind: 'switch', name: 'submenu', label: 'Submenu', initial: true },
          { kind: 'switch', name: 'checkboxes', label: 'Checkbox items', initial: true },
          { kind: 'switch', name: 'destructive', label: 'Destructive item', initial: true },
        ]}
        render={(v) => (
          <ContextMenuPreview
            label={bool(v, 'label')}
            shortcuts={bool(v, 'shortcuts')}
            submenu={bool(v, 'submenu')}
            checkboxes={bool(v, 'checkboxes')}
            destructive={bool(v, 'destructive')}
          />
        )}
        code={(v) => {
          const label = bool(v, 'label')
          const shortcuts = bool(v, 'shortcuts')
          const submenu = bool(v, 'submenu')
          const checkboxes = bool(v, 'checkboxes')
          const destructive = bool(v, 'destructive')
          const item = (icon: string, text: string, keys: string, variant?: string) =>
            jsx('ContextMenuItem', { variant }, [ICON(icon), text, shortcuts ? `<ContextMenuShortcut>${keys}</ContextMenuShortcut>` : ''])

          const head = imports({
            react: checkboxes ? ['useState'] : [],
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': pick(...MENU_ACTIONS.map((a) => a.iconName), destructive && 'Delete02Icon'),
            '@/components/ui/context-menu': pick(
              'ContextMenu', checkboxes && 'ContextMenuCheckboxItem', 'ContextMenuContent', 'ContextMenuGroup', 'ContextMenuItem',
              label && 'ContextMenuLabel', (checkboxes || destructive) && 'ContextMenuSeparator', shortcuts && 'ContextMenuShortcut',
              submenu && 'ContextMenuSub', submenu && 'ContextMenuSubContent', submenu && 'ContextMenuSubTrigger', 'ContextMenuTrigger',
            ),
          })
          const body = jsx('ContextMenu', {}, [
            jsx('ContextMenuTrigger', { className: 'flex h-28 items-center justify-center rounded-lg border border-dashed' }, 'Right-click here'),
            jsx('ContextMenuContent', { className: 'w-52' }, [
              label ? '<ContextMenuLabel>Issue actions</ContextMenuLabel>' : '',
              jsx('ContextMenuGroup', {}, [
                ...MENU_ACTIONS.map((a) => item(a.iconName, a.label, a.keys)),
                submenu ? jsx('ContextMenuSub', {}, [
                  '<ContextMenuSubTrigger>Set priority</ContextMenuSubTrigger>',
                  jsx('ContextMenuSubContent', { className: 'w-36' }, PRIORITIES.map((p) => `<ContextMenuItem>${p}</ContextMenuItem>`)),
                ]) : '',
              ]),
              checkboxes ? '<ContextMenuSeparator />' : '',
              checkboxes ? jsx('ContextMenuCheckboxItem', { checked: '{subscribed}', onCheckedChange: '{setSubscribed}' }, 'Subscribed') : '',
              checkboxes ? jsx('ContextMenuCheckboxItem', { checked: '{pinned}', onCheckedChange: '{setPinned}' }, 'Pinned') : '',
              destructive ? '<ContextMenuSeparator />' : '',
              destructive ? item('Delete02Icon', 'Delete', 'Del', 'destructive') : '',
            ]),
          ])
          const state = checkboxes
            ? ['const [subscribed, setSubscribed] = useState(true)', 'const [pinned, setPinned] = useState(false)']
            : []
          return `${head}\n\n${expr(withState('IssueCardMenu', state, body))}`
        }}
      />

      <Gallery
        title="Context menu items"
        note="Right-click each area"
        items={[
          { label: 'RadioGroup', node: <ViewAsMenu /> },
          {
            label: 'disabled and inset',
            node: (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div tabIndex={0} role="group" aria-label="File" className={cn(AREA, 'h-20 w-44 px-3 text-[11px]')}>
                    Right-click: file actions
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-44">
                  <ContextMenuItem>
                    <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                    Copy link
                  </ContextMenuItem>
                  <ContextMenuItem inset>Rename</ContextMenuItem>
                  <ContextMenuItem inset disabled>Move (read only)</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ),
          },
        ]}
      />
    </>
  )
}

export default function MenusDemos() {
  return (
    <Demos>
      <DropdownDemos />

      <ContextMenuDemos />

      <MenuKitDemos />
    </Demos>
  )
}
