import { HugeiconsIcon } from '@hugeicons/react'
import { CreditCardIcon, Settings02Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Demos, Gallery, Playground, bool, imports, jsx, str, type Values } from './Playground'

const ACCORDION_TYPES = ['single', 'multiple'] as const

// --- Accordion -----------------------------------------------------------

const FAQ = [
  {
    value: 'guests',
    q: 'Can I invite guests?',
    a: 'Yes. Guests can see and comment on the teams you share with them, and they do not take a paid seat.',
  },
  {
    value: 'billing',
    q: 'How does billing work when seats change?',
    a: 'New seats are charged pro rata for the rest of the period. Removed seats are credited on the next invoice.',
  },
  {
    value: 'export',
    q: 'Can I export my data?',
    a: 'Any admin can export issues, projects and comments as CSV or JSON from the workspace settings.',
  },
]

const SETTINGS_FAQ = [
  { value: 'general', icon: Settings02Icon, q: 'General', a: 'Workspace name, URL and default language.' },
  { value: 'members', icon: UserGroupIcon, q: 'Members', a: 'Invite people, change roles and remove access.' },
  { value: 'billing', icon: CreditCardIcon, q: 'Billing', a: 'Plan, invoices and the card on file.' },
]

function DemoAccordion({ type, collapsible, open, disabledLast }: {
  type: string
  collapsible: boolean
  open: boolean
  disabledLast: boolean
}) {
  const items = FAQ.map((item, i) => (
    <AccordionItem key={item.value} value={item.value} disabled={disabledLast && i === FAQ.length - 1}>
      <AccordionTrigger>{item.q}</AccordionTrigger>
      <AccordionContent>{item.a}</AccordionContent>
    </AccordionItem>
  ))
  // defaultValue is only read on mount, so a new key remounts the accordion
  // whenever a prop that shapes it changes.
  const key = `${type}-${collapsible}-${open}`
  if (type === 'multiple') {
    return <Accordion key={key} type="multiple" defaultValue={open ? [FAQ[0].value] : []}>{items}</Accordion>
  }
  return (
    <Accordion key={key} type="single" collapsible={collapsible} defaultValue={open ? FAQ[0].value : undefined}>
      {items}
    </Accordion>
  )
}

function accordionCode(v: Values) {
  const open = bool(v, 'open')
  const disabled = bool(v, 'disabled')
  const props = str(v, 'type') === 'multiple'
    ? { type: 'multiple', defaultValue: open ? `{['${FAQ[0].value}']}` : undefined }
    : { type: 'single', collapsible: bool(v, 'collapsible'), defaultValue: open ? FAQ[0].value : undefined }
  const body = jsx('Accordion', props, FAQ.map((item, i) => jsx('AccordionItem', { value: item.value, disabled: disabled && i === FAQ.length - 1 }, [
    jsx('AccordionTrigger', {}, item.q),
    jsx('AccordionContent', {}, item.a),
  ])))
  return `${imports({ '@/components/ui/accordion': ['Accordion', 'AccordionContent', 'AccordionItem', 'AccordionTrigger'] })}\n\n${body}`
}

export default function AccordionDemos() {
  return (
    <Demos>
      <Playground
        title="Accordion"
        description="collapsible applies to type single only"
        controls={[
          { kind: 'select', name: 'type', label: 'Type', options: ACCORDION_TYPES, initial: 'single' },
          { kind: 'switch', name: 'collapsible', label: 'Collapsible', initial: true },
          { kind: 'switch', name: 'open', label: 'First item open', initial: true },
          { kind: 'switch', name: 'disabled', label: 'Disable last item', initial: false },
        ]}
        render={(v) => (
          <div className="w-full max-w-md">
            <DemoAccordion
              type={str(v, 'type')}
              collapsible={bool(v, 'collapsible')}
              open={bool(v, 'open')}
              disabledLast={bool(v, 'disabled')}
            />
          </div>
        )}
        code={accordionCode}
      />

      <Gallery
        title="Accordion in use"
        items={[
          {
            label: 'leading icons',
            node: (
              <Accordion type="single" collapsible className="w-64">
                {SETTINGS_FAQ.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ),
          },
          {
            label: 'multiple, all open',
            node: (
              <Accordion type="multiple" defaultValue={SETTINGS_FAQ.slice(0, 2).map((item) => item.value)} className="w-64">
                {SETTINGS_FAQ.slice(0, 2).map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ),
          },
          {
            label: 'flush',
            node: (
              <Accordion type="single" collapsible className="w-64 rounded-none border-0">
                {SETTINGS_FAQ.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ),
          },
        ]}
      />
    </Demos>
  )
}
