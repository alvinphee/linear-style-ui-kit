import { useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Globe02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { CopyField } from '@/components/copy-field'
import { DeleteConfirm } from '@/components/delete-confirm'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { formatShortDate } from '@/lib/format'

// Domain verification, as an organisation's admin console asks for it before
// SSO or provisioning can claim everyone at a domain: each domain with its
// status (Verified, Pending, Failed). A pending or failed domain shows the
// DNS TXT record to add at the domain's DNS host, with copy buttons, and a
// Verify button. Add domain checks the name before handing it on.
//
// No data of its own: the app makes the TXT record when a domain is added,
// and looks it up when Verify is pressed (return a promise to show a spinner
// until it settles).

export type DomainStatus = 'verified' | 'pending' | 'failed'

export type VerifiedDomain = {
  domain: string
  status: DomainStatus
  // The TXT record to add: its name (host) and value.
  txtName: string
  txtValue: string
  // When it was verified, for "Verified 12 Aug 2026".
  verifiedAt?: number
}

const STATUS: Record<DomainStatus, { label: string; tone: Tone }> = {
  verified: { label: 'Verified', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
}

// A domain name: labels of letters, digits and hyphens, and a top-level part of letters.
const DOMAIN = /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/

// Says what is wrong with a domain someone typed, or nothing when it will do.
export function domainError(value: string, taken: string[] = []) {
  const domain = value.trim().toLowerCase()
  if (!domain) return 'Enter a domain.'
  if (/^[a-z]+:\/\//.test(domain) || domain.includes('/')) return 'Enter the domain only, without https:// or a path.'
  if (domain.includes('@')) return 'Enter the part after the @, such as example.com.'
  if (!DOMAIN.test(domain)) return 'That is not a domain. Try something like example.com.'
  if (taken.includes(domain)) return 'That domain is already on the list.'
  return undefined
}

export function DomainVerification({ domains, onAdd, onVerify, onRemove, className }: {
  domains: VerifiedDomain[]
  // Gets the domain trimmed and in lower case.
  onAdd: (domain: string) => void
  onVerify: (domain: string) => void | Promise<unknown>
  onRemove: (domain: string) => void
  className?: string
}) {
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState<string[]>([])

  async function verify(domain: string) {
    setChecking((c) => [...c, domain])
    try {
      await onVerify(domain)
    } finally {
      setChecking((c) => c.filter((d) => d !== domain))
    }
  }

  return (
    <div className={className}>
      {domains.length ? (
        <ul aria-label="Domains" className="divide-y">
          {domains.map((d) => (
            <DomainRow
              key={d.domain}
              domain={d}
              checking={checking.includes(d.domain)}
              onVerify={() => verify(d.domain)}
              onRemove={() => onRemove(d.domain)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-xs">
          <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-4 shrink-0" />
          No domains yet. Add your organisation’s email domain to claim its accounts.
        </p>
      )}
      <div className="border-t px-3 py-2">
        <Button variant="ghost" size="sm" className="-ml-1.5" onClick={() => setAdding(true)}>
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" /> Add domain
        </Button>
      </div>
      <AddDomainDialog
        open={adding}
        onOpenChange={setAdding}
        taken={domains.map((d) => d.domain)}
        onAdd={(domain) => {
          onAdd(domain)
          setAdding(false)
        }}
      />
    </div>
  )
}

function DomainRow({ domain: d, checking, onVerify, onRemove }: {
  domain: VerifiedDomain
  checking: boolean
  onVerify: () => void
  onRemove: () => void
}) {
  const status = STATUS[d.status]
  return (
    <li className="grid min-w-0 gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-md">
          <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-4" />
        </span>
        <div className="grid min-w-0 flex-1 basis-40 gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-medium">{d.domain}</span>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </span>
          <span className="text-muted-foreground text-[11px]">
            {d.status === 'verified'
              ? d.verifiedAt ? `Verified ${formatShortDate(d.verifiedAt, { year: true })}` : 'Verified'
              : d.status === 'failed'
                ? 'We couldn’t find the TXT record. Check it, then try again.'
                : 'Add the TXT record below at your DNS host, then verify.'}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {d.status !== 'verified' && (
            <Button variant="outline" size="sm" disabled={checking} onClick={onVerify}>
              {checking && <Spinner data-icon="inline-start" className="size-3.5" />}
              {checking ? 'Checking…' : 'Verify'}
              {!checking && <span className="sr-only"> {d.domain}</span>}
            </Button>
          )}
          <DeleteConfirm
            title={`Remove ${d.domain}?`}
            description={d.status === 'verified'
              ? 'Accounts at this domain are no longer claimed by your organisation, and SSO stops applying to them.'
              : 'Its TXT record is no longer checked. You can add the domain again later.'}
            confirmLabel="Remove"
            size="sm"
            onConfirm={onRemove}
          >
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${d.domain}`} className="text-muted-foreground">
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </DeleteConfirm>
        </div>
      </div>

      {d.status !== 'verified' && (
        <div role="group" aria-label={`DNS record for ${d.domain}`} className="bg-subtle grid min-w-0 gap-2 rounded-md border p-2.5 sm:ml-11">
          <dl className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-3">
            <dt className="text-muted-foreground text-[11px]">Type</dt>
            <dd className="font-mono text-xs">TXT</dd>
            <dt className="text-muted-foreground text-[11px]">Name</dt>
            <dd><CopyField value={d.txtName} label="TXT record name" /></dd>
            <dt className="text-muted-foreground text-[11px]">Value</dt>
            <dd><CopyField value={d.txtValue} label="TXT record value" /></dd>
          </dl>
          <p className="text-muted-foreground text-[11px]">DNS changes can take up to 48 hours to show, though most appear within minutes.</p>
        </div>
      )}
    </li>
  )
}

function AddDomainDialog({ open, onOpenChange, taken, onAdd }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  taken: string[]
  onAdd: (domain: string) => void
}) {
  const id = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = domainError(value, taken)
    if (problem) {
      setError(problem)
      return
    }
    onAdd(value.trim().toLowerCase())
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next)
      if (!next) {
        setValue('')
        setError(undefined)
      }
    }}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Add a domain</DialogTitle>
            <DialogDescription>
              The part of your email addresses after the @. You’ll get a DNS record to prove you own it.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor={`${id}-domain`}>Domain</FieldLabel>
            <Input
              id={`${id}-domain`}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(undefined)
              }}
              placeholder="example.com"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              aria-invalid={!!error || undefined}
              aria-describedby={`${id}-hint`}
            />
            {error ? <FieldError id={`${id}-hint`}>{error}</FieldError> : (
              <FieldDescription id={`${id}-hint`}>Add subdomains separately, such as eu.example.com.</FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
            <Button type="submit">Add domain</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
