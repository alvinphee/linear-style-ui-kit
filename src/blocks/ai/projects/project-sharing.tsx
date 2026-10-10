import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserAdd01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import {
  shareAccessOptions, type ShareAccess, type ShareAccessOption, type ShareMember, type ShareRole,
} from '@/blocks/share-dialog'
import { UserAvatar } from '@/components/person'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { plural } from '@/lib/text'

// The Sharing tab of a project in an AI chat app: who has access, the general
// access, whether the project's chats are shared or private to each person,
// and what members may change. Inviting and changing roles happen in the
// share dialog, which Share and Change open. The app keeps the settings; the
// tab reports each change.

// Whether members see each other's chats in the project.
export type ProjectChatVisibility = 'shared' | 'private'

// What members may change, whatever their role: the instructions and
// knowledge (with Can edit), or nothing (they only chat).
export type ProjectMemberPermission = 'edit' | 'chat'

export type ProjectSharingProps = {
  members: ShareMember[]
  roles: ShareRole[]
  access: ShareAccess
  // The role everyone in the organisation gets, with general access set to it.
  accessRole?: string
  organisation?: string
  // As in the share dialog. The three of shareAccessOptions when left out.
  accessOptions?: ShareAccessOption[]
  // Opens the share dialog (Share, Change). Left out: neither button.
  onManage?: () => void
  chatVisibility: ProjectChatVisibility
  onChatVisibilityChange: (value: ProjectChatVisibility) => void
  memberPermission: ProjectMemberPermission
  onMemberPermissionChange: (value: ProjectMemberPermission) => void
  // False for a member who may only look: the settings are read only.
  canManage?: boolean
  // How many people are listed before Show all.
  max?: number
  className?: string
}

const CHATS: { value: ProjectChatVisibility; title: string; hint: string }[] = [
  {
    value: 'shared',
    title: 'Shared with everyone in the project',
    hint: 'Members see and continue each other’s chats. Suits a team working on one thing.',
  },
  {
    value: 'private',
    title: 'Private to each person',
    hint: 'Each member sees only their own chats. The instructions and knowledge are still shared.',
  },
]

const PERMISSIONS: { value: ProjectMemberPermission; title: string; hint: string }[] = [
  {
    value: 'edit',
    title: 'Edit instructions and knowledge',
    hint: 'People with Can edit change the custom instructions and add or remove files.',
  },
  {
    value: 'chat',
    title: 'Only chat',
    hint: 'Only the owner changes the instructions and knowledge. Everyone else uses them in chats.',
  },
]

function Block({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-2">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <h4 className="text-xs font-medium">{title}</h4>
          {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Choices<T extends string>({ label, value, options, onChange, disabled }: {
  label: string
  value: T
  options: { value: T; title: string; hint: string }[]
  onChange: (value: T) => void
  disabled: boolean
}) {
  const id = useId()
  return (
    <RadioGroup aria-label={label} value={value} onValueChange={(v) => onChange(v as T)} disabled={disabled} className="grid-cols-1 gap-1.5 @lg:grid-cols-2">
      {options.map((o) => (
        <FieldLabel key={o.value} htmlFor={`${id}-${o.value}`}>
          <Field orientation="horizontal" data-disabled={disabled || undefined}>
            <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
            <FieldContent>
              <FieldTitle className="text-xs">{o.title}</FieldTitle>
              <FieldDescription className="text-[11px] leading-4">{o.hint}</FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}

// Owner first, then people who have joined, then pending invites.
const rank = (m: ShareMember) => (m.isOwner ? 0 : m.status === 'active' ? 1 : 2)

export function ProjectSharing({
  members, roles, access, accessRole, organisation = 'your organisation', accessOptions, onManage, chatVisibility,
  onChatVisibilityChange, memberPermission, onMemberPermissionChange, canManage = true, max = 5, className,
}: ProjectSharingProps) {
  const [all, setAll] = useState(false)
  const sorted = [...members].sort((a, b) => rank(a) - rank(b))
  const shown = all ? sorted : sorted.slice(0, max)
  const general = (accessOptions ?? shareAccessOptions(organisation)).find((o) => o.id === access)
  const roleLabel = (id?: string) => roles.find((r) => r.id === id)?.label ?? id

  return (
    <div className={cn('@container grid min-w-0 gap-6', className)}>
      <Block
        title="People with access"
        hint={`${plural(members.length, 'person', 'people')}${onManage && canManage ? '. Invite people and set their roles with Share.' : ''}`}
        action={onManage && canManage && (
          <Button variant="outline" size="sm" onClick={onManage}>
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} data-icon="inline-start" />
            Share
          </Button>
        )}
      >
        <div className="grid min-w-0 gap-1">
          <ul className="divide-y rounded-lg border">
            {shown.map((m) => {
              const name = m.name || m.email
              return (
                <li key={m.id} className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
                  <UserAvatar name={name} className={cn(m.status === 'invited' && 'opacity-60')} />
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
                    <span className="truncate">{name}</span>
                    {m.isYou && <span className="text-muted-foreground shrink-0">(You)</span>}
                    {m.name && <span className="text-muted-foreground hidden truncate text-[11px] @md:inline">{m.email}</span>}
                  </span>
                  {m.status === 'invited' && <Badge variant="outline" className="shrink-0">Invited</Badge>}
                  <span className="text-muted-foreground shrink-0 text-xs">{m.isOwner ? 'Owner' : roleLabel(m.role)}</span>
                </li>
              )
            })}
          </ul>
          {sorted.length > max && (
            <Button variant="ghost" size="sm" className="text-muted-foreground justify-self-start" onClick={() => setAll((a) => !a)}>
              {all ? 'Show fewer' : `Show all ${sorted.length}`}
            </Button>
          )}
        </div>
      </Block>

      {general && (
        <Block title="General access">
          <div className="flex min-w-0 items-center gap-2.5 rounded-lg border px-2.5 py-2">
            <span
              aria-hidden
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full',
                access === 'restricted' ? 'bg-muted text-muted-foreground' : 'bg-brand/10 text-brand',
              )}
            >
              <HugeiconsIcon icon={general.icon} strokeWidth={2} className="size-3.5" />
            </span>
            <div className="grid min-w-0 flex-1">
              <span className="truncate text-xs">
                {general.label}
                {access === 'organisation' && accessRole && <span className="text-muted-foreground"> · {roleLabel(accessRole)}</span>}
                {access === 'link' && <span className="text-muted-foreground"> · Can view</span>}
              </span>
              <span className="text-muted-foreground text-[11px]">{general.hint}</span>
            </div>
            {onManage && canManage && (
              <Button variant="ghost" size="sm" onClick={onManage} aria-label="Change general access">Change</Button>
            )}
          </div>
        </Block>
      )}

      <Block title="Chats in this project" hint="Who sees the chats started in the project.">
        <Choices
          label="Chats in this project"
          value={chatVisibility}
          options={CHATS}
          onChange={onChatVisibilityChange}
          disabled={!canManage}
        />
      </Block>

      <Block title="Members can" hint="Applies to everyone but the owner, whatever their role.">
        <Choices
          label="Members can"
          value={memberPermission}
          options={PERMISSIONS}
          onChange={onMemberPermissionChange}
          disabled={!canManage}
        />
      </Block>
    </div>
  )
}
