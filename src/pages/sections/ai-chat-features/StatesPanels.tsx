import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { KeyboardIcon, SparklesIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { OnboardingDialog, type OnboardingAnswers } from '@/blocks/ai/onboarding/onboarding-dialog'
import { RateLimitError, UsageLimitBanner, UsageLimitNotice } from '@/blocks/ai/chat/usage-limit'
import { KeyboardShortcutsDialog } from '@/blocks/keyboard-shortcuts-dialog'
import { OfflineBanner } from '@/blocks/offline-banner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useOnline } from '@/lib/use-online'
import { Panel, Row } from '../shared'
import { ONBOARDING_ROLES, ONBOARDING_STYLES, shortcutGroups, usageResetAt } from '../ai/ChatChrome'
import { STARTERS } from '../ai/data'
import { CONNECTORS } from '../ai/settings/connectors-data'

// The AI chat app's edge states and first run, each block on its own: the
// usage limit (near, reached, and for an empty chat), a rate limit error
// that counts down, the offline banner with a switch to fake it, the
// onboarding and the keyboard shortcuts dialog. Every button here is a demo.

const demo = (title: string) => () => toast(title, { description: 'Demo only.' })

const SAMPLE_CONNECTORS = CONNECTORS
  .filter((c) => c.status !== 'disabled')
  .slice(0, 4)
  .map((c, i) => ({ id: c.id, name: c.name, description: c.description, icon: c.icon, colour: c.colour, connected: i === 0 }))

export function StatesPanels() {
  const id = useId()
  const resetsAt = usageResetAt()

  const [nearShown, setNearShown] = useState(true)
  const [rateKey, setRateKey] = useState(0)
  const [offline, setOffline] = useState(true)
  const [pending, setPending] = useState(2)
  const browserOnline = useOnline()
  const [welcome, setWelcome] = useState(false)
  const [answers, setAnswers] = useState<OnboardingAnswers | null>(null)
  const [shortcuts, setShortcuts] = useState(false)

  return (
    <>
      <Panel title="Usage limit banner" note="Near the limit, and at it">
        <div className="grid gap-2">
          {nearShown ? (
            <UsageLimitBanner
              state="near"
              remaining={5}
              resetsAt={resetsAt}
              onUpgrade={demo('Upgrade')}
              onDismiss={() => setNearShown(false)}
            />
          ) : (
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setNearShown(true)}>
              Show the near banner again
            </Button>
          )}
          <UsageLimitBanner
            state="reached"
            resetsAt={resetsAt}
            fallbackModel="Swift"
            onSwitchModel={demo('Switched to Swift')}
            onUpgrade={demo('Upgrade')}
          />
          <p className="text-muted-foreground text-[11px]">Above the prompt box. Near can be dismissed; reached stays until it resets.</p>
        </div>
      </Panel>

      <Panel title="Usage limit notice" note="An empty chat at the limit">
        <div className="rounded-md border">
          <UsageLimitNotice
            resetsAt={resetsAt}
            plan="Team"
            fallbackModel="Swift"
            onSwitchModel={demo('Switched to Swift')}
            onUpgrade={demo('Upgrade')}
          />
        </div>
      </Panel>

      <Panel title="Rate limit error" note="Counts down, then Retry works">
        <div className="grid gap-2">
          <RateLimitError
            key={rateKey}
            retryIn={10}
            onRetry={() => {
              toast('Retrying', { description: 'Demo only. The countdown starts again.' })
              setRateKey((k) => k + 1)
            }}
          />
          <Button variant="ghost" size="sm" className="w-fit" onClick={() => setRateKey((k) => k + 1)}>
            Start the countdown again
          </Button>
        </div>
      </Panel>

      <Panel title="Offline banner" note={browserOnline ? 'This browser is online' : 'This browser is offline'}>
        <div className="grid gap-3">
          <Row className="justify-between">
            <div className="flex items-center gap-2">
              <Switch id={`${id}-offline`} checked={offline} onCheckedChange={setOffline} />
              <Label htmlFor={`${id}-offline`}>Simulate offline</Label>
            </div>
            <Row className="gap-1">
              <Button variant="outline" size="xs" onClick={() => setPending((n) => Math.max(0, n - 1))} aria-label="One fewer waiting message">−</Button>
              <span className="text-muted-foreground min-w-16 text-center text-[11px] tabular-nums">{pending} waiting</span>
              <Button variant="outline" size="xs" onClick={() => setPending((n) => n + 1)} aria-label="One more waiting message">+</Button>
            </Row>
          </Row>
          <div className="bg-muted/40 grid min-h-16 place-items-center rounded-md border border-dashed p-3">
            <OfflineBanner
              online={!offline}
              pendingCount={pending}
              onRetry={demo('Trying to reconnect')}
              className="w-full max-w-md"
            />
            {!offline && <span className="text-muted-foreground text-[11px]">Online: the banner says so briefly, then hides.</span>}
          </div>
        </div>
      </Panel>

      <Panel title="Onboarding" note="Four steps on a first visit">
        <div className="grid gap-3">
          <Button size="sm" className="w-fit" onClick={() => setWelcome(true)}>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
            Open the welcome
          </Button>
          {answers ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md border p-3 text-xs">
              <dt className="text-muted-foreground">Name</dt><dd className="truncate">{answers.name || '—'}</dd>
              <dt className="text-muted-foreground">Role</dt><dd className="truncate">{answers.role || '—'}</dd>
              <dt className="text-muted-foreground">Style</dt><dd className="truncate">{answers.style}</dd>
              <dt className="text-muted-foreground">Connect</dt><dd className="truncate">{answers.connectors.join(', ') || '—'}</dd>
              <dt className="text-muted-foreground">Starter</dt><dd className="truncate">{answers.starter ?? '—'}</dd>
            </dl>
          ) : (
            <p className="text-muted-foreground text-[11px]">Finish it to see the answers it hands back.</p>
          )}
        </div>
        <OnboardingDialog
          open={welcome}
          onFinish={(a) => {
            setAnswers(a)
            setWelcome(false)
          }}
          onSkip={() => setWelcome(false)}
          roles={ONBOARDING_ROLES}
          styles={ONBOARDING_STYLES}
          connectors={SAMPLE_CONNECTORS}
          starters={STARTERS}
          initial={{ name: 'Alex' }}
        />
      </Panel>

      <Panel title="Keyboard shortcuts dialog" note="Searchable, two columns when wide">
        <div className="grid gap-3">
          <Button variant="outline" size="sm" className="w-fit" onClick={() => setShortcuts(true)}>
            <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} data-icon="inline-start" />
            Keyboard shortcuts
          </Button>
          <p className="text-muted-foreground text-[11px]">In the app, “?” or Ctrl/⌘ / opens it. Try searching for “chat” or “esc”.</p>
        </div>
        <KeyboardShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} groups={shortcutGroups(true)} />
      </Panel>
    </>
  )
}
