import { useEffect, useId, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon, FingerPrintIcon, Key01Icon, Mail01Icon, LockIcon, Tick02Icon, ViewIcon, ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { COMPANIES, DEMO_USERS, ROLE_LABEL } from './data'
import { MODULES } from './modules'
import { go, goScreen } from './route'
import { useErp, type Session } from './store'
import { ModuleMark } from './ui'

// Sign-in: email and password, single sign-on (SSO) or a passkey. This is a
// demo, so any email and password work; the demo accounts fill in a role.

function Brand() {
  return (
    <div className="flex items-center gap-2">
      {/* The primary colour, so it follows the theme (and black/white buttons). */}
      <LetterMark text="A" colour="var(--primary)" size="md" className="text-primary-foreground rounded-lg text-xs" />
      <span className="text-sm font-semibold tracking-tight">Acme ERP</span>
    </div>
  )
}

export function Login() {
  const { signIn } = useErp()
  const id = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Sign in · Acme ERP'
  }, [])

  function finish(session: Session) {
    signIn(session)
    // More than one company, so choose one next (multi-company).
    goScreen('companies')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter your work email, such as name@company.com.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    if (next.email) return document.getElementById(`${id}-email`)?.focus()
    if (next.password) return document.getElementById(`${id}-password`)?.focus()
    setBusy('password')
    const demo = DEMO_USERS.find((u) => u.email === email.toLowerCase())
    const name = demo?.name ?? email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setTimeout(() => finish({ name, email, role: demo?.role ?? 'admin', title: demo?.title ?? 'Administrator' }), 700)
  }

  function quick(method: 'sso' | 'passkey') {
    setBusy(method)
    const admin = DEMO_USERS[0]
    setTimeout(() => finish({ name: admin.name, email: admin.email, role: admin.role, title: admin.title }), 900)
  }

  return (
    <div className="bg-background grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-10">
        <Brand />
        <div className="mx-auto grid w-full max-w-sm flex-1 content-center gap-6 py-10">
          <div className="grid gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Sign in to Acme</h1>
            <p className="text-muted-foreground text-sm">Use your work email. In this demo any email and password work.</p>
          </div>

          <form onSubmit={submit} noValidate className="grid gap-3.5">
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-email`}>Work email</Label>
              <InputGroup className="h-9">
                <InputGroupAddon><HugeiconsIcon icon={Mail01Icon} strokeWidth={2} /></InputGroupAddon>
                <InputGroupInput
                  id={`${id}-email`}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((s) => ({ ...s, email: undefined }))
                  }}
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? `${id}-email-error` : undefined}
                />
              </InputGroup>
              {errors.email && <p id={`${id}-email-error`} className="text-destructive text-[11px]">{errors.email}</p>}
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-password`}>Password</Label>
                <button type="button" className="text-muted-foreground hover:text-foreground text-[11px]" onClick={() => toast('Password reset', { description: 'Demo only. A reset link would be emailed to you.' })}>
                  Forgot password?
                </button>
              </div>
              <InputGroup className="h-9">
                <InputGroupAddon><HugeiconsIcon icon={LockIcon} strokeWidth={2} /></InputGroupAddon>
                <InputGroupInput
                  id={`${id}-password`}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((s) => ({ ...s, password: undefined }))
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? `${id}-password-error` : undefined}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow(!show)}>
                    <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} strokeWidth={2} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.password && <p id={`${id}-password-error`} className="text-destructive text-[11px]">{errors.password}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id={`${id}-remember`} checked={remember} onCheckedChange={(on) => setRemember(on === true)} />
              <Label htmlFor={`${id}-remember`} className="font-normal">Keep me signed in on this device</Label>
            </div>
            <Button type="submit" size="lg" disabled={!!busy}>
              {busy === 'password' ? <Spinner data-icon="inline-start" /> : null}
              {busy === 'password' ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
            <span className="bg-border h-px flex-1" /> or <span className="bg-border h-px flex-1" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="outline" size="lg" disabled={!!busy} onClick={() => quick('sso')}>
              {busy === 'sso' ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={Key01Icon} strokeWidth={2} data-icon="inline-start" />}
              Single sign-on
            </Button>
            <Button variant="outline" size="lg" disabled={!!busy} onClick={() => quick('passkey')}>
              {busy === 'passkey' ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={FingerPrintIcon} strokeWidth={2} data-icon="inline-start" />}
              Passkey
            </Button>
          </div>

          <section aria-labelledby={`${id}-demo`} className="grid gap-2">
            <h2 id={`${id}-demo`} className="text-muted-foreground text-[11px] font-medium">Demo accounts: each role sees different modules</h2>
            <div className="grid gap-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.role}
                  type="button"
                  disabled={!!busy}
                  onClick={() => {
                    setEmail(u.email)
                    setPassword('demo-password')
                    setBusy('password')
                    setTimeout(() => finish({ name: u.name, email: u.email, role: u.role, title: u.title }), 500)
                  }}
                  className="hover:bg-accent/60 focus-visible:ring-ring/40 flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left text-xs outline-none focus-visible:ring-2 disabled:opacity-50"
                >
                  <UserAvatar name={u.name} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-medium">{u.name}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{u.title}</span>
                  </span>
                  <span className="text-muted-foreground text-[11px]">{ROLE_LABEL[u.role]}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />
                </button>
              ))}
            </div>
          </section>
        </div>
        <footer className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <a href="#/overview" className="hover:text-foreground">← Back to the UI kit</a>
          <span className="ml-auto">Privacy · Terms · Status</span>
        </footer>
      </main>

      {/* The product, not a stock photo: what every role gets on one screen. */}
      <aside aria-hidden className="bg-sidebar relative hidden overflow-hidden border-l lg:grid lg:content-center lg:justify-items-center lg:p-12">
        <div className="grid w-full max-w-md gap-6">
          <div className="grid gap-2">
            <p className="text-2xl font-semibold tracking-tight">One system for every team.</p>
            <p className="text-muted-foreground text-sm">Sales, stock, purchasing, finance and people share the same records, so a sales order, its delivery and its invoice always agree.</p>
          </div>
          <div className="bg-background grid gap-2 rounded-xl border p-3 shadow-sm">
            {MODULES.filter((m) => m.id !== 'home').map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <ModuleMark icon={m.icon} colour={m.colour} />
                <div className="grid min-w-0 flex-1">
                  <span className="text-xs font-medium">{m.name}</span>
                  <span className="text-muted-foreground truncate text-[11px]">{m.description}</span>
                </div>
              </div>
            ))}
          </div>
          <ul className="text-muted-foreground grid gap-1.5 text-xs">
            {['Role-based access for every module', 'Multi-company, with books kept apart', 'An audit trail of every change'].map((t) => (
              <li key={t} className="flex items-center gap-2"><HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-3.5" /> {t}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

export function Companies() {
  const { session, company, setCompany, signOut } = useErp()

  useEffect(() => {
    document.title = 'Choose a company · Acme ERP'
  }, [])

  return (
    <div className="bg-sidebar grid min-h-svh place-items-center px-4 py-10">
      <main className="grid w-full max-w-md gap-5">
        <Brand />
        <div className="bg-background grid gap-4 rounded-xl border p-5 shadow-sm">
          <div className="grid gap-1">
            <h1 className="text-lg font-semibold tracking-tight">Choose a company</h1>
            <p className="text-muted-foreground text-xs">
              Signed in as {session?.email}. You have access to {COMPANIES.length} companies. Each keeps its own books.
            </p>
          </div>
          <ul className="grid gap-1.5">
            {COMPANIES.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCompany(c.id)
                    go('home', 'launchpad')
                  }}
                  className="hover:bg-accent/60 hover:border-foreground/15 focus-visible:ring-ring/40 flex w-full items-center gap-3 rounded-lg border p-2.5 text-left outline-none focus-visible:ring-2"
                >
                  <LetterMark text={c.short} colour={c.colour} size="lg" />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-[13px] font-medium">{c.name}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{c.country} · {c.currency} · {c.members} members</span>
                  </span>
                  {company?.id === c.id ? (
                    <span className="text-muted-foreground text-[11px]">Current</span>
                  ) : i === 0 && !company ? (
                    <span className="text-muted-foreground text-[11px]">Last used</span>
                  ) : null}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-muted-foreground flex justify-between text-[11px]">
          <button type="button" className="hover:text-foreground" onClick={() => {
            signOut()
            goScreen('login')
          }}>
            Use a different account
          </button>
          <a href="#/overview" className="hover:text-foreground">Back to the UI kit</a>
        </div>
      </main>
    </div>
  )
}
