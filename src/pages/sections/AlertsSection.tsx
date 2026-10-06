import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, AlertCircleIcon, Cancel01Icon, CheckmarkCircle02Icon, InformationCircleIcon, Notification03Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Panel, Row, Section } from './shared'

// Alert's own styles colour a direct child svg with currentColor, so the tone
// has to override that selector (hence the `!`).
const TONES = {
  info: 'border-brand/30 bg-brand/5 *:[svg]:text-brand!',
  success: 'border-chart-4/30 bg-chart-4/5 *:[svg]:text-chart-4!',
  warning: 'border-status-progress/40 bg-status-progress/5 *:[svg]:text-status-progress! has-data-[slot=alert-action]:pr-8',
}

function AlertsPanel() {
  const [dismissed, setDismissed] = useState(false)
  const showAgainRef = useRef<HTMLButtonElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  // Only move focus after a click, not on the first render.
  const moveFocus = useRef(false)

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    ;(dismissed ? showAgainRef : dismissRef).current?.focus()
  }, [dismissed])

  function setHidden(hidden: boolean) {
    moveFocus.current = true
    setDismissed(hidden)
  }

  return (
    <Panel title="Alerts" note="Alert, plus token-coloured tones">
      <div className="grid gap-2">
        <Alert>
          <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
          <AlertTitle>Scheduled maintenance</AlertTitle>
          <AlertDescription>The workspace is read-only on Sunday from 02:00 to 02:30.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertTitle>Sync failed</AlertTitle>
          <AlertDescription>3 issues could not be pushed. Check the connection and try again.</AlertDescription>
        </Alert>
        <Alert className={TONES.info}>
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>New: keyboard-first triage</AlertTitle>
          <AlertDescription>Press T on any issue to move it through triage without the mouse.</AlertDescription>
        </Alert>
        <Alert className={TONES.success}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
          <AlertTitle>Import complete</AlertTitle>
          <AlertDescription>148 issues and 6 projects were added to the workspace.</AlertDescription>
        </Alert>
        {dismissed ? (
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed px-2 py-1.5 text-xs">
            Warning dismissed.
            <Button ref={showAgainRef} variant="link" size="sm" className="h-auto px-0" onClick={() => setHidden(false)}>
              Show again
            </Button>
          </div>
        ) : (
          <Alert className={TONES.warning}>
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
            <AlertTitle>Your trial ends in 3 days</AlertTitle>
            <AlertDescription>
              Pick a plan to keep your cycles, projects and history.
              <Row className="mt-2">
                <Button size="xs" onClick={() => toast('Opening plans…')}>Choose a plan</Button>
                <Button size="xs" variant="ghost" onClick={() => setHidden(true)}>Remind me later</Button>
              </Row>
            </AlertDescription>
            <AlertAction>
              <Button ref={dismissRef} variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => setHidden(true)}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            </AlertAction>
          </Alert>
        )}
      </div>
    </Panel>
  )
}

export default function AlertsSection() {
  return (
    <Section id="alerts" title="Alerts and toasts" description="Messages in the page, and short ones that appear and fade">
      <AlertsPanel />

      <Panel title="Toasts" note="Sonner" wide>
        <Row>
          <Button variant="outline" onClick={() => toast.success('Proof photos uploaded', { description: '6 photos for DO-24801' })}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.info('Driver is 10 minutes away')}>Info</Button>
          <Button variant="outline" onClick={() => toast.warning('2 photos are missing', { description: 'DO-24812 needs a loading photo.' })}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.error('Upload failed', { description: 'Check the connection and try again.' })}>
            Error
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 1800)), {
                loading: 'Generating PDF report…',
                success: 'Report ready',
                error: 'Could not build the report',
              })
            }
          >
            Loading → done
          </Button>
          <Button
            variant="outline"
            onClick={() => toast('Job archived', { action: { label: 'Undo', onClick: () => toast('Restored') } })}
          >
            With undo
          </Button>
        </Row>
      </Panel>
    </Section>
  )
}
