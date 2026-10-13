import { useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import type { AgentRun } from '@/blocks/ai/agents/agent-types'
import { RunCard } from '@/blocks/ai/agents/run-card'
import { RunDetail, RunSheet, type ApprovalMode } from '@/blocks/ai/agents/run-detail'
import { RunStatusBadge } from '@/blocks/ai/agents/run-status'
import { RunsInbox } from '@/blocks/ai/agents/runs-inbox'
import { ApprovalCard, type ApprovalDecision } from '@/blocks/ai/reasoning/thinking-trail'
import { Button } from '@/components/ui/button'
import { useNow } from '@/components/ai/thinking-indicator'
import { Panel, Row } from '../shared'
import { now } from '../ai/data'
import { useAgentRuns, type RunEvent } from '../ai/agents/runner'
import { QUEUED_RUN, RUN_AGENTS, runAgentOf, SAMPLE_RUNS } from '../ai/agents/runs-data'

// Runs: the runs inbox live on the made-up runner (start a run and watch its
// steps advance, then allow or deny it), a run's detail while it waits and
// once it succeeded, a run card in every status, and the approval card with
// Always allow.

const demo = (title: string) => toast(title, { description: 'Demo only.' })

const EVENT_TOAST: Record<RunEvent['type'], (name: string, run: AgentRun) => void> = {
  awaiting: (name, run) => toast(`${name} needs your approval`, { description: run.approval?.title }),
  succeeded: (name, run) => toast.success(`${name} finished`, { description: run.title }),
  failed: (name, run) => toast.error(`${name} failed`, { description: run.error }),
  cancelled: (name) => toast(`${name}: run cancelled`),
}

const byStatus = (status: AgentRun['status']) => [QUEUED_RUN, ...SAMPLE_RUNS].find((r) => r.status === status)!

export function RunsPanels() {
  const time = useNow(true, 1000, now)
  const runner = useAgentRuns(SAMPLE_RUNS, {
    onEvent: ({ type, run }) => EVENT_TOAST[type](runAgentOf(run.agentId).name, run),
  })
  const [openId, setOpenId] = useState<string | null>(null)
  const open = runner.runs.find((r) => r.id === openId) ?? null
  const openRun = (id: string) => {
    setOpenId(id)
    runner.markSeen(id)
  }
  const waiting = runner.runs.find((r) => r.id === 'run-invoices-5520')!
  const succeeded = SAMPLE_RUNS.find((r) => r.id === 'run-invoices-batch')!

  return (
    <>
      <Panel title="Runs inbox" note="Live: start a run, then allow or deny it" wide>
        <RunsInbox
          runs={runner.runs}
          agentOf={runAgentOf}
          now={time}
          onOpen={openRun}
          onApprove={(id) => runner.approve(id, 'once')}
          onDeny={runner.deny}
          onCancel={runner.cancel}
          actions={(['ag-invoices', 'ag-contracts'] as const).map((id) => (
            <Button key={id} variant="outline" size="sm" onClick={() => openRun(runner.start(id))}>
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
              Run {RUN_AGENTS[id].name}
            </Button>
          ))}
        />
        <RunSheet
          open={!!open}
          onOpenChange={(next) => !next && setOpenId(null)}
          run={open}
          agent={open ? runAgentOf(open.agentId) : undefined}
          now={time}
          onApprove={(mode: ApprovalMode) => open && runner.approve(open.id, mode)}
          onDeny={() => open && runner.deny(open.id)}
          onCancel={() => open && runner.cancel(open.id)}
          onRetry={() => open && runner.retry(open.id)}
          onOpenChat={() => demo('Opens the run’s chat')}
        />
      </Panel>

      <Panel title="Run detail: needs approval" note="Allow once, Always allow or Deny">
        <div className="@container">
          <RunDetail
            run={waiting}
            agent={runAgentOf(waiting.agentId)}
            now={time}
            onApprove={(mode) => runner.approve(waiting.id, mode)}
            onDeny={() => runner.deny(waiting.id)}
            onCancel={() => runner.cancel(waiting.id)}
            onRetry={() => runner.retry(waiting.id)}
          />
        </div>
      </Panel>

      <Panel title="Run detail: succeeded" note="The result in Markdown, Open in chat">
        <div className="@container">
          <RunDetail
            run={succeeded}
            agent={runAgentOf(succeeded.agentId)}
            now={time}
            onApprove={() => {}}
            onDeny={() => {}}
            onCancel={() => {}}
            onRetry={() => demo('Run again')}
            onOpenChat={() => demo('Opens the run’s chat')}
          />
        </div>
      </Panel>

      <Panel title="Run card" note="One per status" wide>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(['queued', 'running', 'awaiting', 'succeeded', 'failed', 'cancelled'] as const).map((status) => {
            const run = byStatus(status)
            return (
              <li key={status} className="grid min-w-0 content-start gap-1.5">
                <RunStatusBadge status={status} className="w-fit" />
                <RunCard
                  run={run}
                  agent={runAgentOf(run.agentId)}
                  now={time}
                  onOpen={() => demo(`Opens “${run.title}”`)}
                  onApprove={() => demo('Allowed once')}
                  onDeny={() => demo('Denied')}
                  onCancel={() => demo('Run cancelled')}
                />
              </li>
            )
          })}
        </ul>
      </Panel>

      <ApprovalPanel />
    </>
  )
}

// The approval card with Always allow, on its own: every state it can be in.
function ApprovalPanel() {
  const [state, setState] = useState<ApprovalDecision>('pending')
  const [always, setAlways] = useState(false)
  return (
    <Panel title="Approval card with Always allow" note="Allow once, Always allow, Deny" wide>
      <div className="@container grid min-w-0 gap-3">
        <ApprovalCard
          title="Send a reply to Harbour Supplies?"
          description="INV-5520 matches PO-2291. The reply confirms it is approved for payment on 30 Oct."
          state={state}
          always={always}
          onApprove={() => { setAlways(false); setState('approved') }}
          onAlwaysAllow={() => { setAlways(true); setState('approved') }}
          onDeny={() => setState('denied')}
        >
          <ul className="grid list-disc gap-0.5 pl-4">
            <li>Send an email to accounts@harbour-supplies.example.com</li>
            <li>Subject: “Re: Invoice INV-5520”</li>
          </ul>
        </ApprovalCard>
        {state !== 'pending' && (
          <Row>
            <Button variant="ghost" size="sm" onClick={() => { setState('pending'); setAlways(false) }}>Ask again</Button>
          </Row>
        )}
      </div>
    </Panel>
  )
}
