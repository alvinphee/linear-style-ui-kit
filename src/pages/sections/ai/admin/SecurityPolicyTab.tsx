import { useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon, Logout03Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { plural } from '@/lib/text'
import { useStoredState } from '../settings/prefs'
import { ORG, useOrgPolicy } from './org'
import { useOrgSso } from './SsoTab'

// The admin console's Security policies section: what everyone in the
// organisation must do to sign in. Two-step verification and session length
// are written to the org policy (useOrgPolicy); the sign-in methods and the
// IP allowlist are kept in this browser for the demo. Nothing is enforced.

type Method = 'password' | 'passkeys' | 'sso'

type SecurityPolicyState = {
  methods: Record<Method, boolean>
  allowlistOn: boolean
  allowlist: { cidr: string; label: string }[]
}

const KEY = 'linear-kit:ai-org-security:v1'
const INITIAL: SecurityPolicyState = {
  methods: { password: true, passkeys: true, sso: true },
  allowlistOn: false,
  allowlist: [
    { cidr: '198.51.100.0/24', label: 'Singapore office' },
    { cidr: '203.0.113.16/28', label: 'Company VPN' },
  ],
}

const METHODS: { id: Method; label: string; hint: string }[] = [
  { id: 'password', label: 'Password', hint: 'Email and password, with two-step verification if it is required.' },
  { id: 'passkeys', label: 'Passkeys', hint: 'Fingerprint, face or screen lock on a person’s own device.' },
  { id: 'sso', label: 'SSO', hint: 'Through your identity provider. Set it up under SSO and provisioning.' },
]

const SESSION_LENGTHS = [
  { hours: 24, label: '1 day' },
  { hours: 24 * 7, label: '7 days' },
  { hours: 24 * 14, label: '14 days' },
  { hours: 24 * 30, label: '30 days' },
]

// The admin's own address, to warn before an allowlist locks them out.
const YOUR_IP = '198.51.100.24'
// How many people the organisation has signed in, for the sign-out toast.
const SIGNED_IN = 21

/* ---------- CIDR ---------- */

function ipv4ToNumber(ip: string) {
  const parts = ip.split('.')
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null
  return parts.reduce((n, p) => n * 256 + Number(p), 0)
}

// "198.51.100.0/24", a bare address (taken as /32) or an IPv6 range.
// Returns the range written out in full, or an error to show.
export function parseCidr(value: string): { cidr: string } | { error: string } {
  const text = value.trim()
  if (!text) return { error: 'Enter an IP address or range.' }
  const [ip, prefix, extra] = text.split('/')
  if (extra !== undefined) return { error: 'Use one slash, as in 198.51.100.0/24.' }
  if (ip.includes(':')) {
    const valid = /^[0-9a-f:]+$/i.test(ip) && (ip.match(/::/g)?.length ?? 0) <= 1 && ip.split(':').length <= 8
    const bits = prefix === undefined ? 128 : Number(prefix)
    if (!valid) return { error: 'That isn’t an IPv6 address.' }
    if (!Number.isInteger(bits) || bits < 0 || bits > 128 || (prefix !== undefined && !/^\d+$/.test(prefix))) {
      return { error: 'An IPv6 range ends in /0 to /128.' }
    }
    return { cidr: `${ip.toLowerCase()}/${bits}` }
  }
  if (ipv4ToNumber(ip) === null) return { error: 'That isn’t an IP address. Use four numbers from 0 to 255, as in 198.51.100.7.' }
  const bits = prefix === undefined ? 32 : Number(prefix)
  if ((prefix !== undefined && !/^\d+$/.test(prefix)) || bits > 32) return { error: 'An IPv4 range ends in /0 to /32.' }
  return { cidr: `${ip}/${bits}` }
}

function ipv4InRange(ip: string, cidr: string) {
  const [base, prefix] = cidr.split('/')
  const a = ipv4ToNumber(ip)
  const b = ipv4ToNumber(base)
  if (a === null || b === null) return false
  const size = 2 ** (32 - Number(prefix))
  return Math.floor(a / size) === Math.floor(b / size)
}

export function SecurityPolicyTab() {
  const id = useId()
  const { policy, patch } = useOrgPolicy()
  const [state, setState] = useStoredState<SecurityPolicyState>(KEY, INITIAL)
  const [sso] = useOrgSso()
  const security = policy.security
  const setSecurity = (change: Partial<typeof security>) => patch('security', { ...security, ...change })

  const methodsOn = METHODS.filter((m) => state.methods[m.id] && (m.id !== 'sso' || sso.enabled))
  const youAreIn = state.allowlist.some((r) => ipv4InRange(YOUR_IP, r.cidr))

  function setMethod(method: Method, on: boolean) {
    setState((s) => ({ ...s, methods: { ...s.methods, [method]: on } }))
  }

  return (
    <>
      <SettingsHeader title="Security policies" description={`What everyone at ${ORG.name} must do to sign in, and from where.`} />

      <SettingsGroup title="Signing in">
        <SettingsRow
          label="Require two-step verification"
          htmlFor={`${id}-two-step`}
          hint="People who sign in with a password must also enter a code from an authenticator app. Those without it set it up at their next sign-in."
        >
          <Switch
            id={`${id}-two-step`}
            checked={security.twoStepRequired}
            onCheckedChange={(on) => {
              setSecurity({ twoStepRequired: on })
              toast(on ? 'Two-step verification is required' : 'Two-step verification is optional')
            }}
          />
        </SettingsRow>
        <SettingsRow label="Session length" htmlFor={`${id}-session`} hint="How long people stay signed in before they must sign in again.">
          <Select
            value={String(security.sessionHours)}
            onValueChange={(v) => {
              setSecurity({ sessionHours: Number(v) })
              toast('Session length changed', { description: 'Applies from each person’s next sign-in.' })
            }}
          >
            <SelectTrigger id={`${id}-session`} size="sm" className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SESSION_LENGTHS.map((s) => <SelectItem key={s.hours} value={String(s.hours)}>{s.label}</SelectItem>)}
              {!SESSION_LENGTHS.some((s) => s.hours === security.sessionHours) && (
                <SelectItem value={String(security.sessionHours)}>{plural(security.sessionHours, 'hour')}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Allowed sign-in methods"
        description={security.ssoRequired
          ? 'SSO is required, so people at verified domains can only use SSO. These apply to everyone else.'
          : 'Keep at least one on.'}
      >
        {METHODS.map((m) => {
          const unavailable = m.id === 'sso' && !sso.enabled
          const checked = state.methods[m.id] && !unavailable
          // The last method still on can't be turned off.
          const last = checked && methodsOn.length === 1
          return (
            <SettingsRow
              key={m.id}
              label={m.label}
              htmlFor={`${id}-method-${m.id}`}
              hint={unavailable ? 'SSO isn’t on yet. Set it up under SSO and provisioning.' : last ? 'The only method left on.' : m.hint}
            >
              <Checkbox
                id={`${id}-method-${m.id}`}
                checked={checked}
                disabled={unavailable || last}
                onCheckedChange={(v) => setMethod(m.id, v === true)}
              />
            </SettingsRow>
          )
        })}
      </SettingsGroup>

      <SettingsGroup title="IP allowlist" description="Only let people sign in from these addresses, such as your offices and VPN. Demo only: nothing is blocked.">
        <SettingsRow
          label="Only allow these addresses"
          htmlFor={`${id}-allowlist`}
          hint={state.allowlist.length ? `${plural(state.allowlist.length, 'range')} on the list.` : 'Add a range first.'}
        >
          <Switch
            id={`${id}-allowlist`}
            checked={state.allowlistOn && state.allowlist.length > 0}
            disabled={!state.allowlist.length}
            onCheckedChange={(on) => setState((s) => ({ ...s, allowlistOn: on }))}
          />
        </SettingsRow>
        {state.allowlistOn && state.allowlist.length > 0 && !youAreIn && (
          <p role="alert" className="text-status-blocked flex items-start gap-1.5 px-3 py-2.5 text-[11px]">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="mt-px size-3.5 shrink-0" />
            Your address ({YOUR_IP}) isn’t on the list. You would be signed out and couldn’t sign back in.
          </p>
        )}
        <ul aria-label="Allowed IP ranges" className="divide-y">
          {state.allowlist.map((r) => (
            <li key={r.cidr} className="flex min-w-0 items-center gap-3 px-3 py-2">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <code className="truncate font-mono text-xs">{r.cidr}</code>
                {r.label && <span className="text-muted-foreground truncate text-[11px]">{r.label}</span>}
              </div>
              {ipv4InRange(YOUR_IP, r.cidr) && <span className="text-muted-foreground shrink-0 text-[11px]">Your address</span>}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${r.cidr}`}
                className="text-muted-foreground"
                onClick={() => setState((s) => {
                  const allowlist = s.allowlist.filter((x) => x.cidr !== r.cidr)
                  return { ...s, allowlist, allowlistOn: s.allowlistOn && allowlist.length > 0 }
                })}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </li>
          ))}
        </ul>
        <AddRange
          taken={state.allowlist.map((r) => r.cidr)}
          onAdd={(range) => setState((s) => ({ ...s, allowlist: [...s.allowlist, range] }))}
        />
      </SettingsGroup>

      <SettingsGroup title="Sessions">
        <SettingsRow label="Sign out everyone" hint="Ends every session in the organisation, on every device, including yours. People sign in again with the rules above.">
          <DeleteConfirm
            icon={Logout03Icon}
            title="Sign out everyone?"
            description={`All ${SIGNED_IN} people signed in to ${ORG.name} are signed out on every device straight away, you included. Unsaved prompts are lost.`}
            confirmLabel="Sign out everyone"
            size="sm"
            onConfirm={() => toast(`Signed out ${SIGNED_IN} people`, { description: 'Demo only. Nobody was signed out.' })}
          >
            <Button variant="outline" size="sm" className="text-destructive">Sign out everyone</Button>
          </DeleteConfirm>
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}

function AddRange({ taken, onAdd }: { taken: string[]; onAdd: (range: { cidr: string; label: string }) => void }) {
  const id = useId()
  const [cidr, setCidr] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string>()

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseCidr(cidr)
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    if (taken.includes(parsed.cidr)) {
      setError('That range is already on the list.')
      return
    }
    onAdd({ cidr: parsed.cidr, label: label.trim() })
    setCidr('')
    setLabel('')
    setError(undefined)
  }

  return (
    <form onSubmit={submit} noValidate className="grid min-w-0 gap-2 border-t px-3 py-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor={`${id}-cidr`}>IP address or range</FieldLabel>
          <Input
            id={`${id}-cidr`}
            value={cidr}
            onChange={(e) => {
              setCidr(e.target.value)
              setError(undefined)
            }}
            placeholder="198.51.100.0/24"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="font-mono"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-label`}>Label (optional)</FieldLabel>
          <Input id={`${id}-label`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Head office" />
        </Field>
        <Button type="submit" variant="outline">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" /> Add
        </Button>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </form>
  )
}
