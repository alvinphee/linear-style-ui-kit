import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

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

export default function SelectionControlsDemos() {
  return (
    <Demos>
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
    </Demos>
  )
}
