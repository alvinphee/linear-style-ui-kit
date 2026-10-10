import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ScheduledTaskDialog, type ScheduledTask, type ScheduledTaskDraft } from '@/blocks/ai/schedules/scheduled-task-dialog'
import { ScheduledTaskList } from '@/blocks/ai/schedules/scheduled-task-list'
import { TaskRunHistory, TaskRunsSheet } from '@/blocks/ai/schedules/task-run-history'
import { describeRecurrence, formatUntil, nextRuns, RecurrencePicker, type Recurrence } from '@/components/recurrence-picker'
import { Button } from '@/components/ui/button'
import { Row, Panel } from '../shared'
import { now, uid } from '../ai/data'
import { SAMPLE_RUN_SUMMARIES, SAMPLE_SCHEDULED_TASKS, SCHEDULE_MODELS } from '../ai/projects/schedules-data'

// The scheduled task blocks on their own, on local state: the recurrence
// picker with its description and next runs, the task list live (Run now
// runs for two seconds, then succeeds), the list empty, the dialog creating
// and editing a task, and the run history inline and in its sheet.

const openChat = () => toast('Opens the chat the run posted', { description: 'Demo only.' })

type Editor = { open: boolean; id?: string; initial?: Partial<ScheduledTaskDraft> }

export function SchedulesPanels() {
  const [recurrence, setRecurrence] = useState<Recurrence>({ kind: 'weekly', days: [1, 4], time: '09:00', timeZone: 'Asia/Singapore' })
  const [tasks, setTasks] = useState<ScheduledTask[]>(SAMPLE_SCHEDULED_TASKS)
  const [editor, setEditor] = useState<Editor>({ open: false })
  const [runsId, setRunsId] = useState<string | null>(null)
  const [runsOpen, setRunsOpen] = useState(false)
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const base = now()
  const upcoming = nextRuns(recurrence, base, 5)
  const runsTask = tasks.find((t) => t.id === runsId)
  const historyTask = tasks.find((t) => t.id === 'st-ops-weekly')

  const update = (id: string, change: (t: ScheduledTask) => ScheduledTask) =>
    setTasks((list) => list.map((t) => (t.id === id ? change(t) : t)))

  const runNow = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task || task.runs.some((r) => r.status === 'running')) return
    const runId = uid('run')
    update(id, (t) => ({ ...t, runs: [{ id: runId, startedAt: now(), status: 'running' }, ...t.runs] }))
    toast(`Running “${task.name}”`, { description: 'The result posts as a new chat in the project.' })
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      update(id, (t) => ({
        ...t,
        runs: t.runs.map((r) => (r.id === runId
          ? { ...r, status: 'succeeded', finishedAt: now(), summary: SAMPLE_RUN_SUMMARIES[id] ?? 'Done.', chatId: `c-${runId}` }
          : r)),
      }))
      toast.success(`“${task.name}” finished`, { description: 'Posted as a new chat, marked unread.' })
    }, 2000)
    timers.current.add(timer)
  }

  const save = (draft: ScheduledTaskDraft) => {
    if (editor.id) {
      update(editor.id, (t) => ({ ...t, ...draft }))
      toast(`Saved “${draft.name}”`, { description: describeRecurrence(draft.recurrence) })
    } else {
      setTasks((list) => [{ ...draft, id: uid('st'), projectId: 'p-ops', enabled: true, runs: [] }, ...list])
      toast(`Scheduled “${draft.name}”`, { description: describeRecurrence(draft.recurrence) })
    }
    setEditor((e) => ({ ...e, open: false }))
  }

  const edit = (id: string) => {
    const t = tasks.find((x) => x.id === id)
    if (t) setEditor({ open: true, id, initial: { name: t.name, prompt: t.prompt, recurrence: t.recurrence, model: t.model, notify: t.notify } })
  }

  const openRuns = (id: string) => {
    setRunsId(id)
    setRunsOpen(true)
  }

  return (
    <>
      <Panel title="Recurrence picker" note="Once, daily, weekdays, weekly, monthly">
        <div className="grid gap-3">
          <RecurrencePicker value={recurrence} onChange={setRecurrence} now={base} />
          <div className="bg-muted/40 grid gap-1.5 rounded-md border px-3 py-2">
            <p className="text-xs font-medium">{describeRecurrence(recurrence)}</p>
            {upcoming.length > 0 ? (
              <ol aria-label="Next runs" className="grid gap-1">
                {upcoming.map((t) => (
                  <li key={t} className="text-muted-foreground flex min-w-0 justify-between gap-3 text-xs">
                    <span className="text-foreground min-w-0 truncate tabular-nums">{format(t, 'EEE d MMM yyyy, HH:mm')}</span>
                    <span className="shrink-0">{formatUntil(t, base)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-xs">No runs coming up.</p>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Dialog" note="New, edit, with checks">
        <div className="grid gap-3">
          <p className="text-muted-foreground text-xs">
            Save checks the name, the prompt and the schedule (a day for weekly, a time still to come for once).
            The preview lists the next three runs as you change the schedule.
          </p>
          <Row>
            <Button size="sm" onClick={() => setEditor({ open: true })}>New scheduled task</Button>
            <Button size="sm" variant="outline" onClick={() => edit('st-overdue')}>Edit a task</Button>
            <Button size="sm" variant="outline" onClick={() => openRuns('st-overdue')}>View its runs</Button>
          </Row>
        </div>
      </Panel>

      <Panel title="Scheduled task list" note="Pause, Run now, edit, runs, delete" wide>
        <div className="grid gap-2">
          <ScheduledTaskList
            tasks={tasks}
            now={base}
            onToggle={(id, on) => {
              update(id, (t) => ({ ...t, enabled: on }))
              const name = tasks.find((t) => t.id === id)?.name
              toast(on ? `Resumed “${name}”` : `Paused “${name}”`)
            }}
            onRunNow={runNow}
            onEdit={edit}
            onOpenRuns={openRuns}
            onCreate={() => setEditor({ open: true })}
            onDelete={(id) => {
              const at = tasks.findIndex((t) => t.id === id)
              const gone = tasks[at]
              setTasks((list) => list.filter((t) => t.id !== id))
              toast(`Deleted “${gone.name}”`, {
                action: { label: 'Undo', onClick: () => setTasks((list) => [...list.slice(0, at), gone, ...list.slice(at)]) },
              })
            }}
          />
          {tasks.length < SAMPLE_SCHEDULED_TASKS.length && (
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setTasks(SAMPLE_SCHEDULED_TASKS)}>
              Bring the tasks back
            </Button>
          )}
        </div>
      </Panel>

      <Panel title="Scheduled task list, empty" note="No tasks yet">
        <ScheduledTaskList tasks={[]} onCreate={() => setEditor({ open: true })} />
      </Panel>

      <Panel title="Run history" note={historyTask ? historyTask.name : 'Runs, newest first'}>
        <div className="grid gap-3">
          {historyTask && <TaskRunHistory runs={historyTask.runs} now={base} onOpenChat={openChat} />}
          <Button variant="outline" size="sm" className="w-fit" onClick={() => openRuns('st-ops-weekly')}>
            Open in a sheet
          </Button>
        </div>
      </Panel>

      <Panel title="Run history, empty" note="A task that hasn't run">
        <TaskRunHistory runs={[]} now={base} />
      </Panel>

      <ScheduledTaskDialog
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        initial={editor.initial}
        editing={!!editor.id}
        models={SCHEDULE_MODELS}
        now={base}
        onSave={save}
      />
      <TaskRunsSheet
        open={runsOpen && !!runsTask}
        onOpenChange={setRunsOpen}
        name={runsTask?.name ?? ''}
        description={runsTask && describeRecurrence(runsTask.recurrence)}
        runs={runsTask?.runs ?? []}
        now={base}
        onOpenChat={openChat}
        onRunNow={runsTask && (() => runNow(runsTask.id))}
      />
    </>
  )
}
