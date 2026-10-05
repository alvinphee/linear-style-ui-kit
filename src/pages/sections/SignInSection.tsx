import { HugeiconsIcon } from '@hugeicons/react'
import { SquareLock02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AuthSeparator, SignInAside, SignInBrand, SignInForm, SignInHeading, SignInLayout, SignInMain, SignInMethods,
  SignInNote, SignInTestimonial,
} from '@/blocks/sign-in'
import { Panel, Section } from './shared'

const DEMO = 'Demo only. Nothing was sent.'

export default function SignInSection() {
  return (
    <Section id="sign-in" title="Sign-in page" description="A framed preview of a sign-in screen">
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
    </Section>
  )
}

// The demo product's logo: a diamond on the primary colour, in place of the
// brand's letter mark.
function LogoMark() {
  return (
    <span aria-hidden className="bg-primary grid size-7 place-items-center rounded-md">
      <span className="border-primary-foreground size-3 rotate-45 rounded-[3px] border-2" />
    </span>
  )
}
