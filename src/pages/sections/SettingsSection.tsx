import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  CreditCardIcon, Delete02Icon, Download01Icon, Mail01Icon, MailSend01Icon, MoreHorizontalIcon,
  Notification03Icon, Search01Icon, SentIcon, SmartPhone01Icon, UserAdd01Icon, UserGroupIcon, UserIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { UserAvatar } from '@/components/person'
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

type Member = { id: string; name: string; email: string; role: Role; status: 'active' | 'invited'; you?: boolean }
const MEMBERS: Member[] = [
  { id: 'alex', name: 'Alex Morgan', email: 'alex@example.com', role: 'admin', status: 'active', you: true },
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
            {PAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPage(p.id)}
                aria-current={page === p.id ? 'page' : undefined}
                className="text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground focus-visible:ring-ring/30 flex h-7 shrink-0 items-center gap-2 rounded-md px-2 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-2"
              >
                <HugeiconsIcon icon={p.icon} strokeWidth={2} className="size-3.5" />
                {p.label}
              </button>
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

function Dot({ className }: { className: string }) {
  return <span className={`size-1.5 rounded-full ${className}`} />
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
        <Avatar size="lg">
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
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

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="grid gap-1">
          <Label htmlFor="settings-weekly">Weekly summary email</Label>
          <p className="text-muted-foreground text-[11px]">Every Monday: what shipped, what slipped and what is next.</p>
        </div>
        <Switch id="settings-weekly" defaultChecked />
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  )
}

/* ---------- Members ---------- */

function MembersPage({ members, setMembers }: {
  members: Member[]
  setMembers: (update: (members: Member[]) => Member[]) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = members.filter((m) => m.name.toLowerCase().includes(q) || m.email.includes(q))

  function setRole(member: Member, role: Role) {
    setMembers((all) => all.map((m) => (m.id === member.id ? { ...m, role } : m)))
    toast.success(`${member.name} is now ${ROLES.find((r) => r.id === role)?.label}`, {
      description: 'Demo only. Nothing was saved.',
    })
  }

  function remove(member: Member) {
    const index = members.findIndex((m) => m.id === member.id)
    setMembers((all) => all.filter((m) => m.id !== member.id))
    toast(`${member.name} removed`, {
      description: 'Demo only. Nothing was saved.',
      action: {
        label: 'Undo',
        onClick: () => setMembers((all) => [...all.slice(0, index), member, ...all.slice(index)]),
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        title="Members"
        description={`${members.length} of ${SEATS} seats used.`}
        actions={<InviteDialog />}
        size="sm"
        as="h3"
        className="border-b pb-4"
      />

      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search members"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      <div className="min-w-0 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 px-3">Member</TableHead>
              <TableHead className="hidden h-8 sm:table-cell">Email</TableHead>
              <TableHead className="h-8">Role</TableHead>
              <TableHead className="h-8">Status</TableHead>
              <TableHead className="h-8 w-10"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="px-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={m.name} />
                    <div className="grid min-w-0">
                      <span className="font-medium">
                        {m.name}
                        {m.you && <span className="text-muted-foreground font-normal"> (you)</span>}
                      </span>
                      <span className="text-muted-foreground text-[11px] sm:hidden">{m.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{m.email}</TableCell>
                <TableCell>
                  <Select value={m.role} onValueChange={(v) => setRole(m, v as Role)} disabled={m.you}>
                    <SelectTrigger size="sm" className="w-24" aria-label={`Role for ${m.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Dot className={m.status === 'active' ? 'bg-status-done' : 'bg-status-progress'} />
                    {m.status === 'active' ? 'Active' : 'Invited'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`}>
                        <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        disabled={m.status !== 'invited'}
                        onSelect={() => toast(DEMO, { description: `The invite to ${m.email} was not resent.` })}
                      >
                        <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} />
                        Resend invite
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" disabled={m.you} onSelect={() => remove(m)}>
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-muted-foreground h-16 text-center">
                  No members match “{query.trim()}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function InviteDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setOpen(false)
            toast(DEMO, { description: 'In a real app, the person would get an email invite.' })
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite people</DialogTitle>
            <DialogDescription>They get an email with a link to join this workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" placeholder="name@example.com" autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select defaultValue="member">
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" />
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

const number = new Intl.NumberFormat('en-US')

function BillingPage({ seats }: { seats: number }) {
  const usage = [
    { label: 'Members', used: seats, limit: SEATS, unit: '', note: `${SEATS - seats} seats left` },
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
              <div key={u.label} className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground text-[11px]">{u.label}</span>
                  <span className="text-muted-foreground text-[11px] tabular-nums">{pct}%</span>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {number.format(u.used)} <span className="text-muted-foreground font-normal">/ {number.format(u.limit)}{u.unit}</span>
                </span>
                <Progress value={pct} aria-label={`${u.label} used`} />
                <span className="text-muted-foreground text-[11px]">{u.note}</span>
              </div>
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
                    <Badge variant="outline">
                      <Dot className={inv.status === 'paid' ? 'bg-status-done' : 'bg-status-todo'} />
                      {inv.status === 'paid' ? 'Paid' : 'Refunded'}
                    </Badge>
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
        <section key={c.id} aria-labelledby={`notif-${c.id}`} className="overflow-hidden rounded-lg border">
          <header className="bg-subtle flex items-center gap-2 border-b px-3 py-2">
            <HugeiconsIcon icon={c.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
            <h4 id={`notif-${c.id}`} className="text-xs font-medium">{c.title}</h4>
            <span className="text-muted-foreground truncate text-[11px]">{c.description}</span>
          </header>
          {c.items.map((item) => {
            const id = `notif-${c.id}-${item.id}`
            return (
              <div key={item.id} className="flex items-start justify-between gap-4 border-b px-3 py-2.5 last:border-b-0">
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor={id} className="font-normal">{item.label}</Label>
                  <p className="text-muted-foreground text-[11px]">{item.hint}</p>
                </div>
                <Switch id={id} defaultChecked={item.on} />
              </div>
            )
          })}
        </section>
      ))}

      <p className="text-muted-foreground text-[11px]">Demo only. These switches are not saved.</p>
    </div>
  )
}
