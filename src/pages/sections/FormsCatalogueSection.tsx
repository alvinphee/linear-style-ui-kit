import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, LayoutGridIcon, LeftToRightListBulletIcon, QrCodeIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { FormBuilder, blankForm, fromStoredForm, toStoredForm, type StoredForm } from '@/blocks/form-builder'
import {
  FormRenderer, FormSubmissionView, FormSubmitted, RESULT_LABEL, RESULT_TONE, summarise, type FormDefinition, type FormSubmission,
} from '@/blocks/form-renderer'
import { FormsCatalogue } from '@/blocks/forms-catalogue'
import { RecordSheet, RecordSheetContent } from '@/blocks/record-sheet'
import { SubmissionFeed, SubmissionStats, type FeedSubmission } from '@/blocks/submission-feed'
import { Panel } from '@/components/panel'
import { StatusBadge } from '@/components/status-badge'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatRelativeDate, formatShortDate, formatTime } from '@/lib/format'
import { navigate, usePath } from '@/lib/router'
import { plural } from '@/lib/text'
import { Section } from './shared'
import { FORMS, FORM_ICONS, sampleSubmissions } from './forms-catalogue/forms'

// Forms a business fills in on the spot, from one catalogue: pick a form (or
// scan its QR code, which carries a link straight to it), fill it in, submit
// it, and read it back later. New forms are made in the builder. Four
// blocks: the catalogue, the renderer, the builder and the submission feed;
// the sample forms are in forms-catalogue/forms.tsx. The page's address
// carries what is open: a form to fill in (#/forms-catalogue/vehicle-check
// ?context=SGX%204821, what a QR code holds), the builder (…/new) or a form
// in the builder (…/edit/vehicle-check).

const PAGE = '/forms-catalogue'

type Filter = 'all' | 'failed' | 'today'
type Layout = 'cards' | 'list'

const LAYOUTS: ViewOption<Layout>[] = [
  { value: 'cards', label: 'Cards', icon: LayoutGridIcon },
  { value: 'list', label: 'List', icon: LeftToRightListBulletIcon },
]

// Forms made or edited here, kept in this browser (the samples stay in code).
const STORED = 'kit:forms:v1'

function loadForms(): FormDefinition[] {
  try {
    const own = (JSON.parse(localStorage.getItem(STORED) ?? '[]') as StoredForm[]).map((s) => fromStoredForm(s, FORM_ICONS))
    return [...FORMS.filter((f) => !own.some((o) => o.id === f.id)), ...own]
  } catch {
    return FORMS
  }
}

function keepForms(forms: FormDefinition[]) {
  try {
    const own = forms.filter((f) => f !== FORMS.find((s) => s.id === f.id))
    localStorage.setItem(STORED, JSON.stringify(own.map((f) => toStoredForm(f, FORM_ICONS))))
  } catch {
    // Storage can be blocked; the forms still work for this visit.
  }
}

const formPath = (form: FormDefinition, context?: string) => `${PAGE}/${form.id}${context ? `?context=${encodeURIComponent(context)}` : ''}`
const formLink = (form: FormDefinition, context?: string) => `${window.location.origin}${window.location.pathname}#${formPath(form, context)}`

export default function FormsCatalogueSection() {
  const path = usePath()
  const [route, query = ''] = path.split('?')
  const [, , first, second] = route.split('/')
  const [forms, setForms] = useState<FormDefinition[]>(loadForms)
  const formsById = useMemo(() => Object.fromEntries(forms.map((f) => [f.id, f])), [forms])

  const building = first === 'new' || first === 'edit'
  const editing = first === 'edit' && second ? formsById[decodeURIComponent(second)] : undefined
  const form = !building && first ? formsById[decodeURIComponent(first)] : undefined
  const context = new URLSearchParams(query).get('context') ?? undefined

  const [submissions, setSubmissions] = useState<FeedSubmission[]>(() => sampleSubmissions().map((s) => ({ ...s, id: s.id! })))
  const [done, setDone] = useState<FormSubmission | null>(null)
  const [peek, setPeek] = useState<FeedSubmission | null>(null)
  const [phone, setPhone] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [layout, setLayout] = useState<Layout>('cards')

  // A new form opened: the success screen of the last one goes.
  useEffect(() => setDone(null), [form, context])

  const meta = useMemo(() => {
    const out: Record<string, { submissions: number; lastAt?: string }> = {}
    for (const s of submissions) {
      const m = (out[s.formId] ??= { submissions: 0 })
      m.submissions++
      m.lastAt ??= formatRelativeDate(new Date(s.submittedAt)).replace(/^(Today|Yesterday)$/, (d) => d.toLowerCase())
    }
    return out
  }, [submissions])

  const today = new Date().toDateString()
  const shown = submissions.filter((s) => (filter === 'failed' ? s.result === 'failed' : filter === 'today' ? new Date(s.submittedAt).toDateString() === today : true))

  function scanned(value: string) {
    const at = value.indexOf('#/')
    if (at < 0) {
      toast('Not a form link', { description: value.length > 80 ? `${value.slice(0, 80)}…` : value })
      return
    }
    navigate(value.slice(at + 1))
    toast.success('Code read', { description: 'Opening the form it points to.' })
  }

  function submit(submission: FormSubmission) {
    const next = Math.max(1000, ...submissions.map((s) => Number(s.id.replace(/\D/g, '')) || 0)) + 1
    const saved: FeedSubmission = { ...submission, id: `SUB-${next}` }
    setSubmissions((all) => [saved, ...all])
    setDone(saved)
    toast.success(`Submitted ${saved.id}`, { description: summarise(form!, saved) })
  }

  function saveForm(saved: FormDefinition) {
    const exists = forms.some((f) => f.id === saved.id)
    const next = exists ? forms.map((f) => (f.id === saved.id ? { ...saved, version: (f.version ?? 1) + 1 } : f)) : [...forms, saved]
    setForms(next)
    keepForms(next)
    toast.success(exists ? `Saved ${saved.name}` : `Created ${saved.name}`, {
      description: exists ? 'A new version, kept in this browser. Old submissions keep the fields they were filled in with.' : 'It is in the catalogue with its own QR code, and kept in this browser.',
      action: { label: 'Fill it in', onClick: () => navigate(formPath(saved)) },
    })
    navigate(PAGE)
  }

  const catalogue = (
    <Panel key="catalogue" title="Forms catalogue" note="FormsCatalogue: search, QR codes, a scanner, New form" className="lg:col-span-2">
      <FormsCatalogue
        forms={forms}
        meta={meta}
        onOpen={(f) => navigate(formPath(f))}
        onEdit={(f) => navigate(`${PAGE}/edit/${f.id}`)}
        href={formLink}
        brand={{ company: 'Northwind Trading', mark: 'initials' }}
        onScan={scanned}
        actions={
          <Button onClick={() => navigate(`${PAGE}/new`)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New form
          </Button>
        }
      />
    </Panel>
  )

  const builder = building && (
    <Panel
      key="builder"
      title={editing ? `Edit ${editing.name}` : 'New form'}
      note="FormBuilder: details, sections, fields, a live preview"
      action={
        <Button variant="ghost" size="xs" onClick={() => navigate(PAGE)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" /> Catalogue
        </Button>
      }
      className="lg:col-span-2"
    >
      <FormBuilder
        key={editing?.id ?? 'new'}
        initial={editing ?? blankForm()}
        icons={FORM_ICONS}
        categories={[...new Set(forms.map((f) => f.category).filter((c): c is string => !!c))]}
        onSave={saveForm}
        onCancel={() => navigate(PAGE)}
        saveLabel={editing ? 'Save changes' : 'Create form'}
      />
    </Panel>
  )

  const fill = !building && (
    <Panel
      key="fill"
      title={form ? form.name : 'Fill in a form'}
      note={form ? `FormRenderer · #${formPath(form, context)}` : 'FormRenderer'}
      action={form && (
        <div className="flex items-center gap-3">
          <Label htmlFor="fc-phone" className="text-muted-foreground gap-1.5 text-[11px] font-normal">
            <Switch id="fc-phone" size="sm" checked={phone} onCheckedChange={setPhone} /> Phone width
          </Label>
          <Button variant="ghost" size="xs" onClick={() => navigate(PAGE)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" /> Catalogue
          </Button>
        </div>
      )}
      bodyClassName="p-0"
      className="lg:col-span-2"
    >
      {form ? (
        <div className={cn('bg-background', phone ? 'bg-muted/30 py-6' : '')}>
          <div className={cn('@container relative overflow-y-auto', phone ? 'bg-background mx-auto h-[640px] w-[375px] max-w-full rounded-xl border shadow-sm' : 'max-h-[70vh] rounded-b-lg')}>
            {done ? (
              <FormSubmitted form={form} submission={done} className="h-full">
                <Button size="sm" onClick={() => setPeek(done as FeedSubmission)}>Open {done.id}</Button>
                <Button size="sm" variant="outline" onClick={() => setDone(null)}>Fill in another</Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(PAGE)}>Back to the catalogue</Button>
              </FormSubmitted>
            ) : (
              <FormRenderer
                key={`${form.id}:${context ?? ''}:${submissions.length}`}
                form={form}
                context={context}
                draftKey={`kit:${form.id}:${context ?? ''}`}
                submittedBy="You"
                onSubmit={submit}
                onCancel={() => navigate(PAGE)}
                inset="px-4"
              />
            )}
          </div>
        </div>
      ) : (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon"><HugeiconsIcon icon={QrCodeIcon} strokeWidth={2} /></EmptyMedia>
            <EmptyTitle>Pick a form, or scan its code</EmptyTitle>
            <EmptyDescription>
              Open a form from the catalogue above, or scan one of its QR codes. The code's link opens the form here, for the thing the code was fixed to.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" variant="outline" onClick={() => navigate(formPath(FORMS[0], 'SGX 4821'))}>
              Try it: open the vehicle check for SGX 4821 <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </Panel>
  )

  const list = (
    <Panel
      key="submissions"
      title="Submissions"
      note={layout === 'cards' ? 'SubmissionStats and SubmissionFeed' : plural(shown.length, 'submission')}
      action={
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" size="sm" variant="outline" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} aria-label="Show">
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="failed">Failed</ToggleGroupItem>
            <ToggleGroupItem value="today">Today</ToggleGroupItem>
          </ToggleGroup>
          <ViewSwitch views={LAYOUTS} value={layout} onChange={setLayout} label="Layout" />
        </div>
      }
      bodyClassName={layout === 'list' ? 'p-0' : undefined}
      className="lg:col-span-2"
    >
      {layout === 'cards' ? (
        <div className="grid gap-4">
          <SubmissionStats submissions={submissions} forms={formsById} />
          <SubmissionFeed submissions={shown} forms={formsById} onOpen={setPeek} empty={filter === 'all' ? undefined : `Nothing ${filter === 'failed' ? 'failed' : 'today'}.`} />
        </div>
      ) : shown.length ? (
        <ul className="divide-y">
          {shown.map((s) => {
            const f = formsById[s.formId]
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setPeek(s)}
                  className="hover:bg-accent/40 focus-visible:bg-accent flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2 text-left text-xs outline-none"
                >
                  <span className="text-muted-foreground w-20 shrink-0 font-mono text-[11px]">{s.id}</span>
                  <span className="min-w-0 flex-1 basis-40 truncate font-medium">
                    {f?.name ?? s.formId}
                    {s.context && <span className="text-muted-foreground font-normal"> · {s.context}</span>}
                  </span>
                  <StatusBadge tone={RESULT_TONE[s.result]}>{RESULT_LABEL[s.result]}</StatusBadge>
                  <span className="text-muted-foreground hidden truncate text-[11px] @md:inline">{f ? summarise(f, s) : ''}</span>
                  <span className="text-muted-foreground hidden shrink-0 text-[11px] sm:inline">{s.submittedBy}</span>
                  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">{formatRelativeDate(new Date(s.submittedAt), { time: true })}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="py-8">
          <EmptyDescription>Nothing {filter === 'failed' ? 'failed' : 'today'}.</EmptyDescription>
        </Empty>
      )}
    </Panel>
  )

  const peekForm = peek ? formsById[peek.formId] : undefined

  return (
    <Section
      id="forms-catalogue"
      title="Forms catalogue"
      description="Pick a form or scan its QR code, fill it in on a phone or a desk, read every submission back, and build new forms"
    >
      {building ? [builder, catalogue, list] : form ? [fill, catalogue, list] : [catalogue, fill, list]}

      <RecordSheet open={!!peek} onOpenChange={(open) => !open && setPeek(null)}>
        {peek && peekForm && (
          <RecordSheetContent
            key={peek.id}
            number={peek.id}
            badge={<StatusBadge tone={RESULT_TONE[peek.result]}>{RESULT_LABEL[peek.result]}</StatusBadge>}
            title={peekForm.name}
            description={`Submission ${peek.id}: every answer as it was given.`}
            noun="submission"
            detailsTitle="Submission"
            details={[
              ...(peek.context && peekForm.context ? [{ label: peekForm.context.label, value: peek.context }] : []),
              { label: 'Outcome', value: summarise(peekForm, peek) },
              { label: 'Submitted by', value: peek.submittedBy ?? '—' },
              { label: 'When', value: `${formatShortDate(new Date(peek.submittedAt))}, ${formatTime(new Date(peek.submittedAt))}` },
              { label: 'Form version', value: `v${peek.formVersion ?? peekForm.version ?? 1}` },
            ]}
          >
            <FormSubmissionView form={peekForm} submission={peek} />
          </RecordSheetContent>
        )}
      </RecordSheet>
    </Section>
  )
}
