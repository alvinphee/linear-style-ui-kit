import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Feedback } from '@/blocks/ai/chat-message'
import type { SummaryPhase } from '@/blocks/ai/ai-summary-card'
import { edition } from '../edition'
import { MODULES } from '../modules'
import { useErp } from '../store'
import { PROMPTS, respond, type Block, type Ctx, type Inline, type Link, type Ref } from './answers'

// Ask AI's chats, shared by the side panel (the copilot), the full-page
// Assistant and the launchpad, so a chat started in one carries on in the
// others. One reply streams at a time; it keeps streaming while you move
// between pages. The launchpad's AI briefing streams here too, so it is
// written once per visit, not each time the launchpad opens.
// Chats live in memory, like the records, and reset on reload.

export type UserTurn = { id: string; role: 'user'; text: string }
export type Reply = {
  id: string
  role: 'assistant'
  question: string
  // The answer as Markdown, cut into the words it streams in.
  pieces: string[]
  plain: string
  shown: number
  state: 'thinking' | 'streaming' | 'done' | 'stopped'
  startedAt: number
  source?: string
  links?: Link[]
  followUps?: string[]
  feedback?: Feedback | null
}
export type Turn = UserTurn | Reply
export type Chat = { id: string; title: string; pinned: boolean; updatedAt: number; messages: Turn[] }

export type Briefing = {
  phase: SummaryPhase
  pieces: string[]
  plain: string
  shown: number
  writtenAt: number
  stopped: boolean
  feedback: 'up' | 'down' | null
}

export const THINK_MS = 700
const WORD_MS = 28
const BRIEFING_QUESTION = 'What needs my attention today?'

/* ---------- Answers as streamable Markdown ---------- */

// Record numbers become "#record:<entity>:<id>" links the views open in the
// side panel. A link counts as one word while streaming; the Markdown block
// heals any half-written syntax.
const recordHref = (r: Ref) => `#record:${r.entity}:${r.id}`
export const parseRecordHref = (href: string) => {
  const [, entity, id] = href.match(/^#record:([^:]+):(.+)$/) ?? []
  return entity && id ? { entity, id } : null
}
const inlineMarkdown = (parts: Inline[]) => parts.map((part) => (typeof part === 'string' ? part : `[${part.id}](${recordHref(part)})`)).join('')
const inlinePlain = (parts: Inline[]) => parts.map((part) => (typeof part === 'string' ? part : part.id)).join('')
const WORDS = /\s*\S+\s*/g
const words = (text: string) => text.match(WORDS) ?? [text]

function toPieces(blocks: Block[]) {
  const pieces: string[] = []
  blocks.forEach((b, i) => {
    if (i > 0) pieces.push('\n\n')
    if (b.kind === 'p') pieces.push(...words(inlineMarkdown(b.parts)))
    else b.items.forEach((item, j) => pieces.push(`${j ? '\n' : ''}- `, ...words(inlineMarkdown(item))))
  })
  return pieces
}

const toPlain = (blocks: Block[]) =>
  blocks.map((b) => (b.kind === 'p' ? inlinePlain(b.parts) : b.items.map((item) => `• ${inlinePlain(item)}`).join('\n'))).join('\n\n')

export const textOf = (reply: Pick<Reply, 'pieces' | 'shown'>) => reply.pieces.slice(0, reply.shown).join('')

let seq = 0
const uid = (prefix: string) => `${prefix}${++seq}`

function replyFor(question: string, ctx: Ctx, id = uid('r')): Reply {
  const answer = respond(question, ctx)
  return {
    id, role: 'assistant', question, pieces: toPieces(answer.blocks), plain: toPlain(answer.blocks), shown: 0, state: 'thinking',
    startedAt: Date.now(), source: answer.source, links: answer.links, followUps: answer.followUps,
  }
}

// "Which invoices are overdue?" → "Which invoices are overdue".
export function titleFor(text: string) {
  const t = text.trim().replace(/[?.!]+$/, '')
  const short = t.length > 48 ? `${t.slice(0, 47).replace(/\s+\S*$/, '')}…` : t
  return short.charAt(0).toUpperCase() + short.slice(1)
}

// The chats a returning user already has, asked of today's data: the second
// suggested question of each module the role can open.
function seedChats(ctx: Ctx): Chat[] {
  const HOUR = 3_600_000
  const ages = [2 * HOUR, 27 * HOUR, 3 * 24 * HOUR, 6 * 24 * HOUR, 12 * 24 * HOUR]
  const asks = [
    ...MODULES.filter((m) => m.id !== 'home' && m.roles.includes(ctx.role)).map((m) => PROMPTS[m.id]?.[1]),
    PROMPTS.home[1],
  ].filter((q): q is string => !!q).slice(0, ages.length)
  const now = Date.now()
  return asks.map((question, i) => {
    const reply = replyFor(question, ctx)
    return {
      id: uid('c'), title: titleFor(question), pinned: i === 1, updatedAt: now - ages[i],
      messages: [{ id: uid('m'), role: 'user', text: question }, { ...reply, shown: reply.pieces.length, state: 'done', startedAt: now - ages[i] }],
    }
  })
}

/* ---------- The store ---------- */

type AssistantState = {
  chats: Chat[]
  active: Chat | null
  // A reply is being written (in any chat).
  busy: boolean
  runningChatId: string | null
  // Changes when a view should move focus into its prompt box.
  focusKey: number
  // False when a reply is still being written.
  send: (text: string, options?: { newChat?: boolean }) => boolean
  stop: () => void
  regenerate: (chatId: string, replyId: string) => void
  setFeedback: (chatId: string, replyId: string, feedback: Feedback | null) => void
  newChat: () => void
  openChat: (id: string) => void
  renameChat: (id: string, title: string) => void
  pinChat: (id: string, pinned: boolean) => void
  deleteChat: (id: string) => void
  focusComposer: () => void
  briefing: Briefing | null
  writeBriefing: () => void
  stopBriefing: () => void
  setBriefingFeedback: (feedback: 'up' | 'down' | null) => void
  // Opens the briefing as a chat, to ask follow-ups about it.
  continueBriefing: () => void
}

const AssistantContext = createContext<AssistantState | null>(null)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { data, session } = useErp()
  // Signed in already (a reload): start with the history straight away.
  const [chats, setChats] = useState<Chat[]>(() => (session && edition().assistant
    ? seedChats({ data, role: session.role, name: session.name })
    : []))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const ctx = useRef<Ctx>({ data, role: session?.role ?? 'admin', name: session?.name ?? '' })
  ctx.current = { data, role: session?.role ?? 'admin', name: session?.name ?? '' }
  const run = useRef<{ chatId: string; replyId: string } | null>(null)
  const timers = useRef({ wait: 0, tick: 0, briefWait: 0, briefTick: 0 })
  const [running, setRunning] = useState<string | null>(null)

  // Signing in: the ERP + AI edition starts with some history. Signing out:
  // the chats go, as a real app would clear them. Only on a change, so the
  // first render's briefing (already being written) is left alone.
  const signedIn = !!session
  const wasSignedIn = useRef(signedIn)
  useEffect(() => {
    if (wasSignedIn.current === signedIn) return
    wasSignedIn.current = signedIn
    clear()
    setActiveId(null)
    setBriefing(null)
    setChats(signedIn && edition().assistant ? seedChats(ctx.current) : [])
  }, [signedIn])

  useEffect(() => () => clear(), [])

  function clear() {
    const t = timers.current
    window.clearTimeout(t.wait)
    window.clearInterval(t.tick)
    window.clearTimeout(t.briefWait)
    window.clearInterval(t.briefTick)
    timers.current = { wait: 0, tick: 0, briefWait: 0, briefTick: 0 }
    run.current = null
    setRunning(null)
  }

  function clearReply() {
    window.clearTimeout(timers.current.wait)
    window.clearInterval(timers.current.tick)
    timers.current.wait = 0
    timers.current.tick = 0
    run.current = null
    setRunning(null)
  }

  const patchReply = (chatId: string, replyId: string, change: Partial<Reply>) =>
    setChats((list) => list.map((c) => (c.id !== chatId ? c : {
      ...c,
      messages: c.messages.map((m): Turn => (m.id === replyId && m.role === 'assistant' ? { ...m, ...change } : m)),
    })))

  // Think, then stream the reply in word by word.
  function play(chatId: string, reply: Reply) {
    clearReply()
    run.current = { chatId, replyId: reply.id }
    setRunning(chatId)
    const total = reply.pieces.length
    timers.current.wait = window.setTimeout(() => {
      patchReply(chatId, reply.id, { state: 'streaming' })
      let shown = 0
      timers.current.tick = window.setInterval(() => {
        shown += 1
        if (shown < total) return patchReply(chatId, reply.id, { shown })
        clearReply()
        patchReply(chatId, reply.id, { shown: total, state: 'done' })
      }, WORD_MS)
    }, THINK_MS)
  }

  // Stop keeps what has streamed so far.
  function stop() {
    const current = run.current
    if (!current) return
    clearReply()
    patchReply(current.chatId, current.replyId, { state: 'stopped' })
  }

  function playBriefing(next: Briefing) {
    const t = timers.current
    window.clearTimeout(t.briefWait)
    window.clearInterval(t.briefTick)
    setBriefing(next)
    t.briefWait = window.setTimeout(() => {
      setBriefing((b) => (b ? { ...b, phase: 'streaming' } : b))
      let shown = 0
      t.briefTick = window.setInterval(() => {
        shown += 1
        const done = shown >= next.pieces.length
        if (done) window.clearInterval(t.briefTick)
        setBriefing((b) => (b ? { ...b, shown, phase: done ? 'done' : 'streaming' } : b))
      }, WORD_MS)
    }, THINK_MS * 1.5)
  }

  const active = chats.find((c) => c.id === activeId) ?? null

  const value: AssistantState = {
    chats,
    active,
    busy: !!running,
    runningChatId: running,
    focusKey,
    send(raw, options) {
      const text = raw.trim()
      if (!text) return true
      if (run.current) return false
      const chat = options?.newChat || !active ? null : active
      const chatId = chat?.id ?? uid('c')
      const reply = replyFor(text, ctx.current)
      const turns: Turn[] = [{ id: uid('m'), role: 'user', text }, reply]
      setChats((list) => (chat
        ? list.map((c) => (c.id === chatId ? { ...c, updatedAt: Date.now(), messages: [...c.messages, ...turns] } : c))
        : [{ id: chatId, title: titleFor(text), pinned: false, updatedAt: Date.now(), messages: turns }, ...list]))
      setActiveId(chatId)
      play(chatId, reply)
      return true
    },
    stop,
    // Answers again from the data as it is now (a record may have changed).
    regenerate(chatId, replyId) {
      if (run.current) return
      const chat = chats.find((c) => c.id === chatId)
      const old = chat?.messages.find((m): m is Reply => m.id === replyId && m.role === 'assistant')
      if (!chat || !old) return
      const fresh = replyFor(old.question, ctx.current, old.id)
      patchReply(chatId, replyId, fresh)
      play(chatId, fresh)
    },
    setFeedback: (chatId, replyId, feedback) => patchReply(chatId, replyId, { feedback }),
    newChat() {
      setActiveId(null)
      setFocusKey((k) => k + 1)
    },
    openChat(id) {
      setActiveId(id)
      setFocusKey((k) => k + 1)
    },
    renameChat: (id, title) => setChats((list) => list.map((c) => (c.id === id ? { ...c, title } : c))),
    pinChat: (id, pinned) => setChats((list) => list.map((c) => (c.id === id ? { ...c, pinned } : c))),
    deleteChat(id) {
      if (run.current?.chatId === id) clearReply()
      setChats((list) => list.filter((c) => c.id !== id))
      if (activeId === id) setActiveId(null)
    },
    focusComposer: () => setFocusKey((k) => k + 1),
    briefing,
    writeBriefing() {
      const answer = respond(BRIEFING_QUESTION, ctx.current)
      const pieces = toPieces(answer.blocks)
      playBriefing({ phase: 'thinking', pieces, plain: toPlain(answer.blocks), shown: 0, writtenAt: Date.now(), stopped: false, feedback: null })
    },
    stopBriefing() {
      const t = timers.current
      window.clearTimeout(t.briefWait)
      window.clearInterval(t.briefTick)
      setBriefing((b) => (b ? { ...b, phase: 'done', stopped: true } : b))
    },
    setBriefingFeedback: (feedback) => setBriefing((b) => (b ? { ...b, feedback } : b)),
    continueBriefing() {
      if (!briefing) return
      // The briefing's own words, with the links and follow-ups of the same answer.
      const reply: Reply = {
        ...replyFor(BRIEFING_QUESTION, ctx.current), pieces: briefing.pieces, plain: briefing.plain,
        shown: briefing.shown, state: briefing.stopped ? 'stopped' : 'done',
      }
      const chatId = uid('c')
      setChats((list) => [{
        id: chatId, title: "Today's briefing", pinned: false, updatedAt: Date.now(),
        messages: [{ id: uid('m'), role: 'user', text: BRIEFING_QUESTION }, reply],
      }, ...list])
      setActiveId(chatId)
      setFocusKey((k) => k + 1)
    },
  }

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant() {
  const state = useContext(AssistantContext)
  if (!state) throw new Error('useAssistant must be used inside AssistantProvider')
  return state
}

// The briefing as it would be written now, to tell when it is out of date.
export function useCurrentBriefing() {
  const { data, session } = useErp()
  return useMemo(
    () => toPlain(respond(BRIEFING_QUESTION, { data, role: session?.role ?? 'admin', name: session?.name ?? '' }).blocks),
    [data, session],
  )
}
