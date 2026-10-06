import { Fragment, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { MOD, ariaKeyShortcuts, keyLabel } from '@/components/shortcut'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import {
  FormControl, TYPED, emptyValue, fieldError, overBy, useFieldErrors, type FieldErrors, type FormField, type FormValues,
} from '@/blocks/form-fields'

// The kit's create and edit dialogs, as blocks. Fields, values and what
// happens on submit all come in as props. The field schema and the field
// renderer are in form-fields.tsx, shared with the page-sized FormRenderer.
//
// FormDialog: a titled dialog of labelled fields built from a definition
// list. It checks required fields, email and number formats, length limits
// and rules of your own. An error shows once its field has been left with
// something in it, or after a submit, and the first bad field gets focus.
// An async onSubmit shows a spinner, Ctrl/⌘+Enter submits, and "Create
// more" keeps the dialog open for the next record.
//
// QuickCreateDialog: the borderless composer for fast entry: a large title,
// a description, and a row of property pills under them (PropertyPill,
// PropertyComboboxPill and PropertyMultiPill, below).
//
// Place either anywhere. Pass a `trigger` button and the dialog opens from
// it and hands focus back to it on close, or control `open` yourself.

// Tall dialogs scroll inside themselves, so they fit a 375px phone screen.
// Exported for hand-built dialogs that should match.
export const DIALOG_PANEL = 'flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0'
export const DIALOG_BODY = 'min-h-0 flex-1 overflow-y-auto p-4'

// One key cap ("⌘ ↵"), tinted to sit on the primary button.
const SHORTCUT = `${MOD} ${keyLabel('enter')}`
const SHORTCUT_ARIA = ariaKeyShortcuts(['mod', 'enter'])
const isSubmitKey = (e: KeyboardEvent) => e.key === 'Enter' && (e.ctrlKey || e.metaKey)

function useOpen(open: boolean | undefined, onOpenChange?: (open: boolean) => void) {
  const [own, setOwn] = useState(false)
  function setOpen(next: boolean) {
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }
  return [open ?? own, setOpen] as const
}

/* ---------- FormDialog ---------- */

export function FormDialog({
  open, onOpenChange, trigger, title, description, fields, initialValues, onSubmit,
  submitLabel = 'Save', pendingLabel = 'Saving…', cancelLabel = 'Cancel', createMore: offerCreateMore = false,
  shortcut = true, children, className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // A button that opens the dialog. Focus goes back to it on close.
  trigger?: ReactNode
  title: ReactNode
  description: ReactNode
  fields: FormField[]
  // Filled in each time the dialog opens. Fields left out start blank.
  initialValues?: FormValues
  // Gets the values, text trimmed. Return false to keep the dialog open.
  // Return a promise and the button shows a spinner until it settles.
  onSubmit: (values: FormValues, options: { createMore: boolean }) => void | boolean | Promise<void | boolean>
  submitLabel?: string
  pendingLabel?: string
  cancelLabel?: string
  // Offers "Create more": after a submit the dialog stays open for the next record.
  createMore?: boolean
  // Ctrl/⌘+Enter submits, with the hint on the button.
  shortcut?: boolean
  // More content under the fields. As a function it gets the current values,
  // for a control of your own that depends on them (a slot picker).
  children?: ReactNode | ((values: FormValues) => ReactNode)
  // On the dialog panel, for a width such as sm:max-w-lg.
  className?: string
}) {
  const uid = useId()
  const [isOpen, setOpen] = useOpen(open, onOpenChange)
  const start = (): FormValues => ({
    ...Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)])),
    ...initialValues,
  })
  const [values, setValues] = useState(start)
  const [pending, setPending] = useState(false)
  const [createMore, setCreateMore] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const all: FieldErrors<string> = {}
  for (const f of fields) all[f.key] = fieldError(f, values[f.key], values)
  const errors = useFieldErrors(all, fields.map((f) => f.key))

  // Fresh values on every open, set while rendering so the old ones never flash.
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setValues(start())
      errors.reset()
    }
  }

  function openChange(next: boolean) {
    if (!pending) setOpen(next)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pending || !errors.check()) return
    const clean = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]))
    let result = onSubmit(clean, { createMore })
    if (result instanceof Promise) {
      setPending(true)
      try {
        result = await result
      } finally {
        setPending(false)
      }
    }
    if (result === false) return
    if (!createMore) {
      setOpen(false)
      return
    }
    const fresh = start()
    setValues((v) => ({ ...v, ...Object.fromEntries(fields.filter((f) => TYPED.includes(f.type)).map((f) => [f.key, fresh[f.key]])) }))
    errors.reset()
    if (fields[0]) errors.focus(fields[0].key)
  }

  return (
    <Dialog open={isOpen} onOpenChange={openChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(DIALOG_PANEL, 'sm:max-w-md', className)}
        onKeyDown={(e) => {
          if (shortcut && isSubmitKey(e)) {
            e.preventDefault()
            formRef.current?.requestSubmit()
          }
        }}
      >
        <DialogHeader className="border-b px-4 py-3 pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className={DIALOG_BODY}>
            <FieldGroup>
              {fields.map((f) => (
                <FormControl
                  key={f.key}
                  field={f}
                  id={`${uid}-${f.key}`}
                  value={values[f.key]}
                  // A text that runs too long says so at once, not on leaving the field.
                  error={errors.shown[f.key] ?? (overBy(f, values[f.key]) > 0 ? all[f.key] : undefined)}
                  tooLong={overBy(f, values[f.key]) > 0}
                  inputRef={errors.register(f.key)}
                  onChange={(value) => setValues((v) => ({ ...v, [f.key]: value }))}
                  onBlur={(value) => errors.blur(f.key, value)}
                />
              ))}
              {typeof children === 'function' ? children(values) : children}
            </FieldGroup>
          </div>
          <DialogFooter className="border-t px-4 py-3">
            {offerCreateMore && (
              <Label className="text-muted-foreground justify-center font-normal sm:mr-auto">
                <Switch size="sm" checked={createMore} onCheckedChange={setCreateMore} />
                Create more
              </Label>
            )}
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>{cancelLabel}</Button>
            </DialogClose>
            <Button type="submit" aria-busy={pending || undefined} aria-keyshortcuts={shortcut ? SHORTCUT_ARIA : undefined}>
              {pending && <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />}
              {pending ? pendingLabel : submitLabel}
              {shortcut && <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1 hidden sm:inline-flex">{SHORTCUT}</Kbd>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Property pills ---------- */

export type PropertyOption<T extends string = string> = {
  value: T
  label: string
  // In the list. `pillIcon` replaces it on the pill itself, where it is smaller.
  icon?: ReactNode
  pillIcon?: ReactNode
}

const PILL = 'max-w-44 font-normal'

// A property pill whose picker is a short menu: status, priority, a due date.
export function PropertyPill<T extends string>({ label, value, options, onChange, unset, unsetIcon, className }: {
  label: string
  value: T
  options: PropertyOption<T>[]
  onChange: (value: T) => void
  // The value that means "not set": the pill then shows its own name, muted.
  unset?: T
  unsetIcon?: ReactNode
  className?: string
}) {
  const current = options.find((o) => o.value === value) ?? options[0]
  const isUnset = value === unset

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn(PILL, className)} aria-label={`${label}: ${current.label}`}>
          {isUnset && unsetIcon ? unsetIcon : current.pillIcon ?? current.icon}
          <span className={cn('truncate', isUnset && 'text-muted-foreground')}>{isUnset ? label : current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.icon} {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// A property pill with a searchable list, for one choice from many: an assignee, a customer.
export function PropertyComboboxPill({
  label, value, options, onChange, unset, unsetIcon, searchPlaceholder, emptyText = 'Nothing found.', className,
}: {
  label: string
  value: string
  options: PropertyOption[]
  onChange: (value: string) => void
  unset?: string
  unsetIcon?: ReactNode
  searchPlaceholder?: string
  emptyText?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const isUnset = value === unset

  function pick(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn(PILL, className)} aria-label={`${label}: ${current?.label ?? value}`}>
          {isUnset && unsetIcon ? unsetIcon : current?.pillIcon ?? current?.icon}
          <span className={cn('truncate', isUnset && 'text-muted-foreground')}>{isUnset ? label : current?.label ?? value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 gap-0 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} data-checked={value === o.value} onSelect={() => pick(o.value)}>
                  {o.icon}
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// A property pill with a searchable list that takes several choices: labels, tags.
// The pill shows the first three chosen icons and a count.
export function PropertyMultiPill({
  label, value, options, onChange, unsetIcon, plural, searchPlaceholder, emptyText = 'Nothing found.', className,
}: {
  label: string
  value: string[]
  options: PropertyOption[]
  // Kept in the options' order.
  onChange: (value: string[]) => void
  unsetIcon?: ReactNode
  // "3 labels". Defaults to the label in lower case.
  plural?: string
  searchPlaceholder?: string
  emptyText?: ReactNode
  className?: string
}) {
  const chosen = options.filter((o) => value.includes(o.value))
  const text = chosen.length === 0
    ? label
    : chosen.length === 1 ? chosen[0].label : `${chosen.length} ${plural ?? label.toLowerCase()}`

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    onChange(options.filter((o) => next.includes(o.value)).map((o) => o.value))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(PILL, className)}
          aria-label={`${label}: ${chosen.map((o) => o.label).join(', ') || 'none'}`}
        >
          {chosen.length ? (
            <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
              {chosen.slice(0, 3).map((o) => <Fragment key={o.value}>{o.pillIcon ?? o.icon}</Fragment>)}
            </span>
          ) : (
            unsetIcon
          )}
          <span className={cn('truncate', !chosen.length && 'text-muted-foreground')}>{text}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 gap-0 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} data-checked={value.includes(o.value)} onSelect={() => toggle(o.value)}>
                  {o.icon}
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- QuickCreateDialog ---------- */

export function QuickCreateDialog({
  open, onOpenChange, trigger, title, description, context, titleLabel = 'Title', titlePlaceholder = 'Title',
  requiredMessage = 'Enter a title.', descriptionLabel = 'Description', descriptionPlaceholder = 'Add description…',
  properties, footerStart, submitLabel = 'Create', createMore: offerCreateMore = false, onSubmit, className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  // The dialog's heading, such as "New issue".
  title: ReactNode
  // For screen readers: what is required, and the shortcut.
  description: string
  // Where the new item goes, shown as a chip before the heading.
  context?: { label: ReactNode; mark?: ReactNode }
  titleLabel?: string
  titlePlaceholder?: string
  requiredMessage?: string
  descriptionLabel?: string
  descriptionPlaceholder?: string
  // The row of property pills.
  properties?: ReactNode
  // The footer's left end: attach, templates…
  footerStart?: ReactNode
  submitLabel?: string
  createMore?: boolean
  // Gets the trimmed title and description; the title is never empty.
  // Return false to keep what was typed. The text clears after a create,
  // and stays while the dialog is only closed, like a draft.
  onSubmit: (value: { title: string; description: string }, options: { createMore: boolean }) => void | boolean
  className?: string
}) {
  const uid = useId()
  const [isOpen, setOpen] = useOpen(open, onOpenChange)
  const [titleText, setTitleText] = useState('')
  const [descriptionText, setDescriptionText] = useState('')
  const [createMore, setCreateMore] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const errorId = `${uid}-title-error`

  function change(next: boolean) {
    if (!next) setError('')
    setOpen(next)
  }

  function submit() {
    const text = titleText.trim()
    if (!text) {
      setError(requiredMessage)
      titleRef.current?.focus()
      return
    }
    if (onSubmit({ title: text, description: descriptionText.trim() }, { createMore }) === false) return
    setTitleText('')
    setDescriptionText('')
    if (createMore) titleRef.current?.focus()
    else setOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(DIALOG_PANEL, 'sm:max-w-2xl', className)}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          titleRef.current?.focus()
        }}
        onKeyDown={(e) => {
          if (isSubmitKey(e)) {
            e.preventDefault()
            submit()
          }
        }}
      >
        <DialogHeader className="min-h-6 flex-row items-center gap-1.5 px-3 pt-2 pr-10">
          {context && (
            <>
              <span className="bg-muted/60 inline-flex h-6 min-w-0 items-center gap-1.5 rounded-md border px-1.5 text-[11px] font-medium">
                {context.mark && (
                  <span
                    aria-hidden="true"
                    className="bg-brand text-primary-foreground grid size-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-semibold"
                  >
                    {context.mark}
                  </span>
                )}
                {context.label}
              </span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
            </>
          )}
          <DialogTitle className="text-xs">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3">
          <input
            ref={titleRef}
            aria-label={titleLabel}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder={titlePlaceholder}
            autoComplete="off"
            value={titleText}
            onChange={(e) => {
              setTitleText(e.target.value)
              if (error) setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                descriptionRef.current?.focus()
              }
            }}
            className="placeholder:text-muted-foreground/70 aria-invalid:placeholder:text-destructive/70 w-full min-w-0 bg-transparent text-lg font-semibold tracking-tight outline-none"
          />
          <FieldError id={errorId} className="mt-0.5">{error || undefined}</FieldError>
          <textarea
            ref={descriptionRef}
            aria-label={descriptionLabel}
            placeholder={descriptionPlaceholder}
            rows={3}
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            className="placeholder:text-muted-foreground/70 field-sizing-content mt-2 block min-h-20 w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
          />
        </div>

        {properties && <div className="flex flex-wrap gap-1.5 px-4 pb-3">{properties}</div>}

        <div className="flex items-center gap-2 border-t px-3 py-2.5">
          {footerStart}
          <div className="ml-auto flex items-center gap-3">
            {offerCreateMore && (
              <Label className="text-muted-foreground font-normal">
                <Switch size="sm" checked={createMore} onCheckedChange={setCreateMore} />
                Create more
              </Label>
            )}
            <Button onClick={submit} aria-keyshortcuts={SHORTCUT_ARIA}>
              {submitLabel}
              <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1 hidden sm:inline-flex">{SHORTCUT}</Kbd>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
