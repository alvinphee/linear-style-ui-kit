import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, SentIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { PageHeader } from '@/components/page-header'
import { StatusBadge as KitStatusBadge, TONE_CLASS } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { usePath } from '@/lib/router'
import { plural } from '@/lib/text'
import { TODAY, addDays, formatDate } from '../format'
import { FillPage } from '../forms/FormsPages'
import { ListPage } from '../ListPage'
import { go, parseRoute, routeQuery } from '../route'
import { useErp } from '../store'
import { INSPECTION_CATEGORY, type ListSpec, type Row } from '../types'
import { PAGE_HEADER, StatusBadge } from '../ui'
import { bumpVersion, riskRating, riskScore, type DocumentVersion, type Hazard, type RiskRating } from './sample'

// The Workplace safety and health (WSH) module's own parts: the Inspections
// page, and two sections shown inside a record's peek (a safety document's
// version history with Publish, and a risk assessment's hazards on the 5 × 5
// risk matrix). The other lists are ListPages from their specs in
// modules.tsx; the overview is in pages/Overview.tsx with the other modules'.

/* ---------- Inspections ---------- */

// An inspection is a filled-in checklist, like a paper form handed in: pick
// one from New inspection, fill it in, submit, and it is on this list with
// its result. The records are the Forms module's submissions, only those of
// checklists in the Inspections category. …/wsh/inspections/<form> is a
// checklist being filled in from here, so Done comes back to this list.
export function InspectionsPage({ spec }: { spec: ListSpec }) {
  const path = usePath()
  const route = parseRoute(path)
  const { data, forms } = useErp()
  const checklists = useMemo(() => forms.filter((f) => f.category === INSPECTION_CATEGORY), [forms])
  const form = route.screen === 'app' ? checklists.find((f) => f.id === route.rest) : undefined
  const rows = data.submissions.filter((r) => r.category === INSPECTION_CATEGORY)
  const today = rows.filter((r) => String(r.submittedAt).startsWith(TODAY))

  if (form) {
    return (
      <FillPage
        key={`${form.id}:${routeQuery(path).context ?? ''}`}
        form={form}
        context={routeQuery(path).context}
        back={() => go('wsh', 'inspections')}
        backLabel="Back to inspections"
      />
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        className={PAGE_HEADER}
        title="Inspections"
        description={`${plural(rows.length, 'inspection')} · ${plural(today.length, 'inspection')} today · ${plural(today.filter((r) => r.result === 'Failed').length, 'fail')}`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New inspection
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Which checklist?</DropdownMenuLabel>
              {checklists.map((f) => (
                <DropdownMenuItem key={f.id} onSelect={() => go('wsh', 'inspections', f.id)} className="items-start gap-2.5 py-2">
                  {f.icon && <IconMark icon={f.icon} colour={f.colour ?? 'var(--brand)'} size="sm" className="mt-0.5" />}
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-medium">{f.name}</span>
                    <span className="text-muted-foreground line-clamp-2 text-[11px]">{f.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => go('forms', 'builder')}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Make a new checklist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <ListPage spec={spec} embedded />
    </div>
  )
}

function parse<T>(json: unknown, fallback: T): T {
  try {
    return JSON.parse(String(json || '')) as T
  } catch {
    return fallback
  }
}

/* ---------- Safety documents: versions ---------- */

// Every approved version, newest first, and a line to publish the next.
// Publishing a minor version (3.2 → 3.3) or a major one (→ 4.0) approves
// the document from today, sets the next review a year out and keeps the
// old version in the history. A draft's first publish makes it 1.0.
export function DocumentVersions({ row }: { row: Row }) {
  const { update, session } = useErp()
  const history = parse<DocumentVersion[]>(row.versions, [])
  const [note, setNote] = useState('')
  const current = String(row.version || '0.1')
  const draft = row.status === 'Draft' || current.startsWith('0.')

  function publish(major: boolean) {
    const version = draft ? '1.0' : bumpVersion(current, major)
    const entry: DocumentVersion = { version, date: TODAY, author: session?.name ?? 'You', note: note.trim() || (draft ? 'First approved issue' : 'Reviewed, no change to the method') }
    update('safetyDocuments', [row.id], {
      version,
      effective: TODAY,
      reviewDue: addDays(TODAY, row.type === 'Policy' ? 730 : 365),
      status: 'Approved',
      versions: JSON.stringify([entry, ...history]),
    })
    setNote('')
    toast.success(`Published ${row.title} v${version}`, { description: `Approved from today. Next review ${formatDate(addDays(TODAY, 365), true)}.` })
  }

  return (
    <section aria-label="Version history" className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium">Version history</h3>
        <span className="text-muted-foreground text-[11px] tabular-nums">v{current} {draft ? 'draft' : 'current'}</span>
      </div>
      {history.length ? (
        <ol className="grid gap-px">
          {history.map((v, i) => (
            <li key={`${v.version}-${v.date}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 odd:bg-muted/40">
              <span className={cn('w-10 shrink-0 font-mono text-[11px] tabular-nums', i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>v{v.version}</span>
              <span className="min-w-0 flex-1 basis-40 truncate">{v.note}</span>
              <span className="text-muted-foreground shrink-0 text-[11px] whitespace-nowrap tabular-nums">{v.author} · {formatDate(v.date, true)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">Not published yet. The first publish makes version 1.0.</p>
      )}
      <form
        className="flex flex-wrap items-center gap-1.5 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          publish(false)
        }}
      >
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={draft ? 'What this first issue covers' : 'What changed in this version'}
          aria-label="Change note"
          className="min-w-0 flex-1 basis-48"
          maxLength={120}
        />
        <Button type="submit" size="sm">
          <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-start" /> Publish v{draft ? '1.0' : bumpVersion(current)}
        </Button>
        {!draft && (
          <Button type="button" size="sm" variant="outline" onClick={() => publish(true)}>Major v{bumpVersion(current, true)}</Button>
        )}
      </form>
    </section>
  )
}

/* ---------- Risk assessments: the matrix and the hazards ---------- */

const RATING_TONE: Record<RiskRating, 'success' | 'warning' | 'danger'> = { Low: 'success', Medium: 'warning', High: 'danger' }
const SCALE = [1, 2, 3, 4, 5] as const
const SEVERITY = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic']
const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain']

// The 5 × 5 risk matrix: severity down the side, likelihood along the
// bottom, each cell coloured by its band and showing how many hazards sit
// there. The hazards are listed under it, worst first, with their controls.
export function RiskAssessmentDetails({ row }: { row: Row }) {
  const hazards = parse<Hazard[]>(row.hazardsJson, [])
  const at = (s: number, l: number) => hazards.filter((h) => h.severity === s && h.likelihood === l).length
  const sorted = [...hazards].sort((a, b) => riskScore(b) - riskScore(a))

  return (
    <>
      <section aria-label="Risk matrix" className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium">Risk matrix</h3>
          <span className="text-muted-foreground text-[11px]">Severity × likelihood · Low 1–4 · Medium 5–12 · High 15–25</span>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-1.5">
          <span className="text-muted-foreground self-center text-[10px] [writing-mode:vertical-rl] rotate-180">Severity →</span>
          <div className="grid gap-1" role="table" aria-label="Risk matrix, severity by likelihood">
            {[...SCALE].reverse().map((s) => (
              <div key={s} role="row" className="grid grid-cols-5 gap-1">
                {SCALE.map((l) => {
                  const n = at(s, l)
                  const score = s * l
                  return (
                    <div
                      key={l}
                      role="cell"
                      title={`${SEVERITY[s - 1]} × ${LIKELIHOOD[l - 1]} = ${score}, ${riskRating(score).toLowerCase()}${n ? ` · ${n} hazard${n === 1 ? '' : 's'}` : ''}`}
                      className={cn(
                        'grid h-7 place-items-center rounded-[4px] text-[11px] font-medium tabular-nums',
                        TONE_CLASS[RATING_TONE[riskRating(score)]],
                        !n && 'opacity-45',
                      )}
                    >
                      {n ? n : <span className="font-normal opacity-60">{score}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
            <span className="text-muted-foreground text-center text-[10px]">Likelihood →</span>
          </div>
        </div>
      </section>

      <section aria-label="Hazards" className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-medium">Hazards and controls</h3>
          <span className="text-muted-foreground text-[11px] tabular-nums">{hazards.length} listed</span>
        </div>
        {sorted.length ? (
          <ol className="divide-y rounded-md border">
            {sorted.map((h) => {
              const score = riskScore(h)
              return (
                <li key={h.hazard} className="grid gap-1 px-2.5 py-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 flex-1 basis-40 font-medium">{h.hazard}</span>
                    <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">S{h.severity} × L{h.likelihood} = {score}</span>
                    <KitStatusBadge tone={RATING_TONE[riskRating(score)]}>{riskRating(score)}</KitStatusBadge>
                  </div>
                  <p className="text-muted-foreground">{h.control}</p>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="text-muted-foreground">No hazards recorded yet. A new assessment starts empty.</p>
        )}
      </section>
    </>
  )
}

/* ---------- Toolbox meetings: attendance ---------- */

// Who was there, worked out from the count: the sample keeps a number, not
// names, so the peek shows the count against the site's usual shift.
export function ToolboxMeetingDetails({ row }: { row: Row }) {
  const attendees = Number(row.attendees ?? 0)
  const held = row.status === 'Completed'
  return (
    <section aria-label="Attendance" className="grid gap-1.5">
      <h3 className="font-medium">Attendance</h3>
      {held ? (
        <p className="text-muted-foreground">
          {attendees} attended, signed on the sheet · {row.duration} minutes · led by {row.conductedBy}.
        </p>
      ) : (
        <p className="text-muted-foreground flex flex-wrap items-center gap-1.5">
          <StatusBadge status={String(row.status)} /> {row.status === 'Scheduled' ? `Attendance is taken on the day, ${formatDate(String(row.date))} at ${row.time}.` : 'No attendance was taken.'}
        </p>
      )}
    </section>
  )
}
