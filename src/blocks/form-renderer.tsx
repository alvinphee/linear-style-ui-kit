import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import {
  FormControl, emptyValue, fieldError, isAnswered, isBadOutcome, isCheckValue, optionsOf, overBy, photoNames,
  useFieldErrors, type FieldErrors, type FormField, type FormValue, type FormValues,
} from '@/blocks/form-fields'
import { checkOption } from '@/components/check-item'
import { FileChip } from '@/components/file-chip'
import { IconMark } from '@/components/mark'
import { Rating } from '@/components/rating'
import { SignaturePad } from '@/components/signature-pad'
import { StatusBadge, type Tone } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'

// A whole form on a page, drawn from a definition: sections of fields (the
// kit's field schema, form-fields.tsx), a sticky header with the progress, a
// sticky Submit, validation that focuses the first bad field, a review step
// that totals the checks before submitting, and a draft kept in this browser
// so a phone refresh loses nothing. The definition says what the form is
// about; this block does not care: a checklist, an expense claim and a
// survey all render here. A past submission shows with FormSubmissionView.

/* ---------- The definition and the submission ---------- */

export type FormSection = { id: string; title: string; description?: string; fields: FormField[] }

export type FormDefinition = {
  // Names the form in links: 'vehicle-check'.
  id: string
  name: string
  description?: string
  // Groups the form in a catalogue: 'Safety', 'Finance'…
  category?: string
  icon?: IconSvgElement
  colour?: string
  // Kept on each submission, so an old one is read with the fields it had.
  version?: number
  estimatedMinutes?: number
  // What one filling-in is about: a thing named by the link that opened the
  // form (an asset tag), or asked for at the top: { label: 'Vehicle' }.
  context?: { label: string; placeholder?: string; required?: boolean }
  sections: FormSection[]
}

// passed / failed: a form with checks; completed: one without.
export type FormResult = 'passed' | 'failed' | 'completed'
export type FormScore = { passed: number; failed: number; na: number; total: number }

export type FormSubmission = {
  id?: string
  formId: string
  formVersion?: number
  context?: string
  values: FormValues
  result: FormResult
  score?: FormScore
  // ISO date-time.
  submittedAt: string
  submittedBy?: string
}

export const RESULT_LABEL: Record<FormResult, string> = { passed: 'Passed', failed: 'Failed', completed: 'Completed' }
export const RESULT_TONE: Record<FormResult, Tone> = { passed: 'success', failed: 'danger', completed: 'info' }

export const fieldsOf = (form: FormDefinition) => form.sections.flatMap((s) => s.fields)
export const isCheckField = (f: FormField) => f.type === 'check' || f.type === 'yes-no'

// How the checks came out. Nothing for a form without checks.
export function scoreOf(form: FormDefinition, values: FormValues): FormScore | undefined {
  const checks = fieldsOf(form).filter(isCheckField)
  if (!checks.length) return undefined
  const score: FormScore = { passed: 0, failed: 0, na: 0, total: checks.length }
  for (const f of checks) {
    const v = values[f.key]
    if (!isCheckValue(v) || !v.result) continue
    const tone = checkOption(optionsOf(f), v.result)?.tone
    if (tone === 'danger') score.failed++
    else if (tone === 'neutral') score.na++
    else score.passed++
  }
  return score
}

export function resultOf(form: FormDefinition, values: FormValues): FormResult {
  const score = scoreOf(form, values)
  if (!score) return 'completed'
  return score.failed ? 'failed' : 'passed'
}

// "18 passed, 2 failed" or "6 fields".
export function summarise(form: FormDefinition, submission: Pick<FormSubmission, 'values' | 'score'>) {
  const score = submission.score ?? scoreOf(form, submission.values)
  if (!score) return plural(fieldsOf(form).filter((f) => isAnswered(f, submission.values[f.key])).length, 'field')
  const parts = [`${score.passed} passed`]
  if (score.failed) parts.push(`${score.failed} failed`)
  if (score.na) parts.push(`${score.na} N/A`)
  return parts.join(', ')
}

/* ---------- Drafts ---------- */

type Draft = { values: FormValues; context?: string; at: string }
const DRAFT = 'kit:form-draft:'

function loadDraft(key: string): Draft | undefined {
  try {
    const raw = localStorage.getItem(DRAFT + key)
    return raw ? (JSON.parse(raw) as Draft) : undefined
  } catch {
    return undefined
  }
}

function saveDraft(key: string, draft: Draft) {
  try {
    localStorage.setItem(DRAFT + key, JSON.stringify(draft))
  } catch {
    // Storage can be blocked; the form still works for this visit.
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(DRAFT + key)
  } catch {
    // Nothing to clear.
  }
}

/* ---------- FormRenderer ---------- */

const CONTEXT_KEY = '__context'

export function FormRenderer({
  form, context, initialValues, draftKey, onSubmit, onCancel, submittedBy, submitLabel = 'Submit', stickyClassName = 'top-0',
  inset = 'px-4 @2xl:px-6', className,
}: {
  form: FormDefinition
  // What this filling-in is about, when the link that opened the form says
  // (a scanned asset tag). Otherwise the form asks, if it has a context.
  context?: string
  initialValues?: FormValues
  // Keep what is entered in this browser under this key, and bring it back
  // next time, until the form is submitted.
  draftKey?: string
  // Return a promise and the button shows a spinner until it settles.
  onSubmit: (submission: FormSubmission) => void | Promise<void>
  onCancel?: () => void
  submittedBy?: string
  submitLabel?: string
  // Where the sticky header sticks, when the page has a fixed bar of its own: 'top-11'.
  stickyClassName?: string
  // The side padding, matched to the page.
  inset?: string
  className?: string
}) {
  const uid = useId()
  const fields = useMemo(() => fieldsOf(form), [form])
  const draft = useMemo(() => (draftKey ? loadDraft(draftKey) : undefined), [draftKey])
  const [values, setValues] = useState<FormValues>(() => ({
    ...Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)])),
    ...initialValues,
    ...draft?.values,
  }))
  const [ctx, setCtx] = useState(context ?? draft?.context ?? '')
  const [dirty, setDirty] = useState(!!draft)
  const [reviewing, setReviewing] = useState(false)
  const [pending, setPending] = useState(false)

  const asksContext = !!form.context && !context
  const all: FieldErrors<string> = {}
  if (asksContext && form.context?.required !== false && !ctx.trim()) all[CONTEXT_KEY] = `Enter ${form.context!.label.toLowerCase()}.`
  for (const f of fields) all[f.key] = fieldError(f, values[f.key], values)
  const errors = useFieldErrors(all, [...(asksContext ? [CONTEXT_KEY] : []), ...fields.map((f) => f.key)])

  // The draft follows every change.
  useEffect(() => {
    if (draftKey && dirty) saveDraft(draftKey, { values, context: ctx, at: new Date().toISOString() })
  }, [draftKey, dirty, values, ctx])

  function set(key: string, value: FormValue) {
    setValues((v) => ({ ...v, [key]: value }))
    setDirty(true)
  }

  const answered = fields.filter((f) => isAnswered(f, values[f.key])).length
  const left = fields.length - answered
  const score = scoreOf(form, values)
  const failing = fields.filter((f) => isBadOutcome(f, values[f.key]))

  function review(e: FormEvent) {
    e.preventDefault()
    if (errors.check()) setReviewing(true)
  }

  async function submit() {
    const clean = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]))
    const submission: FormSubmission = {
      formId: form.id,
      formVersion: form.version,
      context: ctx.trim() || undefined,
      values: clean,
      result: resultOf(form, clean),
      score: scoreOf(form, clean),
      submittedAt: new Date().toISOString(),
      submittedBy,
    }
    let done = false
    setPending(true)
    try {
      await onSubmit(submission)
      done = true
    } finally {
      setPending(false)
    }
    if (!done) return
    if (draftKey) clearDraft(draftKey)
    setReviewing(false)
  }

  const about = [
    context && form.context ? `${form.context.label} ${context}` : null,
    form.estimatedMinutes ? `about ${plural(form.estimatedMinutes, 'minute')}` : null,
    form.version ? `v${form.version}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <form noValidate onSubmit={review} className={cn('@container relative grid min-w-0 content-start gap-4', className)}>
      <header className={cn('bg-background/90 sticky z-10 grid gap-2.5 border-b pt-3 pb-3 backdrop-blur', stickyClassName, inset)}>
        <div className="flex items-start gap-3">
          {form.icon && <IconMark icon={form.icon} colour={form.colour ?? 'var(--brand)'} size="lg" />}
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h2 className="truncate text-sm font-semibold tracking-tight">{form.name}</h2>
            {(about || form.description) && <p className="text-muted-foreground truncate text-xs">{about || form.description}</p>}
          </div>
          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums" aria-hidden="true">{answered} of {fields.length}</span>
        </div>
        <Progress value={fields.length ? (answered / fields.length) * 100 : 0} aria-label={`${answered} of ${fields.length} answered`} />
      </header>

      <div className={cn('grid min-w-0 gap-4', inset)}>
        {asksContext && form.context && (
          <Field data-invalid={!!errors.shown[CONTEXT_KEY]} className="bg-card rounded-lg border p-3.5">
            <FieldLabel htmlFor={`${uid}-context`}>
              {form.context.label}
              {form.context.required === false && <span className="text-muted-foreground font-normal"> Optional</span>}
            </FieldLabel>
            <Input
              id={`${uid}-context`}
              ref={errors.register(CONTEXT_KEY)}
              value={ctx}
              placeholder={form.context.placeholder}
              onChange={(e) => {
                setCtx(e.target.value)
                setDirty(true)
              }}
              onBlur={(e) => errors.blur(CONTEXT_KEY, e.target.value)}
              aria-invalid={errors.shown[CONTEXT_KEY] ? true : undefined}
              autoComplete="off"
            />
            {errors.shown[CONTEXT_KEY] && <FieldError>{errors.shown[CONTEXT_KEY]}</FieldError>}
          </Field>
        )}

        {form.sections.map((section) => {
          const done = section.fields.filter((f) => isAnswered(f, values[f.key])).length
          return (
            <section key={section.id} aria-labelledby={`${uid}-${section.id}`} className="bg-card min-w-0 rounded-lg border">
              <header className="flex items-baseline justify-between gap-3 border-b px-3.5 py-2.5">
                <div className="grid min-w-0 gap-0.5">
                  <h3 id={`${uid}-${section.id}`} className="text-xs font-medium">{section.title}</h3>
                  {section.description && <p className="text-muted-foreground text-[11px]">{section.description}</p>}
                </div>
                <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{done}/{section.fields.length}</span>
              </header>
              {runs(section.fields).map((run, i) =>
                run.checks ? (
                  <div key={i} className="divide-y border-b last:border-b-0">
                    {run.fields.map((f) => (
                      <div key={f.key} className="px-3.5 py-3">
                        {control(f)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <FieldGroup key={i} className="border-b p-3.5 last:border-b-0">
                    {run.fields.map(control)}
                  </FieldGroup>
                ),
              )}
            </section>
          )
        })}
      </div>

      <footer className={cn('bg-background/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t py-3 backdrop-blur', inset)}>
        <span className="text-muted-foreground text-[11px]">
          {left ? plural(left, 'question') + ' left' : 'Everything answered'}
          {draftKey && dirty && ' · draft kept in this browser'}
        </span>
        <div className="flex gap-2">
          {onCancel && <Button type="button" variant="ghost" onClick={onCancel} className="pointer-coarse:h-10">Cancel</Button>}
          <Button type="submit" className="pointer-coarse:h-10 pointer-coarse:px-4">{submitLabel}</Button>
        </div>
      </footer>

      <Dialog open={reviewing} onOpenChange={(open) => !pending && setReviewing(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit {form.name}?</DialogTitle>
            <DialogDescription>
              {ctx.trim() && form.context ? `${form.context.label} ${ctx.trim()}. ` : ''}
              {score ? 'Check the outcome before you submit.' : `${answered} of ${fields.length} fields answered.`}
            </DialogDescription>
          </DialogHeader>
          {score && <ScoreTiles score={score} />}
          {failing.length > 0 && (
            <ul className="grid gap-1.5 text-xs">
              {failing.map((f) => {
                const v = values[f.key]
                return (
                  <li key={f.key} className="flex gap-2">
                    <span className="bg-destructive mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="font-medium">{f.label}</span>
                      {isCheckValue(v) && v.note?.trim() && <span className="text-muted-foreground"> · {v.note.trim()}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setReviewing(false)}>Back</Button>
            <Button type="button" onClick={submit} aria-busy={pending || undefined}>
              {pending && <Spinner aria-hidden="true" data-icon="inline-start" className="size-3.5" />}
              {pending ? 'Submitting…' : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )

  // A helper, not a component: a component declared here would be a new
  // type on every render, remounting its field and dropping focus as you type.
  function control(field: FormField) {
    return (
      <FormControl
        key={field.key}
        field={field}
        id={`${uid}-${field.key}`}
        value={values[field.key]}
        error={errors.shown[field.key] ?? (overBy(field, values[field.key]) > 0 ? all[field.key] : undefined)}
        tooLong={overBy(field, values[field.key]) > 0}
        inputRef={errors.register(field.key)}
        onChange={(value) => set(field.key, value)}
        onBlur={(value) => errors.blur(field.key, value)}
      />
    )
  }
}

// Consecutive checks make a divided list; other fields stand in a group.
function runs(fields: FormField[]) {
  const out: { checks: boolean; fields: FormField[] }[] = []
  for (const f of fields) {
    const checks = isCheckField(f)
    const last = out[out.length - 1]
    if (last && last.checks === checks) last.fields.push(f)
    else out.push({ checks, fields: [f] })
  }
  return out
}

// Passed / Failed / N/A, as three numbers.
export function ScoreTiles({ score, className }: { score: FormScore; className?: string }) {
  const tiles = [
    { label: 'Passed', value: score.passed, className: 'text-status-done' },
    { label: 'Failed', value: score.failed, className: score.failed ? 'text-destructive' : 'text-muted-foreground' },
    { label: 'N/A', value: score.na, className: 'text-muted-foreground' },
  ]
  return (
    <dl className={cn('grid grid-cols-3 gap-2', className)}>
      {tiles.map((t) => (
        <div key={t.label} className="bg-muted/40 grid gap-0.5 rounded-lg border px-3 py-2">
          <dd className={cn('text-lg font-semibold tracking-tight tabular-nums', t.className)}>{t.value}</dd>
          <dt className="text-muted-foreground text-[11px]">{t.label}</dt>
        </div>
      ))}
    </dl>
  )
}

/* ---------- After submitting ---------- */

// The success screen: what was submitted and how it came out, with the
// actions that follow (open it, fill in another, back to the list).
export function FormSubmitted({ form, submission, children, className }: {
  form: FormDefinition
  submission: FormSubmission
  children?: ReactNode
  className?: string
}) {
  const failed = submission.result === 'failed'
  return (
    <Empty className={cn('min-h-80', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={failed ? 'text-destructive' : 'text-status-done'}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{failed ? 'Submitted, with fails' : 'Submitted'}</EmptyTitle>
        <EmptyDescription>
          {form.name}{submission.context && form.context ? ` for ${form.context.label.toLowerCase()} ${submission.context}` : ''}
          {submission.id ? ` is ${submission.id}` : ''} · {summarise(form, submission)}.
        </EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent className="flex-row flex-wrap justify-center">{children}</EmptyContent>}
    </Empty>
  )
}

/* ---------- A past submission ---------- */

// A submission read back, section by section: each check with its outcome,
// note and photo; each field with its answer.
export function FormSubmissionView({ form, submission, className }: {
  form: FormDefinition
  submission: Pick<FormSubmission, 'values' | 'context'>
  className?: string
}) {
  const { values } = submission
  return (
    <div className={cn('@container grid min-w-0 gap-4', className)}>
      {form.sections.map((section) => (
        <section key={section.id} className="grid min-w-0 gap-1">
          <h4 className="text-muted-foreground text-[11px] font-medium">{section.title}</h4>
          <div className="divide-y rounded-lg border">
            {section.fields.map((f) => (
              <div key={f.key} className="px-3 py-2">
                {isCheckField(f) ? <CheckRow field={f} value={values[f.key]} /> : <ValueRow field={f} value={values[f.key]} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function CheckRow({ field, value }: { field: FormField; value: FormValue | undefined }) {
  const check = isCheckValue(value) ? value : { result: '' }
  const option = checkOption(optionsOf(field), check.result)
  const photos = photoNames(check.photo)
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
      <div className="grid min-w-0 flex-1 basis-40 gap-1">
        <span className="text-xs">{field.label}</span>
        {check.note?.trim() && <p className="text-muted-foreground text-[11px]">{check.note.trim()}</p>}
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {photos.map((n) => <FileChip key={n} name={n} className="h-6" />)}
          </div>
        )}
      </div>
      {option
        ? <StatusBadge tone={option.tone}>{option.label}</StatusBadge>
        : <StatusBadge tone="neutral" dot={false}>Not answered</StatusBadge>}
    </div>
  )
}

function ValueRow({ field, value }: { field: FormField; value: FormValue | undefined }) {
  return (
    <div className="grid gap-0.5 @md:grid-cols-[10rem_minmax(0,1fr)] @md:gap-3">
      <dt className="text-muted-foreground text-[11px] @md:pt-0.5 @md:text-xs">{field.label}</dt>
      <dd className="min-w-0 text-xs">{shown(field, value)}</dd>
    </div>
  )
}

function shown(field: FormField, value: FormValue | undefined): ReactNode {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (isCheckValue(value)) return value.result || '—'
  const text = (value ?? '').trim()
  if (!text) return <span className="text-muted-foreground">—</span>
  if (field.type === 'rating') return <Rating value={Number(text) || 0} max={field.max} labels={field.ratingLabels} readOnly size="sm" label={field.label} />
  if (field.type === 'signature') return <SignaturePad value={text} readOnly height={72} label={field.label} className="max-w-64" />
  if (field.type === 'photo') {
    return (
      <div className="flex flex-wrap gap-1">
        {photoNames(text).map((n) => <FileChip key={n} name={n} className="h-6" />)}
      </div>
    )
  }
  if (field.type === 'select' || field.type === 'radio') return field.options?.find((o) => o.value === text)?.label ?? text
  if (field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(text)) return formatShortDate(new Date(`${text}T00:00:00`), { year: true })
  if (field.prefix) return `${field.prefix}${text}`
  return <span className="whitespace-pre-wrap">{text}</span>
}
