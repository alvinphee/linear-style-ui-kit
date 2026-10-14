import type {
  UsageAgentRow, UsageDay, UsageModel, UsagePeriod, UsagePersonRow, UsageTeam, UsageTotals,
} from '@/blocks/ai/admin/usage-analytics'
import { toast } from 'sonner'
import { downloadText } from '@/lib/download'
import { seededRandom } from '@/lib/random'
import { SAMPLE_AGENTS, SHARED_AGENTS } from '../agents/agents-data'
import { at, MODELS, USER } from '../data'
import { PEOPLE, YOU } from '../projects/people'
import type { ModelId } from '../types'
import { ORG } from './org'

// Made-up usage for the admin console: 180 days of it, so the 90-day view
// still has a period before it to compare with. Acme has 18 people in four
// teams; each has a habit (how often they use the assistant, how much, and
// which models), weekends are quiet, and use grows slowly over the half
// year. Depth Max is new: most people only took it up in the last six weeks.
// Agents run on their own schedules (support triage on every ticket, the
// operations report on Mondays…), and their runs count for whoever owns them.
// The same seed gives the same numbers on every load.

export const TEAMS = ['Operations', 'Support', 'Finance', 'Sales'] as const
export type Team = typeof TEAMS[number]

export type UsagePerson = { id: string; name: string; email: string; team: Team }

const byId = (id: string) => PEOPLE.find((p) => p.id === id)!
const person = (id: string, team: Team): UsagePerson => {
  const p = id === YOU.id ? YOU : byId(id)
  return { id: p.id, name: p.name, email: p.email ?? '', team }
}
const extra = (id: string, name: string, team: Team): UsagePerson => ({
  id, name, team, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
})

export const USAGE_PEOPLE: UsagePerson[] = [
  person(YOU.id, 'Operations'),
  person('u-daniel', 'Operations'),
  person('u-lucas', 'Operations'),
  person('u-tom', 'Operations'),
  extra('u-jo', 'Jo Tan', 'Operations'),
  person('u-mei', 'Support'),
  person('u-sofia', 'Support'),
  person('u-jonas', 'Support'),
  extra('u-hana', 'Hana Sato', 'Support'),
  extra('u-marco', 'Marco Silva', 'Support'),
  person('u-priya', 'Finance'),
  person('u-aisha', 'Finance'),
  person('u-ravi', 'Finance'),
  extra('u-leah', 'Leah Cohen', 'Finance'),
  person('u-omar', 'Sales'),
  person('u-nina', 'Sales'),
  person('u-grace', 'Sales'),
  extra('u-sam', 'Sam Lee', 'Sales'),
]

const HISTORY = 180
// What an agent run costs, in credits, on top of the messages.
const RUN_CREDITS = 2
const MODEL_IDS = MODELS.map((m) => m.id)
const COST = Object.fromEntries(MODELS.map((m) => [m.id, m.cost])) as Record<ModelId, number>

const AGENTS = [...SAMPLE_AGENTS, ...SHARED_AGENTS]

// One person's day. time: when they last sent a message that day.
type Activity = { messages: Record<ModelId, number>; total: number; agentRuns: number; credits: number; time: number }

const zero = (): Record<ModelId, number> => ({ swift: 0, balanced: 0, depth: 0, 'depth-max': 0 })

function generate() {
  const random = seededRandom(20260930)
  const between = (lo: number, hi: number) => lo + random() * (hi - lo)

  const habits = USAGE_PEOPLE.map((p, i) => ({
    id: p.id,
    // How likely they are to use it on a weekday, and how many messages then.
    often: i % 4 === 3 ? between(0.05, 0.2) : between(0.45, 0.95),
    much: between(6, 34),
    // Some joined in the last few months.
    since: i % 6 === 5 ? Math.floor(between(20, 120)) : HISTORY,
    weights: {
      swift: between(0.1, 0.3),
      balanced: between(0.35, 0.6),
      depth: between(0.1, 0.3),
      'depth-max': between(0.05, 0.18),
    } as Record<ModelId, number>,
  }))

  // How often each agent runs on a day: weekday, weekend.
  const runsOn = (agentId: string, weekday: boolean, dow: number): number => {
    switch (agentId) {
      case 'ag-invoices': return weekday ? Math.round(between(3, 9)) : 0
      case 'ag-ops-report': return dow === 1 ? 1 : 0
      case 'ag-support-triage': return Math.round(weekday ? between(12, 30) : between(2, 8))
      case 'ag-competitors': return dow === 5 ? 1 : 0
      case 'ag-contracts': return weekday && random() < 0.3 ? Math.ceil(between(0, 2)) : 0
      case 'ag-onboarding': return weekday ? Math.floor(between(0, 5)) : 0
      case 'ag-release-notes': return weekday && random() < 0.15 ? 1 : 0
      default: return 0
    }
  }
  const ownerOf = (owner: string) =>
    USAGE_PEOPLE.find((p) => p.name === owner)?.id ?? (owner === USER.name ? YOU.id : undefined)

  // days[daysAgo] → person id → activity
  const days: Map<string, Activity>[] = []
  // agentRuns[daysAgo] → agent id → runs
  const agentRuns: Record<string, number>[] = []

  for (let d = 0; d < HISTORY; d++) {
    const date = new Date(at(d, 0))
    const dow = date.getDay()
    const weekday = dow > 0 && dow < 6
    // Use grows by about half over the six months.
    const trend = 0.65 + 0.35 * (1 - d / HISTORY)
    const day = new Map<string, Activity>()

    for (const h of habits) {
      if (d >= h.since) continue
      if (random() > h.often * trend * (weekday ? 1 : 0.18)) continue
      const total = Math.max(1, Math.round(h.much * between(0.4, 1.5) * (weekday ? 1 : 0.5)))
      const weights = { ...h.weights, 'depth-max': h.weights['depth-max'] * (d < 42 ? 1 : 0.15) }
      const sum = MODEL_IDS.reduce((s, m) => s + weights[m], 0)
      const messages = zero()
      let left = total
      MODEL_IDS.forEach((m, i) => {
        const n = i === MODEL_IDS.length - 1 ? left : Math.min(left, Math.round((total * weights[m]) / sum))
        messages[m] = n
        left -= n
      })
      const credits = MODEL_IDS.reduce((s, m) => s + messages[m] * COST[m], 0)
      day.set(h.id, { messages, total, agentRuns: 0, credits, time: at(d, Math.floor(between(8, 18)), Math.floor(between(0, 60))) })
    }

    const runs: Record<string, number> = {}
    for (const agent of AGENTS) {
      const n = runsOn(agent.id, weekday, dow)
      if (!n) continue
      runs[agent.id] = n
      const owner = ownerOf(agent.owner)
      if (!owner) continue
      const activity = day.get(owner) ?? { messages: zero(), total: 0, agentRuns: 0, credits: 0, time: 0 }
      activity.agentRuns += n
      activity.credits += n * RUN_CREDITS
      day.set(owner, activity)
    }

    days.push(day)
    agentRuns.push(runs)
  }
  return { days, agentRuns }
}

const DATA = generate()

/* ---------- Slicing ---------- */

// Days as "days ago", both ends included: from 29 to 0 is the last 30 days.
export type DayRange = { from: number; to: number }

export const PERIOD_DAYS: Record<UsagePeriod, number> = { '7d': 7, '30d': 30, '90d': 90 }

export function periodRange(period: UsagePeriod, before = false): DayRange {
  const n = PERIOD_DAYS[period]
  return before ? { from: 2 * n - 1, to: n } : { from: n - 1, to: 0 }
}

function* daysIn({ from, to }: DayRange) {
  for (let d = Math.min(from, HISTORY - 1); d >= to; d--) yield d
}

// The range as a day each, oldest first.
export function seriesFor(range: DayRange): UsageDay[] {
  return [...daysIn(range)].map((d) => {
    const byModel: Record<string, number> = zero()
    let messages = 0
    let credits = 0
    let activePeople = 0
    for (const a of DATA.days[d].values()) {
      for (const m of MODEL_IDS) byModel[m] += a.messages[m]
      messages += a.total
      credits += a.credits
      if (a.total) activePeople++
    }
    const agentRuns = Object.values(DATA.agentRuns[d]).reduce((s, n) => s + n, 0)
    return { date: at(d, 0), byModel, messages, credits, activePeople, agentRuns }
  })
}

// Each person's figures over the range, busiest first; people with no
// activity are left out.
export function peopleFor(range: DayRange): (UsagePersonRow & { byModel: Record<ModelId, number> })[] {
  return USAGE_PEOPLE.map((p) => {
    const row = { id: p.id, name: p.name, email: p.email, team: p.team, messages: 0, agentRuns: 0, credits: 0, lastActive: undefined as number | undefined, byModel: zero() }
    for (const d of daysIn(range)) {
      const a = DATA.days[d].get(p.id)
      if (!a) continue
      row.messages += a.total
      row.agentRuns += a.agentRuns
      row.credits += a.credits
      for (const m of MODEL_IDS) row.byModel[m] += a.messages[m]
      if (a.total && a.time > (row.lastActive ?? 0)) row.lastActive = a.time
    }
    return row
  })
    .filter((row) => row.messages || row.agentRuns)
    .sort((a, b) => b.credits - a.credits)
}

export function totalsFor(range: DayRange): UsageTotals {
  const series = seriesFor(range)
  return {
    activePeople: peopleFor(range).filter((p) => p.messages > 0).length,
    messages: series.reduce((s, d) => s + d.messages, 0),
    agentRuns: series.reduce((s, d) => s + d.agentRuns, 0),
    credits: series.reduce((s, d) => s + d.credits, 0),
  }
}

export function modelsFor(range: DayRange): UsageModel[] {
  const series = seriesFor(range)
  return MODELS.map((m, i) => {
    const messages = series.reduce((s, d) => s + (d.byModel[m.id] ?? 0), 0)
    return { id: m.id, name: m.name, icon: m.icon, colour: `var(--chart-${i + 1})`, messages, credits: messages * m.cost }
  })
}

export function teamsFor(range: DayRange): UsageTeam[] {
  const people = peopleFor(range)
  return TEAMS.map((team) => {
    const members = people.filter((p) => p.team === team)
    return {
      id: team.toLowerCase(),
      name: team,
      credits: members.reduce((s, p) => s + p.credits, 0),
      people: members.filter((p) => p.messages > 0).length,
    }
  }).sort((a, b) => b.credits - a.credits)
}

export function agentsFor(range: DayRange): UsageAgentRow[] {
  return AGENTS.map((agent) => {
    let runs = 0
    for (const d of daysIn(range)) runs += DATA.agentRuns[d][agent.id] ?? 0
    return { id: agent.id, name: agent.name, icon: agent.icon, colour: agent.colour, owner: agent.owner, runs }
  })
    .filter((a) => a.runs > 0)
    .sort((a, b) => b.runs - a.runs)
}

// Everything UsageAnalytics needs for a period, with the period before.
export function usageFor(period: UsagePeriod) {
  const range = periodRange(period)
  const before = periodRange(period, true)
  return {
    series: seriesFor(range),
    previous: seriesFor(before),
    totals: totalsFor(range),
    previousTotals: totalsFor(before),
    byModel: modelsFor(range),
    byTeam: teamsFor(range),
    topPeople: peopleFor(range),
    topAgents: agentsFor(range),
  }
}

// This calendar month so far (1–30 Sep on the demo clock) and last month
// (August), for the admin overview.
export function monthToDate() {
  const today = new Date(at(0, 0))
  const intoMonth = today.getDate() - 1
  const lastMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate()
  const range = { from: intoMonth, to: 0 }
  const before = { from: intoMonth + lastMonthDays, to: intoMonth + 1 }
  return {
    month: today.toLocaleString('en-GB', { month: 'long' }),
    lastMonth: new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleString('en-GB', { month: 'long' }),
    series: seriesFor(range),
    previous: seriesFor(before),
    totals: totalsFor(range),
    previousTotals: totalsFor(before),
  }
}

/* ---------- Export ---------- */

const cell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const isoDay = (time: number) => {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// The period's usage per person, one row each, as CSV.
export function usageCsv(period: UsagePeriod) {
  const range = periodRange(period)
  const head = [
    'Name', 'Email', 'Team', 'Messages', ...MODELS.map((m) => `${m.name} messages`), 'Agent runs', 'Credits', 'Last active',
    'Period start', 'Period end',
  ]
  const start = isoDay(at(range.from, 0))
  const end = isoDay(at(range.to, 0))
  const rows = peopleFor(range).map((p) => [
    p.name, p.email ?? '', p.team ?? '', p.messages, ...MODELS.map((m) => p.byModel[m.id]), p.agentRuns,
    p.credits.toFixed(1), p.lastActive ? isoDay(p.lastActive) : '', start, end,
  ])
  return [head, ...rows].map((row) => row.map(cell).join(',')).join('\n') + '\n'
}

// Downloads usageCsv as a file, with a toast naming it.
export function exportUsage(period: UsagePeriod) {
  const name = `${ORG.name.toLowerCase()}-usage-${period}.csv`
  downloadText(name, usageCsv(period), 'text/csv')
  toast('Usage exported', { description: name })
}
