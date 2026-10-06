import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, CheckmarkBadge01Icon, InboxIcon, Tag01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { DeltaBadge } from '@/components/delta-badge'
import { LabelChip, LabelDot } from '@/components/label-dot'
import { NoAssignee } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { StatusIcon, WORKFLOW_STATUS, type WorkflowStatus } from '@/components/status-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PropertyPill, type PropertyOption } from '@/blocks/form-dialog'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, unless, type Values } from './Playground'

const BADGE_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const

const BADGE_ICONS = ['none', 'start', 'end'] as const

const STATUSES = ['todo', 'progress', 'done', 'blocked'] as const

const STATUS_BADGE_VARIANTS = ['outline', 'secondary', 'ghost'] as const

const SAMPLE_LABELS = [
  { name: 'Fragile', colour: 'oklch(0.65 0.18 10)' },
  { name: 'Export', colour: 'oklch(0.62 0.15 250)' },
  { name: 'Key account', colour: 'oklch(0.6 0.17 300)' },
]

type BadgeVariant = (typeof BADGE_VARIANTS)[number]

type BadgeIcon = (typeof BADGE_ICONS)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)

const capitalise = (s: string) => s[0].toUpperCase() + s.slice(1)

const STATUS_DOT: Record<(typeof STATUSES)[number], { label: string; dot: string }> = {
  todo: { label: 'Todo', dot: 'bg-status-todo' },
  progress: { label: 'In progress', dot: 'bg-status-progress' },
  done: { label: 'Done', dot: 'bg-status-done' },
  blocked: { label: 'Blocked', dot: 'bg-status-blocked' },
}

// --- Badge ---------------------------------------------------------------

function DemoBadge({ variant, icon = 'none', link = false, children }: {
  variant: BadgeVariant
  icon?: BadgeIcon
  link?: boolean
  children: ReactNode
}) {
  const content = (
    <>
      {icon === 'start' && <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} data-icon="inline-start" />}
      {children}
      {icon === 'end' && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
    </>
  )
  if (!link) return <Badge variant={variant}>{content}</Badge>
  // The demo link goes nowhere, so a click must not move the page.
  return (
    <Badge variant={variant} asChild>
      <a href="#" onClick={(e) => e.preventDefault()}>{content}</a>
    </Badge>
  )
}

function badgeCode(v: Values) {
  const icon = str(v, 'icon')
  const iconName = icon === 'start' ? 'Tag01Icon' : icon === 'end' ? 'ArrowRight01Icon' : ''
  const iconTag = iconName ? `<HugeiconsIcon icon={${iconName}} strokeWidth={2} data-icon="inline-${icon}" />` : ''
  const head = imports({
    '@hugeicons/react': iconName ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': iconName ? [iconName] : [],
    '@/components/ui/badge': ['Badge'],
  })
  const kids = [icon === 'start' ? iconTag : '', str(v, 'label') || 'Badge', icon === 'end' ? iconTag : ''].filter(Boolean)
  const inner = kids.length === 1 ? kids[0] : kids
  const variant = orDefault(str(v, 'variant'))
  const body = bool(v, 'link')
    ? jsx('Badge', { variant, asChild: true }, jsx('a', { href: '/labels/feature' }, inner))
    : jsx('Badge', { variant }, inner)
  return `${head}\n\n${body}`
}

// --- StatusBadge ---------------------------------------------------------

const TONES = ['neutral', 'info', 'progress', 'success', 'warning', 'danger'] as const satisfies readonly Tone[]

const STATUS_BADGE_KINDS = ['soft', 'outline'] as const

type StatusBadgeKind = (typeof STATUS_BADGE_KINDS)[number]

// A status that reads right in each tone. Which status gets which tone is
// the app's choice; these are the usual ones.
const TONE_LABEL: Record<Tone, string> = {
  neutral: 'Draft',
  info: 'Sent',
  progress: 'In progress',
  success: 'Paid',
  warning: 'Awaiting approval',
  danger: 'Overdue',
}

function statusBadgeCode(v: Values) {
  const body = jsx('StatusBadge', {
    tone: unless(str(v, 'tone'), 'neutral'),
    variant: unless(str(v, 'variant'), 'soft'),
    dot: bool(v, 'dot') ? undefined : '{false}',
  }, str(v, 'label') || 'Status')
  return `${imports({ '@/components/status-badge': ['StatusBadge'] })}\n\n${body}`
}

// --- DeltaBadge ----------------------------------------------------------

const DELTA_DIRECTIONS = ['up', 'down'] as const

// auto leaves tone out, so it follows the direction: up good, down bad.
const DELTA_TONES = ['auto', 'positive', 'negative', 'warning', 'neutral'] as const

const DELTA_TEXT = { up: '+12.4%', down: '−3.1%' }

// --- LabelChip -----------------------------------------------------------

const LABEL_COLOURS = {
  rose: 'oklch(0.65 0.18 10)',
  blue: 'oklch(0.62 0.15 250)',
  violet: 'oklch(0.6 0.17 300)',
  green: 'oklch(0.64 0.15 155)',
  amber: 'oklch(0.7 0.14 65)',
} as const

const LABEL_COLOUR_NAMES = Object.keys(LABEL_COLOURS) as LabelColour[]

const CHIP_SIZES = ['sm', 'md'] as const

const CHIP_VARIANTS = ['outline', 'soft'] as const

type LabelColour = keyof typeof LABEL_COLOURS

type ChipSize = (typeof CHIP_SIZES)[number]

type ChipVariant = (typeof CHIP_VARIANTS)[number]

// Made-up labels for a product team's issues.
const ISSUE_LABELS = [
  { name: 'Bug', colour: LABEL_COLOURS.rose },
  { name: 'Feature', colour: LABEL_COLOURS.blue },
  { name: 'Customer request', colour: LABEL_COLOURS.violet },
]

const removed = (name: string) => () => toast(`Removed ${name}`, { description: 'Demo only.' })

// A labels field: soft chips inside an input, each with its ×.
function LabelsField() {
  const [labels, setLabels] = useState(ISSUE_LABELS)
  return (
    <div className="bg-input/20 dark:bg-input/30 flex min-h-7 w-60 flex-wrap items-center gap-1 rounded-md border px-1.5 py-1">
      {labels.map((l) => (
        <LabelChip key={l.name} {...l} variant="soft" onRemove={() => setLabels(labels.filter((x) => x !== l))} />
      ))}
      {labels.length === 0 && (
        <button type="button" className="text-muted-foreground px-1 text-[11px] hover:underline" onClick={() => setLabels(ISSUE_LABELS)}>
          Add them back
        </button>
      )}
    </div>
  )
}

const PILL_STATUSES: PropertyOption<WorkflowStatus>[] = (['todo', 'progress', 'done'] as const).map((s) => ({
  value: s,
  label: WORKFLOW_STATUS[s].label,
  icon: <StatusIcon status={s} />,
}))

// A record's properties in a row, as a quick create dialog shows them.
function PillsWithLabel() {
  const [status, setStatus] = useState<WorkflowStatus>('progress')
  return (
    <span className="flex items-center gap-1">
      <PropertyPill label="Status" value={status} options={PILL_STATUSES} onChange={setStatus} />
      <LabelChip name="Feature" colour={LABEL_COLOURS.blue} size="md" />
    </span>
  )
}

function labelChipCode(v: Values) {
  const body = jsx('LabelChip', {
    name: str(v, 'name') || 'Label',
    colour: LABEL_COLOURS[str(v, 'colour') as LabelColour],
    size: unless(str(v, 'size'), 'sm'),
    variant: unless(str(v, 'variant'), 'outline'),
    onRemove: bool(v, 'removable') ? '{() => removeLabel(label.id)}' : undefined,
  })
  return `${imports({ '@/components/label-dot': ['LabelChip'] })}\n\n${body}`
}

export default function BadgesDemos() {
  return (
    <Demos>
      <Playground
        title="Badge"
        description="variant, icon and rendering as a link"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: BADGE_VARIANTS, initial: 'default' },
          { kind: 'select', name: 'icon', label: 'Icon', options: BADGE_ICONS, initial: 'start' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Feature' },
          { kind: 'switch', name: 'link', label: 'Render as link', initial: false },
        ]}
        render={(v) => (
          <DemoBadge variant={str(v, 'variant') as BadgeVariant} icon={str(v, 'icon') as BadgeIcon} link={bool(v, 'link')}>
            {str(v, 'label') || 'Badge'}
          </DemoBadge>
        )}
        code={badgeCode}
      />

      <Variants
        title="Badge variants"
        rows={{ name: 'variant', values: BADGE_VARIANTS }}
        cols={{ name: 'icon', values: BADGE_ICONS }}
        render={(variant, icon) => <DemoBadge variant={variant} icon={icon}>{capitalise(variant)}</DemoBadge>}
      />

      <Variants
        title="Status badges"
        note="a dot in the status token colour"
        rows={{ name: 'status', values: STATUSES }}
        cols={{ name: 'variant', values: STATUS_BADGE_VARIANTS }}
        render={(status, variant) => (
          <Badge variant={variant}>
            <span data-icon="inline-start" className={cn('size-1.5 rounded-full', STATUS_DOT[status].dot)} />
            {STATUS_DOT[status].label}
          </Badge>
        )}
      />

      <Gallery
        title="Badge in use"
        note="Tab to the link badge to see its focus ring"
        items={[
          { label: 'count', node: <Badge variant="secondary" className="tabular-nums">24</Badge> },
          {
            label: 'count in a button',
            node: (
              <Button variant="outline">
                <HugeiconsIcon icon={InboxIcon} strokeWidth={2} data-icon="inline-start" />
                Inbox
                <Badge className="h-4 min-w-4 px-1 tabular-nums">3</Badge>
              </Button>
            ),
          },
          {
            label: 'icon only',
            node: (
              <Badge variant="secondary" className="size-5 p-0">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} />
                <span className="sr-only">Verified</span>
              </Badge>
            ),
          },
          { label: 'asChild link', node: <DemoBadge variant="outline" icon="end" link>Changelog</DemoBadge> },
          { label: 'aria-invalid', node: <Badge variant="outline" aria-invalid>Missing owner</Badge> },
          {
            label: 'truncated',
            node: (
              <Badge variant="outline" className="max-w-32">
                <span className="truncate">Customer onboarding and activation</span>
              </Badge>
            ),
          },
        ]}
      />

      <Playground
        title="StatusBadge"
        description="tone, variant and dot"
        controls={[
          { kind: 'select', name: 'tone', label: 'Tone', options: TONES, initial: 'warning' },
          { kind: 'select', name: 'variant', label: 'Variant', options: STATUS_BADGE_KINDS, initial: 'soft' },
          { kind: 'switch', name: 'dot', label: 'Dot', initial: true },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Awaiting approval' },
        ]}
        render={(v) => (
          <StatusBadge tone={str(v, 'tone') as Tone} variant={str(v, 'variant') as StatusBadgeKind} dot={bool(v, 'dot')}>
            {str(v, 'label') || 'Status'}
          </StatusBadge>
        )}
        code={statusBadgeCode}
      />

      <Variants
        title="StatusBadge tones"
        note="tone × variant. Outline keeps the tone in the dot only."
        rows={{ name: 'tone', values: TONES }}
        cols={{ name: 'variant', values: STATUS_BADGE_KINDS }}
        render={(tone, variant) => <StatusBadge tone={tone} variant={variant}>{TONE_LABEL[tone]}</StatusBadge>}
      />

      <Variants
        title="DeltaBadge"
        note="direction × tone. auto leaves tone out: up is good news, down bad."
        rows={{ name: 'direction', values: DELTA_DIRECTIONS }}
        cols={{ name: 'tone', values: DELTA_TONES }}
        render={(direction, tone) => (
          <DeltaBadge direction={direction} text={DELTA_TEXT[direction]} tone={tone === 'auto' ? undefined : tone} />
        )}
      />

      <Gallery
        title="LabelDot"
        note="a label's colour"
        items={[
          { label: 'LabelDot', node: <span className="flex gap-1.5">{SAMPLE_LABELS.map((l) => <LabelDot key={l.name} colour={l.colour} />)}</span> },
          { label: 'label chips', node: <span className="flex flex-wrap gap-1">{SAMPLE_LABELS.map((l) => <LabelChip key={l.name} {...l} />)}</span> },
          {
            label: 'in a list row',
            node: (
              <span className="flex h-8 w-72 max-w-full items-center gap-2 rounded-md border px-2 text-xs">
                <PriorityIcon priority="urgent" />
                <span className="text-muted-foreground tabular-nums">DO-24817</span>
                <StatusIcon status="progress" />
                <span className="min-w-0 flex-1 truncate">Deliver 12 pallets to Jurong</span>
                <LabelDot colour={SAMPLE_LABELS[0].colour} />
                <NoAssignee className="size-5" />
              </span>
            ),
          },
        ]}
      />

      <Playground
        title="LabelChip"
        description="A label as a pill: its dot and name, with an × when it can come off"
        controls={[
          { kind: 'text', name: 'name', label: 'Name', initial: 'Customer request' },
          { kind: 'select', name: 'colour', label: 'Colour', options: LABEL_COLOUR_NAMES, initial: 'violet' },
          { kind: 'select', name: 'size', label: 'Size', options: CHIP_SIZES, initial: 'sm' },
          { kind: 'select', name: 'variant', label: 'Variant', options: CHIP_VARIANTS, initial: 'outline' },
          { kind: 'switch', name: 'removable', label: 'Removable (onRemove)', initial: false },
        ]}
        render={(v) => {
          const name = str(v, 'name') || 'Label'
          return (
            <LabelChip
              name={name}
              colour={LABEL_COLOURS[str(v, 'colour') as LabelColour]}
              size={str(v, 'size') as ChipSize}
              variant={str(v, 'variant') as ChipVariant}
              onRemove={bool(v, 'removable') ? removed(name) : undefined}
            />
          )
        }}
        code={labelChipCode}
      />

      <Variants
        title="LabelChip variants"
        note="variant × size. sm on cards and rows, md beside 24px property pills."
        rows={{ name: 'variant', values: CHIP_VARIANTS }}
        cols={{ name: 'size', values: CHIP_SIZES }}
        render={(variant, size) => (
          <span className="flex gap-1">
            <LabelChip name="Bug" colour={LABEL_COLOURS.rose} variant={variant} size={size} />
            <LabelChip name="Feature" colour={LABEL_COLOURS.blue} variant={variant} size={size} onRemove={removed('Feature')} />
          </span>
        )}
      />

      <Gallery
        title="LabelChip in use"
        note="soft is for inside an input; outline everywhere else"
        items={[
          {
            label: 'on a card',
            node: (
              <div className="bg-card grid w-56 gap-2 rounded-md border p-2.5 text-xs shadow-xs">
                <span className="text-muted-foreground text-[11px] tabular-nums">ENG-142</span>
                <span className="font-medium">Invoices page shows the wrong tax rate</span>
                <span className="flex flex-wrap gap-1">
                  <LabelChip name="Bug" colour={LABEL_COLOURS.rose} />
                  <LabelChip name="Billing" colour={LABEL_COLOURS.amber} />
                </span>
              </div>
            ),
          },
          { label: 'a labels field (soft, removable)', node: <LabelsField /> },
          {
            label: 'beside property pills (md)',
            node: <PillsWithLabel />,
          },
          { label: 'long name truncates', node: <LabelChip name="Waiting on the customer's legal team" colour={LABEL_COLOURS.green} className="max-w-36" /> },
        ]}
      />
    </Demos>
  )
}
