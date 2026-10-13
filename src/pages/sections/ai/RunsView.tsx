import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BotIcon } from '@hugeicons/core-free-icons'
import { RunSheet } from '@/blocks/ai/agents/run-detail'
import { RunsInbox } from '@/blocks/ai/agents/runs-inbox'
import { Button } from '@/components/ui/button'
import { useAgents } from './agents/context'
import { useActions } from './context'
import { now } from './data'

// The runs inbox: every agent's runs, what needs you first, with one run
// open in a sheet (its steps, the approval it waits for, its result).

export function RunsView({ runId, start }: { runId?: string; start?: ReactNode }) {
  const actions = useActions()
  const state = useAgents()
  const { runs } = state
  const open = runId ? runs.runs.find((r) => r.id === runId) ?? null : null
  const agentOf = (id: string) => {
    const agent = state.agentOf(id)
    return agent ? { name: agent.name, icon: agent.icon, colour: agent.colour } : { name: 'Agent' }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
        {start}
        <h1 className="min-w-0 flex-1 truncate px-1 text-xs font-medium">Runs</h1>
        <Button variant="ghost" size="sm" onClick={() => actions.openAgents()}>
          <HugeiconsIcon icon={BotIcon} strokeWidth={2} data-icon="inline-start" /> Agents
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-3xl min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 py-6">
          <RunsInbox
            runs={runs.runs}
            agentOf={agentOf}
            now={now()}
            onOpen={(id) => {
              runs.markSeen(id)
              actions.openRuns(id)
            }}
            onApprove={(id) => runs.approve(id, 'once')}
            onDeny={(id) => runs.deny(id)}
            onCancel={(id) => runs.cancel(id)}
          />
        </div>
      </div>
      <RunSheet
        run={open}
        agent={open ? agentOf(open.agentId) : undefined}
        open={!!open}
        onOpenChange={(o) => !o && actions.openRuns()}
        now={now()}
        onApprove={(mode) => open && runs.approve(open.id, mode)}
        onDeny={() => open && runs.deny(open.id)}
        onCancel={() => open && runs.cancel(open.id)}
        onRetry={() => open && runs.retry(open.id)}
        onOpenChat={(chatId) => actions.openChat(chatId)}
      />
    </div>
  )
}
