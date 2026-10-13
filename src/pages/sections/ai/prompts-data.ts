import { useCallback, useMemo } from 'react'
import type { PromptDraft, SavedPrompt } from '@/blocks/ai/chat/prompt-library'
import { at, now, uid, USER } from './data'
import { useStoredState } from './settings/prefs'

// The AI chat app's prompt library: made-up prompts of your own and shared
// by the team. Yours (and which prompts are favourites) are kept in this
// browser; the team's are fixed sample data.

export const PROMPTS_KEY = 'linear-kit:ai-prompts:v1'

type StoredPrompt = Omit<SavedPrompt, 'favourite'>
type Stored = { prompts: StoredPrompt[]; favourites: string[] }

export const SAMPLE_PROMPTS: StoredPrompt[] = [
  {
    id: 'pr-late-today',
    title: 'Late jobs today',
    text: 'List every job due today that is late or at risk, grouped by driver, with the reason for each.',
    tags: ['jobs', 'daily'],
    scope: 'yours',
    author: USER.name,
    updatedAt: at(1, 9, 10),
  },
  {
    id: 'pr-delay-email',
    title: 'Customer delay email',
    text: 'Draft a short, warm email to {{customer}} explaining that job {{job}} is delayed by {{delay}}. Apologise once, give the new delivery time, and offer a call.',
    tags: ['email', 'customers'],
    scope: 'yours',
    author: USER.name,
    updatedAt: at(3, 14, 20),
  },
  {
    id: 'pr-status-update',
    title: 'Weekly status update',
    text: 'Write a weekly status update for {{team}} covering what shipped, what slipped and what is next. Keep it under 200 words, and end with a short list of risks.',
    tags: ['writing', 'status'],
    scope: 'yours',
    author: USER.name,
    updatedAt: at(6, 16, 45),
  },
  {
    id: 'pr-minutes',
    title: 'Meeting minutes',
    text: 'Turn these notes into minutes: who attended, the decisions, then actions as a table with owner and due date.\n\nNotes:\n{{notes}}',
    tags: ['meetings'],
    scope: 'yours',
    author: USER.name,
    updatedAt: at(9, 11, 0),
  },
  {
    id: 'pr-explain',
    title: 'Explain it to a new starter',
    text: 'Explain {{topic}} to someone in their first week. Use one example from our jobs, and leave out the jargon.',
    tags: ['onboarding'],
    scope: 'yours',
    author: USER.name,
    updatedAt: at(14, 10, 30),
  },
]

export const TEAM_PROMPTS: SavedPrompt[] = [
  {
    id: 'pr-team-incident',
    title: 'Incident report',
    text: 'Write an incident report for {{incident}}: what happened, the impact on customers, a timeline, the root cause, and actions with owners.',
    tags: ['incidents', 'operations'],
    scope: 'team',
    author: 'Mei Ling',
    updatedAt: at(2, 15, 5),
  },
  {
    id: 'pr-team-workload',
    title: 'Driver workload check',
    text: 'Compare driver workload this week and suggest which jobs to move so nobody works more than {{hours}} hours.',
    tags: ['jobs', 'planning'],
    scope: 'team',
    author: 'Ravi',
    updatedAt: at(4, 8, 40),
  },
  {
    id: 'pr-team-qbr',
    title: 'Quarterly business review',
    text: 'Outline a quarterly business review with {{customer}}: results against targets, open issues, and three proposals for next quarter.',
    tags: ['customers', 'planning'],
    scope: 'team',
    author: 'Daniel',
    updatedAt: at(5, 13, 15),
  },
  {
    id: 'pr-team-release',
    title: 'Release notes',
    text: 'Write release notes for {{version}} from the changes below. Group them as New, Improved and Fixed, in plain words.\n\n{{changes}}',
    tags: ['product', 'writing'],
    scope: 'team',
    author: 'Siti',
    updatedAt: at(8, 17, 50),
  },
  {
    id: 'pr-team-translate',
    title: 'Translate a notice',
    text: 'Translate this notice into {{language}}. Keep the tone friendly, and leave times and job numbers as they are.\n\n{{notice}}',
    tags: ['translation'],
    scope: 'team',
    author: 'Mei Ling',
    updatedAt: at(11, 9, 25),
  },
  {
    id: 'pr-team-patterns',
    title: 'Late job patterns',
    text: 'Look at last week’s late jobs and find patterns: routes, times of day, customers. End with three changes we could try.',
    tags: ['jobs', 'analysis'],
    scope: 'team',
    author: 'Ali',
    updatedAt: at(12, 14, 0),
  },
  {
    id: 'pr-team-polish',
    title: 'Polish my writing',
    text: 'Rewrite the text below to be clearer and shorter, keeping my voice. Show the result first, then a list of what you changed.\n\n{{text}}',
    tags: ['writing'],
    scope: 'team',
    author: 'Ravi',
    updatedAt: at(20, 12, 10),
  },
]

const INITIAL: Stored = { prompts: SAMPLE_PROMPTS, favourites: ['pr-late-today', 'pr-delay-email', 'pr-team-workload'] }

// Every prompt with its favourite flag, newest first within yours, and the
// actions that change them. Prompts you share stay yours to edit.
export function usePromptLibrary() {
  const [state, setState] = useStoredState<Stored>(PROMPTS_KEY, INITIAL)

  const prompts = useMemo((): SavedPrompt[] => {
    const favourites = new Set(state.favourites)
    return [...state.prompts, ...TEAM_PROMPTS].map((p) => ({ ...p, favourite: favourites.has(p.id) }))
  }, [state])

  const canManage = useCallback((prompt: SavedPrompt) => state.prompts.some((p) => p.id === prompt.id), [state.prompts])

  const save = useCallback((draft: PromptDraft): SavedPrompt => {
    const prompt: StoredPrompt = { ...draft, id: uid('pr'), author: USER.name, updatedAt: now() }
    setState((s) => ({ ...s, prompts: [prompt, ...s.prompts] }))
    return prompt
  }, [setState])

  const update = useCallback((id: string, draft: PromptDraft) => {
    setState((s) => ({ ...s, prompts: s.prompts.map((p) => (p.id === id ? { ...p, ...draft, updatedAt: now() } : p)) }))
  }, [setState])

  const remove = useCallback((id: string) => {
    setState((s) => ({ prompts: s.prompts.filter((p) => p.id !== id), favourites: s.favourites.filter((f) => f !== id) }))
  }, [setState])

  const toggleFavourite = useCallback((id: string, favourite: boolean) => {
    setState((s) => ({
      ...s,
      favourites: favourite ? [...s.favourites.filter((f) => f !== id), id] : s.favourites.filter((f) => f !== id),
    }))
  }, [setState])

  return { prompts, canManage, save, update, remove, toggleFavourite }
}
