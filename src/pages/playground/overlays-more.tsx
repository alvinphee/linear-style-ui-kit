import { useState, type MouseEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Calendar03Icon, Copy01Icon, CursorPointer02Icon, Delete02Icon, FilterHorizontalIcon, LayoutBottomIcon,
  LayoutLeftIcon, LayoutRightIcon, LayoutTopIcon, Link01Icon, PencilEdit02Icon, SparklesIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { DockedPanel } from '@/blocks/docked-panel'
import { RecordSheet, RecordSheetContent, type PeekMode } from '@/blocks/record-sheet'
import { Mention } from '@/components/mention'
import { StatusBadge } from '@/components/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel,
  ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub,
  ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str } from './Playground'

const SIDES = ['top', 'right', 'bottom', 'left'] as const
const ALIGNS = ['start', 'center', 'end'] as const
const DIRECTIONS = ['bottom', 'top', 'left', 'right'] as const
const OPEN_DELAYS = ['0', '150', '300', '700'] as const

type Side = (typeof SIDES)[number]
type Align = (typeof ALIGNS)[number]
type Direction = (typeof DIRECTIONS)[number]

const SIDE_ICONS: Record<Side, { icon: IconSvgElement; name: string }> = {
  top: { icon: LayoutTopIcon, name: 'LayoutTopIcon' },
  right: { icon: LayoutRightIcon, name: 'LayoutRightIcon' },
  bottom: { icon: LayoutBottomIcon, name: 'LayoutBottomIcon' },
  left: { icon: LayoutLeftIcon, name: 'LayoutLeftIcon' },
}

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

const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1)

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

/* Sheet */

const ACTIVITY = Array.from({ length: 16 }, (_, i) => ({
  who: ['Alex', 'Sam', 'Kim', 'Jordan'][i % 4],
  what: [
    'moved the issue to In progress', 'added the label Bug', 'changed priority to High', 'left a comment',
    'linked a pull request', 'set the due date to Friday', 'assigned it to Sam', 'moved the issue to In review',
  ][i % 8],
  when: `${i + 1}h ago`,
}))

function SheetDemos() {
  return (
    <>
      <Playground
        title="Sheet"
        description="A dialog that slides in from an edge"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'right' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'Edit profile' },
          { kind: 'switch', name: 'footer', label: 'Footer', initial: true },
          { kind: 'switch', name: 'close', label: 'Close button', initial: true },
        ]}
        render={(v) => {
          const side = str(v, 'side') as Side
          const footer = bool(v, 'footer')
          return (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <HugeiconsIcon icon={SIDE_ICONS[side].icon} strokeWidth={2} data-icon="inline-start" />
                  Open sheet
                </Button>
              </SheetTrigger>
              <SheetContent side={side} showCloseButton={bool(v, 'close')}>
                <SheetHeader>
                  <SheetTitle>{str(v, 'title') || 'Edit profile'}</SheetTitle>
                  <SheetDescription>Your name and email show on issues and comments.</SheetDescription>
                </SheetHeader>
                <div className={cn('grid gap-3 px-6', !footer && 'pb-6')}>
                  <div className="grid gap-1.5">
                    <Label htmlFor="playground-sheet-name">Name</Label>
                    <Input id="playground-sheet-name" defaultValue="Alex Morgan" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="playground-sheet-email">Email</Label>
                    <Input id="playground-sheet-email" type="email" defaultValue="alex@example.com" />
                  </div>
                </div>
                {footer && (
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button onClick={() => toast.success('Profile saved', { description: 'Demo only.' })}>Save changes</Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          )
        }}
        code={(v) => {
          const side = str(v, 'side') as Side
          const footer = bool(v, 'footer')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': [SIDE_ICONS[side].name],
            '@/components/ui/button': ['Button'],
            '@/components/ui/input': ['Input'],
            '@/components/ui/label': ['Label'],
            '@/components/ui/sheet': pick(
              'Sheet', footer && 'SheetClose', 'SheetContent', 'SheetDescription', footer && 'SheetFooter', 'SheetHeader',
              'SheetTitle', 'SheetTrigger',
            ),
          })
          const body = jsx('Sheet', {}, [
            jsx('SheetTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON(SIDE_ICONS[side].name, 'inline-start'), 'Open sheet'])),
            jsx('SheetContent', {
              side: unless(side, 'right'),
              showCloseButton: bool(v, 'close') ? undefined : '{false}',
            }, [
              jsx('SheetHeader', {}, [
                `<SheetTitle>${str(v, 'title') || 'Edit profile'}</SheetTitle>`,
                '<SheetDescription>Your name and email show on issues and comments.</SheetDescription>',
              ]),
              jsx('div', { className: footer ? 'grid gap-3 px-6' : 'grid gap-3 px-6 pb-6' }, [
                jsx('div', { className: 'grid gap-1.5' }, [
                  '<Label htmlFor="name">Name</Label>',
                  '<Input id="name" defaultValue="Alex Morgan" />',
                ]),
                jsx('div', { className: 'grid gap-1.5' }, [
                  '<Label htmlFor="email">Email</Label>',
                  '<Input id="email" type="email" defaultValue="alex@example.com" />',
                ]),
              ]),
              footer ? jsx('SheetFooter', {}, [
                jsx('SheetClose', { asChild: true }, '<Button>Save changes</Button>'),
                jsx('SheetClose', { asChild: true }, '<Button variant="outline">Cancel</Button>'),
              ]) : '',
            ]),
          ])
          return `${head}\n\n${expr(body)}`
        }}
      />

      <Variants
        title="Sheet sides"
        note="side · click to open"
        rows={{ name: 'side', values: SIDES }}
        render={(side) => (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={SIDE_ICONS[side].icon} strokeWidth={2} data-icon="inline-start" />
                Open
              </Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>{capitalise(side)} sheet</SheetTitle>
                <SheetDescription>Slides in from the {side} edge. Press Esc or click outside to close it.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        )}
      />

      <Gallery
        title="Sheet behaviour"
        note="Non-modal and a long scrolling body"
        items={[
          {
            label: 'modal={false}',
            node: (
              <Sheet modal={false}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">Non-modal</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Quick look</SheetTitle>
                    <SheetDescription>No overlay and no focus trap: the page behind stays usable.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            ),
          },
          {
            label: 'scrolling body',
            node: (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">Activity</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader className="border-b">
                    <SheetTitle>Activity</SheetTitle>
                    <SheetDescription>Everything that happened on this issue.</SheetDescription>
                  </SheetHeader>
                  <ol className="min-h-0 flex-1 overflow-y-auto px-6 py-3">
                    {ACTIVITY.map((a, i) => (
                      <li key={i} className="flex gap-2 border-b py-2 last:border-b-0">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[10px] font-medium">{a.who[0]}</AvatarFallback>
                        </Avatar>
                        <p className="min-w-0 flex-1">
                          <span className="font-medium">{a.who}</span>{' '}
                          <span className="text-muted-foreground">{a.what}</span>
                          <span className="text-muted-foreground block text-[11px]">{a.when}</span>
                        </p>
                      </li>
                    ))}
                  </ol>
                </SheetContent>
              </Sheet>
            ),
          },
        ]}
      />
    </>
  )
}

/* Drawer */

const DISPLAY_OPTIONS = [
  { id: 'sub-issues', label: 'Show sub-issues', on: true },
  { id: 'empty-groups', label: 'Show empty groups', on: false },
  { id: 'closed', label: 'Show closed issues', on: false },
]

function DrawerDemos() {
  return (
    <>
      <Playground
        title="Drawer"
        description="Drag the handle or swipe to close (vaul)"
        controls={[
          { kind: 'select', name: 'direction', label: 'Direction', options: DIRECTIONS, initial: 'bottom' },
          { kind: 'switch', name: 'dismissible', label: 'Dismissible', initial: true },
        ]}
        render={(v) => {
          const dismissible = bool(v, 'dismissible')
          return (
            <Drawer direction={str(v, 'direction') as Direction} dismissible={dismissible}>
              <DrawerTrigger asChild>
                <Button variant="outline">
                  <HugeiconsIcon icon={FilterHorizontalIcon} strokeWidth={2} data-icon="inline-start" />
                  Display options
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
                  <DrawerHeader>
                    <DrawerTitle>Display options</DrawerTitle>
                    <DrawerDescription>
                      {dismissible ? 'Drag, press Esc or click outside to close.' : 'Only the buttons below close it.'}
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="grid gap-3 px-4">
                    {DISPLAY_OPTIONS.map((o) => (
                      <div key={o.id} className="flex items-center justify-between gap-3">
                        <Label htmlFor={`playground-drawer-${o.id}`} className="font-normal">{o.label}</Label>
                        <Switch id={`playground-drawer-${o.id}`} defaultChecked={o.on} />
                      </div>
                    ))}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button onClick={() => toast('Display options saved', { description: 'Demo only.' })}>Apply</Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          )
        }}
        code={(v) => {
          const dismissible = bool(v, 'dismissible')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['FilterHorizontalIcon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/drawer': [
              'Drawer', 'DrawerClose', 'DrawerContent', 'DrawerDescription', 'DrawerFooter', 'DrawerHeader', 'DrawerTitle',
              'DrawerTrigger',
            ],
            '@/components/ui/label': ['Label'],
            '@/components/ui/switch': ['Switch'],
          })
          const body = jsx('Drawer', {
            direction: unless(str(v, 'direction'), 'bottom'),
            dismissible: dismissible ? undefined : '{false}',
          }, [
            jsx('DrawerTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('FilterHorizontalIcon', 'inline-start'), 'Display options'])),
            jsx('DrawerContent', {}, jsx('div', { className: 'mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col' }, [
              jsx('DrawerHeader', {}, [
                '<DrawerTitle>Display options</DrawerTitle>',
                `<DrawerDescription>${dismissible ? 'Drag, press Esc or click outside to close.' : 'Only the buttons below close it.'}</DrawerDescription>`,
              ]),
              jsx('div', { className: 'grid gap-3 px-4' }, DISPLAY_OPTIONS.map((o) => jsx('div', { className: 'flex items-center justify-between gap-3' }, [
                `<Label htmlFor="${o.id}" className="font-normal">${o.label}</Label>`,
                jsx('Switch', { id: o.id, defaultChecked: o.on }),
              ]))),
              jsx('DrawerFooter', {}, [
                jsx('DrawerClose', { asChild: true }, '<Button>Apply</Button>'),
                jsx('DrawerClose', { asChild: true }, '<Button variant="outline">Cancel</Button>'),
              ]),
            ])),
          ])
          return `${head}\n\n${expr(body)}`
        }}
      />

      <Variants
        title="Drawer directions"
        note="direction · click to open"
        rows={{ name: 'direction', values: DIRECTIONS }}
        render={(direction) => (
          <Drawer direction={direction}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">Open</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>From the {direction}</DrawerTitle>
                <DrawerDescription>Swipe towards the {direction} edge to close it.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      />
    </>
  )
}

/* Hover card */

function Profile() {
  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback className="text-xs font-medium">AM</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 gap-0.5">
        <p className="text-[13px] font-medium">Alex Morgan</p>
        <p className="text-muted-foreground">Product designer · Design team</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
          Joined March 2024
        </p>
      </div>
    </div>
  )
}

function HoverCardDemos() {
  return (
    <>
      <Playground
        title="Hover card"
        description="Hover or tab to the mention"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'bottom' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'select', name: 'openDelay', label: 'Open delay (ms)', options: OPEN_DELAYS, initial: '700' },
        ]}
        render={(v) => (
          <p className="text-xs/relaxed">
            Assigned to{' '}
            <HoverCard openDelay={Number(str(v, 'openDelay'))}>
              <HoverCardTrigger asChild>
                <Mention href="#" onClick={stay}>@alex</Mention>
              </HoverCardTrigger>
              <HoverCardContent side={str(v, 'side') as Side} align={str(v, 'align') as Align}>
                <Profile />
              </HoverCardContent>
            </HoverCard>{' '}
            two days ago
          </p>
        )}
        code={(v) => {
          const delay = unless(str(v, 'openDelay'), '700')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Calendar03Icon'],
            '@/components/mention': ['Mention'],
            '@/components/ui/avatar': ['Avatar', 'AvatarFallback'],
            '@/components/ui/hover-card': ['HoverCard', 'HoverCardContent', 'HoverCardTrigger'],
          })
          const body = jsx('HoverCard', { openDelay: delay === undefined ? undefined : Number(delay) }, [
            jsx('HoverCardTrigger', { asChild: true }, '<Mention href="/people/alex">@alex</Mention>'),
            jsx('HoverCardContent', {
              side: unless(str(v, 'side'), 'bottom'),
              align: unless(str(v, 'align'), 'center'),
            }, jsx('div', { className: 'flex gap-3' }, [
              jsx('Avatar', {}, '<AvatarFallback>AM</AvatarFallback>'),
              jsx('div', { className: 'grid min-w-0 gap-0.5' }, [
                '<p className="text-[13px] font-medium">Alex Morgan</p>',
                '<p className="text-muted-foreground">Product designer · Design team</p>',
                jsx('p', { className: 'text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]' }, [
                  '<HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />',
                  'Joined March 2024',
                ]),
              ]),
            ])),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Hover card sides"
        note="side · hover a mention"
        rows={{ name: 'side', values: SIDES }}
        render={(side) => (
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <Mention href="#" onClick={stay}>@alex</Mention>
            </HoverCardTrigger>
            <HoverCardContent side={side} className="w-64">
              <Profile />
            </HoverCardContent>
          </HoverCard>
        )}
      />
    </>
  )
}

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

/* Docked panel */

const PANEL_WIDTHS = ['320', '400', '480'] as const

// A small app: a page, and the docked panel beside it, which narrows the page.
function DockedPanelPreview({ side, defaultWidth, closeButton }: { side: 'left' | 'right'; defaultWidth: number; closeButton: boolean }) {
  const [open, setOpen] = useState(true)
  const panel = (
    <DockedPanel
      open={open}
      onOpenChange={setOpen}
      title="Ask AI"
      side={side}
      defaultWidth={defaultWidth}
      minWidth={240}
      showCloseButton={closeButton}
      className="bg-subtle"
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3 pr-10">
        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand size-3.5" />
        <h4 className="text-xs font-medium">Ask AI</h4>
      </header>
      <div className="text-muted-foreground grid min-h-0 flex-1 content-start gap-2 overflow-y-auto p-3 text-xs">
        <p>Drag the edge to resize, or focus it and use the arrow keys. Double-click it for the default width.</p>
        <p>The page beside it narrows; nothing is covered.</p>
      </div>
    </DockedPanel>
  )
  return (
    <div className="bg-background flex h-72 w-full min-w-0 overflow-hidden rounded-lg border">
      {side === 'left' && panel}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3">
          <span className="truncate text-xs font-medium">Invoices</span>
          <Button variant="outline" size="sm" aria-pressed={open} onClick={() => setOpen(!open)} className="aria-pressed:bg-accent">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
            Ask AI
          </Button>
        </header>
        <ul className="divide-y overflow-y-auto">
          {['INV-0431 · Northwind', 'INV-0430 · Bayview Foods', 'INV-0429 · Acme Retail', 'INV-0428 · Harbour Lines', 'INV-0427 · Summit Labs'].map((row) => (
            <li key={row} className="truncate px-3 py-2 text-xs">{row}</li>
          ))}
        </ul>
      </div>
      {side === 'right' && panel}
    </div>
  )
}

function DockedPanelDemos() {
  return (
    <Playground
      title="Docked panel"
      description="A side panel beside the page that narrows it instead of covering it, and resizes from its edge. A sheet on a narrow screen"
      controls={[
        { kind: 'select', name: 'side', label: 'Side', options: ['right', 'left'], initial: 'right' },
        { kind: 'select', name: 'width', label: 'Default width', options: PANEL_WIDTHS, initial: '400' },
        { kind: 'switch', name: 'close', label: 'Close button', initial: true },
      ]}
      previewClassName="block"
      render={(v) => (
        <DockedPanelPreview
          key={str(v, 'side')}
          side={str(v, 'side') as 'left' | 'right'}
          defaultWidth={Number(str(v, 'width'))}
          closeButton={bool(v, 'close')}
        />
      )}
      code={(v) => {
        const side = str(v, 'side')
        const panel = jsx('DockedPanel', {
          open: '{open}',
          onOpenChange: '{setOpen}',
          title: 'Ask AI',
          side: unless(side, 'right'),
          defaultWidth: unless(str(v, 'width'), '400') ? `{${str(v, 'width')}}` : undefined,
          onWidthChange: '{saveWidth}',
          showCloseButton: bool(v, 'close') ? undefined : '{false}',
        }, ['{/* a header, and a body that scrolls */}'])
        const page = '<main className="min-w-0 flex-1">…</main>'
        return [
          imports({ '@/blocks/docked-panel': ['DockedPanel'] }),
          '',
          withState('Page', ['const [open, setOpen] = useState(false)'], jsx('div', { className: 'flex min-h-0 flex-1' }, side === 'left' ? [panel, page] : [page, panel])),
        ].join('\n')
      }}
    />
  )
}

/* Record peek */

function RecordPeekPreview({ peek, navigation, comments }: { peek: PeekMode; navigation: boolean; comments: boolean }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const invoices = [
    { id: 'INV-0431', customer: 'Northwind Trading', amount: '$4,820.00', due: '14 Oct' },
    { id: 'INV-0430', customer: 'Bayview Foods', amount: '$1,240.50', due: '9 Oct' },
    { id: 'INV-0429', customer: 'Acme Retail', amount: '$12,075.00', due: '2 Oct' },
  ]
  const invoice = invoices[index]
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Open {invoice.id}</Button>
      <RecordSheet open={open} onOpenChange={setOpen} peek={peek}>
        <RecordSheetContent
          key={invoice.id}
          number={invoice.id}
          badge={<StatusBadge tone={index === 2 ? 'danger' : 'warning'}>{index === 2 ? 'Overdue' : 'Unpaid'}</StatusBadge>}
          title={invoice.customer}
          description={`Invoice ${invoice.id}: details and activity.`}
          noun="invoice"
          navigation={navigation ? {
            index,
            total: invoices.length,
            onPrevious: index > 0 ? () => setIndex(index - 1) : undefined,
            onNext: index < invoices.length - 1 ? () => setIndex(index + 1) : undefined,
          } : undefined}
          details={[
            { label: 'Customer', value: invoice.customer },
            { label: 'Amount', value: <span className="tabular-nums">{invoice.amount}</span> },
            { label: 'Due', value: invoice.due },
          ]}
          activity={[
            { id: 1, actor: 'Mei Ling', text: 'sent a payment reminder', at: '2h ago' },
            { id: 2, actor: 'Ravi', text: 'created the invoice', at: '3 Oct' },
          ]}
          onComment={comments ? () => toast('Note added', { description: 'Demo only.' }) : undefined}
          footer={<Button variant="outline" size="sm" onClick={() => toast.success('Payment recorded', { description: 'Demo only.' })}>Record payment</Button>}
          onDelete={() => {
            toast(`Deleted ${invoice.id}`, { description: 'Demo only.' })
          }}
        />
      </RecordSheet>
    </>
  )
}

function RecordPeekDemos() {
  return (
    <Playground
      title="Record peek"
      description="One record opened over its list: a centred modal (center peek), or a panel from the right (side peek)"
      controls={[
        { kind: 'select', name: 'peek', label: 'Peek', options: ['center', 'side'], initial: 'center' },
        { kind: 'switch', name: 'navigation', label: 'Previous / next', initial: true },
        { kind: 'switch', name: 'comments', label: 'Comment box', initial: true },
      ]}
      render={(v) => <RecordPeekPreview peek={str(v, 'peek') as PeekMode} navigation={bool(v, 'navigation')} comments={bool(v, 'comments')} />}
      code={(v) => [
        imports({ '@/blocks/record-sheet': ['RecordSheet', 'RecordSheetContent'] }),
        '',
        jsx('RecordSheet', { open: '{!!invoice}', onOpenChange: '{close}', peek: unless(str(v, 'peek'), 'center') }, [
          '{invoice && (',
          jsx('RecordSheetContent', {
            key: '{invoice.id}',
            number: '{invoice.id}',
            title: '{invoice.customer}',
            description: 'Invoice details and activity.',
            noun: 'invoice',
            navigation: bool(v, 'navigation') ? '{{ index, total, onPrevious, onNext }}' : undefined,
            details: '{details}',
            activity: '{activity}',
            onComment: bool(v, 'comments') ? '{addNote}' : undefined,
            onDelete: '{remove}',
          }),
          ')}',
        ]),
      ].join('\n')}
    />
  )
}

export default function OverlaysMoreDemos() {
  return (
    <Demos>
      <SheetDemos />
      <DrawerDemos />
      <DockedPanelDemos />
      <RecordPeekDemos />
      <HoverCardDemos />
      <ContextMenuDemos />
    </Demos>
  )
}
