import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Activity01Icon, DashboardSquare01Icon, Settings01Icon, Task01Icon } from '@hugeicons/core-free-icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, unless } from './Playground'

const TAB_VARIANTS = ['default', 'line'] as const

const ORIENTATIONS = ['horizontal', 'vertical'] as const

type TabVariant = (typeof TAB_VARIANTS)[number]

type Orientation = (typeof ORIENTATIONS)[number]

const ICON = (name: string, inline?: 'inline-start' | 'inline-end') =>
  `<HugeiconsIcon icon={${name}} strokeWidth={2}${inline ? ` data-icon="${inline}"` : ''} />`

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

export default function TabsPageDemos() {
  return (
    <Demos>
      <TabsDemos />
    </Demos>
  )
}
