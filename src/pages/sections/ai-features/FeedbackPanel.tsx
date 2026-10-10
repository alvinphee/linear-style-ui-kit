import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AssistantMessage, FeedbackDialog, MessageActions, UserMessage } from '@/blocks/ai/chat/chat-message'
import { AiLabel } from '@/components/ai/ai-label'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { Thinking } from '@/components/ai/thinking-indicator'
import { copyText } from '@/lib/clipboard'
import { useTimers } from '@/lib/use-timers'
import { PRIORITY, PRIORITY_RANK, type Job } from '../../data'
import { useJobs } from '../../jobs-store'
import { goTo } from '../../nav'
import { Panel } from '../shared'

const QUESTION = 'Which jobs could run late today?'
const REASONS = ['Not accurate', 'Missing a job', 'Out of date', 'Not helpful', 'Unsafe or offensive']
const ACTION_LABELS = { copy: 'Copy answer', regenerate: 'Regenerate answer', up: 'Good answer', down: 'Bad answer' }

function progressOf(job: Job) {
  const total = job.subtasks.length
  const done = job.subtasks.filter((s) => s.done).length
  return { total, done, left: total - done }
}

export function FeedbackPanel() {
  const { jobs, select } = useJobs()
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const { later } = useTimers()

  // The answer is worked out from the live store, so edits elsewhere change it.
  const atRisk = jobs
    .filter((j) => j.due === 'Today' && j.status !== 'done' && j.status !== 'cancelled')
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || progressOf(b).left - progressOf(a).left)
  const worst = atRisk[0]

  function answerText() {
    if (!atRisk.length) return 'Nothing due today is still open.'
    const lines = atRisk.map((j) => {
      const p = progressOf(j)
      return `- ${j.id} ${j.title}: ${PRIORITY[j.priority].label}, ${p.total ? `${p.done} of ${p.total} sub-tasks done` : 'no sub-tasks'}`
    })
    return `${atRisk.length} ${atRisk.length === 1 ? 'job due today is' : 'jobs due today are'} still open:\n${lines.join('\n')}`
  }

  function openJob(jobId: string) {
    select(jobId)
    goTo('issue')
  }

  function regenerate() {
    setRegenerating(true)
    setVote(null)
    later(() => setRegenerating(false), 900)
  }

  // A thumbs down asks why first; the dialog records the vote.
  function onFeedback(next: 'up' | 'down' | undefined) {
    if (next === 'down') setDialogOpen(true)
    else setVote(next ?? null)
  }

  function sendFeedback() {
    setVote('down')
    toast.success('Feedback sent', { description: 'Demo only. Nothing was sent.' })
  }

  return (
    <Panel title="Feedback and trust" note="Label it, ask about it, own the limits">
      <div className="grid min-w-0 gap-3">
        <UserMessage text={QUESTION} />

        <AssistantMessage
          name="Assistant"
          label="AI answer"
          meta={(
            <span className="inline-flex items-center gap-1.5 align-middle">
              <AiLabel>AI-generated</AiLabel>
              <span className="hidden sm:inline">from the live job list</span>
            </span>
          )}
          className="bg-subtle rounded-lg border p-3"
          actions={(
            <MessageActions
              className="-mb-1 -ml-1"
              onCopy={() => copyText(answerText(), { success: 'Answer copied' })}
              onRegenerate={regenerate}
              regenerateDisabled={regenerating}
              feedback={vote}
              onFeedback={onFeedback}
              labels={ACTION_LABELS}
            >
              <span className="text-muted-foreground ml-1 text-[11px]" aria-live="polite">
                {vote === 'up' ? 'Thanks for the feedback.' : vote === 'down' ? 'Thanks. We will look into it.' : 'How was this?'}
              </span>
            </MessageActions>
          )}
        >
          <div className="grid gap-2 text-[13px] leading-5" aria-busy={regenerating}>
            {regenerating ? (
              <Thinking label="Checking today’s jobs…" />
            ) : atRisk.length === 0 ? (
              <p>Nothing due today is still open. You are on track.</p>
            ) : (
              <>
                <p>
                  {atRisk.length} {atRisk.length === 1 ? 'job due today is' : 'jobs due today are'} still open:
                </p>
                <ul className="grid gap-1">
                  {atRisk.map((job) => {
                    const p = progressOf(job)
                    return (
                      <li key={job.id} className="flex min-w-0 items-center gap-2 text-xs">
                        <PriorityIcon priority={job.priority} />
                        <button
                          type="button"
                          onClick={() => openJob(job.id)}
                          className="text-brand focus-visible:ring-ring/30 shrink-0 rounded-sm font-medium tabular-nums underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                        >
                          {job.id}
                        </button>
                        <span className="min-w-0 flex-1 truncate">{job.title}</span>
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {p.total ? `${p.done}/${p.total}` : '—'}
                        </span>
                        {job.driver && <UserAvatar name={job.driver} className="size-5" />}
                      </li>
                    )
                  })}
                </ul>
                {worst && progressOf(worst).left > 0 && (
                  <p>
                    <span className="font-medium">{worst.id}</span> is the bigger risk: it is{' '}
                    {PRIORITY[worst.priority].label.toLowerCase()} and {progressOf(worst).left} of its sub-tasks are still open.
                  </p>
                )}
              </>
            )}
          </div>
        </AssistantMessage>

        <p className="text-muted-foreground flex items-start gap-1.5 text-[11px]">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="mt-px size-3.5 shrink-0" />
          AI can make mistakes. Check important details before you act on them. Answers only use jobs you can see.
        </p>
      </div>

      <FeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reasons={REASONS}
        description="Pick anything that applies. Demo only: nothing is sent."
        onSubmit={sendFeedback}
      />
    </Panel>
  )
}
