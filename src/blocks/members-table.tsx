import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon, MailSend01Icon, MoreHorizontalIcon, UserBlock01Icon, UserCheck01Icon, UserGroupIcon,
  UserRemove01Icon, UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { UserAvatar } from '@/components/person'
import { SearchField } from '@/components/search-field'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatAgo } from '@/lib/format'
import { plural } from '@/lib/text'

// The people in an organisation or workspace, as an admin console lists
// them: a search, filter chips (All, Admins, Members, Invited, Suspended)
// with their counts, and a row per member with their role, groups, status
// and when they were last active. Each row's menu changes the role, adds
// them to groups, resends a pending invite, suspends or reactivates them,
// and removes them (after a confirm). Pick rows to change the role of, or
// remove, several at once.
//
// The owner can't be demoted or removed, and you can't change or remove
// yourself. `canManage` says which other rows the viewer may change (an
// admin may manage members, a member no one). The block measures its own
// box (@container): a table from 42rem wide, cards below that.

export type OrgMemberStatus = 'active' | 'invited' | 'suspended'

export type OrgMember = {
  id: string
  // Empty for an invite to someone who has not joined yet: the email stands in.
  name: string
  email: string
  role: string
  status: OrgMemberStatus
  // Group ids.
  groups?: string[]
  lastActiveAt?: Date | number
  // When they joined, or for an invite, when it was sent.
  joinedAt?: Date | number
  // Signs in through the organisation's identity provider (SSO).
  sso?: boolean
  // The signed-in person.
  isYou?: boolean
}

export type MemberRoleOption = { id: string; label: string; hint?: string }
export type MemberGroupOption = { id: string; name: string }

export type MembersFilter = 'all' | 'admins' | 'members' | 'invited' | 'suspended'

export type MembersTableProps = {
  members: OrgMember[]
  roles: MemberRoleOption[]
  // The groups a member can be added to. Left out: no Groups column or menu.
  groups?: MemberGroupOption[]
  // One member from a row, or several from the bulk bar.
  onRoleChange: (memberIds: string[], role: string) => void
  // Removes members, or cancels pending invites, after the confirm.
  onRemove: (memberIds: string[]) => void
  onResend?: (memberId: string) => void
  // true suspends, false reactivates.
  onSuspend?: (memberId: string, suspended: boolean) => void
  onGroupsChange?: (memberId: string, groups: string[]) => void
  // Whether the viewer may change this member. Everyone when left out.
  canManage?: (member: OrgMember) => boolean
  // The role that owns the organisation: never demoted or removed here.
  ownerRole?: string
  // The roles the Admins chip counts.
  adminRoles?: string[]
  // The organisation's email domain: other addresses are marked External.
  domain?: string
  // The time "last active" is counted from. Pass a fixed one for demos.
  now?: Date | number
  // More buttons after the search.
  actions?: ReactNode
  className?: string
}

const STATUS: Record<OrgMemberStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  invited: { label: 'Invited', tone: 'progress' },
  suspended: { label: 'Suspended', tone: 'danger' },
}

const displayName = (m: OrgMember) => m.name || m.email
const isExternal = (email: string, domain?: string) =>
  !!domain && !email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)

type Confirm = { ids: string[]; title: string; description: string; label: string }

export function MembersTable({
  members, roles, groups, onRoleChange, onRemove, onResend, onSuspend, onGroupsChange, canManage = () => true,
  ownerRole = 'owner', adminRoles = ['owner', 'admin'], domain, now = Date.now(), actions, className,
}: MembersTableProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MembersFilter>('all')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  // Kept after closing, so the dialog's text holds while it fades out.
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // The button that opened the confirm, to go back to on Cancel.
  const opener = useRef<HTMLElement | null>(null)
  const remember = (e: { currentTarget: HTMLElement }) => { opener.current = e.currentTarget }

  const roleLabel = (id: string) => roles.find((r) => r.id === id)?.label ?? id
  const groupName = (id: string) => groups?.find((g) => g.id === id)?.name
  const assignable = roles.filter((r) => r.id !== ownerRole)
  const isOwner = (m: OrgMember) => m.role === ownerRole
  // Rows the viewer can change: never the owner, never yourself.
  const editable = (m: OrgMember) => !isOwner(m) && !m.isYou && canManage(m)

  const q = query.trim().toLowerCase()
  const matching = q
    ? members.filter((m) => [m.name, m.email, roleLabel(m.role), ...(m.groups ?? []).map((g) => groupName(g) ?? '')]
      .some((t) => t.toLowerCase().includes(q)))
    : members

  const inFilter: Record<MembersFilter, (m: OrgMember) => boolean> = {
    all: () => true,
    admins: (m) => adminRoles.includes(m.role),
    members: (m) => !adminRoles.includes(m.role),
    invited: (m) => m.status === 'invited',
    suspended: (m) => m.status === 'suspended',
  }
  const chips: { value: MembersFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'admins', label: 'Admins' },
    { value: 'members', label: 'Members' },
    { value: 'invited', label: 'Invited' },
    { value: 'suspended', label: 'Suspended' },
  ]
  const shown = matching.filter(inFilter[filter])

  const picked = members.filter((m) => selected.has(m.id) && editable(m))
  const pickable = shown.filter(editable)
  const allPicked = pickable.length > 0 && pickable.every((m) => selected.has(m.id))
  const somePicked = pickable.some((m) => selected.has(m.id))
  const toggle = (id: string, on: boolean) => setSelected((s) => {
    const next = new Set(s)
    if (on) next.add(id)
    else next.delete(id)
    return next
  })
  const clear = () => setSelected(new Set())

  const askRemove = (list: OrgMember[]) => {
    if (!list.length) return
    const one = list.length === 1 ? list[0] : undefined
    const invites = list.every((m) => m.status === 'invited')
    setConfirmOpen(true)
    setConfirm(one
      ? one.status === 'invited'
        ? {
          ids: [one.id], title: `Cancel the invite to ${one.email}?`, label: 'Cancel invite',
          description: 'The link in their email stops working, and the seat is free again.',
        }
        : {
          ids: [one.id], title: `Remove ${displayName(one)} from the organisation?`, label: 'Remove',
          description: 'They lose access straight away and their seat is freed. Their chats and projects stay with the organisation.',
        }
      : {
        ids: list.map((m) => m.id),
        title: invites ? `Cancel ${plural(list.length, 'invite')}?` : `Remove ${plural(list.length, 'member')}?`,
        label: invites ? 'Cancel invites' : 'Remove',
        description: 'They lose access straight away and their seats are freed. Their chats and projects stay with the organisation.',
      })
  }

  const ago = (time: Date | number) => formatAgo(+new Date(time), +new Date(now))
  const invitedLabel = (m: OrgMember) => (m.joinedAt ? `Invited ${ago(m.joinedAt)}` : 'Not joined yet')
  const lastActive = (m: OrgMember) =>
    m.status === 'invited' ? invitedLabel(m) : m.lastActiveAt ? ago(m.lastActiveAt) : 'Never'

  const nameBlock = (m: OrgMember) => (
    <div className="grid min-w-0 flex-1">
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="truncate font-medium">{displayName(m)}</span>
        {m.isYou && <span className="text-muted-foreground shrink-0">(you)</span>}
        {m.sso && <Badge variant="outline" className="shrink-0" title="Signs in with SSO">SSO</Badge>}
        {isExternal(m.email, domain) && <Badge variant="secondary" className="shrink-0">External</Badge>}
      </span>
      {m.name && <span className="text-muted-foreground truncate text-[11px]">{m.email}</span>}
    </div>
  )

  const roleControl = (m: OrgMember, className?: string) => editable(m) ? (
    <Select value={m.role} onValueChange={(role) => onRoleChange([m.id], role)}>
      <SelectTrigger size="sm" className={cn('w-32', className)} aria-label={`Role for ${displayName(m)}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assignable.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
      </SelectContent>
    </Select>
  ) : (
    <span className="text-muted-foreground px-2 text-xs">{roleLabel(m.role)}</span>
  )

  const groupChips = (m: OrgMember) => {
    const names = (m.groups ?? []).map(groupName).filter((n): n is string => !!n)
    if (!names.length) return <span className="text-muted-foreground">—</span>
    return (
      <span className="flex min-w-0 flex-wrap gap-1">
        {names.slice(0, 2).map((n) => <Badge key={n} variant="outline" className="max-w-28 truncate">{n}</Badge>)}
        {names.length > 2 && <Badge variant="outline" title={names.slice(2).join(', ')}>+{names.length - 2}</Badge>}
      </span>
    )
  }

  const statusBadge = (m: OrgMember) => <StatusBadge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</StatusBadge>

  const rowCheckbox = (m: OrgMember) => (
    <Checkbox
      checked={selected.has(m.id) && editable(m)}
      disabled={!editable(m)}
      onCheckedChange={(on) => toggle(m.id, on === true)}
      aria-label={`Select ${displayName(m)}`}
    />
  )

  const rowMenu = (m: OrgMember) => {
    if (!editable(m)) return <span aria-hidden className="block size-6" />
    const name = displayName(m)
    const invited = m.status === 'invited'
    const showGroups = !!groups?.length && !!onGroupsChange
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} onPointerDown={remember} onKeyDown={remember}>
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} /> Change role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuRadioGroup value={m.role} onValueChange={(role) => onRoleChange([m.id], role)}>
                {assignable.map((r) => (
                  <DropdownMenuRadioItem key={r.id} value={r.id} className="items-start">
                    <span className="grid gap-0.5">
                      <span>{r.label}</span>
                      {r.hint && <span className="text-muted-foreground text-[11px] leading-4">{r.hint}</span>}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {showGroups && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} /> Add to group
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuLabel>Groups</DropdownMenuLabel>
                {groups!.map((g) => {
                  const on = (m.groups ?? []).includes(g.id)
                  return (
                    <DropdownMenuCheckboxItem
                      key={g.id}
                      checked={on}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(next) => onGroupsChange!(
                        m.id,
                        next ? [...(m.groups ?? []), g.id] : (m.groups ?? []).filter((x) => x !== g.id),
                      )}
                    >
                      {g.name}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {invited && onResend && (
            <DropdownMenuItem onSelect={() => onResend(m.id)}>
              <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} /> Resend invite
            </DropdownMenuItem>
          )}
          {!invited && onSuspend && (
            <DropdownMenuItem onSelect={() => onSuspend(m.id, m.status !== 'suspended')}>
              <HugeiconsIcon icon={m.status === 'suspended' ? UserCheck01Icon : UserBlock01Icon} strokeWidth={2} />
              {m.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => askRemove([m])}>
            <HugeiconsIcon icon={invited ? Cancel01Icon : UserRemove01Icon} strokeWidth={2} />
            {invited ? 'Cancel invite' : 'Remove from organisation'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const dim = (m: OrgMember) => m.status !== 'active' && 'opacity-60'

  return (
    <div ref={rootRef} tabIndex={-1} className={cn('@container grid min-w-0 gap-3 outline-none', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by name, email or group…"
          label="Search members"
          className="min-w-0 flex-1 basis-48 @2xl:max-w-xs"
        />
        {actions}
      </div>

      <div role="group" aria-label="Filter members" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
        {chips.map((chip) => {
          const active = filter === chip.value
          return (
            <Button
              key={chip.value}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={active}
              onClick={() => setFilter(chip.value)}
              className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
            >
              {chip.label}
              <span className="text-muted-foreground tabular-nums">{matching.filter(inFilter[chip.value]).length}</span>
            </Button>
          )
        })}
      </div>

      {picked.length > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="bg-muted/60 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5"
        >
          <span className="px-1 text-xs font-medium tabular-nums">{picked.length} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} data-icon="inline-start" /> Change role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Give {plural(picked.length, 'member')} the role</DropdownMenuLabel>
                {assignable.map((r) => (
                  <DropdownMenuItem key={r.id} onSelect={() => onRoleChange(picked.map((m) => m.id), r.id)}>
                    {r.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={(e) => {
                remember(e)
                askRemove(picked)
              }}
            >
              <HugeiconsIcon icon={UserRemove01Icon} strokeWidth={2} data-icon="inline-start" /> Remove
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Clear selection" onClick={clear}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="bg-card text-muted-foreground rounded-lg border px-3 py-8 text-center text-xs">
          {q ? <>No members match “{query.trim()}”.</> : 'No members here.'}
        </p>
      ) : (
        <>
          {/* Wide: a table. */}
          <div className="bg-card hidden min-w-0 overflow-hidden rounded-lg border @2xl:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 w-9 pl-3">
                    <Checkbox
                      checked={allPicked ? true : somePicked ? 'indeterminate' : false}
                      disabled={!pickable.length}
                      onCheckedChange={() => (allPicked ? clear() : setSelected(new Set([...selected, ...pickable.map((m) => m.id)])))}
                      aria-label="Select all members shown"
                    />
                  </TableHead>
                  <TableHead className="h-8">Member</TableHead>
                  <TableHead className="h-8 w-36">Role</TableHead>
                  {groups && <TableHead className="hidden h-8 @4xl:table-cell">Groups</TableHead>}
                  <TableHead className="h-8 w-24">Status</TableHead>
                  <TableHead className="hidden h-8 w-32 @3xl:table-cell">Last active</TableHead>
                  <TableHead className="h-8 w-10"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((m) => (
                  <TableRow key={m.id} data-state={selected.has(m.id) && editable(m) ? 'selected' : undefined}>
                    <TableCell className="pl-3">{rowCheckbox(m)}</TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar name={displayName(m)} className={cn('size-7', dim(m))} />
                        {nameBlock(m)}
                      </div>
                    </TableCell>
                    <TableCell>{roleControl(m)}</TableCell>
                    {groups && <TableCell className="hidden @4xl:table-cell">{groupChips(m)}</TableCell>}
                    <TableCell>{statusBadge(m)}</TableCell>
                    <TableCell className="text-muted-foreground hidden @3xl:table-cell">{lastActive(m)}</TableCell>
                    <TableCell className="pr-2">{rowMenu(m)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Narrow: cards. */}
          <ul aria-label="Members" className="bg-card min-w-0 divide-y rounded-lg border @2xl:hidden">
            {shown.map((m) => (
              <li key={m.id} className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
                <span className="flex h-7 items-center">{rowCheckbox(m)}</span>
                <UserAvatar name={displayName(m)} className={cn('size-7 shrink-0', dim(m))} />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="flex min-w-0 items-start gap-2">
                    {nameBlock(m)}
                    {rowMenu(m)}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {roleControl(m, 'w-auto min-w-28')}
                    {statusBadge(m)}
                    {groups && (m.groups?.length ?? 0) > 0 && groupChips(m)}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {m.status === 'invited'
                      ? invitedLabel(m)
                      : m.lastActiveAt ? `Last active ${ago(m.lastActiveAt)}` : 'Never signed in'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <DeleteConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon={UserRemove01Icon}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.label}
        size="sm"
        returnFocusRef={opener}
        afterConfirm={() => rootRef.current?.focus()}
        onConfirm={() => {
          if (!confirm) return
          onRemove(confirm.ids)
          setSelected((s) => new Set([...s].filter((id) => !confirm.ids.includes(id))))
        }}
      />
    </div>
  )
}
