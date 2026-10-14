import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  CreditCardIcon, Download01Icon, Mail01Icon, Notification03Icon, SmartPhone01Icon, UserAdd01Icon, UserGroupIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { InviteMembersDialog } from '@/blocks/invite-members-dialog'
import { MembersTable, type OrgMember } from '@/blocks/members-table'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { NavItem } from '@/components/nav-item'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { UserAvatar } from '@/components/person'
import { StatusBadge } from '@/components/status-badge'
import { UsageMeter } from '@/components/usage-meter'
import { formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { Section } from './shared'

const DEMO = 'Demo only. Nothing was sent.'

type Page = 'profile' | 'members' | 'billing' | 'notifications'
const PAGES: { id: Page; label: string; icon: IconSvgElement }[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'members', label: 'Members', icon: UserGroupIcon },
  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
  { id: 'notifications', label: 'Notifications', icon: Notification03Icon },
]

type Role = 'admin' | 'member' | 'guest'
const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Admin' },
  { id: 'member', label: 'Member' },
  { id: 'guest', label: 'Guest' },
]

const MEMBERS: OrgMember[] = [
  { id: 'alex', name: 'Alex Morgan', email: 'alex@example.com', role: 'admin', status: 'active', isYou: true },
  { id: 'meiling', name: 'Mei Ling', email: 'meiling@example.com', role: 'admin', status: 'active' },
  { id: 'ravi', name: 'Ravi', email: 'ravi@example.com', role: 'member', status: 'active' },
  { id: 'daniel', name: 'Daniel', email: 'daniel@example.com', role: 'member', status: 'active' },
  { id: 'siti', name: 'Siti', email: 'siti@example.com', role: 'member', status: 'active' },
  { id: 'ali', name: 'Ali', email: 'ali@example.com', role: 'guest', status: 'active' },
  { id: 'priya', name: 'Priya', email: 'priya@example.com', role: 'member', status: 'invited' },
]
const SEATS = 10

export default function SettingsSection() {
  const [page, setPage] = useState<Page>('profile')
  // Kept here so members removed on one page stay removed on the others.
  const [members, setMembers] = useState(MEMBERS)

  return (
    <Section id="settings" title="Settings" description="Profile, members and billing pages">
      <article className="bg-card min-w-0 overflow-hidden rounded-lg border lg:col-span-2">
        <div className="flex min-w-0 flex-col md:flex-row">
          <nav
            aria-label="Settings pages"
            className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:w-48 md:flex-col md:overflow-visible md:border-r md:border-b-0"
          >
            <p className="text-muted-foreground hidden px-2 pt-1 pb-1.5 text-[11px] font-medium md:block">Settings</p>
            {/* Recoloured for a card, and only as wide as the label in the phone's row. */}
            {PAGES.map((p) => (
              <NavItem
                key={p.id}
                icon={p.icon}
                label={p.label}
                active={page === p.id}
                onClick={() => setPage(p.id)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground focus-visible:ring-ring/30 w-auto shrink-0 font-medium md:w-full"
              />
            ))}
          </nav>

          <div className="min-w-0 flex-1 p-4 md:p-5">
            {page === 'profile' && <ProfilePage />}
            {page === 'members' && <MembersPage members={members} setMembers={setMembers} />}
            {page === 'billing' && <BillingPage seats={members.length} />}
            {page === 'notifications' && <NotificationsPage />}
          </div>
        </div>
      </article>
    </Section>
  )
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 text-xs font-medium">{children}</h4>
}

/* ---------- Profile ---------- */

const TIMEZONES = [
  { id: 'la', label: '(GMT−08:00) Los Angeles' },
  { id: 'ny', label: '(GMT−05:00) New York' },
  { id: 'london', label: '(GMT+00:00) London' },
  { id: 'berlin', label: '(GMT+01:00) Berlin' },
  { id: 'singapore', label: '(GMT+08:00) Singapore' },
  { id: 'tokyo', label: '(GMT+09:00) Tokyo' },
  { id: 'sydney', label: '(GMT+10:00) Sydney' },
]

function ProfilePage() {
  return (
    <form
      className="grid grid-cols-1 max-w-xl gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        toast.success('Profile saved', { description: DEMO })
      }}
    >
      <PageHeader title="Profile" description="How you appear to your teammates." size="sm" as="h3" className="border-b pb-4" />

      <div className="flex flex-wrap items-center gap-3">
        <UserAvatar name="Alex Morgan" className="size-10 *:data-[slot=avatar-fallback]:text-sm" />
        <div className="grid gap-1">
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => toast('Demo only. No photo was uploaded.')}>
              Change
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => toast('Demo only. Nothing was removed.')}>
              Remove
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px]">PNG or JPG, at least 256 × 256 px.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="settings-name">Full name</Label>
          <Input id="settings-name" defaultValue="Alex Morgan" autoComplete="off" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" type="email" defaultValue="you@example.com" autoComplete="off" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="settings-tz">Timezone</Label>
        <Select defaultValue="singapore">
          <SelectTrigger id="settings-tz" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.id} value={tz.id}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-[11px]">Due dates and reminders use this timezone.</p>
      </div>

      <Field orientation="horizontal" className="gap-4 rounded-lg border p-3">
        <FieldContent>
          <FieldLabel htmlFor="settings-weekly">Weekly summary email</FieldLabel>
          <FieldDescription className="text-[11px]">Every Monday: what shipped, what slipped and what is next.</FieldDescription>
        </FieldContent>
        <Switch id="settings-weekly" defaultChecked />
      </Field>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  )
}

/* ---------- Members ---------- */

function MembersPage({ members, setMembers }: {
  members: OrgMember[]
  setMembers: (update: (members: OrgMember[]) => OrgMember[]) => void
}) {
  const [inviting, setInviting] = useState(false)
  const roleLabel = (id: string) => ROLES.find((r) => r.id === id)?.label

  function setRole(ids: string[], role: string) {
    const changed = members.filter((m) => ids.includes(m.id))
    setMembers((all) => all.map((m) => (ids.includes(m.id) ? { ...m, role } : m)))
    toast.success(
      changed.length === 1 ? `${changed[0].name || changed[0].email} is now ${roleLabel(role)}` : `${plural(changed.length, 'member')} are now ${roleLabel(role)}`,
      { description: 'Demo only. Nothing was saved.' },
    )
  }

  function remove(ids: string[]) {
    const removed = members.flatMap((m, index) => (ids.includes(m.id) ? [{ m, index }] : []))
    setMembers((all) => all.filter((m) => !ids.includes(m.id)))
    toast(removed.length === 1 ? `${removed[0].m.name || removed[0].m.email} removed` : `${plural(removed.length, 'member')} removed`, {
      description: 'Demo only. Nothing was saved.',
      action: {
        label: 'Undo',
        onClick: () => setMembers((all) => {
          const next = [...all]
          for (const { m, index } of removed) if (!next.some((x) => x.id === m.id)) next.splice(index, 0, m)
          return next
        }),
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        title="Members"
        description={`${members.length} of ${SEATS} seats used.`}
        actions={
          <Button onClick={() => setInviting(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Invite
          </Button>
        }
        size="sm"
        as="h3"
        className="border-b pb-4"
      />

      <MembersTable
        members={members}
        roles={ROLES}
        adminRoles={['admin']}
        onRoleChange={setRole}
        onRemove={remove}
        onResend={(id) => toast(DEMO, { description: `The invite to ${members.find((m) => m.id === id)?.email} was not resent.` })}
      />

      <InviteMembersDialog
        open={inviting}
        onOpenChange={setInviting}
        roles={ROLES}
        defaultRole="member"
        description="They get an email with a link to join this workspace."
        existingEmails={members.map((m) => m.email)}
        seatsLeft={SEATS - members.length}
        onInvite={(emails, role) => {
          setMembers((all) => [
            ...all,
            ...emails.map((email): OrgMember => ({ id: `invite-${email}`, name: '', email, role, status: 'invited' })),
          ])
          toast(DEMO, { description: `In a real app, ${plural(emails.length, 'person', 'people')} would get an email invite.` })
        }}
      />
    </div>
  )
}

/* ---------- Billing ---------- */

const PRICE = 8

const INVOICES = [
  { id: 'INV-0012', date: '1 Sep 2026', amount: 56, status: 'paid' },
  { id: 'INV-0011', date: '1 Aug 2026', amount: 48, status: 'paid' },
  { id: 'INV-0010', date: '1 Jul 2026', amount: 48, status: 'paid' },
  { id: 'INV-0009', date: '1 Jun 2026', amount: 40, status: 'refunded' },
] as const

function BillingPage({ seats }: { seats: number }) {
  const usage = [
    { label: 'Members', used: seats, limit: SEATS, unit: '', note: `${plural(SEATS - seats, 'seat')} left` },
    { label: 'Storage', used: 12, limit: 50, unit: ' GB', note: 'Files and attachments' },
    { label: 'API calls', used: 68_400, limit: 100_000, unit: '', note: 'Resets on 1 Oct' },
  ]

  return (
    <div className="grid grid-cols-1 gap-5">
      <PageHeader title="Billing" description="Your plan, usage, payment method and invoices." size="sm" as="h3" className="border-b pb-4" />

      <div className="bg-subtle flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5">
        <div className="grid min-w-0 gap-0.5">
          <p className="text-xs">
            <span className="font-semibold">Team plan</span>
            <span className="text-muted-foreground"> · ${PRICE} per member / month</span>
          </p>
          <p className="text-muted-foreground text-[11px]">
            Renews on 1 Nov 2026 · {seats} members · ${seats * PRICE}.00 a month
          </p>
        </div>
        <Button variant="outline" onClick={() => toast('Demo only. Your plan did not change.')}>
          Change plan
        </Button>
      </div>

      <div>
        <SubHeading>Usage this month</SubHeading>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {usage.map((u) => {
            const pct = Math.round((u.used / u.limit) * 100)
            return (
              <UsageMeter
                key={u.label}
                value={pct}
                label={u.label}
                count={`${pct}%`}
                amount={
                  <>
                    {formatNumber(u.used)}{' '}
                    <span className="text-muted-foreground font-normal">/ {formatNumber(u.limit)}{u.unit}</span>
                  </>
                }
                note={u.note}
                className="gap-2 rounded-lg border p-3"
              />
            )
          })}
        </div>
      </div>

      <div>
        <SubHeading>Payment method</SubHeading>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-md">
              <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium">Card •••• 4242 · expires 08/28</p>
              <p className="text-muted-foreground truncate text-[11px]">Receipts go to billing@example.com</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast(DEMO, { description: 'This demo has no card form.' })}
          >
            Update
          </Button>
        </div>
      </div>

      <div>
        <SubHeading>Invoices</SubHeading>
        <div className="min-w-0 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden h-8 px-3 sm:table-cell">Invoice</TableHead>
                <TableHead className="h-8 px-3 sm:px-2">Date</TableHead>
                <TableHead className="h-8 text-right">Amount</TableHead>
                <TableHead className="h-8">Status</TableHead>
                <TableHead className="h-8 w-10"><span className="sr-only">Download</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-muted-foreground hidden px-3 tabular-nums sm:table-cell">{inv.id}</TableCell>
                  <TableCell className="px-3 sm:px-2">{inv.date}</TableCell>
                  <TableCell className="text-right tabular-nums">${inv.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusBadge variant="outline" tone={inv.status === 'paid' ? 'success' : 'neutral'}>
                      {inv.status === 'paid' ? 'Paid' : 'Refunded'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Download ${inv.id}`}
                      onClick={() => toast('Demo only. Nothing was downloaded.', { description: `${inv.id} · ${inv.date}` })}
                    >
                      <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

/* ---------- Notifications ---------- */

const CHANNELS: {
  id: string
  title: string
  description: string
  icon: IconSvgElement
  items: { id: string; label: string; hint: string; on: boolean }[]
}[] = [
  {
    id: 'email', title: 'Email', description: 'Sent to you@example.com', icon: Mail01Icon,
    items: [
      { id: 'mentions', label: 'Mentions and replies', hint: 'Someone @mentions you or replies to your comment.', on: true },
      { id: 'assigned', label: 'Assigned to me', hint: 'An issue or project is given to you.', on: true },
      { id: 'product', label: 'Product updates', hint: 'A short note when new features ship.', on: false },
    ],
  },
  {
    id: 'push', title: 'Push', description: 'On your phone and desktop', icon: SmartPhone01Icon,
    items: [
      { id: 'mentions', label: 'Mentions and replies', hint: 'Straight away, even when the app is closed.', on: true },
      { id: 'reminders', label: 'Due date reminders', hint: 'The morning something is due.', on: true },
      { id: 'status', label: 'Status changes', hint: 'Work you follow moves to a new status.', on: false },
    ],
  },
  {
    id: 'inapp', title: 'In-app', description: 'The inbox in the sidebar', icon: Notification03Icon,
    items: [
      { id: 'activity', label: 'All activity on my projects', hint: 'New issues, comments and updates.', on: true },
      { id: 'comments', label: 'Comments on issues I follow', hint: 'Including issues you created.', on: true },
      { id: 'digest', label: 'Group into a daily digest', hint: 'One notification a day instead of many.', on: false },
    ],
  },
]

function NotificationsPage() {
  return (
    <div className="grid grid-cols-1 max-w-2xl gap-4">
      <PageHeader title="Notifications" description="Choose what reaches you, and where." size="sm" as="h3" className="border-b pb-4" />

      {CHANNELS.map((c) => (
        <Panel
          key={c.id}
          as="section"
          headingAs="h4"
          title={
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={c.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
              {c.title}
            </span>
          }
          note={c.description}
          bodyClassName="divide-y p-0"
        >
          {c.items.map((item) => {
            const id = `notif-${c.id}-${item.id}`
            return (
              <Field key={item.id} orientation="horizontal" className="gap-4 px-3.5 py-2.5">
                <FieldContent>
                  <FieldLabel htmlFor={id} className="font-normal">{item.label}</FieldLabel>
                  <FieldDescription className="text-[11px]">{item.hint}</FieldDescription>
                </FieldContent>
                <Switch id={id} defaultChecked={item.on} />
              </Field>
            )
          })}
        </Panel>
      ))}

      <p className="text-muted-foreground text-[11px]">Demo only. These switches are not saved.</p>
    </div>
  )
}
