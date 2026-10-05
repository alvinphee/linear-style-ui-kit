import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, Archive01Icon, Copy01Icon, Delete02Icon, InformationCircleIcon, Link01Icon, Logout01Icon,
  MoreHorizontalIcon, PencilEdit02Icon, Settings01Icon, Share08Icon, TextBoldIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { CONTEXT_MENU_KIT, DROPDOWN_MENU_KIT, type MenuKit } from '@/components/menu-kit'
import { MOD } from '@/components/shortcut'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
  DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CodeBlock, Demos, Gallery, Playground, Variants, bool, element, imports, jsx, str } from './Playground'

const SIDES = ['top', 'right', 'bottom', 'left'] as const
const ALIGNS = ['start', 'center', 'end'] as const
const ALERT_SIZES = ['default', 'sm'] as const
const DIALOG_FOOTERS = ['actions', 'close button', 'none'] as const

type Side = (typeof SIDES)[number]
type Align = (typeof ALIGNS)[number]
type AlertSize = (typeof ALERT_SIZES)[number]

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

/* Tooltip */

function TooltipPreview({ side, align, label, shortcut, open }: {
  side: Side
  align: Align
  label: string
  shortcut: boolean
  open: boolean
}) {
  // Always controlled, so the Open switch can pin it without a controlled/uncontrolled flip.
  const [hovered, setHovered] = useState(false)
  return (
    <Tooltip open={open || hovered} onOpenChange={setHovered}>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {label}
        {shortcut && <Kbd>C</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

function TooltipDemos() {
  return (
    <>
      <Playground
        title="Tooltip"
        description="Needs a TooltipProvider near the app root"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'top' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Create issue' },
          { kind: 'switch', name: 'shortcut', label: 'Shortcut', initial: true },
          { kind: 'switch', name: 'open', label: 'Open', initial: true },
        ]}
        render={(v) => (
          <TooltipPreview
            side={str(v, 'side') as Side}
            align={str(v, 'align') as Align}
            label={str(v, 'label') || 'Create issue'}
            shortcut={bool(v, 'shortcut')}
            open={bool(v, 'open')}
          />
        )}
        code={(v) => {
          const shortcut = bool(v, 'shortcut')
          const label = str(v, 'label') || 'Create issue'
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Add01Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/kbd': shortcut ? ['Kbd'] : [],
            '@/components/ui/tooltip': ['Tooltip', 'TooltipContent', 'TooltipTrigger'],
          })
          const body = jsx('Tooltip', { open: bool(v, 'open') }, [
            jsx('TooltipTrigger', { asChild: true }, jsx('Button', { variant: 'outline', size: 'icon', 'aria-label': label }, ICON('Add01Icon'))),
            jsx('TooltipContent', {
              side: unless(str(v, 'side'), 'top'),
              align: unless(str(v, 'align'), 'center'),
            }, shortcut ? [label, '<Kbd>C</Kbd>'] : label),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Tooltip placement"
        note="side × align · hover or focus a button"
        rows={{ name: 'side', values: SIDES }}
        cols={{ name: 'align', values: ALIGNS }}
        render={(side, align) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">Hover</Button>
            </TooltipTrigger>
            <TooltipContent side={side} align={align}>{side} · {align}</TooltipContent>
          </Tooltip>
        )}
      />

      <Gallery
        title="Tooltip content"
        note="Hover or focus each trigger"
        items={[
          {
            label: 'text',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" />
                    Copy link
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copies a link to this issue</TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'KbdGroup',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Bold">
                    <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Bold
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>B</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'long text',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="About estimates" className="text-muted-foreground">
                    <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Estimates are points, not hours. Each team picks its own scale in settings.</TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'disabled trigger',
            node: (
              <Tooltip>
                {/* A disabled button gets no pointer events, so a focusable span takes the hover. */}
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="focus-visible:ring-ring/30 inline-flex rounded-md outline-none focus-visible:ring-2">
                    <Button size="sm" disabled>Merge</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Waiting for one more review</TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />
    </>
  )
}

/* Popover */

function PopoverDemos() {
  return (
    <>
      <Playground
        title="Popover"
        description="Click the trigger, then change side and align"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'bottom' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'switch', name: 'header', label: 'Header', initial: true },
        ]}
        render={(v) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent side={str(v, 'side') as Side} align={str(v, 'align') as Align}>
              {bool(v, 'header') && (
                <PopoverHeader>
                  <PopoverTitle>Share project</PopoverTitle>
                  <PopoverDescription>Anyone in the workspace with the link can view it.</PopoverDescription>
                </PopoverHeader>
              )}
              <div className="flex gap-2">
                <Input aria-label="Project link" value="https://example.com/p/website" readOnly className="min-w-0 flex-1" />
                <Button onClick={() => toast('Link copied', { description: 'Demo only.' })}>Copy</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        code={(v) => {
          const header = bool(v, 'header')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Share08Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/input': ['Input'],
            '@/components/ui/popover': pick(
              'Popover', 'PopoverContent', header && 'PopoverDescription', header && 'PopoverHeader',
              header && 'PopoverTitle', 'PopoverTrigger',
            ),
          })
          const body = jsx('Popover', {}, [
            jsx('PopoverTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('Share08Icon', 'inline-start'), 'Share'])),
            jsx('PopoverContent', {
              side: unless(str(v, 'side'), 'bottom'),
              align: unless(str(v, 'align'), 'center'),
            }, [
              header ? jsx('PopoverHeader', {}, [
                '<PopoverTitle>Share project</PopoverTitle>',
                '<PopoverDescription>Anyone in the workspace with the link can view it.</PopoverDescription>',
              ]) : '',
              jsx('div', { className: 'flex gap-2' }, [
                '<Input aria-label="Project link" value="https://example.com/p/website" readOnly className="min-w-0 flex-1" />',
                '<Button>Copy</Button>',
              ]),
            ]),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Popover placement"
        note="side × align · click a button"
        rows={{ name: 'side', values: SIDES }}
        cols={{ name: 'align', values: ALIGNS }}
        render={(side, align) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Open</Button>
            </PopoverTrigger>
            <PopoverContent side={side} align={align} className="w-44">
              <PopoverHeader>
                <PopoverTitle>{side} · {align}</PopoverTitle>
                <PopoverDescription>Flips when it runs out of room.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        )}
      />
    </>
  )
}

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

/* Dialog */

const RELEASE_NOTES = [
  'Search now covers comments and attachments.',
  'Saved views can be shared with a team.',
  'Keyboard shortcuts work inside the issue sidebar.',
  'Board columns remember their collapsed state.',
  'Bulk edit supports labels and due dates.',
  'Faster sync when you come back online.',
  'New webhooks for project updates.',
  'Exports include custom fields.',
  'Dark mode contrast is higher on charts.',
  'Cycle reports show scope changes.',
  'Mentions suggest people from the same team first.',
  'The command menu finds settings pages.',
]

function GalleryDialog({ trigger, title, description, className, showCloseButton, children, footer = true }: {
  trigger: string
  title: string
  description: string
  className?: string
  showCloseButton?: boolean
  children?: ReactNode
  footer?: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{trigger}</Button>
      </DialogTrigger>
      <DialogContent className={className} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Continue</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DialogDemos() {
  return (
    <>
      <Playground
        title="Dialog"
        description="Close button, footer and title"
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Rename project' },
          { kind: 'select', name: 'footer', label: 'Footer', options: DIALOG_FOOTERS, initial: 'actions' },
          { kind: 'switch', name: 'close', label: 'Close button', initial: true },
        ]}
        render={(v) => {
          const footer = str(v, 'footer')
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
                  Rename
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={bool(v, 'close')}>
                <DialogHeader>
                  <DialogTitle>{str(v, 'title') || 'Rename project'}</DialogTitle>
                  <DialogDescription>The name shows in the sidebar and in links.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-1.5">
                  <Label htmlFor="playground-project-name">Name</Label>
                  <Input id="playground-project-name" defaultValue="Website refresh" />
                </div>
                {footer === 'actions' && (
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button onClick={() => toast.success('Project renamed', { description: 'Demo only.' })}>Save</Button>
                    </DialogClose>
                  </DialogFooter>
                )}
                {footer === 'close button' && <DialogFooter showCloseButton />}
              </DialogContent>
            </Dialog>
          )
        }}
        code={(v) => {
          const footer = str(v, 'footer')
          const actions = footer === 'actions'
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['PencilEdit02Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/dialog': pick(
              'Dialog', actions && 'DialogClose', 'DialogContent', 'DialogDescription', footer !== 'none' && 'DialogFooter',
              'DialogHeader', 'DialogTitle', 'DialogTrigger',
            ),
            '@/components/ui/input': ['Input'],
            '@/components/ui/label': ['Label'],
          })
          const body = jsx('Dialog', {}, [
            jsx('DialogTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('PencilEdit02Icon', 'inline-start'), 'Rename'])),
            jsx('DialogContent', { showCloseButton: bool(v, 'close') ? undefined : '{false}' }, [
              jsx('DialogHeader', {}, [
                `<DialogTitle>${str(v, 'title') || 'Rename project'}</DialogTitle>`,
                '<DialogDescription>The name shows in the sidebar and in links.</DialogDescription>',
              ]),
              jsx('div', { className: 'grid gap-1.5' }, [
                '<Label htmlFor="project-name">Name</Label>',
                '<Input id="project-name" defaultValue="Website refresh" />',
              ]),
              actions ? jsx('DialogFooter', {}, [
                jsx('DialogClose', { asChild: true }, '<Button variant="outline">Cancel</Button>'),
                jsx('DialogClose', { asChild: true }, '<Button>Save</Button>'),
              ]) : '',
              footer === 'close button' ? '<DialogFooter showCloseButton />' : '',
            ]),
          ])
          return `${head}\n\n${expr(body)}`
        }}
      />

      <Gallery
        title="Dialog layouts"
        note="Width, long content and no close button"
        items={[
          {
            label: 'sm:max-w-lg',
            node: (
              <GalleryDialog
                trigger="Wide"
                title="Invite people"
                description="They get an email with a link to join the workspace."
                className="sm:max-w-lg"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="gallery-invite">Emails</Label>
                  <Input id="gallery-invite" placeholder="sam@example.com, kim@example.com" />
                </div>
              </GalleryDialog>
            ),
          },
          {
            label: 'scrolling body',
            node: (
              <GalleryDialog
                trigger="Long content"
                title="What's new"
                description="Changes in the last release."
                className="max-h-[min(30rem,85vh)] grid-rows-[auto_minmax(0,1fr)_auto]"
              >
                <ul className="text-muted-foreground -mx-4 grid list-disc gap-2 overflow-y-auto border-y py-3 pr-4 pl-8">
                  {RELEASE_NOTES.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </GalleryDialog>
            ),
          },
          {
            label: 'showCloseButton={false}',
            node: (
              <GalleryDialog
                trigger="No ×"
                title="Leave without saving?"
                description="Your draft is kept for 7 days."
                showCloseButton={false}
              />
            ),
          },
        ]}
      />
    </>
  )
}

/* Alert dialog */

function AlertDialogPreview({ size, media, title, compact }: { size: AlertSize; media: boolean; title: string; compact?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm">Open</Button>
        ) : (
          <Button variant="destructive">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
            Delete project
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {media && (
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>Its 42 issues and their comments go with it. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => toast('Project deleted', { description: 'Demo only. Nothing was removed.' })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function AlertDialogDemos() {
  return (
    <>
      <Playground
        title="Alert dialog"
        description="A confirm that a click outside does not close"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: ALERT_SIZES, initial: 'default' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'Delete this project?' },
          { kind: 'switch', name: 'media', label: 'Icon', initial: true },
        ]}
        render={(v) => (
          <AlertDialogPreview size={str(v, 'size') as AlertSize} media={bool(v, 'media')} title={str(v, 'title') || 'Delete this project?'} />
        )}
        code={(v) => {
          const media = bool(v, 'media')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': pick(media && 'Alert02Icon', 'Delete02Icon'),
            '@/components/ui/alert-dialog': pick(
              'AlertDialog', 'AlertDialogAction', 'AlertDialogCancel', 'AlertDialogContent', 'AlertDialogDescription',
              'AlertDialogFooter', 'AlertDialogHeader', media && 'AlertDialogMedia', 'AlertDialogTitle', 'AlertDialogTrigger',
            ),
            '@/components/ui/button': ['Button'],
          })
          const body = jsx('AlertDialog', {}, [
            jsx('AlertDialogTrigger', { asChild: true }, jsx('Button', { variant: 'destructive' }, [ICON('Delete02Icon', 'inline-start'), 'Delete project'])),
            jsx('AlertDialogContent', { size: unless(str(v, 'size'), 'default') }, [
              jsx('AlertDialogHeader', {}, [
                media ? jsx('AlertDialogMedia', { className: 'bg-destructive/10 text-destructive dark:bg-destructive/20' }, ICON('Alert02Icon')) : '',
                `<AlertDialogTitle>${str(v, 'title') || 'Delete this project?'}</AlertDialogTitle>`,
                '<AlertDialogDescription>Its 42 issues and their comments go with it. This cannot be undone.</AlertDialogDescription>',
              ]),
              jsx('AlertDialogFooter', {}, [
                '<AlertDialogCancel>Cancel</AlertDialogCancel>',
                '<AlertDialogAction variant="destructive">Delete</AlertDialogAction>',
              ]),
            ]),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Alert dialog sizes"
        note="size × media · click to open"
        rows={{ name: 'size', values: ALERT_SIZES }}
        cols={{ name: 'media', values: ['icon', 'none'] as const }}
        render={(size, media) => <AlertDialogPreview size={size} media={media === 'icon'} title="Delete this project?" compact />}
      />
    </>
  )
}

/* DeleteConfirm: the kit's confirm step, built on the alert dialog */

const CONFIRM_ICONS = {
  trash: { icon: Delete02Icon, name: 'Delete02Icon' },
  archive: { icon: Archive01Icon, name: 'Archive01Icon' },
  none: { icon: null, name: '' },
} as const

type ConfirmIcon = keyof typeof CONFIRM_ICONS

const CONFIRM_TEXT = 'Its 42 issues and their comments go with it. This cannot be undone.'

const confirmed = (label: string) => () => toast(label, { description: 'Demo only. Nothing was changed.' })

// Opened from a menu item: there is no trigger to go back to, so focus
// returns to the menu's button once the dialog closes.
function MenuDeleteConfirm() {
  const [open, setOpen] = useState(false)
  const more = useRef<HTMLButtonElement>(null)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconAction ref={more} label="Project actions" icon={MoreHorizontalIcon} variant="outline" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onSelect={confirmed('Renamed')}>
            <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setOpen(true)}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteConfirm
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={more}
        title="Delete Website refresh?"
        description={CONFIRM_TEXT}
        onConfirm={confirmed('Project deleted')}
      />
    </>
  )
}

function DeleteConfirmDemos() {
  return (
    <>
      <Playground
        title="DeleteConfirm"
        description="The kit's confirm step: one component for any delete"
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Delete this project?' },
          { kind: 'text', name: 'confirmLabel', label: 'Confirm label', initial: 'Delete' },
          { kind: 'switch', name: 'destructive', label: 'Destructive', initial: true },
          { kind: 'select', name: 'icon', label: 'Icon', options: Object.keys(CONFIRM_ICONS), initial: 'trash' },
          { kind: 'select', name: 'size', label: 'Size', options: ALERT_SIZES, initial: 'default' },
        ]}
        render={(v) => {
          const confirmLabel = str(v, 'confirmLabel') || 'Delete'
          return (
            <DeleteConfirm
              title={str(v, 'title') || 'Delete this project?'}
              description={CONFIRM_TEXT}
              confirmLabel={confirmLabel}
              destructive={bool(v, 'destructive')}
              icon={CONFIRM_ICONS[str(v, 'icon') as ConfirmIcon].icon}
              size={str(v, 'size') as AlertSize}
              onConfirm={confirmed(confirmLabel)}
            >
              <Button variant="outline">{confirmLabel} project</Button>
            </DeleteConfirm>
          )
        }}
        code={(v) => {
          const icon = str(v, 'icon') as ConfirmIcon
          const confirmLabel = str(v, 'confirmLabel') || 'Delete'
          const head = imports({
            '@hugeicons/core-free-icons': icon === 'archive' ? ['Archive01Icon'] : [],
            '@/components/delete-confirm': ['DeleteConfirm'],
            '@/components/ui/button': ['Button'],
          })
          const body = element('DeleteConfirm', [
            `title="${str(v, 'title') || 'Delete this project?'}"`,
            `description="${CONFIRM_TEXT}"`,
            confirmLabel !== 'Delete' && `confirmLabel="${confirmLabel}"`,
            !bool(v, 'destructive') && 'destructive={false}',
            icon === 'none' ? 'icon={null}' : icon === 'archive' && 'icon={Archive01Icon}',
            unless(str(v, 'size'), 'default') && `size="${str(v, 'size')}"`,
            'onConfirm={deleteProject}',
          ], `<Button variant="outline">${confirmLabel} project</Button>`)
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="DeleteConfirm in use"
        note="Children are the trigger; or drive it with open and onOpenChange"
        items={[
          { label: 'from a menu item', node: <MenuDeleteConfirm /> },
          {
            label: 'milder: destructive={false}',
            node: (
              <DeleteConfirm
                title="Archive Website refresh?"
                description="It leaves the sidebar and stops showing in search. You can restore it from Settings."
                confirmLabel="Archive"
                destructive={false}
                icon={Archive01Icon}
                onConfirm={confirmed('Project archived')}
              >
                <Button variant="outline" size="sm">Archive</Button>
              </DeleteConfirm>
            ),
          },
          {
            label: 'size="sm", icon={null}',
            node: (
              <DeleteConfirm
                title="Remove this label?"
                description="It comes off the 6 issues that have it."
                confirmLabel="Remove"
                icon={null}
                size="sm"
                onConfirm={confirmed('Label removed')}
              >
                <Button variant="outline" size="sm">Remove label</Button>
              </DeleteConfirm>
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

export default function OverlaysDemos() {
  return (
    <Demos>
      <TooltipDemos />
      <PopoverDemos />
      <DropdownDemos />
      <DialogDemos />
      <AlertDialogDemos />
      <DeleteConfirmDemos />
      <MenuKitDemos />
    </Demos>
  )
}
