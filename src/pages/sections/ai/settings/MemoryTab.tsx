import { useId } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon } from '@hugeicons/core-free-icons'
import { MemoryManager, type Memory } from '@/blocks/ai/memory/memory-manager'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { downloadText } from '@/lib/download'
import { formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { useOrgPolicy } from '../admin/org'
import { now } from '../data'
import { useAiPrefs, useStoredState } from './prefs'
import { MEMORIES_KEY, SAMPLE_MEMORIES } from './memory-data'

// Settings › Memory: whether the assistant remembers across chats and may
// look at past chats, then what it has remembered, kept in this browser.

function toMarkdown(memories: Memory[]) {
  const lines = [...memories]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m) => `- ${m.text} _(${m.source ? `from “${m.source}”, ` : ''}${formatShortDate(m.createdAt, { year: true })})_`)
  return `# Memories\n\nExported ${formatShortDate(now(), { year: true })}. ${plural(memories.length, 'memory', 'memories')}.\n\n${lines.join('\n')}\n`
}

export function MemoryTab() {
  const { prefs, set } = useAiPrefs()
  // Off for everyone when the organisation turned memory off (Admin › Models and features).
  const allowed = useOrgPolicy().policy.features.memory
  const memoryOn = allowed && prefs.memory
  const uid = useId()
  const [memories, setMemories] = useStoredState<Memory[]>(MEMORIES_KEY, SAMPLE_MEMORIES)

  const remove = (id: string) => {
    const at = memories.findIndex((m) => m.id === id)
    const gone = memories[at]
    if (!gone) return
    setMemories((list) => list.filter((m) => m.id !== id))
    toast('Memory deleted', {
      description: gone.text,
      action: { label: 'Undo', onClick: () => setMemories((list) => [...list.slice(0, at), gone, ...list.slice(at)]) },
    })
  }

  const clearAll = () => {
    const before = memories
    setMemories([])
    toast(`Cleared ${plural(before.length, 'memory', 'memories')}`, {
      action: { label: 'Undo', onClick: () => setMemories(before) },
    })
  }

  return (
    <div className="grid min-w-0 gap-6">
      <SettingsHeader
        title="Memory"
        description="What the assistant remembers about you between chats, so you don't have to repeat yourself."
      />

      <SettingsGroup>
        <SettingsRow
          label="Memory"
          htmlFor={`${uid}-memory`}
          hint={allowed
            ? 'Let the assistant save useful details as you chat, such as your role or how you like answers, and use them later.'
            : 'Turned off for everyone by your organisation.'}
        >
          <Switch id={`${uid}-memory`} checked={memoryOn} disabled={!allowed} onCheckedChange={(on) => set('memory', on)} />
        </SettingsRow>
        <SettingsRow
          label="Reference past chats"
          htmlFor={`${uid}-reference`}
          hint="Let it search your earlier chats for context when a question needs it. Incognito chats are never included."
        >
          <Switch id={`${uid}-reference`} checked={prefs.referenceChats} onCheckedChange={(on) => set('referenceChats', on)} />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Saved memories"
        description="Edit one to correct it, or delete what it should forget. Each shows the chat it came from."
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={memories.length === 0}
            onClick={() => {
              downloadText('memories.md', toMarkdown(memories), 'text/markdown')
              toast(`Exported ${plural(memories.length, 'memory', 'memories')}`)
            }}
          >
            <HugeiconsIcon icon={Download04Icon} strokeWidth={2} data-icon="inline-start" />
            Export memories
          </Button>
        }
        className="border-0 bg-transparent"
      >
        <MemoryManager
          memories={memories}
          now={now()}
          enabled={memoryOn}
          onEdit={(id, text) => {
            setMemories((list) => list.map((m) => (m.id === id ? { ...m, text, updatedAt: now() } : m)))
            toast('Memory updated')
          }}
          onDelete={remove}
          onClearAll={clearAll}
        />
      </SettingsGroup>
    </div>
  )
}
