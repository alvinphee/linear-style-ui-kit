import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, QuoteUpIcon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
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

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 md:grid-cols-2">
            <SignInForm />
            <Testimonial />
          </div>
        </div>
      </Panel>
    </Section>
  )
}

function LogoMark() {
  return (
    <span aria-hidden className="bg-primary grid size-7 place-items-center rounded-md">
      <span className="border-primary-foreground size-3 rotate-45 rounded-[3px] border-2" />
    </span>
  )
}

function SignInForm() {
  return (
    <div className="flex min-h-0 flex-col items-center justify-center overflow-y-auto px-6 py-8">
      <form
        className="grid w-full max-w-[18rem] grid-cols-1 gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          toast(DEMO)
        }}
      >
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight">Kitchen Sink</span>
        </div>

        <div className="grid gap-1">
          <h4 className="text-lg font-semibold tracking-tight">Welcome back</h4>
          <p className="text-muted-foreground text-xs">Sign in to your workspace to pick up where you left off.</p>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={() => toast(DEMO)}>
          <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} data-icon="inline-start" />
          Continue with SSO
        </Button>

        <FieldSeparator>or</FieldSeparator>

        <div className="grid gap-1.5">
          <Label htmlFor="sign-in-email">Email</Label>
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput id="sign-in-email" type="email" placeholder="you@example.com" autoComplete="off" />
          </InputGroup>
        </div>

        <Button type="submit" className="w-full">Send magic link</Button>

        <p className="text-muted-foreground text-center text-[11px]">
          By continuing you agree to the{' '}
          <button type="button" className="hover:text-foreground underline underline-offset-3" onClick={() => toast('Demo only. There is no Terms page.')}>
            Terms
          </button>
          {' · '}
          <button type="button" className="hover:text-foreground underline underline-offset-3" onClick={() => toast('Demo only. There is no Privacy page.')}>
            Privacy
          </button>
        </p>
      </form>
    </div>
  )
}

function Testimonial() {
  return (
    <aside
      aria-label="What customers say"
      className="from-brand/20 via-brand/5 to-background relative hidden flex-col justify-between overflow-hidden border-l bg-linear-to-br p-8 md:flex"
    >
      <div aria-hidden className="bg-brand/25 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
      <div aria-hidden className="border-brand/20 pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full border" />
      <div aria-hidden className="border-brand/15 pointer-events-none absolute -bottom-32 -left-28 size-96 rounded-full border" />

      <span className="text-muted-foreground relative text-[11px] font-medium tracking-wide uppercase">
        Plan, track and ship
      </span>

      <figure className="relative grid gap-4">
        <HugeiconsIcon icon={QuoteUpIcon} strokeWidth={2} className="text-brand size-6" />
        <blockquote className="text-base leading-relaxed font-medium tracking-tight text-balance">
          We moved our whole planning process over in an afternoon. The keyboard shortcuts alone give the
          team hours back every week.
        </blockquote>
        <figcaption className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="text-xs">SO</AvatarFallback>
          </Avatar>
          <div className="grid">
            <span className="text-xs font-medium">Sam Okafor</span>
            <span className="text-muted-foreground text-[11px]">Operations lead, Quillmoor</span>
          </div>
        </figcaption>
      </figure>
    </aside>
  )
}
