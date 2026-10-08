import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, LayoutGridIcon, Table01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { FormBuilder, blankForm } from '@/blocks/form-builder'
import {
  FormRenderer, FormSubmissionView, FormSubmitted, RESULT_LABEL, summarise, type FormDefinition, type FormResult, type FormSubmission,
} from '@/blocks/form-renderer'
import { FormsCatalogue } from '@/blocks/forms-catalogue'
import { SubmissionFeed, SubmissionStats, type FeedSubmission } from '@/blocks/submission-feed'
import { PageHeader } from '@/components/page-header'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { navigate, usePath } from '@/lib/router'
import { plural } from '@/lib/text'
import { TODAY, addDays, formatDate } from '../format'
import { ListPage } from '../ListPage'
import { go, parseRoute, routeQuery } from '../route'
import { useErp } from '../store'
import type { ListSpec, Row } from '../types'
import { PAGE_HEADER } from '../ui'
import { FORM_ICONS, formLink, type ErpForm } from './definitions'

// The Forms module's pages, and each module's own Forms page, over the
// kit's form blocks: the catalogue (FormsCatalogue), a form being filled in
// (FormRenderer, when the address names one: …/forms/catalogue/vehicle-check
// ?context=SGX%204821, the link a QR code carries), the builder
// (FormBuilder, …/forms/builder or …/forms/builder/<id>), and the
// submissions as cards (SubmissionFeed) or as the records table (ListPage).

// "today", "yesterday" or "28 Sep", against the demo's today.
const lastOn = (date: string) => (date === TODAY ? 'today' : date === addDays(TODAY, -1) ? 'yesterday' : formatDate(date))

// The demo's today, as a date, for the feed's day headings.
const NOW = new Date(`${TODAY}T12:00:00`)

/* ---------- The catalogue, and a form being filled in ---------- */

// A scanned code: a link into this app opens what it points to. The
// catalogue's Scan button and the phone's Scan tab both use it.
export function openScanned(value: string) {
  const at = value.indexOf('#/')
  if (at < 0) {
    toast('Not a form link', { description: value.length > 80 ? `${value.slice(0, 80)}…` : value })
    return
  }
  navigate(value.slice(at + 1))
}

export function FormsCataloguePage({ module, title = 'Forms' }: { module?: string; title?: string }) {
  const path = usePath()
  const route = parseRoute(path)
  const { data, company, forms: allForms } = useErp()
  const form = route.screen === 'app' ? allForms.find((f) => f.id === route.rest) : undefined
  const forms = module ? allForms.filter((f) => f.module === module) : allForms

  const meta = useMemo(() => {
    const out: Record<string, { submissions: number; lastAt?: string }> = {}
    for (const s of data.submissions) {
      const m = (out[String(s.formId)] ??= { submissions: 0 })
      m.submissions++
      m.lastAt ??= lastOn(String(s.submittedAt).slice(0, 10))
    }
    return out
  }, [data.submissions])

  if (form && route.screen === 'app') {
    return <FillPage key={`${form.id}:${routeQuery(path).context ?? ''}`} form={form} context={routeQuery(path).context} back={() => go(route.module, route.page ?? 'catalogue')} />
  }

  const today = data.submissions.filter((s) => String(s.submittedAt).startsWith(TODAY)).length
  const here = route.screen === 'app' ? [route.module, route.page ?? 'catalogue'] : ['forms', 'catalogue']

  return (
    <div className="grid gap-4 pb-6">
      <PageHeader
        className={PAGE_HEADER}
        title={title}
        description={`${plural(forms.length, 'form')} · ${plural(today, 'submission')} today`}
        actions={
          <Button size="sm" onClick={() => go('forms', 'builder')}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New form
          </Button>
        }
      />
      <div className="px-4 @2xl:px-6">
        <FormsCatalogue
          forms={forms}
          meta={meta}
          onOpen={(f) => go(here[0], here[1], f.id)}
          onEdit={(f) => go('forms', 'builder', f.id)}
          href={formLink}
          brand={{ company: company?.name, mark: 'initials' }}
          onScan={openScanned}
        />
      </div>
    </div>
  )
}

// "2026-10-01 14:05" from an ISO date-time, on the demo's today.
const stamp = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nextNumber(rows: Row[]) {
  const highest = Math.max(1000, ...rows.map((r) => Number(r.id.replace(/\D/g, '')) || 0))
  return `SUB-${highest + 1}`
}

// `back` is where Cancel and the last button go: the catalogue, or the
// Inspections page when the checklist was opened from there.
export function FillPage({ form, context, back, backLabel = 'Back to forms' }: {
  form: FormDefinition
  context?: string
  back: () => void
  backLabel?: string
}) {
  const { session, data, add, openPeek, setPageTitle } = useErp()
  const [done, setDone] = useState<FormSubmission | null>(null)

  // The breadcrumb ends with the form's name.
  useEffect(() => {
    setPageTitle(form.name)
    return () => setPageTitle(null)
  }, [form.name, setPageTitle])

  function submit(submission: FormSubmission) {
    const id = nextNumber(data.submissions)
    add('submissions', {
      id,
      form: form.name,
      formId: form.id,
      category: form.category ?? '',
      context: submission.context ?? '',
      result: RESULT_LABEL[submission.result],
      passed: submission.score?.passed ?? 0,
      failed: submission.score?.failed ?? 0,
      submittedBy: submission.submittedBy ?? session?.name ?? 'You',
      submittedAt: stamp(submission.submittedAt),
      values: JSON.stringify(submission.values),
    })
    const saved = { ...submission, id }
    setDone(saved)
    toast.success(`Submitted ${id}`, { description: summarise(form, saved) })
  }

  if (done) {
    return (
      <FormSubmitted form={form} submission={done} className="h-full">
        <Button size="sm" onClick={() => openPeek('submissions', done.id!)}>Open {done.id}</Button>
        <Button size="sm" variant="outline" onClick={() => setDone(null)}>Fill in another</Button>
        <Button size="sm" variant="ghost" onClick={back}>{backLabel}</Button>
      </FormSubmitted>
    )
  }

  return (
    <FormRenderer
      form={form}
      context={context}
      draftKey={`erp:${form.id}:${context ?? ''}`}
      submittedBy={session?.name}
      onSubmit={submit}
      onCancel={back}
      className="min-h-full"
    />
  )
}

/* ---------- The builder ---------- */

// …/forms/builder makes a form; …/forms/builder/<id> edits one. A saved
// form joins the catalogue for this visit (records reset on reload).
export function FormBuilderPage() {
  const path = usePath()
  const route = parseRoute(path)
  const { forms, saveForm, setPageTitle } = useErp()
  const editing = route.screen === 'app' ? forms.find((f) => f.id === route.rest) : undefined

  useEffect(() => {
    setPageTitle(editing ? editing.name : null)
    return () => setPageTitle(null)
  }, [editing, setPageTitle])

  function save(saved: FormDefinition) {
    const form: ErpForm = { ...saved, module: editing?.module ?? 'forms' }
    saveForm(form)
    toast.success(editing ? `Saved ${form.name}` : `Created ${form.name}`, {
      description: editing ? 'A new version. Old submissions keep the fields they were filled in with.' : 'It is in the catalogue, with its own QR code.',
      action: { label: 'Fill it in', onClick: () => go('forms', 'catalogue', form.id) },
    })
    go('forms', 'catalogue')
  }

  return (
    <div className="grid gap-4 pb-2">
      <PageHeader
        className={PAGE_HEADER}
        title={editing ? `Edit ${editing.name}` : 'New form'}
        description={editing ? `Version ${editing.version ?? 1}. Saving makes version ${(editing.version ?? 1) + 1}.` : 'Name it, add sections and fields, and watch it take shape in the preview.'}
      />
      <div className="px-4 @2xl:px-6">
        <FormBuilder
          key={editing?.id ?? 'new'}
          initial={editing ? { ...editing, version: (editing.version ?? 1) + 1 } : blankForm()}
          icons={FORM_ICONS}
          categories={[...new Set(forms.map((f) => f.category).filter((c): c is string => !!c))]}
          onSave={save}
          onCancel={() => go('forms', 'catalogue')}
          saveLabel={editing ? 'Save changes' : 'Create form'}
        />
      </div>
    </div>
  )
}

/* ---------- Submissions ---------- */

type Layout = 'cards' | 'table'
const LAYOUTS: ViewOption<Layout>[] = [
  { value: 'cards', label: 'Cards', icon: LayoutGridIcon },
  { value: 'table', label: 'Table', icon: Table01Icon },
]

const RESULT_OF: Record<string, FormResult> = { Passed: 'passed', Failed: 'failed', Completed: 'completed' }

// A submission record as the feed's submission: the answers read back from JSON.
export function rowToSubmission(row: Row): FeedSubmission {
  let values: FormSubmission['values'] = {}
  try {
    values = JSON.parse(String(row.values || '{}'))
  } catch {
    values = {}
  }
  const [date, time = '00:00'] = String(row.submittedAt).split(' ')
  return {
    id: row.id,
    formId: String(row.formId),
    context: String(row.context || '') || undefined,
    values,
    result: RESULT_OF[String(row.result)] ?? 'completed',
    submittedAt: `${date}T${time}:00`,
    submittedBy: String(row.submittedBy || ''),
  }
}

// Forms › Submissions: the feed of cards with the day's numbers, or the
// records table, switched in the header.
export function SubmissionsPage({ spec }: { spec: ListSpec }) {
  const { data, forms, openPeek } = useErp()
  const [layout, setLayout] = useState<Layout>('cards')
  const formsById = useMemo(() => Object.fromEntries(forms.map((f) => [f.id, f])), [forms])
  const submissions = useMemo(() => data.submissions.map(rowToSubmission), [data.submissions])

  return (
    <div className="flex min-h-full flex-col gap-4 pb-6">
      <PageHeader
        className={PAGE_HEADER}
        title="Submissions"
        description={`${plural(data.submissions.length, 'submission')} · ${plural(data.submissions.filter((r) => String(r.submittedAt).startsWith(TODAY)).length, 'submission')} today`}
        actions={<ViewSwitch views={LAYOUTS} value={layout} onChange={setLayout} showLabels label="Layout" />}
      />
      {layout === 'cards' ? (
        <div className="grid gap-4 px-4 @2xl:px-6">
          <SubmissionStats submissions={submissions} forms={formsById} now={NOW} />
          <SubmissionFeed submissions={submissions} forms={formsById} now={NOW} onOpen={(s) => openPeek('submissions', s.id)} />
        </div>
      ) : (
        <ListPage spec={spec} embedded />
      )}
    </div>
  )
}

// A submission read back, inside its record peek: the answers as given.
export function SubmissionDetails({ row }: { row: Row }) {
  const { forms } = useErp()
  const form = forms.find((f) => f.id === String(row.formId))
  if (!form) {
    return (
      <Empty className="py-6">
        <EmptyHeader>
          <EmptyTitle>Form not found</EmptyTitle>
          <EmptyDescription>This submission belongs to a form that is no longer in the catalogue.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    )
  }
  return <FormSubmissionView form={form} submission={rowToSubmission(row)} />
}
