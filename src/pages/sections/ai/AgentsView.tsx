import { useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, BubbleChatIcon, Copy01Icon, Delete02Icon, Home01Icon, PlayIcon, Task01Icon, Wrench01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AgentBuilder, useUnsavedPrompt, type AgentBuilderTab } from '@/blocks/ai/agents/agent-builder'
import { AgentMark } from '@/blocks/ai/agents/agent-card'
import { AgentConfigForm, hasAgentDraftErrors, validateAgentDraft } from '@/blocks/ai/agents/agent-config-form'
import { AgentGallery, type AgentGalleryTab } from '@/blocks/ai/agents/agent-gallery'
import { AgentOverview } from '@/blocks/ai/agents/agent-overview'
import { AgentPage } from '@/blocks/ai/agents/agent-page'
import { AgentPreview, type PreviewMessage } from '@/blocks/ai/agents/agent-preview'
import type { Agent, AgentDraft } from '@/blocks/ai/agents/agent-types'
import { BuilderChat, type BuilderMessage } from '@/blocks/ai/agents/builder-chat'
import { RunCard } from '@/blocks/ai/agents/run-card'
import { TriggerEditor } from '@/blocks/ai/agents/trigger-editor'
import { IconAction } from '@/components/icon-action'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAgents } from './agents/context'
import { AGENT_CATEGORIES, AGENT_TEMPLATES } from './agents/agents-data'
import { BUILDER_GREETING, BUILDER_SUGGESTIONS, EMPTY_DRAFT, builderTurn, previewReply } from './agents/builder-script'
import { AGENT_EVENTS } from './agents/events-data'
import { useActions } from './context'
import { MODELS, now, uid } from './data'
import { useKnowledge } from './knowledge/context'
import { PROJECT_COLOURS, PROJECT_ICONS } from './projects/templates'
import { useConnectors } from './settings/ConnectorsTab'
import { useSkills } from './settings/skills-data'

// Agents in the AI chat app: the gallery (yours, shared with you, templates
// to start from), one agent's page (Overview, Chat, Runs, Triggers) and the
// builder (describe it in a chat, or fill in the form, with a live preview).
// Agents you make are kept in this browser; their runs are in the runs inbox.

export const AGENT_TABS = ['overview', 'chat', 'runs', 'triggers'] as const

const draftOf = ({ id: _id, owner: _owner, createdAt: _c, updatedAt: _u, ...draft }: Agent): AgentDraft => draft
const think = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function AgentsView({ agentId, tab, start }: { agentId?: string; tab?: string; start?: ReactNode }) {
  const state = useAgents()
  const agent = agentId ? state.agentOf(agentId) : undefined

  if (agentId === 'new') return <AgentBuilderView start={start} />
  // Only your own agents open in the builder; a shared one stays read only.
  if (agent && tab === 'edit' && state.agents.some((a) => a.id === agent.id)) {
    return <AgentBuilderView agent={agent} start={start} key={agent.id} />
  }
  if (agent) return <AgentView agent={agent} tab={tab} start={start} key={agent.id} />
  return <GalleryView start={start} />
}

function GalleryView({ start }: { start?: ReactNode }) {
  const actions = useActions()
  const state = useAgents()
  const { connectors } = useConnectors()
  const [tab, setTab] = useState<AgentGalleryTab>('yours')
  const connectorName = (id: string) => connectors.find((c) => c.id === id)?.name

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {start}
        <h1 className="min-w-0 flex-1 truncate px-1 text-xs font-medium">Agents</h1>
        <Button variant="ghost" size="sm" onClick={() => actions.openRuns()}>
          <HugeiconsIcon icon={Task01Icon} strokeWidth={2} data-icon="inline-start" /> Runs
        </Button>
        <Button size="sm" onClick={() => actions.openAgents('new')}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Create agent
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-5xl min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 py-6">
          <AgentGallery
            agents={state.agents}
            shared={state.shared}
            templates={AGENT_TEMPLATES}
            categories={AGENT_CATEGORIES}
            statusOf={state.statusOf}
            tab={tab}
            onTabChange={setTab}
            connectorName={connectorName}
            now={now()}
            onOpen={(a) => actions.openAgents(a.id)}
            onCreate={() => actions.openAgents('new')}
            onChat={(a) => actions.openAgents(a.id, 'chat')}
            onRun={(a) => {
              const runId = state.runs.start(a.id)
              toast(`${a.name} started`, { action: { label: 'Open', onClick: () => actions.openRuns(runId) } })
            }}
            onUseTemplate={(t) => {
              const { id: _id, category: _c, publisher: _p, uses: _u, ...draft } = t
              const id = state.create({ ...draft, templateId: t.id })
              actions.openAgents(id, 'edit')
              toast(`Made “${t.name}” from its template`, { description: 'Change anything, then save.' })
            }}
            menuFor={(a) => (state.agents.some((own) => own.id === a.id) ? (
              <>
                <DropdownMenuItem onSelect={() => actions.openAgents(state.create({ ...draftOf(a), name: `${a.name} (copy)` }), 'edit')}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => remove(a)}>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete
                </DropdownMenuItem>
              </>
            ) : null)}
          />
        </div>
      </div>
    </div>
  )

  function remove(a: Agent) {
    state.remove(a.id)
    toast(`Deleted “${a.name}”`, { action: { label: 'Undo', onClick: () => state.create(draftOf(a)) } })
  }
}

// What an agent can use, by name, for its overview and preview.
function useAgentUses(agent: AgentDraft) {
  const { connectors } = useConnectors()
  const { skills } = useSkills()
  const knowledge = useKnowledge()
  return useMemo(() => ({
    connectors: connectors.filter((c) => agent.connectors[c.id]).map((c) => ({ id: c.id, name: c.name, icon: c.icon, colour: c.colour })),
    skills: skills.filter((s) => agent.skills.includes(s.id)).map((s) => ({ id: s.id, name: s.name })),
    bases: knowledge.bases.filter((b) => agent.knowledgeBases.includes(b.id)).map((b) => ({ id: b.id, name: b.name })),
  }), [agent, connectors, skills, knowledge.bases])
}

// A conversation with an agent, scripted from its instructions (previewReply).
// Real chats with an agent come with @mentions in the chat.
function useAgentChat(draft: AgentDraft) {
  const [messages, setMessages] = useState<PreviewMessage[]>([])
  const [busy, setBusy] = useState(false)
  return {
    messages,
    busy,
    reset: () => setMessages([]),
    async send(text: string) {
      setMessages((m) => [...m, { id: uid('pm'), role: 'user', text }])
      setBusy(true)
      await think(900)
      const reply = previewReply(draft, text)
      setMessages((m) => [...m, { id: uid('pm'), role: 'agent', text: reply.text, tools: reply.tools }])
      setBusy(false)
    },
  }
}

function AgentView({ agent, tab, start }: { agent: Agent; tab?: string; start?: ReactNode }) {
  const actions = useActions()
  const state = useAgents()
  const { connectors } = useConnectors()
  const uses = useAgentUses(agent)
  const chat = useAgentChat(agent)
  const own = state.agents.some((a) => a.id === agent.id)
  const runs = state.runs.runs.filter((r) => r.agentId === agent.id).sort((a, b) => b.startedAt - a.startedAt)
  const status = state.statusOf(agent)
  const time = now()
  const shown = tab && (AGENT_TABS as readonly string[]).includes(tab) ? tab : 'overview'
  const go = (next: string) => actions.openAgents(agent.id, next)

  function run() {
    const runId = state.runs.start(agent.id)
    toast(`${agent.name} started`, { action: { label: 'Open', onClick: () => actions.openRuns(runId) } })
  }

  function duplicate() {
    const id = state.create({ ...draftOf(agent), name: `${agent.name} (copy)`, access: 'private' })
    actions.openAgents(id, 'edit')
  }

  const runCards = (list: typeof runs) => (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
      {list.map((r) => (
        <RunCard
          key={r.id}
          run={r}
          agent={agent}
          now={time}
          onOpen={() => actions.openRuns(r.id)}
          onApprove={() => state.runs.approve(r.id, 'once')}
          onDeny={() => state.runs.deny(r.id)}
          onCancel={() => state.runs.cancel(r.id)}
        />
      ))}
      {!list.length && <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-xs">No runs yet.</p>}
    </div>
  )

  return (
    <AgentPage
      agent={agent}
      status={status.status}
      owner={agent.owner}
      readOnly={!own}
      tab={shown}
      onTabChange={go}
      start={(
        <>
          {start}
          <IconAction label="All agents" icon={ArrowLeft01Icon} onClick={() => actions.openAgents()} />
        </>
      )}
      onChat={() => go('chat')}
      onRun={run}
      onEdit={() => go('edit')}
      onDuplicate={duplicate}
      onShare={() => toast('Demo only', { description: 'Sharing an agent uses the same share dialog as projects.' })}
      onDelete={own ? () => {
        state.remove(agent.id)
        actions.openAgents()
        toast(`Deleted “${agent.name}”`)
      } : undefined}
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Home01Icon,
          content: (
            <AgentOverview
              agent={agent}
              onStarter={(text) => {
                go('chat')
                void chat.send(text)
              }}
              onChat={() => go('chat')}
              connectors={uses.connectors}
              skills={uses.skills}
              bases={uses.bases}
              modelName={MODELS.find((m) => m.id === agent.model)?.name}
              recent={runCards(runs.slice(0, 3))}
            />
          ),
        },
        {
          id: 'chat',
          label: 'Chat',
          icon: BubbleChatIcon,
          content: (
            <div className="bg-card h-[34rem] min-h-0 overflow-hidden rounded-lg border">
              <AgentPreview
                draft={agent}
                messages={chat.messages}
                busy={chat.busy}
                onSend={chat.send}
                onReset={chat.reset}
                uses={{ knowledge: agent.files.length + agent.knowledgeBases.length, connectors: uses.connectors.map((c) => c.name), skills: uses.skills.map((s) => s.name) }}
              />
            </div>
          ),
        },
        { id: 'runs', label: 'Runs', icon: PlayIcon, count: runs.length || undefined, content: runCards(runs) },
        {
          id: 'triggers',
          label: 'Triggers',
          icon: Wrench01Icon,
          count: agent.triggers.filter((t) => t.kind !== 'manual').length || undefined,
          content: (
            <TriggerEditor
              triggers={agent.triggers}
              onChange={own ? (triggers) => {
                state.patch(agent.id, { triggers })
                toast('Triggers saved')
              } : () => toast('Duplicate this agent to change its triggers')}
              connectors={connectors}
              events={AGENT_EVENTS}
              now={time}
              disabled={!own}
              onOpenSettings={() => actions.openSettings('connectors')}
            />
          ),
        },
      ]}
    />
  )
}

function AgentBuilderView({ agent, start }: { agent?: Agent; start?: ReactNode }) {
  const actions = useActions()
  const state = useAgents()
  const { connectors } = useConnectors()
  const { skills } = useSkills()
  const knowledge = useKnowledge()
  const initial = useMemo(() => (agent ? draftOf(agent) : EMPTY_DRAFT), [agent])
  const [draft, setDraft] = useState<AgentDraft>(initial)
  const [tab, setTab] = useState<AgentBuilderTab | undefined>(undefined)
  const [messages, setMessages] = useState<BuilderMessage[]>(() => [
    { id: uid('bm'), role: 'builder', text: agent ? `What would you like to change about **${agent.name}**?` : BUILDER_GREETING },
  ])
  const [busy, setBusy] = useState(false)
  const [tried, setTried] = useState(false)
  const preview = useAgentChat(draft)
  const uses = useAgentUses(draft)
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  useUnsavedPrompt(dirty)
  const errors = tried ? validateAgentDraft(draft, now()) : undefined
  const bases = knowledge.bases.map((b) => ({
    id: b.id, name: b.name, icon: b.icon, colour: b.colour, documentCount: b.documents.length,
    tokens: b.documents.reduce((n, d) => n + d.tokens, 0),
  }))

  async function describe(text: string) {
    const mine: BuilderMessage = { id: uid('bm'), role: 'user', text }
    const history = [...messages, mine]
    setMessages(history)
    setBusy(true)
    await think(1100)
    const turn = builderTurn(draft, history, text)
    setDraft((d) => ({ ...d, ...turn.patch }))
    setMessages((m) => [...m, { id: uid('bm'), role: 'builder', text: turn.reply, updated: turn.updated }])
    setBusy(false)
  }

  function save() {
    setTried(true)
    const found = validateAgentDraft(draft, now())
    if (hasAgentDraftErrors(found)) {
      setTab('configure')
      toast('Some details are missing', { description: 'They are marked in Configure.' })
      return
    }
    if (agent) {
      state.update(agent.id, draft)
      actions.openAgents(agent.id)
      toast(`Saved “${draft.name}”`)
    } else {
      const id = state.create(draft)
      actions.openAgents(id)
      toast(`Created “${draft.name}”`, { description: 'Chat with it, run it, or let its triggers run it.' })
    }
  }

  return (
    <AgentBuilder
      draft={draft}
      mode={agent ? 'edit' : 'create'}
      tab={tab}
      onTabChange={setTab}
      start={start}
      dirty={dirty}
      onSave={save}
      onCancel={() => {
        if (dirty && !window.confirm('Leave without saving your changes?')) return
        if (agent) actions.openAgents(agent.id)
        else actions.openAgents()
      }}
      create={(
        <BuilderChat
          messages={messages}
          onSend={describe}
          busy={busy}
          suggestions={agent ? undefined : BUILDER_SUGGESTIONS}
        />
      )}
      configure={(
        <AgentConfigForm
          draft={draft}
          onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          icons={PROJECT_ICONS}
          colours={PROJECT_COLOURS}
          models={MODELS}
          connectors={connectors}
          events={AGENT_EVENTS}
          skills={skills}
          bases={bases}
          errors={errors}
          now={now()}
          onAddFiles={(files) => setDraft((d) => ({
            ...d, files: [...d.files, ...files.map((f) => ({ id: uid('af'), name: f.name, size: f.size }))],
          }))}
          onRemoveFile={(id) => setDraft((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }))}
          onOpenSettings={(section) => actions.openSettings(section)}
        />
      )}
      preview={(
        <AgentPreview
          draft={draft}
          mark={<AgentMark agent={draft} />}
          messages={preview.messages}
          busy={preview.busy}
          onSend={preview.send}
          onReset={preview.reset}
          uses={{ knowledge: draft.files.length + draft.knowledgeBases.length, connectors: uses.connectors.map((c) => c.name), skills: uses.skills.map((s) => s.name) }}
        />
      )}
      saveLabel={agent ? 'Save' : 'Create'}
    />
  )
}
