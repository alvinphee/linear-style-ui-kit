import { useCallback, useSyncExternalStore } from 'react'
import type { ModelId } from '../types'

// The AI chat app's settings, kept in this browser so the mockup feels lived
// in. Settings the rest of the app reads live in Prefs (useAiPrefs). A tab
// with its own records (connected apps, memories, signed-in devices) keeps
// them under its own key with useStoredState.

export type ResponseStyle = 'default' | 'concise' | 'explanatory' | 'formal'
export type ChatFont = 'default' | 'serif' | 'mono' | 'dyslexic'
export type TextSize = 'sm' | 'md' | 'lg'

export type Prefs = {
  // Profile
  fullName: string
  nickname: string
  role: string
  language: string
  // Appearance (theme and accent live in lib/theme)
  chatFont: ChatFont
  textSize: TextSize
  enterToSend: boolean
  showThinking: boolean
  // Personalisation
  aboutYou: string
  instructions: string
  style: ResponseStyle
  // Memory
  memory: boolean
  referenceChats: boolean
  // Models and features
  extendedThinking: boolean
  webSearch: boolean
  artifacts: boolean
  codeExecution: boolean
  imageGeneration: boolean
  // Voice
  voice: string
  voiceSpeed: number
  autoSend: boolean
  // Data controls
  improve: boolean
  retentionDays: number | null
  // The model new chats start with lives in the workspace store; this is only
  // so a tab can show it without the store.
  defaultModel?: ModelId
}

export const PREFS_KEY = 'linear-kit:ai-settings:v2'
const OLD_KEY = 'linear-kit:ai-settings:v1'

export const DEFAULT_PREFS: Prefs = {
  fullName: 'Alex Morgan',
  nickname: 'Alex',
  role: '',
  language: 'English',
  chatFont: 'default',
  textSize: 'md',
  enterToSend: true,
  showThinking: true,
  aboutYou: '',
  instructions: '',
  style: 'default',
  memory: true,
  referenceChats: true,
  extendedThinking: false,
  webSearch: true,
  artifacts: true,
  codeExecution: true,
  imageGeneration: false,
  voice: 'aria',
  voiceSpeed: 1,
  autoSend: true,
  improve: false,
  retentionDays: null,
}

// The saved value, or undefined when there is none (or storage is blocked).
function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private windows can refuse storage; the settings still work for this visit.
  }
}

// One copy per key for the whole page, so every tab and the app see a change
// at once.
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()

function snapshot<T>(key: string, initial: T): T {
  if (!cache.has(key)) {
    const saved = read<T>(key)
    const isObject = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v)
    cache.set(key, saved === undefined ? initial : isObject(initial) && isObject(saved) ? { ...initial, ...saved } : saved)
  }
  return cache.get(key) as T
}

function update<T>(key: string, value: T) {
  cache.set(key, value)
  write(key, value)
  listeners.get(key)?.forEach((l) => l())
}

function subscribe(key: string, listener: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key)!.add(listener)
  return () => listeners.get(key)!.delete(listener)
}

// A value kept in this browser under `key`, shared by every component that
// uses the same key. Objects are merged over `initial`, so a new field gets
// its default.
export function useStoredState<T>(key: string, initial: T) {
  const value = useSyncExternalStore(
    (l) => subscribe(key, l),
    () => snapshot(key, initial),
  )
  const set = useCallback((next: T | ((prev: T) => T)) => {
    const prev = snapshot(key, initial)
    update(key, typeof next === 'function' ? (next as (p: T) => T)(prev) : next)
    // `initial` is a default, read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [value, set] as const
}

// The settings, with the old dialog's answers carried over.
export function useAiPrefs() {
  if (!cache.has(PREFS_KEY) && read(PREFS_KEY) === undefined) {
    const old = read<Partial<Prefs>>(OLD_KEY)
    if (old) update(PREFS_KEY, { ...DEFAULT_PREFS, ...old })
  }
  const [prefs, setPrefs] = useStoredState<Prefs>(PREFS_KEY, DEFAULT_PREFS)
  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }))
  }, [setPrefs])
  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), [setPrefs])
  return { prefs, set, reset }
}
