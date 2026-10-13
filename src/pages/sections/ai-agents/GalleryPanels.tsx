import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon, Copy01Icon, Delete02Icon, DashboardSquare01Icon, PencilEdit02Icon, PlayIcon, Settings02Icon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AgentCard, AgentStatusLine, type AgentStatus } from '@/blocks/ai/agents/agent-card'
import { formatAgo } from '@/lib/format'
import { AgentGallery, type AgentGalleryTab } from '@/blocks/ai/agents/agent-gallery'
import { AgentOverview } from '@/blocks/ai/agents/agent-overview'
import { AgentPage } from '@/blocks/ai/agents/agent-page'
import type { Agent, AgentTemplate } from '@/blocks/ai/agents/agent-types'
import { IconAction } from '@/components/icon-action'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Panel } from '../shared'
import { at, MODELS, now, uid, USER } from '../ai/data'
import { AGENT_CATEGORIES, AGENT_TEMPLATES, SAMPLE_AGENTS, SHARED_AGENTS } from '../ai/agents/agents-data'
import { CONNECTORS } from '../ai/settings/connectors-data'
import { SAMPLE_SKILLS } from '../ai/settings/skills-data'
import { SAMPLE_KNOWLEDGE_BASES } from '../ai/knowledge/bases-data'

// The agent gallery blocks on their own, on local state: the agent card in
// each status and as a template, the gallery live (Run now runs for two
// seconds, Use template adds an agent to Yours), and one agent's page with
// its Overview, yours and one shared with you (read only).

const connectorName = (id: string) => CONNECTORS.find((c) => c.id === id)?.name
const CONNECTOR_NAMES = CONNECTORS.map(({ id, name, icon, colour }) => ({ id, name, icon, colour }))
const SKILL_NAMES = SAMPLE_SKILLS.map(({ id, name }) => ({ id, name }))
const BASE_NAMES = SAMPLE_KNOWLEDGE_BASES.map(({ id, name }) => ({ id, name }))
const modelName = (id?: string) => (id ? MODELS.find((m) => m.id === id)?.name : undefined)

const demo = (title: string) => () => toast(title, { description: 'Demo only.' })

const byId = (id: string) => [...SAMPLE_AGENTS, ...SHARED_AGENTS].find((a) => a.id === id)!

// Where each sample agent stands, for the cards.
const INITIAL_STATUS: Record<string, { status?: AgentStatus; lastRunAt?: number }> = {
  'ag-invoices': { status: 'awaiting', lastRunAt: at(0, 17, 55) },
  'ag-ops-report': { lastRunAt: at(1, 9, 0) },
  'ag-support-triage': { status: 'running', lastRunAt: at(0, 18, 30) },
  'ag-competitors': { status: 'failed', lastRunAt: at(4, 16, 0) },
}

// A few recent runs for the Overview's slot. The runs blocks fill it in the app.
const RECENT = [
  { id: 'r1', title: 'Invoices from 3 new emails', awaiting: true, at: at(0, 17, 55) },
  { id: 'r2', title: 'Invoice INV-20931 from Northwind', awaiting: false, at: at(1, 11, 20) },
  { id: 'r3', title: 'Invoices from 2 new emails', awaiting: false, at: at(2, 9, 45) },
]

function fromTemplate(t: AgentTemplate): Agent {
  const time = now()
  const agent: Agent & Partial<Pick<AgentTemplate, 'category' | 'publisher' | 'uses'>> = {
    ...t, id: uid('ag'), owner: USER.name, templateId: t.id, createdAt: time, updatedAt: time,
  }
  delete agent.category
  delete agent.publisher
  delete agent.uses
  return agent
}

export function GalleryPanels() {
  const [agents, setAgents] = useState<Agent[]>(SAMPLE_AGENTS)
  const [status, setStatus] = useState(INITIAL_STATUS)
  const [tab, setTab] = useState<AgentGalleryTab>('yours')
  const [pageTab, setPageTab] = useState('overview')
  const [sharedTab, setSharedTab] = useState('overview')
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const run = (agent: Agent) => {
    if (status[agent.id]?.status === 'running') return
    setStatus((s) => ({ ...s, [agent.id]: { status: 'running', lastRunAt: now() } }))
    toast(`Running “${agent.name}”`, { description: 'It shows in Runs while it works.' })
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setStatus((s) => ({ ...s, [agent.id]: { status: 'idle', lastRunAt: now() } }))
      toast.success(`“${agent.name}” finished`)
    }, 2000)
    timers.current.add(timer)
  }

  const addFromTemplate = (t: AgentTemplate) => {
    const agent = fromTemplate(t)
    setAgents((list) => [agent, ...list])
    setTab('yours')
    toast.success(`Added “${t.name}” to your agents`, { description: 'In the app, the builder opens to finish it.' })
  }

  const menuFor = (agent: Agent) => (
    <>
      <DropdownMenuItem onSelect={demo(`Edit “${agent.name}”`)}>
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => setAgents((list) => [{ ...agent, id: uid('ag'), name: `${agent.name} (copy)` }, ...list])}
      >
        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" onSelect={() => setAgents((list) => list.filter((a) => a.id !== agent.id))}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
      </DropdownMenuItem>
    </>
  )

  const invoices = byId('ag-invoices')
  const onboarding = byId('ag-onboarding')
  const clock = now()

  const overview = (agent: Agent) => (
    <AgentOverview
      agent={agent}
      onStarter={(text) => toast(`Starts a chat with “${agent.name}”`, { description: text })}
      onChat={demo(`Starts a chat with “${agent.name}”`)}
      connectors={CONNECTOR_NAMES}
      skills={SKILL_NAMES}
      bases={BASE_NAMES}
      modelName={modelName(agent.model)}
      recent={agent.id === 'ag-invoices' ? (
        <ul className="divide-y rounded-lg border">
          {RECENT.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={demo(`Opens the run “${r.title}”`)}
                className="hover:bg-accent/60 focus-visible:bg-accent flex min-h-10 w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-left text-xs outline-none"
              >
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                {r.awaiting ? (
                  <AgentStatusLine status="awaiting" className="shrink-0" />
                ) : (
                  <span className="text-status-done flex shrink-0 items-center gap-1 text-[11px]">
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" /> Done
                  </span>
                )}
                <span className="text-muted-foreground shrink-0 text-[11px]">{formatAgo(r.at, clock)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : undefined}
    />
  )

  const placeholder = (text: string) => <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-8 text-center text-xs">{text}</p>

  return (
    <>
      <Panel title="Agent card" note="Idle, running, needs approval, failed" wide>
        <div className="@container min-w-0">
          <ul className="grid grid-cols-1 gap-2 @xl:grid-cols-2 @5xl:grid-cols-4">
            {(['ag-ops-report', 'ag-support-triage', 'ag-invoices', 'ag-competitors'] as const).map((id) => {
              const agent = byId(id)
              return (
                <li key={id} className="grid min-w-0">
                  <AgentCard
                    agent={agent}
                    status={INITIAL_STATUS[id]?.status}
                    lastRunAt={INITIAL_STATUS[id]?.lastRunAt}
                    onOpen={demo(`Opens “${agent.name}”`)}
                    onChat={demo(`Starts a chat with “${agent.name}”`)}
                    onRun={demo(`Runs “${agent.name}” now`)}
                    menu={menuFor(agent)}
                    connectorName={connectorName}
                    now={clock}
                  />
                </li>
              )
            })}
          </ul>
        </div>
      </Panel>

      <Panel title="Agent card, never run and shared">
        <ul className="grid grid-cols-1 gap-2">
          <li className="grid min-w-0">
            <AgentCard
              agent={byId('ag-contracts')}
              onOpen={demo('Opens “Contract reviewer”')}
              onChat={demo('Starts a chat with “Contract reviewer”')}
              onRun={demo('Runs “Contract reviewer” now')}
              connectorName={connectorName}
            />
          </li>
          <li className="grid min-w-0">
            <AgentCard
              agent={onboarding}
              owner={onboarding.owner}
              onOpen={demo('Opens “New hire helper”')}
              onChat={demo('Starts a chat with “New hire helper”')}
              connectorName={connectorName}
            />
          </li>
        </ul>
      </Panel>

      <Panel title="Template card" note="In Explore">
        <ul className="grid grid-cols-1 gap-2">
          {AGENT_TEMPLATES.filter((t) => t.id === 'tpl-invoice-clerk' || t.id === 'tpl-meeting-actions').map((t) => (
            <li key={t.id} className="grid min-w-0">
              <AgentCard variant="template" agent={t} onOpen={demo(`Opens the builder from “${t.name}”`)} connectorName={connectorName} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Agent gallery" note="Live: Run now, Use template, the card menu" wide>
        <AgentGallery
          agents={agents}
          shared={SHARED_AGENTS}
          templates={AGENT_TEMPLATES}
          categories={AGENT_CATEGORIES}
          statusOf={(a) => status[a.id]}
          onOpen={(a) => toast(`Opens “${a.name}”`, { description: 'Demo only.' })}
          onCreate={demo('Opens the builder: describe the agent you want')}
          onUseTemplate={addFromTemplate}
          onChat={(a) => toast(`Starts a chat with “${a.name}”`, { description: 'Demo only.' })}
          onRun={run}
          menuFor={menuFor}
          tab={tab}
          onTabChange={setTab}
          connectorName={connectorName}
          now={clock}
        />
      </Panel>

      <Panel title="Agent page" note="Overview; the other tabs come from the app" wide>
        <div className="flex h-[40rem] min-w-0 overflow-hidden rounded-lg border">
          <AgentPage
            agent={invoices}
            status={status['ag-invoices']?.status === 'running' ? 'running' : 'idle'}
            start={<IconAction label="Back to agents" icon={ArrowLeft01Icon} onClick={demo('Back to the gallery')} />}
            tabs={[
              { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, content: overview(invoices) },
              { id: 'runs', label: 'Runs', icon: PlayIcon, count: 12, content: placeholder('The app puts the agent’s runs here.') },
              { id: 'configure', label: 'Configure', icon: Settings02Icon, content: placeholder('The app puts the configure form and triggers here.') },
            ]}
            tab={pageTab}
            onTabChange={setPageTab}
            onChat={demo('Starts a chat with “Invoice clerk”')}
            onRun={() => run(invoices)}
            onEdit={demo('Opens the builder for “Invoice clerk”')}
            onDuplicate={demo('Duplicates “Invoice clerk”')}
            onShare={demo('Opens the share dialog')}
            onDelete={demo('Deletes “Invoice clerk”')}
          />
        </div>
      </Panel>

      <Panel title="Agent page, shared with you" note="Read only: Duplicate to edit" wide>
        <div className="flex h-[32rem] min-w-0 overflow-hidden rounded-lg border">
          <AgentPage
            agent={onboarding}
            readOnly
            tabs={[
              { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon, content: overview(onboarding) },
              { id: 'runs', label: 'Runs', icon: PlayIcon, content: placeholder('Your runs of this agent show here.') },
            ]}
            tab={sharedTab}
            onTabChange={setSharedTab}
            onChat={demo('Starts a chat with “New hire helper”')}
            onEdit={demo('Not offered: shared with you')}
            onDuplicate={() => {
              setAgents((list) => [{ ...onboarding, id: uid('ag'), name: `${onboarding.name} (copy)`, owner: USER.name, access: 'private' }, ...list])
              toast.success('Duplicated to your agents', { description: 'Edit the copy in Yours.' })
            }}
            onShare={demo('Opens the share dialog')}
          />
        </div>
      </Panel>
    </>
  )
}
