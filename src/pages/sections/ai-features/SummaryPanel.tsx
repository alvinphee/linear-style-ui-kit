import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { AiSummaryCard, SummaryBullets } from '@/blocks/ai/ai-summary-card'
import { StatusIcon } from '@/components/status-icon'
import { StreamCaret } from '@/components/thinking-indicator'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { copyText } from '@/lib/clipboard'
import { plural } from '@/lib/text'
import { useTimers } from '@/lib/use-timers'
import { PRIORITY, STATUS, type Job } from '../../data'
import { useJobs, type Activity } from '../../jobs-store'
import { goTo } from '../../nav'
import { Panel } from '../shared'

type Summary = {
  phase: 'thinking' | 'streaming' | 'done'
  bullets: string[]
  shown: number
  total: number
  signature: string
  sources: number
  feedback: 'up' | 'down' | null
  stopped: boolean
  version: number
}

// What the summary was built from. Title and description edits are left out
// on purpose: the bullets do not use them.
function signatureOf(job: Job, activity: Activity[]) {
  const entries = activity.filter((a) => a.jobId === job.id).length
  return JSON.stringify([
    job.status, job.priority, job.driver, job.due, job.labels, job.customer, job.photos,
    job.subtasks.map((s) => [s.title, s.done]), entries,
  ])
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function buildSummary(job: Job, activity: Activity[], version: number) {
  const status = STATUS[job.status].label
  const priority = job.priority === 'none' ? 'no priority set' : `${PRIORITY[job.priority].label.toLowerCase()} priority`
  const due = !job.due ? '' : job.due === 'Today' || job.due === 'Tomorrow' ? job.due.toLowerCase() : `on ${job.due}`
  const owner = job.driver ? `Assigned to ${job.driver}` : 'Not assigned yet'
  const first = version % 2 === 0
    ? `${status}, ${priority}${due ? `, due ${due}` : ', no due date'}. ${owner}${job.customer ? ` for ${job.customer}` : ''}.`
    : `${job.customer ? `${job.customer} job, ` : ''}${status.toLowerCase()} with ${priority}${due ? ` and due ${due}` : ''}. Owner: ${job.driver || 'nobody yet'}.`

  const total = job.subtasks.length
  const done = job.subtasks.filter((s) => s.done).length
  const next = job.subtasks.find((s) => !s.done)
  const photos = job.photos ? ` ${plural(job.photos, 'proof photo')} attached.` : ' No proof photos yet.'
  const second = !total
    ? `No sub-tasks yet.${photos}`
    : done === total
      ? `All ${total} sub-tasks are done.${photos}`
      : `${done} of ${total} sub-tasks done; next up is “${next!.title}”.${photos}`

  const entries = activity.filter((a) => a.jobId === job.id)
  const last = entries[entries.length - 1]
  const third = !last
    ? 'No activity yet.'
    : last.kind === 'comment'
      ? `Latest: ${last.actor} said “${clip(last.text, 72)}” (${last.at}).`
      : `Latest: ${last.actor} ${last.text} (${last.at}).`

  return { bullets: [first, second, third], sources: entries.length + (total ? 1 : 0) + 1 }
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length

export function SummaryPanel() {
  const { jobs, selected, select, activity } = useJobs()
  const [summaries, setSummaries] = useState<Record<string, Summary>>({})
  const { later } = useTimers()
  const summary = summaries[selected.id]
  const signature = signatureOf(selected, activity)
  const stale = summary?.phase === 'done' && summary.signature !== signature
  const streaming = Object.values(summaries).some((s) => s.phase === 'streaming')

  // One ticker streams every summary still being written, a few words at a time.
  useEffect(() => {
    if (!streaming) return
    const timer = setInterval(() => {
      setSummaries((all) => {
        const next = { ...all }
        for (const [id, s] of Object.entries(all)) {
          if (s.phase !== 'streaming') continue
          const shown = Math.min(s.total, s.shown + 2)
          next[id] = { ...s, shown, phase: shown >= s.total ? 'done' : 'streaming' }
        }
        return next
      })
    }, 50)
    return () => clearInterval(timer)
  }, [streaming])

  function patch(id: string, change: Partial<Summary>) {
    setSummaries((all) => (all[id] ? { ...all, [id]: { ...all[id], ...change } } : all))
  }

  function summarise() {
    const job = selected
    const version = summary ? summary.version + 1 : 0
    const { bullets, sources } = buildSummary(job, activity, version)
    setSummaries((all) => ({
      ...all,
      [job.id]: {
        phase: 'thinking', bullets, sources, shown: 0, total: bullets.reduce((n, b) => n + wordCount(b), 0),
        signature: signatureOf(job, activity), feedback: null, stopped: false, version,
      },
    }))
    later(() => patch(job.id, { phase: 'streaming' }), 650)
  }

  function copy() {
    if (!summary) return
    const text = revealed(summary).filter(Boolean).map((b) => `- ${b}`).join('\n')
    copyText(`${selected.id} summary\n${text}`, { success: 'Summary copied' })
  }

  return (
    <Panel title="AI summary card" note="Follows the selected job">
      <div className="grid min-w-0 gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Select value={selected.id} onValueChange={select}>
            <SelectTrigger
              size="sm"
              aria-label="Job to summarise"
              className="w-full min-w-0 flex-1 *:data-[slot=select-value]:min-w-0"
            >
              <SelectValue>
                <span className="flex min-w-0 items-center gap-1.5">
                  <StatusIcon status={selected.status} />
                  <span className="text-muted-foreground shrink-0 tabular-nums">{selected.id}</span>
                  <span className="truncate">{selected.title || 'Untitled job'}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="max-w-[min(22rem,calc(100vw-2rem))]">
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id} className="pr-7">
                  <StatusIcon status={job.status} />
                  <span className="text-muted-foreground shrink-0 tabular-nums">{job.id}</span>
                  <span className="truncate">{job.title || 'Untitled job'}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0" onClick={() => goTo('issue')}>
            Open
            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Button>
        </div>

        <AiSummaryCard
          label={`AI summary of ${selected.id}`}
          phase={summary?.phase ?? 'idle'}
          thinkingLabel="Reading the job and its activity…"
          idle={(
            <div className="grid justify-items-start gap-2.5 py-1">
              <p className="text-muted-foreground text-xs">
                Get three quick points on this job: where it stands, how far along it is and what happened last.
              </p>
              <Button variant="outline" size="sm" onClick={summarise}>
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" className="text-brand" />
                Summarise
              </Button>
            </div>
          )}
          stale={stale && (
            <>
              <span className="font-medium">Stale — job changed</span>
              <span className="text-muted-foreground">since this summary was written.</span>
            </>
          )}
          note={summary && (summary.stopped ? 'Stopped early' : `Written just now from ${summary.sources} sources`)}
          feedback={summary?.feedback ?? null}
          onFeedback={(feedback) => patch(selected.id, { feedback })}
          onStop={() => patch(selected.id, { phase: 'done', stopped: true })}
          onRegenerate={summarise}
          onCopy={copy}
        >
          {summary && <Bullets summary={summary} />}
        </AiSummaryCard>
      </div>
    </Panel>
  )
}

// The bullets as far as the stream has got.
function revealed(summary: Summary) {
  let left = summary.shown
  return summary.bullets.map((bullet) => {
    const words = bullet.split(/\s+/).filter(Boolean)
    const take = Math.max(0, Math.min(words.length, left))
    left -= words.length
    return words.slice(0, take).join(' ')
  })
}

function Bullets({ summary }: { summary: Summary }) {
  const parts = revealed(summary)
  const lastVisible = parts.reduce((last, text, i) => (text ? i : last), -1)
  const items = parts.filter(Boolean).map((text, i) => (
    <>
      {text}
      {summary.phase === 'streaming' && i === lastVisible && <StreamCaret />}
    </>
  ))
  return <SummaryBullets items={items} />
}
