import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  FormRenderer, FormSubmissionView, FormSubmitted, RESULT_LABEL, summarise, type FormDefinition, type FormSubmission,
} from '@/blocks/form-renderer'
import { FormsCatalogue } from '@/blocks/forms-catalogue'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { navigate, usePath } from '@/lib/router'
import { plural } from '@/lib/text'
import { TODAY, addDays, formatDate } from '../format'
import { go, parseRoute, routeQuery } from '../route'
import { useErp } from '../store'
import type { Row } from '../types'
import { PAGE_HEADER } from '../ui'
import { ERP_FORMS, formById, formLink, formsOf } from './definitions'

// The Forms module's catalogue, and each module's own Forms page: the kit's
// FormsCatalogue block over the ERP's forms. With a form's id after the page
// in the address (…/forms/catalogue/vehicle-check?context=SGX%204821, the
// link a QR code carries) the page is that form, filled in with the kit's
// FormRenderer; submitting it adds a submission record.

// "today", "yesterday" or "28 Sep", against the demo's today.
const lastOn = (date: string) => (date === TODAY ? 'today' : date === addDays(TODAY, -1) ? 'yesterday' : formatDate(date))

export function FormsCataloguePage({ module, title = 'Forms' }: { module?: string; title?: string }) {
  const path = usePath()
  const route = parseRoute(path)
  const form = route.screen === 'app' ? formById(route.rest) : undefined
  const forms = module ? formsOf(module) : ERP_FORMS
  const { data, company } = useErp()

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

  // A scanned code: a link into this app opens what it points to.
  function scanned(value: string) {
    const at = value.indexOf('#/')
    if (at < 0) {
      toast('Not a form link', { description: value.length > 80 ? `${value.slice(0, 80)}…` : value })
      return
    }
    navigate(value.slice(at + 1))
  }

  return (
    <div className="grid gap-4 pb-6">
      <PageHeader
        className={PAGE_HEADER}
        title={title}
        description={`${plural(forms.length, 'form')} · ${plural(today, 'submission')} today`}
      />
      <div className="px-4 @2xl:px-6">
        <FormsCatalogue
          forms={forms}
          meta={meta}
          onOpen={(f) => go(route.screen === 'app' ? route.module : 'forms', route.screen === 'app' ? route.page ?? 'catalogue' : 'catalogue', f.id)}
          href={formLink}
          brand={{ company: company?.name, mark: 'initials' }}
          onScan={scanned}
        />
      </div>
    </div>
  )
}

// "2026-10-01 14:05" from an ISO date-time.
const stamp = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nextNumber(rows: Row[]) {
  const highest = Math.max(1000, ...rows.map((r) => Number(r.id.replace(/\D/g, '')) || 0))
  return `SUB-${highest + 1}`
}

function FillPage({ form, context, back }: { form: FormDefinition; context?: string; back: () => void }) {
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
        <Button size="sm" variant="ghost" onClick={back}>Back to forms</Button>
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

// A submission read back, inside its record peek: the answers as given.
export function SubmissionDetails({ row }: { row: Row }) {
  const form = formById(String(row.formId))
  let values: FormSubmission['values'] = {}
  try {
    values = JSON.parse(String(row.values || '{}'))
  } catch {
    values = {}
  }
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
  return <FormSubmissionView form={form} submission={{ values, context: String(row.context || '') || undefined }} />
}
