import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Camera01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { CHECK_OPTIONS, CheckItem, YES_NO_OPTIONS, type CheckOption } from '@/components/check-item'
import { FileChip } from '@/components/file-chip'
import { Rating } from '@/components/rating'
import { SignaturePad } from '@/components/signature-pad'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { plural } from '@/lib/text'

// The kit's field schema: one definition list describes a form, and one
// renderer draws each field, whether the form sits in a dialog (FormDialog),
// on a page (FormRenderer) or anywhere else. It knows the field kinds and
// how to check them, nothing about what the form is for.
//
// Kinds: text, email, number, date, select, radio, checkbox, textarea, and
// for forms filled in on the spot: check (one outcome of a few: Pass / Fail /
// N/A, with a note and photo on a fail), yes-no, rating (stars), photo (a
// picture attached from the camera or files) and signature (drawn).

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type FormOption = { value: string; label: string; icon?: ReactNode }

// A check's answer: the outcome chosen, and on a bad one a note and a photo.
export type CheckValue = { result: string; note?: string; photo?: string }
export type FormValue = string | boolean | CheckValue
export type FormValues = Record<string, FormValue>
export type FormFieldType =
  | 'text' | 'email' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea'
  | 'check' | 'yes-no' | 'rating' | 'photo' | 'signature'

export type FormField = {
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  // Muted text after the label, such as "Optional".
  hint?: ReactNode
  // Help under the field. An error takes its place.
  description?: ReactNode
  placeholder?: string
  // Select and radio.
  options?: FormOption[]
  // Radio: the grid the options sit in.
  optionsClassName?: string
  // Inside the input, at the start: an icon, or a short text such as "@".
  icon?: IconSvgElement
  prefix?: string
  // Textarea: a live counter, and an error once the text runs past it.
  maxLength?: number
  rows?: number
  autoComplete?: string
  // Replaces "Enter <label>." / "Choose <label>." for an empty required field.
  requiredMessage?: string
  // A rule of your own, after the built-in checks: return the error, or nothing.
  validate?: (value: FormValue, values: FormValues) => string | undefined
  // Check: the outcomes to choose from (Pass / Fail / N/A by default).
  checkOptions?: CheckOption[]
  // Check: ask for a note and a photo on an outcome with the danger tone (on by default)…
  noteOnFail?: boolean
  // …and refuse to submit without the note.
  noteRequired?: boolean
  notePlaceholder?: string
  // Rating: the number of stars (5), and a word per star.
  max?: number
  ratingLabels?: string[]
  // Photo: more than one.
  multiple?: boolean
}

export const isCheckValue = (value: FormValue | undefined): value is CheckValue => typeof value === 'object' && value !== null

// What a field holds before anyone touches it.
export function emptyValue(field: FormField): FormValue {
  if (field.type === 'checkbox') return false
  if (field.type === 'check' || field.type === 'yes-no') return { result: '' }
  return ''
}

// Fields that are typed, as against picked: "Create more" clears these.
export const TYPED: FormFieldType[] = ['text', 'email', 'number', 'textarea']

// The outcomes a check field offers.
export const optionsOf = (field: FormField): CheckOption[] =>
  field.type === 'yes-no' ? YES_NO_OPTIONS : field.checkOptions ?? CHECK_OPTIONS

// Whether the chosen outcome is the bad one (Fail, No): the note and photo show.
export function isBadOutcome(field: FormField, value: FormValue | undefined) {
  if (!isCheckValue(value) || !value.result) return false
  return optionsOf(field).find((o) => o.value === value.result)?.tone === 'danger'
}

// True once the field has an answer, for a form's progress.
export function isAnswered(field: FormField, value: FormValue | undefined) {
  if (value === undefined) return false
  if (typeof value === 'boolean') return value
  if (isCheckValue(value)) return value.result !== ''
  return value.trim() !== ''
}

// Photo values hold the file names, one per line.
export const photoNames = (value: string | undefined) => (value ? value.split('\n').filter(Boolean) : [])

export const overBy = (field: FormField, value: FormValue | undefined) =>
  field.maxLength && typeof value === 'string' ? value.length - field.maxLength : 0

export function fieldError(field: FormField, value: FormValue | undefined, values: FormValues): string | undefined {
  if (isCheckValue(value) || field.type === 'check' || field.type === 'yes-no') {
    const check = isCheckValue(value) ? value : { result: '' }
    if (!check.result) return field.required ? field.requiredMessage ?? `Answer "${field.label}".` : field.validate?.(check, values)
    if (field.noteRequired && field.noteOnFail !== false && isBadOutcome(field, check) && !check.note?.trim()) return 'Add a note about what is wrong.'
    return field.validate?.(check, values)
  }
  if (field.type === 'checkbox' || typeof value === 'boolean') return field.validate?.(value ?? false, values)
  const over = overBy(field, value)
  if (over > 0) return `That is ${plural(over, 'character')} too long.`
  const text = (value ?? '').trim()
  if (!text) {
    if (!field.required) return undefined
    if (field.type === 'rating') return field.requiredMessage ?? `Rate ${field.label.toLowerCase()}.`
    if (field.type === 'photo') return field.requiredMessage ?? 'Add a photo.'
    if (field.type === 'signature') return field.requiredMessage ?? 'Sign to continue.'
    const verb = field.type === 'select' || field.type === 'radio' ? 'Choose' : 'Enter'
    return field.requiredMessage ?? `${verb} ${field.label.toLowerCase()}.`
  }
  if (field.type === 'email' && !EMAIL_PATTERN.test(text)) return 'Enter an email like name@example.com.'
  if (field.type === 'number' && !Number.isFinite(Number(text))) return 'Enter a number.'
  return field.validate?.(value ?? '', values)
}

/* ---------- Errors ---------- */

export type FieldErrors<F extends string> = Partial<Record<F, string>>

// An error shows once its field has been left with something in it, or after
// a submit. From then on it follows the value as the person types. Also for
// hand-built forms: pass every field's current error, in focus order.
export function useFieldErrors<F extends string>(all: FieldErrors<F>, order: F[]) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const elements = useRef<Record<string, HTMLElement | null>>({})

  const shown: FieldErrors<F> = {}
  for (const field of order) if (submitted || touched[field]) shown[field] = all[field]

  return {
    shown,
    register: (field: F) => (el: HTMLElement | null) => {
      elements.current[field] = el
    },
    focus: (field: F) => elements.current[field]?.focus(),
    blur(field: F, value: string) {
      if (value.trim()) setTouched((t) => ({ ...t, [field]: true }))
    },
    // True when everything is valid. Otherwise the first bad field gets focus.
    check() {
      setSubmitted(true)
      const first = order.find((field) => all[field])
      if (first) elements.current[first]?.focus()
      return !first
    },
    reset() {
      setTouched({})
      setSubmitted(false)
    },
  }
}

/* ---------- One field ---------- */

export function FormControl({ field, id, value, error, tooLong = false, inputRef, onChange, onBlur }: {
  field: FormField
  id: string
  value: FormValue | undefined
  error?: string
  // A text past its maxLength: the counter turns red at once.
  tooLong?: boolean
  // Gets the field's control, for focusing the first bad field.
  inputRef: (el: HTMLElement | null) => void
  onChange: (value: FormValue) => void
  onBlur: (value: string) => void
}) {
  const errorId = `${id}-error`
  const helpId = `${id}-help`
  const text = typeof value === 'string' ? value : ''
  const invalid = error ? true : undefined
  const describedBy = error ? errorId : field.description ? helpId : undefined
  const message = error
    ? <FieldError id={errorId}>{error}</FieldError>
    : field.description && <FieldDescription id={helpId}>{field.description}</FieldDescription>
  const label = (
    <>
      {field.label}
      {field.hint && <>{' '}<span className="text-muted-foreground font-normal">{field.hint}</span></>}
    </>
  )

  if (field.type === 'check' || field.type === 'yes-no') {
    const check = isCheckValue(value) ? value : { result: '' }
    const askNote = field.noteOnFail !== false && isBadOutcome(field, check)
    return (
      <CheckItem
        id={id}
        label={label}
        description={field.description}
        required={field.required}
        options={optionsOf(field)}
        value={check.result}
        onChange={(result) => onChange({ ...check, result })}
        error={error}
        focusRef={inputRef}
      >
        {askNote && (
          <>
            <Textarea
              rows={2}
              value={check.note ?? ''}
              onChange={(e) => onChange({ ...check, note: e.target.value })}
              placeholder={field.notePlaceholder ?? 'What is wrong, and what did you do about it?'}
              aria-label={`Note on ${field.label}`}
              aria-invalid={invalid}
              className="max-h-32"
            />
            <PhotoPicker id={`${id}-photo`} value={check.photo} onChange={(photo) => onChange({ ...check, photo })} />
          </>
        )}
      </CheckItem>
    )
  }

  if (field.type === 'rating') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Rating
          id={id}
          value={Number(text) || 0}
          onChange={(n) => onChange(n ? String(n) : '')}
          max={field.max}
          labels={field.ratingLabels}
          label={field.label}
          focusRef={inputRef}
        />
        {message}
      </Field>
    )
  }

  if (field.type === 'photo') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <PhotoPicker id={id} value={text} onChange={onChange} multiple={field.multiple} buttonRef={inputRef} />
        {message}
      </Field>
    )
  }

  if (field.type === 'signature') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div ref={inputRef} tabIndex={-1} className="rounded-lg outline-none">
          <SignaturePad id={id} value={text} onChange={onChange} label={field.label} error={!!error} />
        </div>
        {message}
      </Field>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <Field orientation="horizontal" data-invalid={!!error}>
        <Checkbox
          id={id}
          ref={inputRef}
          checked={value === true}
          onCheckedChange={(v) => onChange(v === true)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
        <FieldContent>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {message}
        </FieldContent>
      </Field>
    )
  }

  if (field.type === 'radio') {
    return (
      <FieldSet className="min-w-0">
        <FieldLegend variant="label">{label}</FieldLegend>
        {!error && field.description && <FieldDescription id={helpId}>{field.description}</FieldDescription>}
        <RadioGroup
          value={text}
          onValueChange={onChange}
          aria-describedby={describedBy}
          className={cn('grid grid-cols-2 gap-2 @sm:grid-cols-4', field.optionsClassName)}
        >
          {field.options?.map((o, i) => (
            <FieldLabel key={o.value} htmlFor={`${id}-${i}`}>
              <Field orientation="horizontal" className="gap-2">
                <RadioGroupItem value={o.value} id={`${id}-${i}`} ref={i === 0 ? inputRef : undefined} aria-invalid={invalid} />
                <FieldTitle className="tabular-nums">{o.icon}{o.label}</FieldTitle>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </FieldSet>
    )
  }

  if (field.type === 'select') {
    return (
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Select value={text} onValueChange={onChange}>
          <SelectTrigger id={id} ref={inputRef} className="w-full" aria-invalid={invalid} aria-describedby={describedBy}>
            <SelectValue placeholder={field.placeholder ?? `Choose ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.icon}{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {message}
      </Field>
    )
  }

  if (field.type === 'textarea') {
    const countId = `${id}-count`
    const textarea = (
      <Textarea
        id={id}
        ref={inputRef}
        rows={field.rows ?? 3}
        placeholder={field.placeholder}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={[field.maxLength ? countId : undefined, describedBy].filter(Boolean).join(' ') || undefined}
        className="max-h-40"
      />
    )
    return (
      <Field data-invalid={!!error}>
        {field.maxLength ? (
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <span id={countId} className={cn('text-[11px] tabular-nums', tooLong ? 'text-destructive' : 'text-muted-foreground')}>
              {text.length}/{field.maxLength}
            </span>
          </div>
        ) : (
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
        )}
        {textarea}
        {message}
      </Field>
    )
  }

  const email = field.type === 'email'
  const input = {
    id,
    ref: inputRef,
    // A number field stays a text box, so it takes "12.50" without spinner arrows.
    type: field.type === 'number' ? 'text' : field.type,
    inputMode: email ? 'email' as const : field.type === 'number' ? 'decimal' as const : undefined,
    autoComplete: field.autoComplete ?? (email ? 'email' : undefined),
    spellCheck: email ? false : undefined,
    placeholder: field.placeholder,
    value: text,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    onBlur: (e: { target: { value: string } }) => onBlur(e.target.value),
    'aria-invalid': invalid,
    'aria-describedby': describedBy,
  }
  const dateClass = field.type === 'date' ? 'dark:[color-scheme:dark]' : undefined

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {field.icon || field.prefix ? (
        <InputGroup>
          <InputGroupAddon>
            {field.icon ? <HugeiconsIcon icon={field.icon} strokeWidth={2} /> : <InputGroupText>{field.prefix}</InputGroupText>}
          </InputGroupAddon>
          <InputGroupInput {...input} className={dateClass} />
        </InputGroup>
      ) : (
        <Input {...input} className={dateClass} />
      )}
      {message}
    </Field>
  )
}

// A photo from the camera or the files, kept by name (nothing is uploaded
// here: the app decides what to do with the file). Each picked photo is a
// file chip that can be taken off again.
function PhotoPicker({ id, value, onChange, multiple = false, buttonRef, label = 'Add photo' }: {
  id: string
  value: string | undefined
  onChange: (value: string) => void
  multiple?: boolean
  buttonRef?: (el: HTMLElement | null) => void
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const names = photoNames(value)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {names.map((n) => (
        <FileChip key={n} name={n} onRemove={() => onChange(names.filter((x) => x !== n).join('\n'))} />
      ))}
      {(multiple || !names.length) && (
        <>
          <Button type="button" variant="outline" size="sm" ref={buttonRef} onClick={() => input.current?.click()}>
            <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} data-icon="inline-start" /> {label}
          </Button>
          <input
            ref={input}
            id={id}
            type="file"
            accept="image/*"
            multiple={multiple}
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).map((f) => f.name).filter((n) => !names.includes(n))
              onChange([...names, ...picked].join('\n'))
              e.target.value = ''
            }}
          />
        </>
      )}
    </div>
  )
}
