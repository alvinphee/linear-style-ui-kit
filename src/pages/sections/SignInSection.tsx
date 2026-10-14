import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FaceIdIcon, FingerPrintIcon, Key01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AuthSeparator, SignInAccount, SignInAside, SignInBrand, SignInForm, SignInHeading, SignInLayout, SignInMain,
  SignInMethods, SignInNote, SignInPhone, SignInTestimonial,
} from '@/blocks/sign-in'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Panel, PhoneFrame, PhoneHomeIndicator, PhoneStatusBar, Section } from './shared'

const DEMO = 'Demo only. Nothing was sent.'

export default function SignInSection() {
  return (
    <Section id="sign-in" title="Sign-in page" description="A framed preview of a sign-in screen, and the same screen as a phone app">
      <Panel title="Sign in" note="Split layout; the right half hides on small screens" wide>
        <div className="bg-background flex h-[30rem] min-w-0 flex-col overflow-hidden rounded-lg border">
          <div className="bg-subtle flex h-8 shrink-0 items-center gap-3 border-b px-3">
            <div aria-hidden className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="bg-foreground/15 size-2 rounded-full" />
              ))}
            </div>
            <span className="text-muted-foreground bg-background mx-auto flex h-5 min-w-0 items-center gap-1 truncate rounded-md border px-2 text-[11px]">
              <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} className="size-3 shrink-0" />
              app.example.com/sign-in
            </span>
            <span aria-hidden className="w-9" />
          </div>

          <SignInLayout
            from="md"
            className="min-h-0 flex-1 grid-rows-1"
            aside={
              <SignInAside variant="brand" aria-label="What customers say">
                <SignInTestimonial
                  eyebrow="Plan, track and ship"
                  quote="We moved our whole planning process over in an afternoon. The keyboard shortcuts alone give the team hours back every week."
                  name="Sam Okafor"
                  role="Operations lead, Quillmoor"
                />
              </SignInAside>
            }
          >
            <SignInMain size="sm">
              <SignInBrand name="Kitchen Sink" mark={<LogoMark />} />
              <SignInHeading
                as="h4"
                title="Welcome back"
                description="Sign in to your workspace to pick up where you left off."
              />
              <SignInMethods
                methods={[{ id: 'sso', label: 'Continue with SSO', icon: SquareLock02Icon, onClick: () => toast(DEMO) }]}
              />
              <AuthSeparator />
              <SignInForm
                password={false}
                autoComplete={false}
                submitLabel="Send magic link"
                onSubmit={() => toast(DEMO)}
              />
              <SignInNote>
                By continuing you agree to the{' '}
                <button type="button" onClick={() => toast('Demo only. There is no Terms page.')}>Terms</button>
                {' · '}
                <button type="button" onClick={() => toast('Demo only. There is no Privacy page.')}>Privacy</button>
              </SignInNote>
            </SignInMain>
          </SignInLayout>
        </div>
      </Panel>

      <Panel
        title="Phone app"
        note="An installed web app (PWA) or a phone app: one column, 44px fields, the quick ways in first. Right: a device that remembers you"
        wide
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PhonePreview start="new" />
          <PhonePreview start="returning" />
        </div>
      </Panel>
    </Section>
  )
}

const ACCOUNT = { name: 'Ravi Kumar', email: 'ravi@example.com' }

// One phone showing the sign-in screen. It starts as a first sign-in, or as
// the device that remembers Ravi: Face ID, or the password, or another account.
function PhonePreview({ start }: { start: 'new' | 'returning' }) {
  const [mode, setMode] = useState<'new' | 'returning' | 'password'>(start)
  const [busy, setBusy] = useState<string | null>(null)

  function run(method: string, done: string) {
    setBusy(method)
    window.setTimeout(() => {
      setBusy(null)
      toast.success(done, { description: DEMO })
    }, 900)
  }

  const terms = (
    <SignInNote>
      By continuing you agree to the{' '}
      <button type="button" onClick={() => toast('Demo only. There is no Terms page.')}>Terms</button>
      {' · '}
      <button type="button" onClick={() => toast('Demo only. There is no Privacy page.')}>Privacy</button>
    </SignInNote>
  )

  return (
    <PhoneFrame className="h-[44rem] max-h-[max(85vh,37rem)]">
      <PhoneStatusBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {mode === 'new' ? (
          <SignInPhone brand={<SignInBrand name="Kitchen Sink" appIcon mark={<LogoMark size="lg" />} />} footer={terms}>
            <SignInHeading as="h4" title="Sign in" description="Use your work account." />
            <SignInMethods
              disabled={!!busy}
              methods={[
                { id: 'passkey', label: 'Sign in with a passkey', icon: FingerPrintIcon, busy: busy === 'passkey', onClick: () => run('passkey', 'Signed in with your passkey') },
                { id: 'sso', label: 'Continue with SSO', icon: Key01Icon, busy: busy === 'sso', onClick: () => run('sso', 'Signed in with SSO') },
              ]}
            />
            <AuthSeparator className="my-0">or use your email</AuthSeparator>
            <SignInForm
              autoComplete={false}
              busy={busy === 'password'}
              disabled={!!busy}
              onForgotPassword={() => toast('A reset link would be emailed to you.', { description: DEMO })}
              onSubmit={() => run('password', 'Signed in')}
            />
          </SignInPhone>
        ) : (
          <SignInPhone brand={<SignInBrand name="Kitchen Sink" appIcon mark={<LogoMark size="lg" />} />} footer={terms}>
            <SignInAccount name={ACCOUNT.name} detail={ACCOUNT.email} onSwitch={() => setMode('new')} className="pt-2" />
            {mode === 'returning' ? (
              <div className="mt-auto grid gap-2">
                {/* The quick way in, at the bottom under the thumb. */}
                <Button size="lg" className="h-11 text-sm" disabled={!!busy} onClick={() => run('face', 'Signed in with Face ID')}>
                  {busy === 'face' ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={FaceIdIcon} strokeWidth={2} data-icon="inline-start" />}
                  Sign in with Face ID
                </Button>
                <Button size="lg" variant="ghost" className="h-11 text-sm" disabled={!!busy} onClick={() => setMode('password')}>
                  Use your password
                </Button>
              </div>
            ) : (
              <SignInForm
                autoComplete={false}
                defaultValues={{ email: ACCOUNT.email }}
                busy={busy === 'password'}
                disabled={!!busy}
                onForgotPassword={() => toast('A reset link would be emailed to you.', { description: DEMO })}
                onSubmit={() => run('password', 'Signed in')}
              >
                <button type="button" className="text-brand text-sm" onClick={() => setMode('returning')}>Use Face ID instead</button>
              </SignInForm>
            )}
          </SignInPhone>
        )}
      </div>
      <PhoneHomeIndicator />
    </PhoneFrame>
  )
}

// The demo product's logo: a diamond on the primary colour, in place of the
// brand's letter mark. `lg` is its app icon on a phone.
function LogoMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span aria-hidden className={size === 'lg' ? 'bg-primary grid size-12 place-items-center rounded-xl shadow-sm' : 'bg-primary grid size-7 place-items-center rounded-md'}>
      <span className={size === 'lg' ? 'border-primary-foreground size-5 rotate-45 rounded-[5px] border-[3px]' : 'border-primary-foreground size-3 rotate-45 rounded-[3px] border-2'} />
    </span>
  )
}
