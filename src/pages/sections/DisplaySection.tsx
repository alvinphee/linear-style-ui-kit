import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, AlertCircleIcon, ArrowRight01Icon, Attachment01Icon, Cancel01Icon,
  CheckmarkCircle02Icon, Clock01Icon, FileImportIcon, FolderAddIcon, InformationCircleIcon,
  Message01Icon, Notification03Icon, Settings02Icon, SquareLock02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Panel, Row, Section } from './shared'

// Alert's own styles colour a direct child svg with currentColor, so the tone
// has to override that selector (hence the `!`).
const TONES = {
  info: 'border-brand/30 bg-brand/5 *:[svg]:text-brand!',
  success: 'border-chart-4/30 bg-chart-4/5 *:[svg]:text-chart-4!',
  warning: 'border-status-progress/40 bg-status-progress/5 *:[svg]:text-status-progress! has-data-[slot=alert-action]:pr-8',
}

function SpinnerPanel() {
  return (
    <Panel title="Spinner" note="Spinner, three sizes">
      <div className="grid gap-3">
        <Row className="gap-4">
          {[
            { label: 'sm', className: 'size-3' },
            { label: 'md', className: 'size-4' },
            { label: 'lg', className: 'size-6' },
          ].map((s) => (
            <span key={s.label} className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <Spinner className={cn('text-foreground', s.className)} /> {s.label}
            </span>
          ))}
        </Row>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Spinner className="size-3.5" /> Syncing 24 issues from the server…
        </p>
        <Row>
          <Button disabled>
            <Spinner className="size-3.5" data-icon="inline-start" /> Saving…
          </Button>
          <Button variant="outline" disabled>
            <Spinner className="size-3.5" data-icon="inline-start" /> Loading
          </Button>
        </Row>
      </div>
    </Panel>
  )
}

function SeparatorPanel() {
  return (
    <Panel title="Separator" note="Horizontal with a label, vertical inline">
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Button variant="outline" className="w-full">
            <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} data-icon="inline-start" />
            Continue with SSO
          </Button>
          <div className="relative flex items-center justify-center">
            <Separator className="absolute inset-x-0 top-1/2" />
            <span className="bg-card text-muted-foreground relative px-2 text-[11px]">or</span>
          </div>
          <Input aria-label="Work email" placeholder="name@company.com" />
        </div>
        <div className="flex h-4 items-center gap-3 text-xs">
          <span>Issues</span>
          <Separator orientation="vertical" />
          <span>Projects</span>
          <Separator orientation="vertical" />
          <span>Views</span>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" /> Updated 2h ago
          </span>
          <Separator orientation="vertical" />
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="size-3" /> 12 comments
          </span>
          <Separator orientation="vertical" />
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} className="size-3" /> 3 files
          </span>
        </div>
      </div>
    </Panel>
  )
}

function EmptyPanel() {
  return (
    <Panel title="Empty state" note="Empty, EmptyMedia">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Projects group related issues around one goal. Create your first one, or import from a CSV file.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => toast.success('Project created', { description: 'Demo only. Nothing was saved.' })}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create project
            </Button>
            <Button variant="outline" onClick={() => toast('Import started', { description: 'Demo only.' })}>
              <HugeiconsIcon icon={FileImportIcon} strokeWidth={2} data-icon="inline-start" />
              Import
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </Panel>
  )
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

const FAQ = [
  {
    q: 'Can I invite guests to a workspace?',
    a: 'Yes. Guests can see and comment on the teams you share with them, and they do not count as paid seats.',
  },
  {
    q: 'How does billing work when seats change?',
    a: 'Adding a seat is charged pro rata for the rest of the billing period. Removed seats are credited on the next invoice.',
  },
  {
    q: 'Can I export my data?',
    a: 'Any admin can export issues, projects and comments as CSV or JSON from the workspace settings, at any time.',
  },
]

function AccordionPanel() {
  return (
    <Panel title="Accordion" note='type="single" collapsible'>
      <Accordion type="single" collapsible defaultValue="q0">
        {FAQ.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Panel>
  )
}

const OPTIONS = [
  { id: 'opt-archive', label: 'Auto-archive closed issues', hint: 'After 30 days', on: true },
  { id: 'opt-triage', label: 'Require triage for new issues', hint: 'Issues from forms and email', on: false },
  { id: 'opt-digest', label: 'Send a weekly digest', hint: 'Mondays at 09:00', on: true },
]

function CollapsiblePanel() {
  const [open, setOpen] = useState(false)

  return (
    <Panel title="Collapsible" note="Collapsible with a rotating chevron">
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="h-8 w-full justify-between rounded-md px-2.5">
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="text-muted-foreground" />
              Advanced options
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="text-muted-foreground transition-transform duration-200 group-data-[state=open]/button:rotate-90"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
          <div className="grid gap-3 border-t px-2.5 py-3">
            {OPTIONS.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3">
                <Label htmlFor={o.id} className="grid gap-1 font-normal">
                  {o.label}
                  <span className="text-muted-foreground text-[11px]">{o.hint}</span>
                </Label>
                <Switch id={o.id} defaultChecked={o.on} />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <p className="text-muted-foreground mt-2 text-[11px]">{open ? 'Showing 3 options' : '3 options hidden'}</p>
    </Panel>
  )
}

export default function DisplaySection() {
  return (
    <Section id="display" title="Feedback and display" description="Spinners, empty states, alerts, accordions and collapsibles">
      <SpinnerPanel />
      <SeparatorPanel />
      <EmptyPanel />
      <AlertsPanel />
      <AccordionPanel />
      <CollapsiblePanel />
    </Section>
  )
}
