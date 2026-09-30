import {
  useEffect, useId, useRef, useState, type ClipboardEvent, type Dispatch, type FormEvent, type ReactNode,
  type RefObject, type SetStateAction,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Attachment01Icon, Building03Icon, Calendar03Icon,
  CalendarRemove01Icon, Camera01Icon, Cancel01Icon, Copy01Icon, Delete02Icon, InformationCircleIcon,
  Mail01Icon, MailAdd01Icon, SentIcon, Tag01Icon, Tick02Icon, UserAdd01Icon, UserCircleIcon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator,
  FieldSet, FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DUE_OPTIONS, LABELS, PEOPLE, PRIORITY, STATUS, type Job, type Priority, type Status } from '../data'
import { useJobs } from '../jobs-store'
import { goTo } from '../nav'
import { Panel, Row, Section } from './shared'
import { Initials, PriorityIcon, StatusIcon } from './StatusSection'

export default function FormModalsSection() {
  return (
    <Section id="form-modals" title="Form modals" description="Dialogs and sheets with real validation">
      <QuickCreatePanel />
      <AddCustomerPanel />
      <EditProfilePanel />
      <WizardPanel />
      <InvitePanel />
      <DeleteWorkspacePanel />
    </Section>
  )
}

/* ---------- Shared bits ---------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WORKSPACE = 'acme-studio'

// Tall modals scroll inside themselves, so they fit a 375px phone screen.
const MODAL = 'flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0'
const BODY = 'min-h-0 flex-1 overflow-y-auto p-4'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function emailError(value: string) {
  const email = value.trim()
  if (!email) return 'Enter an email address.'
  if (!EMAIL.test(email)) return 'Enter an email like name@example.com.'
  return undefined
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground mb-3 text-xs leading-relaxed">{children}</p>
}

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-muted text-foreground rounded px-1 py-px font-mono text-[11px]">{children}</code>
}

type Errors<F extends string> = Partial<Record<F, string>>

// An error shows once its field has been left with something in it, or after
// a submit. From then on it follows the value as the person types.
function useFieldErrors<F extends string>(all: Errors<F>, order: F[]) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const elements = useRef<Record<string, HTMLElement | null>>({})

  const shown: Errors<F> = {}
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

/* ---------- 1. Quick create ---------- */

type Draft = {
  title: string
  description: string
  status: Status
  priority: Priority
  driver: string
  labels: string[]
  due: string
}

const EMPTY_DRAFT: Draft = { title: '', description: '', status: 'todo', priority: 'none', driver: '', labels: [], due: '' }
const PILL = 'max-w-44 font-normal'
const NO_DUE = 'none'

const STATUS_OPTIONS = (Object.keys(STATUS) as Status[]).map((s) => ({
  value: s, label: STATUS[s].label, icon: <StatusIcon status={s} />,
}))
const PRIORITY_OPTIONS = (Object.keys(PRIORITY) as Priority[]).map((p) => ({
  value: p, label: PRIORITY[p].label, icon: <PriorityIcon priority={p} />,
}))
const CALENDAR_ICON = <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
const DUE_MENU = [
  ...DUE_OPTIONS.map((d) => ({ value: d, label: d, icon: CALENDAR_ICON })),
  {
    value: NO_DUE, label: 'No due date',
    icon: <HugeiconsIcon icon={CalendarRemove01Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />,
  },
]

function QuickCreatePanel() {
  const { jobs, select } = useJobs()
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<string[]>([])
  const recent = created.map((id) => jobs.find((j) => j.id === id)).filter((j): j is Job => !!j)

  return (
    <Panel title="Quick create" note="Linear-style new job dialog" wide>
      <Intro>
        A borderless title and description, property pills that each open their own picker, and Create
        more for entering several jobs in a row. New jobs go straight into the list, the board and the
        issue page.
      </Intro>
      <Row>
        <QuickCreateDialog
          open={open}
          onOpenChange={setOpen}
          onCreated={(job) => setCreated((ids) => [job.id, ...ids].slice(0, 3))}
          trigger={
            <Button variant="outline">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              New job
            </Button>
          }
        />
        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          Create with
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>
        </span>
      </Row>
      {recent.length > 0 && (
        <ul aria-label="Created here" className="mt-3 divide-y rounded-md border">
          {recent.map((job) => (
            <li key={job.id} className="flex min-w-0 items-center gap-2 py-1 pr-1 pl-2.5 text-xs">
              <StatusIcon status={job.status} />
              <span className="text-muted-foreground shrink-0 tabular-nums">{job.id}</span>
              <span className="min-w-0 flex-1 truncate">{job.title}</span>
              <Button
                variant="ghost"
                size="xs"
                aria-label={`Open ${job.id}`}
                onClick={() => {
                  select(job.id)
                  goTo('issue')
                }}
              >
                Open
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

// Exported so the page's C shortcut can open it too. Pass a trigger when
// there is a button, so focus goes back to it on close.
export function QuickCreateDialog({ open, onOpenChange, onCreated, trigger }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (job: Job) => void
  trigger?: ReactNode
}) {
  const { addJob, updateJob, select } = useJobs()
  const uid = useId()
  // Kept when the dialog is dismissed, like a draft, and cleared on create.
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [createMore, setCreateMore] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const errorId = `${uid}-title-error`

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function change(next: boolean) {
    if (!next) setError('')
    onOpenChange(next)
  }

  function submit() {
    const title = draft.title.trim()
    if (!title) {
      setError('A job needs a title.')
      titleRef.current?.focus()
      return
    }
    const job = addJob(draft.status, title)
    const { priority, driver, labels, due } = draft
    updateJob(job.id, { priority, driver, labels, due, description: draft.description.trim() })
    onCreated?.(job)
    toast.success(`Created ${job.id}`, {
      description: title,
      action: {
        label: 'Open',
        onClick: () => {
          onOpenChange(false)
          select(job.id)
          goTo('issue')
        },
      },
    })
    if (createMore) {
      setDraft((d) => ({ ...d, title: '', description: '' }))
      titleRef.current?.focus()
    } else {
      setDraft(EMPTY_DRAFT)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(MODAL, 'sm:max-w-2xl')}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          titleRef.current?.focus()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            submit()
          }
        }}
      >
        <DialogHeader className="min-h-6 flex-row items-center gap-1.5 px-3 pt-2 pr-10">
          <span className="bg-muted/60 inline-flex h-6 min-w-0 items-center gap-1.5 rounded-md border px-1.5 text-[11px] font-medium">
            <span
              aria-hidden="true"
              className="bg-brand text-primary-foreground grid size-4 shrink-0 place-items-center rounded-[4px] text-[8px] font-semibold"
            >
              OP
            </span>
            Operations
          </span>
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
          <DialogTitle className="text-xs">New job</DialogTitle>
          <DialogDescription className="sr-only">
            A title is required. Everything else is optional. Press Control Enter to create the job.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3">
          <input
            ref={titleRef}
            aria-label="Job title"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder="Job title"
            autoComplete="off"
            value={draft.title}
            onChange={(e) => {
              set('title', e.target.value)
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
            aria-label="Description"
            placeholder="Add description…"
            rows={3}
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            className="placeholder:text-muted-foreground/70 field-sizing-content mt-2 block min-h-20 w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          <MenuPill label="Status" value={draft.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} />
          <MenuPill
            label="Priority"
            value={draft.priority}
            unset="none"
            options={PRIORITY_OPTIONS}
            onChange={(v) => set('priority', v)}
          />
          <AssigneePill value={draft.driver} onChange={(v) => set('driver', v)} />
          <LabelsPill value={draft.labels} onChange={(v) => set('labels', v)} />
          <MenuPill
            label="Due date"
            value={draft.due || NO_DUE}
            unset={NO_DUE}
            unsetIcon={CALENDAR_ICON}
            options={DUE_MENU}
            onChange={(v) => set('due', v === NO_DUE ? '' : v)}
          />
        </div>

        <div className="flex items-center gap-2 border-t px-3 py-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Attach a file"
                className="text-muted-foreground"
                onClick={() => toast('Attach a file', { description: 'Demo only. Nothing is uploaded.' })}
              >
                <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach a file</TooltipContent>
          </Tooltip>
          <div className="ml-auto flex items-center gap-3">
            <Label className="text-muted-foreground font-normal">
              <Switch size="sm" checked={createMore} onCheckedChange={setCreateMore} />
              Create more
            </Label>
            <Button onClick={submit} aria-keyshortcuts="Control+Enter">
              Create job
              <Kbd className="bg-primary-foreground/15 text-primary-foreground ml-1 hidden sm:inline-flex">Ctrl ↵</Kbd>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MenuPill<T extends string>({ label, value, options, onChange, unset, unsetIcon }: {
  label: string
  value: T
  options: { value: T; label: string; icon: ReactNode }[]
  onChange: (value: T) => void
  // The value that means "not set": the pill then shows its own name, muted.
  unset?: T
  unsetIcon?: ReactNode
}) {
  const current = options.find((o) => o.value === value) ?? options[0]
  const isUnset = value === unset

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={PILL} aria-label={`${label}: ${current.label}`}>
          {isUnset && unsetIcon ? unsetIcon : current.icon}
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

function AssigneePill({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)

  function pick(person: string) {
    onChange(person)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={PILL} aria-label={`Assignee: ${value || 'Unassigned'}`}>
          {value ? (
            <Initials name={value} className="size-4" />
          ) : (
            <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
          )}
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Assignee'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Assign to…" />
          <CommandList>
            <CommandEmpty>No one found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Unassigned" data-checked={!value} onSelect={() => pick('')}>
                <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} className="text-muted-foreground size-4" />
                Unassigned
              </CommandItem>
              {PEOPLE.map((person) => (
                <CommandItem key={person} value={person} data-checked={value === person} onSelect={() => pick(person)}>
                  <Initials name={person} className="size-5" />
                  {person}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function LabelsPill({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const chosen = LABELS.filter((l) => value.includes(l.id))
  const text = chosen.length === 0 ? 'Labels' : chosen.length === 1 ? chosen[0].name : `${chosen.length} labels`

  function toggle(id: string) {
    const next = value.includes(id) ? value.filter((l) => l !== id) : [...value, id]
    onChange(LABELS.filter((l) => next.includes(l.id)).map((l) => l.id))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={PILL}
          aria-label={`Labels: ${chosen.map((l) => l.name).join(', ') || 'none'}`}
        >
          {chosen.length ? (
            <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
              {chosen.slice(0, 3).map((l) => (
                <span key={l.id} className="size-2 rounded-full" style={{ backgroundColor: l.colour }} />
              ))}
            </span>
          ) : (
            <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
          )}
          <span className={cn('truncate', !chosen.length && 'text-muted-foreground')}>{text}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Add labels…" />
          <CommandList>
            <CommandEmpty>No labels found.</CommandEmpty>
            <CommandGroup>
              {LABELS.map((label) => (
                <CommandItem
                  key={label.id}
                  value={label.name}
                  data-checked={value.includes(label.id)}
                  onSelect={() => toggle(label.id)}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: label.colour }} />
                  {label.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- 2. Validated form dialog ---------- */

type Customer = { name: string; email: string; size: string; plan: string; welcome: boolean; notes: string }

const NEW_CUSTOMER: Customer = { name: '', email: '', size: '11-50', plan: 'team', welcome: true, notes: '' }
const NOTES_MAX = 200
const SIZES = [
  { id: '1-10', label: '1–10' },
  { id: '11-50', label: '11–50' },
  { id: '51-200', label: '51–200' },
  { id: '200+', label: '200+' },
]
const PLANS = [
  { id: 'free', label: 'Free' },
  { id: 'team', label: 'Team' },
  { id: 'business', label: 'Business' },
  { id: 'enterprise', label: 'Enterprise' },
]

function AddCustomerPanel() {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(NEW_CUSTOMER)
  const [saving, setSaving] = useState(false)
  const over = values.notes.length - NOTES_MAX
  const notesError = over > 0 ? `That is ${over} ${over === 1 ? 'character' : 'characters'} too long.` : undefined
  const errors = useFieldErrors<'name' | 'email' | 'notes'>({
    name: values.name.trim() ? undefined : 'Enter the customer’s name.',
    email: emailError(values.email),
    notes: notesError,
  }, ['name', 'email', 'notes'])
  const { shown } = errors
  const id = (field: string) => `${uid}-${field}`

  function change<K extends keyof Customer>(key: K, value: Customer[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function openChange(next: boolean) {
    if (saving) return
    if (next) {
      setValues(NEW_CUSTOMER)
      errors.reset()
    }
    setOpen(next)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (saving || !errors.check()) return
    setSaving(true)
    await wait(800)
    setSaving(false)
    setOpen(false)
    toast.success('Customer added', { description: `Demo only. ${values.name.trim()} was not saved.` })
  }

  return (
    <Panel title="Validated form" note="Dialog, Field and FieldError">
      <Intro>
        Name and email are required, and the email is checked for format. Errors show when you leave a
        field or submit, and the first problem gets focus. Saving takes 800 ms.
      </Intro>
      <Dialog open={open} onOpenChange={openChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
        </DialogTrigger>
        <DialogContent className={cn(MODAL, 'sm:max-w-md')}>
          <DialogHeader className="border-b px-4 py-3 pr-10">
            <DialogTitle>Add customer</DialogTitle>
            <DialogDescription>They can then be picked on any job.</DialogDescription>
          </DialogHeader>
          <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className={BODY}>
              <FieldGroup>
                <Field data-invalid={!!shown.name}>
                  <FieldLabel htmlFor={id('name')}>Name</FieldLabel>
                  <Input
                    id={id('name')}
                    ref={errors.register('name')}
                    autoComplete="organization"
                    placeholder="Harbour Foods"
                    value={values.name}
                    onChange={(e) => change('name', e.target.value)}
                    onBlur={(e) => errors.blur('name', e.target.value)}
                    aria-invalid={shown.name ? true : undefined}
                    aria-describedby={shown.name ? id('name-error') : undefined}
                  />
                  <FieldError id={id('name-error')}>{shown.name}</FieldError>
                </Field>

                <Field data-invalid={!!shown.email}>
                  <FieldLabel htmlFor={id('email')}>Email</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>
                      <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
                    </InputGroupAddon>
                    <InputGroupInput
                      id={id('email')}
                      ref={errors.register('email')}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="name@example.com"
                      value={values.email}
                      onChange={(e) => change('email', e.target.value)}
                      onBlur={(e) => errors.blur('email', e.target.value)}
                      aria-invalid={shown.email ? true : undefined}
                      aria-describedby={shown.email ? id('email-error') : undefined}
                    />
                  </InputGroup>
                  <FieldError id={id('email-error')}>{shown.email}</FieldError>
                </Field>

                <FieldSet className="min-w-0">
                  <FieldLegend variant="label">Company size</FieldLegend>
                  <RadioGroup
                    value={values.size}
                    onValueChange={(v) => change('size', v)}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    {SIZES.map((s) => (
                      <FieldLabel key={s.id} htmlFor={id(`size-${s.id}`)}>
                        <Field orientation="horizontal" className="gap-2">
                          <RadioGroupItem value={s.id} id={id(`size-${s.id}`)} />
                          <FieldTitle className="tabular-nums">{s.label}</FieldTitle>
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                </FieldSet>

                <Field>
                  <FieldLabel htmlFor={id('plan')}>Plan</FieldLabel>
                  <Select value={values.plan} onValueChange={(v) => change('plan', v)}>
                    <SelectTrigger id={id('plan')} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>You can change the plan at any time.</FieldDescription>
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    id={id('welcome')}
                    checked={values.welcome}
                    onCheckedChange={(v) => change('welcome', v === true)}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={id('welcome')}>Send welcome email</FieldLabel>
                    <FieldDescription>With a link to the customer portal.</FieldDescription>
                  </FieldContent>
                </Field>

                <Field data-invalid={!!notesError}>
                  <div className="flex items-baseline justify-between gap-2">
                    <FieldLabel htmlFor={id('notes')}>
                      Notes <span className="text-muted-foreground font-normal">Optional</span>
                    </FieldLabel>
                    <span
                      id={id('notes-count')}
                      className={cn('text-[11px] tabular-nums', notesError ? 'text-destructive' : 'text-muted-foreground')}
                    >
                      {values.notes.length}/{NOTES_MAX}
                    </span>
                  </div>
                  <Textarea
                    id={id('notes')}
                    ref={errors.register('notes')}
                    rows={3}
                    placeholder="Delivery hours, contacts, anything the team should know…"
                    value={values.notes}
                    onChange={(e) => change('notes', e.target.value)}
                    aria-invalid={notesError ? true : undefined}
                    aria-describedby={notesError ? `${id('notes-count')} ${id('notes-error')}` : id('notes-count')}
                    className="max-h-40"
                  />
                  <FieldError id={id('notes-error')}>{notesError}</FieldError>
                </Field>
              </FieldGroup>
            </div>
            <DialogFooter className="border-t px-4 py-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button type="submit" aria-busy={saving || undefined}>
                {saving && <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />}
                {saving ? 'Saving…' : 'Add customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

/* ---------- 3. Edit in a sheet ---------- */

type Profile = {
  name: string
  username: string
  email: string
  title: string
  bio: string
  timezone: string
  emailNotifications: boolean
  desktopNotifications: boolean
  weeklyDigest: boolean
}

const PROFILE: Profile = {
  name: 'Alex Morgan',
  username: 'alex',
  email: 'alex@example.com',
  title: 'Operations lead',
  bio: '',
  timezone: 'Asia/Singapore',
  emailNotifications: true,
  desktopNotifications: false,
  weeklyDigest: true,
}

const TIMEZONES = [
  { id: 'Europe/London', label: '(UTC+00:00) London' },
  { id: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
  { id: 'Australia/Sydney', label: '(UTC+10:00) Sydney' },
  { id: 'America/New_York', label: '(UTC−05:00) New York' },
]

const NOTIFICATIONS: { key: 'emailNotifications' | 'desktopNotifications' | 'weeklyDigest'; label: string; description: string }[] = [
  { key: 'emailNotifications', label: 'Email notifications', description: 'Assignments, mentions and replies.' },
  { key: 'desktopNotifications', label: 'Desktop notifications', description: 'Pop-ups while the app is open.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A Monday summary of your team’s work.' },
]

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((word) => word[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'

function EditProfilePanel() {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(PROFILE)
  const [draft, setDraft] = useState(PROFILE)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  // The discard prompt has no trigger, so it hands focus back to where it was.
  const returnFocus = useRef<HTMLElement | null>(null)
  const dirty = (Object.keys(saved) as (keyof Profile)[]).some((key) => saved[key] !== draft[key])
  const errors = useFieldErrors<'name' | 'username' | 'email'>({
    name: draft.name.trim() ? undefined : 'Enter your name.',
    username: !draft.username
      ? 'Pick a username.'
      : /^[a-z0-9_]{3,20}$/.test(draft.username) ? undefined : 'Use 3 to 20 lowercase letters, numbers or underscores.',
    email: emailError(draft.email),
  }, ['name', 'username', 'email'])
  const { shown } = errors
  const id = (field: string) => `${uid}-${field}`

  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  // Every way out (Escape, the overlay, the close button, Cancel) comes through here.
  function openChange(next: boolean) {
    if (next) {
      setDraft(saved)
      errors.reset()
      setOpen(true)
    } else if (!saving) {
      if (dirty) {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setConfirming(true)
      } else {
        setOpen(false)
      }
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!dirty || saving || !errors.check()) return
    setSaving(true)
    await wait(600)
    setSaving(false)
    setSaved(draft)
    setOpen(false)
    toast.success('Profile saved', { description: 'Demo only. The change lives in this tab.' })
  }

  return (
    <Panel title="Edit in a sheet" note="Sheet with an unsaved-changes guard">
      <Intro>
        A side sheet with two field groups and a footer that stays put while the form scrolls. Close it
        with changes pending and it asks before throwing them away.
      </Intro>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="text-[11px]">{initialsOf(saved.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{saved.name}</p>
            <p className="text-muted-foreground truncate text-[11px]">
              {saved.title ? `${saved.title} · ` : ''}{saved.email}
            </p>
          </div>
        </div>

        <Sheet open={open} onOpenChange={openChange}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <HugeiconsIcon icon={UserEdit01Icon} strokeWidth={2} data-icon="inline-start" />
              Edit profile
            </Button>
          </SheetTrigger>
          <SheetContent className="gap-0 data-[side=right]:w-[calc(100%-2.5rem)] data-[side=right]:sm:max-w-md">
            <SheetHeader className="border-b p-4 pr-12">
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>How teammates see you, and how the app treats you.</SheetDescription>
            </SheetHeader>

            <form id={id('form')} noValidate onSubmit={save} className={BODY}>
              <FieldGroup>
                <FieldSet className="min-w-0">
                  <FieldLegend>Profile</FieldLegend>
                  <FieldDescription>Shown on your jobs, comments and mentions.</FieldDescription>
                  <FieldGroup>
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        <AvatarFallback>{initialsOf(draft.name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-self-start"
                          onClick={() => toast('Change photo', { description: 'Demo only. Nothing is uploaded.' })}
                        >
                          <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} data-icon="inline-start" />
                          Change photo
                        </Button>
                        <p className="text-muted-foreground text-[11px]">PNG or JPG, at least 256 × 256.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 @sm/field-group:grid-cols-2">
                      <Field data-invalid={!!shown.name}>
                        <FieldLabel htmlFor={id('name')}>Full name</FieldLabel>
                        <Input
                          id={id('name')}
                          ref={errors.register('name')}
                          autoComplete="name"
                          value={draft.name}
                          onChange={(e) => change('name', e.target.value)}
                          onBlur={(e) => errors.blur('name', e.target.value)}
                          aria-invalid={shown.name ? true : undefined}
                          aria-describedby={shown.name ? id('name-error') : undefined}
                        />
                        <FieldError id={id('name-error')}>{shown.name}</FieldError>
                      </Field>
                      <Field data-invalid={!!shown.username}>
                        <FieldLabel htmlFor={id('username')}>Username</FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText>@</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            id={id('username')}
                            ref={errors.register('username')}
                            autoComplete="username"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={draft.username}
                            onChange={(e) => change('username', e.target.value.toLowerCase())}
                            onBlur={(e) => errors.blur('username', e.target.value)}
                            aria-invalid={shown.username ? true : undefined}
                            aria-describedby={shown.username ? id('username-error') : undefined}
                          />
                        </InputGroup>
                        <FieldError id={id('username-error')}>{shown.username}</FieldError>
                      </Field>
                    </div>

                    <Field data-invalid={!!shown.email}>
                      <FieldLabel htmlFor={id('email')}>Email</FieldLabel>
                      <Input
                        id={id('email')}
                        ref={errors.register('email')}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        spellCheck={false}
                        value={draft.email}
                        onChange={(e) => change('email', e.target.value)}
                        onBlur={(e) => errors.blur('email', e.target.value)}
                        aria-invalid={shown.email ? true : undefined}
                        aria-describedby={shown.email ? id('email-error') : id('email-help')}
                      />
                      {shown.email ? (
                        <FieldError id={id('email-error')}>{shown.email}</FieldError>
                      ) : (
                        <FieldDescription id={id('email-help')}>Used to sign in and for notifications.</FieldDescription>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={id('title')}>
                        Job title <span className="text-muted-foreground font-normal">Optional</span>
                      </FieldLabel>
                      <Input
                        id={id('title')}
                        autoComplete="organization-title"
                        value={draft.title}
                        onChange={(e) => change('title', e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={id('bio')}>
                        Bio <span className="text-muted-foreground font-normal">Optional</span>
                      </FieldLabel>
                      <Textarea
                        id={id('bio')}
                        rows={3}
                        placeholder="A line about what you work on."
                        value={draft.bio}
                        onChange={(e) => change('bio', e.target.value)}
                        className="max-h-40"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>

                <FieldSeparator />

                <FieldSet className="min-w-0">
                  <FieldLegend>Preferences</FieldLegend>
                  <FieldDescription>These only change things for you.</FieldDescription>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={id('timezone')}>Time zone</FieldLabel>
                      <Select value={draft.timezone} onValueChange={(v) => change('timezone', v)}>
                        <SelectTrigger id={id('timezone')} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {NOTIFICATIONS.map((n) => (
                      <Field key={n.key} orientation="horizontal">
                        <FieldContent>
                          <FieldLabel htmlFor={id(n.key)}>{n.label}</FieldLabel>
                          <FieldDescription>{n.description}</FieldDescription>
                        </FieldContent>
                        <Switch id={id(n.key)} checked={draft[n.key]} onCheckedChange={(v) => change(n.key, v)} />
                      </Field>
                    ))}
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>

            <SheetFooter className="mt-0 flex-row items-center border-t px-4 py-3">
              <span aria-live="polite" className="text-muted-foreground mr-auto flex min-w-0 items-center gap-1.5 text-[11px]">
                {dirty && (
                  <>
                    <span aria-hidden="true" className="bg-status-progress size-1.5 shrink-0 rounded-full" />
                    Unsaved changes
                  </>
                )}
              </span>
              <Button type="button" variant="ghost" disabled={saving} onClick={() => openChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form={id('form')} disabled={!dirty} aria-busy={saving || undefined}>
                {saving && <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />}
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (returnFocus.current?.isConnected) returnFocus.current.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your profile. If you close the sheet now, they are lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => setOpen(false)}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  )
}

/* ---------- Email rows (wizard and invite dialog) ---------- */

type Role = 'admin' | 'member' | 'guest'
type InviteRow = { id: string; email: string; role: Role; touched: boolean }

const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'member', label: 'Member' },
  { id: 'guest', label: 'Guest' },
]

const SAMPLE_LIST = 'sam@example.com, lee@example.com\nkim@example.com priya@example.com'

let rowCount = 0
const newRow = (email = '', role: Role = 'member', touched = false): InviteRow => ({
  id: `row-${++rowCount}`, email, role, touched,
})

const splitEmails = (text: string) =>
  text.split(/[\s,;]+/).map((part) => part.replace(/^<|>$/g, '')).filter(Boolean)

// Blank rows are skipped, not errors: they are just spare rows.
function rowErrors(rows: InviteRow[]) {
  const errors: Record<string, string> = {}
  const seen = new Set<string>()
  for (const row of rows) {
    const email = row.email.trim().toLowerCase()
    if (!email) continue
    if (!EMAIL.test(email)) errors[row.id] = 'Enter an email like name@example.com.'
    else if (seen.has(email)) errors[row.id] = 'This email is already on the list.'
    seen.add(email)
  }
  return errors
}

function EmailRows({ rows, setRows, showErrors, withRole, inputs }: {
  rows: InviteRow[]
  setRows: Dispatch<SetStateAction<InviteRow[]>>
  showErrors: boolean
  withRole?: boolean
  inputs: RefObject<Map<string, HTMLInputElement>>
}) {
  const uid = useId()
  const [note, setNote] = useState('')
  const focusNext = useRef<string | null>(null)
  const errors = rowErrors(rows)

  useEffect(() => {
    if (!focusNext.current) return
    inputs.current.get(focusNext.current)?.focus()
    focusNext.current = null
  }, [rows, inputs])

  function update(id: string, patch: Partial<InviteRow>) {
    setRows((all) => all.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function add() {
    const row = newRow('', rows.at(-1)?.role)
    focusNext.current = row.id
    setRows((all) => [...all, row])
  }

  function remove(id: string) {
    if (rows.length === 1) {
      update(id, { email: '', touched: false })
      focusNext.current = id
      return
    }
    const index = rows.findIndex((row) => row.id === id)
    focusNext.current = (rows[index - 1] ?? rows[index + 1]).id
    setRows((all) => all.filter((row) => row.id !== id))
  }

  // A pasted list becomes one row per address, skipping ones already listed.
  function paste(e: ClipboardEvent<HTMLInputElement>, row: InviteRow) {
    const parts = splitEmails(e.clipboardData.getData('text'))
    if (parts.length < 2) return
    e.preventDefault()
    const seen = new Set(rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean))
    const fresh = parts.filter((email) => {
      const key = email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const fillHere = !row.email.trim() && fresh.length > 0
    const added = (fillHere ? fresh.slice(1) : fresh).map((email) => newRow(email, row.role, true))
    setRows((all) => {
      const index = all.findIndex((r) => r.id === row.id)
      const next = [...all]
      if (fillHere) next[index] = { ...next[index], email: fresh[0], touched: true }
      next.splice(index + 1, 0, ...added)
      return next
    })
    const skipped = parts.length - fresh.length
    setNote(
      `Added ${fresh.length} ${fresh.length === 1 ? 'email' : 'emails'} from the paste.`
      + (skipped ? ` Skipped ${skipped} already on the list.` : ''),
    )
  }

  return (
    <div className="grid gap-2">
      {withRole && (
        <div aria-hidden="true" className="text-muted-foreground flex gap-2 text-[11px]">
          <span className="flex-1">Email</span>
          <span className="w-24">Role</span>
          <span className="w-7" />
        </div>
      )}
      <ul className="grid gap-2">
        {rows.map((row, i) => {
          const error = showErrors || row.touched ? errors[row.id] : undefined
          const errorId = `${uid}-${row.id}-error`
          return (
            <li key={row.id} className="grid gap-1">
              <div className="flex items-center gap-2">
                <InputGroup className="min-w-0 flex-1">
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={(el) => {
                      if (el) inputs.current.set(row.id, el)
                      else inputs.current.delete(row.id)
                    }}
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="name@example.com"
                    aria-label={`Email ${i + 1}`}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    value={row.email}
                    onChange={(e) => update(row.id, { email: e.target.value })}
                    onBlur={() => {
                      if (row.email.trim() && !row.touched) update(row.id, { touched: true })
                    }}
                    onPaste={(e) => paste(e, row)}
                  />
                </InputGroup>
                {withRole && (
                  <Select value={row.role} onValueChange={(role) => update(row.id, { role: role as Role })}>
                    <SelectTrigger aria-label={`Role for email ${i + 1}`} className="w-24 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end">
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove email ${i + 1}`}
                  className="text-muted-foreground"
                  disabled={rows.length === 1 && !row.email}
                  onClick={() => remove(row.id)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </Button>
              </div>
              <FieldError id={errorId}>{error}</FieldError>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground -ml-1.5" onClick={add}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add another
        </Button>
        <span aria-live="polite" className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]">
          {note && <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-3.5 shrink-0" />}
          {note || 'Paste a list of emails into any row.'}
        </span>
      </div>
    </div>
  )
}

/* ---------- 4. Multi-step wizard ---------- */

const WIZARD = ['Workspace', 'Invite', 'Review']

const slugify = (text: string) =>
  text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 32).replace(/-+$/, '')

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Steps" className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        const last = i === steps.length - 1
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={cn('flex min-w-0 items-center gap-2', !last && 'flex-1')}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold tabular-nums transition-colors',
                done && 'border-brand bg-brand text-primary-foreground',
                active && 'border-brand text-brand ring-brand/20 ring-3',
                !done && !active && 'text-muted-foreground',
              )}
            >
              {done ? <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" /> : i + 1}
            </span>
            <span className={cn('truncate text-xs', active ? 'font-medium' : 'text-muted-foreground')}>
              <span className="sr-only">Step {i + 1}: </span>
              {label}
              <span className="sr-only">{done ? ', done' : active ? ', current' : ''}</span>
            </span>
            {!last && (
              <span
                aria-hidden="true"
                className={cn('h-px min-w-3 flex-1 transition-colors', done ? 'bg-brand' : 'bg-border')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 text-xs">
      <dt className="text-muted-foreground w-14 shrink-0 pt-0.5">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-start justify-between gap-2">
        <div className="min-w-0 pt-0.5">{children}</div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`Edit ${label.toLowerCase()}`}
          className="text-muted-foreground"
          onClick={onEdit}
        >
          Edit
        </Button>
      </dd>
    </div>
  )
}

function WizardPanel() {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [rows, setRows] = useState<InviteRow[]>(() => [newRow()])
  const [invitesTried, setInvitesTried] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const primary = useRef<HTMLButtonElement>(null)
  const errors = useFieldErrors<'name' | 'slug'>({
    name: !name.trim() ? 'Name the workspace.' : name.trim().length < 2 ? 'Use at least 2 characters.' : undefined,
    slug: !slug
      ? 'Pick a URL for the workspace.'
      : slug.length < 3
        ? 'Use at least 3 characters.'
        : SLUG.test(slug) ? undefined : 'Use lowercase letters, numbers and single dashes.',
  }, ['name', 'slug'])
  const { shown } = errors
  const invitees = rows.filter((r) => r.email.trim())
  const id = (field: string) => `${uid}-${field}`

  // Each step puts focus where the work is, since the old step's fields are gone.
  useEffect(() => {
    if (!open) return
    if (step === 0) errors.focus('name')
    if (step === 1) inputs.current.get(rows[0].id)?.focus()
    if (step === 2) primary.current?.focus()
  }, [step])

  function openChange(next: boolean) {
    if (finishing) return
    if (next) {
      setStep(0)
      setName('')
      setSlug('')
      setSlugEdited(false)
      setRows([newRow()])
      setInvitesTried(false)
      errors.reset()
    }
    setOpen(next)
  }

  function changeName(value: string) {
    setName(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  // Clearing the slug by hand hands it back to the name.
  function changeSlug(value: string) {
    const next = value.toLowerCase().replace(/\s+/g, '-')
    setSlug(next)
    setSlugEdited(next !== '')
  }

  async function next(e: FormEvent) {
    e.preventDefault()
    if (step === 0) {
      if (errors.check()) setStep(1)
    } else if (step === 1) {
      setInvitesTried(true)
      const rowProblems = rowErrors(rows)
      const bad = rows.find((r) => rowProblems[r.id])
      if (bad) inputs.current.get(bad.id)?.focus()
      else setStep(2)
    } else if (!finishing) {
      setFinishing(true)
      await wait(800)
      setFinishing(false)
      setOpen(false)
      toast.success('Workspace created', { description: `Demo only. ${name.trim()} was not created.` })
    }
  }

  return (
    <Panel title="Multi-step wizard" note="Stepper with per-step validation">
      <Intro>
        Three steps: a name with a URL that fills itself in, a list of people to invite, and a review.
        Next checks the current step before moving on, and Back keeps what you typed.
      </Intro>
      <Dialog open={open} onOpenChange={openChange}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <HugeiconsIcon icon={Building03Icon} strokeWidth={2} data-icon="inline-start" />
            Create workspace
          </Button>
        </DialogTrigger>
        <DialogContent className={cn(MODAL, 'sm:max-w-lg')}>
          <DialogHeader className="px-4 pt-4 pr-10">
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>Three short steps. You can change all of it later.</DialogDescription>
          </DialogHeader>
          <div className="border-b px-4 pt-3 pb-4">
            <Stepper steps={WIZARD} current={step} />
          </div>

          <form noValidate onSubmit={next} className="flex min-h-0 flex-1 flex-col">
            <div className={BODY}>
              {step === 0 && (
                <FieldGroup>
                  <Field data-invalid={!!shown.name}>
                    <FieldLabel htmlFor={id('name')}>Workspace name</FieldLabel>
                    <Input
                      id={id('name')}
                      ref={errors.register('name')}
                      autoComplete="organization"
                      placeholder="Acme Studio"
                      value={name}
                      onChange={(e) => changeName(e.target.value)}
                      onBlur={(e) => errors.blur('name', e.target.value)}
                      aria-invalid={shown.name ? true : undefined}
                      aria-describedby={shown.name ? id('name-error') : undefined}
                    />
                    <FieldError id={id('name-error')}>{shown.name}</FieldError>
                  </Field>
                  <Field data-invalid={!!shown.slug}>
                    <FieldLabel htmlFor={id('slug')}>Workspace URL</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>app.example.com/</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id={id('slug')}
                        ref={errors.register('slug')}
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        placeholder="acme-studio"
                        value={slug}
                        onChange={(e) => changeSlug(e.target.value)}
                        onBlur={(e) => errors.blur('slug', e.target.value)}
                        aria-invalid={shown.slug ? true : undefined}
                        aria-describedby={shown.slug ? id('slug-error') : id('slug-help')}
                        className="pl-0!"
                      />
                    </InputGroup>
                    {shown.slug ? (
                      <FieldError id={id('slug-error')}>{shown.slug}</FieldError>
                    ) : (
                      <FieldDescription id={id('slug-help')}>
                        {slugEdited ? 'Lowercase letters, numbers and dashes.' : 'Fills in from the name until you edit it.'}
                      </FieldDescription>
                    )}
                  </Field>
                </FieldGroup>
              )}

              {step === 1 && (
                <FieldSet className="min-w-0">
                  <FieldLegend variant="label">Invite your team</FieldLegend>
                  <FieldDescription>Optional. Leave the rows blank to invite people later.</FieldDescription>
                  <EmailRows rows={rows} setRows={setRows} showErrors={invitesTried} inputs={inputs} />
                </FieldSet>
              )}

              {step === 2 && (
                <div className="grid gap-3">
                  <p className="text-muted-foreground text-xs">Check the details, then finish.</p>
                  <dl className="divide-y rounded-lg border">
                    <ReviewRow label="Name" onEdit={() => setStep(0)}>
                      <span className="font-medium break-words">{name.trim()}</span>
                    </ReviewRow>
                    <ReviewRow label="URL" onEdit={() => setStep(0)}>
                      <span className="break-all">
                        <span className="text-muted-foreground">app.example.com/</span>
                        {slug}
                      </span>
                    </ReviewRow>
                    <ReviewRow label="Invites" onEdit={() => setStep(1)}>
                      {invitees.length ? (
                        <ul className="flex flex-wrap gap-1">
                          {invitees.map((r) => (
                            <li key={r.id} className="bg-muted max-w-full truncate rounded px-1.5 py-0.5 text-[11px]">
                              {r.email.trim()}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">No one yet</span>
                      )}
                    </ReviewRow>
                  </dl>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t px-4 py-3">
              <span aria-live="polite" className="text-muted-foreground mr-auto text-[11px] tabular-nums">
                Step {step + 1} of {WIZARD.length}
              </span>
              {step === 0 ? (
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
              ) : (
                <Button type="button" variant="ghost" disabled={finishing} onClick={() => setStep((s) => s - 1)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
                  Back
                </Button>
              )}
              <Button ref={primary} type="submit" aria-busy={finishing || undefined}>
                {step < WIZARD.length - 1 ? (
                  <>
                    Next
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                  </>
                ) : finishing ? (
                  <>
                    <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />
                    Finishing…
                  </>
                ) : (
                  'Finish'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

/* ---------- 5. Invite members ---------- */

function InvitePanel() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<InviteRow[]>(() => [newRow()])
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const count = rows.filter((r) => r.email.trim()).length
  const label = count === 0 ? 'Send invites' : `Send ${count} ${count === 1 ? 'invite' : 'invites'}`

  function openChange(next: boolean) {
    if (sending) return
    if (next) {
      setRows([newRow()])
      setTried(false)
    }
    setOpen(next)
  }

  async function send(e: FormEvent) {
    e.preventDefault()
    if (sending || count === 0) return
    setTried(true)
    const errors = rowErrors(rows)
    const bad = rows.find((r) => errors[r.id])
    if (bad) {
      inputs.current.get(bad.id)?.focus()
      return
    }
    setSending(true)
    await wait(800)
    setSending(false)
    setOpen(false)
    toast.success(count === 1 ? 'Invite sent' : `${count} invites sent`, { description: 'Demo only. No emails went out.' })
  }

  function copySample() {
    navigator.clipboard?.writeText(SAMPLE_LIST).catch(() => {})
    toast('Sample list copied', { description: 'Paste it into an email row.' })
  }

  return (
    <Panel title="Invite members" note="Dynamic rows, paste a list">
      <Intro>
        One row per person with a role, Add another, and a paste that splits a list on commas, spaces
        or new lines. The button counts what it will send.
      </Intro>
      <Row>
        <Dialog open={open} onOpenChange={openChange}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <HugeiconsIcon icon={MailAdd01Icon} strokeWidth={2} data-icon="inline-start" />
              Invite members
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(MODAL, 'sm:max-w-lg')}>
            <DialogHeader className="border-b px-4 py-3 pr-10">
              <DialogTitle>Invite members</DialogTitle>
              <DialogDescription>They get an email with a link to join Acme Studio.</DialogDescription>
            </DialogHeader>
            <form noValidate onSubmit={send} className="flex min-h-0 flex-1 flex-col">
              <div className={BODY}>
                <EmailRows rows={rows} setRows={setRows} showErrors={tried} withRole inputs={inputs} />
              </div>
              <DialogFooter className="border-t px-4 py-3">
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={sending}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={count === 0} aria-busy={sending || undefined}>
                  {sending ? (
                    <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />
                  ) : (
                    <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
                  )}
                  {sending ? 'Sending…' : label}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" className="text-muted-foreground" onClick={copySample}>
          <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
          Copy a sample list
        </Button>
      </Row>
    </Panel>
  )
}

/* ---------- 6. Type to confirm delete ---------- */

function DeleteWorkspacePanel() {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const match = typed === WORKSPACE

  function openChange(next: boolean) {
    if (next) setTyped('')
    setOpen(next)
  }

  function remove() {
    toast('Workspace deleted', { description: `Demo only. ${WORKSPACE} is still here.` })
  }

  return (
    <Panel title="Type to confirm" note="The delete button unlocks on an exact match" wide>
      <div className="border-destructive/25 bg-destructive/5 dark:bg-destructive/10 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid min-w-0 gap-1">
          <p className="text-xs font-medium">Delete this workspace</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Removes <Code>{WORKSPACE}</Code> with its 128 jobs and every photo, for all 12 members. There is no undo.
          </p>
        </div>
        <AlertDialog open={open} onOpenChange={openChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="self-start sm:self-auto">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" />
              Delete workspace
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              inputRef.current?.focus()
            }}
          >
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete workspace</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes <Code>{WORKSPACE}</Code> for everyone, with its 128 jobs and 1,204 photos. It
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field>
              <FieldLabel htmlFor={`${uid}-confirm`} className="block leading-relaxed font-normal">
                Type <Code>{WORKSPACE}</Code> to confirm.
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  ref={inputRef}
                  id={`${uid}-confirm`}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && match) {
                      e.preventDefault()
                      setOpen(false)
                      remove()
                    }
                  }}
                />
                <InputGroupAddon align="inline-end" aria-hidden="true" className={cn(!match && 'invisible')}>
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done" />
                </InputGroupAddon>
              </InputGroup>
              <span aria-live="polite" className="sr-only">
                {match ? 'The name matches. The delete button is now on.' : ''}
              </span>
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={!match} onClick={remove}>
                Delete workspace
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Panel>
  )
}
