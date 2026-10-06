import { type MouseEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Home01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, pick, str } from './Playground'

const SEPARATORS = ['chevron', 'slash', 'dot'] as const

type Separator = (typeof SEPARATORS)[number]

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

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

export default function BreadcrumbPageDemos() {
  return (
    <Demos>
      <BreadcrumbDemos />
    </Demos>
  )
}
