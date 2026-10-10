import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon, Copy01Icon, Download01Icon, FingerPrintIcon, Key01Icon, PlusSignIcon, RefreshIcon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { toast } from 'sonner'
import { SessionList, type Session } from '@/blocks/session-list'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { QrCode } from '@/components/qr-code'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { copyText, useCopied } from '@/lib/clipboard'
import { downloadText } from '@/lib/download'
import { formatShortDate } from '@/lib/format'
import { DAY, MINUTE, USER, now } from '../data'
import { useStoredState } from './prefs'

// Security: two-step verification with an authenticator app (and its
// recovery codes), passkeys, and the devices you are signed in on. Nothing
// here talks to a server; every action is kept in this browser.

type Passkey = { id: string; name: string; created: number; lastUsed?: number }

type SecurityState = {
  twoStep: boolean
  recoveryCodes: string[]
  passkeys: Passkey[]
  // Sample devices you signed out of. The samples are worked out from the
  // demo clock on each visit, so only what changed is kept.
  signedOut: string[]
}

const KEY = 'linear-kit:ai-security:v1'
const INITIAL: SecurityState = {
  twoStep: false,
  recoveryCodes: [],
  passkeys: [
    { id: 'pk-1', name: 'Work laptop', created: new Date(2026, 6, 14).getTime(), lastUsed: new Date(2026, 8, 29, 8, 12).getTime() },
  ],
  signedOut: [],
}

// Made-up signed-in devices, timed from `base` so "last active" always reads
// the same. The kit's Signed-in devices panels use them too.
export function sampleSessions(base: number): Session[] {
  return [
    { id: 's-laptop', device: 'desktop', name: 'Work laptop', browser: 'Chrome 129', os: 'macOS', location: 'Singapore', lastActive: base, current: true },
    { id: 's-phone', device: 'phone', name: `${USER.first}’s phone`, browser: 'Safari', os: 'iOS 18', location: 'Singapore', lastActive: base - 42 * MINUTE },
    { id: 's-tablet', device: 'tablet', name: 'Home tablet', browser: 'Safari', os: 'iPadOS 18', location: 'Singapore', lastActive: base - DAY - 3 * 60 * MINUTE },
    { id: 's-office', device: 'desktop', name: 'Office desktop', browser: 'Edge 129', os: 'Windows 11', location: 'Kuala Lumpur, Malaysia', lastActive: base - 3 * DAY },
    { id: 's-android', device: 'phone', name: 'Android phone', browser: 'Chrome', os: 'Android 15', location: 'Jakarta, Indonesia', lastActive: base - 12 * DAY },
  ]
}

// The demo authenticator set-up: a fixed secret, so the QR code is the same
// on every visit. Base32, as authenticator apps expect.
const SECRET = 'K7QF3XNAM2PL6RVD'
const ISSUER = 'Assistant'
const OTPAUTH = `otpauth://totp/${ISSUER}:${encodeURIComponent(USER.email)}?secret=${SECRET}&issuer=${ISSUER}&digits=6&period=30`

// Eight one-time codes, "k3m9-x7qp": no 0/o or 1/l, which are easy to misread.
function newRecoveryCodes() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = new Uint8Array(64)
  crypto.getRandomValues(bytes)
  const code = (i: number) => Array.from(bytes.slice(i * 8, i * 8 + 8), (b) => chars[b % chars.length]).join('')
  return Array.from({ length: 8 }, (_, i) => `${code(i).slice(0, 4)}-${code(i).slice(4)}`)
}

export function SecurityTab() {
  const [state, setState] = useStoredState<SecurityState>(KEY, INITIAL)
  const [setup, setSetup] = useState<Step | null>(null)
  // New recovery codes for two-step verification that is already on.
  const [regenerating, setRegenerating] = useState(false)
  const [codes, setCodes] = useState<string[]>([])
  const base = now()
  const sessions = sampleSessions(base).filter((s) => !state.signedOut.includes(s.id))

  function startSetup() {
    setCodes(newRecoveryCodes())
    setRegenerating(false)
    setSetup('scan')
  }

  function regenerate() {
    const next = newRecoveryCodes()
    setCodes(next)
    setState((s) => ({ ...s, recoveryCodes: next }))
    setRegenerating(true)
    setSetup('codes')
  }

  function signOut(session: Session) {
    setState((s) => ({ ...s, signedOut: [...s.signedOut, session.id] }))
    toast(`Signed out of ${session.name}`, {
      description: 'Demo only. It will need to sign in again.',
      action: { label: 'Undo', onClick: () => setState((s) => ({ ...s, signedOut: s.signedOut.filter((id) => id !== session.id) })) },
    })
  }

  function signOutOthers() {
    const others = sessions.filter((s) => !s.current).map((s) => s.id)
    setState((s) => ({ ...s, signedOut: [...new Set([...s.signedOut, ...others])] }))
    toast(`Signed out of ${others.length} ${others.length === 1 ? 'device' : 'devices'}`, { description: 'Demo only. This device stays signed in.' })
  }

  function addPasskey() {
    const n = state.passkeys.length + 1
    setState((s) => ({ ...s, passkeys: [...s.passkeys, { id: `pk-${base}`, name: n === 1 ? 'Passkey' : `Passkey ${n}`, created: base }] }))
    toast.success('Passkey added', { description: 'Demo only. Your browser was not asked to make one.' })
  }

  return (
    <>
      <SettingsHeader title="Security" description="How you sign in, and where you are signed in." />

      <SettingsGroup title="Signing in">
        <SettingsRow label="Password" hint="Last changed 3 months ago.">
          <Button variant="outline" size="sm" onClick={() => toast('Change password', { description: 'Demo only. We would email you a link.' })}>
            Change password
          </Button>
        </SettingsRow>
        <SettingsRow
          label={(
            <span className="flex items-center gap-1.5">
              Two-step verification
              <Badge variant={state.twoStep ? 'default' : 'outline'}>{state.twoStep ? 'On' : 'Off'}</Badge>
            </span>
          )}
          hint={state.twoStep
            ? 'You enter a 6-digit code from your authenticator app when you sign in.'
            : 'Ask for a 6-digit code from an authenticator app as well as your password.'}
        >
          {state.twoStep ? (
            <DeleteConfirm
              icon={null}
              title="Turn off two-step verification?"
              description="Signing in will only need your password, and your recovery codes stop working."
              confirmLabel="Turn off"
              size="sm"
              onConfirm={() => {
                setState((s) => ({ ...s, twoStep: false, recoveryCodes: [] }))
                toast('Two-step verification is off')
              }}
            >
              <Button variant="outline" size="sm">Turn off</Button>
            </DeleteConfirm>
          ) : (
            <Button size="sm" onClick={startSetup}>Set up</Button>
          )}
        </SettingsRow>
        {state.twoStep && (
          <SettingsRow label="Recovery codes" hint={`${state.recoveryCodes.length} unused. Each one signs you in once if you lose your phone.`}>
            <DeleteConfirm
              icon={null}
              destructive={false}
              title="Make new recovery codes?"
              description="Your current codes stop working straight away."
              confirmLabel="Make new codes"
              size="sm"
              onConfirm={regenerate}
            >
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> New codes
              </Button>
            </DeleteConfirm>
          </SettingsRow>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Passkeys"
        description="Sign in with your fingerprint, face or screen lock instead of a password."
        action={(
          <Button variant="outline" size="sm" onClick={addPasskey}>
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" /> Add passkey
          </Button>
        )}
      >
        {state.passkeys.length ? (
          <ul aria-label="Passkeys" className="divide-y">
            {state.passkeys.map((p) => (
              <li key={p.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-md">
                  <HugeiconsIcon icon={FingerPrintIcon} strokeWidth={2} className="size-4" />
                </span>
                <div className="grid min-w-0 flex-1 basis-40 gap-0.5">
                  <span className="truncate text-xs font-medium">{p.name}</span>
                  <span className="text-muted-foreground text-[11px]">
                    Added {formatShortDate(p.created, { year: true })}
                    {p.lastUsed ? ` · Last used ${formatShortDate(p.lastUsed)}` : ' · Not used yet'}
                  </span>
                </div>
                <DeleteConfirm
                  title={`Remove “${p.name}”?`}
                  description="You won't be able to sign in with this passkey any more. You can add it again later."
                  confirmLabel="Remove"
                  size="sm"
                  onConfirm={() => {
                    setState((s) => ({ ...s, passkeys: s.passkeys.filter((k) => k.id !== p.id) }))
                    toast('Passkey removed')
                  }}
                >
                  <Button variant="ghost" size="sm" className="ml-auto">
                    Remove<span className="sr-only"> {p.name}</span>
                  </Button>
                </DeleteConfirm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 px-3 py-4 text-xs">
            <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-4 shrink-0" />
            No passkeys yet. Add one to sign in without a password.
          </p>
        )}
      </SettingsGroup>

      <SettingsGroup title="Signed-in devices" description="Where your account is signed in now. Sign out of any you don't recognise.">
        <SessionList sessions={sessions} now={base} onSignOut={signOut} onSignOutOthers={signOutOthers} />
      </SettingsGroup>

      <TwoStepSetup
        step={setup}
        codes={codes}
        regenerating={regenerating}
        onStep={setSetup}
        onVerified={() => {
          setState((s) => ({ ...s, twoStep: true, recoveryCodes: codes }))
          setSetup('codes')
        }}
        onClose={(done) => {
          setSetup(null)
          if (done && regenerating) toast.success('New recovery codes saved', { description: 'The old ones no longer work.' })
          else if (done) toast.success('Two-step verification is on', { description: 'Demo only. Signing in still needs no code.' })
        }}
      />
    </>
  )
}

/* ---------- Set-up dialog ---------- */

type Step = 'scan' | 'verify' | 'codes'

// Scan the QR code (or type the setup key), enter a code to prove it worked,
// then save the recovery codes. Any six digits pass: there is no server.
function TwoStepSetup({ step, codes, regenerating, onStep, onVerified, onClose }: {
  step: Step | null
  codes: string[]
  // Only the codes step, for new codes when it is already on.
  regenerating: boolean
  onStep: (step: Step) => void
  onVerified: () => void
  onClose: (done: boolean) => void
}) {
  const id = useId()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [keyCopied, flagKeyCopied] = useCopied()
  const [codesCopied, flagCodesCopied] = useCopied()
  const number = step === 'scan' ? 1 : step === 'verify' ? 2 : 3

  function reset() {
    setOtp('')
    setError('')
    setSaved(false)
  }

  function verify(value = otp) {
    if (value.length < 6) {
      setError('Enter all 6 digits.')
      return
    }
    reset()
    onVerified()
  }

  const codesText = `${ISSUER} recovery codes for ${USER.email}\nEach code works once.\n\n${codes.join('\n')}\n`

  return (
    <Dialog open={step !== null} onOpenChange={(open) => {
      if (open) return
      // Closing on the codes step means two-step verification is already on.
      onClose(step === 'codes')
      reset()
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {!regenerating && <p className="text-muted-foreground text-[11px]">Step {number} of 3</p>}
          <DialogTitle>
            {regenerating ? 'Your new recovery codes' : step === 'scan' ? 'Scan the QR code' : step === 'verify' ? 'Enter the code' : 'Save your recovery codes'}
          </DialogTitle>
          <DialogDescription>
            {step === 'scan' && 'Open an authenticator app on your phone and scan this code, or type in the setup key.'}
            {step === 'verify' && 'Type the 6-digit code your authenticator app shows for this account.'}
            {step === 'codes' && 'If you lose your phone, each of these signs you in once. Keep them somewhere safe; this is the only time they are shown.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'scan' && (
          <div className="grid justify-items-center gap-3">
            <QrCode value={OTPAUTH} size={168} label="QR code to set up an authenticator app" />
            <div className="bg-muted flex w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5">
              <div className="grid min-w-0 flex-1">
                <span className="text-muted-foreground text-[10px]">Setup key</span>
                <code className="truncate font-mono text-xs tracking-wider">{SECRET.match(/.{4}/g)!.join(' ')}</code>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy setup key"
                onClick={async () => {
                  if (await copyText(SECRET, { success: false })) flagKeyCopied()
                }}
              >
                <HugeiconsIcon icon={keyCopied ? Tick02Icon : Copy01Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <Field data-invalid={!!error || undefined} className="justify-items-center">
            <FieldLabel htmlFor={`${id}-otp`} className="sr-only">6-digit code</FieldLabel>
            <InputOTP
              id={`${id}-otp`}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={otp}
              onChange={(v) => {
                setOtp(v)
                setError('')
              }}
              onComplete={verify}
              aria-invalid={!!error || undefined}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                {[0, 1, 2].map((i) => <InputOTPSlot key={i} index={i} aria-invalid={!!error || undefined} className="size-9 text-sm" />)}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} aria-invalid={!!error || undefined} className="size-9 text-sm" />)}
              </InputOTPGroup>
            </InputOTP>
            {error ? <FieldError className="text-center">{error}</FieldError> : (
              <p className="text-muted-foreground text-center text-[11px]">Demo: any 6 digits work.</p>
            )}
          </Field>
        )}

        {step === 'codes' && (
          <div className="grid gap-3">
            <ol aria-label="Recovery codes" className="bg-muted grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md p-3 font-mono text-xs">
              {codes.map((c) => <li key={c} className="tracking-wider">{c}</li>)}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (await copyText(codes.join('\n'), { success: 'Recovery codes copied' })) flagCodesCopied()
                }}
              >
                <HugeiconsIcon icon={codesCopied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadText('recovery-codes.txt', codesText)}>
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Download
              </Button>
            </div>
            <Field orientation="horizontal">
              <Checkbox id={`${id}-saved`} checked={saved} onCheckedChange={(v) => setSaved(v === true)} />
              <FieldLabel htmlFor={`${id}-saved`} className="font-normal">I have saved these codes</FieldLabel>
            </Field>
          </div>
        )}

        <DialogFooter>
          {step === 'scan' && <Button onClick={() => onStep('verify')}>Next</Button>}
          {step === 'verify' && (
            <>
              <Button variant="outline" onClick={() => onStep('scan')}>Back</Button>
              <Button onClick={() => verify()}>Verify</Button>
            </>
          )}
          {step === 'codes' && (
            <Button disabled={!saved} onClick={() => {
              onClose(true)
              reset()
            }}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} data-icon="inline-start" /> Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
