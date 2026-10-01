import { useId, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  CancelCircleIcon, CheckmarkCircle02Icon, CircleDashedIcon, CircleIcon, HashtagIcon, LockPasswordIcon,
  Mail01Icon, TimeHalfPassIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const orDefault = (value: string) => (value === 'default' ? undefined : value)
const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

// jsx() only writes strings and numbers. This puts raw props (arrays,
// expressions) first in the snippet's opening tag.
const withAttrs = (snippet: string, attrs: (string | false)[]) =>
  snippet.replace(/^<[\w.]+/, (tag) => [tag, ...attrs.filter(Boolean)].join(' '))

/* Input */

const INPUT_TYPES = ['text', 'email', 'password', 'number'] as const
type InputType = (typeof INPUT_TYPES)[number]

const INPUT_META: Record<InputType, { id: string; label: string; icon: IconSvgElement; iconName: string; error: string }> = {
  text: { id: 'name', label: 'Full name', icon: UserIcon, iconName: 'UserIcon', error: 'Enter your name.' },
  email: { id: 'email', label: 'Email', icon: Mail01Icon, iconName: 'Mail01Icon', error: 'Enter a valid email address.' },
  password: { id: 'password', label: 'Password', icon: LockPasswordIcon, iconName: 'LockPasswordIcon', error: 'Use at least 8 characters.' },
  number: { id: 'seats', label: 'Seats', icon: HashtagIcon, iconName: 'HashtagIcon', error: 'Enter a number from 1 to 500.' },
}

type InputOptions = { type: InputType; placeholder: string; label: boolean; icon: boolean; disabled: boolean; invalid: boolean }

const inputOptions = (v: Values): InputOptions => ({
  type: str(v, 'type') as InputType,
  placeholder: str(v, 'placeholder'),
  label: bool(v, 'label'),
  icon: bool(v, 'icon'),
  disabled: bool(v, 'disabled'),
  invalid: bool(v, 'invalid'),
})

function InputPreview({ type, placeholder, label, icon, disabled, invalid }: InputOptions) {
  const id = useId()
  const meta = INPUT_META[type]
  const props = {
    id,
    type,
    placeholder,
    disabled,
    'aria-invalid': invalid || undefined,
    'aria-label': label ? undefined : meta.label,
  }
  const control = icon ? (
    <InputGroup data-disabled={disabled || undefined}>
      <InputGroupAddon>
        <HugeiconsIcon icon={meta.icon} strokeWidth={2} />
      </InputGroupAddon>
      <InputGroupInput {...props} />
    </InputGroup>
  ) : (
    <Input {...props} />
  )
  if (!label) return <div className="w-full max-w-64">{control}</div>
  return (
    <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined} className="max-w-64">
      <FieldLabel htmlFor={id}>{meta.label}</FieldLabel>
      {control}
      {invalid && <FieldError>{meta.error}</FieldError>}
    </Field>
  )
}

function inputCode(o: InputOptions) {
  const meta = INPUT_META[o.type]
  const input = jsx(o.icon ? 'InputGroupInput' : 'Input', {
    id: o.label ? meta.id : undefined,
    type: o.type === 'text' ? undefined : o.type,
    placeholder: o.placeholder,
    disabled: o.disabled,
    'aria-invalid': o.invalid,
    'aria-label': o.label ? undefined : meta.label,
  })
  const control = o.icon
    ? jsx('InputGroup', { 'data-disabled': o.disabled }, [
        jsx('InputGroupAddon', {}, `<HugeiconsIcon icon={${meta.iconName}} strokeWidth={2} />`),
        input,
      ])
    : input
  const body = o.label
    ? jsx('Field', { 'data-invalid': o.invalid, 'data-disabled': o.disabled }, [
        jsx('FieldLabel', { htmlFor: meta.id }, meta.label),
        control,
        o.invalid ? jsx('FieldError', {}, meta.error) : '',
      ])
    : control
  const head = imports({
    '@hugeicons/react': o.icon ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': o.icon ? [meta.iconName] : [],
    '@/components/ui/field': o.label ? list('Field', o.invalid && 'FieldError', 'FieldLabel') : [],
    '@/components/ui/input': o.icon ? [] : ['Input'],
    '@/components/ui/input-group': o.icon ? ['InputGroup', 'InputGroupAddon', 'InputGroupInput'] : [],
  })
  return `${head}\n\n${body}`
}

const INPUT_TYPE_ROWS = ['text', 'email', 'password', 'number', 'search', 'file'] as const
const TYPE_SAMPLES: Record<(typeof INPUT_TYPE_ROWS)[number], { label: string; placeholder?: string }> = {
  text: { label: 'Project name', placeholder: 'Project name' },
  email: { label: 'Email', placeholder: 'name@example.com' },
  password: { label: 'Password', placeholder: 'Password' },
  number: { label: 'Seats', placeholder: '0' },
  search: { label: 'Search', placeholder: 'Search…' },
  file: { label: 'Attachment' },
}

function InputWithDescription() {
  const id = useId()
  return (
    <Field className="w-56">
      <FieldLabel htmlFor={id}>Workspace URL</FieldLabel>
      <Input id={id} defaultValue="my-team" aria-describedby={`${id}-hint`} />
      <FieldDescription id={`${id}-hint`}>Letters, numbers and dashes only.</FieldDescription>
    </Field>
  )
}

/* Textarea */

const TEXTAREA_ROWS = ['auto', '3', '5', '8'] as const

function CountedTextarea() {
  const id = useId()
  const [text, setText] = useState('')
  const max = 140
  return (
    <Field className="w-56">
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>Summary</FieldLabel>
        <span id={`${id}-count`} className="text-muted-foreground text-[11px] tabular-nums">
          {text.length}/{max}
        </span>
      </div>
      <Textarea
        id={id}
        value={text}
        maxLength={max}
        onChange={(e) => setText(e.target.value)}
        placeholder="One line about this change"
        aria-describedby={`${id}-count`}
      />
    </Field>
  )
}

/* Checkbox */

const TERMS = {
  id: 'terms',
  label: 'Accept terms and conditions',
  description: 'You agree to the terms of service and privacy policy.',
  error: 'Accept the terms to continue.',
}

type CheckboxOptions = { checked: boolean; label: boolean; description: boolean; disabled: boolean; invalid: boolean }

const checkboxOptions = (v: Values): CheckboxOptions => ({
  checked: bool(v, 'checked'),
  label: bool(v, 'label'),
  description: bool(v, 'description'),
  disabled: bool(v, 'disabled'),
  invalid: bool(v, 'invalid'),
})

function CheckboxPreview({ checked, label, description, disabled, invalid }: CheckboxOptions) {
  const id = useId()
  // The key remounts the box when the Checked control flips, so the
  // preview stays clickable (defaultChecked) and still follows the pane.
  const box = (
    <Checkbox
      key={String(checked)}
      id={id}
      defaultChecked={checked}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-label={label ? undefined : TERMS.label}
    />
  )
  if (!label) return box
  const text = <FieldLabel htmlFor={id}>{TERMS.label}</FieldLabel>
  return (
    <Field orientation="horizontal" data-invalid={invalid || undefined} data-disabled={disabled || undefined} className="max-w-72">
      {box}
      {description || invalid ? (
        <FieldContent>
          {text}
          {description && <FieldDescription>{TERMS.description}</FieldDescription>}
          {invalid && <FieldError>{TERMS.error}</FieldError>}
        </FieldContent>
      ) : text}
    </Field>
  )
}

function checkboxCode(o: CheckboxOptions) {
  const box = jsx('Checkbox', {
    id: o.label ? TERMS.id : undefined,
    defaultChecked: o.checked,
    disabled: o.disabled,
    'aria-invalid': o.invalid,
    'aria-label': o.label ? undefined : TERMS.label,
  })
  const content = o.description || o.invalid
  const label = jsx('FieldLabel', { htmlFor: TERMS.id }, TERMS.label)
  const body = o.label
    ? jsx('Field', { orientation: 'horizontal', 'data-invalid': o.invalid, 'data-disabled': o.disabled }, [
        box,
        content
          ? jsx('FieldContent', {}, [
              label,
              o.description ? jsx('FieldDescription', {}, TERMS.description) : '',
              o.invalid ? jsx('FieldError', {}, TERMS.error) : '',
            ])
          : label,
      ])
    : box
  const head = imports({
    '@/components/ui/checkbox': ['Checkbox'],
    '@/components/ui/field': o.label
      ? list('Field', content && 'FieldContent', o.description && 'FieldDescription', o.invalid && 'FieldError', 'FieldLabel')
      : [],
  })
  return `${head}\n\n${body}`
}

const NOTIFY_ABOUT = [
  { id: 'comments', label: 'Comments', checked: true },
  { id: 'mentions', label: 'Mentions', checked: true },
  { id: 'status', label: 'Status changes', checked: false },
]

function CheckboxList() {
  const id = useId()
  return (
    <FieldSet className="w-56">
      <FieldLegend variant="label">Notify me about</FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        {NOTIFY_ABOUT.map((n) => (
          <Field key={n.id} orientation="horizontal">
            <Checkbox id={`${id}-${n.id}`} defaultChecked={n.checked} />
            <FieldLabel htmlFor={`${id}-${n.id}`} className="font-normal">{n.label}</FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  )
}

function CheckboxCard() {
  const id = useId()
  return (
    <div className="w-64 max-w-full">
      <FieldLabel htmlFor={id}>
        <Field orientation="horizontal">
          <Checkbox id={id} defaultChecked />
          <FieldContent>
            <FieldTitle>Two-step sign-in</FieldTitle>
            <FieldDescription>Ask for a code from your phone each time you sign in.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </div>
  )
}

/* Switch */

const SWITCH_SIZES = ['sm', 'default'] as const
const SWITCH_STATES = ['off', 'on', 'disabled', 'disabled on', 'aria-invalid'] as const

const NOTIFY = {
  id: 'email-notifications',
  label: 'Email notifications',
  description: 'Get an email when someone mentions you.',
}

type SwitchOptions = { size: (typeof SWITCH_SIZES)[number]; checked: boolean; label: boolean; description: boolean; disabled: boolean }

const switchOptions = (v: Values): SwitchOptions => ({
  size: str(v, 'size') as SwitchOptions['size'],
  checked: bool(v, 'checked'),
  label: bool(v, 'label'),
  description: bool(v, 'description'),
  disabled: bool(v, 'disabled'),
})

function SwitchPreview({ size, checked, label, description, disabled }: SwitchOptions) {
  const id = useId()
  const control = (
    <Switch
      key={String(checked)}
      id={id}
      size={size}
      defaultChecked={checked}
      disabled={disabled}
      aria-label={label ? undefined : NOTIFY.label}
    />
  )
  if (!label) return control
  const text = <FieldLabel htmlFor={id}>{NOTIFY.label}</FieldLabel>
  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined} className="max-w-72">
      {description ? (
        <FieldContent>
          {text}
          <FieldDescription>{NOTIFY.description}</FieldDescription>
        </FieldContent>
      ) : text}
      {control}
    </Field>
  )
}

function switchCode(o: SwitchOptions) {
  const control = jsx('Switch', {
    id: o.label ? NOTIFY.id : undefined,
    size: orDefault(o.size),
    defaultChecked: o.checked,
    disabled: o.disabled,
    'aria-label': o.label ? undefined : NOTIFY.label,
  })
  const label = jsx('FieldLabel', { htmlFor: NOTIFY.id }, NOTIFY.label)
  const body = o.label
    ? jsx('Field', { orientation: 'horizontal', 'data-disabled': o.disabled }, [
        o.description ? jsx('FieldContent', {}, [label, jsx('FieldDescription', {}, NOTIFY.description)]) : label,
        control,
      ])
    : control
  const head = imports({
    '@/components/ui/field': o.label ? list('Field', o.description && 'FieldContent', o.description && 'FieldDescription', 'FieldLabel') : [],
    '@/components/ui/switch': ['Switch'],
  })
  return `${head}\n\n${body}`
}

const SETTINGS = [
  { id: 'mentions', label: 'Mentions', description: 'When someone @mentions you', checked: true },
  { id: 'assigned', label: 'Assigned to me', description: 'When an issue is assigned to you', checked: true },
  { id: 'digest', label: 'Weekly digest', description: 'A summary every Monday morning', checked: false },
]

function SwitchSettings() {
  const id = useId()
  return (
    <div className="w-72 max-w-full divide-y rounded-lg border">
      {SETTINGS.map((s) => (
        <Field key={s.id} orientation="horizontal" className="px-3 py-2.5">
          <FieldContent>
            <FieldLabel htmlFor={`${id}-${s.id}`}>{s.label}</FieldLabel>
            <FieldDescription>{s.description}</FieldDescription>
          </FieldContent>
          <Switch id={`${id}-${s.id}`} size="sm" defaultChecked={s.checked} />
        </Field>
      ))}
    </div>
  )
}

function SwitchWithLabel() {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} defaultChecked />
      <Label htmlFor={id} className="font-normal">Show completed</Label>
    </div>
  )
}

/* Radio group */

const ORIENTATIONS = ['vertical', 'horizontal'] as const

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

function RadioDemo({ orientation = 'vertical', disabled, disabledItem, invalid }: {
  orientation?: (typeof ORIENTATIONS)[number]
  disabled?: boolean
  disabledItem?: string
  invalid?: boolean
}) {
  const id = useId()
  // orientation only sets the arrow keys. The layout comes from the class.
  return (
    <RadioGroup
      defaultValue="medium"
      orientation={orientation}
      disabled={disabled}
      aria-label="Priority"
      className={orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'gap-2.5'}
    >
      {PRIORITIES.map((p) => (
        <div key={p.value} className="flex items-center gap-2">
          <RadioGroupItem
            value={p.value}
            id={`${id}-${p.value}`}
            disabled={disabledItem === p.value}
            aria-invalid={invalid || undefined}
          />
          <Label htmlFor={`${id}-${p.value}`} className="font-normal">{p.label}</Label>
        </div>
      ))}
    </RadioGroup>
  )
}

const BILLING = [
  { value: 'monthly', title: 'Monthly', description: '$12 per seat, billed each month' },
  { value: 'yearly', title: 'Yearly', description: '$10 per seat, billed once a year' },
]

function RadioCards() {
  const id = useId()
  return (
    <div className="w-72 max-w-full">
      <RadioGroup defaultValue="yearly" aria-label="Billing period" className="gap-2">
        {BILLING.map((b) => (
          <FieldLabel key={b.value} htmlFor={`${id}-${b.value}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{b.title}</FieldTitle>
                <FieldDescription>{b.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem value={b.value} id={`${id}-${b.value}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </div>
  )
}

/* Select */

const SELECT_SIZES = ['sm', 'default'] as const
const SELECT_POSITIONS = ['item-aligned', 'popper'] as const
const SELECT_STATES = ['placeholder', 'value', 'disabled', 'aria-invalid'] as const

const STATUSES = [
  { value: 'backlog', label: 'Backlog', icon: CircleDashedIcon, className: 'text-muted-foreground', open: true },
  { value: 'todo', label: 'Todo', icon: CircleIcon, className: 'text-status-todo', open: true },
  { value: 'in-progress', label: 'In progress', icon: TimeHalfPassIcon, className: 'text-status-progress', open: true },
  { value: 'done', label: 'Done', icon: CheckmarkCircle02Icon, className: 'text-status-done', open: false },
  { value: 'cancelled', label: 'Cancelled', icon: CancelCircleIcon, className: 'text-muted-foreground', open: false },
]
const OPEN = STATUSES.filter((s) => s.open)
const CLOSED = STATUSES.filter((s) => !s.open)

type SelectOptions = {
  size: (typeof SELECT_SIZES)[number]
  position: (typeof SELECT_POSITIONS)[number]
  placeholder: string
  value: boolean
  groups: boolean
  disabled: boolean
  invalid: boolean
}

const selectOptions = (v: Values): SelectOptions => ({
  size: str(v, 'size') as SelectOptions['size'],
  position: str(v, 'position') as SelectOptions['position'],
  placeholder: str(v, 'placeholder'),
  value: bool(v, 'value'),
  groups: bool(v, 'groups'),
  disabled: bool(v, 'disabled'),
  invalid: bool(v, 'invalid'),
})

const statusItems = (items: typeof STATUSES) => items.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)

function SelectPreview({ size, position, placeholder, value, groups, disabled, invalid }: SelectOptions) {
  return (
    <Select key={String(value)} defaultValue={value ? 'in-progress' : undefined} disabled={disabled}>
      <SelectTrigger size={size} className="w-40" aria-label="Status" aria-invalid={invalid || undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position={position}>
        {groups ? (
          <>
            <SelectGroup>
              <SelectLabel>Open</SelectLabel>
              {statusItems(OPEN)}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Closed</SelectLabel>
              {statusItems(CLOSED)}
            </SelectGroup>
          </>
        ) : (
          <SelectGroup>{statusItems(STATUSES)}</SelectGroup>
        )}
      </SelectContent>
    </Select>
  )
}

function selectCode(o: SelectOptions) {
  const item = (s: (typeof STATUSES)[number]) => jsx('SelectItem', { value: s.value }, s.label)
  const content = o.groups
    ? [
        jsx('SelectGroup', {}, [jsx('SelectLabel', {}, 'Open'), ...OPEN.map(item)]),
        '<SelectSeparator />',
        jsx('SelectGroup', {}, [jsx('SelectLabel', {}, 'Closed'), ...CLOSED.map(item)]),
      ]
    : [jsx('SelectGroup', {}, STATUSES.map(item))]
  const body = jsx('Select', { defaultValue: o.value ? 'in-progress' : undefined, disabled: o.disabled }, [
    jsx('SelectTrigger', { size: orDefault(o.size), className: 'w-40', 'aria-label': 'Status', 'aria-invalid': o.invalid },
      jsx('SelectValue', { placeholder: o.placeholder })),
    jsx('SelectContent', { position: o.position === 'item-aligned' ? undefined : o.position }, content),
  ])
  const head = imports({
    '@/components/ui/select': list(
      'Select', 'SelectContent', 'SelectGroup', 'SelectItem', o.groups && 'SelectLabel', o.groups && 'SelectSeparator',
      'SelectTrigger', 'SelectValue',
    ),
  })
  return `${head}\n\n${body}`
}

function StatusSelect({ size, state }: { size: (typeof SELECT_SIZES)[number]; state: (typeof SELECT_STATES)[number] }) {
  return (
    <Select defaultValue={state === 'placeholder' ? undefined : 'todo'} disabled={state === 'disabled'}>
      <SelectTrigger size={size} className="w-36" aria-label="Status" aria-invalid={state === 'aria-invalid' || undefined}>
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{statusItems(STATUSES)}</SelectGroup>
      </SelectContent>
    </Select>
  )
}

function SelectWithLabel() {
  const id = useId()
  return (
    <Field className="w-56">
      <FieldLabel htmlFor={id}>Default status</FieldLabel>
      <Select defaultValue="todo">
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>{statusItems(STATUSES)}</SelectGroup>
        </SelectContent>
      </Select>
      <FieldDescription>New issues start here.</FieldDescription>
    </Field>
  )
}

function SelectWithIcons({ disabledItem }: { disabledItem?: string }) {
  return (
    <Select defaultValue="in-progress">
      <SelectTrigger className="w-40" aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value} disabled={disabledItem === s.value}>
              <HugeiconsIcon icon={s.icon} strokeWidth={2} className={s.className} />
              {s.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/* Slider */

const SLIDER_MIN = ['0', '20'] as const
const SLIDER_MAX = ['50', '100', '200'] as const
const SLIDER_STEP = ['1', '5', '10', '25'] as const

type SliderOptions = { min: number; max: number; step: number; range: boolean; disabled: boolean }

const sliderOptions = (v: Values): SliderOptions => ({
  min: Number(str(v, 'min')),
  max: Number(str(v, 'max')),
  step: Number(str(v, 'step')),
  range: str(v, 'thumbs') === 'two',
  disabled: bool(v, 'disabled'),
})

// Starting values that sit on the step grid: the middle, or the quarters for a range.
function sliderStart({ min, max, step, range }: SliderOptions) {
  const snap = (n: number) => Math.min(max, min + Math.round((n - min) / step) * step)
  const span = max - min
  return range ? [snap(min + span * 0.25), snap(min + span * 0.75)] : [snap(min + span / 2)]
}

function SliderPreview(o: SliderOptions) {
  const [value, setValue] = useState(() => sliderStart(o))
  return (
    <div className="grid w-full max-w-64 gap-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium">{o.range ? 'Price range' : 'Seats'}</span>
        <span className="text-muted-foreground tabular-nums">{value.join(' – ')}</span>
      </div>
      <Slider value={value} onValueChange={setValue} min={o.min} max={o.max} step={o.step} disabled={o.disabled} />
    </div>
  )
}

function sliderCode(o: SliderOptions) {
  const body = withAttrs(
    jsx('Slider', {
      min: o.min === 0 ? undefined : o.min,
      max: o.max === 100 ? undefined : o.max,
      step: o.step === 1 ? undefined : o.step,
      disabled: o.disabled,
    }),
    [`defaultValue={[${sliderStart(o).join(', ')}]}`],
  )
  return `${imports({ '@/components/ui/slider': ['Slider'] })}\n\n${body}`
}

const MARKS = [0, 25, 50, 75, 100]

export default function FormsDemos() {
  return (
    <Demos>
      <Playground
        title="Input"
        description="type, label, icon and state"
        controls={[
          { kind: 'select', name: 'type', label: 'Type', options: INPUT_TYPES, initial: 'email' },
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'name@example.com' },
          { kind: 'switch', name: 'label', label: 'Label', initial: true },
          { kind: 'switch', name: 'icon', label: 'Leading icon', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
          { kind: 'switch', name: 'invalid', label: 'Invalid', initial: false },
        ]}
        render={(v) => <InputPreview {...inputOptions(v)} />}
        code={(v) => inputCode(inputOptions(v))}
      />

      <Variants
        title="Input types"
        rows={{ name: 'type', values: INPUT_TYPE_ROWS }}
        render={(type) => (
          <Input type={type} aria-label={TYPE_SAMPLES[type].label} placeholder={TYPE_SAMPLES[type].placeholder} className="w-56" />
        )}
      />

      <Gallery
        title="Input states"
        note="Focus with Tab to see the ring"
        items={[
          { label: 'placeholder', node: <Input aria-label="Email" placeholder="name@example.com" className="w-48" /> },
          { label: 'filled', node: <Input aria-label="Email" defaultValue="alex@example.com" className="w-48" /> },
          { label: 'disabled', node: <Input aria-label="Email" defaultValue="alex@example.com" disabled className="w-48" /> },
          { label: 'aria-invalid', node: <Input aria-label="Email" defaultValue="alex@example" aria-invalid className="w-48" /> },
          { label: 'with description', node: <InputWithDescription /> },
        ]}
      />

      <Variants
        title="Textarea rows"
        note="rows needs field-sizing-fixed, as the box grows with its text by default"
        rows={{ name: 'rows', values: TEXTAREA_ROWS }}
        render={(rows) => (
          <Textarea
            aria-label="Description"
            placeholder={rows === 'auto' ? 'Grows as you type' : `${rows} rows tall`}
            rows={rows === 'auto' ? undefined : Number(rows)}
            className={cn('w-64', rows !== 'auto' && 'field-sizing-fixed')}
          />
        )}
      />

      <Gallery
        title="Textarea states"
        items={[
          { label: 'placeholder', node: <Textarea aria-label="Description" placeholder="Add a description…" className="w-56" /> },
          {
            label: 'filled',
            node: (
              <Textarea
                aria-label="Description"
                defaultValue={'Steps to reproduce:\n1. Open workspace settings\n2. Rename the workspace\n3. Reload the page'}
                className="w-56"
              />
            ),
          },
          { label: 'disabled', node: <Textarea aria-label="Description" defaultValue="Locked while the cycle is closed." disabled className="w-56" /> },
          { label: 'aria-invalid', node: <Textarea aria-label="Description" placeholder="A description is required" aria-invalid className="w-56" /> },
          { label: 'with counter', node: <CountedTextarea /> },
        ]}
      />

      <Playground
        title="Checkbox"
        description="checked, label and state"
        controls={[
          { kind: 'switch', name: 'checked', label: 'Checked', initial: true },
          { kind: 'switch', name: 'label', label: 'Label', initial: true },
          { kind: 'switch', name: 'description', label: 'Description', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
          { kind: 'switch', name: 'invalid', label: 'Invalid', initial: false },
        ]}
        render={(v) => <CheckboxPreview {...checkboxOptions(v)} />}
        code={(v) => checkboxCode(checkboxOptions(v))}
      />

      <Variants
        title="Checkbox states"
        rows={{ name: 'checked', values: ['unchecked', 'checked'] as const }}
        cols={{ name: 'state', values: ['rest', 'disabled', 'aria-invalid'] as const }}
        render={(checked, state) => (
          <Checkbox
            defaultChecked={checked === 'checked'}
            disabled={state === 'disabled'}
            aria-invalid={state === 'aria-invalid' || undefined}
            aria-label={`${checked}, ${state}`}
          />
        )}
      />

      <Gallery
        title="Checkbox in use"
        items={[
          { label: 'fieldset', node: <CheckboxList /> },
          { label: 'choice card', node: <CheckboxCard /> },
        ]}
      />

      <Playground
        title="Switch"
        description="size, checked, label and state"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: SWITCH_SIZES, initial: 'default' },
          { kind: 'switch', name: 'checked', label: 'Checked', initial: true },
          { kind: 'switch', name: 'label', label: 'Label', initial: true },
          { kind: 'switch', name: 'description', label: 'Description', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => <SwitchPreview {...switchOptions(v)} />}
        code={(v) => switchCode(switchOptions(v))}
      />

      <Variants
        title="Switch variants"
        rows={{ name: 'size', values: SWITCH_SIZES }}
        cols={{ name: 'state', values: SWITCH_STATES }}
        render={(size, state) => (
          <Switch
            size={size}
            defaultChecked={state === 'on' || state === 'disabled on'}
            disabled={state === 'disabled' || state === 'disabled on'}
            aria-invalid={state === 'aria-invalid' || undefined}
            aria-label={`${size} switch, ${state}`}
          />
        )}
      />

      <Gallery
        title="Switch in use"
        items={[
          { label: 'settings list', node: <SwitchSettings /> },
          { label: 'label after', node: <SwitchWithLabel /> },
        ]}
      />

      <Variants
        title="Radio group orientation"
        note="orientation sets the arrow keys; className sets the layout"
        rows={{ name: 'orientation', values: ORIENTATIONS }}
        render={(orientation) => <RadioDemo orientation={orientation} />}
      />

      <Gallery
        title="Radio group states"
        items={[
          { label: 'disabled', node: <RadioDemo disabled /> },
          { label: 'one item disabled', node: <RadioDemo disabledItem="high" /> },
          { label: 'aria-invalid', node: <RadioDemo invalid /> },
          { label: 'choice cards', node: <RadioCards /> },
        ]}
      />

      <Playground
        title="Select"
        description="size, position, placeholder and state"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: SELECT_SIZES, initial: 'default' },
          { kind: 'select', name: 'position', label: 'Position', options: SELECT_POSITIONS, initial: 'item-aligned' },
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Select a status' },
          { kind: 'switch', name: 'value', label: 'Default value', initial: false },
          { kind: 'switch', name: 'groups', label: 'Groups', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
          { kind: 'switch', name: 'invalid', label: 'Invalid', initial: false },
        ]}
        render={(v) => <SelectPreview {...selectOptions(v)} />}
        code={(v) => selectCode(selectOptions(v))}
      />

      <Variants
        title="Select variants"
        rows={{ name: 'size', values: SELECT_SIZES }}
        cols={{ name: 'state', values: SELECT_STATES }}
        render={(size, state) => <StatusSelect size={size} state={state ?? 'placeholder'} />}
      />

      <Gallery
        title="Select in use"
        items={[
          { label: 'with label', node: <SelectWithLabel /> },
          { label: 'item icons', node: <SelectWithIcons /> },
          { label: 'disabled item', node: <SelectWithIcons disabledItem="cancelled" /> },
        ]}
      />

      <Playground
        title="Slider"
        description="min, max, step and thumbs"
        controls={[
          { kind: 'select', name: 'min', label: 'Min', options: SLIDER_MIN, initial: '0' },
          { kind: 'select', name: 'max', label: 'Max', options: SLIDER_MAX, initial: '100' },
          { kind: 'select', name: 'step', label: 'Step', options: SLIDER_STEP, initial: '1' },
          { kind: 'select', name: 'thumbs', label: 'Thumbs', options: ['one', 'two'], initial: 'one' },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const o = sliderOptions(v)
          // Remount when the range or step changes, so the value starts on the new grid.
          return <SliderPreview key={`${o.min}-${o.max}-${o.step}-${o.range}`} {...o} />
        }}
        code={(v) => sliderCode(sliderOptions(v))}
      />

      <Gallery
        title="Slider states"
        items={[
          { label: 'single', node: <Slider defaultValue={[40]} className="w-48" /> },
          { label: 'range', node: <Slider defaultValue={[20, 70]} className="w-48" /> },
          {
            label: 'step 25 with marks',
            node: (
              <div className="grid w-48 gap-2">
                <Slider defaultValue={[50]} step={25} />
                <div className="text-muted-foreground flex justify-between text-[11px] tabular-nums">
                  {MARKS.map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>
            ),
          },
          {
            label: 'vertical',
            node: (
              <div className="flex h-40 gap-6">
                <Slider orientation="vertical" defaultValue={[60]} />
                <Slider orientation="vertical" defaultValue={[30, 80]} />
              </div>
            ),
          },
          { label: 'disabled', node: <Slider defaultValue={[40]} disabled className="w-48" /> },
        ]}
      />
    </Demos>
  )
}
