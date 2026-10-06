import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, QrCodeIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import {
  FormRenderer, FormSubmissionView, FormSubmitted, RESULT_LABEL, RESULT_TONE, summarise, type FormDefinition, type FormSubmission,
} from '@/blocks/form-renderer'
import { FormsCatalogue } from '@/blocks/forms-catalogue'
import { RecordSheet, RecordSheetContent } from '@/blocks/record-sheet'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatRelativeDate, formatShortDate, formatTime } from '@/lib/format'
import { navigate, usePath } from '@/lib/router'
import { plural } from '@/lib/text'
import { Panel } from '@/components/panel'
import { Section } from './shared'
import { FORMS, formById, sampleSubmissions } from './forms-catalogue/forms'

// Forms a business fills in on the spot, from one catalogue: pick a form (or
// scan its QR code, which carries a link straight to it), fill it in, submit
// it, and read it back later. Three blocks: the catalogue, the renderer and
// the submission view; the sample forms are in forms-catalogue/forms.tsx.
// The page's address carries the open form (#/forms-catalogue/vehicle-check
// ?context=SGX%204821), so a QR code can open it.

const PAGE = '/forms-catalogue'

type View = 'all' | 'failed' | 'today'

const formPath = (form: FormDefinition, context?: string) => `${PAGE}/${form.id}${context ? `?context=${encodeURIComponent(context)}` : ''}`
const formLink = (form: FormDefinition, context?: string) => `${window.location.origin}${window.location.pathname}#${formPath(form, context)}`

export default function FormsCatalogueSection() {
  const path = usePath()
  const [route, query = ''] = path.split('?')
  const formId = route.split('/')[2]
  const form = formId ? formById(decodeURIComponent(formId)) : undefined
  const context = new URLSearchParams(query).get('context') ?? undefined

  const [submissions, setSubmissions] = useState(sampleSubmissions)
  const [done, setDone] = useState<FormSubmission | null>(null)
  const [peek, setPeek] = useState<FormSubmission | null>(null)
  const [phone, setPhone] = useState(false)
  const [view, setView] = useState<View>('all')

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
  const shown = submissions.filter((s) => (view === 'failed' ? s.result === 'failed' : view === 'today' ? new Date(s.submittedAt).toDateString() === today : true))

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
    const next = Math.max(1000, ...submissions.map((s) => Number(s.id?.replace(/\D/g, '')) || 0)) + 1
    const saved = { ...submission, id: `SUB-${next}` }
    setSubmissions((all) => [saved, ...all])
    setDone(saved)
    toast.success(`Submitted ${saved.id}`, { description: summarise(form!, saved) })
  }

  const catalogue = (
    <Panel key="catalogue" title="Forms catalogue" note="FormsCatalogue: search, QR codes, a scanner" className="lg:col-span-2">
      <FormsCatalogue
        forms={FORMS}
        meta={meta}
        onOpen={(f) => navigate(formPath(f))}
        href={formLink}
        brand={{ company: 'Northwind Trading', mark: 'initials' }}
        onScan={scanned}
      />
    </Panel>
  )

  const fill = (
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
                <Button size="sm" onClick={() => setPeek(done)}>Open {done.id}</Button>
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
      note={`${plural(shown.length, 'submission')}`}
      action={
        <ToggleGroup type="single" size="sm" variant="outline" value={view} onValueChange={(v) => v && setView(v as View)} aria-label="Show">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="failed">Failed</ToggleGroupItem>
          <ToggleGroupItem value="today">Today</ToggleGroupItem>
        </ToggleGroup>
      }
      bodyClassName="p-0"
      className="lg:col-span-2"
    >
      {shown.length ? (
        <ul className="divide-y">
          {shown.map((s) => {
            const f = formById(s.formId)
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
          <EmptyDescription>Nothing {view === 'failed' ? 'failed' : 'today'}.</EmptyDescription>
        </Empty>
      )}
    </Panel>
  )

  const peekForm = peek ? formById(peek.formId) : undefined

  return (
    <Section
      id="forms-catalogue"
      title="Forms catalogue"
      description="Pick a form or scan its QR code, fill it in on a phone or a desk, and read every submission back"
    >
      {form ? [fill, catalogue, list] : [catalogue, fill, list]}

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
