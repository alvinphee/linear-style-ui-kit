import type { MouseEvent, ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Activity01Icon, Analytics01Icon, BookOpen01Icon, DashboardSquare01Icon, Home01Icon, News01Icon,
  Settings01Icon, Target02Icon, Task01Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str } from './Playground'

const TAB_VARIANTS = ['default', 'line'] as const
const ORIENTATIONS = ['horizontal', 'vertical'] as const
const SEPARATORS = ['chevron', 'slash', 'dot'] as const
const PAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

type TabVariant = (typeof TAB_VARIANTS)[number]
type Orientation = (typeof ORIENTATIONS)[number]
type Separator = (typeof SEPARATORS)[number]

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)
// jsx() quotes every string, so a value written as '{…}' is turned back into an expression.
const expr = (snippet: string) => snippet.replace(/="\{([^"]*)\}"/g, '={$1}')
const pick = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

const ICON = (name: string, inline?: 'inline-start' | 'inline-end') =>
  `<HugeiconsIcon icon={${name}} strokeWidth={2}${inline ? ` data-icon="${inline}"` : ''} />`

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

/* Tabs */

const TABS: { value: string; label: string; icon: IconSvgElement; iconName: string; body: string }[] = [
  { value: 'overview', label: 'Overview', icon: DashboardSquare01Icon, iconName: 'DashboardSquare01Icon', body: 'Progress, open issues and the latest project update.' },
  { value: 'issues', label: 'Issues', icon: Task01Icon, iconName: 'Task01Icon', body: '24 open issues, 6 of them due this week.' },
  { value: 'settings', label: 'Settings', icon: Settings01Icon, iconName: 'Settings01Icon', body: 'Name, members, labels and integrations.' },
]

function TabsDemos() {
  return (
    <>
      <Playground
        title="Tabs"
        description="variant, orientation, icons and a disabled tab"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: TAB_VARIANTS, initial: 'default' },
          { kind: 'select', name: 'orientation', label: 'Orientation', options: ORIENTATIONS, initial: 'horizontal' },
          { kind: 'switch', name: 'icons', label: 'Icons', initial: true },
          { kind: 'switch', name: 'disabled', label: 'Disable Settings', initial: false },
        ]}
        render={(v) => {
          const icons = bool(v, 'icons')
          return (
            <Tabs defaultValue="overview" orientation={str(v, 'orientation') as Orientation} className="w-full max-w-md">
              <TabsList variant={str(v, 'variant') as TabVariant}>
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} disabled={bool(v, 'disabled') && t.value === 'settings'}>
                    {icons && <HugeiconsIcon icon={t.icon} strokeWidth={2} data-icon="inline-start" />}
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="bg-card text-muted-foreground rounded-lg border p-3">
                  {t.body}
                </TabsContent>
              ))}
            </Tabs>
          )
        }}
        code={(v) => {
          const icons = bool(v, 'icons')
          const head = imports({
            '@hugeicons/react': icons ? ['HugeiconsIcon'] : [],
            '@hugeicons/core-free-icons': icons ? TABS.map((t) => t.iconName) : [],
            '@/components/ui/tabs': ['Tabs', 'TabsContent', 'TabsList', 'TabsTrigger'],
          })
          const body = jsx('Tabs', { defaultValue: 'overview', orientation: unless(str(v, 'orientation'), 'horizontal') }, [
            jsx('TabsList', { variant: unless(str(v, 'variant'), 'default') }, TABS.map((t) => jsx('TabsTrigger', {
              value: t.value,
              disabled: bool(v, 'disabled') && t.value === 'settings',
            }, icons ? [ICON(t.iconName, 'inline-start'), t.label] : t.label))),
            ...TABS.map((t) => jsx('TabsContent', { value: t.value }, t.body)),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Tabs variants"
        rows={{ name: 'variant', values: TAB_VARIANTS }}
        cols={{ name: 'orientation', values: ORIENTATIONS }}
        render={(variant, orientation) => (
          <Tabs defaultValue="overview" orientation={orientation}>
            <TabsList variant={variant}>
              {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
            </TabsList>
            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="text-muted-foreground px-1 text-[11px]">
                {t.label} panel
              </TabsContent>
            ))}
          </Tabs>
        )}
      />

      <Gallery
        title="Tabs in use"
        items={[
          {
            label: 'icon only',
            node: (
              <Tabs defaultValue="board">
                <TabsList>
                  <TabsTrigger value="board" aria-label="Overview">
                    <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
                  </TabsTrigger>
                  <TabsTrigger value="list" aria-label="Issues">
                    <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />
                  </TabsTrigger>
                  <TabsTrigger value="activity" aria-label="Activity">
                    <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="board" className="sr-only">Overview</TabsContent>
                <TabsContent value="list" className="sr-only">Issues</TabsContent>
                <TabsContent value="activity" className="sr-only">Activity</TabsContent>
              </Tabs>
            ),
          },
          {
            label: 'with counts',
            node: (
              <Tabs defaultValue="open">
                <TabsList variant="line">
                  <TabsTrigger value="open">Open <span className="text-muted-foreground tabular-nums">24</span></TabsTrigger>
                  <TabsTrigger value="closed">Closed <span className="text-muted-foreground tabular-nums">108</span></TabsTrigger>
                </TabsList>
                <TabsContent value="open" className="sr-only">24 open issues</TabsContent>
                <TabsContent value="closed" className="sr-only">108 closed issues</TabsContent>
              </Tabs>
            ),
          },
          {
            label: 'full width',
            node: (
              <Tabs defaultValue="monthly" className="w-64 max-w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="sr-only">Monthly billing</TabsContent>
                <TabsContent value="yearly" className="sr-only">Yearly billing</TabsContent>
              </Tabs>
            ),
          },
        ]}
      />
    </>
  )
}

/* Breadcrumb */

const SEPARATOR_NODE: Record<Separator, { node?: ReactNode; code?: string }> = {
  chevron: {},
  slash: { node: '/', code: '/' },
  dot: { node: '·', code: '·' },
}

function Crumbs({ separator, ellipsis, icon, page }: { separator: Separator; ellipsis: boolean; icon: boolean; page: string }) {
  const sep = <BreadcrumbSeparator>{SEPARATOR_NODE[separator].node}</BreadcrumbSeparator>
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay} className={cn(icon && 'flex items-center gap-1')}>
            {icon && <HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-3.5" />}
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {sep}
        {ellipsis && (
          <>
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            {sep}
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={stay}>Projects</BreadcrumbLink>
        </BreadcrumbItem>
        {sep}
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function BreadcrumbDemos() {
  return (
    <>
      <Playground
        title="Breadcrumb"
        description="Separator, ellipsis and a leading icon"
        controls={[
          { kind: 'select', name: 'separator', label: 'Separator', options: SEPARATORS, initial: 'chevron' },
          { kind: 'text', name: 'page', label: 'Current page', initial: 'Mobile app' },
          { kind: 'switch', name: 'ellipsis', label: 'Ellipsis', initial: true },
          { kind: 'switch', name: 'icon', label: 'Home icon', initial: true },
        ]}
        render={(v) => (
          <Crumbs
            separator={str(v, 'separator') as Separator}
            ellipsis={bool(v, 'ellipsis')}
            icon={bool(v, 'icon')}
            page={str(v, 'page') || 'Mobile app'}
          />
        )}
        code={(v) => {
          const icon = bool(v, 'icon')
          const ellipsis = bool(v, 'ellipsis')
          const sepText = SEPARATOR_NODE[str(v, 'separator') as Separator].code
          const sep = sepText ? `<BreadcrumbSeparator>${sepText}</BreadcrumbSeparator>` : '<BreadcrumbSeparator />'
          const head = imports({
            '@hugeicons/react': icon ? ['HugeiconsIcon'] : [],
            '@hugeicons/core-free-icons': icon ? ['Home01Icon'] : [],
            '@/components/ui/breadcrumb': pick(
              'Breadcrumb', ellipsis && 'BreadcrumbEllipsis', 'BreadcrumbItem', 'BreadcrumbLink', 'BreadcrumbList',
              'BreadcrumbPage', 'BreadcrumbSeparator',
            ),
          })
          const body = jsx('Breadcrumb', {}, jsx('BreadcrumbList', {}, [
            jsx('BreadcrumbItem', {}, jsx('BreadcrumbLink', { href: '/', className: icon ? 'flex items-center gap-1' : undefined }, icon
              ? ['<HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-3.5" />', 'Home']
              : 'Home')),
            sep,
            ellipsis ? jsx('BreadcrumbItem', {}, '<BreadcrumbEllipsis />') : '',
            ellipsis ? sep : '',
            jsx('BreadcrumbItem', {}, '<BreadcrumbLink href="/projects">Projects</BreadcrumbLink>'),
            sep,
            jsx('BreadcrumbItem', {}, `<BreadcrumbPage>${str(v, 'page') || 'Mobile app'}</BreadcrumbPage>`),
          ]))
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Breadcrumb separators"
        note="BreadcrumbSeparator children"
        rows={{ name: 'separator', values: SEPARATORS }}
        render={(separator) => <Crumbs separator={separator} ellipsis={false} icon={false} page="Mobile app" />}
      />

      <Gallery
        title="Breadcrumb in use"
        items={[
          {
            label: 'truncated page',
            node: (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={stay}>Issues</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="block max-w-36 truncate" title="Search results lose their order after a refresh">
                      Search results lose their order after a refresh
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            ),
          },
          {
            label: 'team badge',
            node: (
              <Breadcrumb>
                <BreadcrumbList className="gap-1">
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={stay} className="flex items-center gap-1.5">
                      <span className="bg-brand/15 text-brand flex size-4 items-center justify-center rounded-sm text-[9px] font-semibold">
                        DS
                      </span>
                      Design
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="tabular-nums">DS-87</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            ),
          },
        ]}
      />
    </>
  )
}

/* Pagination */

const TOTAL_PAGES = 10
const END = 'pointer-events-none opacity-50'

// First, last, and the pages either side of the current one. A gap of one
// page shows that page instead of an ellipsis.
function pageItems(page: number, total: number, collapse: boolean): (number | 'gap')[] {
  if (!collapse) return Array.from({ length: total }, (_, i) => i + 1)
  const keep = [...new Set([1, page - 1, page, page + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  keep.forEach((p, i) => {
    const prev = keep[i - 1]
    if (prev !== undefined && p - prev === 2) items.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) items.push('gap')
    items.push(p)
  })
  return items
}

function Pages({ page, prevNext = true, collapse = true }: { page: number; prevNext?: boolean; collapse?: boolean }) {
  return (
    <Pagination>
      <PaginationContent className="flex-wrap justify-center">
        {prevNext && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={stay}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              className={cn(page === 1 && END)}
            />
          </PaginationItem>
        )}
        {pageItems(page, TOTAL_PAGES, collapse).map((item, i) =>
          item === 'gap' ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink href="#" onClick={stay} isActive={item === page} className="tabular-nums">{item}</PaginationLink>
            </PaginationItem>
          ),
        )}
        {prevNext && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={stay}
              aria-disabled={page === TOTAL_PAGES}
              tabIndex={page === TOTAL_PAGES ? -1 : undefined}
              className={cn(page === TOTAL_PAGES && END)}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

function PaginationDemos() {
  return (
    <>
      <Playground
        title="Pagination"
        description="10 pages; the select sets the current one"
        controls={[
          { kind: 'select', name: 'page', label: 'Current page', options: PAGES, initial: '3' },
          { kind: 'switch', name: 'prevNext', label: 'Previous and next', initial: true },
          { kind: 'switch', name: 'collapse', label: 'Ellipsis', initial: true },
        ]}
        render={(v) => <Pages page={Number(str(v, 'page'))} prevNext={bool(v, 'prevNext')} collapse={bool(v, 'collapse')} />}
        code={(v) => {
          const page = Number(str(v, 'page'))
          const prevNext = bool(v, 'prevNext')
          const items = pageItems(page, TOTAL_PAGES, bool(v, 'collapse'))
          const gaps = items.includes('gap')
          const end = (disabled: boolean) => (disabled ? { 'aria-disabled': true, tabIndex: -1, className: END } : {})
          const head = imports({
            '@/components/ui/pagination': pick(
              'Pagination', 'PaginationContent', gaps && 'PaginationEllipsis', 'PaginationItem', 'PaginationLink',
              prevNext && 'PaginationNext', prevNext && 'PaginationPrevious',
            ),
          })
          const body = jsx('Pagination', {}, jsx('PaginationContent', {}, [
            prevNext ? jsx('PaginationItem', {}, jsx('PaginationPrevious', { href: '#', ...end(page === 1) })) : '',
            ...items.map((item) => jsx('PaginationItem', {}, item === 'gap'
              ? '<PaginationEllipsis />'
              : jsx('PaginationLink', { href: '#', isActive: item === page }, String(item)))),
            prevNext ? jsx('PaginationItem', {}, jsx('PaginationNext', { href: '#', ...end(page === TOTAL_PAGES) })) : '',
          ]))
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Pagination by page"
        note="Where the ellipses fall"
        rows={{ name: 'page', values: ['1', '4', '7', '10'] as const }}
        render={(page) => <Pages page={Number(page)} />}
      />

      <Gallery
        title="Pagination in use"
        items={[
          {
            label: 'compact',
            node: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={stay} />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-muted-foreground px-2 text-xs tabular-nums">Page 3 of 10</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={stay} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            label: 'with summary',
            node: (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-muted-foreground text-xs tabular-nums">41–60 of 200 issues</span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={stay} size="default">Previous</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={stay} size="default">Next</PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

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

export default function NavigationDemos() {
  return (
    <Demos>
      <TabsDemos />
      <BreadcrumbDemos />
      <PaginationDemos />
      <NavigationMenuDemos />
    </Demos>
  )
}
