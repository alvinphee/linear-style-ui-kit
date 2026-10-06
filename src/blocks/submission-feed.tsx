import { useMemo, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, ClipboardCheckIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { isBadOutcome, isCheckValue } from '@/blocks/form-fields'
import { RESULT_LABEL, RESULT_TONE, fieldsOf, isCheckField, scoreOf, type FormDefinition, type FormScore, type FormSubmission } from '@/blocks/form-renderer'
import { IconMark } from '@/components/mark'
import { Person } from '@/components/person'
import { ProgressRing } from '@/components/progress-ring'
import { StatusBadge } from '@/components/status-badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { formatShortDate, formatTime, relativeDay } from '@/lib/format'
import { plural } from '@/lib/text'

// Submissions as a feed of cards, grouped by day, newest first: the form,
// what it was about, how it came out as a score bar, the checks that
// failed, and who submitted it when. An alternative to the records table
// for a page people glance at rather than sort. SubmissionStats above it
// gives the day's numbers. Both take submissions and the forms they belong
// to as props.

export type FeedSubmission = FormSubmission & { id: string }

// The local calendar day, so a submission at 23:30 and one at 00:30 fall on
// the days the people who made them saw.
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayOf = (iso: string) => localDay(new Date(iso))

// Today, Yesterday or the date, against `now` (an app can fix its today).
function dayLabel(iso: string, now: Date) {
  const date = new Date(iso)
  return relativeDay(date, now) ?? formatShortDate(date, { year: date.getFullYear() !== now.getFullYear() })
}

// The checks that failed, by label.
export function failedChecks(form: FormDefinition, submission: Pick<FormSubmission, 'values'>) {
  return fieldsOf(form).filter((f) => isCheckField(f) && isBadOutcome(f, submission.values[f.key])).map((f) => {
    const v = submission.values[f.key]
    return { key: f.key, label: f.label, note: isCheckValue(v) ? v.note?.trim() : undefined }
  })
}

/* ---------- Score bar ---------- */

// Passed, failed and N/A as one bar in three colours, with the counts.
export function ScoreBar({ score, className }: { score: FormScore; className?: string }) {
  const answered = score.passed + score.failed + score.na
  const total = Math.max(score.total, answered, 1)
  const parts = [
    { label: 'passed', value: score.passed, className: 'bg-status-done' },
    { label: 'failed', value: score.failed, className: 'bg-destructive' },
    { label: 'N/A', value: score.na, className: 'bg-muted-foreground/40' },
  ]
  return (
    <div className={cn('grid gap-1', className)}>
      <div
        role="img"
        aria-label={parts.filter((p) => p.value).map((p) => `${p.value} ${p.label}`).join(', ') || 'No checks answered'}
        className="bg-muted flex h-1.5 w-full gap-px overflow-hidden rounded-full"
      >
        {parts.filter((p) => p.value > 0).map((p) => (
          <span key={p.label} className={cn('h-full rounded-full', p.className)} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-[11px] tabular-nums">
        {parts.map((p) => (
          <span key={p.label} className={cn('inline-flex items-center gap-1', !p.value && 'opacity-60')}>
            <span className={cn('size-1.5 rounded-full', p.className)} aria-hidden="true" />
            {p.value} {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- The feed ---------- */

export function SubmissionFeed({ submissions, forms, onOpen, now = new Date(), empty, className }: {
  submissions: FeedSubmission[]
  // The forms the submissions belong to, by id.
  forms: Record<string, FormDefinition>
  onOpen?: (submission: FeedSubmission) => void
  // What counts as today, for the day headings.
  now?: Date
  empty?: ReactNode
  className?: string
}) {
  const days = useMemo(() => {
    const sorted = [...submissions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    const out: { day: string; items: FeedSubmission[] }[] = []
    for (const s of sorted) {
      const day = dayOf(s.submittedAt)
      const last = out[out.length - 1]
      if (last && last.day === day) last.items.push(s)
      else out.push({ day, items: [s] })
    }
    return out
  }, [submissions])

  if (!days.length) {
    return (
      <Empty className={cn('py-10', className)}>
        <EmptyHeader>
          <EmptyTitle>No submissions</EmptyTitle>
          <EmptyDescription>{empty ?? 'Submitted forms show up here, newest first.'}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className={cn('@container grid min-w-0 gap-5', className)}>
      {days.map(({ day, items }) => {
        const failed = items.filter((s) => s.result === 'failed').length
        return (
          <section key={day} aria-label={dayLabel(items[0].submittedAt, now)} className="grid min-w-0 gap-2">
            <header className="flex items-baseline gap-2 px-0.5">
              <h3 className="text-xs font-semibold tracking-tight">{dayLabel(items[0].submittedAt, now)}</h3>
              <span className="text-muted-foreground text-[11px] tabular-nums">
                {plural(items.length, 'submission')}{failed ? ` · ${failed} failed` : ''}
              </span>
            </header>
            <div className="grid grid-cols-1 gap-2 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {items.map((s) => <SubmissionCard key={s.id} submission={s} form={forms[s.formId]} onOpen={onOpen && (() => onOpen(s))} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function SubmissionCard({ submission, form, onOpen, className }: {
  submission: FeedSubmission
  form?: FormDefinition
  onOpen?: () => void
  className?: string
}) {
  const score = submission.score ?? (form ? scoreOf(form, submission.values) : undefined)
  const fails = form ? failedChecks(form, submission) : []
  const when = formatTime(new Date(submission.submittedAt))
  return (
    <article
      className={cn(
        'bg-card group relative grid min-w-0 gap-3 rounded-lg border p-3.5 transition-colors',
        onOpen && 'hover:border-foreground/15 focus-within:border-foreground/15',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <IconMark icon={form?.icon ?? ClipboardCheckIcon} colour={form?.colour ?? 'var(--brand)'} size="lg" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h4 className="truncate text-xs font-medium">
            {onOpen ? (
              <button type="button" onClick={onOpen} className="focus-visible:ring-ring/40 rounded text-left outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2">
                {form?.name ?? submission.formId}
              </button>
            ) : form?.name ?? submission.formId}
          </h4>
          <p className="text-muted-foreground truncate text-[11px]">
            <span className="font-mono">{submission.id}</span>
            {submission.context && form?.context && <> · {form.context.label} <span className="text-foreground">{submission.context}</span></>}
          </p>
        </div>
        <StatusBadge tone={RESULT_TONE[submission.result]}>{RESULT_LABEL[submission.result]}</StatusBadge>
      </div>

      {score ? <ScoreBar score={score} /> : (
        <p className="text-muted-foreground text-[11px]">{plural(Object.keys(submission.values).length, 'field')} completed</p>
      )}

      {fails.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Failed checks">
          {fails.slice(0, 3).map((f) => (
            <li key={f.key} title={f.note} className="bg-destructive/10 text-destructive max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px]">
              {f.label}
            </li>
          ))}
          {fails.length > 3 && <li className="text-muted-foreground px-1 py-0.5 text-[11px]">+{fails.length - 3} more</li>}
        </ul>
      )}

      <footer className="flex items-center justify-between gap-2">
        {submission.submittedBy ? <Person name={submission.submittedBy} className="min-w-0 text-[11px]" /> : <span />}
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px] tabular-nums">
          {when}
          {onOpen && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
        </span>
      </footer>
    </article>
  )
}

/* ---------- The day's numbers ---------- */

// Four tiles over the feed: submitted today, the pass rate and the failed
// checks over the last seven days, and the forms in use.
export function SubmissionStats({ submissions, forms, now = new Date(), className }: {
  submissions: FeedSubmission[]
  forms: Record<string, FormDefinition>
  now?: Date
  className?: string
}) {
  const stats = useMemo(() => {
    const today = localDay(now)
    const weekAgo = localDay(new Date(now.getTime() - 7 * 86_400_000))
    const todays = submissions.filter((s) => dayOf(s.submittedAt) === today)
    const week = submissions.filter((s) => dayOf(s.submittedAt) >= weekAgo)
    const scored = week.filter((s) => s.result !== 'completed')
    const passRate = scored.length ? Math.round((scored.filter((s) => s.result === 'passed').length / scored.length) * 100) : null
    const failedChecks = week.reduce((t, s) => t + (s.score?.failed ?? (forms[s.formId] ? scoreOf(forms[s.formId], s.values)?.failed ?? 0 : 0)), 0)
    return {
      today: todays.length,
      todayFailed: todays.filter((s) => s.result === 'failed').length,
      passRate,
      failedChecks,
      formsInUse: new Set(week.map((s) => s.formId)).size,
      week: week.length,
    }
  }, [submissions, forms, now])

  const tile = 'bg-card grid min-w-0 content-start gap-1 rounded-lg border px-3.5 py-3'
  const label = 'text-muted-foreground text-[11px]'
  const value = 'text-xl font-semibold tracking-tight tabular-nums'

  return (
    <div className={cn('@container', className)}>
      <dl className="grid grid-cols-2 gap-2 @3xl:grid-cols-4">
        <div className={tile}>
          <dt className={label}>Submitted today</dt>
          <dd className={value}>{stats.today}</dd>
          <dd className={cn(label, stats.todayFailed && 'text-destructive')}>{stats.todayFailed ? `${stats.todayFailed} with fails` : 'none failed'}</dd>
        </div>
        <div className={cn(tile, 'grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3')}>
          <ProgressRing
            value={stats.passRate ?? 0}
            size={44}
            strokeWidth={4}
            colour={stats.passRate !== null && stats.passRate < 80 ? 'var(--destructive)' : 'var(--status-done)'}
            label={stats.passRate === null ? 'Pass rate: no checks yet' : `Pass rate: ${stats.passRate}%`}
            animateIn
            className="row-span-3 text-[11px] font-semibold tabular-nums"
          >
            {stats.passRate === null ? '—' : `${stats.passRate}%`}
          </ProgressRing>
          <dt className={label}>Pass rate</dt>
          <dd className={value}>{stats.passRate === null ? '—' : `${stats.passRate}%`}</dd>
          <dd className={label}>last 7 days</dd>
        </div>
        <div className={tile}>
          <dt className={label}>Failed checks</dt>
          <dd className={cn(value, stats.failedChecks && 'text-destructive')}>{stats.failedChecks}</dd>
          <dd className={label}>last 7 days</dd>
        </div>
        <div className={tile}>
          <dt className={label}>Forms in use</dt>
          <dd className={value}>{stats.formsInUse}</dd>
          <dd className={label}>{plural(stats.week, 'submission')} this week</dd>
        </div>
      </dl>
    </div>
  )
}
