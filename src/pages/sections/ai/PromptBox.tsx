import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AiBrain01Icon, Folder01Icon, Globe02Icon, Task01Icon } from '@hugeicons/core-free-icons'
import {
  PromptBox as PromptBoxBlock, type PromptBoxHandle, type PromptDictation, type PromptMode, type PromptSuggestion,
} from '@/blocks/ai/chat/prompt-box'
import { PEOPLE } from '../../data'
import { useJobs } from '../../jobs-store'
import { useActions } from './context'
import { SLASH_COMMANDS, toFileRef } from './data'
import type { Modes, Project } from './types'

// The workspace's prompt box: the prompt-box block fed with the workspace's
// people, jobs and projects for "@", its slash commands, its two modes, and a
// scripted dictation.

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

export function PromptBox({ running, modes, projects, placeholder, focusKey = 0, className }: {
  running: boolean
  modes: Modes
  projects: Project[]
  placeholder?: string
  // Bump to move focus into the box, e.g. after a starter card was used.
  focusKey?: number
  className?: string
}) {
  const actions = useActions()
  const { jobs } = useJobs()
  const boxRef = useRef<PromptBoxHandle>(null)

  // A remount (say, opening another chat) must not grab focus again, so the
  // last request that was honoured is remembered across instances.
  useEffect(() => {
    if (!focusKey || focusKey === handledFocusKey) return
    handledFocusKey = focusKey
    boxRef.current?.focus({ preventScroll: true })
  }, [focusKey])

  const getMentions = useCallback((query: string): PromptSuggestion[] => {
    const q = query.toLowerCase()
    const people: PromptSuggestion[] = PEOPLE.filter((p) => p.toLowerCase().includes(q)).slice(0, 4).map((p) => ({
      id: `person:${p.toLowerCase()}`, group: 'People', label: p, insert: `@${p} `, person: true,
    }))
    const jobItems: PromptSuggestion[] = jobs
      .filter((j) => j.id.toLowerCase().includes(q) || j.title.toLowerCase().includes(q))
      .slice(0, 4)
      .map((j) => ({ id: `job:${j.id.toLowerCase()}`, group: 'Jobs', label: j.id, hint: j.title, insert: `@${j.id} `, icon: Task01Icon }))
    const projectItems: PromptSuggestion[] = projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3).map((p) => ({
      id: `project:${p.id}`, group: 'Projects', label: p.name, insert: `@${p.name} `, icon: Folder01Icon, colour: p.colour,
    }))
    return [...people, ...jobItems, ...projectItems]
  }, [jobs, projects])

  const modeList = useMemo((): PromptMode[] => [
    { id: 'web', label: 'Web search', icon: Globe02Icon, on: modes.web },
    { id: 'deep', label: 'Deep think', icon: AiBrain01Icon, on: modes.deep },
  ], [modes])

  return (
    <PromptBoxBlock
      ref={boxRef}
      className={className}
      placeholder={placeholder ?? 'Ask anything, @ to mention, / for commands'}
      running={running}
      onStop={actions.stop}
      onSubmit={(text, files) => {
        actions.send(text || 'Take a look at the attached files', files.map(toFileRef))
      }}
      modes={modeList}
      onModeToggle={(id) => {
        const key = id as keyof Modes
        actions.setModes({ ...modes, [key]: !modes[key] })
      }}
      commands={SLASH_COMMANDS}
      getMentions={getMentions}
      dictation={DICTATION}
    />
  )
}
