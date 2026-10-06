import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Download01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Demos, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const PAGE_HEADER_SIZES = ['lg', 'md', 'sm'] as const

const HEADING_LEVELS = ['h1', 'h2', 'h3'] as const

type PageHeaderSize = (typeof PAGE_HEADER_SIZES)[number]

type HeadingLevel = (typeof HEADING_LEVELS)[number]

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

const indent = (code: string) => code.replace(/^/gm, '  ')

const demoOnly = (title: string) => toast(title, { description: 'Demo only. Nothing was changed.' })

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

export default function PageHeaderDemos() {
  return (
    <Demos>
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
    </Demos>
  )
}
