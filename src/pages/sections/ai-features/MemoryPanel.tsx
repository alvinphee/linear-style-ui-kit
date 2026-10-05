import { useId, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiBrain01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AiLabel } from '@/components/ai-label'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import { Panel } from '../shared'

type Memory = { id: string; text: string; source: string }

const MEMORIES: Memory[] = [
  { id: 'm1', text: 'Prefers delivery updates as short bullet points', source: 'From a chat, 2 days ago' },
  { id: 'm2', text: 'Works on the Operations team and approves driver schedules', source: 'From your profile' },
  { id: 'm3', text: 'Bayview Foods wants a call 15 minutes before arrival', source: 'From a chat, last week' },
  { id: 'm4', text: 'Bay 4 at the Jurong warehouse closes at 5 pm', source: 'From a comment on DO-24817' },
  { id: 'm5', text: 'Writes reports in British English', source: 'From a chat, 3 weeks ago' },
]

const INSTRUCTIONS =
  'Keep answers short and use bullet points. Mention jobs by their ID, like DO-24817. Use 24-hour times.'
const MAX = 1000

export function MemoryPanel() {
  const id = useId()
  const [enabled, setEnabled] = useState(true)
  const [memories, setMemories] = useState(MEMORIES)
  const [confirmClear, setConfirmClear] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const [saved, setSaved] = useState(INSTRUCTIONS)
  const [draft, setDraft] = useState(INSTRUCTIONS)
  const dirty = draft !== saved
  const count = draft.length

  function forget(memory: Memory) {
    const index = memories.findIndex((m) => m.id === memory.id)
    // Keep keyboard focus on the list: move it to the neighbouring row.
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button')
    const neighbour = buttons?.[index + 1] ?? buttons?.[index - 1]
    requestAnimationFrame(() => neighbour?.focus())
    setMemories((all) => all.filter((m) => m.id !== memory.id))
    toast('Forgotten', {
      description: memory.text,
      action: {
        label: 'Undo',
        onClick: () => setMemories((all) => (all.some((m) => m.id === memory.id) ? all : [...all.slice(0, index), memory, ...all.slice(index)])),
      },
    })
  }

  function clearAll() {
    const before = memories
    setMemories([])
    toast.success('Memory cleared', {
      description: `The assistant forgot ${plural(before.length, 'thing')}.`,
      action: { label: 'Undo', onClick: () => setMemories(before) },
    })
  }

  function save() {
    if (!dirty) return
    setSaved(draft)
    toast.success('Instructions saved', { description: 'Demo only. They would apply to new chats.' })
  }

  return (
    <Panel title="Memory and instructions" note="What the assistant keeps about you">
      <div className="grid min-w-0 gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <Label htmlFor={`${id}-memory`}>Use memory</Label>
            <p id={`${id}-memory-hint`} className="text-muted-foreground text-[11px]">
              Let the assistant remember useful details from your chats and use them later.
            </p>
          </div>
          <Switch
            id={`${id}-memory`}
            aria-describedby={`${id}-memory-hint`}
            checked={enabled}
            onCheckedChange={(on) => {
              setEnabled(on)
              toast(on ? 'Memory is on' : 'Memory is off', {
                description: on ? 'Saved details are used again.' : 'Nothing is used or saved until you turn it back on.',
              })
            }}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-medium">What the assistant remembers</h4>
            <AiLabel>Saved by AI</AiLabel>
            {memories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive ml-auto"
                onClick={() => setConfirmClear(true)}
              >
                Clear all
              </Button>
            )}
          </div>

          {!enabled && (
            <p className="text-muted-foreground text-[11px]">Memory is off. These are kept, but not used.</p>
          )}

          {memories.length ? (
            <ul ref={listRef} aria-label="Remembered details" className={cn('divide-y overflow-hidden rounded-lg border transition-opacity', !enabled && 'opacity-60')}>
              {memories.map((memory) => (
                <li key={memory.id} className="flex min-w-0 items-start gap-2.5 py-2 pr-1.5 pl-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs break-words">{memory.text}</p>
                    <p className="text-muted-foreground text-[11px]">{memory.source}</p>
                  </div>
                  <IconAction label={`Forget “${memory.text}”`} onClick={() => forget(memory)} icon={Cancel01Icon} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="rounded-lg border px-4 py-6">
              <EmptyHeader className="max-w-64">
                <EmptyMedia className="mb-1">
                  <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="text-muted-foreground size-5" />
                </EmptyMedia>
                <EmptyTitle className="text-xs">Nothing remembered yet</EmptyTitle>
                <EmptyDescription className="text-[11px]">
                  {enabled ? 'Useful details from your chats will show up here.' : 'Turn memory on to let the assistant save details.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>

        <div className="grid gap-1.5 border-t pt-3">
          <Label htmlFor={`${id}-instructions`}>Custom instructions</Label>
          <p id={`${id}-instructions-hint`} className="text-muted-foreground text-[11px]">
            How should the assistant answer? This applies to every chat.
          </p>
          <Textarea
            id={`${id}-instructions`}
            aria-describedby={`${id}-instructions-hint ${id}-count`}
            value={draft}
            maxLength={MAX}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                save()
              }
            }}
            placeholder="For example: answer in short bullet points and always name the job ID."
            className="min-h-20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              id={`${id}-count`}
              className={cn(
                'text-muted-foreground mr-auto text-[11px] tabular-nums',
                count >= MAX * 0.9 && 'text-status-progress',
                count >= MAX && 'text-destructive',
              )}
            >
              {formatNumber(count)} / {formatNumber(MAX)}
            </span>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setDraft(saved)}>Discard</Button>
            )}
            <Button size="sm" disabled={!dirty} onClick={save}>Save</Button>
          </div>
        </div>
      </div>

      <DeleteConfirm
        open={confirmClear}
        onOpenChange={setConfirmClear}
        icon={null}
        title="Clear everything the assistant remembers?"
        description={`It forgets all ${memories.length} saved ${memories.length === 1 ? 'detail' : 'details'}. Your custom instructions stay.`}
        confirmLabel="Clear all"
        onConfirm={clearAll}
      />
    </Panel>
  )
}
