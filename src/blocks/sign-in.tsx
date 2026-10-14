import { createContext, useContext, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { LockIcon, Mail01Icon, QuoteUpIcon, Tick02Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { LetterMark } from '@/components/mark'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldSeparator } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useMediaQuery } from '@/lib/use-media-query'

// The sign-in screen, as parts you put together:
//   SignInLayout     the split screen: the sign-in column, and a side panel
//                    that shows from a breakpoint
//   SignInMain       the column: the brand at the top, your parts centred,
//                    a footer at the bottom
//   SignInBrand      the product's mark and name
//   SignInHeading    the title and a line under it
//   SignInForm       email (and password) with field errors, remember me
//                    and the submit button
//   AuthSeparator    the "or" line between two ways in
//   SignInMethods    single sign-on, passkey and other one-click ways in
//   SignInNote       a small centred line, such as the terms
//   SignInFooter     the page's foot: a back link, legal links
//   SignInAside      the side panel, branded or muted
//   SignInTestimonial / SignInPitch: what goes in the side panel
//   SignInPhone      the screen as a phone app (or an installed web app, a
//                    PWA) has it: the app's icon at the top, big touch-sized
//                    fields and buttons, the small print at the foot, the
//                    safe areas kept clear; no side panel
//   SignInAccount    "Welcome back": the account this device remembers, to
//                    sign in again with Face ID, a fingerprint or a passkey
//
// Anything else (demo accounts, a workspace URL field) goes between them as
// children. Nothing is sent: what happens on submit is yours.
//   sm: a framed preview or a small card    md: a full page (the default)
//   lg: a phone, for a thumb (SignInPhone sets it): 44px fields and buttons
// SignInMain passes its size on to the parts inside it.

type Size = 'sm' | 'md' | 'lg'
type Breakpoint = 'md' | 'lg'
export type AsideSide = 'start' | 'end'

const SizeContext = createContext<Size>('md')
const BreakpointContext = createContext<Breakpoint>('lg')
// Which side the aside is on, so it draws its border on the edge it shares with the form.
const AsideSideContext = createContext<AsideSide>('end')
// A phone short on height (a small phone, a landscape one, a window): the parts trim their gaps.
const DenseContext = createContext(false)
// A part's own size, or else the size of the SignInMain around it.
function useSize(size?: Size) {
  const inherited = useContext(SizeContext)
  return size ?? inherited
}

/* ---------- Layout ---------- */

const SPLIT = { md: 'md:grid-cols-2', lg: 'lg:grid-cols-2' } as const

// The split screen: the sign-in column on the left and, from the `from`
// breakpoint, the `aside` (a SignInAside) in an equal half: on the right
// (`asideSide="end"`, the default) or on the left (`"start"`). Below the
// breakpoint the aside is hidden, so the form is all there is.
// It fills the screen; inside a frame pass className="min-h-0 flex-1".
export function SignInLayout({ aside, asideSide = 'end', from = 'lg', children, className }: {
  aside?: ReactNode
  asideSide?: AsideSide
  from?: Breakpoint
  children: ReactNode
  className?: string
}) {
  return (
    <BreakpointContext.Provider value={from}>
      <AsideSideContext.Provider value={asideSide}>
        <div className={cn('bg-background grid min-h-svh grid-cols-1', aside && SPLIT[from], className)}>
          {asideSide === 'start' && aside}
          {children}
          {asideSide === 'end' && aside}
        </div>
      </AsideSideContext.Provider>
    </BreakpointContext.Provider>
  )
}

const MAIN = {
  sm: { outer: 'min-h-0 overflow-y-auto px-6 py-8', column: 'max-w-[18rem] gap-4' },
  md: { outer: 'px-6 py-6 sm:px-10', column: 'max-w-sm gap-6 py-10' },
  lg: { outer: 'px-6 py-6', column: 'max-w-sm gap-6 py-6' },
} as const

// The sign-in column. `brand` sits at the top left and `footer` at the
// bottom; the children are centred between them in a narrow column. For a
// small screen without a top row, put SignInBrand first in the children.
export function SignInMain({ brand, footer, size = 'md', as: Element = 'div', children, className }: {
  brand?: ReactNode
  footer?: ReactNode
  size?: Size
  // 'main' when it is the page's main content.
  as?: 'div' | 'main'
  children: ReactNode
  className?: string
}) {
  const styles = MAIN[size]
  return (
    <SizeContext.Provider value={size}>
      <Element className={cn('flex flex-col', styles.outer, className)}>
        {brand}
        <div className={cn('mx-auto grid w-full flex-1 grid-cols-1 content-center', styles.column)}>{children}</div>
        {footer}
      </Element>
    </SizeContext.Provider>
  )
}

/* ---------- Brand and heading ---------- */

const PRIMARY = 'var(--primary)'

// The product's mark and name. The mark is a letter mark on the primary
// colour (so it follows the theme) unless you pass your own logo as `mark`.
export function SignInBrand({ name, letters, colour = PRIMARY, mark, appIcon = false, className }: {
  name: string
  // The mark's letters. The name's first letter if left out.
  letters?: string
  colour?: string
  // Your own logo, in place of the letter mark. Sized about 28px.
  mark?: ReactNode
  // As a phone shows an app: the mark as a big rounded icon, the name under it.
  appIcon?: boolean
  className?: string
}) {
  if (appIcon) {
    return (
      <div className={cn('grid justify-items-center gap-2', className)}>
        {mark ?? (
          <LetterMark
            text={letters ?? name.slice(0, 1).toUpperCase()}
            colour={colour}
            className={cn('size-12 rounded-xl text-lg shadow-sm', colour === PRIMARY && 'text-primary-foreground')}
          />
        )}
        <span className="text-sm font-semibold tracking-tight">{name}</span>
      </div>
    )
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {mark ?? (
        <LetterMark
          text={letters ?? name.slice(0, 1).toUpperCase()}
          colour={colour}
          size="md"
          className={cn('rounded-lg text-xs', colour === PRIMARY && 'text-primary-foreground')}
        />
      )}
      <span className="text-sm font-semibold tracking-tight">{name}</span>
    </div>
  )
}

const HEADING = {
  sm: { gap: 'gap-1', title: 'text-lg', description: 'text-xs' },
  md: { gap: 'gap-1.5', title: 'text-xl', description: 'text-sm' },
  lg: { gap: 'gap-1.5', title: 'text-2xl', description: 'text-sm' },
} as const

// The screen's title and a line under it: "Sign in to Acme".
export function SignInHeading({ title, description, size, as: Heading = 'h1', className }: {
  title: ReactNode
  description?: ReactNode
  size?: Size
  // The heading level. h1 on its own page; lower inside a kit page.
  as?: 'h1' | 'h2' | 'h3' | 'h4'
  className?: string
}) {
  const resolved = useSize(size)
  const styles = HEADING[resolved]
  const dense = useContext(DenseContext)
  return (
    <div className={cn('grid', styles.gap, className)}>
      <Heading className={cn('font-semibold tracking-tight', styles.title)}>{title}</Heading>
      {description && !(dense && resolved === 'lg') && <p className={cn('text-muted-foreground', styles.description)}>{description}</p>}
    </div>
  )
}

/* ---------- Form ---------- */

export type SignInValues = { email: string; password: string; remember: boolean }

const EMAIL = /^\S+@\S+\.\S+$/

const FORM = {
  sm: { gap: 'gap-4', input: '', button: 'default', buttonClass: '' },
  md: { gap: 'gap-3.5', input: 'h-9', button: 'lg', buttonClass: '' },
  // A phone: 44px targets, and 16px text so the browser does not zoom in on focus.
  lg: { gap: 'gap-3', input: 'h-11 [&_input]:text-base', button: 'lg', buttonClass: 'h-11 text-sm' },
} as const

// The email and password form. It checks the email's format and that a
// password is there on submit: errors show under their fields, the first bad
// field gets focus, and an error goes once its field changes. `onSubmit` only
// runs when both are fine. Leave out the password for a magic-link form.
// It keeps its own values, or pass `values` and `onValuesChange` to fill them
// from outside (a demo account). `busy` shows a spinner on the button;
// `disabled` only disables it, say while single sign-on runs.
export function SignInForm({
  onSubmit, values: controlled, defaultValues, onValuesChange, password = true, remember = false,
  rememberLabel = 'Keep me signed in on this device', onForgotPassword, emailLabel = 'Email',
  emailPlaceholder = 'you@example.com', passwordLabel = 'Password', submitLabel = 'Sign in',
  busy = false, busyLabel = 'Signing in…', disabled = false, errorText, autoComplete = true, size, children,
  className,
}: {
  onSubmit: (values: SignInValues) => void
  values?: SignInValues
  defaultValues?: Partial<SignInValues>
  onValuesChange?: (values: SignInValues) => void
  // Shows the password field.
  password?: boolean
  // Shows the "Keep me signed in" checkbox.
  remember?: boolean
  rememberLabel?: ReactNode
  // Shows "Forgot password?" beside the password's label.
  onForgotPassword?: () => void
  emailLabel?: ReactNode
  emailPlaceholder?: string
  passwordLabel?: ReactNode
  submitLabel?: ReactNode
  busy?: boolean
  busyLabel?: ReactNode
  disabled?: boolean
  // In place of the built-in error messages.
  errorText?: { email?: string; password?: string }
  // false turns the browser's autofill off, for a demo.
  autoComplete?: boolean
  size?: Size
  // Extra fields, after the remember checkbox and before the button.
  children?: ReactNode
  className?: string
}) {
  const id = useId()
  const resolved = useSize(size)
  const styles = FORM[resolved]
  const dense = useContext(DenseContext)
  const tight = dense && resolved === 'lg'
  const [own, setOwn] = useState<SignInValues>(() => ({ email: '', password: '', remember: true, ...defaultValues }))
  const [show, setShow] = useState(false)
  // Each error remembers the value it was for, so it goes once that changes.
  const [checked, setChecked] = useState<{ email?: [string, string]; password?: [string, string] }>({})
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const values = controlled ?? own

  const emailError = checked.email && checked.email[0] === values.email ? checked.email[1] : undefined
  const passwordError = checked.password && checked.password[0] === values.password ? checked.password[1] : undefined

  function set(patch: Partial<SignInValues>) {
    const next = { ...values, ...patch }
    if (!controlled) setOwn(next)
    onValuesChange?.(next)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const email = EMAIL.test(values.email.trim()) ? undefined : errorText?.email ?? 'Enter your email, such as name@example.com.'
    const missing = password && !values.password ? errorText?.password ?? 'Enter your password.' : undefined
    setChecked({
      email: email ? [values.email, email] : undefined,
      password: missing ? [values.password, missing] : undefined,
    })
    if (email) return emailRef.current?.focus()
    if (missing) return passwordRef.current?.focus()
    onSubmit(values)
  }

  return (
    <form noValidate onSubmit={submit} className={cn('grid', dense && resolved === 'lg' ? 'gap-2.5' : styles.gap, className)}>
      <Field data-invalid={!!emailError} className="gap-1.5">
        <Label htmlFor={`${id}-email`}>{emailLabel}</Label>
        <InputGroup className={cn(styles.input, tight && 'h-10')}>
          <InputGroupAddon><HugeiconsIcon icon={Mail01Icon} strokeWidth={2} /></InputGroupAddon>
          <InputGroupInput
            ref={emailRef}
            id={`${id}-email`}
            type="email"
            autoComplete={autoComplete ? (password ? 'username' : 'email') : 'off'}
            value={values.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder={emailPlaceholder}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? `${id}-email-error` : undefined}
          />
        </InputGroup>
        {emailError && <FieldError id={`${id}-email-error`}>{emailError}</FieldError>}
      </Field>

      {password && (
        <Field data-invalid={!!passwordError} className="gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-password`}>{passwordLabel}</Label>
            {onForgotPassword && (
              <button type="button" className="text-muted-foreground hover:text-foreground text-[11px]" onClick={onForgotPassword}>
                Forgot password?
              </button>
            )}
          </div>
          <InputGroup className={cn(styles.input, tight && 'h-10')}>
            <InputGroupAddon><HugeiconsIcon icon={LockIcon} strokeWidth={2} /></InputGroupAddon>
            <InputGroupInput
              ref={passwordRef}
              id={`${id}-password`}
              type={show ? 'text' : 'password'}
              autoComplete={autoComplete ? 'current-password' : 'off'}
              value={values.password}
              onChange={(e) => set({ password: e.target.value })}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? `${id}-password-error` : undefined}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow(!show)}>
                <HugeiconsIcon icon={show ? ViewOffIcon : ViewIcon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {passwordError && <FieldError id={`${id}-password-error`}>{passwordError}</FieldError>}
        </Field>
      )}

      {remember && (
        <div className="flex items-center gap-2">
          <Checkbox id={`${id}-remember`} checked={values.remember} onCheckedChange={(on) => set({ remember: on === true })} />
          <Label htmlFor={`${id}-remember`} className="font-normal">{rememberLabel}</Label>
        </div>
      )}

      {children}

      <Button type="submit" size={styles.button} disabled={busy || disabled} className={cn(styles.buttonClass, tight && 'h-10')}>
        {busy && <Spinner data-icon="inline-start" />}
        {busy ? busyLabel : submitLabel}
      </Button>
    </form>
  )
}

// The "or" line between two ways to sign in. The shadcn field separator, so
// it matches the kit's forms; its label sits on the background colour.
export function AuthSeparator({ children = 'or', className }: { children?: ReactNode; className?: string }) {
  return <FieldSeparator className={className}>{children}</FieldSeparator>
}

/* ---------- Other ways in ---------- */

export type SignInMethod = {
  id: string
  // "Single sign-on", "Passkey", "Continue with SSO".
  label: string
  icon: IconSvgElement
  onClick: () => void
  // Shows a spinner in place of the icon while it runs.
  busy?: boolean
}

const METHOD_COLUMNS = ['', '', 'sm:grid-cols-2', 'sm:grid-cols-3'] as const

// Outline buttons for one-click ways in: single sign-on, a passkey, an
// identity provider. One fills the width; two or three sit side by side from
// the sm breakpoint. `disabled` disables them all, say while one runs.
export function SignInMethods({ methods, disabled = false, size, className }: {
  methods: SignInMethod[]
  disabled?: boolean
  size?: Size
  className?: string
}) {
  const own = useSize(size)
  const large = own !== 'sm'
  // On a phone they stack, one under another, whatever the window's width.
  const phone = own === 'lg'
  const dense = useContext(DenseContext)
  return (
    <div className={cn('grid grid-cols-1 gap-2', !phone && METHOD_COLUMNS[Math.min(methods.length, 3)], className)}>
      {methods.map((m) => (
        <Button
          key={m.id}
          type="button"
          variant="outline"
          size={large ? 'lg' : 'default'}
          disabled={disabled || m.busy}
          onClick={m.onClick}
          className={cn(phone && 'h-11 text-sm', phone && dense && 'h-10')}
        >
          {m.busy ? <Spinner data-icon="inline-start" /> : <HugeiconsIcon icon={m.icon} strokeWidth={2} data-icon="inline-start" />}
          {m.label}
        </Button>
      ))}
    </div>
  )
}

/* ---------- Phone ---------- */

// The sign-in screen as a phone app has it. `brand` at the top (a
// SignInBrand with `appIcon`), the parts in one column under it, and
// `footer` (the small print) at the foot. It fills its parent (the screen,
// or a phone frame) and scrolls when the keyboard needs the room. The parts
// inside take the phone size: 44px fields and buttons.
export function SignInPhone({ brand, footer, children, className }: {
  brand?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  // Short screens (under 780px: a small phone, a landscape one, a window)
  // lose the heading's description and tighten their gaps, so it still fits.
  const dense = useMediaQuery('(max-height: 780px)')
  return (
    <SizeContext.Provider value="lg">
      <DenseContext.Provider value={dense}>
        <div
          className={cn(
            'flex min-h-full flex-col overflow-y-auto px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)]',
            dense && 'pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)]',
            className,
          )}
        >
          {brand}
          <div className={cn('mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 pt-4', dense && 'gap-3 pt-3')}>{children}</div>
          {footer && <div className={cn('mx-auto w-full max-w-sm pt-3', dense && 'pt-2')}>{footer}</div>}
        </div>
      </DenseContext.Provider>
    </SizeContext.Provider>
  )
}

// "Welcome back": the account this device remembers, centred, with a way
// to use another. Put the quick way in (Face ID, a passkey) under it.
export function SignInAccount({ name, detail, onSwitch, switchLabel = 'Not you? Use another account', className }: {
  name: string
  // Their email, or the company.
  detail?: ReactNode
  onSwitch?: () => void
  switchLabel?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid justify-items-center gap-3 text-center', className)}>
      <UserAvatar name={name} className="size-14 [&_[data-slot=avatar-fallback]]:text-lg" />
      <div className="grid gap-0.5">
        <p className="text-muted-foreground text-sm">Welcome back,</p>
        <p className="text-2xl font-semibold tracking-tight">{name.split(' ')[0]}</p>
        {detail && <p className="text-muted-foreground text-sm">{detail}</p>}
      </div>
      {onSwitch && (
        <button type="button" onClick={onSwitch} className="text-brand focus-visible:ring-ring/50 rounded text-sm outline-none focus-visible:ring-2">
          {switchLabel}
        </button>
      )}
    </div>
  )
}

/* ---------- Small print ---------- */

const LINKS = '[&_:is(a,button):hover]:text-foreground'

// A small centred line under the form, such as "By continuing you agree to
// the Terms · Privacy". Links and buttons in it are underlined.
export function SignInNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-muted-foreground text-center text-[11px] [&_:is(a,button)]:underline [&_:is(a,button)]:underline-offset-3', LINKS, className)}>
      {children}
    </p>
  )
}

// The foot of the sign-in column: `start` on the left (a back link), `end`
// on the right (Privacy · Terms · Status). Wraps on a narrow screen.
export function SignInFooter({ start, end, className }: { start?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <footer className={cn('text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]', LINKS, className)}>
      {start}
      {end && <span className="ml-auto">{end}</span>}
    </footer>
  )
}

/* ---------- Side panel ---------- */

const ASIDE = {
  brand: 'from-brand/20 via-brand/5 to-background flex-col bg-linear-to-br p-8',
  muted: 'bg-sidebar content-center justify-items-center p-12',
} as const

const SHOW = {
  brand: { md: 'md:flex', lg: 'lg:flex' },
  muted: { md: 'md:grid', lg: 'lg:grid' },
} as const

// The half beside the form, hidden on small screens (it shows from the
// SignInLayout's breakpoint).
//   brand: a tint of the accent with soft circles, for a SignInTestimonial
//   muted: the sidebar colour, content centred, for a SignInPitch
// Give it aria-label="…" when it says something, aria-hidden when it is decoration.
export function SignInAside({ variant = 'muted', className, children, ...props }: ComponentProps<'aside'> & {
  variant?: keyof typeof ASIDE
}) {
  const from = useContext(BreakpointContext)
  const side = useContext(AsideSideContext)
  return (
    <aside className={cn('relative hidden overflow-hidden', side === 'start' ? 'border-r' : 'border-l', ASIDE[variant], SHOW[variant][from], className)} {...props}>
      {variant === 'brand' && (
        <>
          <div aria-hidden className="bg-brand/25 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
          <div aria-hidden className="border-brand/20 pointer-events-none absolute -bottom-20 -left-16 size-64 rounded-full border" />
          <div aria-hidden className="border-brand/15 pointer-events-none absolute -bottom-32 -left-28 size-96 rounded-full border" />
        </>
      )}
      {children}
    </aside>
  )
}

// A customer quote for the side panel: a small heading at the top, and the
// quote with who said it at the bottom.
export function SignInTestimonial({ eyebrow, quote, name, role, className }: {
  // The small capitals at the top, such as "Plan, track and ship".
  eyebrow?: ReactNode
  quote: ReactNode
  // Who said it. Also gives the avatar's initials.
  name: string
  // Their job and company.
  role?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative flex flex-1 flex-col justify-between', className)}>
      {eyebrow && <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{eyebrow}</span>}
      <figure className="mt-auto grid gap-4">
        <HugeiconsIcon icon={QuoteUpIcon} strokeWidth={2} className="text-brand size-6" />
        <blockquote className="text-base leading-relaxed font-medium tracking-tight text-balance">{quote}</blockquote>
        <figcaption className="flex items-center gap-2.5">
          <UserAvatar name={name} className="size-8 *:data-[slot=avatar-fallback]:text-xs" />
          <div className="grid">
            <span className="text-xs font-medium">{name}</span>
            {role && <span className="text-muted-foreground text-[11px]">{role}</span>}
          </div>
        </figcaption>
      </figure>
    </div>
  )
}

// Marketing copy for the side panel: a headline, a line under it, anything
// of yours (a picture of the product), then selling points with ticks.
export function SignInPitch({ title, description, points, children, className }: {
  title: ReactNode
  description?: ReactNode
  points?: ReactNode[]
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid w-full max-w-md gap-6', className)}>
      <div className="grid gap-2">
        <p className="text-2xl font-semibold tracking-tight">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
      {points && points.length > 0 && (
        <ul className="text-muted-foreground grid gap-1.5 text-xs">
          {points.map((point, i) => (
            <li key={i} className="flex items-center gap-2">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-3.5" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
