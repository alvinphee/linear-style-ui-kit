import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowRight01Icon, ArrowTurnBackwardIcon, Calculator01Icon, CheckmarkBadge01Icon, CommandIcon, InboxIcon,
  PackageIcon, Search01Icon, Shield01Icon, ShoppingCart01Icon, Tag01Icon, Target02Icon, Tick02Icon, UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeltaBadge } from '@/components/delta-badge'
import { IconMark, LetterMark } from '@/components/mark'
import { Person, UserAvatar } from '@/components/person'
import { Sparkline } from '@/components/sparkline'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const BADGE_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const
const BADGE_ICONS = ['none', 'start', 'end'] as const
const STATUSES = ['todo', 'progress', 'done', 'blocked'] as const
const STATUS_BADGE_VARIANTS = ['outline', 'secondary', 'ghost'] as const
const AVATAR_SIZES = ['sm', 'default', 'lg'] as const
const AVATAR_FALLBACKS = ['initials', 'icon'] as const
const AVATAR_BADGES = ['none', 'online', 'verified'] as const
const PROGRESS_VALUES = ['0', '25', '50', '75', '100'] as const
const PROGRESS_TONES = ['default', 'success', 'warning', 'danger'] as const
const SKELETON_SHAPES = ['line', 'circle', 'card'] as const
const KBD_JOINERS = ['none', 'plus', 'then'] as const

type BadgeVariant = (typeof BADGE_VARIANTS)[number]
type BadgeIcon = (typeof BADGE_ICONS)[number]
type AvatarSize = (typeof AVATAR_SIZES)[number]
type AvatarFallbackKind = (typeof AVATAR_FALLBACKS)[number]
type AvatarBadgeKind = (typeof AVATAR_BADGES)[number]
type ProgressTone = (typeof PROGRESS_TONES)[number]
type SkeletonShape = (typeof SKELETON_SHAPES)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)
// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)
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

// --- Avatar --------------------------------------------------------------

const AVATAR_ICON_SIZE: Record<AvatarSize, string> = { sm: 'size-3.5', default: 'size-4', lg: 'size-5' }
const AVATAR_PEOPLE = ['AK', 'MR', 'JS', 'LT']

function DemoAvatar({ size = 'default', initials = 'AK', fallback = 'initials', badge = 'none' }: {
  size?: AvatarSize
  initials?: string
  fallback?: AvatarFallbackKind
  badge?: AvatarBadgeKind
}) {
  return (
    <Avatar size={size}>
      <AvatarFallback>
        {fallback === 'icon' ? <HugeiconsIcon icon={UserIcon} strokeWidth={2} className={AVATAR_ICON_SIZE[size]} /> : initials}
      </AvatarFallback>
      {badge === 'online' && (
        <AvatarBadge className="bg-chart-4">
          <span className="sr-only">Online</span>
        </AvatarBadge>
      )}
      {badge === 'verified' && (
        <AvatarBadge>
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
          <span className="sr-only">Verified</span>
        </AvatarBadge>
      )}
    </Avatar>
  )
}

const avatarInitials = (v: Values) => str(v, 'initials').trim().slice(0, 2).toUpperCase() || 'AK'

function avatarCode(v: Values) {
  const size = str(v, 'size') as AvatarSize
  const icon = str(v, 'fallback') === 'icon'
  const badge = str(v, 'badge')
  const icons = [icon ? 'UserIcon' : '', badge === 'verified' ? 'Tick02Icon' : ''].filter(Boolean)
  const head = imports({
    '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
    '@hugeicons/core-free-icons': icons,
    '@/components/ui/avatar': ['Avatar', ...(badge === 'none' ? [] : ['AvatarBadge']), 'AvatarFallback'],
  })
  const fallback = jsx('AvatarFallback', {}, icon
    ? `<HugeiconsIcon icon={UserIcon} strokeWidth={2} className="${AVATAR_ICON_SIZE[size]}" />`
    : avatarInitials(v))
  const badgeTag = badge === 'online'
    ? jsx('AvatarBadge', { className: 'bg-chart-4' }, '<span className="sr-only">Online</span>')
    : badge === 'verified'
      ? jsx('AvatarBadge', {}, ['<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />', '<span className="sr-only">Verified</span>'])
      : ''
  return `${head}\n\n${jsx('Avatar', { size: orDefault(size) }, [fallback, badgeTag])}`
}

// --- UserAvatar and Person -----------------------------------------------

const PERSON_KINDS = ['Person', 'UserAvatar'] as const
// default is the component's own size: size-6 alone, size-5 beside a name.
const PERSON_SIZES = ['default', 'size-4', 'size-5', 'size-6', 'size-8'] as const

type PersonKind = (typeof PERSON_KINDS)[number]
type PersonSize = (typeof PERSON_SIZES)[number]

const sizeClass = (size: string) => (size === 'default' ? undefined : size)

function DemoPerson({ kind, name, size }: { kind: PersonKind; name: string; size: PersonSize }) {
  if (kind === 'UserAvatar') return <UserAvatar name={name} className={sizeClass(size)} />
  return <Person name={name} avatarClassName={sizeClass(size)} />
}

function personCode(v: Values) {
  const kind = str(v, 'kind') as PersonKind
  // jsx() drops empty strings, so an empty name is written as an expression.
  const name = str(v, 'name') || "{''}"
  const size = sizeClass(str(v, 'size'))
  const body = kind === 'UserAvatar'
    ? jsx('UserAvatar', { name, className: size })
    : jsx('Person', { name, avatarClassName: size })
  return `${imports({ '@/components/person': [kind] })}\n\n${body}`
}

// --- LetterMark and IconMark ---------------------------------------------

// The hues the kit's workspaces and ERP modules use, plus the theme accent.
const MARK_COLOURS = {
  indigo: 'oklch(0.6 0.17 265)',
  green: 'oklch(0.64 0.15 155)',
  amber: 'oklch(0.7 0.14 65)',
  orange: 'oklch(0.64 0.16 35)',
  teal: 'oklch(0.62 0.12 200)',
  pink: 'oklch(0.64 0.16 340)',
  grey: 'oklch(0.55 0.02 260)',
  brand: 'var(--brand)',
} as const
const MARK_COLOUR_NAMES = Object.keys(MARK_COLOURS) as MarkColour[]
const LETTER_MARK_SIZES = ['xs', 'sm', 'md', 'lg'] as const
const ICON_MARK_SIZES = ['sm', 'md', 'lg'] as const
const MARK_KINDS = ['LetterMark', 'IconMark'] as const
const MARK_ICONS: Record<string, IconSvgElement> = {
  Target02Icon, ShoppingCart01Icon, PackageIcon, Calculator01Icon, UserGroupIcon, Shield01Icon,
}

type MarkColour = keyof typeof MARK_COLOURS
type LetterMarkSize = (typeof LETTER_MARK_SIZES)[number]
type IconMarkSize = (typeof ICON_MARK_SIZES)[number]

const markColour = (v: Values) => MARK_COLOURS[str(v, 'colour') as MarkColour]
const markLetters = (v: Values) => str(v, 'text').trim().slice(0, 3) || 'AT'

// --- Progress ------------------------------------------------------------

// Progress has no tone prop: these recolour its indicator from the root.
const PROGRESS_TONE: Record<ProgressTone, string> = {
  default: '',
  success: '*:data-[slot=progress-indicator]:bg-chart-4',
  warning: '*:data-[slot=progress-indicator]:bg-status-progress',
  danger: '*:data-[slot=progress-indicator]:bg-destructive',
}

function LiveProgress() {
  const [value, setValue] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => setValue((p) => (p >= 100 ? 10 : p + 15)), 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid w-40 gap-1.5">
      <span className="text-muted-foreground text-[11px] tabular-nums">Syncing… {value}%</span>
      <Progress value={value} aria-label="Syncing" />
    </div>
  )
}

// --- Sparkline -----------------------------------------------------------

// Ten points of this period and the one before. Made up and fixed.
const SPARK_UP = [12, 14, 13, 17, 16, 19, 22, 21, 24, 27]
const SPARK_DOWN = [27, 25, 26, 22, 23, 19, 18, 19, 15, 13]
const SPARK_FLAT = [18, 19, 17, 18, 20, 19, 18, 19, 18, 19]
const SPARK_PREVIOUS = [15, 16, 15, 17, 18, 17, 19, 18, 19, 20]

// --- Skeleton ------------------------------------------------------------

function SkeletonShapeDemo({ shape, pulse }: { shape: SkeletonShape; pulse: boolean }) {
  const still = pulse ? undefined : 'animate-none'
  if (shape === 'line') return <Skeleton className={cn('h-3 w-48', still)} />
  if (shape === 'circle') return <Skeleton className={cn('size-10 rounded-full', still)} />
  return (
    <div className="grid w-56 gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className={cn('size-8 rounded-full', still)} />
        <div className="grid flex-1 gap-1.5">
          <Skeleton className={cn('h-3 w-24', still)} />
          <Skeleton className={cn('h-2.5 w-16', still)} />
        </div>
      </div>
      <Skeleton className={cn('h-20', still)} />
    </div>
  )
}

function skeletonCode(v: Values) {
  const still = bool(v, 'pulse') ? '' : ' animate-none'
  const sk = (className: string) => jsx('Skeleton', { className: className + still })
  const shape = str(v, 'shape')
  const body = shape === 'line'
    ? sk('h-3 w-48')
    : shape === 'circle'
      ? sk('size-10 rounded-full')
      : jsx('div', { className: 'grid w-56 gap-3 rounded-lg border p-3' }, [
        jsx('div', { className: 'flex items-center gap-2.5' }, [
          sk('size-8 rounded-full'),
          jsx('div', { className: 'grid flex-1 gap-1.5' }, [sk('h-3 w-24'), sk('h-2.5 w-16')]),
        ]),
        sk('h-20'),
      ])
  return `${imports({ '@/components/ui/skeleton': ['Skeleton'] })}\n\n${body}`
}

// --- Kbd -----------------------------------------------------------------

const JOINER_TEXT: Record<string, string> = { plus: '+', then: 'then' }
const splitKeys = (keys: string) => keys.split(/[\s+]+/).filter(Boolean)

function KeyCombo({ keys, joiner }: { keys: string[]; joiner: string }) {
  if (keys.length < 2) return <Kbd>{keys[0] ?? 'K'}</Kbd>
  const sep = JOINER_TEXT[joiner]
  return (
    <KbdGroup>
      {keys.map((key, i) => (
        <Fragment key={i}>
          {i > 0 && sep && <span className="text-muted-foreground text-[11px]">{sep}</span>}
          <Kbd>{key}</Kbd>
        </Fragment>
      ))}
    </KbdGroup>
  )
}

function kbdCode(v: Values) {
  const keys = splitKeys(str(v, 'keys'))
  if (keys.length < 2) return `${imports({ '@/components/ui/kbd': ['Kbd'] })}\n\n${jsx('Kbd', {}, keys[0] ?? 'K')}`
  const sep = JOINER_TEXT[str(v, 'joiner')]
  const kids = keys.flatMap((key, i) => [
    i > 0 && sep ? `<span className="text-muted-foreground text-[11px]">${sep}</span>` : '',
    `<Kbd>${key}</Kbd>`,
  ])
  return `${imports({ '@/components/ui/kbd': ['Kbd', 'KbdGroup'] })}\n\n${jsx('KbdGroup', {}, kids)}`
}

export default function StatusDemos() {
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

      <Playground
        title="Avatar"
        description="size, fallback and badge (no images)"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: AVATAR_SIZES, initial: 'default' },
          { kind: 'select', name: 'fallback', label: 'Fallback', options: AVATAR_FALLBACKS, initial: 'initials' },
          { kind: 'text', name: 'initials', label: 'Initials', initial: 'AK' },
          { kind: 'select', name: 'badge', label: 'Badge', options: AVATAR_BADGES, initial: 'online' },
        ]}
        render={(v) => (
          <DemoAvatar
            size={str(v, 'size') as AvatarSize}
            fallback={str(v, 'fallback') as AvatarFallbackKind}
            initials={avatarInitials(v)}
            badge={str(v, 'badge') as AvatarBadgeKind}
          />
        )}
        code={avatarCode}
      />

      <Variants
        title="Avatar sizes"
        note="size × badge. At sm the badge hides its icon."
        rows={{ name: 'size', values: AVATAR_SIZES }}
        cols={{ name: 'badge', values: AVATAR_BADGES }}
        render={(size, badge) => <DemoAvatar size={size} badge={badge} />}
      />

      <Variants
        title="Avatar group"
        note="AvatarGroupCount follows the avatars' size"
        rows={{ name: 'size', values: AVATAR_SIZES }}
        render={(size) => (
          <AvatarGroup>
            {AVATAR_PEOPLE.map((initials) => (
              <Avatar key={initials} size={size}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        )}
      />

      <Gallery
        title="Avatar in use"
        note='For other sizes keep size="default" and pass a size-* class'
        items={[
          { label: 'initials', node: <DemoAvatar /> },
          { label: 'icon fallback', node: <DemoAvatar fallback="icon" /> },
          {
            label: 'brand tint',
            node: (
              <Avatar>
                <AvatarFallback className="bg-brand/15 text-brand">AK</AvatarFallback>
              </Avatar>
            ),
          },
          {
            label: 'size-5 class',
            node: (
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">AK</AvatarFallback>
              </Avatar>
            ),
          },
          {
            label: 'with name',
            node: (
              <div className="flex items-center gap-2">
                <DemoAvatar size="sm" initials="MR" badge="online" />
                <div className="grid text-xs leading-tight">
                  <span className="font-medium">Maya Ross</span>
                  <span className="text-muted-foreground text-[11px]">Product designer</span>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Playground
        title="Person"
        description="UserAvatar, or the avatar with the name. Clear the name for the dash."
        controls={[
          { kind: 'select', name: 'kind', label: 'Component', options: PERSON_KINDS, initial: 'Person' },
          { kind: 'text', name: 'name', label: 'Name', initial: 'Maya Ross' },
          { kind: 'select', name: 'size', label: 'Avatar size (className)', options: PERSON_SIZES, initial: 'default' },
        ]}
        render={(v) => (
          // A cell-sized box, so a long name truncates the way it does in a table.
          <div className="flex max-w-48 min-w-0">
            <DemoPerson kind={str(v, 'kind') as PersonKind} name={str(v, 'name')} size={str(v, 'size') as PersonSize} />
          </div>
        )}
        code={personCode}
      />

      <Variants
        title="Person sizes"
        note="size class × component. Person passes it as avatarClassName."
        rows={{ name: 'size', values: PERSON_SIZES }}
        cols={{ name: 'component', values: PERSON_KINDS }}
        render={(size, kind = 'Person') => <DemoPerson kind={kind} name="Maya Ross" size={size} />}
      />

      <Playground
        title="LetterMark"
        description="letters on a solid colour, for a workspace, company or team"
        controls={[
          { kind: 'text', name: 'text', label: 'Letters (up to 3)', initial: 'AT' },
          { kind: 'select', name: 'colour', label: 'Colour', options: MARK_COLOUR_NAMES, initial: 'indigo' },
          { kind: 'select', name: 'size', label: 'Size', options: LETTER_MARK_SIZES, initial: 'md' },
        ]}
        render={(v) => <LetterMark text={markLetters(v)} colour={markColour(v)} size={str(v, 'size') as LetterMarkSize} />}
        code={(v) => `${imports({ '@/components/mark': ['LetterMark'] })}\n\n${jsx('LetterMark', {
          text: markLetters(v),
          colour: markColour(v),
          size: unless(str(v, 'size'), 'sm'),
        })}`}
      />

      <Playground
        title="IconMark"
        description="an icon on a tint of a colour, for a module or app"
        controls={[
          { kind: 'select', name: 'icon', label: 'Icon', options: Object.keys(MARK_ICONS), initial: 'Target02Icon' },
          { kind: 'select', name: 'colour', label: 'Colour', options: MARK_COLOUR_NAMES, initial: 'indigo' },
          { kind: 'select', name: 'size', label: 'Size', options: ICON_MARK_SIZES, initial: 'md' },
        ]}
        render={(v) => <IconMark icon={MARK_ICONS[str(v, 'icon')]} colour={markColour(v)} size={str(v, 'size') as IconMarkSize} />}
        code={(v) => `${imports({
          '@hugeicons/core-free-icons': [str(v, 'icon')],
          '@/components/mark': ['IconMark'],
        })}\n\n${jsx('IconMark', {
          icon: `{${str(v, 'icon')}}`,
          colour: markColour(v),
          size: unless(str(v, 'size'), 'md'),
        })}`}
      />

      <Variants
        title="Mark sizes"
        note="size × component. IconMark has no xs."
        rows={{ name: 'size', values: LETTER_MARK_SIZES }}
        cols={{ name: 'component', values: MARK_KINDS }}
        render={(size, kind) => {
          if (kind === 'LetterMark') return <LetterMark text="AT" colour={MARK_COLOURS.indigo} size={size} />
          if (size === 'xs') return <span className="text-muted-foreground text-[11px]">—</span>
          return <IconMark icon={Target02Icon} colour={MARK_COLOURS.indigo} size={size} />
        }}
      />

      <Playground
        title="Progress"
        description="value, tone and label"
        controls={[
          { kind: 'select', name: 'value', label: 'Value', options: PROGRESS_VALUES, initial: '50' },
          { kind: 'select', name: 'tone', label: 'Tone (className)', options: PROGRESS_TONES, initial: 'default' },
          { kind: 'switch', name: 'showLabel', label: 'Show label', initial: true },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Uploading files' },
        ]}
        render={(v) => {
          const value = Number(str(v, 'value'))
          const label = str(v, 'label') || 'Progress'
          return (
            <div className="grid w-full max-w-xs gap-1.5">
              {bool(v, 'showLabel') && (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="truncate">{label}</span>
                  <span className="text-muted-foreground tabular-nums">{value}%</span>
                </div>
              )}
              <Progress value={value} aria-label={label} className={PROGRESS_TONE[str(v, 'tone') as ProgressTone]} />
            </div>
          )
        }}
        code={(v) => {
          const value = Number(str(v, 'value'))
          const label = str(v, 'label') || 'Progress'
          const bar = jsx('Progress', { value, 'aria-label': label, className: PROGRESS_TONE[str(v, 'tone') as ProgressTone] })
          const body = bool(v, 'showLabel')
            ? jsx('div', { className: 'grid gap-1.5' }, [
              jsx('div', { className: 'flex justify-between text-xs' }, [
                `<span>${label}</span>`,
                `<span className="text-muted-foreground tabular-nums">${value}%</span>`,
              ]),
              bar,
            ])
            : bar
          return `${imports({ '@/components/ui/progress': ['Progress'] })}\n\n${body}`
        }}
      />

      <Variants
        title="Progress values"
        rows={{ name: 'value', values: PROGRESS_VALUES }}
        cols={{ name: 'tone', values: PROGRESS_TONES }}
        render={(value, tone = 'default') => (
          <Progress value={Number(value)} aria-label={`${tone} ${value}%`} className={cn('w-28', PROGRESS_TONE[tone])} />
        )}
      />

      <Gallery
        title="Progress in use"
        note="Height comes from a class, h-1 by default"
        items={[
          { label: 'h-0.5', node: <Progress value={60} aria-label="Thin" className="h-0.5 w-40" /> },
          { label: 'h-1', node: <Progress value={60} aria-label="Default" className="w-40" /> },
          { label: 'h-2', node: <Progress value={60} aria-label="Thick" className="h-2 w-40" /> },
          {
            label: 'steps',
            node: (
              <div className="flex w-40 gap-1">
                {[100, 100, 40, 0].map((value, i) => (
                  <Progress key={i} value={value} aria-label={`Step ${i + 1} of 4`} className="flex-1" />
                ))}
              </div>
            ),
          },
          { label: 'live', node: <LiveProgress /> },
        ]}
      />

      <Gallery
        title="Sparkline"
        note="The dashed line is the period before. Decorative: keep the number beside it."
        items={[
          { label: 'tone="positive"', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} /> },
          { label: 'no previous', node: <Sparkline data={SPARK_UP} /> },
          { label: 'tone="negative"', node: <Sparkline data={SPARK_DOWN} previous={SPARK_PREVIOUS} tone="negative" /> },
          { label: 'tone="warning"', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} tone="warning" /> },
          { label: 'tone="neutral"', node: <Sparkline data={SPARK_FLAT} previous={SPARK_PREVIOUS} tone="neutral" /> },
          { label: 'h-12 w-40', node: <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} className="h-12 w-40" /> },
          {
            label: 'beside its number',
            node: (
              <div className="flex items-end gap-3">
                <div className="grid gap-0.5">
                  <span className="text-muted-foreground text-[11px]">Open pipeline</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-base font-semibold tabular-nums">$48.2k</span>
                    <DeltaBadge direction="up" text="+12.4%" />
                  </span>
                </div>
                <Sparkline data={SPARK_UP} previous={SPARK_PREVIOUS} />
              </div>
            ),
          },
        ]}
      />

      <Playground
        title="Skeleton"
        description="shape comes from size and rounding classes"
        controls={[
          { kind: 'select', name: 'shape', label: 'Shape', options: SKELETON_SHAPES, initial: 'card' },
          { kind: 'switch', name: 'pulse', label: 'Pulse', initial: true },
        ]}
        render={(v) => <SkeletonShapeDemo shape={str(v, 'shape') as SkeletonShape} pulse={bool(v, 'pulse')} />}
        code={skeletonCode}
      />

      <Gallery
        title="Loading layouts"
        note="Skeletons shaped like the content they stand in for"
        items={[
          {
            label: 'list row',
            node: (
              <div className="flex w-56 items-center gap-2.5">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            ),
          },
          {
            label: 'paragraph',
            node: (
              <div className="grid w-48 gap-1.5">
                <Skeleton className="h-3" />
                <Skeleton className="h-3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ),
          },
          {
            label: 'stat',
            node: (
              <div className="grid w-32 gap-2 rounded-lg border p-3">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ),
          },
          {
            label: 'form',
            node: (
              <div className="flex w-56 gap-2">
                <Skeleton className="h-7 flex-1" />
                <Skeleton className="h-7 w-16" />
              </div>
            ),
          },
        ]}
      />

      <Playground
        title="Kbd"
        description="keys split on + or space"
        controls={[
          { kind: 'text', name: 'keys', label: 'Keys', initial: 'Ctrl+K' },
          { kind: 'select', name: 'joiner', label: 'Between keys', options: KBD_JOINERS, initial: 'none' },
        ]}
        render={(v) => <KeyCombo keys={splitKeys(str(v, 'keys'))} joiner={str(v, 'joiner')} />}
        code={kbdCode}
      />

      <Gallery
        title="Kbd in use"
        note="Hover or focus the inbox button for the tooltip"
        items={[
          { label: 'single key', node: <Kbd>C</Kbd> },
          {
            label: 'modifier icon',
            node: (
              <KbdGroup>
                <Kbd>
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
                  <span className="sr-only">Command</span>
                </Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            ),
          },
          {
            label: 'icon and text',
            node: (
              <Kbd>
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
                Enter
              </Kbd>
            ),
          },
          {
            label: 'sequence',
            node: (
              <KbdGroup>
                <Kbd>G</Kbd>
                <span className="text-muted-foreground text-[11px]">then</span>
                <Kbd>I</Kbd>
              </KbdGroup>
            ),
          },
          {
            label: 'in a button',
            node: (
              <Button variant="outline" aria-keyshortcuts="Control+K">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} data-icon="inline-start" />
                Search
                <Kbd className="ml-1">Ctrl K</Kbd>
              </Button>
            ),
          },
          {
            label: 'in a tooltip',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Inbox">
                    <HugeiconsIcon icon={InboxIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Go to inbox
                  <KbdGroup>
                    <Kbd>G</Kbd>
                    <Kbd>I</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />
    </Demos>
  )
}
