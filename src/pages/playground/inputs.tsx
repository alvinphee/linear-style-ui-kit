import { Fragment, useId, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Archive01Icon, ArrowDown01Icon, ArrowUp02Icon, Attachment01Icon, Calendar03Icon, Cancel01Icon, Copy01Icon,
  Delete02Icon, Edit02Icon, FloppyDiskIcon, LayoutGridIcon, ListViewIcon, Mail01Icon, MinusSignIcon, PlusSignIcon,
  Redo02Icon, Search01Icon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon, Tick02Icon, Undo02Icon, ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea,
} from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const orDefault = (value: string) => (value === 'default' ? undefined : value)
const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

// jsx() only writes strings and numbers. This puts raw props (arrays,
// imported constants) first in the snippet's opening tag.
const withAttrs = (snippet: string, attrs: (string | false)[]) =>
  snippet.replace(/^<[\w.]+/, (tag) => [tag, ...attrs.filter(Boolean)].join(' '))

const ORIENTATIONS = ['horizontal', 'vertical'] as const
type Orientation = (typeof ORIENTATIONS)[number]

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

/* Input OTP */

const OTP_LENGTHS = ['4', '6'] as const
const OTP_PATTERNS = ['digits', 'digits and letters'] as const
type OtpPattern = (typeof OTP_PATTERNS)[number]

const PATTERN = {
  digits: { value: REGEXP_ONLY_DIGITS, name: 'REGEXP_ONLY_DIGITS' },
  'digits and letters': { value: REGEXP_ONLY_DIGITS_AND_CHARS, name: 'REGEXP_ONLY_DIGITS_AND_CHARS' },
} as const

type OtpOptions = { length: number; separator: boolean; pattern: OtpPattern; disabled: boolean; invalid: boolean }

const otpOptions = (v: Values): OtpOptions => ({
  length: Number(str(v, 'length')),
  separator: bool(v, 'separator'),
  pattern: str(v, 'pattern') as OtpPattern,
  disabled: bool(v, 'disabled'),
  invalid: bool(v, 'invalid'),
})

// With a separator the slots split into two halves.
const otpGroups = (length: number, separator: boolean) => {
  const all = Array.from({ length }, (_, i) => i)
  return separator ? [all.slice(0, length / 2), all.slice(length / 2)] : [all]
}

function OtpField({ length = 6, separator = true, pattern = 'digits', disabled, invalid, defaultValue, label }: Partial<OtpOptions> & {
  defaultValue?: string
  label?: boolean
}) {
  const id = useId()
  // Controlled: input-otp passes defaultValue on to its <input> beside its
  // own value, and React warns about that.
  const [code, setCode] = useState(defaultValue ?? '')
  const groups = otpGroups(length, separator)
  const otp = (
    <InputOTP
      id={id}
      maxLength={length}
      pattern={PATTERN[pattern].value}
      value={code}
      onChange={setCode}
      disabled={disabled}
      containerClassName={separator ? 'gap-2' : undefined}
      aria-label={label ? undefined : 'Verification code'}
    >
      {groups.map((slots, g) => (
        <Fragment key={g}>
          {g > 0 && <InputOTPSeparator className="text-muted-foreground" />}
          <InputOTPGroup>
            {slots.map((i) => <InputOTPSlot key={i} index={i} aria-invalid={invalid || undefined} />)}
          </InputOTPGroup>
        </Fragment>
      ))}
    </InputOTP>
  )
  if (!label) return otp
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Verification code</Label>
      {otp}
    </div>
  )
}

function otpCode(o: OtpOptions) {
  const groups = otpGroups(o.length, o.separator).map((slots) =>
    jsx('InputOTPGroup', {}, slots.map((i) => jsx('InputOTPSlot', { index: i, 'aria-invalid': o.invalid }))))
  const children = o.separator ? [groups[0], '<InputOTPSeparator />', groups[1]] : groups
  const otp = withAttrs(
    jsx('InputOTP', {
      containerClassName: o.separator ? 'gap-2' : undefined,
      disabled: o.disabled,
    }, children),
    ['id="code"', `maxLength={${o.length}}`, `pattern={${PATTERN[o.pattern].name}}`],
  )
  const body = jsx('div', { className: 'grid gap-2' }, [jsx('Label', { htmlFor: 'code' }, 'Verification code'), otp])
  const head = imports({
    'input-otp': [PATTERN[o.pattern].name],
    '@/components/ui/input-otp': list('InputOTP', 'InputOTPGroup', o.separator && 'InputOTPSeparator', 'InputOTPSlot'),
    '@/components/ui/label': ['Label'],
  })
  return `${head}\n\n${body}`
}

/* Input group */

const IG_START = ['none', 'icon', 'text'] as const
const IG_END = ['none', 'text', 'kbd', 'button', 'spinner'] as const
const IG_ALIGNS = ['inline-start', 'inline-end', 'block-start', 'block-end'] as const

type InputGroupOptions = {
  start: (typeof IG_START)[number]
  end: (typeof IG_END)[number]
  placeholder: string
  disabled: boolean
  invalid: boolean
}

const inputGroupOptions = (v: Values): InputGroupOptions => ({
  start: str(v, 'start') as InputGroupOptions['start'],
  end: str(v, 'end') as InputGroupOptions['end'],
  placeholder: str(v, 'placeholder'),
  disabled: bool(v, 'disabled'),
  invalid: bool(v, 'invalid'),
})

function InputGroupPreview(o: InputGroupOptions) {
  const [value, setValue] = useState('')
  return (
    <InputGroup data-disabled={o.disabled || undefined} className="max-w-72">
      {o.start !== 'none' && (
        <InputGroupAddon>
          {o.start === 'icon' ? <HugeiconsIcon icon={Search01Icon} strokeWidth={2} /> : <InputGroupText>https://</InputGroupText>}
        </InputGroupAddon>
      )}
      <InputGroupInput
        aria-label="Search"
        placeholder={o.placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={o.disabled}
        aria-invalid={o.invalid || undefined}
      />
      {o.end !== 'none' && (
        <InputGroupAddon align="inline-end">
          {o.end === 'text' && <InputGroupText>.com</InputGroupText>}
          {o.end === 'kbd' && <Kbd>/</Kbd>}
          {o.end === 'spinner' && <Spinner />}
          {o.end === 'button' && (
            <InputGroupButton size="icon-xs" aria-label="Clear" disabled={o.disabled} onClick={() => setValue('')}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

function inputGroupCode(o: InputGroupOptions) {
  const start = o.start === 'icon'
    ? '<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />'
    : o.start === 'text' ? '<InputGroupText>https://</InputGroupText>' : ''
  const end = {
    none: '',
    text: '<InputGroupText>.com</InputGroupText>',
    kbd: '<Kbd>/</Kbd>',
    spinner: '<Spinner />',
    button: jsx('InputGroupButton', { size: 'icon-xs', 'aria-label': 'Clear', disabled: o.disabled },
      '<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />'),
  }[o.end]
  const body = jsx('InputGroup', { 'data-disabled': o.disabled }, [
    start ? jsx('InputGroupAddon', {}, start) : '',
    jsx('InputGroupInput', {
      'aria-label': 'Search',
      placeholder: o.placeholder,
      disabled: o.disabled,
      'aria-invalid': o.invalid,
    }),
    end ? jsx('InputGroupAddon', { align: 'inline-end' }, end) : '',
  ])
  const icons = list(o.end === 'button' && 'Cancel01Icon', o.start === 'icon' && 'Search01Icon')
  const head = imports({
    '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': icons,
    '@/components/ui/input-group': list(
      'InputGroup', 'InputGroupAddon', o.end === 'button' && 'InputGroupButton', 'InputGroupInput',
      (o.start === 'text' || o.end === 'text') && 'InputGroupText',
    ),
    '@/components/ui/kbd': o.end === 'kbd' ? ['Kbd'] : [],
    '@/components/ui/spinner': o.end === 'spinner' ? ['Spinner'] : [],
  })
  return `${head}\n\n${body}`
}

function PasswordGroup() {
  const [shown, setShown] = useState(false)
  return (
    <InputGroup className="w-64 max-w-full">
      <InputGroupInput type={shown ? 'text' : 'password'} aria-label="Password" defaultValue="correct-horse" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Show password" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          <HugeiconsIcon icon={shown ? ViewOffIcon : ViewIcon} strokeWidth={2} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function CopyGroup() {
  const link = 'https://example.com/invite/8f2k'
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed', { description: 'Your browser blocked the clipboard.' })
    }
  }

  return (
    <InputGroup className="w-64 max-w-full">
      <InputGroupInput aria-label="Invite link" value={link} readOnly />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label={copied ? 'Copied' : 'Copy link'} onClick={copy}>
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function CommentComposer() {
  const [text, setText] = useState('')
  return (
    <InputGroup className="w-72 max-w-full">
      <InputGroupTextarea aria-label="Comment" placeholder="Leave a comment…" value={text} onChange={(e) => setText(e.target.value)} />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="icon-xs" aria-label="Attach a file">
          <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
        </InputGroupButton>
        <InputGroupButton
          variant="default"
          size="icon-xs"
          className="ml-auto"
          aria-label="Send comment"
          disabled={!text.trim()}
          onClick={() => {
            setText('')
            toast.success('Comment posted')
          }}
        >
          <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

export default function InputsDemos() {
  return (
    <Demos>
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
        title="Input OTP"
        description="length, separator, pattern and state"
        controls={[
          { kind: 'select', name: 'length', label: 'Length', options: OTP_LENGTHS, initial: '6' },
          { kind: 'select', name: 'pattern', label: 'Pattern', options: OTP_PATTERNS, initial: 'digits' },
          { kind: 'switch', name: 'separator', label: 'Separator', initial: true },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
          { kind: 'switch', name: 'invalid', label: 'Invalid', initial: false },
        ]}
        render={(v) => {
          const o = otpOptions(v)
          // Remount on a new length or pattern, so a typed code never outgrows the slots.
          return <OtpField key={`${o.length}-${o.pattern}`} {...o} label />
        }}
        code={(v) => otpCode(otpOptions(v))}
      />

      <Gallery
        title="Input OTP states"
        note="Paste a code to fill every slot at once"
        items={[
          { label: 'empty', node: <OtpField /> },
          { label: 'filled', node: <OtpField defaultValue="482913" /> },
          { label: 'disabled', node: <OtpField defaultValue="482913" disabled /> },
          { label: 'aria-invalid', node: <OtpField defaultValue="482913" invalid /> },
          { label: '4 digits, no separator', node: <OtpField length={4} separator={false} /> },
          { label: 'digits and letters', node: <OtpField pattern="digits and letters" defaultValue="A7K2Q9" /> },
        ]}
      />

      <Playground
        title="Input group"
        description="addons, button and state"
        controls={[
          { kind: 'select', name: 'start', label: 'Start addon', options: IG_START, initial: 'icon' },
          { kind: 'select', name: 'end', label: 'End addon', options: IG_END, initial: 'kbd' },
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Search…' },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
          { kind: 'switch', name: 'invalid', label: 'Invalid', initial: false },
        ]}
        render={(v) => <InputGroupPreview {...inputGroupOptions(v)} />}
        code={(v) => inputGroupCode(inputGroupOptions(v))}
      />

      <Variants
        title="Input group addon align"
        rows={{ name: 'align', values: IG_ALIGNS }}
        render={(align) => (
          <InputGroup className="w-64">
            <InputGroupInput aria-label="Email" placeholder="name@example.com" />
            <InputGroupAddon align={align}>
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
              <InputGroupText>Email</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        )}
      />

      <Gallery
        title="Input group in use"
        items={[
          { label: 'show password', node: <PasswordGroup /> },
          { label: 'copy', node: <CopyGroup /> },
          {
            label: 'prefix and suffix',
            node: (
              <InputGroup className="w-64 max-w-full">
                <InputGroupAddon>
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput aria-label="Domain" placeholder="example" />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>.com</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            ),
          },
          { label: 'textarea with toolbar', node: <CommentComposer /> },
        ]}
      />
    </Demos>
  )
}
