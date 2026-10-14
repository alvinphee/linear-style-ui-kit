import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserAdd01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { InviteMembersDialog } from '@/blocks/invite-members-dialog'
import { MembersTable, type OrgMember } from '@/blocks/members-table'
import { RolePermissions } from '@/blocks/role-permissions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { plural } from '@/lib/text'
import { Panel, Row } from '../shared'
import { now } from '../ai/data'
import {
  DEFAULT_GRANTS, INVITE_LINK, PERMISSIONS, SAMPLE_GROUPS, SAMPLE_MEMBERS, SAMPLE_ROLES, roleOptions, type OrgRoleDef,
} from '../ai/admin/members-data'
import { ORG } from '../ai/admin/org'

// Members and roles on their own, on local state (nothing here touches the
// AI chat app's admin console): the members table wide and narrow on the same
// people, the invite dialog, and the permission matrix.

const DEMO = 'Demo only. Nothing is saved.'
const ROLE_OPTIONS = roleOptions(SAMPLE_ROLES)
const roleName = (id: string) => ROLE_OPTIONS.find((r) => r.id === id)?.label ?? id

export function MembersPanels() {
  const [members, setMembers] = useState<OrgMember[]>(SAMPLE_MEMBERS)
  const [asMember, setAsMember] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [autoJoin, setAutoJoin] = useState(false)
  const [lastInvite, setLastInvite] = useState('')
  const [roles, setRoles] = useState<OrgRoleDef[]>(SAMPLE_ROLES)
  const [grants, setGrants] = useState(DEFAULT_GRANTS)

  const patch = (ids: string[], change: Partial<OrgMember>) =>
    setMembers((list) => list.map((m) => (ids.includes(m.id) ? { ...m, ...change } : m)))

  const table = (
    <MembersTable
      members={members}
      roles={ROLE_OPTIONS}
      groups={SAMPLE_GROUPS}
      domain={ORG.domain}
      now={now()}
      canManage={() => !asMember}
      onRoleChange={(ids, role) => {
        patch(ids, { role })
        toast.success(`${plural(ids.length, 'member')} now ${roleName(role)}`, { description: DEMO })
      }}
      onRemove={(ids) => {
        setMembers((list) => list.filter((m) => !ids.includes(m.id)))
        toast(`${plural(ids.length, 'member')} removed`, { description: DEMO })
      }}
      onResend={(id) => toast.success(`Invite sent again to ${members.find((m) => m.id === id)?.email}`, { description: 'Demo only. No email is sent.' })}
      onSuspend={(id, suspended) => {
        patch([id], { status: suspended ? 'suspended' : 'active' })
        toast.success(suspended ? 'Member suspended' : 'Member reactivated', { description: DEMO })
      }}
      onGroupsChange={(id, groups) => patch([id], { groups })}
    />
  )

  return (
    <>
      <Panel title="Members table" note="Search, filter chips, roles, groups, bulk actions" wide>
        <div className="grid min-w-0 gap-3">
          <Row className="justify-between">
            <p className="text-muted-foreground min-w-0 text-xs">
              The owner can’t be demoted or removed, and you can’t change yourself. Tick rows for the bulk bar.
            </p>
            <div className="flex items-center gap-2">
              <Switch id="members-as-member" checked={asMember} onCheckedChange={setAsMember} />
              <Label htmlFor="members-as-member" className="font-normal">View as a member</Label>
            </div>
          </Row>
          {table}
        </div>
      </Panel>

      <Panel title="Members table, narrow" note="Cards below 42rem">
        {table}
      </Panel>

      <Panel title="Invite members dialog" note="Paste many, chips, External, invite link">
        <div className="grid min-w-0 gap-3">
          <p className="text-muted-foreground text-xs">
            Paste a list to try it: <code className="bg-muted rounded px-1 text-[11px]">kenji.sato@example.com, not-an-email, sam@partner.example.org</code>.
            Addresses that are not valid or already in are flagged; ones outside {ORG.domain} are marked External.
          </p>
          <Row>
            <Button onClick={() => setInviting(true)}>
              <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" /> Invite people
            </Button>
            {lastInvite && <span className="text-muted-foreground min-w-0 text-[11px]">{lastInvite}</span>}
          </Row>
        </div>
        <InviteMembersDialog
          open={inviting}
          onOpenChange={setInviting}
          roles={ROLE_OPTIONS.filter((r) => r.id !== 'owner')}
          defaultRole="member"
          groups={SAMPLE_GROUPS}
          domain={ORG.domain}
          existingEmails={members.map((m) => m.email)}
          seatsLeft={ORG.seats - members.length}
          inviteLink={INVITE_LINK}
          autoJoin={autoJoin}
          onAutoJoinChange={setAutoJoin}
          onInvite={(emails, role, groups, message) => {
            setLastInvite(`Last: ${plural(emails.length, 'invite')} as ${roleName(role)}${groups.length ? `, ${plural(groups.length, 'group')}` : ''}${message ? ', with a message' : ''}.`)
            toast.success(`${plural(emails.length, 'invite')} sent`, { description: 'Demo only. No email is sent.' })
          }}
        />
      </Panel>

      <Panel title="Roles and permissions" note="Matrix when wide, a role picker below 42rem" wide>
        <RolePermissions
          roles={roles.map((r) => ({ ...r, memberCount: members.filter((m) => m.role === r.id).length }))}
          permissions={PERMISSIONS}
          grants={grants}
          fallbackRoleName="Member"
          onChange={(roleId, permissionId, on) => setGrants((g) => ({
            ...g,
            [roleId]: on ? [...(g[roleId] ?? []), permissionId] : (g[roleId] ?? []).filter((p) => p !== permissionId),
          }))}
          onCreateRole={({ name, description, copyFrom }) => {
            const id = `role-${roles.length}-${name.toLowerCase().replace(/\W+/g, '-')}`
            setRoles((list) => [...list, { id, name, description: description || 'A custom role.' }])
            setGrants((g) => ({ ...g, [id]: copyFrom ? [...(g[copyFrom] ?? [])] : [] }))
            toast.success(`${name} role created`, { description: DEMO })
            return id
          }}
          onDeleteRole={(roleId) => {
            setRoles((list) => list.filter((r) => r.id !== roleId))
            setMembers((list) => list.map((m) => (m.role === roleId ? { ...m, role: 'member' } : m)))
            toast('Role deleted', { description: DEMO })
          }}
        />
      </Panel>
    </>
  )
}
