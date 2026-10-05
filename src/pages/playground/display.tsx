import { Fragment, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, AlertCircleIcon, Attachment01Icon, Cancel01Icon, CheckmarkCircle02Icon, Clock01Icon,
  CloudAlertIcon, CreditCardIcon, Download01Icon, FolderAddIcon, InboxCheckIcon, InformationCircleIcon, Message01Icon,
  MoreHorizontalIcon, Notification03Icon, RefreshIcon, Search01Icon, Settings02Icon, SquareLock02Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const ALERT_VARIANTS = ['default', 'destructive'] as const
const ALERT_PARTS = ['full', 'no icon', 'no title'] as const
const ALERT_TONES = ['info', 'success', 'warning'] as const
const SPINNER_SIZES = ['size-3', 'size-4', 'size-5', 'size-6'] as const
const SPINNER_COLOURS = ['muted', 'foreground', 'brand'] as const
const EMPTY_MEDIA = ['icon', 'default', 'none'] as const
const EMPTY_MEDIA_VARIANTS = ['icon', 'default'] as const
const EMPTY_CONTENT = ['text only', 'with button'] as const
const ACCORDION_TYPES = ['single', 'multiple'] as const
const CARD_SIZES = ['default', 'sm'] as const
const CARD_LAYOUTS = ['plain', 'divided'] as const
const ORIENTATIONS = ['horizontal', 'vertical'] as const
const PAGE_HEADER_SIZES = ['lg', 'md', 'sm'] as const
const HEADING_LEVELS = ['h1', 'h2', 'h3'] as const
const PANEL_TRAILING = ['note', 'action', 'none'] as const
const SCROLL_DIRECTIONS = ['vertical', 'horizontal'] as const
const SCROLL_HEIGHTS = ['h-32', 'h-48', 'h-64'] as const
const RELEASES = Array.from({ length: 24 }, (_, i) => `v2.${24 - i}.0`)
const TAGS = ['Fragile', 'Export', 'Cold chain', 'Oversize', 'Key account', 'Hazardous', 'Same day', 'Bulk', 'Returns', 'Customs']

// A box that scrolls on its own with a thin kit scrollbar, instead of the
// browser's: a long list in a fixed height, or a row of tags sideways.
function ScrollAreaDemo({ direction, height }: { direction: (typeof SCROLL_DIRECTIONS)[number]; height: string }) {
  if (direction === 'horizontal') {
    return (
      <ScrollArea className="w-72 max-w-full rounded-md border whitespace-nowrap">
        <div className="flex w-max gap-1.5 p-2.5">
          {TAGS.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
  }
  return (
    <ScrollArea className={cn('w-56 rounded-md border', height)}>
      <div className="p-2.5">
        <p className="mb-2 text-xs font-medium">Releases</p>
        {RELEASES.map((r, i) => (
          <Fragment key={r}>
            {i > 0 && <Separator className="my-1.5" />}
            <p className="text-muted-foreground text-xs tabular-nums">{r}</p>
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  )
}

function scrollAreaCode(v: Values) {
  if (str(v, 'direction') === 'horizontal') {
    return [
      imports({ '@/components/ui/scroll-area': ['ScrollArea', 'ScrollBar'] }),
      '',
      '<ScrollArea className="w-72 rounded-md border whitespace-nowrap">',
      '  <div className="flex w-max gap-1.5 p-2.5">',
      '    {tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}',
      '  </div>',
      '  <ScrollBar orientation="horizontal" />',
      '</ScrollArea>',
    ].join('\n')
  }
  return [
    imports({ '@/components/ui/scroll-area': ['ScrollArea'] }),
    '',
    `<ScrollArea className="w-56 rounded-md border ${str(v, 'height')}">`,
    '  <div className="p-2.5">{releases}</div>',
    '</ScrollArea>',
  ].join('\n')
}

type AlertVariant = (typeof ALERT_VARIANTS)[number]
type SpinnerColour = (typeof SPINNER_COLOURS)[number]
type EmptyMediaKind = (typeof EMPTY_MEDIA)[number]
type CardSize = (typeof CARD_SIZES)[number]
type PageHeaderSize = (typeof PAGE_HEADER_SIZES)[number]
type HeadingLevel = (typeof HEADING_LEVELS)[number]
type PanelTrailing = (typeof PANEL_TRAILING)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)
// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)
const indent = (code: string) => code.replace(/^/gm, '  ')
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

// --- Spinner -------------------------------------------------------------

const SPINNER_COLOUR: Record<SpinnerColour, string> = {
  muted: 'text-muted-foreground',
  foreground: 'text-foreground',
  brand: 'text-brand',
}

// size-4 is the Spinner's own size, so the snippet leaves it out.
const spinnerClass = (size: string, colour: SpinnerColour) => cn(size === 'size-4' ? '' : size, SPINNER_COLOUR[colour])

// --- Empty ---------------------------------------------------------------

function DemoEmpty({ media = 'icon', title, description, action = true, border = true, className }: {
  media?: EmptyMediaKind
  title?: string
  description?: string
  action?: boolean
  border?: boolean
  className?: string
}) {
  return (
    <Empty className={cn(border && 'border', className)}>
      <EmptyHeader>
        {media === 'icon' && (
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
          </EmptyMedia>
        )}
        {/* A large display icon keeps the default stroke; 2 is for small icons. */}
        {media === 'default' && (
          <EmptyMedia>
            <HugeiconsIcon icon={FolderAddIcon} className="text-muted-foreground size-8" />
          </EmptyMedia>
        )}
        {title && <EmptyTitle>{title}</EmptyTitle>}
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button onClick={() => toast.success('Project created', { description: 'Demo only. Nothing was saved.' })}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New project
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

function emptyCode(v: Values) {
  const media = str(v, 'media')
  const title = str(v, 'title')
  const description = str(v, 'description')
  const action = bool(v, 'action')
  const icons = [media === 'none' ? '' : 'FolderAddIcon', action ? 'Add01Icon' : ''].filter(Boolean)
  const head = imports({
    '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': icons,
    '@/components/ui/button': action ? ['Button'] : [],
    '@/components/ui/empty': [
      'Empty', action ? 'EmptyContent' : '', description ? 'EmptyDescription' : '', 'EmptyHeader',
      media === 'none' ? '' : 'EmptyMedia', title ? 'EmptyTitle' : '',
    ].filter(Boolean),
  })
  const mediaTag = media === 'icon'
    ? jsx('EmptyMedia', { variant: 'icon' }, '<HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />')
    : media === 'default'
      ? jsx('EmptyMedia', {}, '<HugeiconsIcon icon={FolderAddIcon} className="text-muted-foreground size-8" />')
      : ''
  const body = jsx('Empty', { className: bool(v, 'border') ? 'border' : undefined }, [
    jsx('EmptyHeader', {}, [
      mediaTag,
      title ? jsx('EmptyTitle', {}, title) : '',
      description ? jsx('EmptyDescription', {}, description) : '',
    ]),
    action
      ? jsx('EmptyContent', {}, jsx('Button', {}, ['<HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />', 'New project']))
      : '',
  ])
  return `${head}\n\n${body}`
}

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

// --- Card ----------------------------------------------------------------

const CARD_BODY = 'Seats are billed monthly. Removing a member frees their seat straight away.'

function DemoCard({ size = 'default', header = true, action = true, footer = true, divided = false, className }: {
  size?: CardSize
  header?: boolean
  action?: boolean
  footer?: boolean
  divided?: boolean
  className?: string
}) {
  return (
    <Card size={size} className={className}>
      {header && (
        <CardHeader className={divided ? 'border-b' : undefined}>
          <CardTitle>Seats</CardTitle>
          <CardDescription>12 of 20 seats in use</CardDescription>
          {action && (
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label="More options" onClick={() => demoOnly('More options')}>
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </Button>
            </CardAction>
          )}
        </CardHeader>
      )}
      <CardContent>
        <p className="text-muted-foreground">{CARD_BODY}</p>
      </CardContent>
      {footer && (
        <CardFooter className={cn('gap-2', divided && 'border-t')}>
          <Button size="sm" onClick={() => demoOnly('Invite people')}>Invite people</Button>
          <Button size="sm" variant="ghost" onClick={() => demoOnly('Manage seats')}>Manage</Button>
        </CardFooter>
      )}
    </Card>
  )
}

function cardCode(v: Values) {
  const header = bool(v, 'header')
  const action = header && bool(v, 'action')
  const footer = bool(v, 'footer')
  const divided = bool(v, 'divided')
  const head = imports({
    '@hugeicons/react': action ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': action ? ['MoreHorizontalIcon'] : [],
    '@/components/ui/button': action || footer ? ['Button'] : [],
    '@/components/ui/card': [
      'Card', action ? 'CardAction' : '', 'CardContent', header ? 'CardDescription' : '', footer ? 'CardFooter' : '',
      header ? 'CardHeader' : '', header ? 'CardTitle' : '',
    ].filter(Boolean),
  })
  const body = jsx('Card', { size: orDefault(str(v, 'size')) }, [
    header
      ? jsx('CardHeader', { className: divided ? 'border-b' : undefined }, [
        jsx('CardTitle', {}, 'Seats'),
        jsx('CardDescription', {}, '12 of 20 seats in use'),
        action
          ? jsx('CardAction', {}, jsx('Button', { variant: 'ghost', size: 'icon-sm', 'aria-label': 'More options' }, '<HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />'))
          : '',
      ])
      : '',
    jsx('CardContent', {}, `<p className="text-muted-foreground">${CARD_BODY}</p>`),
    footer
      ? jsx('CardFooter', { className: divided ? 'gap-2 border-t' : 'gap-2' }, [
        jsx('Button', { size: 'sm' }, 'Invite people'),
        jsx('Button', { size: 'sm', variant: 'ghost' }, 'Manage'),
      ])
      : '',
  ])
  return `${head}\n\n${body}`
}

// --- PageHeader ----------------------------------------------------------

const PAGE_DESCRIPTION = '12 active projects across 4 teams.'
const PAGE_TABS = [
  { value: 'all', label: 'All', body: 'All 18 projects, newest first.' },
  { value: 'active', label: 'Active', body: '12 projects with work in the current cycle.' },
  { value: 'backlog', label: 'Backlog', body: '6 projects not started yet.' },
]
// A slice of page for the header to sit at the top of.
const PAGE_BOX = 'bg-background w-full max-w-xl rounded-lg border p-4'

function DemoPageHeader({ size, as, title, description, actions, tabs }: {
  size: PageHeaderSize
  as: HeadingLevel
  title: string
  description: boolean
  actions: boolean
  tabs: boolean
}) {
  const header = (
    <PageHeader
      size={size}
      as={as}
      title={title}
      description={description ? PAGE_DESCRIPTION : undefined}
      actions={actions && (
        <>
          <Button variant="outline" size="sm" onClick={() => demoOnly('Export')}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />
            Export
          </Button>
          <Button size="sm" onClick={() => demoOnly('New project')}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            New project
          </Button>
        </>
      )}
    >
      {tabs && (
        <TabsList variant="line">
          {PAGE_TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
      )}
    </PageHeader>
  )
  if (!tabs) return <div className={PAGE_BOX}>{header}</div>
  // The tabs switch the content under the header, so Tabs wraps both.
  return (
    <Tabs defaultValue="all" className={cn(PAGE_BOX, 'gap-4')}>
      {header}
      {PAGE_TABS.map((t) => <TabsContent key={t.value} value={t.value} className="text-muted-foreground">{t.body}</TabsContent>)}
    </Tabs>
  )
}

function pageHeaderCode(v: Values) {
  const title = str(v, 'title') || 'Projects'
  const actions = bool(v, 'actions')
  const tabs = bool(v, 'tabs')
  const head = imports({
    '@hugeicons/react': actions ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': actions ? ['Add01Icon', 'Download01Icon'] : [],
    '@/components/page-header': ['PageHeader'],
    '@/components/ui/button': actions ? ['Button'] : [],
    '@/components/ui/tabs': tabs ? ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'] : [],
  })
  const actionsCode = actions
    ? `const actions = (\n${indent(jsx('', {}, [
      jsx('Button', { variant: 'outline', size: 'sm' }, ['<HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" />', 'Export']),
      jsx('Button', { size: 'sm' }, ['<HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />', 'New project']),
    ]))}\n)\n\n`
    : ''
  const header = jsx('PageHeader', {
    size: unless(str(v, 'size'), 'md'),
    as: unless(str(v, 'as'), 'h1'),
    title,
    description: bool(v, 'description') ? PAGE_DESCRIPTION : undefined,
    actions: actions ? '{actions}' : undefined,
  }, tabs ? jsx('TabsList', { variant: 'line' }, PAGE_TABS.map((t) => jsx('TabsTrigger', { value: t.value }, t.label))) : undefined)
  const body = tabs
    ? jsx('Tabs', { defaultValue: 'all' }, [header, ...PAGE_TABS.map((t) => jsx('TabsContent', { value: t.value }, t.body))])
    : header
  return `${head}\n\n${actionsCode}${body}`
}

// --- Panel ---------------------------------------------------------------

const PANEL_NOTE = 'Last 7 days'

// -my-0.5 keeps the title bar as tall as it is with a note.
function PanelAction() {
  return <Button variant="ghost" size="xs" className="-my-0.5" onClick={() => demoOnly('View all')}>View all</Button>
}

function panelCode(v: Values) {
  const title = str(v, 'title')
  const trailing = title ? (str(v, 'trailing') as PanelTrailing) : 'none'
  const head = imports({
    '@/components/panel': ['Panel'],
    '@/components/ui/button': trailing === 'action' ? ['Button'] : [],
  })
  const body = jsx('Panel', {
    title: title || undefined,
    note: trailing === 'note' ? PANEL_NOTE : undefined,
    action: trailing === 'action' ? '{<Button variant="ghost" size="xs" className="-my-0.5">View all</Button>}' : undefined,
  }, `<p className="text-muted-foreground">${str(v, 'body') || 'Body'}</p>`)
  return `${head}\n\n${body}`
}

export default function DisplayDemos() {
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

      <Playground
        title="Spinner"
        description="size and colour come from className"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: SPINNER_SIZES, initial: 'size-4' },
          { kind: 'select', name: 'colour', label: 'Colour', options: SPINNER_COLOURS, initial: 'muted' },
          { kind: 'switch', name: 'text', label: 'With text', initial: false },
        ]}
        render={(v) => {
          const spinner = <Spinner className={spinnerClass(str(v, 'size'), str(v, 'colour') as SpinnerColour)} />
          if (!bool(v, 'text')) return spinner
          return <span className="text-muted-foreground flex items-center gap-1.5 text-xs">{spinner} Syncing issues…</span>
        }}
        code={(v) => {
          const spinner = jsx('Spinner', { className: spinnerClass(str(v, 'size'), str(v, 'colour') as SpinnerColour) })
          const body = bool(v, 'text')
            ? jsx('span', { className: 'text-muted-foreground flex items-center gap-1.5 text-xs' }, [spinner, 'Syncing issues…'])
            : spinner
          return `${imports({ '@/components/ui/spinner': ['Spinner'] })}\n\n${body}`
        }}
      />

      <Variants
        title="Spinner sizes"
        note="size × colour, size-4 is the default"
        rows={{ name: 'size', values: SPINNER_SIZES }}
        cols={{ name: 'colour', values: SPINNER_COLOURS }}
        render={(size, colour = 'muted') => <Spinner className={cn(size, SPINNER_COLOUR[colour])} />}
      />

      <Gallery
        title="Spinner in context"
        items={[
          { label: 'inline text', node: <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><Spinner className="size-3.5" /> Uploading 3 files…</span> },
          { label: 'button', node: <Button disabled><Spinner data-icon="inline-start" /> Saving</Button> },
          { label: 'outline button', node: <Button variant="outline" size="sm" disabled><Spinner className="size-3" data-icon="inline-start" /> Loading</Button> },
          { label: 'badge', node: <Badge variant="secondary"><Spinner data-icon="inline-start" /> Syncing</Badge> },
        ]}
      />

      <Playground
        title="Empty"
        description="media, text and an optional action"
        controls={[
          { kind: 'select', name: 'media', label: 'Media', options: EMPTY_MEDIA, initial: 'icon' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'No projects yet' },
          { kind: 'text', name: 'description', label: 'Description', initial: 'Projects group related issues around one goal.' },
          { kind: 'switch', name: 'action', label: 'Action button', initial: true },
          { kind: 'switch', name: 'border', label: 'Dashed border', initial: true },
        ]}
        render={(v) => (
          <div className="bg-card w-full max-w-md rounded-xl">
            <DemoEmpty
              media={str(v, 'media') as EmptyMediaKind}
              title={str(v, 'title')}
              description={str(v, 'description')}
              action={bool(v, 'action')}
              border={bool(v, 'border')}
            />
          </div>
        )}
        code={emptyCode}
      />

      <Variants
        title="Empty layouts"
        note="EmptyMedia variant × content"
        rows={{ name: 'media', values: EMPTY_MEDIA_VARIANTS }}
        cols={{ name: 'content', values: EMPTY_CONTENT }}
        render={(media, content) => (
          <DemoEmpty
            media={media}
            title="No projects yet"
            description="Create one to get started."
            action={content === 'with button'}
            className="w-56 p-4"
          />
        )}
      />

      <Gallery
        title="Empty states"
        note="Same parts, different jobs"
        items={[
          {
            label: 'no results',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={Search01Icon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>No results</EmptyTitle>
                  <EmptyDescription>Nothing matches “billing”. Try another word or clear the filters.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => demoOnly('Filters cleared')}>Clear filters</Button>
                </EmptyContent>
              </Empty>
            ),
          },
          {
            label: 'all caught up',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={InboxCheckIcon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>You're all caught up</EmptyTitle>
                  <EmptyDescription>New mentions and updates show up here.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ),
          },
          {
            label: 'load failed',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
                    <HugeiconsIcon icon={CloudAlertIcon} strokeWidth={2} />
                  </EmptyMedia>
                  <EmptyTitle>Couldn't load issues</EmptyTitle>
                  <EmptyDescription>Check your connection and try again.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={() => demoOnly('Retrying')}>
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                    Retry
                  </Button>
                </EmptyContent>
              </Empty>
            ),
          },
          {
            label: 'no access',
            node: (
              <Empty className="w-64 border p-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} /></EmptyMedia>
                  <EmptyTitle>You need access</EmptyTitle>
                  <EmptyDescription>Ask a workspace admin to add you to this team.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" onClick={() => demoOnly('Access requested')}>Request access</Button>
                </EmptyContent>
              </Empty>
            ),
          },
        ]}
      />

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

      <Playground
        title="Card"
        description="size, header, action and footer"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: CARD_SIZES, initial: 'default' },
          { kind: 'switch', name: 'header', label: 'Header', initial: true },
          { kind: 'switch', name: 'action', label: 'Header action', initial: true },
          { kind: 'switch', name: 'footer', label: 'Footer', initial: true },
          { kind: 'switch', name: 'divided', label: 'Divided header and footer', initial: false },
        ]}
        render={(v) => (
          <DemoCard
            size={str(v, 'size') as CardSize}
            header={bool(v, 'header')}
            action={bool(v, 'action')}
            footer={bool(v, 'footer')}
            divided={bool(v, 'divided')}
            className="w-full max-w-sm"
          />
        )}
        code={cardCode}
      />

      <Variants
        title="Card sizes"
        note="size × layout, sm tightens the spacing"
        rows={{ name: 'size', values: CARD_SIZES }}
        cols={{ name: 'layout', values: CARD_LAYOUTS }}
        render={(size, layout) => <DemoCard size={size} divided={layout === 'divided'} action={false} className="w-60" />}
      />

      <Gallery
        title="Card in use"
        items={[
          {
            label: 'stat',
            node: (
              <Card size="sm" className="w-48">
                <CardHeader>
                  <CardDescription>Issues closed</CardDescription>
                  <CardTitle className="text-xl tabular-nums">128</CardTitle>
                  <CardAction><Badge variant="secondary">+12%</Badge></CardAction>
                </CardHeader>
              </Card>
            ),
          },
          {
            label: 'setting',
            node: (
              <Card size="sm" className="w-64">
                <CardHeader>
                  <CardTitle>Weekly digest</CardTitle>
                  <CardDescription>A summary of your team's work every Monday.</CardDescription>
                  <CardAction><Switch defaultChecked aria-label="Weekly digest" /></CardAction>
                </CardHeader>
              </Card>
            ),
          },
          {
            label: 'activity',
            node: (
              <Card size="sm" className="w-64">
                <CardHeader className="border-b">
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {[
                    { icon: Message01Icon, text: '4 new comments', time: '2m' },
                    { icon: Attachment01Icon, text: '2 files added', time: '1h' },
                    { icon: Clock01Icon, text: 'Due date moved', time: '3h' },
                  ].map((row) => (
                    <div key={row.text} className="flex items-center gap-2">
                      <HugeiconsIcon icon={row.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                      <span className="flex-1 truncate">{row.text}</span>
                      <span className="text-muted-foreground text-[11px] tabular-nums">{row.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ),
          },
        ]}
      />

      <Playground
        title="PageHeader"
        description="size, heading level, description, actions and tabs"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: PAGE_HEADER_SIZES, initial: 'md' },
          { kind: 'select', name: 'as', label: 'Heading (as)', options: HEADING_LEVELS, initial: 'h2' },
          { kind: 'text', name: 'title', label: 'Title', initial: 'Projects' },
          { kind: 'switch', name: 'description', label: 'Description', initial: true },
          { kind: 'switch', name: 'actions', label: 'Actions', initial: true },
          { kind: 'switch', name: 'tabs', label: 'Tabs under it', initial: false },
        ]}
        render={(v) => (
          <DemoPageHeader
            size={str(v, 'size') as PageHeaderSize}
            as={str(v, 'as') as HeadingLevel}
            title={str(v, 'title') || 'Projects'}
            description={bool(v, 'description')}
            actions={bool(v, 'actions')}
            tabs={bool(v, 'tabs')}
          />
        )}
        code={pageHeaderCode}
      />

      <Variants
        title="PageHeader sizes"
        note="lg: a kit page, md: an app page, sm: a section inside a page"
        rows={{ name: 'size', values: PAGE_HEADER_SIZES }}
        render={(size) => (
          <PageHeader
            size={size}
            as="h3"
            title="Projects"
            description={PAGE_DESCRIPTION}
            actions={<Button size="sm" onClick={() => demoOnly('New project')}>New project</Button>}
            className="w-96"
          />
        )}
      />

      <Playground
        title="Panel"
        description="the kit's titled card. Clear the title for a plain box."
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Recent activity' },
          { kind: 'select', name: 'trailing', label: 'Right of the title', options: PANEL_TRAILING, initial: 'note' },
          { kind: 'text', name: 'body', label: 'Body', initial: '4 new comments and 2 files added since Monday.' },
        ]}
        render={(v) => {
          const trailing = str(v, 'trailing') as PanelTrailing
          return (
            <Panel
              title={str(v, 'title') || undefined}
              note={trailing === 'note' ? PANEL_NOTE : undefined}
              action={trailing === 'action' ? <PanelAction /> : undefined}
              className="w-full max-w-sm"
            >
              <p className="text-muted-foreground">{str(v, 'body') || 'Body'}</p>
            </Panel>
          )
        }}
        code={panelCode}
      />

      <Variants
        title="Separator"
        rows={{ name: 'orientation', values: ORIENTATIONS }}
        render={(orientation) => orientation === 'horizontal' ? (
          <div className="grid w-40 gap-2 text-xs">
            <span>Profile</span>
            <Separator />
            <span>Billing</span>
          </div>
        ) : (
          <div className="flex h-5 items-center gap-3 text-xs">
            <span>Issues</span>
            <Separator orientation="vertical" />
            <span>Projects</span>
          </div>
        )}
      />

      <Gallery
        title="Separator in use"
        items={[
          {
            label: 'with a label',
            node: (
              <div className="relative flex w-56 items-center justify-center">
                <Separator className="absolute inset-x-0 top-1/2" />
                <span className="bg-card text-muted-foreground relative px-2 text-[11px]">or</span>
              </div>
            ),
          },
          {
            label: 'metadata row',
            node: (
              <div className="text-muted-foreground flex h-4 items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" /> 2h ago
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
            ),
          },
          {
            label: 'list rows',
            node: (
              <div className="w-48 rounded-md border text-xs">
                {['Profile', 'Notifications', 'Billing'].map((item, i) => (
                  <Fragment key={item}>
                    {i > 0 && <Separator />}
                    <div className="px-2.5 py-1.5">{item}</div>
                  </Fragment>
                ))}
              </div>
            ),
          },
        ]}
      />
      <Playground
        title="ScrollArea"
        description="a box that scrolls on its own, with the kit's thin scrollbar"
        controls={[
          { kind: 'select', name: 'direction', label: 'Direction', options: SCROLL_DIRECTIONS, initial: 'vertical' },
          { kind: 'select', name: 'height', label: 'Height (className)', options: SCROLL_HEIGHTS, initial: 'h-48' },
        ]}
        render={(v) => <ScrollAreaDemo direction={str(v, 'direction') as (typeof SCROLL_DIRECTIONS)[number]} height={str(v, 'height')} />}
        code={scrollAreaCode}
      />
    </Demos>
  )
}
