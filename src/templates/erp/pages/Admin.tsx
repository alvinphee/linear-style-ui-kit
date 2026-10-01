import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, BankIcon, Copy01Icon, CreditCardIcon, Delete02Icon, DeliveryTruck01Icon, FileExportIcon, FingerPrintIcon,
  Invoice02Icon, Key01Icon, LockIcon, Mail01Icon, SentIcon, Shield01Icon, Upload04Icon, UserLock01Icon,
  UserMultipleIcon, WebhookIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Initials } from '@/pages/sections/StatusSection'
import { ROLE_LABEL, type Company } from '../data'
import { TODAY, addDays, formatDate } from '../format'
import { MODULES } from '../modules'
import { go } from '../route'
import { useErp } from '../store'
import type { Data, EntityId, Role, Row } from '../types'
import { ModuleMark, PageHeader, StatusBadge } from '../ui'

// Administration: roles and permissions, company settings, integrations.
// Everything here is local state: saving shows a toast and keeps the change
// until the page is left.

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function omit<T>(record: Record<string, T>, key: string) {
  const copy = { ...record }
  delete copy[key]
  return copy
}

// The same box as Card in ../ui, plus a description line, and without the
// padding when it holds a table or a list.
function Panel({ title, description, action, flush, className, children }: {
  title: string
  description?: ReactNode
  action?: ReactNode
  flush?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('bg-card min-w-0 rounded-lg border', className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b px-3.5 py-2.5">
        <div className="grid min-w-0 gap-0.5">
          <h2 className="text-xs font-medium">{title}</h2>
          {description && <p className="text-muted-foreground text-[11px]">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{action}</div>}
      </header>
      <div className={cn(!flush && 'p-3.5')}>{children}</div>
    </section>
  )
}

function FormField({ id, label, hint, error, className, children }: {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid min-w-0 content-start gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error
        ? <p id={`${id}-error`} className="text-destructive text-[11px]">{error}</p>
        : hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
    </div>
  )
}

/* ---------- Roles and permissions ---------- */

const ACTIONS = ['view', 'create', 'edit', 'approve', 'delete'] as const
type Action = (typeof ACTIONS)[number]
const ACTION_LABEL: Record<Action, string> = { view: 'View', create: 'Create', edit: 'Edit', approve: 'Approve', delete: 'Delete' }

// Module id → what the role may do in it.
type Grants = Record<string, Record<Action, boolean>>
type RoleDef = { id: string; name: string; description: string; custom?: boolean }

const ROLE_IDS = Object.keys(ROLE_LABEL) as Role[]
const ROLE_INFO: Record<Role, string> = {
  admin: 'Full access, including administration',
  sales: 'CRM, sales and stock lookups',
  operations: 'Inventory and purchasing',
  finance: 'Accounting, sales and purchase approvals',
  hr: 'Employees, leave and payroll',
}

// Read MODULES inside functions only: modules.tsx imports this file, so
// MODULES is not ready while this module is first evaluated.
const permissionModules = () => MODULES.filter((m) => m.id !== 'home')

function defaultGrants(role: Role): Grants {
  return Object.fromEntries(permissionModules().map((m) => {
    if (role === 'admin') return [m.id, { view: true, create: true, edit: true, approve: true, delete: true }]
    const has = m.roles.includes(role)
    const approve = has && ((role === 'finance' && (m.id === 'purchasing' || m.id === 'accounting')) || (role === 'hr' && m.id === 'hr'))
    return [m.id, { view: has, create: has, edit: has, approve, delete: false }]
  }))
}

const initialGrants = (): Record<string, Grants> => Object.fromEntries(ROLE_IDS.map((r) => [r, defaultGrants(r)]))
const grantCount = (grants: Grants | undefined) =>
  Object.values(grants ?? {}).reduce((n, row) => n + ACTIONS.filter((a) => row[a]).length, 0)

export function RolesPermissions() {
  const { data } = useErp()
  const [roles, setRoles] = useState<RoleDef[]>(() => ROLE_IDS.map((id) => ({ id, name: ROLE_LABEL[id], description: ROLE_INFO[id] })))
  const [saved, setSaved] = useState(initialGrants)
  const [draft, setDraft] = useState(initialGrants)
  const [selected, setSelected] = useState('sales')
  const [creating, setCreating] = useState(false)

  const modules = permissionModules()
  const role = roles.find((r) => r.id === selected) ?? roles[0]
  const locked = role.id === 'admin'
  const grants = draft[role.id] ?? {}
  const changed = roles.filter((r) => !same(draft[r.id], saved[r.id]))
  const dirty = changed.length > 0
  const membersOf = (r: RoleDef) => data.users.filter((u) => u.role === r.name)
  const members = membersOf(role)
  const total = modules.length * ACTIONS.length

  function toggle(moduleId: string, action: Action, on: boolean) {
    setDraft((d) => {
      const row = { ...d[role.id][moduleId], [action]: on }
      // Every other permission needs View, so they move together.
      if (action === 'view' && !on) for (const a of ACTIONS) row[a] = false
      if (action !== 'view' && on) row.view = true
      return { ...d, [role.id]: { ...d[role.id], [moduleId]: row } }
    })
  }

  function save() {
    setSaved(draft)
    toast.success('Permissions saved', {
      description: `${changed.map((r) => r.name).join(', ')} updated. Members get the changes at their next sign-in.`,
    })
  }

  function createRole(name: string, description: string, from: string) {
    const id = `custom-${Date.now()}`
    const copy: Grants = structuredClone(draft[from] ?? defaultGrants('sales'))
    setRoles((list) => [...list, { id, name, description: description || 'Custom role', custom: true }])
    setSaved((s) => ({ ...s, [id]: copy }))
    setDraft((d) => ({ ...d, [id]: copy }))
    setSelected(id)
    setCreating(false)
    toast.success(`Created role ${name}`, {
      description: `Permissions copied from ${roles.find((r) => r.id === from)?.name ?? 'Sales'}. Assign users to it from Users.`,
    })
  }

  function deleteRole() {
    const gone = role
    setRoles((list) => list.filter((r) => r.id !== gone.id))
    setSaved((s) => omit(s, gone.id))
    setDraft((d) => omit(d, gone.id))
    setSelected('sales')
    toast(`Deleted role ${gone.name}`)
  }

  return (
    <>
      <PageHeader
        title="Roles and permissions"
        description="Choose what each role can view, create, edit, approve and delete in every module."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              New role
            </Button>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => {
                setDraft(saved)
                toast('Changes discarded')
              }}>
                Discard
              </Button>
            )}
            <Button size="sm" disabled={!dirty} onClick={save}>Save changes</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 pb-8 @2xl:px-6 @3xl:grid-cols-[15rem_minmax(0,1fr)]">
        <Panel title="Roles" description={`${roles.length} roles · ${data.users.length} users`} flush className="self-start">
          <ul className="grid gap-0.5 p-1.5">
            {roles.map((r) => {
              const count = membersOf(r).length
              const unsaved = changed.some((c) => c.id === r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-pressed={r.id === role.id}
                    onClick={() => setSelected(r.id)}
                    className="hover:bg-accent/60 aria-pressed:bg-accent focus-visible:ring-ring/40 flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2"
                  >
                    <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
                      <HugeiconsIcon icon={r.id === 'admin' ? Shield01Icon : UserLock01Icon} strokeWidth={2} className="size-3.5" />
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                        <span className="truncate">{r.name}</span>
                        {r.custom && <span className="text-muted-foreground rounded border px-1 text-[10px] font-normal">Custom</span>}
                        {unsaved && (
                          <>
                            <span aria-hidden="true" className="bg-brand size-1.5 shrink-0 rounded-full" />
                            <span className="sr-only">, unsaved changes</span>
                          </>
                        )}
                      </span>
                      <span className="text-muted-foreground truncate text-[11px]">{r.description}</span>
                    </span>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px] tabular-nums">
                      <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} className="size-3" />
                      {count}
                      <span className="sr-only">{count === 1 ? 'member' : 'members'}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          title={`${role.name} permissions`}
          description={locked
            ? 'Administrators have every permission. This role can’t be changed.'
            : `${grantCount(grants)} of ${total} permissions granted. Create, edit, approve and delete need view.`}
          action={locked
            ? <span className="text-muted-foreground flex items-center gap-1 text-[11px]"><HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-3" /> Locked</span>
            : role.custom && <Button variant="ghost" size="sm" className="text-destructive" onClick={deleteRole}>Delete role</Button>}
          flush
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-xs">
              <caption className="sr-only">Permission matrix for the {role.name} role</caption>
              <thead>
                <tr className="text-muted-foreground border-b text-[11px]">
                  <th scope="col" className="px-3.5 py-2 text-left font-medium">Module</th>
                  {ACTIONS.map((a) => <th key={a} scope="col" className="w-16 px-2 py-2 text-center font-medium">{ACTION_LABEL[a]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y">
                {modules.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/30">
                    <th scope="row" className="px-3.5 py-2 text-left font-normal">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <ModuleMark icon={m.icon} colour={m.colour} size="sm" />
                        <span className="grid min-w-0">
                          <span className="truncate font-medium">{m.name}</span>
                          <span className="text-muted-foreground truncate text-[11px]">{m.pages.length} pages</span>
                        </span>
                      </span>
                    </th>
                    {ACTIONS.map((a) => (
                      <td key={a} className="px-2 py-2">
                        <Checkbox
                          className="mx-auto"
                          checked={grants[m.id]?.[a] ?? false}
                          disabled={locked}
                          onCheckedChange={(v) => toggle(m.id, a, v === true)}
                          aria-label={`${ACTION_LABEL[a]} in ${m.name}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3.5 py-2.5">
            {members.length ? (
              <>
                <div className="flex -space-x-1.5" aria-hidden="true">
                  {members.slice(0, 6).map((u) => <Initials key={u.id} name={String(u.name)} className="ring-card size-5 ring-2" />)}
                </div>
                <span className="text-muted-foreground min-w-0 truncate text-[11px]">
                  {members.slice(0, 2).map((u) => String(u.name)).join(', ')}
                  {members.length > 2 && ` and ${members.length - 2} more`}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-[11px]">No users have this role yet.</span>
            )}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => go('admin', 'users')}>Manage users</Button>
          </div>
        </Panel>
      </div>

      <NewRoleDialog open={creating} onOpenChange={setCreating} roles={roles} onCreate={createRole} />
    </>
  )
}

function NewRoleDialog({ open, onOpenChange, roles, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: RoleDef[]
  onCreate: (name: string, description: string, from: string) => void
}) {
  const id = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [from, setFrom] = useState('sales')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setFrom('sales')
    setError('')
  }, [open])

  function submit(e: FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return setError('Enter a role name.')
    if (roles.some((r) => r.name.toLowerCase() === clean.toLowerCase())) return setError('A role with this name already exists.')
    onCreate(clean, description.trim(), from)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>Start from an existing role's permissions, then adjust them in the permission matrix.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <FormField id={`${id}-name`} label="Role name" error={error}>
              <Input
                id={`${id}-name`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="Warehouse supervisor"
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-name-error` : undefined}
              />
            </FormField>
            <FormField id={`${id}-description`} label="Description">
              <Textarea id={`${id}-description`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What people with this role do" className="min-h-14" />
            </FormField>
            <FormField id={`${id}-from`} label="Copy permissions from">
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger id={`${id}-from`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create role</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Company settings ---------- */

type DocKey = 'quotation' | 'salesOrder' | 'purchaseOrder' | 'invoice'
type Numbering = { prefix: string; next: string }

const DOCS: { key: DocKey; label: string; entity: EntityId }[] = [
  { key: 'quotation', label: 'Quotations', entity: 'quotations' },
  { key: 'salesOrder', label: 'Sales orders', entity: 'salesOrders' },
  { key: 'purchaseOrder', label: 'Purchase orders', entity: 'purchaseOrders' },
  { key: 'invoice', label: 'Customer invoices', entity: 'invoices' },
]
const DEFAULT_PREFIX: Record<DocKey, string> = { quotation: 'QT-', salesOrder: 'SO-', purchaseOrder: 'PO-', invoice: 'INV-{YYYY}-' }

const CURRENCIES = [
  ['USD', 'US dollar'], ['SGD', 'Singapore dollar'], ['MYR', 'Malaysian ringgit'], ['IDR', 'Indonesian rupiah'],
  ['THB', 'Thai baht'], ['PHP', 'Philippine peso'], ['VND', 'Vietnamese dong'], ['EUR', 'Euro'], ['GBP', 'Pound sterling'],
  ['AUD', 'Australian dollar'],
] as const
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'D MMM YYYY']
const TIME_ZONES = [
  ['Asia/Singapore', '(UTC+08:00) Singapore'], ['Asia/Kuala_Lumpur', '(UTC+08:00) Kuala Lumpur'], ['Asia/Manila', '(UTC+08:00) Manila'],
  ['Asia/Jakarta', '(UTC+07:00) Jakarta'], ['Asia/Bangkok', '(UTC+07:00) Bangkok'], ['Asia/Ho_Chi_Minh', '(UTC+07:00) Ho Chi Minh City'],
  ['UTC', '(UTC+00:00) Coordinated Universal Time'],
] as const
const TIMEOUTS = [['15', '15 minutes'], ['30', '30 minutes'], ['60', '1 hour'], ['240', '4 hours'], ['480', '8 hours'], ['1440', '24 hours']] as const

type Settings = {
  legalName: string
  tradingName: string
  taxId: string
  email: string
  street: string
  city: string
  postalCode: string
  country: string
  logo: { name: string; url: string } | null
  currency: string
  // Month index, "0" = January.
  fiscalStart: string
  dateFormat: string
  timeZone: string
  numbering: Record<DocKey, Numbering>
  require2fa: boolean
  sso: boolean
  sessionTimeout: string
}

type Profile = Pick<Settings, 'taxId' | 'street' | 'city' | 'postalCode' | 'timeZone' | 'fiscalStart'>
const PROFILES: Record<string, Profile> = {
  'acme-sg': { taxId: '201912345K', street: '21 Kestrel Road, #05-12', city: 'Singapore', postalCode: '119962', timeZone: 'Asia/Singapore', fiscalStart: '0' },
  'acme-my': { taxId: 'W10-1808-32000123', street: '18 Jalan Cempaka 3', city: 'Port Klang', postalCode: '42000', timeZone: 'Asia/Kuala_Lumpur', fiscalStart: '0' },
  'acme-holdings': { taxId: '201700987M', street: '9 Orchid Walk, #20-01', city: 'Singapore', postalCode: '238877', timeZone: 'Asia/Singapore', fiscalStart: '3' },
}

const nextNumber = (rows: Row[]) => rows.reduce((n, r) => Math.max(n, Number(r.id.match(/(\d+)$/)?.[1] ?? 0)), 0) + 1
const numberPreview = ({ prefix, next }: Numbering) =>
  `${prefix.replaceAll('{YYYY}', TODAY.slice(0, 4))}${/^\d+$/.test(next) ? next.padStart(4, '0') : '····'}`

function sampleDate(format: string) {
  const [y, m, d] = TODAY.split('-')
  return format.replace('YYYY', y).replace('MMM', MONTHS[Number(m) - 1].slice(0, 3)).replace('MM', m).replace('DD', d).replace(/\bD\b/, String(Number(d)))
}

// The fiscal year that holds today, named by the year it ends in.
function fiscalYear(start: number) {
  const [y, m] = TODAY.split('-').map(Number)
  const startYear = m - 1 >= start ? y : y - 1
  const month = String(start + 1).padStart(2, '0')
  const to = addDays(`${startYear + 1}-${month}-01`, -1)
  return `FY${to.slice(0, 4)}: ${formatDate(`${startYear}-${month}-01`, true)} – ${formatDate(to, true)}`
}

function initialSettings(company: Company, data: Data): Settings {
  return {
    legalName: company.name,
    tradingName: company.name.replace(/\s+(Pte Ltd|Sdn Bhd)$/, ''),
    email: 'finance@acme.example.com',
    country: company.country,
    logo: null,
    currency: company.currency,
    dateFormat: 'DD/MM/YYYY',
    numbering: Object.fromEntries(DOCS.map((d) => [d.key, { prefix: DEFAULT_PREFIX[d.key], next: String(nextNumber(data[d.entity])) }])) as Record<DocKey, Numbering>,
    require2fa: false,
    sso: false,
    sessionTimeout: '480',
    ...(PROFILES[company.id] ?? PROFILES['acme-sg']),
  }
}

function validate(form: Settings) {
  const errors: Record<string, string> = {}
  if (!form.legalName.trim()) errors.legalName = 'Enter the legal name.'
  if (!form.taxId.trim()) errors.taxId = 'Enter the tax registration number.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.'
  for (const d of DOCS) {
    const n = form.numbering[d.key]
    if (!n.prefix.trim()) errors[`${d.key}-prefix`] = 'Enter a prefix.'
    if (!/^\d{1,9}$/.test(n.next) || Number(n.next) < 1) errors[`${d.key}-next`] = 'Enter a whole number.'
  }
  return errors
}

export function CompanySettings() {
  const { company } = useErp()
  if (!company) return <PageHeader title="Company settings" description="Choose a company first." />
  // A new key starts the form afresh when the company changes.
  return <CompanySettingsForm key={company.id} company={company} />
}

function CompanySettingsForm({ company }: { company: Company }) {
  const { data } = useErp()
  const id = useId()
  const [saved, setSaved] = useState(() => initialSettings(company, data))
  const [form, setForm] = useState(saved)
  const [attempted, setAttempted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const urls = useRef<string[]>([])
  const dirty = !same(form, saved)
  const errors = attempted ? validate(form) : {}
  const withMfa = data.users.filter((u) => u.mfa).length

  useEffect(() => {
    const created = urls.current
    return () => created.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setDoc(key: DocKey, patch: Partial<Numbering>) {
    setForm((f) => ({ ...f, numbering: { ...f.numbering, [key]: { ...f.numbering[key], ...patch } } }))
  }

  function pickLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return void toast.error('Choose an image file', { description: 'PNG, JPG or SVG, up to 2 MB.' })
    if (file.size > 2 * 1024 * 1024) return void toast.error('That image is over 2 MB', { description: 'Choose a smaller file.' })
    const url = URL.createObjectURL(file)
    urls.current.push(url)
    set('logo', { name: file.name, url })
  }

  function save() {
    const found = validate(form)
    setAttempted(true)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      toast.error('Check the highlighted fields')
      return
    }
    setSaved(form)
    setAttempted(false)
    toast.success('Company settings saved', { description: form.legalName })
  }

  const field = (key: string) => ({
    id: `${id}-${key}`,
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${id}-${key}-error` : undefined,
  })

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title="Company settings" description={`Legal details, localisation, document numbering and security for ${company.name}.`} />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-3 px-4 pb-6 @2xl:px-6">
        <Panel title="Company profile" description="Printed on quotations, sales orders, purchase orders and customer invoices.">
          <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
            <div className="flex min-w-0 items-center gap-3 @xl:col-span-2">
              <div className="bg-muted/40 grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed">
                {form.logo
                  ? <img src={form.logo.url} alt={`${form.tradingName || form.legalName} logo`} className="size-full object-contain" />
                  : <span className="text-sm font-semibold" style={{ color: company.colour }}>{company.short}</span>}
              </div>
              <div className="grid min-w-0 gap-1">
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <HugeiconsIcon icon={Upload04Icon} strokeWidth={2} data-icon="inline-start" />
                    {form.logo ? 'Replace logo' : 'Upload logo'}
                  </Button>
                  {form.logo && <Button variant="ghost" size="sm" onClick={() => set('logo', null)}>Remove</Button>}
                </div>
                <p className="text-muted-foreground truncate text-[11px]">{form.logo ? form.logo.name : 'PNG, JPG or SVG, up to 2 MB. Square works best.'}</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickLogo} />
            </div>
            <FormField id={`${id}-legalName`} label="Legal name" error={errors.legalName}>
              <Input {...field('legalName')} value={form.legalName} onChange={(e) => set('legalName', e.target.value)} />
            </FormField>
            <FormField id={`${id}-tradingName`} label="Trading name" hint="The name customers know you by, if it differs.">
              <Input {...field('tradingName')} value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} />
            </FormField>
            <FormField id={`${id}-taxId`} label="Tax registration number" error={errors.taxId} hint="Shown on tax invoices.">
              <Input {...field('taxId')} value={form.taxId} onChange={(e) => set('taxId', e.target.value)} className="font-mono" />
            </FormField>
            <FormField id={`${id}-email`} label="Billing email" error={errors.email}>
              <Input {...field('email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
            <FormField id={`${id}-street`} label="Address" className="@xl:col-span-2">
              <Input {...field('street')} value={form.street} onChange={(e) => set('street', e.target.value)} />
            </FormField>
            <div className="grid grid-cols-1 gap-3 @md:grid-cols-3 @xl:col-span-2">
              <FormField id={`${id}-city`} label="City">
                <Input {...field('city')} value={form.city} onChange={(e) => set('city', e.target.value)} />
              </FormField>
              <FormField id={`${id}-postalCode`} label="Postal code">
                <Input {...field('postalCode')} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} />
              </FormField>
              <FormField id={`${id}-country`} label="Country">
                <Input {...field('country')} value={form.country} onChange={(e) => set('country', e.target.value)} />
              </FormField>
            </div>
          </div>
        </Panel>

        <Panel title="Localisation" description="How money, dates and periods work for this company.">
          <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
            <FormField id={`${id}-currency`} label="Base currency" hint="The ledger and financial reports use it. Other currencies convert at the daily rate.">
              <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                <SelectTrigger id={`${id}-currency`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {CURRENCIES.map(([code, name]) => <SelectItem key={code} value={code}>{code} · {name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={`${id}-fiscalStart`} label="Fiscal year start" hint={fiscalYear(Number(form.fiscalStart))}>
              <Select value={form.fiscalStart} onValueChange={(v) => set('fiscalStart', v)}>
                <SelectTrigger id={`${id}-fiscalStart`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {MONTHS.map((m, i) => <SelectItem key={m} value={String(i)}>1 {m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={`${id}-dateFormat`} label="Date format" hint={`Today shows as ${sampleDate(form.dateFormat)}.`}>
              <Select value={form.dateFormat} onValueChange={(v) => set('dateFormat', v)}>
                <SelectTrigger id={`${id}-dateFormat`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {DATE_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id={`${id}-timeZone`} label="Time zone" hint="For due dates, reminders and the audit trail.">
              <Select value={form.timeZone} onValueChange={(v) => set('timeZone', v)}>
                <SelectTrigger id={`${id}-timeZone`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {TIME_ZONES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </Panel>

        <Panel title="Document numbering" description={<>Each new document takes the next number in its sequence. Use <code className="font-mono">{'{YYYY}'}</code> in a prefix for the year.</>} flush>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-xs">
              <thead>
                <tr className="text-muted-foreground border-b text-[11px]">
                  <th scope="col" className="px-3.5 py-2 text-left font-medium">Document</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Prefix</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Next number</th>
                  <th scope="col" className="px-3.5 py-2 text-left font-medium">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {DOCS.map((d) => {
                  const n = form.numbering[d.key]
                  const prefixError = errors[`${d.key}-prefix`]
                  const nextError = errors[`${d.key}-next`]
                  return (
                    <tr key={d.key} className="align-top">
                      <th scope="row" className="px-3.5 py-2.5 text-left font-medium">{d.label}</th>
                      <td className="px-2 py-2">
                        <Input {...field(`${d.key}-prefix`)} aria-label={`${d.label} prefix`} value={n.prefix} onChange={(e) => setDoc(d.key, { prefix: e.target.value })} className="w-32 font-mono" />
                        {prefixError && <p id={`${id}-${d.key}-prefix-error`} className="text-destructive mt-1 text-[11px]">{prefixError}</p>}
                      </td>
                      <td className="px-2 py-2">
                        <Input {...field(`${d.key}-next`)} aria-label={`${d.label} next number`} inputMode="numeric" value={n.next} onChange={(e) => setDoc(d.key, { next: e.target.value.trim() })} className="w-24 font-mono tabular-nums" />
                        {nextError && <p id={`${id}-${d.key}-next-error`} className="text-destructive mt-1 text-[11px]">{nextError}</p>}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11.5px] whitespace-nowrap">{numberPreview(n)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Security" description="Sign-in rules for every member of this company.">
          <div className="divide-y">
            <SwitchRow
              id={`${id}-2fa`}
              label="Require two-factor authentication (2FA)"
              description={`${withMfa} of ${data.users.length} users have set up 2FA. Turning this on asks the rest at their next sign-in.`}
              checked={form.require2fa}
              onChange={(v) => set('require2fa', v)}
            />
            <SwitchRow
              id={`${id}-sso`}
              label="Single sign-on (SSO)"
              description={form.sso
                ? <>Members sign in through your identity provider. <button type="button" onClick={() => go('admin', 'integrations')} className="text-foreground underline underline-offset-2">Set up the identity provider</button></>
                : 'Let members sign in with your identity provider (SAML). Administrators keep password sign-in.'}
              checked={form.sso}
              onChange={(v) => set('sso', v)}
            />
            <div className="grid gap-3 pt-3 @xl:grid-cols-[minmax(0,1fr)_14rem] @xl:items-center">
              <div className="grid gap-0.5">
                <Label htmlFor={`${id}-sessionTimeout`}>Session timeout</Label>
                <p className="text-muted-foreground text-[11px]">Members are signed out after this long without activity.</p>
              </div>
              <Select value={form.sessionTimeout} onValueChange={(v) => set('sessionTimeout', v)}>
                <SelectTrigger id={`${id}-sessionTimeout`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {TIMEOUTS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>
      </div>

      <div className="bg-background/90 sticky bottom-0 z-10 mt-auto border-t py-2.5 backdrop-blur">
        <div className="flex max-w-4xl flex-wrap items-center justify-end gap-2 px-4 @2xl:px-6">
          <p className="text-muted-foreground mr-auto text-xs" aria-live="polite">{dirty ? 'You have unsaved changes' : 'All changes saved'}</p>
          {dirty && (
            <Button variant="ghost" onClick={() => {
              setForm(saved)
              setAttempted(false)
            }}>
              Discard
            </Button>
          )}
          <Button disabled={!dirty} onClick={save}>Save changes</Button>
        </div>
      </div>
    </div>
  )
}

function SwitchRow({ id, label, description, checked, onChange }: {
  id: string
  label: string
  description: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
      <div className="grid min-w-0 gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-description`} className="text-muted-foreground text-[11px]">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-description`} className="mt-0.5" />
    </div>
  )
}

/* ---------- Integrations ---------- */

type Integration = {
  id: string
  name: string
  category: string
  description: string
  icon: IconSvgElement
  colour: string
  connected: boolean
  detail?: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'bank', name: 'Bank feed', category: 'Banking', icon: BankIcon, colour: 'oklch(0.62 0.12 200)', connected: true,
    description: 'Import bank transactions every day and match them to payments for bank reconciliation.',
    detail: 'Operating account ••4821 · last sync 12 min ago',
  },
  {
    id: 'smtp', name: 'Email (SMTP)', category: 'Communication', icon: Mail01Icon, colour: 'oklch(0.6 0.17 265)', connected: true,
    description: 'Send quotations, customer invoices and payment reminders from your own mail server.',
    detail: 'smtp.example.com:587 · TLS',
  },
  {
    id: 'payments', name: 'Payment gateway', category: 'Payments', icon: CreditCardIcon, colour: 'oklch(0.64 0.15 155)', connected: false,
    description: 'Add a pay-now link to customer invoices and record card payments automatically.',
  },
  {
    id: 'shipping', name: 'Shipping carrier', category: 'Logistics', icon: DeliveryTruck01Icon, colour: 'oklch(0.7 0.14 65)', connected: false,
    description: 'Book pickups, print shipping labels and track deliveries from the delivery order.',
  },
  {
    id: 'einvoice', name: 'E-invoicing network', category: 'Compliance', icon: Invoice02Icon, colour: 'oklch(0.64 0.16 35)', connected: true,
    description: 'Send and receive structured e-invoices through the national e-invoicing network.',
    detail: 'Registered participant · 14 documents this month',
  },
  {
    id: 'export', name: 'Accounting export', category: 'Finance', icon: FileExportIcon, colour: 'oklch(0.55 0.02 260)', connected: false,
    description: 'Send journal entries and the trial balance to your external accountant at each month end.',
  },
  {
    id: 'sso', name: 'Identity provider (SAML SSO)', category: 'Security', icon: FingerPrintIcon, colour: 'oklch(0.64 0.16 340)', connected: false,
    description: 'Let members use single sign-on and add or remove users from your directory automatically.',
  },
]

type ApiKey = { id: string; name: string; scope: string; last4: string; created: string; lastUsed: string }

const API_KEYS: ApiKey[] = [
  { id: 'key-1', name: 'Warehouse scanners', scope: 'Read and write', last4: '3f9a', created: '2026-03-14', lastUsed: '2026-10-01 09:42' },
  { id: 'key-2', name: 'BI dashboard', scope: 'Read only', last4: 'b71c', created: '2026-07-02', lastUsed: '2026-09-28 18:05' },
]

type Webhook = { id: string; url: string; events: string[]; enabled: boolean; lastDelivery: string }

const WEBHOOK_EVENTS = [
  'invoice.created', 'invoice.paid', 'invoice.overdue', 'sales_order.confirmed', 'purchase_order.approved',
  'goods_receipt.posted', 'item.below_reorder_point', 'leave_request.approved',
]

const WEBHOOKS: Webhook[] = [
  { id: 'wh-1', url: 'https://hooks.example.com/erp/receivables', events: ['invoice.paid', 'invoice.overdue'], enabled: true, lastDelivery: '200 OK · 4 min ago' },
  { id: 'wh-2', url: 'https://ops.example.com/webhooks/purchasing', events: ['purchase_order.approved', 'goods_receipt.posted'], enabled: true, lastDelivery: '200 OK · 1 hour ago' },
  { id: 'wh-3', url: 'https://example.com/hooks/inventory', events: ['item.below_reorder_point'], enabled: false, lastDelivery: '500 error · 3 days ago' },
]

const usedAt = (at: string) => (at ? `${formatDate(at.slice(0, 10))}, ${at.slice(11)}` : 'Never')

function makeKey() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `erp_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function Integrations() {
  const [apps, setApps] = useState(INTEGRATIONS)
  const [busy, setBusy] = useState<string | null>(null)
  const timer = useRef(0)
  const connected = apps.filter((a) => a.connected).length

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const patch = (appId: string, change: Partial<Integration>) => setApps((list) => list.map((a) => (a.id === appId ? { ...a, ...change } : a)))

  function connect(app: Integration) {
    setBusy(app.id)
    timer.current = window.setTimeout(() => {
      patch(app.id, { connected: true, detail: 'Connected just now' })
      setBusy(null)
      toast.success(`${app.name} connected`, { description: 'Demo only. No data leaves this browser.' })
    }, 900)
  }

  function disconnect(app: Integration) {
    patch(app.id, { connected: false })
    toast(`${app.name} disconnected`, { action: { label: 'Undo', onClick: () => patch(app.id, { connected: true }) } })
  }

  return (
    <>
      <PageHeader title="Integrations" description={`${connected} of ${apps.length} connected · Link the services your company already uses, and manage API access.`} />

      <div className="grid gap-6 px-4 pb-8 @2xl:px-6">
        <section aria-label="Connected services" className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {apps.map((app) => (
            <article key={app.id} className="bg-card flex min-w-0 flex-col gap-3 rounded-lg border p-3.5">
              <div className="flex items-start gap-3">
                <ModuleMark icon={app.icon} colour={app.colour} size="lg" />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <h3 className="truncate text-[13px] font-semibold">{app.name}</h3>
                  <p className="text-muted-foreground text-[11px]">{app.category}</p>
                </div>
                <StatusBadge status={app.connected ? 'Connected' : 'Disconnected'} />
              </div>
              <p className="text-muted-foreground text-xs">{app.description}</p>
              {app.connected && app.detail && <p className="text-muted-foreground truncate font-mono text-[11px]">{app.detail}</p>}
              <div className="mt-auto flex flex-wrap gap-1.5">
                {app.connected ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => toast(`${app.name} settings`, { description: 'Demo only. The connection settings open here.' })}>
                      Configure
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => disconnect(app)}>Disconnect</Button>
                  </>
                ) : (
                  <Button size="sm" disabled={busy !== null} onClick={() => connect(app)}>
                    {busy === app.id && <Spinner data-icon="inline-start" />}
                    {busy === app.id ? 'Connecting…' : 'Connect'}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-2">
          <ApiKeys />
          <Webhooks />
        </div>
      </div>
    </>
  )
}

function ApiKeys() {
  const [keys, setKeys] = useState(API_KEYS)
  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)

  return (
    <Panel
      title="API keys"
      description="For your own scripts and apps. Keys act with the permissions of the scope you choose."
      action={
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Create key
        </Button>
      }
      flush
      className="self-start"
    >
      {keys.length ? (
        <ul className="divide-y">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-2.5">
              <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                  <span className="truncate">{k.name}</span>
                  <span className="text-muted-foreground shrink-0 rounded border px-1 text-[10px] font-normal">{k.scope}</span>
                </span>
                <code className="text-muted-foreground truncate font-mono text-[11px]">erp_••••••••••••{k.last4}</code>
              </div>
              <div className="text-muted-foreground grid text-[11px] tabular-nums @xl:text-right">
                <span>Created {formatDate(k.created)}</span>
                <span>Last used {usedAt(k.lastUsed)}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRevoking(k)}>Revoke</Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground px-3.5 py-6 text-center text-xs">No API keys. Create one to connect your own apps.</p>
      )}

      <CreateKeyDialog open={creating} onOpenChange={setCreating} onCreate={(k) => setKeys((list) => [...list, k])} />

      <AlertDialog open={!!revoking} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Apps that use this key stop working straight away. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => {
              if (!revoking) return
              setKeys((list) => list.filter((k) => k.id !== revoking.id))
              toast(`Revoked ${revoking.name}`)
            }}>
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  )
}

function CreateKeyDialog({ open, onOpenChange, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (key: ApiKey) => void
}) {
  const id = useId()
  const [name, setName] = useState('')
  const [scope, setScope] = useState('Read only')
  const [error, setError] = useState('')
  const [secret, setSecret] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setScope('Read only')
    setError('')
    setSecret(null)
  }, [open])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a name for the key.')
    const token = makeKey()
    onCreate({ id: `key-${Date.now()}`, name: name.trim(), scope, last4: token.slice(-4), created: TODAY, lastUsed: '' })
    setSecret(token)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {secret ? (
          <div className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Copy your API key</DialogTitle>
              <DialogDescription>For security you won’t see this key again. Store it in your app’s secrets, not in code.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-1.5">
              <Input readOnly value={secret} aria-label="New API key" className="font-mono" onFocus={(e) => e.currentTarget.select()} />
              <Button variant="outline" onClick={() => {
                navigator.clipboard?.writeText(secret).catch(() => {})
                toast.success('API key copied')
              }}>
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>Name it after the app that will use it, so you know what breaks if you revoke it.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <FormField id={`${id}-name`} label="Key name" error={error}>
                <Input
                  id={`${id}-name`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="Warehouse scanners"
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-name-error` : undefined}
                />
              </FormField>
              <FormField id={`${id}-scope`} label="Scope">
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger id={`${id}-scope`} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Read only">Read only</SelectItem>
                    <SelectItem value="Read and write">Read and write</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create key</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Webhooks() {
  const [hooks, setHooks] = useState(WEBHOOKS)
  const [adding, setAdding] = useState(false)
  const patch = (hookId: string, change: Partial<Webhook>) => setHooks((list) => list.map((h) => (h.id === hookId ? { ...h, ...change } : h)))

  function remove(hook: Webhook) {
    setHooks((list) => list.filter((h) => h.id !== hook.id))
    toast('Endpoint deleted', {
      description: hook.url,
      action: { label: 'Undo', onClick: () => setHooks((list) => (list.some((h) => h.id === hook.id) ? list : [...list, hook])) },
    })
  }

  return (
    <Panel
      title="Webhooks"
      description="We send a signed POST request to each endpoint when one of its events happens."
      action={
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          Add endpoint
        </Button>
      }
      flush
      className="self-start"
    >
      {hooks.length ? (
        <ul className="divide-y">
          {hooks.map((h) => (
            <li key={h.id} className="grid gap-2 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon icon={WebhookIcon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
                <code className="min-w-0 flex-1 truncate font-mono text-[11.5px]" title={h.url}>{h.url}</code>
                <StatusBadge status={h.enabled ? 'Active' : 'Inactive'} />
                <Switch
                  checked={h.enabled}
                  onCheckedChange={(on) => {
                    patch(h.id, { enabled: on })
                    toast(on ? 'Endpoint enabled' : 'Endpoint paused', { description: h.url })
                  }}
                  aria-label={`Send events to ${h.url}`}
                />
              </div>
              <div className="flex flex-wrap gap-1 pl-6">
                {h.events.map((e) => <code key={e} className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10.5px]">{e}</code>)}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6">
                <span className="text-muted-foreground text-[11px]">Last delivery: {h.lastDelivery}</span>
                <span className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" disabled={!h.enabled} onClick={() => {
                    patch(h.id, { lastDelivery: '200 OK · just now' })
                    toast.success('Test event sent', { description: `${h.events[0]} → 200 OK` })
                  }}>
                    <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
                    Send test
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete endpoint ${h.url}`} onClick={() => remove(h)}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground px-3.5 py-6 text-center text-xs">No endpoints. Add one to get events as they happen.</p>
      )}

      <AddEndpointDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={(hook) => {
          setHooks((list) => [...list, hook])
          setAdding(false)
          toast.success('Endpoint added', { description: `${hook.events.length} ${hook.events.length === 1 ? 'event' : 'events'} → ${hook.url}` })
        }}
      />
    </Panel>
  )
}

function AddEndpointDialog({ open, onOpenChange, onAdd }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (hook: Webhook) => void
}) {
  const id = useId()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(['invoice.paid'])
  const [errors, setErrors] = useState<{ url?: string; events?: string }>({})

  useEffect(() => {
    if (!open) return
    setUrl('')
    setEvents(['invoice.paid'])
    setErrors({})
  }, [open])

  function submit(e: FormEvent) {
    e.preventDefault()
    const found: typeof errors = {}
    if (!/^https:\/\/[^\s/]+\.[^\s]+$/.test(url.trim())) found.url = 'Enter an HTTPS URL, such as https://example.com/webhooks.'
    if (!events.length) found.events = 'Choose at least one event.'
    setErrors(found)
    if (found.url) return document.getElementById(`${id}-url`)?.focus()
    if (found.events) return
    onAdd({ id: `wh-${Date.now()}`, url: url.trim(), events: WEBHOOK_EVENTS.filter((ev) => events.includes(ev)), enabled: true, lastDelivery: 'No deliveries yet' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add webhook endpoint</DialogTitle>
            <DialogDescription>Choose the events to send. Each request is signed, so your server can check it came from us.</DialogDescription>
          </DialogHeader>
          <FormField id={`${id}-url`} label="Endpoint URL" error={errors.url}>
            <Input
              id={`${id}-url`}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/erp"
              className="font-mono"
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? `${id}-url-error` : undefined}
            />
          </FormField>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-xs font-medium">Events</legend>
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <label key={ev} className="flex min-w-0 items-center gap-2 text-xs">
                  <Checkbox
                    checked={events.includes(ev)}
                    onCheckedChange={(on) => {
                      setEvents((list) => (on === true ? [...list, ev] : list.filter((x) => x !== ev)))
                      setErrors((s) => ({ ...s, events: undefined }))
                    }}
                  />
                  <code className="truncate font-mono text-[11px]">{ev}</code>
                </label>
              ))}
            </div>
            {errors.events && <p className="text-destructive text-[11px]">{errors.events}</p>}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add endpoint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
