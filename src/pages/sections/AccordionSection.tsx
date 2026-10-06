import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Settings02Icon } from '@hugeicons/core-free-icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Panel, Section } from './shared'

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

export default function AccordionSection() {
  return (
    <Section id="accordion" title="Accordion and collapsible" description="Sections that fold open and closed">
      <AccordionPanel />

      <CollapsiblePanel />
    </Section>
  )
}
