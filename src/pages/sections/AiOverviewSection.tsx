import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { IconAction } from '@/components/icon-action'
import { Panel as KitPanel } from '@/components/panel'
import { copyText, useCopied } from '@/lib/clipboard'
import registry from '../../../registry.json'
import { NAV, TEMPLATES } from '../nav'
import { CodeBlock } from '../playground/Playground'
import { Panel, Section } from './shared'

type RegistryItem = {
  name: string
  type: string
  title?: string
  description?: string
  categories?: string[]
  files?: { path: string }[]
}

// Read from registry.json, so a new part in components/ai or blocks/ai shows
// here as soon as the registry is rebuilt. The ai-kit bundle is the install
// panel, not a row.
const AI_ITEMS = (registry.items as unknown as RegistryItem[]).filter(
  (i) => i.categories?.includes('ai') && i.type !== 'registry:item',
)
const COMPONENTS = AI_ITEMS.filter((i) => i.type === 'registry:component')
const BLOCKS = AI_ITEMS.filter((i) => i.type === 'registry:block')

// The kit page that demos each block. Every AI component is on AI components.
const DEMO_PAGE: Record<string, string> = {
  'prompt-box': 'ai-workspace',
  'chat-message': 'ai-workspace',
  'chat-thread': 'ai-workspace',
  'chat-history': 'ai-workspace',
  'chat-library': 'ai-workspace',
  'artifact-panel': 'ai-workspace',
  'thinking-trail': 'ai-workspace',
  'ai-summary-card': 'ai-features',
}
// Blocks in a folder of their own are demoed on that folder's page.
const DEMO_FOLDER: Record<string, string> = {
  agents: 'ai-agents',
  connectors: 'ai-connectors',
  projects: 'ai-projects',
  knowledge: 'ai-knowledge',
  citations: 'ai-knowledge',
  schedules: 'ai-projects',
  skills: 'ai-skills',
  memory: 'ai-skills',
  voice: 'ai-settings',
}
const demoPageOf = (item: RegistryItem) => {
  const folder = item.files?.[0]?.path.match(/^src\/blocks\/ai\/([^/]+)\//)?.[1]
  const id = DEMO_PAGE[item.name] ?? (folder && DEMO_FOLDER[folder]) ?? (item.type === 'registry:component' ? 'ai-components' : undefined)
  return NAV.find((n) => n.id === id)
}

// Blocks in runs by their folder under blocks/ai/ (chat, projects…); files
// straight in blocks/ai/ come first, with no heading.
function byFolder(items: RegistryItem[]) {
  const folderOf = (i: RegistryItem) => i.files?.[0]?.path.match(/^src\/blocks\/ai\/([^/]+)\//)?.[1] ?? ''
  const folders = [...new Set(items.map(folderOf))].sort()
  return folders.map((folder) => ({ folder, items: items.filter((i) => folderOf(i) === folder) }))
}

const AI_TEMPLATES = TEMPLATES.filter((t) => t.path === '/templates/ai-chat' || t.path === '/templates/erp-ai')

export default function AiOverviewSection() {
  return (
    <Section
      id="ai-overview"
      title="AI kit"
      description="Every part made for AI products, from the AI label to the chat workspace, and how to install them"
    >
      <Panel title="Install" note={`${AI_ITEMS.length} parts`} wide>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Step label="Name the registry once, in components.json" className="lg:col-span-2">
            <CodeBlock code={'"registries": { "@kit": "http://localhost:5180/r/{name}.json" }'} />
          </Step>
          <Step label="The whole AI kit, with what it needs">
            <CodeBlock code="npx shadcn add @kit/ai-kit" />
          </Step>
          <Step label="Or one part on its own">
            <CodeBlock code="npx shadcn add @kit/prompt-box" />
          </Step>
        </div>
      </Panel>

      <KitPanel title="Components" note="Small parts, in components/ai/" className="lg:col-span-2" bodyClassName="p-0">
        <ItemList items={COMPONENTS} />
      </KitPanel>

      <KitPanel title="Blocks" note="Compositions, in blocks/ai/" className="lg:col-span-2" bodyClassName="p-0">
        {byFolder(BLOCKS).map(({ folder, items }) => (
          <div key={folder || 'root'} role={folder ? 'group' : undefined} aria-label={folder ? titleOf(folder) : undefined}>
            {folder && (
              <p className="text-muted-foreground bg-subtle border-y px-3.5 py-1 text-[10px] font-medium tracking-wide uppercase">
                {titleOf(folder)}
              </p>
            )}
            <ItemList items={items} />
          </div>
        ))}
      </KitPanel>

      <KitPanel title="Templates" note="Whole apps built from the AI kit" bodyClassName="p-0">
        <ul className="divide-y">
          {AI_TEMPLATES.map((t) => (
            <li key={t.path}>
              <a
                href={`#${t.path}`}
                className="hover:bg-accent focus-visible:ring-ring/40 flex items-center gap-3 px-3.5 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-inset"
              >
                <HugeiconsIcon icon={t.icon} className="text-muted-foreground size-4 shrink-0" />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="text-xs font-medium">{t.label}</span>
                  <span className="text-muted-foreground text-[11px]">{t.description}</span>
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </KitPanel>

      <Panel title="What belongs here" note="One test">
        <div className="text-muted-foreground grid gap-2 text-xs leading-5">
          <p>
            <span className="text-foreground font-medium">A part is in the AI kit only if it makes sense only in an AI product</span>:
            the thinking indicator, the AI label, the prompt box, the thinking trail.
          </p>
          <p>
            Generic parts the AI blocks also use (file chip, mention, icon action, usage meter) stay in the main kit.
            Installing an AI part brings them along.
          </p>
          <p>
            AI is a domain across the levels, not a level of its own: components in <Code>components/ai/</Code>, blocks
            in <Code>blocks/ai/</Code>, and every item tagged <Code>ai</Code> in the registry.
          </p>
        </div>
      </Panel>
    </Section>
  )
}

function Step({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <p className="text-muted-foreground mb-1.5 text-[11px]">{label}</p>
      {children}
    </div>
  )
}

function Code({ children }: { children: ReactNode }) {
  return <code className="bg-muted text-foreground rounded px-1 py-px font-mono text-[11px]">{children}</code>
}

function ItemList({ items }: { items: RegistryItem[] }) {
  if (items.length === 0) return <p className="text-muted-foreground px-3.5 py-3 text-xs">None yet.</p>
  return (
    <ul className="divide-y">
      {items.map((item) => <ItemRow key={item.name} item={item} />)}
    </ul>
  )
}

function ItemRow({ item }: { item: RegistryItem }) {
  const [copied, flagCopied] = useCopied()
  const id = `@kit/${item.name}`
  const page = demoPageOf(item)

  async function copy() {
    if (await copyText(id, { success: false })) flagCopied()
  }

  return (
    <li className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-xs font-medium">{item.title ?? item.name}</span>
        {item.description && <span className="text-muted-foreground text-[11px]">{item.description}</span>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-0.5">
          <Code>{id}</Code>
          <IconAction label={copied ? 'Copied' : `Copy ${id}`} icon={copied ? Tick02Icon : Copy01Icon} size="icon-xs" onClick={copy} />
        </span>
        {page && (
          <a
            href={`#/${page.id}`}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1 rounded text-[11px] outline-none focus-visible:ring-2"
          >
            {page.label}
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
          </a>
        )}
      </div>
    </li>
  )
}

function titleOf(folder: string) {
  return folder[0].toUpperCase() + folder.slice(1)
}
