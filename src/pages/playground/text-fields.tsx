import { useId, useState, Fragment } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowUp02Icon, Attachment01Icon, Cancel01Icon, Copy01Icon, HashtagIcon, LockPasswordIcon, Mail01Icon,
  Search01Icon, Tick02Icon, UserIcon, ViewIcon, ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp'
import { toast } from 'sonner'
import { copyText, useCopied } from '@/lib/clipboard'
import { CommentBox } from '@/components/comment-box'
import { IconAction } from '@/components/icon-action'
import { SearchField } from '@/components/search-field'
import { Shortcut } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton, InputGroupText, InputGroupTextarea,
} from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values, component, element, lit,
} from './Playground'

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

const list = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

// jsx() only writes strings and numbers. This puts raw props (arrays,
// imported constants) first in the snippet's opening tag.
const withAttrs = (snippet: string, attrs: (string | false)[]) =>
  snippet.replace(/^<[\w.]+/, (tag) => [tag, ...attrs.filter(Boolean)].join(' '))

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
  const [copied, flagCopied] = useCopied()

  // The tick says it worked, so only a failure toasts.
  async function copy() {
    if (await copyText(link, { success: false })) flagCopied()
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

/* Search field */

// The hint shown while the field is empty: the key that focuses it.
const SF_ENDS = {
  none: undefined,
  '/': ['/'],
  'mod K': ['mod', 'K'],
} satisfies Record<string, string[] | undefined>

const SF_WIDTHS = ['w-48', 'w-60', 'w-80'] as const

type SearchEnd = keyof typeof SF_ENDS

function SearchFieldDemo({ initial = '', placeholder = 'Search issues…', end, className = 'w-60' }: {
  initial?: string
  placeholder?: string
  end?: string[]
  className?: string
}) {
  const [query, setQuery] = useState(initial)
  return (
    <SearchField
      value={query}
      onChange={setQuery}
      placeholder={placeholder}
      end={end && <Shortcut keys={end} />}
      className={cn('max-w-full', className)}
    />
  )
}

function searchFieldCode(v: Values) {
  const end = SF_ENDS[str(v, 'end') as SearchEnd]
  const head = imports({
    react: ['useState'],
    '@/components/search-field': ['SearchField'],
    '@/components/shortcut': end ? ['Shortcut'] : [],
  })
  const body = element('SearchField', [
    'value={query}',
    'onChange={setQuery}',
    `placeholder="${str(v, 'placeholder') || 'Search…'}"`,
    end && `end={<Shortcut keys={${lit(end)}} />}`,
    `className="${str(v, 'width')}"`,
  ])
  return `${head}\n\n${component('IssueSearch', ["const [query, setQuery] = useState('')"], body)}`
}

/* Comment box */

const CB_LABELS = ['Comment', 'Reply', 'Send'] as const

const postComment = (text: string) => toast.success('Comment posted', { description: `Demo only. “${text}”` })

const attachFile = () => toast('Attach a file', { description: 'Demo only. This would open the file picker.' })

function commentBoxCode(v: Values) {
  const actions = bool(v, 'actions')
  const placeholder = str(v, 'placeholder')
  const head = imports({
    '@hugeicons/core-free-icons': actions ? ['Attachment01Icon'] : [],
    '@/components/comment-box': ['CommentBox'],
    '@/components/icon-action': actions ? ['IconAction'] : [],
  })
  const body = element('CommentBox', [
    'onComment={(text) => addComment(text)}',
    placeholder && placeholder !== 'Leave a comment…' && `placeholder="${placeholder}"`,
    str(v, 'label') !== 'Comment' && `label="${str(v, 'label')}"`,
    actions && 'actions={<IconAction label="Attach a file" icon={Attachment01Icon} onClick={attach} />}',
  ])
  return `${head}\n\n${body}`
}

export default function TextFieldsDemos() {
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

      <Playground
        title="SearchField"
        description="Type to see the clear button take the hint's place"
        controls={[
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Search issues…' },
          { kind: 'select', name: 'end', label: 'Hint (end)', options: Object.keys(SF_ENDS), initial: '/' },
          { kind: 'select', name: 'width', label: 'Width (className)', options: SF_WIDTHS, initial: 'w-60' },
        ]}
        render={(v) => (
          <SearchFieldDemo
            placeholder={str(v, 'placeholder') || 'Search…'}
            end={SF_ENDS[str(v, 'end') as SearchEnd]}
            className={str(v, 'width')}
          />
        )}
        code={searchFieldCode}
      />

      <Gallery
        title="SearchField in use"
        note="From @/components/search-field"
        items={[
          { label: 'empty, with a hint', node: <SearchFieldDemo end={['/']} /> },
          { label: 'filled: clear button', node: <SearchFieldDemo initial="billing" end={['/']} /> },
          {
            label: 'h-8, in a toolbar',
            node: (
              <div className="flex items-center gap-1.5">
                <SearchFieldDemo placeholder="Search customers…" className="h-8 w-52" />
                <Button variant="outline" size="sm">Filter</Button>
              </div>
            ),
          },
          { label: 'narrow', node: <SearchFieldDemo placeholder="Search members by name or email…" className="w-44" /> },
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
        title="CommentBox"
        description="Grows as you type. Ctrl or ⌘ + Enter sends."
        controls={[
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Leave a comment…' },
          { kind: 'select', name: 'label', label: 'Label (button and name)', options: CB_LABELS, initial: 'Comment' },
          { kind: 'switch', name: 'actions', label: 'Attach action', initial: true },
        ]}
        render={(v) => (
          <div className="w-full max-w-md">
            <CommentBox
              onComment={postComment}
              placeholder={str(v, 'placeholder') || undefined}
              label={str(v, 'label')}
              actions={bool(v, 'actions') && <IconAction label="Attach a file" icon={Attachment01Icon} onClick={attachFile} />}
            />
          </div>
        )}
        code={commentBoxCode}
      />
    </Demos>
  )
}
