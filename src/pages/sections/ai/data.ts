import type { IconSvgElement } from '@hugeicons/react'
import {
  AiBrain02Icon, Atom01Icon, BalanceScaleIcon, BubbleChatIcon, CheckListIcon, ChartColumnIcon, DeliveryTruck01Icon,
  FileAttachmentIcon, FlashIcon, Globe02Icon, Invoice01Icon, Mail01Icon, QuillWrite01Icon, SourceCodeIcon,
  TaskDone01Icon, TextAlignLeftIcon, TranslateIcon, Alert02Icon,
} from '@hugeicons/core-free-icons'
import type { ChatType } from '@/blocks/ai/chat/chat-history'
import { formatRelativeDate } from '@/lib/format'
import { fileKind } from '@/components/file-chip'
import type { FileRef, Model, ModelId } from './types'

// Made-up models. The choice changes the scripted thinking time and how long
// the replies are; there is no real model behind any of them.
export const MODELS: (Model & { icon: IconSvgElement })[] = [
  {
    id: 'swift', name: 'Swift', icon: FlashIcon, description: 'Fastest. Short answers for quick questions.',
    speed: 3, quality: 1, thinkMs: 2000, detail: 1, charsPerTick: 56, cost: 0.2,
  },
  {
    id: 'balanced', name: 'Balanced', icon: BalanceScaleIcon, description: 'Good for most work. The default.',
    speed: 2, quality: 2, thinkMs: 3200, detail: 2, charsPerTick: 44, cost: 0.4,
  },
  {
    id: 'depth', name: 'Depth', icon: AiBrain02Icon, description: 'Reasons step by step. Slower, more thorough.',
    speed: 1, quality: 3, thinkMs: 5000, detail: 3, charsPerTick: 40, cost: 0.8,
  },
  {
    id: 'depth-max', name: 'Depth Max', icon: Atom01Icon, description: 'Longest thinking, for hard problems.',
    speed: 1, quality: 3, thinkMs: 6000, detail: 3, charsPerTick: 36, cost: 1.5, badge: 'New',
  },
]

export const DEFAULT_MODEL: ModelId = 'balanced'

export function modelById(id: ModelId) {
  return MODELS.find((m) => m.id === id) ?? MODELS[1]
}

export const STARTERS: { icon: IconSvgElement; title: string; hint: string; prompt: string }[] = [
  { icon: Alert02Icon, title: 'Summarise urgent jobs', hint: 'A short report of what needs attention', prompt: 'Summarise the urgent jobs' },
  { icon: Mail01Icon, title: 'Draft a delay email', hint: 'To Bayview Foods about DO-24817', prompt: 'Draft an email to Bayview Foods about the delay on DO-24817' },
  { icon: TaskDone01Icon, title: 'Close today’s jobs', hint: 'Mark the jobs due today as done', prompt: 'Mark the jobs due today as done' },
  { icon: ChartColumnIcon, title: 'Compare driver workload', hint: 'Open jobs per driver, as a table', prompt: 'Compare driver workload this week' },
]

export const SLASH_COMMANDS: { name: string; icon: IconSvgElement; description: string }[] = [
  { name: 'summarise', icon: TextAlignLeftIcon, description: 'Summarise open and urgent jobs' },
  { name: 'draft', icon: QuillWrite01Icon, description: 'Draft an email to a customer' },
  { name: 'translate', icon: TranslateIcon, description: 'Translate the last draft or a notice' },
  { name: 'plan', icon: CheckListIcon, description: 'Plan tomorrow’s deliveries' },
]

// What a chat is about, from its first prompt (chatTypeOf in engine.ts): the
// icon beside it in the history, and the filters in its options and All chats.
export const CHAT_TYPES: ChatType[] = [
  { value: 'jobs', label: 'Jobs', icon: DeliveryTruck01Icon, colour: 'var(--chart-1)' },
  { value: 'writing', label: 'Writing', icon: QuillWrite01Icon, colour: 'var(--chart-2)' },
  { value: 'research', label: 'Research', icon: Globe02Icon, colour: 'var(--chart-3)' },
  { value: 'invoices', label: 'Invoices', icon: Invoice01Icon, colour: 'var(--chart-4)' },
  { value: 'code', label: 'Code', icon: SourceCodeIcon, colour: 'var(--chart-5)' },
  { value: 'planning', label: 'Planning', icon: CheckListIcon },
  { value: 'files', label: 'Files', icon: FileAttachmentIcon },
  { value: 'general', label: 'General', icon: BubbleChatIcon },
]

export const chatType = (value: string) => CHAT_TYPES.find((t) => t.value === value) ?? CHAT_TYPES[CHAT_TYPES.length - 1]

export const USER = { name: 'Alex Morgan', first: 'Alex', email: 'alex@example.com', plan: 'Team plan' }

// A fixed demo clock that starts at 30 Sep 2026, 18:40 and then runs in real
// time, so "Today" and "Yesterday" in the history always mean the same chats.
const DEMO_START = new Date(2026, 8, 30, 18, 40).getTime()
const loadedAt = Date.now()
export const now = () => DEMO_START + (Date.now() - loadedAt)
export const MINUTE = 60_000
export const DAY = 24 * 60 * MINUTE
export const at = (daysAgo: number, hour: number, minute = 0) => {
  const d = new Date(DEMO_START)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}

let counter = 0
export const uid = (prefix = 'x') => `${prefix}${Date.now().toString(36)}${(++counter).toString(36)}`

export function toFileRef(file: { name: string; size: number }): FileRef {
  return { id: uid('f'), name: file.name, size: file.size, kind: fileKind(file.name) }
}

// "Today, 18:40", "Yesterday, 09:05" or "28 Sep", on the demo clock.
export const formatWhen = (time: number) => formatRelativeDate(time, { now: now(), time: true })
