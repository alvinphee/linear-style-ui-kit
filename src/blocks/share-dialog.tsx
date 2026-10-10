import { useEffect, useId, useRef, useState, type ClipboardEvent, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon, Building06Icon, Cancel01Icon, Link01Icon, LockIcon, Mail01Icon, MailSend01Icon, Share08Icon,
  Tick02Icon, UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { copyText, useCopied } from '@/lib/clipboard'
import { plural } from '@/lib/text'

// Share something with people: a project, a chat, an agent, a document. The
// share dialog as Notion, Figma and the big chat apps draw it. Invite people
// from the directory or by email, give each a role, set the general access
// (only the people added, everyone in the organisation, or anyone with the
// link) and copy the link. The app keeps who has access; the dialog reports
// each change. ShareSummary and ShareButton show the same access in a
// header or a list.

// A role a person can be given, such as Can view. The hint is one line under
// it in the menu.
export type ShareRole = { id: string; label: string; hint?: string }

// Someone in the directory who can be invited.
export type SharePerson = { id: string; name: string; email: string; detail?: string }

// Someone with access. An invited member has not accepted yet (a pending invite).
export type ShareMember = {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'invited'
  isOwner?: boolean
  isYou?: boolean
}

// General access: who can open it besides the people added.
export type ShareAccess = 'restricted' | 'organisation' | 'link'

export type ShareAccessOption = { id: ShareAccess; label: string; hint: string; icon: IconSvgElement }

// Someone picked in the invite field: a person from the directory, or only an
// email address.
export type ShareInvitee = { email: string; personId?: string; name?: string }

// The three general access options, worded for an organisation.
export function shareAccessOptions(organisation = 'your organisation'): ShareAccessOption[] {
  return [
    { id: 'restricted', label: 'Restricted', hint: 'Only people added can open it', icon: LockIcon },
    { id: 'organisation', label: `Everyone at ${organisation}`, hint: `Anyone at ${organisation} can find and open it`, icon: Building06Icon },
    { id: 'link', label: 'Anyone with the link', hint: 'Anyone with the link can view it, no sign-in needed', icon: Link01Icon },
  ]
}

// "Only you", "Shared with 4", "Everyone at Acme", "Anyone with the link".
export function shareSummaryLabel(members: ShareMember[], access: ShareAccess, organisation = 'your organisation') {
  if (access === 'organisation') return `Everyone at ${organisation}`
  if (access === 'link') return 'Anyone with the link'
  const others = members.filter((m) => !m.isYou).length
  return others ? `Shared with ${others}` : 'Only you'
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/
const isEmail = (text: string) => EMAIL.test(text)
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export type ShareDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Such as Share “Q4 planning”.
  title: string
  description?: string
  members: ShareMember[]
  // The directory to invite from. Left out: invites by email only.
  people?: SharePerson[]
  roles: ShareRole[]
  // The role picked for a new invite. The first role when left out.
  defaultRole?: string
  onInvite: (invitees: ShareInvitee[], role: string, message?: string) => void
  onRoleChange: (memberId: string, role: string) => void
  // Removes a member's access, or cancels a pending invite.
  onRemove: (memberId: string) => void
  // Sends a pending invite again. Left out: no Resend invite.
  onResend?: (memberId: string) => void
  access: ShareAccess
  onAccessChange: (access: ShareAccess) => void
  // The role everyone in the organisation gets, with general access set to it.
  accessRole?: string
  onAccessRoleChange?: (role: string) => void
  // The general access options. The three of shareAccessOptions when left out.
  accessOptions?: ShareAccessOption[]
  organisation?: string
  // The link Copy link copies. Left out: no Copy link.
  linkUrl?: string
  onCopyLink?: () => void
  // Email addresses outside the directory can be invited.
  allowExternal?: boolean
  // False for someone who may only look: no invite row, roles read only.
  canManage?: boolean
  // At the start of the footer, beside Copy link.
  footer?: ReactNode
  className?: string
}

export function ShareDialog({
  open, onOpenChange, title, description, members, people = [], roles, defaultRole, onInvite, onRoleChange, onRemove,
  onResend, access, onAccessChange, accessRole, onAccessRoleChange, accessOptions, organisation = 'your organisation',
  linkUrl, onCopyLink, allowExternal = true, canManage = true, footer, className,
}: ShareDialogProps) {
  const options = accessOptions ?? shareAccessOptions(organisation)
  const [copied, flagCopied] = useCopied()

  const copyLink = async () => {
    if (!linkUrl) return
    if (await copyText(linkUrl, { success: false })) {
      flagCopied()
      onCopyLink?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg', className)}>
        <DialogHeader className="px-4 pt-4 pb-3 pr-10">
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription>
            {description ?? (canManage ? 'Invite people and choose what they can do.' : 'Who can open it, and what they can do.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-4 px-4 pb-4">
          {canManage && (
            <InviteRow
              members={members}
              people={people}
              roles={roles}
              defaultRole={defaultRole}
              organisation={organisation}
              allowExternal={allowExternal}
              onInvite={onInvite}
            />
          )}

          <MemberList
            members={members}
            roles={roles}
            canManage={canManage}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
            onResend={onResend}
          />

          <GeneralAccess
            access={access}
            options={options}
            roles={roles}
            accessRole={accessRole}
            canManage={canManage}
            onAccessChange={onAccessChange}
            onAccessRoleChange={onAccessRoleChange}
          />
        </div>

        <DialogFooter className="bg-muted/40 flex-row flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {linkUrl && (
              <Button variant="outline" onClick={copyLink}>
                <HugeiconsIcon icon={copied ? Tick02Icon : Link01Icon} strokeWidth={2} data-icon="inline-start" />
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            )}
            {footer}
          </div>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Option = { kind: 'person'; person: SharePerson } | { kind: 'email'; email: string }

// The invite row: a people picker (search the directory, or type an email),
// the role, an optional message and Invite.
function InviteRow({ members, people, roles, defaultRole, organisation, allowExternal, onInvite }: {
  members: ShareMember[]
  people: SharePerson[]
  roles: ShareRole[]
  defaultRole?: string
  organisation: string
  allowExternal: boolean
  onInvite: ShareDialogProps['onInvite']
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<ShareInvitee[]>([])
  const [role, setRole] = useState(defaultRole ?? roles[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [active, setActive] = useState(0)

  const text = query.trim()
  const hasAccess = (email: string) => members.some((m) => same(m.email, email))
  const isPicked = (email: string) => picked.some((p) => same(p.email, email))

  // People who match what was typed (a few suggestions when nothing is), and
  // the typed address itself when it is a new one.
  const q = text.toLowerCase()
  const choices: Option[] = people
    .filter((p) => !hasAccess(p.email) && !isPicked(p.email))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    .slice(0, q ? 8 : 6)
    .map((person): Option => ({ kind: 'person', person }))
  if (allowExternal && isEmail(text) && !people.some((p) => same(p.email, text)) && !hasAccess(text) && !isPicked(text)) {
    choices.push({ kind: 'email', email: text })
  }

  // Why nothing can be picked for what was typed, if that is the case.
  const note = !text || choices.length
    ? ''
    : hasAccess(text) || members.some((m) => same(m.name, text))
      ? 'Already has access'
      : isEmail(text) && !allowExternal
        ? `Only people at ${organisation} can be invited`
        : 'No one found. Type a full email address to invite someone new.'

  const showList = listOpen && (choices.length > 0 || !!note)
  const optionId = (i: number) => `${id}-option-${i}`

  useEffect(() => setActive(0), [text])
  useEffect(() => {
    if (showList) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [id, active, showList])

  const add = (invitees: ShareInvitee[]) => {
    setPicked((list) => [...list, ...invitees.filter((i) => !list.some((p) => same(p.email, i.email)))])
    setQuery('')
    setError('')
    inputRef.current?.focus()
  }

  const choose = (option: Option) =>
    add([option.kind === 'person'
      ? { email: option.person.email, personId: option.person.id, name: option.person.name }
      : { email: option.email }])

  // Turns typed text into a chip: a person whose email it is, or the email itself.
  // Says whether it could.
  const commitText = (value: string) => {
    const t = value.trim()
    if (!t) return true
    const person = people.find((p) => same(p.email, t))
    const problem = hasAccess(t)
      ? `${t} already has access`
      : person ? ''
      : !isEmail(t) ? 'Enter a valid email address'
      : !allowExternal ? `Only people at ${organisation} can be invited`
      : ''
    if (problem) {
      setError(problem)
      return false
    }
    add([person ? { email: person.email, personId: person.id, name: person.name } : { email: t }])
    return true
  }

  const invite = () => {
    if (!picked.length) return
    onInvite(picked, role, message.trim() || undefined)
    setPicked([])
    setMessage('')
    setQuery('')
    setError('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!listOpen) return setListOpen(true)
      if (!choices.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + choices.length) % choices.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // With nothing typed, Enter sends the invites.
      if (!text && picked.length) invite()
      else if (showList && choices[active]) choose(choices[active])
      else commitText(query)
    } else if (e.key === ',' || e.key === ';') {
      if (!text) return
      e.preventDefault()
      commitText(query)
    } else if (e.key === 'Backspace' && !query && picked.length) {
      e.preventDefault()
      setPicked((list) => list.slice(0, -1))
    }
  }

  // Pasting a list of addresses adds each one; any that cannot be added stay
  // in the field with the error.
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const parts = e.clipboardData.getData('text').split(/[\s,;]+/).filter(Boolean)
    if (parts.length < 2) return
    e.preventDefault()
    const left = parts.filter((p) => !commitText(p))
    if (left.length) {
      setQuery(left.join(', '))
      setError(`${plural(left.length, 'address', 'addresses')} could not be added`)
    }
  }

  const errorId = `${id}-error`

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex min-w-0 flex-wrap items-start gap-2">
        <Popover open={showList} onOpenChange={setListOpen}>
          <PopoverAnchor asChild>
            <div
              ref={anchorRef}
              className={cn(
                'border-input bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 flex min-h-7 min-w-0 flex-1 basis-60 cursor-text flex-wrap items-center gap-1 rounded-md border px-1 py-0.5 transition-colors focus-within:ring-2',
                error && 'border-destructive ring-destructive/20 ring-2',
              )}
              onClick={() => {
                inputRef.current?.focus()
                setListOpen(true)
              }}
            >
              {picked.map((p) => (
                <span key={p.email} className="bg-muted flex h-5 max-w-full min-w-0 items-center gap-1 rounded-full pr-0.5 pl-0.5 text-[11px]">
                  {p.name
                    ? <UserAvatar name={p.name} className="size-4 [&_[data-slot=avatar-fallback]]:text-[8px]" />
                    : <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="text-muted-foreground ml-0.5 size-3 shrink-0" />}
                  <span className="truncate" title={p.email}>{p.name ?? p.email}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.name ?? p.email}`}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/40 flex size-4 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPicked((list) => list.filter((x) => x.email !== p.email))
                      inputRef.current?.focus()
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                role="combobox"
                aria-label="Add people by name or email"
                aria-expanded={showList}
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={showList && choices[active] ? optionId(active) : undefined}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? errorId : undefined}
                autoComplete="off"
                spellCheck={false}
                value={query}
                placeholder={picked.length ? 'Add more…' : 'Add people by name or email'}
                className="placeholder:text-muted-foreground h-6 min-w-24 flex-1 bg-transparent px-1 text-xs outline-none"
                onBlur={() => setListOpen(false)}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setError('')
                  setListOpen(true)
                }}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
              />
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) min-w-60 gap-0 p-1"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
            }}
          >
            <div
              id={`${id}-list`}
              role="listbox"
              aria-label="People"
              className="max-h-64 overflow-y-auto"
            >
              {!text && choices.length > 0 && <p className="text-muted-foreground px-2 pt-1 pb-1.5 text-[11px]">Suggested</p>}
              {choices.map((option, i) => (
                <div
                  key={option.kind === 'person' ? option.person.id : option.email}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={cn('flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-1.5', i === active && 'bg-accent text-accent-foreground')}
                  onMouseMove={() => setActive(i)}
                  onClick={() => choose(option)}
                >
                  {option.kind === 'person' ? (
                    <>
                      <UserAvatar name={option.person.name} />
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-xs">{option.person.name}</span>
                        <span className="text-muted-foreground truncate text-[11px]">
                          {option.person.email}{option.person.detail && ` · ${option.person.detail}`}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full">
                        <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs">Invite <span className="font-medium">{option.email}</span></span>
                    </>
                  )}
                </div>
              ))}
              {note && <p className="text-muted-foreground px-2 py-2 text-[11px]">{note}</p>}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex shrink-0 items-center gap-2">
          <ChoiceMenu label="Role for new people" value={role} roles={roles} onChange={setRole} />
          <Button disabled={!picked.length} onClick={invite}>Invite</Button>
        </div>
      </div>

      {error && <p id={errorId} role="alert" className="text-destructive text-[11px]">{error}</p>}

      {picked.length > 0 && (
        <Textarea
          aria-label="Message (optional)"
          placeholder="Add a message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-14"
        />
      )}
    </div>
  )
}

// A role picker as a menu: each role with its hint, and more items after it
// (Remove access, Resend invite).
function ChoiceMenu({ label, value, roles, onChange, disabled, children }: {
  label: string
  value: string
  roles: ShareRole[]
  onChange: (role: string) => void
  disabled?: boolean
  children?: ReactNode
}) {
  const current = roles.find((r) => r.id === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" disabled={disabled} aria-label={`${label}: ${current?.label ?? 'none'}`} className="text-muted-foreground shrink-0">
          {current?.label ?? 'Role'}
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {roles.map((r) => (
            <DropdownMenuRadioItem key={r.id} value={r.id} className="items-start">
              <span className="grid gap-0.5">
                <span>{r.label}</span>
                {r.hint && <span className="text-muted-foreground text-[11px] leading-4">{r.hint}</span>}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {children && (
          <>
            <DropdownMenuSeparator />
            {children}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Owner first, then people who have joined, then pending invites.
const rank = (m: ShareMember) => (m.isOwner ? 0 : m.status === 'active' ? 1 : 2)

function MemberList({ members, roles, canManage, onRoleChange, onRemove, onResend }: {
  members: ShareMember[]
  roles: ShareRole[]
  canManage: boolean
  onRoleChange: ShareDialogProps['onRoleChange']
  onRemove: ShareDialogProps['onRemove']
  onResend?: ShareDialogProps['onResend']
}) {
  const sorted = [...members].sort((a, b) => rank(a) - rank(b))
  return (
    <section className="grid min-w-0 gap-1.5" aria-label="People with access">
      <h4 className="text-muted-foreground text-[11px] font-medium">People with access · {members.length}</h4>
      <ul className="-mx-1 grid max-h-64 min-w-0 gap-0.5 overflow-y-auto">
        {sorted.map((m) => {
          const name = m.name || m.email
          const role = roles.find((r) => r.id === m.role)
          const invited = m.status === 'invited'
          return (
            <li key={m.id} className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1">
              <UserAvatar name={name} className={cn('size-7', invited && 'opacity-60')} />
              <div className="grid min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5 text-xs">
                  <span className="truncate">{name}</span>
                  {m.isYou && <span className="text-muted-foreground shrink-0">(You)</span>}
                  {invited && <Badge variant="outline" className="shrink-0">Invited</Badge>}
                </span>
                {m.name && <span className="text-muted-foreground truncate text-[11px]">{m.email}</span>}
              </div>
              {m.isOwner ? (
                <span className="text-muted-foreground shrink-0 px-2 text-xs">Owner</span>
              ) : !canManage ? (
                <span className="text-muted-foreground shrink-0 px-2 text-xs">{role?.label ?? m.role}</span>
              ) : (
                <ChoiceMenu label={`Role for ${name}`} value={m.role} roles={roles} onChange={(r) => onRoleChange(m.id, r)}>
                  {invited ? (
                    <>
                      {onResend && (
                        <DropdownMenuItem onSelect={() => onResend(m.id)}>
                          <HugeiconsIcon icon={MailSend01Icon} strokeWidth={2} /> Resend invite
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem variant="destructive" onSelect={() => onRemove(m.id)}>
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} /> Cancel invite
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem variant="destructive" onSelect={() => onRemove(m.id)}>
                      <HugeiconsIcon icon={UserRemove01Icon} strokeWidth={2} /> {m.isYou ? 'Leave' : 'Remove access'}
                    </DropdownMenuItem>
                  )}
                </ChoiceMenu>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function GeneralAccess({ access, options, roles, accessRole, canManage, onAccessChange, onAccessRoleChange }: {
  access: ShareAccess
  options: ShareAccessOption[]
  roles: ShareRole[]
  accessRole?: string
  canManage: boolean
  onAccessChange: ShareDialogProps['onAccessChange']
  onAccessRoleChange?: ShareDialogProps['onAccessRoleChange']
}) {
  const current = options.find((o) => o.id === access) ?? options[0]
  if (!current) return null
  return (
    <section className="grid min-w-0 gap-1.5" aria-label="General access">
      <h4 className="text-muted-foreground text-[11px] font-medium">General access</h4>
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            access === 'restricted' ? 'bg-muted text-muted-foreground' : 'bg-brand/10 text-brand',
          )}
        >
          <HugeiconsIcon icon={current.icon} strokeWidth={2} className="size-3.5" />
        </span>
        <div className="grid min-w-0 flex-1 justify-items-start">
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label={`General access: ${current.label}`} className="-ml-2 max-w-full">
                  <span className="truncate">{current.label}</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuRadioGroup value={access} onValueChange={(v) => onAccessChange(v as ShareAccess)}>
                  {options.map((o) => (
                    <DropdownMenuRadioItem key={o.id} value={o.id} className="items-start">
                      <HugeiconsIcon icon={o.icon} strokeWidth={2} className="mt-0.5" />
                      <span className="grid gap-0.5">
                        <span>{o.label}</span>
                        <span className="text-muted-foreground text-[11px] leading-4">{o.hint}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-xs">{current.label}</span>
          )}
          <span className="text-muted-foreground min-w-0 text-[11px]">{current.hint}</span>
        </div>
        {access === 'organisation' && accessRole && (
          canManage && onAccessRoleChange
            ? <ChoiceMenu label="Role for everyone" value={accessRole} roles={roles} onChange={onAccessRoleChange} />
            : <span className="text-muted-foreground shrink-0 px-2 text-xs">{roles.find((r) => r.id === accessRole)?.label}</span>
        )}
        {access === 'link' && <span className="text-muted-foreground shrink-0 px-2 text-xs">Can view</span>}
      </div>
    </section>
  )
}

// The avatars of the people with access, in a stack, with the rest as +N.
function AvatarStack({ members, max }: { members: ShareMember[]; max: number }) {
  if (!members.length) return null
  const shown = members.slice(0, max)
  const rest = members.length - shown.length
  // Spans, not the avatar group's divs: the stack also sits inside a button.
  return (
    <span aria-hidden data-slot="avatar-group" className="flex -space-x-1.5 *:data-[slot=avatar]:ring-1 *:data-[slot=avatar]:ring-background">
      {shown.map((m) => <UserAvatar key={m.id} name={m.name || m.email} className="size-5 [&_[data-slot=avatar-fallback]]:text-[8px]" />)}
      {rest > 0 && (
        <span className="bg-muted text-muted-foreground ring-background relative flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] ring-1">
          +{rest}
        </span>
      )}
    </span>
  )
}

export type ShareSummaryProps = {
  members: ShareMember[]
  access: ShareAccess
  organisation?: string
  // How many avatars before +N.
  max?: number
  className?: string
}

// Who can open it, in one line: the avatars of the people added (or a lock,
// a building or a link) and "Only you", "Shared with 4", "Everyone at Acme".
export function ShareSummary({ members, access, organisation, max = 3, className }: ShareSummaryProps) {
  const others = members.filter((m) => !m.isYou)
  const icon = access === 'organisation' ? Building06Icon : access === 'link' ? Link01Icon : others.length ? null : LockIcon
  return (
    <span className={cn('text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs', className)}>
      {icon
        ? <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0" />
        : <AvatarStack members={others} max={max} />}
      <span className="truncate">{shareSummaryLabel(members, access, organisation)}</span>
    </span>
  )
}

export type ShareButtonProps = ComponentProps<typeof Button> & {
  members: ShareMember[]
  access: ShareAccess
  organisation?: string
  max?: number
}

// Share, with the avatars of the people it is shared with. Opens the share
// dialog: pass onClick, or use it as the dialog's trigger.
export function ShareButton({ members, access, organisation, max = 3, variant = 'outline', children = 'Share', ...props }: ShareButtonProps) {
  const others = members.filter((m) => !m.isYou)
  const label = shareSummaryLabel(members, access, organisation)
  return (
    <Button variant={variant} title={label} {...props}>
      {others.length
        ? <AvatarStack members={others} max={max} />
        : <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />}
      {children}
      <span className="sr-only">, {label}</span>
    </Button>
  )
}
