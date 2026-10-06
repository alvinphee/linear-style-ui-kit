import { useState, Fragment, useId } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Archive01Icon, ArrowDown01Icon, ArrowRight01Icon, Calendar03Icon, Copy01Icon, Delete02Icon,
  Edit02Icon, FloppyDiskIcon, LayoutGridIcon, ListViewIcon, MinusSignIcon, MoreHorizontalIcon, PlusSignIcon,
  Redo02Icon, RefreshIcon, Search01Icon, Share08Icon, StarIcon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon,
  ThumbsDownIcon, ThumbsUpIcon, Undo02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { IconAction } from '@/components/icon-action'
import { PageHeader } from '@/components/page-header'
import { ThemeToggle } from '@/components/theme-toggle'
import { LIST_BOARD_VIEWS, ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  CodeBlock, Demos, Gallery, Playground, Variants, bool, imports, jsx, str, component, lit, unless, type Values,
} from './Playground'

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const

const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const

const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const

const TOGGLE_VARIANTS = ['default', 'outline'] as const

const TOGGLE_SIZES = ['sm', 'default', 'lg'] as const

type Variant = (typeof BUTTON_VARIANTS)[number]

type Size = (typeof BUTTON_SIZES)[number]

const demo = (label: string) => () => toast(label, { description: 'Demo only.' })

/* ---------- Icon action ---------- */

const ICON_ACTIONS = ['copy', 'regenerate', 'thumbs up', 'thumbs down', 'share'] as const

type ActionName = (typeof ICON_ACTIONS)[number]

const ACTION_ICONS: Record<ActionName, { icon: IconSvgElement; name: string; label: string }> = {
  copy: { icon: Copy01Icon, name: 'Copy01Icon', label: 'Copy' },
  regenerate: { icon: RefreshIcon, name: 'RefreshIcon', label: 'Regenerate' },
  'thumbs up': { icon: ThumbsUpIcon, name: 'ThumbsUpIcon', label: 'Good reply' },
  'thumbs down': { icon: ThumbsDownIcon, name: 'ThumbsDownIcon', label: 'Bad reply' },
  share: { icon: Share08Icon, name: 'Share08Icon', label: 'Share' },
}

// Keys for the tooltip, written as Shortcut takes them: "mod" is ⌘ or Ctrl.
const ACTION_SHORTCUTS = {
  none: undefined,
  'mod C': ['mod', 'C'],
  'mod shift R': ['mod', 'shift', 'R'],
  R: ['R'],
} satisfies Record<string, string[] | undefined>

type ActionShortcut = keyof typeof ACTION_SHORTCUTS

const ACTION_SHORTCUT_NAMES = Object.keys(ACTION_SHORTCUTS) as ActionShortcut[]

// An IconAction as a menu's trigger: it passes the trigger's props and ref on.
function MoreActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction label="More actions" icon={MoreHorizontalIcon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={demo('Shared')}>
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={demo('Regenerating')}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          Regenerate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function IconActionDemos() {
  return (
    <>
      <Playground
        title="Icon action"
        description="Hover for the tooltip, which is also its name"
        controls={[
          { kind: 'select', name: 'icon', label: 'Icon', options: ICON_ACTIONS, initial: 'copy' },
          { kind: 'text', name: 'label', label: 'Label (blank: the icon’s)', initial: '' },
          { kind: 'select', name: 'shortcut', label: 'Shortcut', options: ACTION_SHORTCUT_NAMES, initial: 'none' },
          { kind: 'switch', name: 'pressed', label: 'Pressed', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const label = str(v, 'label') || action.label
          return (
            <IconAction
              label={label}
              icon={action.icon}
              shortcut={ACTION_SHORTCUTS[str(v, 'shortcut') as ActionShortcut]}
              pressed={bool(v, 'pressed') || undefined}
              disabled={bool(v, 'disabled')}
              onClick={demo(label)}
            />
          )
        }}
        code={(v) => {
          const action = ACTION_ICONS[str(v, 'icon') as ActionName]
          const shortcut = ACTION_SHORTCUTS[str(v, 'shortcut') as ActionShortcut]
          const head = imports({
            '@hugeicons/core-free-icons': [action.name],
            '@/components/icon-action': ['IconAction'],
          })
          const body = jsx('IconAction', {
            label: str(v, 'label') || action.label,
            icon: `{${action.name}}`,
            shortcut: shortcut && `{${lit(shortcut)}}`,
            onClick: '{handleClick}',
            pressed: bool(v, 'pressed'),
            disabled: bool(v, 'disabled'),
          })
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="Icon action states"
        note="Pass icon, or children for anything else"
        items={[
          { label: 'rest', node: <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} /> },
          { label: 'pressed', node: <IconAction label="Good reply" icon={ThumbsUpIcon} pressed onClick={demo('Good reply')} /> },
          { label: 'disabled', node: <IconAction label="Regenerate" icon={RefreshIcon} disabled onClick={demo('Regenerate')} /> },
          { label: 'children', node: <IconAction label="Working" onClick={demo('Working')}><Spinner /></IconAction> },
          {
            label: 'shortcut in the tooltip',
            node: <IconAction label="Regenerate" icon={RefreshIcon} shortcut={['mod', 'shift', 'R']} onClick={demo('Regenerate')} />,
          },
          { label: 'as a menu trigger', node: <MoreActionsMenu /> },
          {
            label: 'a reply bar',
            node: (
              <div className="flex gap-0.5">
                <IconAction label="Copy" icon={Copy01Icon} onClick={demo('Copy')} />
                <IconAction label="Regenerate" icon={RefreshIcon} onClick={demo('Regenerate')} />
                <IconAction label="Good reply" icon={ThumbsUpIcon} onClick={demo('Good reply')} />
                <IconAction label="Bad reply" icon={ThumbsDownIcon} onClick={demo('Bad reply')} />
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

// jsx() only writes strings and numbers. This puts raw props (arrays,
// imported constants) first in the snippet's opening tag.
const withAttrs = (snippet: string, attrs: (string | false)[]) =>
  snippet.replace(/^<[\w.]+/, (tag) => [tag, ...attrs.filter(Boolean)].join(' '))

type Item = { value: string; label: string; icon: IconSvgElement; iconName: string }

/* Toggle group */

const TG_TYPES = ['single', 'multiple'] as const

const TG_VARIANTS = ['default', 'outline'] as const

const TG_SIZES = ['sm', 'default', 'lg'] as const

const TG_SPACING = ['0', '1', '2'] as const

// single reads as a view switcher, multiple as a format bar.
const VIEWS: Item[] = [
  { value: 'list', label: 'List', icon: ListViewIcon, iconName: 'ListViewIcon' },
  { value: 'board', label: 'Board', icon: LayoutGridIcon, iconName: 'LayoutGridIcon' },
  { value: 'calendar', label: 'Calendar', icon: Calendar03Icon, iconName: 'Calendar03Icon' },
]

const MARKS: Item[] = [
  { value: 'bold', label: 'Bold', icon: TextBoldIcon, iconName: 'TextBoldIcon' },
  { value: 'italic', label: 'Italic', icon: TextItalicIcon, iconName: 'TextItalicIcon' },
  { value: 'underline', label: 'Underline', icon: TextUnderlineIcon, iconName: 'TextUnderlineIcon' },
]

type ToggleGroupOptions = {
  type: (typeof TG_TYPES)[number]
  variant: (typeof TG_VARIANTS)[number]
  size: (typeof TG_SIZES)[number]
  spacing: number
  orientation: Orientation
  labels: boolean
  disabled: boolean
}

const toggleGroupOptions = (v: Values): ToggleGroupOptions => ({
  type: str(v, 'type') as ToggleGroupOptions['type'],
  variant: str(v, 'variant') as ToggleGroupOptions['variant'],
  size: str(v, 'size') as ToggleGroupOptions['size'],
  spacing: Number(str(v, 'spacing')),
  orientation: str(v, 'orientation') as Orientation,
  labels: bool(v, 'labels'),
  disabled: bool(v, 'disabled'),
})

function ToggleGroupPreview(o: ToggleGroupOptions) {
  const items = o.type === 'single' ? VIEWS : MARKS
  const shared = {
    variant: o.variant,
    size: o.size,
    spacing: o.spacing,
    orientation: o.orientation,
    disabled: o.disabled,
    'aria-label': o.type === 'single' ? 'View' : 'Text format',
  }
  const children = items.map((item) => (
    <ToggleGroupItem key={item.value} value={item.value} aria-label={o.labels ? undefined : item.label}>
      <HugeiconsIcon icon={item.icon} strokeWidth={2} data-icon={o.labels ? 'inline-start' : undefined} />
      {o.labels && item.label}
    </ToggleGroupItem>
  ))
  // Separate keys: single holds a string and multiple an array, so switching type must remount.
  return o.type === 'single'
    ? <ToggleGroup key="single" type="single" defaultValue="list" {...shared}>{children}</ToggleGroup>
    : <ToggleGroup key="multiple" type="multiple" defaultValue={['bold']} {...shared}>{children}</ToggleGroup>
}

function toggleGroupCode(o: ToggleGroupOptions) {
  const items = o.type === 'single' ? VIEWS : MARKS
  const children = items.map((item) =>
    jsx('ToggleGroupItem', { value: item.value, 'aria-label': o.labels ? undefined : item.label }, o.labels
      ? [`<HugeiconsIcon icon={${item.iconName}} strokeWidth={2} data-icon="inline-start" />`, item.label]
      : `<HugeiconsIcon icon={${item.iconName}} strokeWidth={2} />`))
  const body = withAttrs(
    jsx('ToggleGroup', {
      variant: orDefault(o.variant),
      size: orDefault(o.size),
      spacing: o.spacing === 2 ? undefined : o.spacing,
      orientation: o.orientation === 'horizontal' ? undefined : o.orientation,
      disabled: o.disabled,
      'aria-label': o.type === 'single' ? 'View' : 'Text format',
    }, children),
    [`type="${o.type}"`, o.type === 'single' ? 'defaultValue="list"' : "defaultValue={['bold']}"],
  )
  const head = imports({
    '@hugeicons/react': ['HugeiconsIcon'],
    '@hugeicons/core-free-icons': items.map((i) => i.iconName).sort(),
    '@/components/ui/toggle-group': ['ToggleGroup', 'ToggleGroupItem'],
  })
  return `${head}\n\n${body}`
}

function FormatGroup({ variant, size, spacing = 2, disabled, disabledItem, orientation }: {
  variant?: ToggleGroupOptions['variant']
  size?: ToggleGroupOptions['size']
  spacing?: number
  disabled?: boolean
  disabledItem?: string
  orientation?: Orientation
}) {
  return (
    <ToggleGroup
      type="multiple"
      defaultValue={['bold']}
      variant={variant}
      size={size}
      spacing={spacing}
      orientation={orientation}
      disabled={disabled}
      aria-label="Text format"
    >
      {MARKS.map((m) => (
        <ToggleGroupItem key={m.value} value={m.value} aria-label={m.label} disabled={disabledItem === m.value}>
          <HugeiconsIcon icon={m.icon} strokeWidth={2} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// type="single" lets a second click clear the choice. Ignoring the empty
// value keeps one view on, which is what a view switcher wants.
function ViewSwitcher() {
  const [view, setView] = useState('list')
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={view}
      onValueChange={(v) => v && setView(v)}
      aria-label="View"
    >
      {VIEWS.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value}>
          <HugeiconsIcon icon={item.icon} strokeWidth={2} data-icon="inline-start" />
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/* Button group */

const BG_VARIANTS = ['outline', 'secondary', 'default'] as const

const BG_SIZES = ['sm', 'default', 'lg'] as const

const BG_CONTENT = ['icon + text', 'text', 'icon'] as const

const ICON_SIZE = { sm: 'icon-sm', default: 'icon', lg: 'icon-lg' } as const

const ACTIONS: Item[] = [
  { value: 'edit', label: 'Edit', icon: Edit02Icon, iconName: 'Edit02Icon' },
  { value: 'duplicate', label: 'Duplicate', icon: Copy01Icon, iconName: 'Copy01Icon' },
  { value: 'archive', label: 'Archive', icon: Archive01Icon, iconName: 'Archive01Icon' },
]

type ButtonGroupOptions = {
  orientation: Orientation
  variant: (typeof BG_VARIANTS)[number]
  size: (typeof BG_SIZES)[number]
  content: (typeof BG_CONTENT)[number]
  separator: boolean
}

const buttonGroupOptions = (v: Values): ButtonGroupOptions => ({
  orientation: str(v, 'orientation') as Orientation,
  variant: str(v, 'variant') as ButtonGroupOptions['variant'],
  size: str(v, 'size') as ButtonGroupOptions['size'],
  content: str(v, 'content') as ButtonGroupOptions['content'],
  separator: bool(v, 'separator'),
})

// A separator runs across the group, so a vertical group needs a horizontal one.
const separatorOrientation = (o: Orientation) => (o === 'vertical' ? 'horizontal' : 'vertical')

function ButtonGroupPreview(o: ButtonGroupOptions) {
  const iconOnly = o.content === 'icon'
  return (
    <ButtonGroup orientation={o.orientation} aria-label="Issue actions">
      {ACTIONS.map((a, i) => (
        <Fragment key={a.value}>
          {o.separator && i > 0 && <ButtonGroupSeparator orientation={separatorOrientation(o.orientation)} />}
          <Button variant={o.variant} size={iconOnly ? ICON_SIZE[o.size] : o.size} aria-label={iconOnly ? a.label : undefined}>
            {o.content !== 'text' && (
              <HugeiconsIcon icon={a.icon} strokeWidth={2} data-icon={iconOnly ? undefined : 'inline-start'} />
            )}
            {!iconOnly && a.label}
          </Button>
        </Fragment>
      ))}
    </ButtonGroup>
  )
}

function buttonGroupCode(o: ButtonGroupOptions) {
  const iconOnly = o.content === 'icon'
  const separator = jsx('ButtonGroupSeparator', {
    orientation: o.orientation === 'vertical' ? separatorOrientation(o.orientation) : undefined,
  })
  const buttons = ACTIONS.flatMap((a, i) => {
    const icon = `<HugeiconsIcon icon={${a.iconName}} strokeWidth={2}${iconOnly ? '' : ' data-icon="inline-start"'} />`
    const button = jsx('Button', {
      variant: orDefault(o.variant),
      size: orDefault(iconOnly ? ICON_SIZE[o.size] : o.size),
      'aria-label': iconOnly ? a.label : undefined,
    }, o.content === 'text' ? a.label : iconOnly ? icon : [icon, a.label])
    return o.separator && i > 0 ? [separator, button] : [button]
  })
  const body = jsx('ButtonGroup', {
    orientation: o.orientation === 'horizontal' ? undefined : o.orientation,
    'aria-label': 'Issue actions',
  }, buttons)
  const head = imports({
    '@hugeicons/react': o.content === 'text' ? [] : ['HugeiconsIcon'],
    '@hugeicons/core-free-icons': o.content === 'text' ? [] : ACTIONS.map((a) => a.iconName).sort(),
    '@/components/ui/button': ['Button'],
    '@/components/ui/button-group': list('ButtonGroup', o.separator && 'ButtonGroupSeparator'),
  })
  return `${head}\n\n${body}`
}

function IconGroup({ variant, orientation }: { variant: ButtonGroupOptions['variant']; orientation: Orientation }) {
  // Filled variants have no border, so the seams come from separators.
  const separate = variant !== 'outline'
  return (
    <ButtonGroup orientation={orientation} aria-label="Issue actions">
      {ACTIONS.map((a, i) => (
        <Fragment key={a.value}>
          {separate && i > 0 && <ButtonGroupSeparator orientation={separatorOrientation(orientation)} />}
          <Button variant={variant} size="icon" aria-label={a.label}>
            <HugeiconsIcon icon={a.icon} strokeWidth={2} />
          </Button>
        </Fragment>
      ))}
    </ButtonGroup>
  )
}

function SplitButton() {
  return (
    <ButtonGroup>
      <Button onClick={() => toast.success('Changes saved')}>
        <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} data-icon="inline-start" />
        Save
      </Button>
      <ButtonGroupSeparator />
      <Button size="icon" aria-label="More save options" onClick={() => toast('Saved as draft')}>
        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
      </Button>
    </ButtonGroup>
  )
}

function UrlGroup() {
  const id = useId()
  return (
    <ButtonGroup className="w-64 max-w-full">
      <ButtonGroupText asChild>
        <Label htmlFor={id}>https://</Label>
      </ButtonGroupText>
      <Input id={id} placeholder="example.com" />
    </ButtonGroup>
  )
}

function SearchGroup() {
  return (
    <ButtonGroup className="w-64 max-w-full">
      <Input aria-label="Search issues" placeholder="Search issues…" />
      <Button variant="outline" size="icon" aria-label="Search">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
      </Button>
    </ButtonGroup>
  )
}

function AmountGroup() {
  return (
    <ButtonGroup className="w-56 max-w-full">
      <Select defaultValue="usd">
        <SelectTrigger aria-label="Currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="usd">USD</SelectItem>
            <SelectItem value="eur">EUR</SelectItem>
            <SelectItem value="gbp">GBP</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input aria-label="Amount" inputMode="decimal" placeholder="0.00" />
    </ButtonGroup>
  )
}

function NestedGroups() {
  const tool = (label: string, icon: IconSvgElement) => (
    <Button variant="outline" size="icon" aria-label={label}>
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Button>
  )
  return (
    <ButtonGroup aria-label="Toolbar">
      <ButtonGroup>
        {tool('Undo', Undo02Icon)}
        {tool('Redo', Redo02Icon)}
      </ButtonGroup>
      <ButtonGroup>
        {tool('Archive', Archive01Icon)}
        {tool('Delete', Delete02Icon)}
      </ButtonGroup>
    </ButtonGroup>
  )
}

function SeatStepper() {
  const [seats, setSeats] = useState(5)
  return (
    <ButtonGroup aria-label="Seats">
      <Button variant="outline" size="icon" aria-label="Remove a seat" disabled={seats <= 1} onClick={() => setSeats((n) => n - 1)}>
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
      </Button>
      <ButtonGroupText aria-live="polite" className="dark:bg-input/30 min-w-18 justify-center bg-transparent font-normal tabular-nums">
        {seats} {seats === 1 ? 'seat' : 'seats'}
      </ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Add a seat" disabled={seats >= 50} onClick={() => setSeats((n) => n + 1)}>
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      </Button>
    </ButtonGroup>
  )
}

const ORIENTATIONS = ['horizontal', 'vertical'] as const

type Orientation = (typeof ORIENTATIONS)[number]

/* View switch */

const VIEW_SETS = ['list and board', 'list, board and calendar'] as const

type ViewSet = (typeof VIEW_SETS)[number]

const WITH_CALENDAR: ViewOption[] = [
  ...LIST_BOARD_VIEWS,
  { value: 'calendar', label: 'Calendar', icon: Calendar03Icon },
]

const VIEWS_FOR: Record<ViewSet, ViewOption[]> = { 'list and board': LIST_BOARD_VIEWS, 'list, board and calendar': WITH_CALENDAR }

function ViewSwitchDemo({ views, showLabels, label }: { views: ViewOption[]; showLabels?: boolean; label?: string }) {
  const [view, setView] = useState('list')
  return <ViewSwitch views={views} value={view} onChange={setView} showLabels={showLabels} label={label} />
}

function ViewSwitchDemos() {
  return (
    <>
      <Playground
        title="ViewSwitch"
        description="List or board (or any views) for the same records. One is always on."
        controls={[
          { kind: 'select', name: 'views', label: 'Views', options: VIEW_SETS, initial: 'list and board' },
          { kind: 'switch', name: 'showLabels', label: 'Show labels', initial: false },
          { kind: 'text', name: 'label', label: 'Group name (label)', initial: 'View' },
        ]}
        render={(v) => (
          <ViewSwitchDemo
            // Back to the list when the views change, so the value is always one of them.
            key={str(v, 'views')}
            views={VIEWS_FOR[str(v, 'views') as ViewSet]}
            showLabels={bool(v, 'showLabels')}
            label={str(v, 'label') || undefined}
          />
        )}
        code={(v) => {
          const calendar = str(v, 'views') !== 'list and board'
          const head = imports({
            react: ['useState'],
            '@hugeicons/core-free-icons': calendar ? ['Calendar03Icon'] : [],
            '@/components/view-switch': calendar ? ['LIST_BOARD_VIEWS', 'ViewSwitch', 'type ViewOption'] : ['LIST_BOARD_VIEWS', 'ViewSwitch'],
          })
          const views = calendar
            ? "const views: ViewOption[] = [\n  ...LIST_BOARD_VIEWS,\n  { value: 'calendar', label: 'Calendar', icon: Calendar03Icon },\n]\n\n"
            : ''
          const body = jsx('ViewSwitch', {
            views: calendar ? '{views}' : '{LIST_BOARD_VIEWS}',
            value: '{view}',
            onChange: '{setView}',
            showLabels: bool(v, 'showLabels'),
            label: unless(str(v, 'label'), 'View'),
          })
          const state = calendar ? "const [view, setView] = useState('list')" : "const [view, setView] = useState<'list' | 'board'>('list')"
          return `${head}\n\n${views}${component('IssuesView', [state], body)}`
        }}
      />

      <Gallery
        title="ViewSwitch in use"
        items={[
          { label: 'LIST_BOARD_VIEWS', node: <ViewSwitchDemo views={LIST_BOARD_VIEWS} /> },
          { label: 'showLabels', node: <ViewSwitchDemo views={WITH_CALENDAR} showLabels label="Layout" /> },
          {
            label: 'in a page header',
            node: (
              <PageHeader
                title="Issues"
                description="24 open"
                size="sm"
                as="h3"
                actions={<ViewSwitchDemo views={LIST_BOARD_VIEWS} />}
                className="bg-background w-72 rounded-lg border p-3"
              />
            ),
          },
        ]}
      />
    </>
  )
}

export default function ButtonsDemos() {
  return (
    <Demos>
      <Playground
        title="Button"
        description="variant, size, icon and state"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: BUTTON_VARIANTS, initial: 'default' },
          { kind: 'select', name: 'size', label: 'Size', options: BUTTON_SIZES, initial: 'default' },
          { kind: 'select', name: 'icon', label: 'Icon', options: ['none', 'start', 'end'], initial: 'start' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'New issue' },
          { kind: 'switch', name: 'loading', label: 'Loading', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const icon = str(v, 'icon')
          const loading = bool(v, 'loading')
          const start = loading ? <Spinner data-icon="inline-start" /> : icon === 'start' && <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          return (
            <Button variant={str(v, 'variant') as Variant} size={str(v, 'size') as Size} disabled={bool(v, 'disabled') || loading}>
              {start}
              {str(v, 'label') || 'Button'}
              {icon === 'end' && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
            </Button>
          )
        }}
        code={(v) => {
          const icon = str(v, 'icon')
          const loading = bool(v, 'loading')
          const icons = [loading ? '' : icon === 'start' ? 'Add01Icon' : icon === 'end' ? 'ArrowRight01Icon' : ''].filter(Boolean)
          const head = imports({
            '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
            '@hugeicons/core-free-icons': icons,
            '@/components/ui/button': ['Button'],
            '@/components/ui/spinner': loading ? ['Spinner'] : [],
          })
          const children = [
            loading ? '<Spinner data-icon="inline-start" />' : icon === 'start' ? '<HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />' : '',
            str(v, 'label') || 'Button',
            !loading && icon === 'end' ? '<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />' : '',
          ].filter(Boolean)
          const body = jsx('Button', {
            variant: orDefault(str(v, 'variant')),
            size: orDefault(str(v, 'size')),
            disabled: bool(v, 'disabled') || loading,
          }, children.length === 1 ? children[0] : children)
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Button variants"
        rows={{ name: 'variant', values: BUTTON_VARIANTS }}
        cols={{ name: 'size', values: BUTTON_SIZES }}
        render={(variant, size) => <Button variant={variant} size={size}>{variant === 'default' ? 'Primary' : variant[0].toUpperCase() + variant.slice(1)}</Button>}
      />

      <Variants
        title="Icon buttons"
        rows={{ name: 'variant', values: BUTTON_VARIANTS.filter((v) => v !== 'link') }}
        cols={{ name: 'size', values: ICON_SIZES }}
        render={(variant, size) => (
          <Button variant={variant} size={size} aria-label="Add">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
        )}
      />

      <Gallery
        title="Button states"
        note="Hover and focus with the mouse or Tab"
        items={[
          { label: 'rest', node: <Button>Save</Button> },
          { label: 'disabled', node: <Button disabled>Save</Button> },
          { label: 'loading', node: <Button disabled><Spinner data-icon="inline-start" /> Saving</Button> },
          { label: 'aria-invalid', node: <Button variant="outline" aria-invalid>Retry</Button> },
          { label: 'aria-expanded', node: <Button variant="outline" aria-expanded>Menu open</Button> },
        ]}
      />

      <IconActionDemos />

      <Playground
        title="Button group"
        description="orientation, variant, size and separators"
        controls={[
          { kind: 'select', name: 'orientation', label: 'Orientation', options: ORIENTATIONS, initial: 'horizontal' },
          { kind: 'select', name: 'variant', label: 'Button variant', options: BG_VARIANTS, initial: 'outline' },
          { kind: 'select', name: 'size', label: 'Button size', options: BG_SIZES, initial: 'default' },
          { kind: 'select', name: 'content', label: 'Content', options: BG_CONTENT, initial: 'icon + text' },
          { kind: 'switch', name: 'separator', label: 'Separators', initial: false },
        ]}
        render={(v) => <ButtonGroupPreview {...buttonGroupOptions(v)} />}
        code={(v) => buttonGroupCode(buttonGroupOptions(v))}
      />

      <Variants
        title="Button group variants"
        note="Filled variants have no border, so add ButtonGroupSeparator"
        rows={{ name: 'variant', values: BG_VARIANTS }}
        cols={{ name: 'orientation', values: ORIENTATIONS }}
        render={(variant, orientation) => <IconGroup variant={variant} orientation={orientation ?? 'horizontal'} />}
      />

      <Gallery
        title="Button group in use"
        items={[
          { label: 'split button', node: <SplitButton /> },
          { label: 'with text', node: <UrlGroup /> },
          { label: 'with input', node: <SearchGroup /> },
          { label: 'with select', node: <AmountGroup /> },
          { label: 'nested groups', node: <NestedGroups /> },
          { label: 'stepper', node: <SeatStepper /> },
        ]}
      />

      <Playground
        title="Toggle"
        description="A button that stays pressed"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: TOGGLE_VARIANTS, initial: 'outline' },
          { kind: 'select', name: 'size', label: 'Size', options: TOGGLE_SIZES, initial: 'default' },
          { kind: 'switch', name: 'label', label: 'Show label', initial: true },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => (
          <Toggle
            variant={str(v, 'variant') as (typeof TOGGLE_VARIANTS)[number]}
            size={str(v, 'size') as (typeof TOGGLE_SIZES)[number]}
            disabled={bool(v, 'disabled')}
            aria-label="Bold"
          >
            <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} data-icon={bool(v, 'label') ? 'inline-start' : undefined} />
            {bool(v, 'label') && 'Bold'}
          </Toggle>
        )}
        code={(v) => {
          const label = bool(v, 'label')
          return `${imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['TextBoldIcon'],
            '@/components/ui/toggle': ['Toggle'],
          })}\n\n${jsx('Toggle', {
            variant: orDefault(str(v, 'variant')),
            size: orDefault(str(v, 'size')),
            disabled: bool(v, 'disabled'),
            'aria-label': 'Bold',
          }, label
            ? ['<HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} data-icon="inline-start" />', 'Bold']
            : '<HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />')}`
        }}
      />

      <Variants
        title="Toggle variants"
        rows={{ name: 'variant', values: TOGGLE_VARIANTS }}
        cols={{ name: 'size', values: TOGGLE_SIZES }}
        render={(variant, size) => (
          <Toggle variant={variant} size={size} defaultPressed aria-label="Star">
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
          </Toggle>
        )}
      />

      <Playground
        title="Toggle group"
        description="type, variant, size and spacing"
        controls={[
          { kind: 'select', name: 'type', label: 'Type', options: TG_TYPES, initial: 'single' },
          { kind: 'select', name: 'variant', label: 'Variant', options: TG_VARIANTS, initial: 'outline' },
          { kind: 'select', name: 'size', label: 'Size', options: TG_SIZES, initial: 'default' },
          { kind: 'select', name: 'spacing', label: 'Spacing', options: TG_SPACING, initial: '0' },
          { kind: 'select', name: 'orientation', label: 'Orientation', options: ORIENTATIONS, initial: 'horizontal' },
          { kind: 'switch', name: 'labels', label: 'Labels', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => <ToggleGroupPreview {...toggleGroupOptions(v)} />}
        code={(v) => toggleGroupCode(toggleGroupOptions(v))}
      />

      <Variants
        title="Toggle group variants"
        rows={{ name: 'variant', values: TG_VARIANTS }}
        cols={{ name: 'size', values: TG_SIZES }}
        render={(variant, size) => <FormatGroup variant={variant} size={size} />}
      />

      <Variants
        title="Toggle group spacing"
        note="spacing 0 joins the items into one segmented control"
        rows={{ name: 'spacing', values: TG_SPACING }}
        cols={{ name: 'variant', values: TG_VARIANTS }}
        render={(spacing, variant) => <FormatGroup variant={variant} spacing={Number(spacing)} />}
      />

      <Gallery
        title="Toggle group states"
        items={[
          { label: 'disabled', node: <FormatGroup variant="outline" disabled /> },
          { label: 'one item disabled', node: <FormatGroup variant="outline" disabledItem="underline" /> },
          { label: 'vertical', node: <FormatGroup variant="outline" spacing={0} orientation="vertical" /> },
          { label: 'one always on', node: <ViewSwitcher /> },
        ]}
      />

      <ViewSwitchDemos />

      <Gallery
        title="Theme toggle"
        note="ThemeToggle: light and dark for a header. It switches the kit itself; System is in the theme menus"
        items={[
          { label: 'ThemeToggle', node: <ThemeToggle /> },
          { label: 'code', node: <CodeBlock code={"import { ThemeToggle } from '@/components/theme-toggle'\n\n<ThemeToggle />"} /> },
        ]}
      />
    </Demos>
  )
}
