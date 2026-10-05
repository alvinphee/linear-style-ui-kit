import { useEffect, useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, FingerPrintIcon, Key01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AuthSeparator, SignInAside, SignInBrand, SignInFooter, SignInForm, SignInHeading, SignInLayout, SignInMain,
  SignInMethods, SignInPitch, type SignInValues,
} from '@/blocks/sign-in'
import { IconMark, LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { COMPANIES, DEMO_USERS, ROLE_LABEL } from './data'
import { MODULES } from './modules'
import { landingPage } from './edition'
import { go, goScreen } from './route'
import { useErp, type Session } from './store'

// Sign-in: email and password, single sign-on (SSO) or a passkey, from the
// kit's sign-in parts. This is a demo, so any email and password work; the
// demo accounts fill in a role.

const BRAND = 'Acme ERP'

export function Login() {
  const { signIn } = useErp()
  const id = useId()
  const [values, setValues] = useState<SignInValues>({ email: '', password: '', remember: true })
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Sign in · Acme ERP'
  }, [])

  function finish(session: Session) {
    signIn(session)
    // More than one company, so choose one next (multi-company).
    goScreen('companies')
  }

  function submit({ email }: SignInValues) {
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
    <SignInLayout
      aside={
        // The product, not a stock photo: what every role gets on one screen.
        <SignInAside aria-hidden>
          <SignInPitch
            title="One system for every team."
            description="Sales, stock, purchasing, finance and people share the same records, so a sales order, its delivery and its invoice always agree."
            points={['Role-based access for every module', 'Multi-company, with books kept apart', 'An audit trail of every change']}
          >
            <div className="bg-background grid gap-2 rounded-xl border p-3 shadow-sm">
              {MODULES.filter((m) => m.id !== 'home').map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <IconMark icon={m.icon} colour={m.colour} />
                  <div className="grid min-w-0 flex-1">
                    <span className="text-xs font-medium">{m.name}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{m.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </SignInPitch>
        </SignInAside>
      }
    >
      <SignInMain
        as="main"
        brand={<SignInBrand name={BRAND} />}
        footer={<SignInFooter start={<a href="#/overview">← Back to the UI kit</a>} end="Privacy · Terms · Status" />}
      >
        <SignInHeading title="Sign in to Acme" description="Use your work email. In this demo any email and password work." />

        <SignInForm
          values={values}
          onValuesChange={setValues}
          onSubmit={submit}
          remember
          onForgotPassword={() => toast('Password reset', { description: 'Demo only. A reset link would be emailed to you.' })}
          emailLabel="Work email"
          emailPlaceholder="name@company.com"
          errorText={{ email: 'Enter your work email, such as name@company.com.', password: 'Enter your password.' }}
          busy={busy === 'password'}
          disabled={!!busy}
        />

        <AuthSeparator className="my-0" />
        <SignInMethods
          disabled={!!busy}
          methods={[
            { id: 'sso', label: 'Single sign-on', icon: Key01Icon, busy: busy === 'sso', onClick: () => quick('sso') },
            { id: 'passkey', label: 'Passkey', icon: FingerPrintIcon, busy: busy === 'passkey', onClick: () => quick('passkey') },
          ]}
        />

        <section aria-labelledby={`${id}-demo`} className="grid gap-2">
          <h2 id={`${id}-demo`} className="text-muted-foreground text-[11px] font-medium">Demo accounts: each role sees different modules</h2>
          <div className="grid gap-1">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                disabled={!!busy}
                onClick={() => {
                  setValues((v) => ({ ...v, email: u.email, password: 'demo-password' }))
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
      </SignInMain>
    </SignInLayout>
  )
}

export function Companies() {
  const { session, company, setCompany, signOut, startPage } = useErp()

  useEffect(() => {
    document.title = 'Choose a company · Acme ERP'
  }, [])

  return (
    <div className="bg-sidebar grid min-h-svh place-items-center px-4 py-10">
      <main className="grid w-full max-w-md gap-5">
        <SignInBrand name={BRAND} />
        <div className="bg-background grid gap-4 rounded-xl border p-5 shadow-sm">
          <SignInHeading
            size="sm"
            title="Choose a company"
            description={`Signed in as ${session?.email}. You have access to ${COMPANIES.length} companies. Each keeps its own books.`}
          />
          <ul className="grid gap-1.5">
            {COMPANIES.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCompany(c.id)
                    go('home', landingPage(startPage))
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
