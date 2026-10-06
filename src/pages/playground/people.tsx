import { type MouseEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Calculator01Icon, PackageIcon, Shield01Icon, ShoppingCart01Icon, Target02Icon, Tick02Icon, UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { IconMark, LetterMark } from '@/components/mark'
import { Mention } from '@/components/mention'
import { NoAssignee, Person, UserAvatar } from '@/components/person'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, unless, type Values } from './Playground'

const AVATAR_SIZES = ['sm', 'default', 'lg'] as const

const AVATAR_FALLBACKS = ['initials', 'icon'] as const

const AVATAR_BADGES = ['none', 'online', 'verified'] as const

type AvatarSize = (typeof AVATAR_SIZES)[number]

type AvatarFallbackKind = (typeof AVATAR_FALLBACKS)[number]

type AvatarBadgeKind = (typeof AVATAR_BADGES)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)

// --- Avatar --------------------------------------------------------------

const AVATAR_ICON_SIZE: Record<AvatarSize, string> = { sm: 'size-3.5', default: 'size-4', lg: 'size-5' }

const AVATAR_PEOPLE = ['AK', 'MR', 'JS', 'LT']

// --- Mention -------------------------------------------------------------

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

function mentionCode(v: Values) {
  const text = str(v, 'text') || '@maya'
  const mention = bool(v, 'link') ? jsx('Mention', { href: '/people/maya' }, text) : jsx('Mention', {}, text)
  return `${imports({ '@/components/mention': ['Mention'] })}\n\n${jsx('p', {}, [
    `Thanks ${mention}, can you check the pricing copy before Friday?`,
  ])}`
}

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

export default function PeopleDemos() {
  return (
    <Demos>
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

      <Gallery
        title="NoAssignee"
        note="the avatar for nobody"
        items={[
          { label: 'NoAssignee', node: <NoAssignee className="size-6" /> },
          {
            label: 'beside UserAvatar',
            node: (
              <span className="flex items-center gap-1.5">
                <UserAvatar name="Maya Ross" className="size-6" />
                <NoAssignee className="size-6" />
              </span>
            ),
          },
        ]}
      />

      <Playground
        title="Mention"
        description="An @name or /command inside text. With href it is a link."
        controls={[
          { kind: 'text', name: 'text', label: 'Text', initial: '@maya' },
          { kind: 'switch', name: 'link', label: 'Link (href)', initial: false },
        ]}
        render={(v) => {
          const text = str(v, 'text') || '@maya'
          return (
            <p className="max-w-xs text-xs/relaxed">
              Thanks {bool(v, 'link') ? <Mention href="#" onClick={stay}>{text}</Mention> : <Mention>{text}</Mention>}, can
              you check the pricing copy before Friday?
            </p>
          )
        }}
        code={mentionCode}
      />

      <Gallery
        title="Mention in use"
        note="Extra props and the ref go onto the link, so it can open a hover card"
        items={[
          {
            label: 'in a comment',
            node: (
              <div className="flex max-w-64 gap-2 text-xs/relaxed">
                <UserAvatar name="Sam Lee" className="mt-0.5" />
                <p><Mention>@maya</Mention> the new onboarding emails are ready for review.</p>
              </div>
            ),
          },
          { label: 'a /command', node: <p className="text-xs"><Mention>/summarise</Mention> this thread for the weekly update</p> },
          { label: 'a record link', node: <p className="text-xs">Blocked by <Mention href="#" onClick={stay}>ENG-142</Mention></p> },
          {
            label: 'opening a hover card',
            node: (
              <p className="text-xs">
                Assigned to{' '}
                <HoverCard openDelay={150}>
                  <HoverCardTrigger asChild>
                    <Mention href="#" onClick={stay}>@maya</Mention>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-56">
                    <Person name="Maya Ross" avatarClassName="size-7" className="text-[13px] font-medium" />
                    <p className="text-muted-foreground mt-1.5 text-[11px]">Product designer · Growth team</p>
                  </HoverCardContent>
                </HoverCard>
              </p>
            ),
          },
        ]}
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
    </Demos>
  )
}
