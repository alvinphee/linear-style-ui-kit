import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain01Icon, AiVoiceIcon, BookOpen01Icon, BookmarkAdd02Icon, BotIcon, Database01Icon, Folder01Icon, Globe02Icon,
  MicroscopeIcon, Plug01Icon, Task01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  PromptBox as PromptBoxBlock, type PromptAttachment, type PromptBoxHandle, type PromptCommand, type PromptDictation,
  type PromptMode, type PromptSuggestion,
} from '@/blocks/ai/chat/prompt-box'
import { PromptLibrary, SavePromptDialog } from '@/blocks/ai/chat/prompt-library'
import { FILE_KIND_ICONS } from '@/components/file-chip'
import { IconAction } from '@/components/icon-action'
import { formatFileSize } from '@/lib/format'
import { plural } from '@/lib/text'
import { PEOPLE } from '../../data'
import { useJobs } from '../../jobs-store'
import { useOrgPolicy } from './admin/org'
import { useAgents } from './agents/context'
import { useActions } from './context'
import { SLASH_COMMANDS, toFileRef } from './data'
import { useKnowledge } from './knowledge/context'
import { usePromptLibrary } from './prompts-data'
import { useConnectors } from './settings/ConnectorsTab'
import type { Modes, Project } from './types'
import { VoiceSession } from './VoiceSession'

// The workspace's prompt box: the prompt-box block fed with the workspace's
// agents, projects (and the open project's files), knowledge bases, connected
// connectors, people and jobs for "@"; its slash commands, with /prompts for
// the prompt library; three modes (Web search, Deep think, Research); a
// scripted dictation; and a queued message while a reply is running.

const TRANSCRIPTS = [
  'Summarise the jobs due today and flag anything that is late.',
  'Draft an email to Bayview Foods about the delay on DO-24817.',
  'Compare driver workload this week.',
]
let transcriptIndex = 0
let handledFocusKey = 0

const DICTATION: PromptDictation = {
  maxMs: 15_000,
  transcribe: (signal) => new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(TRANSCRIPTS[transcriptIndex++ % TRANSCRIPTS.length]), 800)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(signal.reason)
    })
  }),
}

const COMMANDS: PromptCommand[] = [
  ...SLASH_COMMANDS,
  { name: 'prompts', icon: BookOpen01Icon, description: 'Open the prompt library' },
]

const QUEUE_PLACEHOLDER = 'Write a follow-up: it sends when this reply ends'

type Queued = { text: string; files: PromptAttachment[] }

export function PromptBox({ running, awaiting = false, modes, projects, project, placeholder, focusKey = 0, className }: {
  running: boolean
  // The reply stopped to ask for an approval. A queued message waits for the
  // answer: sending it now would count as Deny.
  awaiting?: boolean
  modes: Modes
  projects: Project[]
  // The open project: its files join the "@" menu.
  project?: Project | null
  placeholder?: string
  // Bump to move focus into the box, e.g. after a starter card was used.
  focusKey?: number
  className?: string
}) {
  const actions = useActions()
  const { jobs } = useJobs()
  const { agents, shared } = useAgents()
  const { bases } = useKnowledge()
  const { connectors } = useConnectors()
  const library = usePromptLibrary()
  const boxRef = useRef<PromptBoxHandle>(null)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<PromptAttachment[]>([])
  const [queued, setQueued] = useState<Queued | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  // A remount (say, opening another chat) must not grab focus again, so the
  // last request that was honoured is remembered across instances.
  useEffect(() => {
    if (!focusKey || focusKey === handledFocusKey) return
    handledFocusKey = focusKey
    boxRef.current?.focus({ preventScroll: true })
  }, [focusKey])

  // Send the queued message once the reply it waited for ends (finished or
  // stopped), but not while it waits for an approval.
  const wasRunning = useRef(running)
  useEffect(() => {
    const was = wasRunning.current
    wasRunning.current = running
    if (!was || running || !queued || awaiting) return
    setQueued(null)
    actions.send(queued.text || 'Take a look at the attached files', queued.files.map(toFileRef))
  }, [running, awaiting, queued, actions])

  const allAgents = useMemo(() => [...agents, ...shared], [agents, shared])
  const connected = useMemo(() => connectors.filter((c) => c.status === 'connected'), [connectors])

  const getMentions = useCallback((query: string): PromptSuggestion[] => {
    const q = query.toLowerCase()
    const has = (...words: (string | undefined)[]) => words.some((w) => w?.toLowerCase().includes(q))
    // An empty query shows a short taste of each group; typing shows up to four.
    const max = (short: number) => (q ? 4 : short)

    const agentItems: PromptSuggestion[] = allAgents.filter((a) => has(a.name)).slice(0, max(3)).map((a) => ({
      id: `agent:${a.id}`, group: 'Agents', label: a.name, hint: a.description, icon: a.icon ?? BotIcon, colour: a.colour,
    }))
    const fileItems: PromptSuggestion[] = (project?.files ?? []).filter((f) => has(f.name)).slice(0, max(3)).map((f) => ({
      id: `file:${f.id}`, group: 'Project files', label: f.name, hint: formatFileSize(f.size), icon: FILE_KIND_ICONS[f.kind],
    }))
    const projectItems: PromptSuggestion[] = projects
      .filter((p) => !p.archived && p.id !== project?.id && has(p.name))
      .slice(0, max(project ? 2 : 3))
      .map((p) => ({ id: `project:${p.id}`, group: 'Projects', label: p.name, icon: Folder01Icon, colour: p.colour }))
    const baseItems: PromptSuggestion[] = bases.filter((b) => has(b.name)).slice(0, max(2)).map((b) => ({
      id: `knowledge:${b.id}`, group: 'Knowledge', label: b.name, hint: plural(b.documents.length, 'document'),
      icon: b.icon ?? Database01Icon, colour: b.colour,
    }))
    const connectorItems: PromptSuggestion[] = connected.filter((c) => has(c.name)).slice(0, max(2)).map((c) => ({
      id: `connector:${c.id}`, group: 'Connectors', label: c.name, hint: c.account, icon: c.icon ?? Plug01Icon, colour: c.colour,
    }))
    const people: PromptSuggestion[] = PEOPLE.filter((p) => has(p)).slice(0, max(3)).map((p) => ({
      id: `person:${p.toLowerCase()}`, group: 'People', label: p, person: true,
    }))
    const jobItems: PromptSuggestion[] = jobs.filter((j) => has(j.id, j.title)).slice(0, max(3)).map((j) => ({
      id: `job:${j.id.toLowerCase()}`, group: 'Jobs', label: j.id, hint: j.title, icon: Task01Icon,
    }))
    return [...agentItems, ...fileItems, ...projectItems, ...baseItems, ...connectorItems, ...people, ...jobItems]
  }, [allAgents, project, projects, bases, connected, jobs])

  // Modes the organisation turned off are left out (Admin › Models and features).
  const { features } = useOrgPolicy().policy
  const modeList = useMemo((): PromptMode[] => [
    ...(features.webSearch ? [{ id: 'web', label: 'Web search', icon: Globe02Icon, on: modes.web }] : []),
    { id: 'deep', label: 'Deep think', icon: AiBrain01Icon, on: modes.deep },
    ...(features.research && features.webSearch ? [{ id: 'research', label: 'Research', icon: MicroscopeIcon, on: !!modes.research }] : []),
  ], [modes, features.webSearch, features.research])

  // Research searches the web, so it brings Web search with it, and turning
  // Web search off ends Research.
  const toggleMode = (id: string) => {
    if (id === 'research') {
      const research = !modes.research
      actions.setModes({ ...modes, research, web: research || modes.web })
    } else if (id === 'web') {
      const web = !modes.web
      actions.setModes({ ...modes, web, research: web ? modes.research : false })
    } else {
      actions.setModes({ ...modes, deep: !modes.deep })
    }
  }

  // Dialogs hand focus back to the box, wherever they were opened from.
  const focusBox = (e: Event) => {
    e.preventDefault()
    boxRef.current?.focus({ preventScroll: true })
  }

  return (
    <>
      <PromptBoxBlock
        ref={boxRef}
        className={className}
        value={text}
        onValueChange={setText}
        attachments={files}
        onAttachmentsChange={setFiles}
        placeholder={running ? QUEUE_PLACEHOLDER : placeholder ?? 'Ask anything, @ to mention, / for commands'}
        running={running}
        onStop={actions.stop}
        onSubmit={(value, attached) => {
          actions.send(value || 'Take a look at the attached files', attached.map(toFileRef))
        }}
        onQueue={(value, attached) => {
          if (queued) toast('Replaced the queued message')
          setQueued({ text: value, files: attached })
        }}
        queued={queued && { text: queued.text, attachments: queued.files.length }}
        onEditQueued={() => {
          if (!queued) return
          setText((current) => (current.trim() ? `${queued.text}\n${current}` : queued.text))
          setFiles((current) => [...queued.files, ...current])
          setQueued(null)
          boxRef.current?.focus()
        }}
        onCancelQueued={() => {
          setQueued(null)
          boxRef.current?.focus()
        }}
        modes={modeList}
        onModeToggle={toggleMode}
        tools={(
          <>
            {features.voice && <IconAction label="Voice mode" icon={AiVoiceIcon} onClick={() => setVoiceOpen(true)} disabled={running} />}
            <IconAction label="Prompt library" icon={BookOpen01Icon} onClick={() => setLibraryOpen(true)} />
            {text.trim() && <IconAction label="Save as prompt" icon={BookmarkAdd02Icon} onClick={() => setSaveOpen(true)} />}
          </>
        )}
        commands={COMMANDS}
        onCommand={(name) => {
          if (name !== 'prompts') return false
          setLibraryOpen(true)
          return true
        }}
        getMentions={getMentions}
        dictation={DICTATION}
        footer={modes.research && (
          <span className="flex min-w-0 items-center gap-1">
            <HugeiconsIcon icon={MicroscopeIcon} strokeWidth={2} className="size-3 shrink-0" aria-hidden="true" />
            Research takes a few minutes and ends with a report
          </span>
        )}
      />

      <VoiceSession open={voiceOpen} onClose={() => setVoiceOpen(false)} onTranscript={actions.addTranscript} />

      <PromptLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onCloseAutoFocus={focusBox}
        prompts={library.prompts}
        canManage={library.canManage}
        draftText={text}
        onUse={(_, filled) => setText(filled)}
        onSave={(draft) => {
          library.save(draft)
          toast(draft.scope === 'team' ? 'Prompt saved and shared with your team' : 'Prompt saved', { description: draft.title })
        }}
        onEdit={(id, draft) => {
          library.update(id, draft)
          toast('Prompt updated', { description: draft.title })
        }}
        onDelete={(id) => {
          library.remove(id)
          toast('Prompt deleted')
        }}
        onToggleFavourite={library.toggleFavourite}
      />

      <SavePromptDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onCloseAutoFocus={focusBox}
        prompt={{ text }}
        onSave={(draft) => {
          library.save(draft)
          setSaveOpen(false)
          toast(draft.scope === 'team' ? 'Prompt saved and shared with your team' : 'Saved to your prompts', {
            description: draft.title,
            action: { label: 'Open library', onClick: () => setLibraryOpen(true) },
          })
        }}
      />
    </>
  )
}
