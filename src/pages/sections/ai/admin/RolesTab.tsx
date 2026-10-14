import { toast } from 'sonner'
import type { OrgMember } from '@/blocks/members-table'
import { RolePermissions } from '@/blocks/role-permissions'
import { SettingsHeader } from '@/blocks/settings-page'
import { Button } from '@/components/ui/button'
import { uid } from '../data'
import { useStoredState } from '../settings/prefs'
import {
  DEFAULT_GRANTS, GRANTS_KEY, MEMBERS_KEY, PERMISSIONS, ROLES_KEY, SAMPLE_MEMBERS, SAMPLE_ROLES, type OrgRoleDef,
} from './members-data'
import { MY_ROLE } from './org'

// The admin console's Roles and permissions section: the built-in roles
// (Owner, Admin, Member), custom ones such as Agent builder, and what each
// may do. Kept in this browser; the member counts follow the Members section.

const SAVED = 'Demo only. Saved in this browser.'

export function RolesTab() {
  const [roles, setRoles] = useStoredState<OrgRoleDef[]>(ROLES_KEY, SAMPLE_ROLES)
  const [grants, setGrants] = useStoredState<Record<string, string[]>>(GRANTS_KEY, DEFAULT_GRANTS)
  const [members, setMembers] = useStoredState<OrgMember[]>(MEMBERS_KEY, SAMPLE_MEMBERS)
  const canManage = MY_ROLE !== 'member'

  const withCounts = roles.map((r) => ({ ...r, memberCount: members.filter((m) => m.role === r.id).length }))
  const changed = JSON.stringify(roles) !== JSON.stringify(SAMPLE_ROLES) || JSON.stringify(grants) !== JSON.stringify(DEFAULT_GRANTS)

  return (
    <>
      <SettingsHeader
        title="Roles and permissions"
        description="What each role may do. A change applies to everyone with the role straight away."
        action={canManage && changed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const before = { roles, grants }
              setRoles(SAMPLE_ROLES)
              setGrants(DEFAULT_GRANTS)
              toast('Roles reset to the defaults', {
                action: {
                  label: 'Undo',
                  onClick: () => {
                    setRoles(before.roles)
                    setGrants(before.grants)
                  },
                },
              })
            }}
          >
            Reset to defaults
          </Button>
        )}
      />

      <RolePermissions
        roles={withCounts}
        permissions={PERMISSIONS}
        grants={grants}
        canManage={canManage}
        fallbackRoleName="Member"
        onChange={(roleId, permissionId, on) => {
          setGrants((g) => {
            const list = g[roleId] ?? []
            return { ...g, [roleId]: on ? [...list.filter((p) => p !== permissionId), permissionId] : list.filter((p) => p !== permissionId) }
          })
          const role = roles.find((r) => r.id === roleId)
          const permission = PERMISSIONS.find((p) => p.id === permissionId)
          toast.success(`${role?.name}: ${permission?.label} ${on ? 'allowed' : 'not allowed'}`, { description: SAVED })
        }}
        onCreateRole={({ name, description, copyFrom }) => {
          const id = uid('role-')
          setRoles((list) => [...list, { id, name, description: description || 'A custom role.' }])
          setGrants((g) => ({ ...g, [id]: copyFrom ? [...(copyFrom === 'owner' ? PERMISSIONS.map((p) => p.id) : g[copyFrom] ?? [])] : [] }))
          toast.success(`${name} role created`, {
            description: copyFrom ? `With the permissions of ${roles.find((r) => r.id === copyFrom)?.name}.` : 'With no permissions yet.',
          })
          return id
        }}
        onDeleteRole={(roleId) => {
          const role = roles.find((r) => r.id === roleId)
          const moved = members.filter((m) => m.role === roleId).length
          setRoles((list) => list.filter((r) => r.id !== roleId))
          setGrants((g) => Object.fromEntries(Object.entries(g).filter(([id]) => id !== roleId)))
          setMembers((list) => list.map((m) => (m.role === roleId ? { ...m, role: 'member' } : m)))
          toast(`${role?.name} role deleted`, {
            description: moved ? `${moved === 1 ? 'Its member is' : `Its ${moved} members are`} now Members.` : SAVED,
          })
        }}
      />
    </>
  )
}
