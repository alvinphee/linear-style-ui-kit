import { useCallback, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain01Icon, BookOpen01Icon, BotIcon, Database01Icon, Folder01Icon, Globe02Icon, MicroscopeIcon, Plug01Icon,
  Task01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { PromptBox, type PromptMode, type PromptSuggestion } from '@/blocks/ai/chat/prompt-box'
import {
  PromptLibrary, PromptLibraryView, PromptVariablesForm, SavePromptDialog, type PromptDraft, type SavedPrompt,
} from '@/blocks/ai/chat/prompt-library'
import { FILE_KIND_ICONS } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Panel, Row } from '../shared'
import { now, USER } from '../ai/data'
import { SAMPLE_PROMPTS, TEAM_PROMPTS } from '../ai/prompts-data'

// The composer's parts on their own: the prompt library (inline and as a
// dialog), filling in a prompt's variables, saving a prompt, a queued
// message while a reply runs, and the "@" menu's groups with the Research
// mode. Everything here is local state; nothing is kept.

const FAVOURITES = new Set(['pr-late-today', 'pr-delay-email', 'pr-team-workload'])
const START: SavedPrompt[] = [...SAMPLE_PROMPTS, ...TEAM_PROMPTS].map((p) => ({ ...p, favourite: FAVOURITES.has(p.id) }))

let demoSeq = 0

// The library's prompts in local state, with the actions its callbacks need.
function useDemoPrompts() {
  const [prompts, setPrompts] = useState(START)
  return {
    prompts,
    canManage: (p: SavedPrompt) => p.scope === 'yours' || p.author === USER.name,
    save(draft: PromptDraft) {
      setPrompts((list) => [{ ...draft, id: `demo-${++demoSeq}`, author: USER.name, updatedAt: now() }, ...list])
      toast('Prompt saved', { description: `${draft.title}. Demo only: it is gone on reload.` })
    },
    edit(id: string, draft: PromptDraft) {
      setPrompts((list) => list.map((p) => (p.id === id ? { ...p, ...draft, updatedAt: now() } : p)))
      toast('Prompt updated', { description: draft.title })
    },
    remove(id: string) {
      setPrompts((list) => list.filter((p) => p.id !== id))
      toast('Prompt deleted')
    },
    toggleFavourite(id: string, favourite: boolean) {
      setPrompts((list) => list.map((p) => (p.id === id ? { ...p, favourite } : p)))
    },
  }
}

const used = (prompt: SavedPrompt, text: string) => toast(`Used “${prompt.title}”`, { description: text })

const SAMPLE_MENTIONS: PromptSuggestion[] = [
  { id: 'agent:triage', group: 'Agents', label: 'Job triage', hint: 'Sorts new jobs by urgency and assigns a driver', icon: BotIcon, colour: 'var(--chart-1)' },
  { id: 'agent:collector', group: 'Agents', label: 'Invoice chaser', hint: 'Sends payment reminders for overdue invoices', icon: BotIcon, colour: 'var(--chart-4)' },
  { id: 'file:rates', group: 'Project files', label: 'Rate card 2026.pdf', hint: '240 KB', icon: FILE_KIND_ICONS.pdf },
  { id: 'file:routes', group: 'Project files', label: 'Routes.xlsx', hint: '86 KB', icon: FILE_KIND_ICONS.sheet },
  { id: 'project:ops', group: 'Projects', label: 'Operations', icon: Folder01Icon, colour: 'var(--chart-2)' },
  { id: 'knowledge:handbook', group: 'Knowledge', label: 'Driver handbook', hint: '18 documents', icon: Database01Icon, colour: 'var(--chart-3)' },
  { id: 'knowledge:policies', group: 'Knowledge', label: 'Customer policies', hint: '9 documents', icon: Database01Icon, colour: 'var(--chart-5)' },
  { id: 'connector:drive', group: 'Connectors', label: 'Cloud drive', hint: 'alex@example.com', icon: Plug01Icon },
  { id: 'person:ravi', group: 'People', label: 'Ravi', person: true },
  { id: 'person:mei', group: 'People', label: 'Mei Ling', person: true },
  { id: 'job:do-24817', group: 'Jobs', label: 'DO-24817', hint: 'Chilled goods to Bayview Foods', icon: Task01Icon },
]

const sampleMentions = (query: string) => {
  const q = query.toLowerCase()
  return SAMPLE_MENTIONS.filter((s) => s.label.toLowerCase().includes(q))
}

function LibraryPanel() {
  const demo = useDemoPrompts()
  const [open, setOpen] = useState(false)
  const props = {
    prompts: demo.prompts,
    canManage: demo.canManage,
    onSave: demo.save,
    onEdit: demo.edit,
    onDelete: demo.remove,
    onToggleFavourite: demo.toggleFavourite,
  }
  return (
    <Panel title="Prompt library" note="Search, tabs, star, Use (fills in variables first), New prompt" wide>
      <div className="grid min-w-0 gap-3">
        <PromptLibraryView {...props} onUse={used} className="h-[34rem]" />
        <Row>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} data-icon="inline-start" />
            Open as a dialog
          </Button>
          <span className="text-muted-foreground text-xs">As the prompt box's toolbar button and the /prompts command open it.</span>
        </Row>
        <PromptLibrary {...props} open={open} onOpenChange={setOpen} onUse={used} />
      </div>
    </Panel>
  )
}

function VariablesPanel() {
  const [round, setRound] = useState(0)
  const prompt = SAMPLE_PROMPTS.find((p) => p.id === 'pr-delay-email') ?? SAMPLE_PROMPTS[0]
  return (
    <Panel title="Fill in the variables" note="One field per {{variable}}, the preview follows">
      <PromptVariablesForm
        key={round}
        prompt={prompt}
        onSubmit={(text) => {
          toast('Put in the message box', { description: text })
          setRound((r) => r + 1)
        }}
        onCancel={() => setRound((r) => r + 1)}
        cancelLabel="Clear"
      />
    </Panel>
  )
}

function SavePanel() {
  const [mode, setMode] = useState<'new' | 'edit' | null>(null)
  const editing = SAMPLE_PROMPTS[2]
  return (
    <Panel title="Save as prompt" note="Title, prompt, tags, share with your team">
      <div className="grid min-w-0 gap-3">
        <p className="text-muted-foreground text-xs">
          Opened from the prompt box's bookmark button once something is written, with the text filled in and a title
          suggested from its first line. Variables are listed as you type them.
        </p>
        <Row>
          <Button size="sm" onClick={() => setMode('new')}>Save as prompt</Button>
          <Button variant="outline" size="sm" onClick={() => setMode('edit')}>Edit a prompt</Button>
        </Row>
      </div>
      <SavePromptDialog
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
        editing={mode === 'edit'}
        prompt={mode === 'edit'
          ? editing
          : { text: 'Summarise the open jobs for {{customer}} this week, and flag any that are late.' }}
        onSave={(draft) => {
          setMode(null)
          toast(mode === 'edit' ? 'Prompt updated' : 'Prompt saved', { description: `${draft.title}. Demo only.` })
        }}
      />
    </Panel>
  )
}

function QueuePanel() {
  const [running, setRunning] = useState(true)
  const [queued, setQueued] = useState<string | null>('Also list the jobs for Orchid Pharma')
  const [text, setText] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const wasRunning = useRef(running)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    const was = wasRunning.current
    wasRunning.current = running
    if (!was || running || queued === null) return
    toast('Sent the queued message', { description: queued })
    setQueued(null)
  }, [running, queued])

  const start = () => {
    setRunning(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setRunning(false), 8000)
  }

  return (
    <Panel title="Queued message" note="Enter while a reply runs: sent when it ends">
      <div className="grid min-w-0 gap-3">
        <PromptBox
          value={text}
          onValueChange={setText}
          running={running}
          onStop={() => {
            window.clearTimeout(timer.current)
            setRunning(false)
          }}
          placeholder={running ? 'Write a follow-up: it sends when this reply ends' : 'Ask anything'}
          onSubmit={(value) => {
            toast('Sent', { description: `${value} Demo only.` })
          }}
          onQueue={(value) => {
            if (queued !== null) toast('Replaced the queued message')
            setQueued(value)
          }}
          queued={queued !== null ? { text: queued } : null}
          onEditQueued={() => {
            if (queued === null) return
            setText((current) => (current.trim() ? `${queued}\n${current}` : queued))
            setQueued(null)
          }}
          onCancelQueued={() => setQueued(null)}
          maxAttachments={0}
        />
        <Row>
          <Button variant="outline" size="sm" disabled={running} onClick={start}>Start a reply</Button>
          <span className="text-muted-foreground text-xs">{running ? 'A reply is running. Stop it to send the queued message now.' : 'Runs for 8 seconds.'}</span>
        </Row>
      </div>
    </Panel>
  )
}

function MentionsPanel() {
  const [modes, setModes] = useState({ web: true, deep: false, research: false })
  const list: PromptMode[] = [
    { id: 'web', label: 'Web search', icon: Globe02Icon, on: modes.web },
    { id: 'deep', label: 'Deep think', icon: AiBrain01Icon, on: modes.deep },
    { id: 'research', label: 'Research', icon: MicroscopeIcon, on: modes.research },
  ]
  const toggle = useCallback((id: string) => {
    setModes((m) => {
      if (id === 'research') return { ...m, research: !m.research, web: !m.research || m.web }
      if (id === 'web') return { ...m, web: !m.web, research: !m.web ? m.research : false }
      return { ...m, deep: !m.deep }
    })
  }, [])
  return (
    <Panel title="Mentions and Research" note="Type @ for the groups" wide>
      <div className="mx-auto grid w-full max-w-2xl min-w-0 gap-3">
        <p className="text-muted-foreground text-xs">
          The "@" menu lists agents, the open project's files, other projects, knowledge bases, connected connectors,
          people and jobs, in that order: a few of each at first, up to four of each as you type. Research turns Web
          search on with it, and says what to expect under the box.
        </p>
        <PromptBox
          placeholder="Type @ to mention, or turn on Research"
          getMentions={sampleMentions}
          modes={list}
          onModeToggle={toggle}
          tools={<IconAction label="Prompt library" icon={BookOpen01Icon} onClick={() => toast('Opens the prompt library', { description: 'Demo only.' })} />}
          onSubmit={(value) => {
            toast(modes.research ? 'Research started' : 'Sent', { description: `${value} Demo only.` })
          }}
          footer={modes.research && (
            <span className="flex min-w-0 items-center gap-1">
              <HugeiconsIcon icon={MicroscopeIcon} strokeWidth={2} className="size-3 shrink-0" aria-hidden="true" />
              Research takes a few minutes and ends with a report
            </span>
          )}
        />
      </div>
    </Panel>
  )
}

export function ComposerPanels() {
  return (
    <>
      <LibraryPanel />
      <VariablesPanel />
      <SavePanel />
      <QueuePanel />
      <MentionsPanel />
    </>
  )
}
