import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { format } from 'date-fns'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { BubbleChatIcon, Calendar03Icon, Mail01Icon, Notification01Icon } from '@hugeicons/core-free-icons'
import {
  describeRecurrence, formatUntil, localTimeZone, nextRuns, RecurrencePicker, TIME_ZONES,
  type Recurrence, type TimeZoneOption,
} from '@/components/recurrence-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// The dialog that creates or edits a scheduled task: a prompt the assistant
// runs on its own, on a recurrence, inside a project. Its name, the prompt,
// when it runs (with a preview of the next three runs), the model, and how
// the result is delivered: always as a new chat in the project, and by
// email or push if asked. The form starts afresh from `initial` each time it
// opens; Save checks the name, prompt and schedule, then hands back the
// draft. The caller stores it and closes the dialog.

export type TaskRunStatus = 'running' | 'succeeded' | 'failed'

// One time the task ran.
export type TaskRun = {
  id: string
  startedAt: number
  finishedAt?: number
  status: TaskRunStatus
  // The result in a line, for a run that succeeded.
  summary?: string
  // Why it failed, in a line.
  error?: string
  // The chat the run posted its result in.
  chatId?: string
}

// How a run's result reaches you, beyond the new chat in the project.
export type TaskNotify = { email: boolean; push: boolean }

// What the dialog edits.
export type ScheduledTaskDraft = {
  name: string
  prompt: string
  recurrence: Recurrence
  // A model id from the dialog's `models`. Left out: the project's default.
  model?: string
  notify: TaskNotify
}

export type ScheduledTask = ScheduledTaskDraft & {
  id: string
  // Off: paused, it keeps its schedule but does not run.
  enabled: boolean
  projectId?: string
  // Its runs, in any order.
  runs: TaskRun[]
}

export type TaskModelOption = { value: string; label: string }

// A new task's starting point: every Monday at 09:00 in the viewer's zone.
export function newTaskDraft(timeZone = localTimeZone()): ScheduledTaskDraft {
  return {
    name: '',
    prompt: '',
    recurrence: { kind: 'weekly', days: [1], time: '09:00', timeZone },
    notify: { email: false, push: true },
  }
}

const PROMPT_PLACEHOLDER = 'Summarise last week’s support tickets: how many came in, the top three themes, and anything still waiting on us. End with a short list of actions.'

// Why a schedule can't be saved, if it can't.
function scheduleError(r: Recurrence, now: number) {
  if (r.kind === 'weekly' && !r.days?.length) return 'Pick at least one day.'
  if (r.kind === 'once' && !r.date) return 'Pick a date.'
  if (r.kind === 'once' && nextRuns(r, now, 1).length === 0) return 'Pick a time that hasn’t passed yet.'
  return undefined
}

export function ScheduledTaskDialog({
  open, onOpenChange, initial, editing = !!initial, models, timeZones = TIME_ZONES, now, onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // What the form starts with. Left out: a new task (newTaskDraft).
  initial?: Partial<ScheduledTaskDraft>
  // True when `initial` is a saved task being changed. Defaults to whether `initial` is given.
  editing?: boolean
  // The models to choose from. Left out: no model choice.
  models?: TaskModelOption[]
  timeZones?: TimeZoneOption[]
  // The time the preview counts from. Defaults to the browser's clock.
  now?: number
  onSave: (draft: ScheduledTaskDraft) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open && (
          <TaskForm
            initial={initial}
            editing={editing}
            models={models}
            timeZones={timeZones}
            now={now ?? Date.now()}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function TaskForm({ initial, editing, models, timeZones, now, onSave }: {
  initial?: Partial<ScheduledTaskDraft>
  editing: boolean
  models?: TaskModelOption[]
  timeZones: TimeZoneOption[]
  now: number
  onSave: (draft: ScheduledTaskDraft) => void
}) {
  const [draft, setDraft] = useState<ScheduledTaskDraft>(() => {
    const blank = newTaskDraft()
    return { ...blank, ...initial, notify: { ...blank.notify, ...initial?.notify } }
  })
  const [tried, setTried] = useState(false)
  const id = useId()
  const set = <K extends keyof ScheduledTaskDraft>(key: K, value: ScheduledTaskDraft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const nameError = !draft.name.trim() ? 'Give the task a name.' : undefined
  const promptError = !draft.prompt.trim() ? 'Say what the assistant should do on each run.' : undefined
  const whenError = scheduleError(draft.recurrence, now)
  const coming = nextRuns(draft.recurrence, now, 3)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (nameError) return document.getElementById(`${id}-name`)?.focus()
    if (promptError) return document.getElementById(`${id}-prompt`)?.focus()
    if (whenError) return
    onSave({ ...draft, name: draft.name.trim(), prompt: draft.prompt.trim() })
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="border-b p-4 pr-10">
        <DialogTitle>{editing ? 'Edit scheduled task' : 'New scheduled task'}</DialogTitle>
        <DialogDescription>
          The assistant runs the prompt on its own at the times you set, and posts each result as a new chat in this project.
        </DialogDescription>
      </DialogHeader>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4">
        <Field data-invalid={tried && !!nameError}>
          <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
          <Input
            id={`${id}-name`}
            value={draft.name}
            maxLength={80}
            placeholder="Weekly support summary"
            autoFocus={!editing}
            aria-invalid={tried && !!nameError}
            onChange={(e) => set('name', e.target.value)}
          />
          {tried && nameError && <FieldError>{nameError}</FieldError>}
        </Field>

        <Field data-invalid={tried && !!promptError}>
          <FieldLabel htmlFor={`${id}-prompt`}>Prompt</FieldLabel>
          <Textarea
            id={`${id}-prompt`}
            value={draft.prompt}
            rows={4}
            placeholder={PROMPT_PLACEHOLDER}
            aria-invalid={tried && !!promptError}
            aria-describedby={`${id}-prompt-hint`}
            className="max-h-60 min-h-24"
            onChange={(e) => set('prompt', e.target.value)}
          />
          {tried && promptError
            ? <FieldError>{promptError}</FieldError>
            : <FieldDescription id={`${id}-prompt-hint`} className="text-[11px]">Written as you would ask it in a chat. It can use the project’s files and instructions.</FieldDescription>}
        </Field>

        <FieldSet className="gap-3">
          <FieldLegend variant="label" className="mb-0">Schedule</FieldLegend>
          <RecurrencePicker
            value={draft.recurrence}
            onChange={(recurrence) => set('recurrence', recurrence)}
            timeZones={timeZones}
            now={now}
            invalid={tried && !!whenError}
          />
          {tried && whenError && <FieldError>{whenError}</FieldError>}
          <div className="bg-muted/40 grid gap-1.5 rounded-md border px-3 py-2">
            <p className="text-xs">{describeRecurrence(draft.recurrence, timeZones)}</p>
            <p id={`${id}-preview`} className="text-muted-foreground text-[11px] font-medium">Preview: next {coming.length > 1 ? `${coming.length} runs` : 'run'}</p>
            {coming.length > 0 ? (
              <ol aria-labelledby={`${id}-preview`} className="grid gap-1">
                {coming.map((t) => (
                  <li key={t} className="flex min-w-0 items-center gap-2 text-xs">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="min-w-0 truncate tabular-nums">{format(t, 'EEE d MMM yyyy, HH:mm')}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{formatUntil(t, now)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-xs">No runs coming up with this schedule.</p>
            )}
          </div>
        </FieldSet>

        {models && models.length > 0 && (
          <Field>
            <FieldLabel htmlFor={`${id}-model`}>Model</FieldLabel>
            <Select value={draft.model ?? 'default'} onValueChange={(v) => set('model', v === 'default' ? undefined : v)}>
              <SelectTrigger id={`${id}-model`} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Project default</SelectItem>
                {models.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        )}

        <FieldSet className="gap-2">
          <FieldLegend variant="label" className="mb-0">Deliver results</FieldLegend>
          <DeliveryRow icon={BubbleChatIcon} label="New chat in this project" hint="Always on. Each run starts a chat, marked unread.">
            <Switch size="sm" checked disabled aria-label="New chat in this project (always on)" />
          </DeliveryRow>
          <DeliveryRow icon={Mail01Icon} label="Email" hint="The result, and a link to the chat." htmlFor={`${id}-email`}>
            <Switch
              id={`${id}-email`}
              size="sm"
              checked={draft.notify.email}
              onCheckedChange={(email) => set('notify', { ...draft.notify, email })}
            />
          </DeliveryRow>
          <DeliveryRow icon={Notification01Icon} label="Push notification" hint="On your phone and in the browser." htmlFor={`${id}-push`}>
            <Switch
              id={`${id}-push`}
              size="sm"
              checked={draft.notify.push}
              onCheckedChange={(push) => set('notify', { ...draft.notify, push })}
            />
          </DeliveryRow>
        </FieldSet>
      </div>

      <DialogFooter className="border-t p-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">{editing ? 'Save changes' : 'Create task'}</Button>
      </DialogFooter>
    </form>
  )
}

function DeliveryRow({ icon, label, hint, htmlFor, children }: {
  icon: IconSvgElement
  label: string
  hint: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-md border px-3 py-2">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />
      <div className="grid min-w-0 flex-1 gap-0.5">
        {htmlFor
          ? <label htmlFor={htmlFor} className="text-xs font-medium">{label}</label>
          : <span className="text-xs font-medium">{label}</span>}
        <span className="text-muted-foreground text-[11px]">{hint}</span>
      </div>
      {children}
    </div>
  )
}
