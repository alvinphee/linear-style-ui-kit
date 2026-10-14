import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, ArrowDown01Icon, Cancel01Icon, Copy01Icon, Link01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { copyText, useCopied } from '@/lib/clipboard'
import { plural } from '@/lib/text'

// Invite people to an organisation or workspace, as admin consoles do it:
// type or paste many email addresses at once (a column from a spreadsheet,
// or "Name <name@example.com>" lines from a mail app), each becoming a chip.
// Addresses that are not valid, or belong to someone already in, are
// flagged; addresses outside the organisation's domain are marked External.
// Then the role and groups they join with, an optional message, and Send
// invites. Below, an invite link to copy and the domain auto-join switch.
// The app sends the invites; the dialog only collects them.

export type InviteRoleOption = { id: string; label: string; hint?: string }
export type InviteGroupOption = { id: string; name: string }

export type InviteMembersDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: InviteRoleOption[]
  // The role picked to start with. The first role when left out.
  defaultRole?: string
  // Groups to add the new people to. Left out: no Groups picker.
  groups?: InviteGroupOption[]
  // The organisation's email domain, such as example.com. Other addresses are
  // marked External, and the auto-join switch names it.
  domain?: string
  // Emails already in the organisation (members and pending invites).
  existingEmails?: string[]
  // Seats still free. More invites than this can't be sent.
  seatsLeft?: number
  onInvite: (emails: string[], role: string, groups: string[], message?: string) => void
  // A link anyone can use to ask to join. Left out: no invite link section.
  inviteLink?: string
  onCopyLink?: () => void
  // Domain auto-join: people with an email at `domain` can join without an invite.
  autoJoin?: boolean
  onAutoJoinChange?: (on: boolean) => void
  title?: string
  description?: string
}

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/
const lower = (s: string) => s.trim().toLowerCase()

// Splits pasted or typed text into addresses: "Name <a@b.com>" keeps only the
// address; commas, semicolons, spaces and new lines separate them.
function splitEmails(text: string) {
  return text
    .replace(/[^,;\n<]*<([^>]*)>/g, ' $1 ')
    .split(/[\s,;]+/)
    .map((s) => s.trim().replace(/^mailto:/i, ''))
    .filter(Boolean)
}

export function InviteMembersDialog(props: InviteMembersDialogProps) {
  const { open, onOpenChange, title = 'Invite people', description } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4 pb-3 pr-10">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? 'Each person gets an email with a link to join. Paste a list to invite many at once.'}
          </DialogDescription>
        </DialogHeader>
        {/* Inside the content, so it starts empty each time the dialog opens. */}
        <InviteForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

function InviteForm({
  onOpenChange, roles, defaultRole, groups, domain, existingEmails = [], seatsLeft, onInvite, inviteLink, onCopyLink,
  autoJoin, onAutoJoinChange,
}: InviteMembersDialogProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [text, setText] = useState('')
  const [role, setRole] = useState(defaultRole ?? roles[0]?.id ?? '')
  const [picked, setPicked] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [copied, flagCopied] = useCopied()

  const existing = new Set(existingEmails.map(lower))
  const problemOf = (email: string) =>
    !EMAIL.test(email) ? 'Not a valid email address' : existing.has(lower(email)) ? 'Already in the organisation' : undefined
  const isExternal = (email: string) => !!domain && EMAIL.test(email) && !lower(email).endsWith(`@${domain.toLowerCase()}`)

  const valid = emails.filter((e) => !problemOf(e))
  const invalid = emails.filter((e) => problemOf(e))
  const external = valid.filter(isExternal)
  const overSeats = seatsLeft !== undefined && valid.length > seatsLeft

  const add = (raw: string) => {
    const parts = splitEmails(raw)
    if (!parts.length) return
    setEmails((list) => {
      const seen = new Set(list.map(lower))
      const next = [...list]
      for (const p of parts) {
        if (seen.has(lower(p))) continue
        seen.add(lower(p))
        next.push(p)
      }
      return next
    })
  }

  const commit = () => {
    if (!text.trim()) return
    add(text)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === ' ' || e.key === 'Tab') && text.trim()) {
      e.preventDefault()
      commit()
    } else if (e.key === 'Enter') {
      // Enter in an empty field does not send, so a stray press can't invite people.
      e.preventDefault()
    } else if (e.key === 'Backspace' && !text && emails.length) {
      e.preventDefault()
      setEmails((list) => list.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (splitEmails(pasted).length < 2 && !/[\n,;<]/.test(pasted)) return
    e.preventDefault()
    add(`${text} ${pasted}`)
    setText('')
  }

  const send = () => {
    if (!valid.length || invalid.length || overSeats) return
    onInvite(valid, role, picked, message.trim() || undefined)
    onOpenChange(false)
  }

  const roleNow = roles.find((r) => r.id === role)
  const groupNames = (groups ?? []).filter((g) => picked.includes(g.id)).map((g) => g.name)
  const summaryId = `${id}-summary`

  return (
    <>
      <div className="grid min-w-0 gap-4 px-4 pb-4">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-emails`}>Email addresses</Label>
          <div
            className={cn(
              'border-input bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 flex min-h-16 min-w-0 cursor-text flex-wrap content-start items-center gap-1 rounded-md border p-1 transition-colors focus-within:ring-2',
              invalid.length > 0 && 'border-destructive/60',
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {emails.map((email) => {
              const problem = problemOf(email)
              const ext = !problem && isExternal(email)
              return (
                <span
                  key={email}
                  title={problem ?? (ext ? 'Outside your organisation' : undefined)}
                  className={cn(
                    'flex h-5 max-w-full min-w-0 items-center gap-1 rounded-full pr-0.5 pl-2 text-[11px]',
                    problem ? 'bg-destructive/10 text-destructive ring-destructive/40 ring-1' : 'bg-muted',
                  )}
                >
                  {problem && <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="-ml-1 size-3 shrink-0" />}
                  <span className="truncate">{email}</span>
                  {problem && <span className="sr-only">: {problem}</span>}
                  {ext && <span className="text-status-progress shrink-0 font-medium">External</span>}
                  <button
                    type="button"
                    aria-label={`Remove ${email}`}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/40 flex size-4 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEmails((list) => list.filter((x) => x !== email))
                      inputRef.current?.focus()
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-2.5" />
                  </button>
                </span>
              )
            })}
            <input
              ref={inputRef}
              id={`${id}-emails`}
              autoComplete="off"
              spellCheck={false}
              value={text}
              aria-describedby={summaryId}
              aria-invalid={invalid.length > 0 || undefined}
              placeholder={emails.length ? 'Add more…' : `name@${domain ?? 'example.com'}, another@${domain ?? 'example.com'}`}
              className="placeholder:text-muted-foreground h-6 min-w-32 flex-1 bg-transparent px-1 text-xs outline-none"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={commit}
            />
          </div>
          <p id={summaryId} aria-live="polite" className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-[11px]">
            {emails.length === 0 ? (
              'Separate addresses with commas, spaces or new lines.'
            ) : (
              <>
                <span>{plural(valid.length, 'person', 'people')} to invite</span>
                {external.length > 0 && <span className="text-status-progress">{external.length} external</span>}
                {invalid.length > 0 && (
                  <span className="text-destructive flex items-center gap-1">
                    {invalid.length} can’t be invited
                    <button
                      type="button"
                      className="hover:text-foreground focus-visible:ring-ring/40 rounded underline underline-offset-2 outline-none focus-visible:ring-2"
                      onClick={() => setEmails(valid)}
                    >
                      Remove {invalid.length === 1 ? 'it' : 'them'}
                    </button>
                  </span>
                )}
              </>
            )}
          </p>
          {overSeats && (
            <p role="alert" className="text-destructive text-[11px]">
              Only {plural(seatsLeft ?? 0, 'seat')} left. Add seats, or invite fewer people.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor={`${id}-role`}>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id={`${id}-role`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleNow?.hint && <p className="text-muted-foreground text-[11px] leading-4">{roleNow.hint}</p>}
          </div>

          {groups && groups.length > 0 && (
            <div className="grid min-w-0 content-start gap-1.5">
              <Label id={`${id}-groups`}>Groups</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" aria-labelledby={`${id}-groups ${id}-groups-value`} className="w-full justify-between font-normal">
                    <span id={`${id}-groups-value`} className={cn('truncate', !groupNames.length && 'text-muted-foreground')}>
                      {groupNames.length ? groupNames.join(', ') : 'No groups'}
                    </span>
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-44">
                  {groups.map((g) => (
                    <DropdownMenuCheckboxItem
                      key={g.id}
                      checked={picked.includes(g.id)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(on) => setPicked((list) => (on ? [...list, g.id] : list.filter((x) => x !== g.id)))}
                    >
                      {g.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${id}-message`}>
            Message <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id={`${id}-message`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Added to the invite email"
            className="min-h-14"
          />
        </div>

        {(inviteLink || onAutoJoinChange) && (
          <section aria-labelledby={`${id}-link-title`} className="grid min-w-0 gap-2.5 border-t pt-4">
            <h3 id={`${id}-link-title`} className="text-xs font-medium">Or share an invite link</h3>
            {inviteLink && (
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
                </InputGroupAddon>
                <InputGroupInput readOnly value={inviteLink} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="xs"
                    onClick={async () => {
                      if (await copyText(inviteLink, { success: false })) {
                        flagCopied()
                        onCopyLink?.()
                      }
                    }}
                  >
                    <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                    {copied ? 'Copied' : 'Copy link'}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            )}
            {onAutoJoinChange && domain && (
              <div className="flex items-center justify-between gap-4">
                <div className="grid min-w-0 gap-0.5">
                  <Label htmlFor={`${id}-autojoin`} className="font-normal">Anyone at {domain} can join</Label>
                  <p className="text-muted-foreground text-[11px] leading-4">
                    People who sign up with an @{domain} email join without an invite.
                  </p>
                </div>
                <Switch id={`${id}-autojoin`} checked={!!autoJoin} onCheckedChange={onAutoJoinChange} />
              </div>
            )}
          </section>
        )}
      </div>

      <DialogFooter className="bg-muted/40 flex-row flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
        {invalid.length > 0 && (
          <p className="text-muted-foreground mr-auto text-[11px]">Fix or remove the flagged addresses to send.</p>
        )}
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button disabled={!valid.length || invalid.length > 0 || overSeats} onClick={send}>
          {valid.length > 1 ? `Send ${valid.length} invites` : 'Send invite'}
        </Button>
      </DialogFooter>
    </>
  )
}
