import { useState } from 'react'
import { FingerPrintIcon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  AuthSeparator, SignInAside, SignInBrand, SignInFooter, SignInForm, SignInHeading, SignInLayout, SignInMain,
  SignInMethods, SignInNote, SignInPitch, SignInTestimonial, type SignInMethod,
} from '@/blocks/sign-in'
import { useTimers } from '@/lib/use-timers'
import { Demos, Gallery, Playground, bool, element, imports, indent, lit, pick, str, type Values } from './Playground'

// The sign-in page's parts, put together the way a product would. Nothing is
// sent anywhere: every submit and button shows a "Demo only" toast. The
// product and the people are made up.

const DEMO = 'Demo only. Nothing was sent.'
const demo = (label: string) => () => toast(label, { description: DEMO })

const ASIDES = ['none', 'testimonial', 'pitch'] as const
const ASIDE_SIDES = ['right', 'left'] as const
const METHOD_SETS = ['none', 'single sign-on', 'single sign-on and passkey'] as const

type Aside = (typeof ASIDES)[number]
type AsideSideName = (typeof ASIDE_SIDES)[number]
type MethodSet = (typeof METHOD_SETS)[number]

const HEADING = { title: 'Sign in to Acme', description: 'Welcome back. Pick up where you left off.' }

const TESTIMONIAL = {
  eyebrow: 'Plan, track and ship',
  quote: 'We moved the whole team over in an afternoon. Nobody has asked to go back.',
  name: 'Priya Nair',
  role: 'Head of product, Brightline',
}

const PITCH = {
  title: 'Everything your team ships, in one place',
  description: 'Issues, projects and docs that stay in step.',
  points: ['Unlimited projects on every plan', 'Single sign-on and an audit log on Business', 'Cancel any time'],
}

const METHOD_ICON_NAMES: Record<string, string> = { sso: 'SquareLock02Icon', passkey: 'FingerPrintIcon' }

type SignInOptions = {
  aside: Aside
  side: AsideSideName
  methods: MethodSet
  password: boolean
  remember: boolean
  forgot: boolean
  note: boolean
  footer: boolean
  busy: boolean
  submitLabel: string
}

function signInOptions(v: Values): SignInOptions {
  return {
    aside: str(v, 'aside') as Aside,
    side: str(v, 'side') as AsideSideName,
    methods: str(v, 'methods') as MethodSet,
    password: bool(v, 'password'),
    remember: bool(v, 'remember'),
    forgot: bool(v, 'forgot'),
    note: bool(v, 'note'),
    footer: bool(v, 'footer'),
    busy: bool(v, 'busy'),
    submitLabel: str(v, 'submitLabel') || 'Sign in',
  }
}

// The methods for a set, each with its own busy state while it "runs".
function useMethods(set: MethodSet) {
  const [running, setRunning] = useState<string | null>(null)
  const { later } = useTimers()
  const all: Omit<SignInMethod, 'onClick' | 'busy'>[] = [
    { id: 'sso', label: 'Single sign-on', icon: SquareLock02Icon },
    { id: 'passkey', label: 'Passkey', icon: FingerPrintIcon },
  ]
  const shown = set === 'none' ? [] : set === 'single sign-on' ? all.slice(0, 1) : all
  const methods: SignInMethod[] = shown.map((m) => ({
    ...m,
    busy: running === m.id,
    onClick: () => {
      setRunning(m.id)
      later(() => {
        setRunning(null)
        toast(m.label, { description: DEMO })
      }, 1200)
    },
  }))
  return { methods, running: running !== null }
}

function SignInPreview(o: SignInOptions) {
  const { methods, running } = useMethods(o.methods)
  const aside = o.aside === 'testimonial'
    ? (
      <SignInAside variant="brand" aria-label="What customers say">
        <SignInTestimonial {...TESTIMONIAL} />
      </SignInAside>
    )
    : o.aside === 'pitch'
      ? (
        <SignInAside aria-label="Why Acme">
          <SignInPitch {...PITCH} />
        </SignInAside>
      )
      : undefined
  return (
    <div className="bg-background flex h-[32rem] w-full min-w-0 flex-col overflow-hidden rounded-lg border">
      <SignInLayout from="md" asideSide={o.side === 'left' ? 'start' : 'end'} className="min-h-0 flex-1 grid-rows-1" aside={aside}>
        <SignInMain
          size="sm"
          footer={o.footer && (
            <SignInFooter
              start={<button type="button" onClick={demo('Back to the site')}>← Back to the site</button>}
              end={<button type="button" onClick={demo('Help')}>Help</button>}
            />
          )}
        >
          <SignInBrand name="Acme" />
          <SignInHeading as="h4" {...HEADING} />
          {methods.length > 0 && (
            <>
              <SignInMethods methods={methods} disabled={running || o.busy} />
              <AuthSeparator />
            </>
          )}
          <SignInForm
            password={o.password}
            remember={o.remember}
            onForgotPassword={o.forgot ? demo('Reset link') : undefined}
            submitLabel={o.submitLabel}
            busy={o.busy}
            disabled={running}
            autoComplete={false}
            onSubmit={(values) => toast(`Signed in as ${values.email}`, { description: DEMO })}
          />
          {o.note && (
            <SignInNote>
              By continuing you agree to the{' '}
              <button type="button" onClick={demo('Terms')}>Terms</button>
              {' · '}
              <button type="button" onClick={demo('Privacy')}>Privacy</button>
            </SignInNote>
          )}
        </SignInMain>
      </SignInLayout>
    </div>
  )
}

function signInCode(v: Values) {
  const o = signInOptions(v)
  const ids = o.methods === 'none' ? [] : o.methods === 'single sign-on' ? ['sso'] : ['sso', 'passkey']
  const head = imports({
    '@hugeicons/core-free-icons': ids.map((id) => METHOD_ICON_NAMES[id]).sort(),
    '@/blocks/sign-in': pick(
      ids.length > 0 && 'AuthSeparator',
      o.aside !== 'none' && 'SignInAside',
      'SignInBrand',
      o.footer && 'SignInFooter',
      'SignInForm',
      'SignInHeading',
      'SignInLayout',
      'SignInMain',
      ids.length > 0 && 'SignInMethods',
      o.note && 'SignInNote',
      o.aside === 'pitch' && 'SignInPitch',
      o.aside === 'testimonial' && 'SignInTestimonial',
    ),
  })
  const aside = o.aside === 'testimonial'
    ? element('SignInAside', ['variant="brand"', 'aria-label="What customers say"'], element('SignInTestimonial', [
      `eyebrow="${TESTIMONIAL.eyebrow}"`,
      `quote="${TESTIMONIAL.quote}"`,
      `name="${TESTIMONIAL.name}"`,
      `role="${TESTIMONIAL.role}"`,
    ]))
    : o.aside === 'pitch'
      ? element('SignInAside', ['aria-label="Why Acme"'], element('SignInPitch', [
        `title="${PITCH.title}"`,
        `description="${PITCH.description}"`,
        `points={${lit(PITCH.points)}}`,
      ]))
      : ''
  const methods = ids.length
    ? [
      element('SignInMethods', [
        `methods={[\n${ids.map((id) => indent(`{ id: '${id}', label: '${id === 'sso' ? 'Single sign-on' : 'Passkey'}', icon: ${METHOD_ICON_NAMES[id]}, onClick: ${id === 'sso' ? 'startSso' : 'usePasskey'} },`)).join('\n')}\n]}`,
      ]),
      '<AuthSeparator />',
    ].join('\n')
    : ''
  const form = element('SignInForm', [
    !o.password && 'password={false}',
    o.remember && 'remember',
    o.forgot && 'onForgotPassword={sendResetLink}',
    o.submitLabel !== 'Sign in' && `submitLabel="${o.submitLabel}"`,
    o.busy && 'busy',
    'onSubmit={(values) => signIn(values)}',
  ])
  const note = o.note
    ? '<SignInNote>\n  By continuing you agree to the <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>\n</SignInNote>'
    : ''
  const footer = o.footer
    ? 'footer={<SignInFooter start={<a href="/">← Back to the site</a>} end={<a href="/help">Help</a>} />}'
    : false
  const main = element('SignInMain', ['as="main"', 'brand={<SignInBrand name="Acme" />}', footer], [
    `<SignInHeading title="${HEADING.title}" description="${HEADING.description}" />`,
    methods,
    form,
    note,
  ].filter(Boolean).join('\n'))
  const layout = aside ? element('SignInLayout', [o.side === 'left' && 'asideSide="start"', `aside={\n${indent(aside)}\n}`], main) : `<SignInLayout>\n${indent(main)}\n</SignInLayout>`
  return [
    head,
    '// The preview is framed, so it passes size="sm", from="md" and an h4 heading. A full page uses the defaults.',
    `export function SignInPage() {\n  return (\n${indent(layout, '    ')}\n  )\n}`,
  ].join('\n\n')
}

export default function SignInDemos() {
  return (
    <Demos>
      <Playground
        title="Sign-in page"
        description="Submit it empty to see the field errors"
        controls={[
          { kind: 'select', name: 'aside', label: 'Side panel (aside)', options: ASIDES, initial: 'testimonial' },
          { kind: 'select', name: 'side', label: 'Side panel position', options: ASIDE_SIDES, initial: 'right' },
          { kind: 'select', name: 'methods', label: 'Other ways in', options: METHOD_SETS, initial: 'single sign-on and passkey' },
          { kind: 'switch', name: 'password', label: 'Password', initial: true },
          { kind: 'switch', name: 'remember', label: 'Remember me', initial: true },
          { kind: 'switch', name: 'forgot', label: 'Forgot password', initial: true },
          { kind: 'switch', name: 'note', label: 'Terms note', initial: true },
          { kind: 'switch', name: 'footer', label: 'Footer', initial: false },
          { kind: 'switch', name: 'busy', label: 'Busy', initial: false },
          { kind: 'text', name: 'submitLabel', label: 'Submit label', initial: 'Sign in' },
        ]}
        previewClassName="p-3 sm:p-6"
        render={(v) => <SignInPreview {...signInOptions(v)} />}
        code={signInCode}
      />

      <Gallery
        title="Sign-in parts"
        note="Each part on its own, from @/blocks/sign-in"
        items={[
          { label: 'SignInBrand', node: <SignInBrand name="Acme" /> },
          { label: 'SignInBrand letters and colour', node: <SignInBrand name="Northwind" letters="NW" colour="oklch(0.64 0.15 155)" /> },
          { label: 'AuthSeparator', node: <div className="w-64"><AuthSeparator /></div> },
          {
            label: 'SignInMethods, two',
            node: (
              <SignInMethods
                size="sm"
                className="w-72"
                methods={[
                  { id: 'sso', label: 'Single sign-on', icon: SquareLock02Icon, onClick: demo('Single sign-on') },
                  { id: 'passkey', label: 'Passkey', icon: FingerPrintIcon, onClick: demo('Passkey') },
                ]}
              />
            ),
          },
          {
            label: 'magic link: password={false}',
            node: (
              <SignInForm
                size="sm"
                password={false}
                autoComplete={false}
                submitLabel="Send magic link"
                className="w-64"
                onSubmit={(values) => toast(`Magic link for ${values.email}`, { description: DEMO })}
              />
            ),
          },
          {
            label: 'SignInPitch',
            node: <SignInPitch {...PITCH} className="bg-sidebar w-80 rounded-lg border p-5" />,
          },
        ]}
      />
    </Demos>
  )
}
