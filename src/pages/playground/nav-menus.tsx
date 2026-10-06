import { useState, type MouseEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Activity01Icon, Add01Icon, Analytics01Icon, ArrowUpRight01Icon, BookOpen01Icon, CubeIcon, Home01Icon, InboxIcon,
  News01Icon, PackageIcon, Settings01Icon, ShoppingCart01Icon, StarIcon, Target02Icon, Task01Icon, UserCircleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { slug } from '@/lib/text'
import { IconAction } from '@/components/icon-action'
import { IconMark, LetterMark } from '@/components/mark'
import { NavGroup, NavHeading, NavItem } from '@/components/nav-item'
import { Shortcut } from '@/components/shortcut'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Demos, Gallery, Playground, bool, element, imports, indent, jsx, lit, str } from './Playground'

// jsx() quotes every string, so a value written as '{…}' is turned back into an expression.
const expr = (snippet: string) => snippet.replace(/="\{([^"]*)\}"/g, '={$1}')

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

/* Navigation menu */

const PRODUCT: { title: string; description: string; icon: IconSvgElement; iconName: string }[] = [
  { title: 'Issues', description: 'Track bugs and tasks.', icon: Task01Icon, iconName: 'Task01Icon' },
  { title: 'Projects', description: 'Group work toward a goal.', icon: Target02Icon, iconName: 'Target02Icon' },
  { title: 'Insights', description: 'Charts across teams.', icon: Analytics01Icon, iconName: 'Analytics01Icon' },
]

const RESOURCES: { title: string; icon: IconSvgElement; iconName: string }[] = [
  { title: 'Docs', icon: BookOpen01Icon, iconName: 'BookOpen01Icon' },
  { title: 'Changelog', icon: News01Icon, iconName: 'News01Icon' },
  { title: 'Community', icon: UserGroupIcon, iconName: 'UserGroupIcon' },
]

// Narrow screens: the panel must fit beside the page gutters.
const PANEL = 'grid w-64 max-w-[calc(100vw-7rem)] gap-0.5'

const openDemo = (title: string) => (e: MouseEvent) => {
  e.preventDefault()
  toast(title, { description: 'Demo link' })
}

function NavigationMenuDemos() {
  return (
    <Playground
      title="Navigation menu"
      description="Hover or click Product and Resources"
      previewClassName="min-h-72 items-start"
      controls={[
        { kind: 'switch', name: 'icons', label: 'Icons', initial: true },
        { kind: 'switch', name: 'descriptions', label: 'Descriptions', initial: true },
      ]}
      render={(v) => {
        const icons = bool(v, 'icons')
        const descriptions = bool(v, 'descriptions')
        return (
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-7">Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className={PANEL}>
                    {PRODUCT.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink href="#" onClick={openDemo(item.title)} className="items-start">
                          {icons && <HugeiconsIcon icon={item.icon} strokeWidth={2} className="text-muted-foreground mt-0.5" />}
                          <span className="grid gap-0.5">
                            <span className="font-medium">{item.title}</span>
                            {descriptions && <span className="text-muted-foreground">{item.description}</span>}
                          </span>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-7">Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className={PANEL}>
                    {RESOURCES.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink href="#" onClick={openDemo(item.title)}>
                          {icons && <HugeiconsIcon icon={item.icon} strokeWidth={2} className="text-muted-foreground" />}
                          {item.title}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#" onClick={openDemo('Pricing')} className={cn(navigationMenuTriggerStyle(), 'h-7')}>
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )
      }}
      code={(v) => {
        const icons = bool(v, 'icons')
        const descriptions = bool(v, 'descriptions')
        const head = imports({
          '@hugeicons/react': icons ? ['HugeiconsIcon'] : [],
          '@hugeicons/core-free-icons': icons ? [...PRODUCT, ...RESOURCES].map((i) => i.iconName) : [],
          cn: ['cn'],
          '@/components/ui/navigation-menu': [
            'NavigationMenu', 'NavigationMenuContent', 'NavigationMenuItem', 'NavigationMenuLink', 'NavigationMenuList',
            'NavigationMenuTrigger', 'navigationMenuTriggerStyle',
          ],
        })
        const href = (title: string) => `/${title.toLowerCase()}`
        const product = PRODUCT.map((item) => jsx('li', {}, jsx('NavigationMenuLink', { href: href(item.title), className: 'items-start' }, [
          icons ? `<HugeiconsIcon icon={${item.iconName}} strokeWidth={2} className="text-muted-foreground mt-0.5" />` : '',
          jsx('span', { className: 'grid gap-0.5' }, [
            `<span className="font-medium">${item.title}</span>`,
            descriptions ? `<span className="text-muted-foreground">${item.description}</span>` : '',
          ]),
        ])))
        const resources = RESOURCES.map((item) => jsx('li', {}, jsx('NavigationMenuLink', { href: href(item.title) }, [
          icons ? `<HugeiconsIcon icon={${item.iconName}} strokeWidth={2} className="text-muted-foreground" />` : '',
          item.title,
        ])))
        const body = jsx('NavigationMenu', {}, jsx('NavigationMenuList', {}, [
          jsx('NavigationMenuItem', {}, [
            '<NavigationMenuTrigger className="h-7">Product</NavigationMenuTrigger>',
            jsx('NavigationMenuContent', {}, jsx('ul', { className: PANEL }, product)),
          ]),
          jsx('NavigationMenuItem', {}, [
            '<NavigationMenuTrigger className="h-7">Resources</NavigationMenuTrigger>',
            jsx('NavigationMenuContent', {}, jsx('ul', { className: PANEL }, resources)),
          ]),
          jsx('NavigationMenuItem', {}, jsx('NavigationMenuLink', { href: '/pricing', className: '{cn(navigationMenuTriggerStyle(), \'h-7\')}' }, 'Pricing')),
        ]))
        return `${head}\n\n${expr(body)}`
      }}
    />
  )
}

/* Sidebar navigation: NavItem, NavHeading and NavGroup */

const NAV_LEADS = ['icon', 'LetterMark', 'IconMark'] as const

const NAV_COUNTS = ['none', '3', '12', '128'] as const

// row: a sidebar row. iconOnly: a sidebar folded to icons. rail: a navigation rail.
const NAV_SHAPES = ['row', 'iconOnly', 'rail'] as const

const NAV_EXPANDED = ['none', 'open', 'folded'] as const

type NavLead = (typeof NAV_LEADS)[number]

type NavShape = (typeof NAV_SHAPES)[number]

type NavExpanded = (typeof NAV_EXPANDED)[number]

// Three of the kit's team and module colours.
const MARK_COLOUR = { indigo: 'oklch(0.6 0.17 265)', green: 'oklch(0.64 0.15 155)', amber: 'oklch(0.7 0.14 65)' }

// The demo rows go nowhere.
const noop = () => {}

const lettersOf = (label: string) => label.trim().slice(0, 2).toUpperCase()

// The sidebar's own background, where the hover and active colours are meant to be seen.
const SIDEBAR_BOX = 'bg-sidebar text-sidebar-foreground grid gap-px rounded-lg border p-2'

// A navigation rail: a narrow column of square icon buttons. Its side padding
// leaves room for the active bar beside the button.
const RAIL_BOX = 'bg-sidebar text-sidebar-foreground flex w-12 flex-col items-center gap-1 rounded-lg border py-2'

const NAV_SHAPE_BOX: Record<NavShape, string> = { row: cn(SIDEBAR_BOX, 'w-56'), iconOnly: cn(SIDEBAR_BOX, 'w-11'), rail: RAIL_BOX }

const EXPANDED: Record<NavExpanded, boolean | undefined> = { none: undefined, open: true, folded: false }

// Rows of the same kind around the one being tried, so the active row has
// something to stand out from.
const NAV_NEIGHBOURS: Record<NavLead, { label: string; icon?: IconSvgElement; mark?: ReactNode }[]> = {
  icon: [
    { label: 'My issues', icon: UserCircleIcon },
    { label: 'Projects', icon: CubeIcon },
  ],
  LetterMark: [
    { label: 'Design', mark: <LetterMark text="DE" colour={MARK_COLOUR.green} size="xs" /> },
    { label: 'Operations', mark: <LetterMark text="OP" colour={MARK_COLOUR.amber} size="xs" /> },
  ],
  IconMark: [
    { label: 'Sales', mark: <IconMark icon={ShoppingCart01Icon} colour={MARK_COLOUR.green} size="sm" /> },
    { label: 'Inventory', mark: <IconMark icon={PackageIcon} colour={MARK_COLOUR.amber} size="sm" /> },
  ],
}

function navLead(lead: NavLead, label: string): { icon?: IconSvgElement; mark?: ReactNode } {
  if (lead === 'LetterMark') return { mark: <LetterMark text={lettersOf(label)} colour={MARK_COLOUR.indigo} size="xs" /> }
  if (lead === 'IconMark') return { mark: <IconMark icon={Target02Icon} colour={MARK_COLOUR.indigo} size="sm" /> }
  return { icon: InboxIcon }
}

const TEAMS = [
  { label: 'Engineering', letters: 'EN', colour: MARK_COLOUR.indigo },
  { label: 'Design', letters: 'DE', colour: MARK_COLOUR.green },
  { label: 'Operations', letters: 'OP', colour: MARK_COLOUR.amber },
]

function AddTeamButton() {
  return (
    <IconAction
      label="New team"
      icon={Add01Icon}
      size="icon-xs"
      onClick={() => toast('New team', { description: 'Demo only.' })}
    />
  )
}

// A navigation rail: the top-level areas as square icon buttons, the active
// one with a bar beside it, a dot where something is waiting.
function RailDemo() {
  const [page, setPage] = useState('issues')
  const areas = [
    { id: 'home', label: 'Home', icon: Home01Icon },
    { id: 'inbox', label: 'Inbox', icon: InboxIcon, count: 3 },
    { id: 'issues', label: 'Issues', icon: Task01Icon },
    { id: 'projects', label: 'Projects', icon: CubeIcon },
  ]
  return (
    <nav aria-label="Areas" className={RAIL_BOX}>
      {areas.map((a) => (
        <NavItem key={a.id} rail icon={a.icon} label={a.label} count={a.count} active={page === a.id} onClick={() => setPage(a.id)} />
      ))}
      <span className="bg-border my-1 h-px w-6" />
      <NavItem rail icon={Settings01Icon} label="Settings" active={page === 'settings'} onClick={() => setPage('settings')} />
    </nav>
  )
}

// A team row that folds the pages under it, as a sidebar lists teams.
function FoldingTeam() {
  const [open, setOpen] = useState(true)
  return (
    <div className={cn(SIDEBAR_BOX, 'w-56')}>
      <NavItem
        mark={<LetterMark text="EN" colour={MARK_COLOUR.indigo} size="xs" />}
        label="Engineering"
        expanded={open}
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="grid gap-px pl-5">
          <NavItem icon={Task01Icon} label="Issues" count={12} active onClick={noop} />
          <NavItem icon={CubeIcon} label="Projects" onClick={noop} />
          <NavItem icon={Activity01Icon} label="Cycles" onClick={noop} />
        </div>
      )}
    </div>
  )
}

function SidebarNavDemos() {
  return (
    <>
      <Playground
        title="NavItem"
        description="Shown above two plain rows, on the sidebar background"
        controls={[
          { kind: 'select', name: 'lead', label: 'Icon or mark', options: NAV_LEADS, initial: 'icon' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Inbox' },
          { kind: 'select', name: 'count', label: 'Count', options: NAV_COUNTS, initial: '3' },
          { kind: 'switch', name: 'active', label: 'Active', initial: true },
          { kind: 'select', name: 'shape', label: 'Shape', options: NAV_SHAPES, initial: 'row' },
          { kind: 'select', name: 'expanded', label: 'Expanded (a row that folds)', options: NAV_EXPANDED, initial: 'none' },
        ]}
        render={(v) => {
          const lead = str(v, 'lead') as NavLead
          const label = str(v, 'label') || 'Inbox'
          const count = str(v, 'count')
          const shape = str(v, 'shape') as NavShape
          const iconOnly = shape === 'iconOnly'
          const rail = shape === 'rail'
          return (
            <div className={NAV_SHAPE_BOX[shape]}>
              <NavItem
                {...navLead(lead, label)}
                label={label}
                count={count === 'none' ? undefined : Number(count)}
                active={bool(v, 'active')}
                iconOnly={iconOnly}
                rail={rail}
                expanded={EXPANDED[str(v, 'expanded') as NavExpanded]}
                onClick={noop}
              />
              {NAV_NEIGHBOURS[lead].map((n) => (
                <NavItem key={n.label} icon={n.icon} mark={n.mark} label={n.label} iconOnly={iconOnly} rail={rail} onClick={noop} />
              ))}
            </div>
          )
        }}
        code={(v) => {
          const lead = str(v, 'lead') as NavLead
          const label = str(v, 'label') || 'Inbox'
          const count = str(v, 'count')
          const shape = str(v, 'shape') as NavShape
          const expanded = EXPANDED[str(v, 'expanded') as NavExpanded]
          const head = imports({
            '@hugeicons/core-free-icons': lead === 'icon' ? ['InboxIcon'] : lead === 'IconMark' ? ['Target02Icon'] : [],
            '@/components/mark': lead === 'icon' ? [] : [lead],
            '@/components/nav-item': ['NavItem'],
          })
          const mark = lead === 'LetterMark'
            ? `{<LetterMark text="${lettersOf(label)}" colour="${MARK_COLOUR.indigo}" size="xs" />}`
            : lead === 'IconMark'
              ? `{<IconMark icon={Target02Icon} colour="${MARK_COLOUR.indigo}" size="sm" />}`
              : undefined
          const body = jsx('NavItem', {
            icon: lead === 'icon' ? '{InboxIcon}' : undefined,
            mark,
            label,
            count: count === 'none' ? undefined : Number(count),
            active: bool(v, 'active'),
            iconOnly: shape === 'iconOnly',
            rail: shape === 'rail',
            expanded: expanded === undefined ? undefined : '{open}',
            onClick: expanded === undefined ? `{() => setPage('${slug(label)}')}` : '{() => setOpen(!open)}',
          })
          return `${head}\n\n${body}`
        }}
      />

      <Gallery
        title="NavItem options"
        note="rail for a navigation rail, expanded for a row that folds, end for anything at the right"
        items={[
          { label: 'rail', node: <RailDemo /> },
          { label: 'expanded: a team that folds', node: <FoldingTeam /> },
          {
            label: 'end and href',
            node: (
              <div className={cn(SIDEBAR_BOX, 'w-56')}>
                <NavItem icon={InboxIcon} label="Inbox" end={<Shortcut keys={['G', 'I']} then />} onClick={noop} />
                <NavItem
                  icon={BookOpen01Icon}
                  label="Help centre"
                  href="#help"
                  onClick={stay}
                  end={<HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="text-muted-foreground size-3" />}
                />
              </div>
            ),
          },
        ]}
      />

      <Gallery
        title="NavHeading"
        note="mt-4 by default, to space groups apart; mt-0 for the first"
        items={[
          {
            label: 'first group, mt-0',
            node: (
              <div className={cn(SIDEBAR_BOX, 'w-48')}>
                <NavHeading className="mt-0">Favourites</NavHeading>
                <NavItem icon={StarIcon} label="Urgent this week" onClick={noop} />
                <NavItem icon={Target02Icon} label="Q4 roadmap" onClick={noop} />
              </div>
            ),
          },
          {
            label: 'between groups',
            node: (
              <div className={cn(SIDEBAR_BOX, 'w-48')}>
                <NavItem icon={InboxIcon} label="Inbox" count={3} active onClick={noop} />
                <NavItem icon={UserCircleIcon} label="My issues" onClick={noop} />
                <NavHeading>Your teams</NavHeading>
                <NavItem mark={<LetterMark text="EN" colour={MARK_COLOUR.indigo} size="xs" />} label="Engineering" onClick={noop} />
                <NavItem mark={<LetterMark text="DE" colour={MARK_COLOUR.green} size="xs" />} label="Design" onClick={noop} />
              </div>
            ),
          },
        ]}
      />

      <Playground
        title="NavGroup"
        description="A heading that folds its rows away. Click it."
        controls={[
          { kind: 'text', name: 'title', label: 'Title', initial: 'Your teams' },
          { kind: 'switch', name: 'count', label: 'Count', initial: true },
          { kind: 'switch', name: 'action', label: 'Action (add button)', initial: true },
          { kind: 'switch', name: 'foldable', label: 'Foldable', initial: true },
          { kind: 'switch', name: 'defaultOpen', label: 'Open at first (defaultOpen)', initial: true },
        ]}
        render={(v) => (
          <div className={cn(SIDEBAR_BOX, 'w-56')}>
            <NavItem icon={InboxIcon} label="Inbox" count={3} active onClick={noop} />
            <NavItem icon={UserCircleIcon} label="My issues" onClick={noop} />
            <NavGroup
              // A fresh group when "Open at first" changes, since it only applies on mount.
              key={String(bool(v, 'defaultOpen'))}
              title={str(v, 'title') || 'Your teams'}
              count={bool(v, 'count') ? TEAMS.length : undefined}
              action={bool(v, 'action') && <AddTeamButton />}
              foldable={bool(v, 'foldable')}
              defaultOpen={bool(v, 'defaultOpen')}
            >
              {TEAMS.map((t) => (
                <NavItem key={t.label} mark={<LetterMark text={t.letters} colour={t.colour} size="xs" />} label={t.label} onClick={noop} />
              ))}
            </NavGroup>
          </div>
        )}
        code={(v) => {
          const action = bool(v, 'action')
          const head = imports({
            '@hugeicons/core-free-icons': action ? ['Add01Icon'] : [],
            '@/components/icon-action': action ? ['IconAction'] : [],
            '@/components/mark': ['LetterMark'],
            '@/components/nav-item': ['NavGroup', 'NavItem'],
          })
          const teams = `const teams = [\n${TEAMS.map((t) => indent(`${lit({ id: slug(t.label), label: t.label, letters: t.letters, colour: t.colour })},`)).join('\n')}\n]`
          const body = element('NavGroup', [
            `title="${str(v, 'title') || 'Your teams'}"`,
            bool(v, 'count') && 'count={teams.length}',
            action && 'action={<IconAction label="New team" icon={Add01Icon} size="icon-xs" onClick={createTeam} />}',
            !bool(v, 'foldable') && 'foldable={false}',
            !bool(v, 'defaultOpen') && 'defaultOpen={false}',
          ], [
            '{teams.map((t) => (',
            '  <NavItem',
            '    key={t.id}',
            '    mark={<LetterMark text={t.letters} colour={t.colour} size="xs" />}',
            '    label={t.label}',
            '    onClick={() => setPage(t.id)}',
            '  />',
            '))}',
          ].join('\n'))
          return `${head}\n\n${teams}\n\n${body}`
        }}
      />

      <Gallery
        title="NavGroup in use"
        note="foldable={false} keeps a plain heading that lines up with the others"
        items={[
          {
            label: 'two groups',
            node: (
              <div className={cn(SIDEBAR_BOX, 'w-52')}>
                <NavGroup title="Favourites" className="mt-0">
                  <NavItem icon={StarIcon} label="Urgent this week" onClick={noop} />
                  <NavItem icon={Target02Icon} label="Q4 roadmap" onClick={noop} />
                </NavGroup>
                <NavGroup title="Your teams" count={TEAMS.length} action={<AddTeamButton />}>
                  {TEAMS.map((t) => (
                    <NavItem key={t.label} mark={<LetterMark text={t.letters} colour={t.colour} size="xs" />} label={t.label} onClick={noop} />
                  ))}
                </NavGroup>
              </div>
            ),
          },
          {
            label: 'foldable={false}',
            node: (
              <div className={cn(SIDEBAR_BOX, 'w-52')}>
                <NavGroup title="Workspace" foldable={false} className="mt-0">
                  <NavItem icon={UserGroupIcon} label="Members" onClick={noop} />
                  <NavItem icon={Settings01Icon} label="Settings" onClick={noop} />
                </NavGroup>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

export default function NavMenusDemos() {
  return (
    <Demos>
      <SidebarNavDemos />

      <NavigationMenuDemos />
    </Demos>
  )
}
