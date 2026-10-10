import type { ScheduledTask, TaskModelOption, TaskRun } from '@/blocks/ai/schedules/scheduled-task-dialog'
import { at, MODELS } from '../data'

// Made-up scheduled tasks in the demo projects (seed.ts): Operations,
// Customer support and Q4 planning. Their runs are dated on the demo clock
// (30 Sep 2026, 18:40), so "Next run" and "Today" always read the same.
// Each run's chat id is made up too; nothing opens it but a toast.

const ZONE = 'Asia/Singapore'

// A finished run: started `daysAgo` at hour:minute, taking `seconds`.
function run(id: string, daysAgo: number, hour: number, minute: number, seconds: number, result: { summary: string } | { error: string }): TaskRun {
  const startedAt = at(daysAgo, hour, minute)
  const failed = 'error' in result
  return {
    id,
    startedAt,
    finishedAt: startedAt + seconds * 1000,
    status: failed ? 'failed' : 'succeeded',
    ...result,
    chatId: failed ? undefined : `c-${id}`,
  }
}

export const SAMPLE_SCHEDULED_TASKS: ScheduledTask[] = [
  {
    id: 'st-ops-weekly',
    projectId: 'p-ops',
    name: 'Weekly operations summary',
    prompt: 'Summarise last week’s jobs: how many were delivered on time, which ran late and why, and any driver or depot issues.\nEnd with three things to fix this week.',
    recurrence: { kind: 'weekly', days: [1], time: '09:00', timeZone: ZONE },
    model: 'balanced',
    notify: { email: true, push: false },
    enabled: true,
    runs: [
      run('run-ops-0928', 2, 9, 0, 48, { summary: '142 jobs, 94% on time. Late runs clustered at the Jurong depot on Thursday; bay 4 was closed.' }),
      run('run-ops-0921', 9, 9, 0, 52, { summary: '131 jobs, 91% on time. Two cold chain jobs missed their window after a vehicle check failed.' }),
      run('run-ops-0914', 16, 9, 0, 60, { error: 'The jobs export timed out after 60 seconds. It ran again on the next schedule.' }),
      run('run-ops-0907', 23, 9, 0, 45, { summary: '127 jobs, 93% on time. Fewer late pickups since the earlier depot opening.' }),
    ],
  },
  {
    id: 'st-overdue',
    projectId: 'p-q4',
    name: 'Overdue invoices check',
    prompt: 'List the invoices more than 30 days overdue, largest first, with the customer and who to chase. Flag any that are new since yesterday.',
    recurrence: { kind: 'weekdays', time: '08:30', timeZone: ZONE },
    model: 'swift',
    notify: { email: false, push: true },
    enabled: true,
    runs: [
      run('run-inv-0930', 0, 8, 30, 14, { summary: '6 invoices overdue, $18,240 in all. One new since yesterday: Bayview Foods, $2,900.' }),
      run('run-inv-0929', 1, 8, 30, 12, { summary: '5 invoices overdue, $15,340 in all. None new.' }),
      run('run-inv-0928', 2, 8, 30, 16, { summary: '5 invoices overdue, $15,340 in all. Harbour Supplies paid two.' }),
      run('run-inv-0925', 5, 8, 30, 30, { error: 'Couldn’t reach the invoices connector. Check that it is still connected.' }),
      run('run-inv-0924', 6, 8, 30, 13, { summary: '7 invoices overdue, $21,060 in all. Two new since yesterday.' }),
    ],
  },
  {
    id: 'st-driver-load',
    projectId: 'p-ops',
    name: 'Monthly driver workload report',
    prompt: 'Compare each driver’s workload last month: jobs, hours on the road and overtime. Chart it, and point out anyone over 48 hours in a week.',
    recurrence: { kind: 'monthly', dayOfMonth: 1, time: '07:00', timeZone: ZONE },
    model: 'depth',
    notify: { email: true, push: true },
    enabled: true,
    runs: [
      run('run-drv-0901', 29, 7, 0, 95, { summary: 'August: 11 drivers, 1,240 hours. Siti and Marcus went over 48 hours in the week of 17 Aug.' }),
      run('run-drv-0801', 60, 7, 0, 88, { summary: 'July: 10 drivers, 1,180 hours. Nobody over 48 hours in a week.' }),
    ],
  },
  {
    id: 'st-support-digest',
    projectId: 'p-support',
    name: 'Support tickets digest',
    prompt: 'Summarise today’s support tickets: how many came in, the top three themes, and any still waiting on us for more than a day.',
    recurrence: { kind: 'daily', time: '17:30', timeZone: ZONE },
    notify: { email: false, push: true },
    enabled: false,
    runs: [
      run('run-sup-0928', 2, 17, 30, 21, { error: 'The help desk connector needs to be signed in again.' }),
      run('run-sup-0927', 3, 17, 30, 34, { summary: '38 tickets. Top themes: delivery times, proof of delivery photos, invoice copies.' }),
      run('run-sup-0926', 4, 17, 30, 29, { summary: '41 tickets. Three waiting on us for more than a day, all about pallet returns.' }),
    ],
  },
  {
    id: 'st-q4-kickoff',
    projectId: 'p-q4',
    name: 'Q4 kickoff briefing',
    prompt: 'Using the Q4 targets and the capacity plan, write a one-page briefing for Monday’s kickoff: the targets, the gaps in capacity, and the hires still open.',
    recurrence: { kind: 'once', date: '2026-10-05', time: '08:00', timeZone: ZONE },
    model: 'depth',
    notify: { email: true, push: false },
    enabled: true,
    runs: [],
  },
]

// A project's scheduled tasks.
export const scheduledTasksFor = (projectId: string, tasks = SAMPLE_SCHEDULED_TASKS) =>
  tasks.filter((t) => t.projectId === projectId)

// The demo models, as the dialog's model select lists them.
export const SCHEDULE_MODELS: TaskModelOption[] = MODELS.map((m) => ({ value: m.id, label: m.name }))

// What a run posts, for the demo's Run now.
export const SAMPLE_RUN_SUMMARIES: Record<string, string> = {
  'st-ops-weekly': '138 jobs so far this week, 95% on time. No depot issues reported.',
  'st-overdue': '6 invoices overdue, $18,240 in all. None new since this morning.',
  'st-driver-load': 'September to date: 11 drivers, 1,190 hours. Nobody over 48 hours in a week.',
  'st-support-digest': '27 tickets today. Top themes: delivery times, address changes, invoice copies.',
  'st-q4-kickoff': 'Briefing drafted: three targets, two capacity gaps in November, four hires open.',
}
