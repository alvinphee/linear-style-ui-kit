import { useId } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CancelCircleIcon, CheckmarkCircle02Icon, CircleDashedIcon, CircleIcon, TimeHalfPassIcon,
} from '@hugeicons/core-free-icons'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

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

export default function SelectDemos() {
  return (
    <Demos>
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
    </Demos>
  )
}
