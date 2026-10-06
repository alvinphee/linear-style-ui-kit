import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, AlertCircleIcon, Cancel01Icon, CheckmarkCircle02Icon, CreditCardIcon, InformationCircleIcon,
  Notification03Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const ALERT_VARIANTS = ['default', 'destructive'] as const

const ALERT_PARTS = ['full', 'no icon', 'no title'] as const

const ALERT_TONES = ['info', 'success', 'warning'] as const

type AlertVariant = (typeof ALERT_VARIANTS)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const demoOnly = (title: string) => toast(title, { description: 'Demo only. Nothing was changed.' })

// --- Alert ---------------------------------------------------------------

const ALERT_ICON = { default: InformationCircleIcon, destructive: AlertCircleIcon }

const ALERT_ICON_NAME = { default: 'InformationCircleIcon', destructive: 'AlertCircleIcon' }

const ALERT_ACTION = { default: 'Review', destructive: 'Retry' }

// Alert colours a direct child svg with currentColor, so a tone has to
// override that selector (hence the `!`).
const ALERT_TONE = {
  info: {
    className: 'border-brand/30 bg-brand/5 *:[svg]:text-brand!',
    icon: InformationCircleIcon,
    title: 'New: keyboard-first triage',
    description: 'Press T on any issue to triage it without the mouse.',
  },
  success: {
    className: 'border-chart-4/30 bg-chart-4/5 *:[svg]:text-chart-4!',
    icon: CheckmarkCircle02Icon,
    title: 'Import complete',
    description: '148 issues and 6 projects were added.',
  },
  warning: {
    className: 'border-status-progress/40 bg-status-progress/5 *:[svg]:text-status-progress!',
    icon: Alert02Icon,
    title: 'Your trial ends in 3 days',
    description: 'Pick a plan to keep your cycles and history.',
  },
}

function DemoAlert({ variant = 'default', icon = true, title, description, action = false, className }: {
  variant?: AlertVariant
  icon?: boolean
  title?: string
  description?: string
  action?: boolean
  className?: string
}) {
  return (
    <Alert variant={variant} className={className}>
      {icon && <HugeiconsIcon icon={ALERT_ICON[variant]} strokeWidth={2} />}
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
      {action && (
        <AlertAction>
          <Button size="xs" variant="outline" onClick={() => demoOnly(ALERT_ACTION[variant])}>{ALERT_ACTION[variant]}</Button>
        </AlertAction>
      )}
    </Alert>
  )
}

function alertCode(v: Values) {
  const variant = str(v, 'variant') as AlertVariant
  const icon = bool(v, 'icon')
  const title = bool(v, 'showTitle') ? str(v, 'title') : ''
  const description = str(v, 'description')
  const action = bool(v, 'action')
  const head = imports({
    '@hugeicons/react': icon ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': icon ? [ALERT_ICON_NAME[variant]] : [],
    '@/components/ui/alert': ['Alert', action ? 'AlertAction' : '', description ? 'AlertDescription' : '', title ? 'AlertTitle' : ''].filter(Boolean),
    '@/components/ui/button': action ? ['Button'] : [],
  })
  const body = jsx('Alert', { variant: orDefault(variant) }, [
    icon ? `<HugeiconsIcon icon={${ALERT_ICON_NAME[variant]}} strokeWidth={2} />` : '',
    title ? jsx('AlertTitle', {}, title) : '',
    description ? jsx('AlertDescription', {}, description) : '',
    action ? jsx('AlertAction', {}, jsx('Button', { size: 'xs', variant: 'outline' }, ALERT_ACTION[variant])) : '',
  ])
  return `${head}\n\n${body}`
}

function DismissibleAlert() {
  const [open, setOpen] = useState(true)
  const showRef = useRef<HTMLButtonElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  // Only move focus after a click, not on the first render.
  const moveFocus = useRef(false)

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    ;(open ? dismissRef : showRef).current?.focus()
  }, [open])

  function toggle(next: boolean) {
    moveFocus.current = true
    setOpen(next)
  }

  if (!open) {
    return (
      <div className="text-muted-foreground flex w-64 items-center justify-between gap-2 rounded-lg border border-dashed px-2 py-1.5 text-xs">
        Alert dismissed.
        <Button ref={showRef} variant="link" size="sm" className="h-auto px-0" onClick={() => toggle(true)}>
          Show again
        </Button>
      </div>
    )
  }
  return (
    <Alert className="w-64 has-data-[slot=alert-action]:pr-8">
      <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
      <AlertTitle>Weekly digest is on</AlertTitle>
      <AlertDescription>We email your team a summary every Monday.</AlertDescription>
      <AlertAction>
        <Button ref={dismissRef} variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => toggle(false)}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default function AlertsDemos() {
  return (
    <Demos>
      <Playground
        title="Alert"
        description="variant, icon, title, description and action"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: ALERT_VARIANTS, initial: 'default' },
          { kind: 'switch', name: 'icon', label: 'Icon', initial: true },
          { kind: 'switch', name: 'showTitle', label: 'Title', initial: true },
          { kind: 'text', name: 'title', label: 'Title text', initial: 'Sync paused' },
          { kind: 'text', name: 'description', label: 'Description', initial: 'Changes will upload when the connection is back.' },
          { kind: 'switch', name: 'action', label: 'Action button', initial: false },
        ]}
        render={(v) => (
          <div className="w-full max-w-md">
            <DemoAlert
              variant={str(v, 'variant') as AlertVariant}
              icon={bool(v, 'icon')}
              title={bool(v, 'showTitle') ? str(v, 'title') : undefined}
              description={str(v, 'description')}
              action={bool(v, 'action')}
            />
          </div>
        )}
        code={alertCode}
      />

      <Variants
        title="Alert variants"
        rows={{ name: 'variant', values: ALERT_VARIANTS }}
        cols={{ name: 'parts', values: ALERT_PARTS }}
        render={(variant, part) => (
          <DemoAlert
            variant={variant}
            icon={part !== 'no icon'}
            title={part === 'no title' ? undefined : variant === 'destructive' ? 'Sync failed' : 'Sync paused'}
            description={variant === 'destructive' ? '3 issues could not be pushed.' : 'Changes upload when you are back online.'}
            className="w-60"
          />
        )}
      />

      <Variants
        title="Alert tones"
        note="className on the default variant"
        rows={{ name: 'tone', values: ALERT_TONES }}
        render={(tone) => {
          const t = ALERT_TONE[tone]
          return (
            <Alert className={cn('w-72', t.className)}>
              <HugeiconsIcon icon={t.icon} strokeWidth={2} />
              <AlertTitle>{t.title}</AlertTitle>
              <AlertDescription>{t.description}</AlertDescription>
            </Alert>
          )
        }}
      />

      <Gallery
        title="Alert in use"
        items={[
          { label: 'dismissible', node: <DismissibleAlert /> },
          {
            label: 'with a link',
            node: (
              <Alert className="w-64">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Card expires soon</AlertTitle>
                <AlertDescription>
                  Update it in <a href="#" onClick={(e) => e.preventDefault()}>billing settings</a> to avoid a pause.
                </AlertDescription>
              </Alert>
            ),
          },
          {
            label: 'with buttons',
            node: (
              <Alert variant="destructive" className="w-64">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
                <AlertTitle>Sync failed</AlertTitle>
                <AlertDescription>
                  3 issues could not be pushed.
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="xs" onClick={() => demoOnly('Retrying')}>Retry</Button>
                    <Button size="xs" variant="ghost" onClick={() => demoOnly('Opening the log')}>View log</Button>
                  </div>
                </AlertDescription>
              </Alert>
            ),
          },
        ]}
      />
    </Demos>
  )
}
