import { DEFAULT_MODEL, MODELS } from './data'
import type { ArtifactDraft } from './engine'
import { finishReply, withArtifact } from './helpers'
import { seedState } from './seed'
import type {
  Artifact, AssistantMessage, Chat, ChatShare, Message, MessageBranch, ModelId, Part, Project, Reply, ReplyStatus,
  UserMessage, View,
} from './types'
import { withProjectDefaults } from './projects/defaults'

export type State = {
  projects: Project[]
  chats: Chat[]
  artifacts: Artifact[]
  view: View
  // The model a new chat starts with.
  model: ModelId
  credits: number
  // The artifact open in the side panel.
  artifact: { id: string; version: number } | null
  // Invoices that already got a payment reminder.
  reminded: string[]
  // Incognito is on: a new chat is temporary (Chat.temporary). Not saved.
  incognito: boolean
  // The history's Chats by date (Today, Yesterday…), or one list.
  groupByDate: boolean
}

type ReplyAddress = { chatId: string; messageId: string; replyId: string }

export type Action =
  | { type: 'view'; view: View }
  | { type: 'model'; model: ModelId; chatId?: string }
  | { type: 'chat/add'; chat: Chat }
  | { type: 'chat/patch'; id: string; patch: Partial<Pick<Chat, 'title' | 'pinned' | 'projectId' | 'share'>> }
  | { type: 'chat/duplicate'; id: string; newId: string; at: number }
  // A new chat with the messages up to and including `messageId`.
  | { type: 'chat/fork'; id: string; newId: string; messageId: string; at: number }
  | { type: 'chat/delete'; id: string }
  | { type: 'message/add'; chatId: string; messages: Message[]; at: number }
  // Edit a user message: a new branch with the new text, continued by
  // `assistant`. The old branch keeps the messages that followed.
  | { type: 'message/edit'; chatId: string; messageId: string; text: string; assistant: AssistantMessage; at: number }
  // Show another branch of a user message, with the messages that follow it.
  | { type: 'branch/select'; chatId: string; messageId: string; index: number }
  | { type: 'reply/add'; chatId: string; messageId: string; reply: Reply; at: number }
  | { type: 'reply/select'; chatId: string; messageId: string; index: number }
  | ({ type: 'reply/patch'; patch: Partial<Reply> } & ReplyAddress)
  | ({ type: 'reply/finish'; status: ReplyStatus; at: number } & ReplyAddress)
  | ({ type: 'part/add'; part: Part } & ReplyAddress)
  | ({ type: 'part/patch'; partId: string; patch: Partial<Part> } & ReplyAddress)
  | { type: 'artifact/save'; id: string; draft: ArtifactDraft; at: number }
  | { type: 'artifact/open'; id: string; version: number }
  | { type: 'artifact/close' }
  | { type: 'project/add'; project: Project }
  | { type: 'project/patch'; id: string; patch: Partial<Omit<Project, 'id'>> }
  | { type: 'project/delete'; id: string }
  | { type: 'credits'; amount: number }
  | { type: 'invoices/remind'; ids: string[] }
  | { type: 'incognito'; on: boolean }
  | { type: 'groupByDate'; on: boolean }
  // Leaving an incognito chat deletes it: every temporary chat but `keep`.
  | { type: 'chat/drop-temporary'; keep?: string }
  | { type: 'reset'; state: State }

function patchChat(state: State, id: string, change: (chat: Chat) => Chat): State {
  return { ...state, chats: state.chats.map((c) => (c.id === id ? change(c) : c)) }
}

function patchReply(state: State, a: ReplyAddress, change: (reply: Reply) => Reply): State {
  return patchChat(state, a.chatId, (chat) => ({
    ...chat,
    messages: chat.messages.map((m) => (m.id === a.messageId && m.role === 'assistant'
      ? { ...m, versions: m.versions.map((r) => (r.id === a.replyId ? change(r) : r)) }
      : m)),
  }))
}

// ---------------------------------------------------------------------------
// Branches. The chat's `messages` are always the path on screen; a user
// message's other branches keep their own text and the messages after it.

// A user message's branches, with the one on screen brought up to date and
// holding the messages that follow it now.
function branchesOf(user: UserMessage, after: Message[]): { branches: MessageBranch[]; current: number } {
  const branches = user.branches?.length ? user.branches : [{ text: user.text, attachments: user.attachments, at: user.at, after: [] }]
  const current = Math.max(0, Math.min(branches.length - 1, user.branch ?? 0))
  return {
    branches: branches.map((b, i) => (i === current ? { text: user.text, attachments: user.attachments, at: user.at, after } : b)),
    current,
  }
}

// Messages with a new branch at `index`: the new text, then `assistant`.
export function withEditedBranch(messages: Message[], index: number, text: string, assistant: AssistantMessage, at: number): Message[] {
  const user = messages[index]
  if (user?.role !== 'user') return messages
  const { branches } = branchesOf(user, messages.slice(index + 1))
  const next: MessageBranch = { text, attachments: user.attachments, at, after: [] }
  return [
    ...messages.slice(0, index),
    { ...user, text, at, branches: [...branches, next], branch: branches.length },
    assistant,
  ]
}

// Messages showing branch `to` of the user message at `index`.
export function withBranch(messages: Message[], index: number, to: number): Message[] {
  const user = messages[index]
  if (user?.role !== 'user' || !user.branches?.length) return messages
  const { branches, current } = branchesOf(user, messages.slice(index + 1))
  const target = Math.max(0, Math.min(branches.length - 1, to))
  if (target === current) return messages
  const shown = branches[target]
  return [
    ...messages.slice(0, index),
    {
      ...user, text: shown.text, attachments: shown.attachments, at: shown.at, branch: target,
      branches: branches.map((b, i) => (i === target ? { ...b, after: [] } : b)),
    },
    ...shown.after,
  ]
}

// The path on screen only: a copy (a fork) does not carry the other branches.
function withoutBranches(message: Message): Message {
  if (message.role !== 'user' || !message.branches) return message
  return { id: message.id, role: 'user', text: message.text, attachments: message.attachments, at: message.at }
}

function viewAfterDelete(state: State, id: string): View {
  const { view } = state
  if (view.kind !== 'chat' || view.chatId !== id) return view
  const chat = state.chats.find((c) => c.id === id)
  return { kind: 'new', projectId: chat?.projectId ?? null }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'view':
      return { ...state, view: action.view }
    case 'model':
      return action.chatId
        ? patchChat({ ...state, model: action.model }, action.chatId, (c) => ({ ...c, model: action.model }))
        : { ...state, model: action.model }
    case 'chat/add':
      return { ...state, chats: [action.chat, ...state.chats] }
    case 'chat/patch':
      return patchChat(state, action.id, (c) => ({ ...c, ...action.patch }))
    case 'chat/duplicate': {
      const source = state.chats.find((c) => c.id === action.id)
      if (!source) return state
      // A copy is not shared: its link would show the original.
      const copy: Chat = {
        ...source, id: action.newId, title: `${source.title} (copy)`, pinned: false, updatedAt: action.at, share: undefined,
      }
      const index = state.chats.indexOf(source)
      return { ...state, chats: [...state.chats.slice(0, index + 1), copy, ...state.chats.slice(index + 1)] }
    }
    case 'chat/fork': {
      const source = state.chats.find((c) => c.id === action.id)
      const end = source?.messages.findIndex((m) => m.id === action.messageId) ?? -1
      if (!source || end === -1) return state
      const fork: Chat = {
        id: action.newId,
        title: `${source.title} (branch)`,
        projectId: source.projectId,
        pinned: false,
        updatedAt: action.at,
        model: source.model,
        messages: source.messages.slice(0, end + 1).map(withoutBranches),
      }
      const index = state.chats.indexOf(source)
      return { ...state, chats: [...state.chats.slice(0, index + 1), fork, ...state.chats.slice(index + 1)] }
    }
    case 'chat/delete':
      return { ...state, view: viewAfterDelete(state, action.id), chats: state.chats.filter((c) => c.id !== action.id) }
    case 'message/add':
      return patchChat(state, action.chatId, (c) => ({ ...c, updatedAt: action.at, messages: [...c.messages, ...action.messages] }))
    case 'message/edit':
      return patchChat(state, action.chatId, (c) => {
        const index = c.messages.findIndex((m) => m.id === action.messageId)
        if (c.messages[index]?.role !== 'user') return c
        return { ...c, updatedAt: action.at, messages: withEditedBranch(c.messages, index, action.text, action.assistant, action.at) }
      })
    case 'branch/select':
      return patchChat(state, action.chatId, (c) => {
        const messages = withBranch(c.messages, c.messages.findIndex((m) => m.id === action.messageId), action.index)
        return messages === c.messages ? c : { ...c, messages }
      })
    case 'reply/add':
      return patchChat(state, action.chatId, (c) => ({
        ...c,
        updatedAt: action.at,
        messages: c.messages.map((m) => (m.id === action.messageId && m.role === 'assistant'
          ? { ...m, versions: [...m.versions, action.reply], current: m.versions.length }
          : m)),
      }))
    case 'reply/select':
      return patchChat(state, action.chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === action.messageId && m.role === 'assistant'
          ? { ...m, current: Math.max(0, Math.min(m.versions.length - 1, action.index)) }
          : m)),
      }))
    case 'reply/patch':
      return patchReply(state, action, (r) => ({ ...r, ...action.patch }))
    case 'reply/finish':
      return patchReply(state, action, (r) => finishReply(r, action.status, action.at))
    case 'part/add':
      return patchReply(state, action, (r) => ({ ...r, parts: [...r.parts, action.part] }))
    case 'part/patch':
      return patchReply(state, action, (r) => ({
        ...r,
        parts: r.parts.map((p) => (p.id === action.partId ? ({ ...p, ...action.patch } as Part) : p)),
      }))
    case 'artifact/save':
      return { ...state, artifacts: withArtifact(state.artifacts, action.id, action.draft, action.at) }
    case 'artifact/open':
      return { ...state, artifact: { id: action.id, version: action.version } }
    case 'artifact/close':
      return { ...state, artifact: null }
    case 'project/add':
      return { ...state, projects: [...state.projects, action.project] }
    case 'project/patch':
      return { ...state, projects: state.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) }
    case 'project/delete': {
      const view: View = state.view.kind === 'project' && state.view.projectId === action.id
        ? { kind: 'new', projectId: null }
        : state.view.kind === 'new' && state.view.projectId === action.id ? { kind: 'new', projectId: null } : state.view
      return {
        ...state,
        view,
        projects: state.projects.filter((p) => p.id !== action.id),
        chats: state.chats.map((c) => (c.projectId === action.id ? { ...c, projectId: null } : c)),
      }
    }
    case 'credits':
      return { ...state, credits: Math.min(100, Math.round((state.credits + action.amount) * 10) / 10) }
    case 'invoices/remind':
      return { ...state, reminded: [...new Set([...state.reminded, ...action.ids])] }
    case 'incognito':
      return { ...state, incognito: action.on }
    case 'groupByDate':
      return { ...state, groupByDate: action.on }
    case 'chat/drop-temporary':
      return state.chats.some((c) => c.temporary && c.id !== action.keep)
        ? { ...state, chats: state.chats.filter((c) => !c.temporary || c.id === action.keep) }
        : state
    case 'reset':
      return action.state
  }
}

// ---------------------------------------------------------------------------
// Persistence. Every access is guarded: private windows, blocked storage and
// old data all fall back to the seeded demo.

const KEY = 'hugeicons-playground:ai-workspace:v1'
const MODEL_IDS = MODELS.map((m) => m.id)

export function initialState(): State {
  const seed = seedState()
  return {
    ...seed,
    view: { kind: 'chat', chatId: seed.chats[0].id },
    model: DEFAULT_MODEL,
    credits: 68,
    artifact: null,
    reminded: [],
    incognito: false,
    groupByDate: false,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function validMessage(m: unknown): m is Message {
  return isObject(m) && (m.role === 'user'
    ? typeof m.text === 'string' && Array.isArray(m.attachments)
    : m.role === 'assistant' && Array.isArray(m.versions) && m.versions.length > 0
      && m.versions.every((r) => isObject(r) && Array.isArray(r.parts) && Array.isArray(r.followUps)))
}

function validChat(v: unknown): v is Chat {
  if (!isObject(v) || typeof v.id !== 'string' || typeof v.title !== 'string' || !Array.isArray(v.messages)) return false
  return v.messages.every(validMessage)
}

const validBranch = (b: unknown): b is MessageBranch => isObject(b) && typeof b.text === 'string'
  && Array.isArray(b.attachments) && typeof b.at === 'number' && Array.isArray(b.after) && b.after.every(validMessage)

const validShare = (s: unknown): s is ChatShare => isObject(s) && typeof s.id === 'string' && typeof s.createdAt === 'number'
  && (s.mode === 'snapshot' || s.mode === 'live')

// A reload cannot resume timers, so anything that was running is stopped,
// in the other branches too. Branches that do not read right are dropped:
// the message is left with the one on screen, as chats saved before
// branching existed (no `branches`) already are.
function settleMessage(m: Message, at: number): Message {
  if (m.role === 'assistant') {
    return {
      ...m,
      current: Math.max(0, Math.min(m.current ?? 0, m.versions.length - 1)),
      versions: m.versions.map((r) => (r.status === 'running' ? finishReply(r, 'stopped', at) : r)),
    }
  }
  if (m.branches === undefined && m.branch === undefined) return m
  const { branches } = m
  if (!Array.isArray(branches) || branches.length < 2 || !branches.every(validBranch)) {
    return { id: m.id, role: 'user', text: m.text, attachments: m.attachments, at: m.at }
  }
  const branch = Math.max(0, Math.min(branches.length - 1, typeof m.branch === 'number' ? m.branch : branches.length - 1))
  return {
    ...m,
    branch,
    branches: branches.map((b, i) => ({ ...b, after: i === branch ? [] : b.after.map((x) => settleMessage(x, at)) })),
  }
}

function settle(chat: Chat, at: number): Chat {
  return {
    ...chat,
    messages: chat.messages.map((m) => settleMessage(m, at)),
    share: validShare(chat.share)
      ? {
        ...chat.share,
        access: chat.share.access === 'organisation' ? 'organisation' : 'link',
        includeArtifacts: chat.share.includeArtifacts !== false,
        messageCount: typeof chat.share.messageCount === 'number' ? chat.share.messageCount : chat.messages.length,
        views: typeof chat.share.views === 'number' ? chat.share.views : 0,
      }
      : undefined,
  }
}

export function loadState(at: number): State {
  const fallback = initialState()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return fallback
    const saved: unknown = JSON.parse(raw)
    if (!isObject(saved) || !Array.isArray(saved.chats) || !Array.isArray(saved.projects) || !Array.isArray(saved.artifacts)) {
      return fallback
    }
    const chats = saved.chats.filter(validChat).filter((c) => !c.temporary).map((c) => settle(c, at))
    const projects = saved.projects
      .filter((p): p is Project => isObject(p) && typeof p.id === 'string' && typeof p.name === 'string' && Array.isArray(p.files))
      .map(withProjectDefaults)
    const artifacts = saved.artifacts.filter((a): a is Artifact => isObject(a) && typeof a.id === 'string' && Array.isArray(a.versions) && a.versions.length > 0)
    const view = isObject(saved.view) && saved.view.kind === 'chat' && chats.some((c) => c.id === (saved.view as { chatId?: string }).chatId)
      ? saved.view as View
      : chats[0] ? { kind: 'chat' as const, chatId: chats[0].id } : { kind: 'new' as const, projectId: null }
    return {
      projects,
      chats,
      artifacts,
      view,
      model: MODEL_IDS.includes(saved.model as ModelId) ? saved.model as ModelId : DEFAULT_MODEL,
      credits: typeof saved.credits === 'number' ? saved.credits : 68,
      artifact: null,
      reminded: Array.isArray(saved.reminded) ? saved.reminded.filter((id): id is string => typeof id === 'string') : [],
      incognito: false,
      groupByDate: typeof saved.groupByDate === 'boolean' ? saved.groupByDate : false,
    }
  } catch {
    return fallback
  }
}

export function saveState(state: State) {
  try {
    const { projects, artifacts, view, model, credits, reminded, groupByDate } = state
    // Incognito chats are never written down.
    const chats = state.chats.filter((c) => !c.temporary)
    window.localStorage.setItem(KEY, JSON.stringify({ projects, chats, artifacts, view, model, credits, reminded, groupByDate }))
  } catch {
    // Storage full or blocked: the demo keeps working in memory.
  }
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
