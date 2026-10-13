import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Agent, AgentDraft } from '@/blocks/ai/agents/agent-types'
import { now, uid, USER } from '../data'
import { useStoredState } from '../settings/prefs'
import { SAMPLE_AGENTS, SHARED_AGENTS } from './agents-data'
import { useAgentRuns, type RunEvent } from './runner'
import { SAMPLE_RUNS } from './runs-data'

// The AI chat app's agents and their runs, shared by the Agents pages, the
// runs inbox and the sidebar's badge. Agents you make are kept in this
// browser; runs live for the visit (the demo clock starts again on reload,
// so saved run times would read oddly). In a provider of its own so a run's
// ticks re-render only what shows runs.

const EVENT_TOAST: Record<RunEvent['type'], (name: string, title: string) => [string, string]> = {
  awaiting: (name, title) => [`${name} needs your approval`, title],
  succeeded: (name, title) => [`${name} finished`, title],
  failed: (name, title) => [`${name} failed`, title],
  cancelled: (name, title) => [`${name} was cancelled`, title],
}

function useAgentsState(openRun: (id: string) => void) {
  const [agents, setAgents] = useStoredState<Agent[]>('linear-kit:ai-agents:v1', SAMPLE_AGENTS)
  const all = useMemo(() => [...agents, ...SHARED_AGENTS], [agents])
  const agentOf = useCallback((id: string) => all.find((a) => a.id === id), [all])

  const runs = useAgentRuns(SAMPLE_RUNS, {
    onEvent: ({ type, run }) => {
      const [title, description] = EVENT_TOAST[type](agentOf(run.agentId)?.name ?? 'An agent', run.title)
      toast(title, { description, action: { label: 'Open', onClick: () => openRun(run.id) } })
    },
  })

  // The agent's status, from its newest run.
  const statusOf = useCallback((agent: Agent) => {
    const latest = runs.runs.filter((r) => r.agentId === agent.id).sort((a, b) => b.startedAt - a.startedAt)[0]
    if (!latest) return { status: 'idle' as const }
    const status = latest.status === 'running' || latest.status === 'queued' ? 'running'
      : latest.status === 'awaiting' ? 'awaiting'
        : latest.status === 'failed' ? 'failed' : 'idle'
    return { status: status as 'idle' | 'running' | 'awaiting' | 'failed', lastRunAt: latest.finishedAt ?? latest.startedAt }
  }, [runs.runs])

  return {
    agents,
    shared: SHARED_AGENTS,
    agentOf,
    statusOf,
    runs,
    create(draft: AgentDraft) {
      const at = now()
      const agent: Agent = { ...draft, id: uid('ag'), owner: USER.name, createdAt: at, updatedAt: at }
      setAgents((list) => [...list, agent])
      return agent.id
    },
    update(id: string, draft: AgentDraft) {
      setAgents((list) => list.map((a) => (a.id === id ? { ...a, ...draft, updatedAt: now() } : a)))
    },
    patch(id: string, patch: Partial<AgentDraft>) {
      setAgents((list) => list.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a)))
    },
    remove(id: string) {
      setAgents((list) => list.filter((a) => a.id !== id))
    },
    reset() {
      setAgents(SAMPLE_AGENTS)
    },
  }
}

type AgentsState = ReturnType<typeof useAgentsState>

const AgentsContext = createContext<AgentsState | null>(null)

export function AgentsProvider({ openRun, children }: { openRun: (id: string) => void; children: ReactNode }) {
  const value = useAgentsState(openRun)
  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
}

export function useAgents() {
  const state = useContext(AgentsContext)
  if (!state) throw new Error('useAgents must be used inside AgentsProvider')
  return state
}
