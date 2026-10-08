import { TODAY, addDays } from '../format'
import type { Row } from '../types'

// Sample records for the Workplace safety and health (WSH) module, made up
// from the same fixed seed as the rest of the ERP: toolbox meetings, safety
// documents with their version history, training certificates and risk
// assessments with their hazards. Inspections are not here: an inspection is
// a submitted checklist, kept with the other form submissions. Dates sit around
// the demo's today (1 Oct 2026), so some certificates are about to expire
// and some documents are due for review.

type Rand = () => number

export const SITES = ['Central DC', 'East hub', 'Johor depot', 'Port Klang store'] as const

export const AREAS = ['Loading bay', 'Warehouse A', 'Warehouse B', 'Workshop', 'Yard', 'Cold room', 'Battery charging bay', 'Office'] as const

export const TOOLBOX_TOPICS = [
  'Manual handling', 'Forklift and pedestrian separation', 'Heat stress', 'Working at height', 'Housekeeping and slips',
  'PPE: when and what', 'Chemical spill response', 'Fire evacuation routes', 'Hand and finger safety', 'Fatigue and shift work',
  'Lockout tagout', 'Dock door safety', 'Reversing vehicles', 'Reporting near misses',
] as const

export const DOCUMENT_TYPES = ['Policy', 'Safe work procedure', 'Plan', 'Procedure', 'Standard'] as const

const DOCUMENTS: [title: string, type: (typeof DOCUMENT_TYPES)[number]][] = [
  ['WSH policy', 'Policy'], ['Forklift operations', 'Safe work procedure'], ['Working at height', 'Safe work procedure'],
  ['Emergency response plan', 'Plan'], ['Permit-to-work', 'Procedure'], ['Manual handling', 'Safe work procedure'],
  ['Chemical handling and spills', 'Safe work procedure'], ['Lockout tagout', 'Procedure'], ['Dock operations', 'Safe work procedure'],
  ['Contractor management', 'Procedure'], ['Personal protective equipment', 'Standard'], ['Incident reporting and investigation', 'Procedure'],
  ['Fire safety plan', 'Plan'], ['Heat stress management', 'Procedure'], ['Racking inspection', 'Procedure'], ['Visitor safety rules', 'Standard'],
]

const CHANGE_NOTES = [
  'Annual review, no change to the method', 'Added the new dock door interlock', 'Aligned with the updated code of practice',
  'Clarified who signs the permit', 'Added the cold room section', 'Updated the emergency contact list', 'New PPE matrix',
  'Reworded after the near-miss investigation', 'First approved issue',
]

// Courses and how many years a certificate is valid for.
export const COURSES: [course: string, years: number][] = [
  ['WSH coordinator', 2], ['Work at height supervisor', 2], ['Forklift operator (counterbalance)', 3], ['First aider', 2],
  ['Fire warden', 2], ['Confined space entry', 2], ['Lifting supervisor', 2], ['Hazardous chemicals handling', 3],
  ['Manual handling', 2], ['Scaffold erector', 3],
]

export const PROVIDERS = ['SafeWork Institute', 'Metro Training Centre', 'St John Ambulance', 'Civil Defence Academy'] as const

export const ACTIVITIES = [
  'Forklift operation in the loading bay', 'Manual handling of cartons', 'Working at height on racking', 'Battery charging',
  'Chemical decanting', 'Dock levelling and trailer loading', 'Pallet wrapping', 'Night shift lone working',
  'Hot work in the workshop', 'Stock counting at height', 'Reversing vehicles in the yard', 'Cold room work',
] as const

// A hazard, its control, and how severe and how likely it typically is (1 to 5).
export type Hazard = { hazard: string; control: string; severity: number; likelihood: number }

const HAZARDS: Hazard[] = [
  { hazard: 'Struck by a moving forklift', control: 'Marked walkways, 8 km/h limit, horn at every corner', severity: 5, likelihood: 2 },
  { hazard: 'Load falling from the forks', control: 'Load backrest, pallets wrapped, no travel with a raised load', severity: 4, likelihood: 2 },
  { hazard: 'Back strain from lifting', control: 'Team lift over 20 kg, trolleys on every aisle, manual handling training', severity: 3, likelihood: 3 },
  { hazard: 'Fall from height', control: 'Harness clipped on, ladder tied off, two-person rule', severity: 5, likelihood: 2 },
  { hazard: 'Hydrogen build-up while charging', control: 'Ventilated charging bay, no ignition sources, gas detector', severity: 4, likelihood: 1 },
  { hazard: 'Chemical splash to the eyes', control: 'Goggles and gloves, eyewash station within 10 m', severity: 3, likelihood: 2 },
  { hazard: 'Slip on a wet floor', control: 'Spill kits at each aisle, hourly floor walk, signage', severity: 2, likelihood: 4 },
  { hazard: 'Trailer creep while loading', control: 'Wheel chocks and dock lock before loading starts', severity: 5, likelihood: 1 },
  { hazard: 'Crushed between trailer and dock', control: 'Dock leveller interlock, traffic light at the door', severity: 5, likelihood: 1 },
  { hazard: 'Heat stress', control: 'Water points, a rest break every hour, acclimatisation for new starters', severity: 3, likelihood: 3 },
  { hazard: 'Noise from compressors', control: 'Hearing protection zone marked, annual hearing test', severity: 2, likelihood: 3 },
  { hazard: 'Cuts from box cutters', control: 'Safety knives with retracting blades, cut-resistant gloves', severity: 2, likelihood: 4 },
  { hazard: 'Fire from hot work', control: 'Hot work permit, fire watch for 30 minutes after', severity: 5, likelihood: 1 },
  { hazard: 'Cold stress', control: 'Thermal PPE, 20-minute rotation, buddy check', severity: 3, likelihood: 2 },
  { hazard: 'Racking collapse', control: 'Load notices, monthly racking inspection, impact reporting', severity: 5, likelihood: 1 },
  { hazard: 'Medical emergency while alone', control: 'Check-in every hour, panic button, first aider on shift', severity: 4, likelihood: 2 },
  { hazard: 'Reversing vehicle strikes a worker', control: 'Banksman, reversing alarms, exclusion zone', severity: 5, likelihood: 2 },
  { hazard: 'Entanglement in the wrapping machine', control: 'Interlocked guards, emergency stop tested weekly', severity: 4, likelihood: 1 },
]

// The 5 × 5 risk matrix: severity × likelihood, banded as the usual
// three-level matrix does. Products of 1 to 5 skip 13 and 14, so the bands
// are Low 1–4, Medium 5–12, High 15–25.
export type RiskRating = 'Low' | 'Medium' | 'High'
export const riskScore = (h: Pick<Hazard, 'severity' | 'likelihood'>) => h.severity * h.likelihood
export const riskRating = (score: number): RiskRating => (score >= 15 ? 'High' : score >= 5 ? 'Medium' : 'Low')

// A certificate's status against the demo's today: expired, expiring
// within 60 days, or valid.
export const EXPIRING_WITHIN = 60
export function certificateStatus(expires: string) {
  if (expires < TODAY) return 'Expired'
  return expires <= addDays(TODAY, EXPIRING_WITHIN) ? 'Expiring' : 'Valid'
}

// A document or assessment approved but past its review date is due for review.
export const reviewStatus = (status: string, reviewDue: string) => (status === 'Approved' && reviewDue < TODAY ? 'Review due' : status)

// "3.2" → "3.3", or "4.0" for a major version.
export function bumpVersion(version: string, major = false) {
  const [a, b = 0] = version.split('.').map(Number)
  return major ? `${(a || 0) + 1}.0` : `${a || 0}.${b + 1}`
}

export type DocumentVersion = { version: string; date: string; author: string; note: string }

export function sampleWsh(rand: Rand, people: readonly string[]) {
  const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]
  const day = (from: number, to: number) => addDays(TODAY, int(from, to))
  const pad = (n: number) => String(n).padStart(2, '0')
  const times = <T,>(n: number, make: (i: number) => T) => Array.from({ length: n }, (_, i) => make(i))

  // The supervisors and the WSH team: who runs meetings, inspects and owns documents.
  const leads = ['Ravi Kumar', 'Siti Rahman', 'Marcus Lim', 'Farid Hassan', 'Omar Aziz', 'Aisha Yusof']

  const toolboxMeetings: Row[] = times(22, (i) => {
    const date = day(-28, 9)
    const past = date < TODAY
    return {
      id: `TBM-${1001 + i}`, topic: pick(TOOLBOX_TOPICS), site: pick(SITES), date, time: `${pad(int(7, 9))}:${pick(['00', '15', '30'])}`,
      conductedBy: pick(leads), attendees: past ? int(6, 18) : 0, duration: pick([10, 15, 15, 20]),
      status: past ? (rand() < 0.9 ? 'Completed' : 'Cancelled') : 'Scheduled',
    }
  })

  const safetyDocuments: Row[] = DOCUMENTS.map(([title, type], i) => {
    const major = int(1, 4)
    const minor = int(0, 3)
    const owner = pick(leads)
    const draft = i === 13
    const inReview = i === 7 || i === 10
    // Every fourth document is old enough to be past its review date.
    const effective = draft ? '' : i % 4 === 0 ? day(-700, -380) : day(-330, -20)
    // Older documents have a history, newest first; each earlier version sat a while before the next.
    const history: DocumentVersion[] = []
    let v = major
    let m = minor
    let at = effective
    while (at && history.length < 4) {
      const first = v === 1 && m === 0
      history.push({ version: `${v}.${m}`, date: at, author: history.length ? pick(leads) : owner, note: first ? 'First approved issue' : pick(CHANGE_NOTES) })
      if (first) break
      if (m > 0) m--
      else {
        v--
        m = int(0, 2)
      }
      at = addDays(at, -int(200, 420))
    }
    const status = draft ? 'Draft' : inReview ? 'In review' : 'Approved'
    const reviewDue = effective ? addDays(effective, type === 'Policy' ? 730 : 365) : ''
    return {
      id: `DOC-${1001 + i}`, title, type, version: draft ? '0.1' : `${major}.${minor}`, owner, effective, reviewDue,
      status: reviewStatus(status, reviewDue), versions: JSON.stringify(history),
    }
  })

  const certifications: Row[] = times(36, (i) => {
    const [course, years] = COURSES[i % COURSES.length]
    // Expiry lands anywhere from four months ago to the full term ahead.
    const issued = day(-years * 365 - 120, -15)
    const expires = addDays(issued, years * 365)
    return {
      id: `CERT-${3001 + i}`, employee: pick(people), course, provider: pick(PROVIDERS), issued, expires, status: certificateStatus(expires),
    }
  })

  const riskAssessments: Row[] = ACTIVITIES.map((activity, i) => {
    const assessed = day(-420, -5)
    const reviewDue = addDays(assessed, 365)
    const hazards = [...HAZARDS].sort(() => rand() - 0.5).slice(0, int(3, 5)).map((h) => ({
      ...h,
      severity: Math.max(1, Math.min(5, h.severity + pick([0, 0, 0, -1]))),
      likelihood: Math.max(1, Math.min(5, h.likelihood + pick([0, 0, 1, -1]))),
    }))
    // Two activities carry a high risk however the dice fall: the forklifts and the hot work.
    if (i === 0 || i === 8) {
      const worst = hazards.reduce((a, b) => (b.severity > a.severity ? b : a))
      worst.likelihood = Math.min(5, Math.max(worst.likelihood, Math.ceil(15 / worst.severity)))
    }
    const highest = Math.max(...hazards.map(riskScore))
    const status = i === 4 ? 'In review' : i === 9 ? 'Draft' : 'Approved'
    return {
      id: `RA-${401 + i}`, activity, area: pick(AREAS), site: pick(SITES), hazards: hazards.length, rating: riskRating(highest),
      assessedBy: pick(leads), assessed, reviewDue, status: reviewStatus(status, reviewDue), hazardsJson: JSON.stringify(hazards),
    }
  })

  return { toolboxMeetings, safetyDocuments, certifications, riskAssessments }
}
