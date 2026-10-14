import { Fragment, useId, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon, LockIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { plural } from '@/lib/text'

// Roles and permissions (role-based access control): which role may do
// what. A permission matrix with a row per permission, grouped (Chats,
// Agents, Sharing…), and a column per role, each cell a checkbox. A locked
// role (the owner) has every permission and can't be changed. Built-in
// roles can be changed but not deleted; custom roles can be created, by
// copying another role's permissions, and deleted.
//
// The block measures its own box (@container): the matrix from 42rem wide,
// and below that a role picker with that role's permissions as switches.

export type PermissionRole = {
  id: string
  name: string
  description: string
  // Comes with the product: can't be deleted.
  builtIn?: boolean
  // Has every permission, always (the owner).
  locked?: boolean
  memberCount: number
}

export type Permission = {
  id: string
  // The heading it sits under, such as Chats. Groups keep the order they first appear in.
  group: string
  label: string
  hint?: string
}

export type NewRole = { name: string; description: string; copyFrom?: string }

export type RolePermissionsProps = {
  roles: PermissionRole[]
  permissions: Permission[]
  // Role id → the permission ids it has.
  grants: Record<string, string[]>
  onChange: (roleId: string, permissionId: string, on: boolean) => void
  // Turns on Create role. May return the new role's id, to show it.
  onCreateRole?: (role: NewRole) => string | void
  // Turns on Delete role for custom roles.
  onDeleteRole?: (roleId: string) => void
  // The role a deleted role's members move to, named in the confirm.
  fallbackRoleName?: string
  // False for someone who may only look.
  canManage?: boolean
  className?: string
}

export function RolePermissions({
  roles, permissions, grants, onChange, onCreateRole, onDeleteRole, fallbackRoleName, canManage = true, className,
}: RolePermissionsProps) {
  const [current, setCurrent] = useState(roles.find((r) => !r.locked)?.id ?? roles[0]?.id)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<PermissionRole | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const uid = useId()

  const groups = [...new Set(permissions.map((p) => p.group))]
  const has = (role: PermissionRole, permissionId: string) => role.locked || (grants[role.id] ?? []).includes(permissionId)
  const count = (role: PermissionRole) => (role.locked ? permissions.length : permissions.filter((p) => has(role, p.id)).length)
  const editable = (role: PermissionRole) => canManage && !role.locked
  const deletable = (role: PermissionRole) => canManage && !role.builtIn && !role.locked && !!onDeleteRole
  const shown = roles.find((r) => r.id === current) ?? roles[0]
  // A new role starts from the role that may do least, so it never gives away too much by default.
  const leastRole = roles.filter((r) => !r.locked).sort((a, b) => count(a) - count(b))[0]

  const askDelete = (role: PermissionRole, el: HTMLElement | null) => {
    opener.current = el
    setDeleting(role)
    setDeleteOpen(true)
  }

  const roleMenu = (role: PermissionRole) => deletable(role) && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Actions for ${role.name}`}
          onPointerDown={(e) => { opener.current = e.currentTarget }}
          onKeyDown={(e) => { opener.current = e.currentTarget }}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem variant="destructive" onSelect={() => askDelete(role, opener.current)}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const kind = (role: PermissionRole) => role.locked
    ? (
      <span title="Has every permission" className="text-muted-foreground inline-flex">
        <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-3" aria-hidden />
        <span className="sr-only">Locked: has every permission</span>
      </span>
    )
    : !role.builtIn && <Badge variant="secondary">Custom</Badge>

  return (
    <div ref={rootRef} tabIndex={-1} className={cn('@container grid min-w-0 gap-3 outline-none', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {plural(roles.length, 'role')} · {plural(permissions.length, 'permission')}
        </p>
        {onCreateRole && canManage && (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Create role
          </Button>
        )}
      </div>

      {/* Wide: the matrix. */}
      <div className="bg-card hidden min-w-0 overflow-x-auto rounded-lg border @2xl:block">
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">Permissions by role</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="bg-card sticky left-0 z-10 min-w-56 px-3 py-2 text-left font-medium">Permission</th>
              {roles.map((role) => (
                <th key={role.id} scope="col" className="min-w-28 px-2 py-2 text-center align-top font-normal">
                  <div className="grid justify-items-center gap-0.5">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{role.name}</span>
                      {kind(role)}
                      {roleMenu(role)}
                    </span>
                    <span className="text-muted-foreground text-[11px]">{plural(role.memberCount, 'member')}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group}>
                <tr className="bg-muted/40 border-b">
                  <th
                    scope="colgroup"
                    colSpan={roles.length + 1}
                    className="text-muted-foreground sticky left-0 px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase"
                  >
                    {group}
                  </th>
                </tr>
                {permissions.filter((p) => p.group === group).map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 border-b last:border-0">
                    <th scope="row" className="bg-card sticky left-0 z-10 px-3 py-2 text-left font-normal">
                      <span className="block">{p.label}</span>
                      {p.hint && <span className="text-muted-foreground block text-[11px] leading-4">{p.hint}</span>}
                    </th>
                    {roles.map((role) => (
                      <td key={role.id} className="px-2 py-2 text-center">
                        <span className="inline-flex">
                          <Checkbox
                            checked={has(role, p.id)}
                            disabled={!editable(role)}
                            onCheckedChange={(on) => onChange(role.id, p.id, on === true)}
                            aria-label={`${p.label}: ${role.name}`}
                          />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow: pick a role, then its permissions. */}
      {shown && (
        <div className="grid min-w-0 gap-3 @2xl:hidden">
          <div role="group" aria-label="Role" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {roles.map((role) => {
              const active = role.id === shown.id
              return (
                <Button
                  key={role.id}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setCurrent(role.id)}
                  className={cn('shrink-0 rounded-full', !active && 'text-muted-foreground')}
                >
                  {role.name}
                  <span className="text-muted-foreground tabular-nums">{role.memberCount}</span>
                </Button>
              )
            })}
          </div>

          <section aria-label={`${shown.name} permissions`} className="bg-card min-w-0 rounded-lg border">
            <header className="flex min-w-0 items-start gap-2 border-b px-3 py-2.5">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-xs font-medium">{shown.name}</h3>
                  {kind(shown)}
                </span>
                <p className="text-muted-foreground text-[11px] leading-4">{shown.description}</p>
                <p className="text-muted-foreground text-[11px]">
                  {plural(shown.memberCount, 'member')} · {count(shown)} of {permissions.length} permissions
                </p>
              </div>
              {roleMenu(shown)}
            </header>
            {shown.locked && (
              <p className="text-muted-foreground border-b px-3 py-2 text-[11px]">
                The {shown.name.toLowerCase()} has every permission. It can’t be changed.
              </p>
            )}
            {groups.map((group) => (
              <div key={group} role="group" aria-label={group} className="border-b last:border-0">
                <p className="text-muted-foreground bg-muted/40 px-3 py-1.5 text-[10px] font-medium tracking-wide uppercase">{group}</p>
                <ul className="divide-y">
                  {permissions.filter((p) => p.group === group).map((p) => {
                    const switchId = `${uid}-${shown.id}-${p.id}`
                    return (
                      <li key={p.id} className="flex min-w-0 items-center justify-between gap-4 px-3 py-2">
                        <div className="grid min-w-0 gap-0.5">
                          <Label htmlFor={switchId} className="font-normal">{p.label}</Label>
                          {p.hint && <p className="text-muted-foreground text-[11px] leading-4">{p.hint}</p>}
                        </div>
                        <Switch
                          id={switchId}
                          checked={has(shown, p.id)}
                          disabled={!editable(shown)}
                          onCheckedChange={(on) => onChange(shown.id, p.id, on)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>
      )}

      {onCreateRole && (
        <CreateRoleDialog
          open={creating}
          onOpenChange={setCreating}
          roles={roles}
          defaultCopyFrom={leastRole?.id}
          onCreate={(role) => {
            const id = onCreateRole(role)
            if (id) setCurrent(id)
          }}
        />
      )}

      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete the ${deleting?.name ?? ''} role?`}
        description={
          deleting && deleting.memberCount > 0
            ? `${plural(deleting.memberCount, 'member has', 'members have')} this role. ${
              fallbackRoleName ? `They become ${fallbackRoleName}s.` : 'They lose what it allows until they get another role.'}`
            : 'No one has this role. This can’t be undone.'
        }
        confirmLabel="Delete role"
        size="sm"
        returnFocusRef={opener}
        afterConfirm={() => rootRef.current?.focus()}
        onConfirm={() => deleting && onDeleteRole?.(deleting.id)}
      />
    </div>
  )
}

// A new custom role: its name, what it is for, and whose permissions to start from.
function CreateRoleDialog({ open, onOpenChange, roles, defaultCopyFrom, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: PermissionRole[]
  defaultCopyFrom?: string
  onCreate: (role: NewRole) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>A custom role, for people who need more than members and less than admins.</DialogDescription>
        </DialogHeader>
        <CreateRoleForm roles={roles} defaultCopyFrom={defaultCopyFrom} onCreate={(r) => { onCreate(r); onOpenChange(false) }} />
      </DialogContent>
    </Dialog>
  )
}

function CreateRoleForm({ roles, defaultCopyFrom, onCreate }: {
  roles: PermissionRole[]
  defaultCopyFrom?: string
  onCreate: (role: NewRole) => void
}) {
  const id = useId()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [copyFrom, setCopyFrom] = useState(defaultCopyFrom ?? 'none')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Give the role a name.')
    if (roles.some((r) => r.name.toLowerCase() === n.toLowerCase())) return setError(`There is already a role called ${n}.`)
    onCreate({ name: n, description: description.trim(), copyFrom: copyFrom === 'none' ? undefined : copyFrom })
  }

  return (
    <form onSubmit={submit} className="grid min-w-0 gap-3.5">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-name`}>Name</Label>
        <Input
          id={`${id}-name`}
          value={name}
          autoFocus
          autoComplete="off"
          placeholder="Such as Agent builder"
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
        {error && <p id={`${id}-error`} role="alert" className="text-destructive text-[11px]">{error}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-description`}>
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Who gets this role, and why"
          className="min-h-14"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-copy`}>Copy permissions from</Label>
        <Select value={copyFrom} onValueChange={setCopyFrom}>
          <SelectTrigger id={`${id}-copy`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nothing (start with none)</SelectItem>
            <SelectSeparator />
            {roles.filter((r) => !r.locked).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-[11px]">You can change each permission afterwards.</p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Create role</Button>
      </DialogFooter>
    </form>
  )
}
