import {
  useState, useEffect, useId, useRef, type ClipboardEvent, type Dispatch, type FormEvent, type ReactNode,
  type RefObject, type SetStateAction,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Attachment01Icon, Building03Icon, Calendar03Icon,
  CalendarRemove01Icon, Camera01Icon, Cancel01Icon, Copy01Icon, Delete02Icon, InformationCircleIcon,
  Location01Icon, Mail01Icon, MailAdd01Icon, SentIcon, Tag01Icon, Tick02Icon, TruckIcon, UserAdd01Icon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { copyText } from '@/lib/clipboard'
import { plural, slug as toSlug } from '@/lib/text'
import { IconAction } from '@/components/icon-action'
import { UserAvatar } from '@/components/person'
import { Shortcut, IS_MAC } from '@/components/shortcut'
import { StatusIcon } from '@/components/status-icon'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DIALOG_BODY, DIALOG_PANEL, EMAIL_PATTERN, FormDialog, PropertyComboboxPill, PropertyMultiPill, PropertyPill,
  QuickCreateDialog as QuickCreate, useFieldErrors, type FormField, type FormValues, type PropertyOption,
} from '@/blocks/form-dialog'
import { PRIORITY, type Priority, DUE_OPTIONS, UNASSIGNED, type Job, type Status } from '../data'
import {
  ASSIGNEE_OPTIONS, LABEL_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeValue, driverOf, type JobOption,
} from '../job-options'
import { useJobs } from '../jobs-store'
import { goTo } from '../nav'
import { Panel, Section, Row } from './shared'

// Key caps tinted to sit on a primary button.
const ON_PRIMARY = 'ml-1 *:data-[slot=kbd]:bg-primary-foreground/15 *:data-[slot=kbd]:text-primary-foreground'

/* ---------- Shared bits ---------- */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const WORKSPACE = 'acme-studio'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function emailError(value: string) {
  const email = value.trim()
  if (!email) return 'Enter an email address.'
  if (!EMAIL_PATTERN.test(email)) return 'Enter an email like name@example.com.'
  return undefined
}

function Intro({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground mb-3 text-xs leading-relaxed">{children}</p>
}

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-muted text-foreground rounded px-1 py-px font-mono text-[11px]">{children}</code>
}

/* ---------- 1. Quick create ---------- */

// The pills' values. Title and description live in the dialog block.
type Draft = {
  status: Status
  priority: Priority
  driver: string
  labels: string[]
  due: string
}

const EMPTY_DRAFT: Draft = { status: 'todo', priority: 'none', driver: '', labels: [], due: '' }

const NO_DUE = 'none'

// The shared job option lists, in the shape the property pills take.
const pillOptions = <V extends string>(options: JobOption<V>[]): PropertyOption<V>[] =>
  options.map(({ value, label, visual }) => ({ value, label, icon: visual }))

const STATUS_PILL_OPTIONS = pillOptions(STATUS_OPTIONS)

const PRIORITY_PILL_OPTIONS = pillOptions(PRIORITY_OPTIONS)

const ASSIGNEE_PILL_OPTIONS = pillOptions(ASSIGNEE_OPTIONS)

const LABEL_PILL_OPTIONS = pillOptions(LABEL_OPTIONS)

const CALENDAR_ICON = <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />

const DUE_MENU: PropertyOption[] = [
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
    <Panel title="Quick create" note="new job dialog with property pills" wide>
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
          <Shortcut keys={['mod', 'enter']} />
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
  // Kept when the dialog is dismissed, like a draft, and cleared on create.
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <QuickCreate
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      context={{ mark: 'OP', label: 'Operations' }}
      title="New job"
      description={`A title is required. Everything else is optional. Press ${IS_MAC ? 'Command' : 'Control'} Enter to create the job.`}
      titleLabel="Job title"
      titlePlaceholder="Job title"
      requiredMessage="A job needs a title."
      submitLabel="Create job"
      createMore
      onSubmit={({ title, description }, { createMore }) => {
        const job = addJob(draft.status, title)
        const { priority, driver, labels, due } = draft
        updateJob(job.id, { priority, driver, labels, due, description })
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
        if (!createMore) setDraft(EMPTY_DRAFT)
      }}
      properties={
        <>
          <PropertyPill label="Status" value={draft.status} options={STATUS_PILL_OPTIONS} onChange={(v) => set('status', v)} />
          <PropertyPill
            label="Priority"
            value={draft.priority}
            unset="none"
            options={PRIORITY_PILL_OPTIONS}
            onChange={(v) => set('priority', v)}
          />
          <PropertyComboboxPill
            label="Assignee"
            value={assigneeValue(draft.driver)}
            unset={UNASSIGNED}
            options={ASSIGNEE_PILL_OPTIONS}
            searchPlaceholder="Assign to…"
            emptyText="No one found."
            onChange={(v) => set('driver', driverOf(v))}
          />
          <PropertyMultiPill
            label="Labels"
            value={draft.labels}
            options={LABEL_PILL_OPTIONS}
            unsetIcon={<HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />}
            searchPlaceholder="Add labels…"
            emptyText="No labels found."
            onChange={(v) => set('labels', v)}
          />
          <PropertyPill
            label="Due date"
            value={draft.due || NO_DUE}
            unset={NO_DUE}
            unsetIcon={CALENDAR_ICON}
            options={DUE_MENU}
            onChange={(v) => set('due', v === NO_DUE ? '' : v)}
          />
        </>
      }
      footerStart={
        <IconAction
          label="Attach a file"
          icon={Attachment01Icon}
          onClick={() => toast('Attach a file', { description: 'Demo only. Nothing is uploaded.' })}
        />
      }
    />
  )
}

/* ---------- 2. Validated form dialog ---------- */

const NEW_CUSTOMER: FormValues = { name: '', email: '', size: '11-50', plan: 'team', welcome: true, notes: '' }

const CUSTOMER_FIELDS: FormField[] = [
  {
    key: 'name', label: 'Name', type: 'text', required: true, requiredMessage: 'Enter the customer’s name.',
    autoComplete: 'organization', placeholder: 'Harbour Foods',
  },
  {
    key: 'email', label: 'Email', type: 'email', required: true, requiredMessage: 'Enter an email address.',
    icon: Mail01Icon, placeholder: 'name@example.com',
  },
  {
    key: 'size', label: 'Company size', type: 'radio',
    options: [
      { value: '1-10', label: '1–10' },
      { value: '11-50', label: '11–50' },
      { value: '51-200', label: '51–200' },
      { value: '200+', label: '200+' },
    ],
  },
  {
    key: 'plan', label: 'Plan', type: 'select', description: 'You can change the plan at any time.',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'team', label: 'Team' },
      { value: 'business', label: 'Business' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
  },
  { key: 'welcome', label: 'Send welcome email', type: 'checkbox', description: 'With a link to the customer portal.' },
  {
    key: 'notes', label: 'Notes', type: 'textarea', hint: 'Optional', maxLength: 200,
    placeholder: 'Delivery hours, contacts, anything the team should know…',
  },
]

function AddCustomerPanel() {
  return (
    <Panel title="Validated form" note="Dialog, Field and FieldError">
      <Intro>
        Name and email are required, and the email is checked for format. Errors show when you leave a
        field or submit, and the first problem gets focus. Saving takes 800 ms.
      </Intro>
      <FormDialog
        trigger={
          <Button variant="outline">
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Add customer
          </Button>
        }
        title="Add customer"
        description="They can then be picked on any job."
        fields={CUSTOMER_FIELDS}
        initialValues={NEW_CUSTOMER}
        submitLabel="Add customer"
        shortcut={false}
        onSubmit={async (values) => {
          await wait(800)
          toast.success('Customer added', { description: `Demo only. ${values.name} was not saved.` })
        }}
      />
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
          <UserAvatar name={saved.name || '?'} className="size-8 *:data-[slot=avatar-fallback]:text-[11px]" />
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

            <form id={id('form')} noValidate onSubmit={save} className={DIALOG_BODY}>
              <FieldGroup>
                <FieldSet className="min-w-0">
                  <FieldLegend>Profile</FieldLegend>
                  <FieldDescription>Shown on your jobs, comments and mentions.</FieldDescription>
                  <FieldGroup>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={draft.name || '?'} className="size-10 *:data-[slot=avatar-fallback]:text-sm" />
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
    if (!EMAIL_PATTERN.test(email)) errors[row.id] = 'Enter an email like name@example.com.'
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
      `Added ${plural(fresh.length, 'email')} from the paste.`
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
    if (!slugEdited) setSlug(toSlug(value, { maxLength: 32 }))
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
        <DialogContent className={cn(DIALOG_PANEL, 'sm:max-w-lg')}>
          <DialogHeader className="px-4 pt-4 pr-10">
            <DialogTitle>Create a workspace</DialogTitle>
            <DialogDescription>Three short steps. You can change all of it later.</DialogDescription>
          </DialogHeader>
          <div className="border-b px-4 pt-3 pb-4">
            <Stepper steps={WIZARD} current={step} />
          </div>

          <form noValidate onSubmit={next} className="flex min-h-0 flex-1 flex-col">
            <div className={DIALOG_BODY}>
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
  const label = count === 0 ? 'Send invites' : `Send ${plural(count, 'invite')}`

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
    copyText(SAMPLE_LIST, { success: 'Sample list copied', description: 'Paste it into an email row.' })
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
          <DialogContent className={cn(DIALOG_PANEL, 'sm:max-w-lg')}>
            <DialogHeader className="border-b px-4 py-3 pr-10">
              <DialogTitle>Invite members</DialogTitle>
              <DialogDescription>They get an email with a link to join Acme Studio.</DialogDescription>
            </DialogHeader>
            <form noValidate onSubmit={send} className="flex min-h-0 flex-1 flex-col">
              <div className={DIALOG_BODY}>
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

export default function FormsSection() {
  const [pallets, setPallets] = useState([12])

  return (
    <Section id="forms" title="Forms" description="Whole forms with real validation: on a page, in a dialog or sheet, and as a wizard">
      <Panel title="Create job" note="Every control in one real form">
        <form
          className="grid gap-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            toast.success('Job created', { description: 'This is a demo. Nothing was saved.' })
          }}
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="do">DO number</Label>
              <Input id="do" placeholder="DO-24818" />
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select defaultValue="bayview">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Recent</SelectLabel>
                    <SelectItem value="bayview">Bayview Foods</SelectItem>
                    <SelectItem value="lumen">Lumen Electronics</SelectItem>
                    <SelectItem value="orchid">Orchid Pharma</SelectItem>
                    <SelectItem value="tanjong">Tanjong Paints</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="dest">Delivery address</Label>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput id="dest" placeholder="12 Jurong Port Road" />
            </InputGroup>
          </div>

          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <RadioGroup defaultValue="medium" className="flex flex-wrap gap-3">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <Label key={p} className="flex items-center gap-1.5 font-normal">
                  <RadioGroupItem value={p} />
                  <HugeiconsIcon icon={PRIORITY[p].icon} strokeWidth={2} className={`size-3.5 ${PRIORITY[p].className}`} />
                  {PRIORITY[p].label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Pallets</Label>
              <span className="text-muted-foreground text-xs tabular-nums">{pallets[0]}</span>
            </div>
            <Slider value={pallets} onValueChange={setPallets} min={1} max={40} step={1} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes for driver</Label>
            <Textarea id="notes" placeholder="Gate code, loading bay, contact person…" rows={3} />
          </div>

          <div className="grid gap-2.5">
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox defaultChecked /> Proof photos required
            </Label>
            <Label className="flex items-center justify-between gap-2 font-normal">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={TruckIcon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                Notify driver on WhatsApp
              </span>
              <Switch defaultChecked />
            </Label>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3.5">
            <Button type="button" variant="ghost">Cancel</Button>
            <Button type="submit">
              Create job
              <Shortcut keys={['mod', 'enter']} className={ON_PRIMARY} />
            </Button>
          </div>
        </form>
      </Panel>

      <QuickCreatePanel />

      <AddCustomerPanel />

      <EditProfilePanel />

      <WizardPanel />

      <InvitePanel />

      <DeleteWorkspacePanel />
    </Section>
  )
}
