import { useId, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon, UserAdd01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { InviteMembersDialog } from '@/blocks/invite-members-dialog'
import { MembersTable, type OrgMember } from '@/blocks/members-table'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { UsageMeter } from '@/components/usage-meter'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { plural } from '@/lib/text'
import { now, uid } from '../data'
import { useStoredState } from '../settings/prefs'
import {
  AUTO_JOIN_KEY, GROUPS_KEY, INVITE_LINK, MEMBERS_KEY, ROLES_KEY, SAMPLE_GROUPS, SAMPLE_MEMBERS, SAMPLE_ROLES,
  roleOptions, type OrgGroup,
} from './members-data'
import { MY_ROLE, ORG } from './org'

// The admin console's Members section: seats, every member with their role,
// groups and status, the groups themselves, and how people join (invites,
// the invite link, domain auto-join). Kept in this browser.

const NO_EMAIL = 'Demo only. No email is sent.'
const SAVED = 'Demo only. Saved in this browser.'

export function MembersTab() {
  const [members, setMembers] = useStoredState<OrgMember[]>(MEMBERS_KEY, SAMPLE_MEMBERS)
  const [groups, setGroups] = useStoredState<OrgGroup[]>(GROUPS_KEY, SAMPLE_GROUPS)
  const [autoJoin, setAutoJoin] = useStoredState(AUTO_JOIN_KEY, false)
  const [roles] = useStoredState(ROLES_KEY, SAMPLE_ROLES)
  const [inviting, setInviting] = useState(false)

  const canManage = MY_ROLE !== 'member'
  const options = roleOptions(roles)
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id
  const nameOf = (m: OrgMember) => m.name || m.email
  const used = members.length
  const left = Math.max(0, ORG.seats - used)
  const pending = members.filter((m) => m.status === 'invited')

  const patch = (ids: string[], change: (m: OrgMember) => OrgMember) =>
    setMembers((list) => list.map((m) => (ids.includes(m.id) ? change(m) : m)))

  const remove = (ids: string[]) => {
    const removed = members.flatMap((m, index) => (ids.includes(m.id) ? [{ m, index }] : []))
    setMembers((list) => list.filter((m) => !ids.includes(m.id)))
    const invites = removed.every((r) => r.m.status === 'invited')
    toast(
      removed.length === 1
        ? invites ? `Invite to ${removed[0].m.email} cancelled` : `${nameOf(removed[0].m)} removed`
        : invites ? `${plural(removed.length, 'invite')} cancelled` : `${plural(removed.length, 'member')} removed`,
      {
        description: SAVED,
        action: {
          label: 'Undo',
          onClick: () => setMembers((list) => {
            const next = [...list]
            for (const { m, index } of removed) if (!next.some((x) => x.id === m.id)) next.splice(index, 0, m)
            return next
          }),
        },
      },
    )
  }

  return (
    <>
      <SettingsHeader
        title="Members"
        description={`${used} of ${ORG.seats} seats used`}
        action={canManage && (
          <Button onClick={() => setInviting(true)}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" /> Invite people
          </Button>
        )}
      />

      <SettingsGroup title="Seats" description={`Your ${ORG.plan} plan has ${ORG.seats} seats. Pending invites use one each.`}>
        <UsageMeter
          size="md"
          value={(used / ORG.seats) * 100}
          label="Seats used"
          count={`${used} / ${ORG.seats}`}
          note={`${plural(pending.length, 'pending invite')} · ${plural(left, 'seat')} left`}
          warnAt={80}
          dangerAt={100}
          className="px-3 py-3"
        >
          <div>
            <Button variant="outline" size="sm" onClick={() => toast('Demo only. No seats were added.')}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Add seats
            </Button>
          </div>
        </UsageMeter>
      </SettingsGroup>

      <MembersTable
        members={members}
        roles={options}
        groups={groups}
        domain={ORG.domain}
        now={now()}
        canManage={() => canManage}
        onRoleChange={(ids, role) => {
          patch(ids, (m) => ({ ...m, role }))
          const changed = members.filter((m) => ids.includes(m.id))
          toast.success(
            changed.length === 1 ? `${nameOf(changed[0])} is now ${roleName(role)}` : `${plural(changed.length, 'member')} are now ${roleName(role)}`,
            { description: SAVED },
          )
        }}
        onRemove={remove}
        onResend={(id) => {
          const m = members.find((x) => x.id === id)
          patch([id], (x) => ({ ...x, joinedAt: now() }))
          toast.success(`Invite sent again to ${m?.email}`, { description: NO_EMAIL })
        }}
        onSuspend={(id, suspended) => {
          const m = members.find((x) => x.id === id)
          patch([id], (x) => ({ ...x, status: suspended ? 'suspended' : 'active' }))
          toast.success(
            suspended ? `${m && nameOf(m)} suspended` : `${m && nameOf(m)} reactivated`,
            { description: suspended ? 'They can’t sign in, and keep their seat until removed.' : 'They can sign in again.' },
          )
        }}
        onGroupsChange={(id, next) => {
          const m = members.find((x) => x.id === id)
          const added = next.find((g) => !m?.groups?.includes(g))
          patch([id], (x) => ({ ...x, groups: next }))
          const group = groups.find((g) => g.id === (added ?? m?.groups?.find((g) => !next.includes(g))))
          if (m && group) toast.success(`${nameOf(m)} ${added ? 'added to' : 'removed from'} ${group.name}`)
        }}
      />

      <GroupsGroup groups={groups} setGroups={setGroups} members={members} setMembers={setMembers} canManage={canManage} />

      <SettingsGroup title="Joining" description="How new people get into the organisation.">
        <SettingsRow
          label="Domain auto-join"
          hint={`People who sign up with an @${ORG.domain} email join as Members, without an invite.`}
          htmlFor="org-auto-join"
        >
          <Switch
            id="org-auto-join"
            checked={autoJoin}
            disabled={!canManage}
            onCheckedChange={(on) => {
              setAutoJoin(on)
              toast.success(on ? `Anyone at ${ORG.domain} can join` : 'Domain auto-join is off', { description: SAVED })
            }}
          />
        </SettingsRow>
        <SettingsRow label="Pending invites" hint={pending.length ? `${plural(pending.length, 'invite')} not accepted yet.` : 'Everyone invited has joined.'}>
          <Button
            variant="outline"
            size="sm"
            disabled={!pending.length || !canManage}
            onClick={() => {
              patch(pending.map((m) => m.id), (m) => ({ ...m, joinedAt: now() }))
              toast.success(`${plural(pending.length, 'invite')} sent again`, { description: NO_EMAIL })
            }}
          >
            Resend all
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <InviteMembersDialog
        open={inviting}
        onOpenChange={setInviting}
        roles={options.filter((r) => r.id !== 'owner')}
        defaultRole="member"
        groups={groups}
        domain={ORG.domain}
        existingEmails={members.map((m) => m.email)}
        seatsLeft={left}
        inviteLink={INVITE_LINK}
        autoJoin={autoJoin}
        onAutoJoinChange={setAutoJoin}
        onInvite={(emails, role, groupIds) => {
          setMembers((list) => [
            ...list,
            ...emails.map((email): OrgMember => ({
              id: uid('inv-'), name: '', email, role, status: 'invited', groups: groupIds, joinedAt: now(),
            })),
          ])
          toast.success(emails.length === 1 ? `Invite sent to ${emails[0]}` : `${plural(emails.length, 'invite')} sent`, {
            description: NO_EMAIL,
          })
        }}
      />
    </>
  )
}

// Groups: teams of members, to share projects and agents with at once.
function GroupsGroup({ groups, setGroups, members, setMembers, canManage }: {
  groups: OrgGroup[]
  setGroups: (next: OrgGroup[] | ((prev: OrgGroup[]) => OrgGroup[])) => void
  members: OrgMember[]
  setMembers: (next: OrgMember[] | ((prev: OrgMember[]) => OrgMember[])) => void
  canManage: boolean
}) {
  // The group being renamed, or 'new' for one being created.
  const [editing, setEditing] = useState<OrgGroup | 'new' | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const edit = (what: OrgGroup | 'new') => {
    setEditing(what)
    setEditOpen(true)
  }
  const [deleting, setDeleting] = useState<OrgGroup | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const newRef = useRef<HTMLButtonElement>(null)
  const countOf = (id: string) => members.filter((m) => m.groups?.includes(id)).length

  return (
    <SettingsGroup
      title="Groups"
      description="Share projects and agents with a whole team at once."
      action={canManage && (
        <Button ref={newRef} variant="outline" size="sm" onClick={() => edit('new')}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New group
        </Button>
      )}
    >
      {groups.length === 0 && <p className="text-muted-foreground px-3 py-6 text-center text-xs">No groups yet.</p>}
      {groups.map((g) => (
        <div key={g.id} className="flex min-w-0 items-center gap-2.5 px-3 py-2">
          <span className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-md">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
          </span>
          <div className="grid min-w-0 flex-1">
            <span className="truncate text-xs font-medium">{g.name}</span>
            <span className="text-muted-foreground text-[11px]">{plural(countOf(g.id), 'member')}</span>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${g.name}`}
                  onPointerDown={(e) => { opener.current = e.currentTarget }}
                  onKeyDown={(e) => { opener.current = e.currentTarget }}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => edit(g)}>
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setDeleting(g)
                    setDeleteOpen(true)
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New group' : 'Rename group'}</DialogTitle>
            <DialogDescription>
              {editing === 'new' ? 'Add members to it from their row’s menu, or when you invite them.' : 'Its members stay in it.'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <GroupForm
              initial={editing === 'new' ? '' : editing.name}
              taken={groups.filter((g) => editing === 'new' || g.id !== editing.id).map((g) => g.name)}
              submitLabel={editing === 'new' ? 'Create group' : 'Rename'}
              onSubmit={(name) => {
                if (editing === 'new') {
                  setGroups((list) => [...list, { id: uid('g-'), name }])
                  toast.success(`${name} group created`, { description: SAVED })
                } else {
                  setGroups((list) => list.map((g) => (g.id === editing.id ? { ...g, name } : g)))
                  toast.success(`Renamed to ${name}`, { description: SAVED })
                }
                setEditOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete the ${deleting?.name ?? ''} group?`}
        description="Its members stay in the organisation. Projects and agents shared with the group are no longer shared with them."
        confirmLabel="Delete group"
        size="sm"
        returnFocusRef={opener}
        afterConfirm={() => newRef.current?.focus()}
        onConfirm={() => {
          if (!deleting) return
          setGroups((list) => list.filter((g) => g.id !== deleting.id))
          setMembers((list) => list.map((m) => (m.groups?.includes(deleting.id) ? { ...m, groups: m.groups.filter((x) => x !== deleting.id) } : m)))
          toast(`${deleting.name} group deleted`, { description: SAVED })
        }}
      />
    </SettingsGroup>
  )
}

function GroupForm({ initial, taken, submitLabel, onSubmit }: {
  initial: string
  taken: string[]
  submitLabel: string
  onSubmit: (name: string) => void
}) {
  const id = useId()
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Give the group a name.')
    if (taken.some((t) => t.toLowerCase() === n.toLowerCase())) return setError(`There is already a group called ${n}.`)
    onSubmit(n)
  }
  return (
    <form onSubmit={submit} className="grid gap-3.5">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <Input
          id={`${id}-name`}
          value={name}
          autoFocus
          autoComplete="off"
          placeholder="Such as Customer success"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
        {error && <p id={`${id}-error`} role="alert" className="text-destructive text-[11px]">{error}</p>}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  )
}
