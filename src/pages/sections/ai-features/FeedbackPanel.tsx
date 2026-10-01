import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Copy01Icon, InformationCircleIcon, RefreshIcon, SparklesIcon, ThumbsDownIcon, ThumbsUpIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PRIORITY, type Job, type Priority } from '../../data'
import { useJobs } from '../../jobs-store'
import { goTo } from '../../nav'
import { Panel } from '../shared'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '../StatusSection'
import { IconAction, Thinking, copyText, useTimers } from './shared'

const QUESTION = 'Which jobs could run late today?'
const REASONS = ['Not accurate', 'Missing a job', 'Out of date', 'Not helpful', 'Unsafe or offensive']
const RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 }

function progressOf(job: Job) {
  const total = job.subtasks.length
  const done = job.subtasks.filter((s) => s.done).length
  return { total, done, left: total - done }
}

export function FeedbackPanel() {
  const id = useId()
  const { jobs, select } = useJobs()
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const { later } = useTimers()

  // The answer is worked out from the live store, so edits elsewhere change it.
  const atRisk = jobs
    .filter((j) => j.due === 'Today' && j.status !== 'done' && j.status !== 'cancelled')
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || progressOf(b).left - progressOf(a).left)
  const worst = atRisk[0]
  const canSend = reasons.length > 0 || comment.trim() !== ''

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

  function thumbsDown() {
    if (vote === 'down') {
      setVote(null)
      return
    }
    setReasons([])
    setComment('')
    setDialogOpen(true)
  }

  function sendFeedback() {
    setVote('down')
    setDialogOpen(false)
    toast.success('Feedback sent', { description: 'Demo only. Nothing was sent.' })
  }

  return (
    <Panel title="Feedback and trust" note="Label it, ask about it, own the limits">
      <div className="grid min-w-0 gap-3">
        <div className="flex justify-end">
          <p className="bg-muted max-w-[85%] rounded-lg rounded-br-sm px-3 py-1.5 text-[13px]">{QUESTION}</p>
        </div>

        <article aria-label="AI answer" className="bg-subtle min-w-0 rounded-lg border">
          <header className="flex items-center gap-2 border-b py-1.5 pr-1.5 pl-3">
            <Badge variant="outline" className="gap-1">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand" />
              AI-generated
            </Badge>
            <span className="text-muted-foreground truncate text-[11px]">from the live job list</span>
            <div className="ml-auto flex items-center gap-0.5">
              <IconAction label="Regenerate answer" disabled={regenerating} onClick={regenerate}>
                <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              </IconAction>
              <IconAction label="Copy answer" onClick={() => copyText(answerText(), 'Answer copied')}>
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
              </IconAction>
            </div>
          </header>

          <div className="grid gap-2 px-3 py-2.5 text-[13px] leading-5" aria-busy={regenerating}>
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

          <footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t py-1 pr-1.5 pl-3">
            <span className="text-muted-foreground mr-auto text-[11px]" aria-live="polite">
              {vote === 'up' ? 'Thanks for the feedback.' : vote === 'down' ? 'Thanks. We will look into it.' : 'How was this?'}
            </span>
            <IconAction label="Good answer" pressed={vote === 'up'} onClick={() => setVote(vote === 'up' ? null : 'up')}>
              <HugeiconsIcon icon={ThumbsUpIcon} strokeWidth={2} />
            </IconAction>
            <IconAction label="Bad answer" pressed={vote === 'down'} onClick={thumbsDown}>
              <HugeiconsIcon icon={ThumbsDownIcon} strokeWidth={2} />
            </IconAction>
          </footer>
        </article>

        <p className="text-muted-foreground flex items-start gap-1.5 text-[11px]">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="mt-px size-3.5 shrink-0" />
          AI can make mistakes. Check important details before you act on them. Answers only use jobs you can see.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
            <DialogDescription>Pick anything that applies. Demo only: nothing is sent.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (canSend) sendFeedback()
            }}
          >
            <fieldset className="grid gap-2.5">
              <legend className="sr-only">Reasons</legend>
              {REASONS.map((reason) => (
                <Label key={reason} className="font-normal">
                  <Checkbox
                    checked={reasons.includes(reason)}
                    onCheckedChange={(on) =>
                      setReasons((r) => (on ? [...r, reason] : r.filter((x) => x !== reason)))
                    }
                  />
                  {reason}
                </Label>
              ))}
            </fieldset>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-comment`}>
                Anything else? <span className="text-muted-foreground font-normal">Optional</span>
              </Label>
              <Textarea
                id={`${id}-comment`}
                value={comment}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What should the answer have said?"
                className="min-h-20"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!canSend}>Send feedback</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
