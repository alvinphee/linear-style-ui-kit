import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowUpRight01Icon, SidebarLeftIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import type { Agent } from '@/blocks/ai/agents/agent-types'
import { IconAction } from '@/components/icon-action'
import { AiMotion } from '@/components/ai/thinking-indicator'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { downloadText } from '@/lib/download'
import { navigate, readPath, usePath } from '@/lib/router'
import { plural, slug } from '@/lib/text'
import { PEOPLE } from '../data'
import { useJobs } from '../jobs-store'
import { goTo } from '../nav'
import { SAMPLE_AGENTS, SHARED_AGENTS } from './ai/agents/agents-data'
import { AGENTS_KEY, AgentsProvider } from './ai/agents/context'
import { AgentsView } from './ai/AgentsView'
import { AdminScreen } from './ai/admin/AdminScreen'
import { AllChats } from './ai/AllChats'
import { ArtifactPanel } from './ai/ArtifactPanel'
import { ChatChrome } from './ai/ChatChrome'
import { ActionsContext, type WorkspaceActions } from './ai/context'
import { Conversation } from './ai/Conversation'
import { chatType, modelById, now, toFileRef, uid } from './ai/data'
import {
  buildScript, chatTypeOf, continueAfterApproval, play, titleFor, type AgentContext, type Controller, type ScriptEvent,
  type Sink,
} from './ai/engine'
import { artifactRef, chatHasArtifacts, currentReply, lastArtifactIn, replyText } from './ai/helpers'
import { SAMPLE_KNOWLEDGE_BASES } from './ai/knowledge/bases-data'
import { KnowledgeProvider } from './ai/knowledge/context'
import { KnowledgeView } from './ai/KnowledgeView'
import { ProjectView } from './ai/ProjectView'
import { adminPath, isAppPath, isFullPage, parseRoute, pathFor, settingsPath } from './ai/routes'
import { RunsView } from './ai/RunsView'
import { useConnectors } from './ai/settings/ConnectorsTab'
import { useStoredState } from './ai/settings/prefs'
import { SettingsScreen } from './ai/settings/SettingsScreen'
import { Sidebar, type ChatSummary } from './ai/Sidebar'
import { clearSaved, initialState, loadState, reducer, saveState } from './ai/store'
import type {
  Artifact, AssistantMessage, Chat, ChatShare, FileRef, Message, Model, Modes, PartOf, Project, Reply, View,
} from './ai/types'
import { Panel, Section } from './shared'

// Widths of the card (not the window) at which the side areas fit inline.
// Below them the sidebar and the artifact panel open as sheets instead.
const SIDEBAR_MIN = 720
const PANEL_MIN = 880
const ROOMY = 1060

const PROJECT_COLOURS = ['var(--chart-4)', 'var(--chart-5)', 'var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)']

type Run = { chatId: string; messageId: string; replyId: string; controller: Controller }

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A view from an address, if what it names still exists.
function validView(view: View | null, state: { chats: Chat[]; projects: Project[] }): View | null {
  if (!view) return null
  if (view.kind === 'chat') return state.chats.some((c) => c.id === view.chatId) ? view : null
  const projectId = view.kind === 'project' || view.kind === 'new' ? view.projectId : null
  if (projectId && !state.projects.some((p) => p.id === projectId)) return null
  return view
}

// The workspace itself. In the kit it sits in a card; with `page` it fills
// the window, as the full-page template at #/templates/ai-chat, and each
// chat, project and settings section has its own address (ai/routes.ts).
export function AiWorkspace({ page = false }: { page?: boolean }) {
  const jobsStore = useJobs()
  const storeRef = useRef(jobsStore)
  storeRef.current = jobsStore
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const loaded = loadState(now())
    // Full page, the address wins over the chat that was open last time.
    const view = page ? validView(parseRoute(readPath()).view, loaded) : null
    return view ? { ...loaded, view } : loaded
  })
  const stateRef = useRef(state)
  stateRef.current = state
  const [modes, setModes] = useState<Modes>({ web: false, deep: false })
  const modesRef = useRef(modes)
  modesRef.current = modes
  const [focusKey, setFocusKey] = useState(0)
  const [panelFocus, setPanelFocus] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  // Settings: undefined when closed, null for the list of sections (the
  // first section on a wide screen). Full page, it lives in the address.
  const path = usePath()
  const [cardSettings, setCardSettings] = useState<string | null | undefined>(undefined)
  const [cardAdmin, setCardAdmin] = useState<string | null | undefined>(undefined)
  const pageRoute = page && isAppPath(path) ? parseRoute(path) : null
  const settings = page ? pageRoute?.settings : cardSettings
  const admin = page ? pageRoute?.admin : cardAdmin
  const fullPage = settings !== undefined || admin !== undefined
  const [notice, setNotice] = useState('')
  const runRef = useRef<Run | null>(null)
  const cardRef = useRef<HTMLElement>(null)
  const newChatRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const panelHeading = useRef<HTMLHeadingElement>(null)
  // Only an Open click moves focus into the panel, never an automatic open.
  const wantsPanelFocus = useRef(false)
  const width = useWidth(cardRef)

  const artifact = state.artifact ? state.artifacts.find((a) => a.id === state.artifact!.id) ?? null : null
  const panelOpen = !!artifact
  const panelInline = width >= PANEL_MIN
  const sidebarCanInline = width >= SIDEBAR_MIN && !(panelOpen && panelInline && width < ROOMY)
  const sidebarInline = sidebarCanInline && !sidebarHidden
  const layout = useRef({ sidebarInline, sidebarCanInline, roomy: width >= ROOMY })
  layout.current = { sidebarInline, sidebarCanInline, roomy: width >= ROOMY }

  // Keeps the last artifact on screen while its sheet animates closed.
  const shownArtifact = useRef<{ artifact: Artifact; version: number } | null>(null)
  if (artifact && state.artifact) shownArtifact.current = { artifact, version: state.artifact.version }

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 600)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => () => {
    runRef.current?.controller.stop()
    runRef.current = null
  }, [])

  useEffect(() => {
    if (sidebarInline) setSheetOpen(false)
  }, [sidebarInline])

  // A sheet moves focus by itself; the inline panel needs a hand.
  useEffect(() => {
    if (!wantsPanelFocus.current) return
    wantsPanelFocus.current = false
    if (panelInline) panelHeading.current?.focus({ preventScroll: true })
  }, [panelFocus, panelInline])

  const actions = useMemo<WorkspaceActions>(() => {
    const chatById = (id: string) => stateRef.current.chats.find((c) => c.id === id)
    const projectOf = (chat: Chat | undefined) => stateRef.current.projects.find((p) => p.id === chat?.projectId) ?? null

    function sinkFor(chatId: string, messageId: string, replyId: string, token: { done: boolean }): Sink {
      const address = { chatId, messageId, replyId }
      return {
        addPart: (part) => dispatch({ type: 'part/add', ...address, part }),
        patchPart: (partId, patch) => dispatch({ type: 'part/patch', ...address, partId, patch }),
        activity: (text) => dispatch({ type: 'reply/patch', ...address, patch: { activity: text } }),
        artifact: (draft) => {
          const ref = artifactRef(stateRef.current.artifacts, draft, uid('a'))
          dispatch({ type: 'artifact/save', id: ref.artifactId, draft, at: now() })
          const open = stateRef.current.artifact
          if (open?.id === ref.artifactId || (!open && layout.current.roomy)) {
            dispatch({ type: 'artifact/open', id: ref.artifactId, version: ref.version })
          }
          return ref
        },
        followUps: (items) => dispatch({ type: 'reply/patch', ...address, patch: { followUps: items } }),
        finish: (status) => {
          token.done = true
          if (runRef.current?.replyId === replyId) runRef.current = null
          dispatch({ type: 'reply/finish', ...address, status, at: now() })
          setNotice(status === 'awaiting'
            ? 'The agent is waiting for your approval.'
            : status === 'error' ? 'The reply failed. You can retry it.' : 'Reply finished.')
        },
      }
    }

    function stopRun(announce = true) {
      const run = runRef.current
      if (!run) return
      runRef.current = null
      run.controller.stop()
      dispatch({ type: 'reply/finish', chatId: run.chatId, messageId: run.messageId, replyId: run.replyId, status: 'stopped', at: now() })
      if (announce) setNotice('Reply stopped.')
    }

    function startRun(chatId: string, messageId: string, replyId: string, events: ScriptEvent[], model: Model, plan?: PartOf<'plan'>) {
      stopRun(false)
      // Research is for one reply, as in the big chat apps: its script is
      // built by now, and the follow-ups to its report are ordinary replies
      // unless it is turned on again.
      if (modesRef.current.research) setModes((m) => ({ ...m, research: false }))
      const token = { done: false }
      const controller = play(events, sinkFor(chatId, messageId, replyId, token), model, plan)
      if (!token.done) runRef.current = { chatId, messageId, replyId, controller }
      setNotice(`${model.name} is replying.`)
    }

    function contextFor(chat: Chat, beforeIndex: number, prompt: string, attachments: FileRef[], attempt: number, reviseId?: string): AgentContext {
      const s = stateRef.current
      return {
        prompt,
        model: modelById(chat.model),
        modes: modesRef.current,
        jobs: storeRef.current.jobs,
        reminded: s.reminded,
        attempt,
        attachments,
        project: s.projects.find((p) => p.id === chat.projectId) ?? null,
        lastArtifact: lastArtifactIn(chat.messages, s.artifacts, beforeIndex),
        reviseId,
      }
    }

    function newReply(model: Model, messageModel: string): Reply {
      return {
        id: uid('r'), model: model.id === messageModel ? undefined : model.id, status: 'running', startedAt: now(),
        parts: [], followUps: [],
      }
    }

    // Sending while the agent waits for approval counts as saying no.
    function settleApproval(chat: Chat) {
      const last = chat.messages[chat.messages.length - 1]
      if (last?.role !== 'assistant') return
      const reply = currentReply(last)
      if (reply.status !== 'awaiting') return
      const address = { chatId: chat.id, messageId: last.id, replyId: reply.id }
      for (const part of reply.parts) {
        if (part.type === 'approval' && part.state === 'pending') {
          dispatch({ type: 'part/patch', ...address, partId: part.id, patch: { state: 'denied' } })
        }
      }
      dispatch({ type: 'reply/finish', ...address, status: 'done', at: now() })
    }

    // Leaving an incognito chat deletes it: every one but `keep`.
    function dropTemporary(keep?: string) {
      const run = runRef.current
      if (run && run.chatId !== keep && chatById(run.chatId)?.temporary) stopRun(false)
      dispatch({ type: 'chat/drop-temporary', keep })
    }

    // Opening a kept chat, a project or All chats ends incognito; only New
    // chat keeps it on.
    function endIncognito() {
      dropTemporary()
      if (stateRef.current.incognito) dispatch({ type: 'incognito', on: false })
    }

    // Moving to a page of another kind: the reply stops, the artifact panel
    // closes and incognito ends, as opening a project does.
    function leaveFor(kind: View['kind']) {
      if (stateRef.current.view.kind === kind) return
      stopRun()
      closePanel(false)
      endIncognito()
    }

    function closePanel(restoreFocus = true) {
      if (!stateRef.current.artifact) return
      dispatch({ type: 'artifact/close' })
      if (!restoreFocus) return
      const opener = openerRef.current
      openerRef.current = null
      requestAnimationFrame(() => {
        if (opener?.isConnected) opener.focus({ preventScroll: true })
      })
    }

    const api: WorkspaceActions = {
      send(text, attachments, inProject) {
        const s = stateRef.current
        const at = now()
        // With inProject, always a new chat in that project (the project page's box).
        let chat = s.view.kind === 'chat' && inProject === undefined ? chatById(s.view.chatId) : undefined
        stopRun(false)
        if (chat) settleApproval(chat)
        else {
          const projectId = inProject !== undefined ? inProject
            : s.view.kind === 'new' || s.view.kind === 'project' ? s.view.projectId : null
          chat = {
            id: uid('c'), title: titleFor(text), projectId, pinned: false, updatedAt: at, model: s.model, messages: [],
            temporary: s.incognito || undefined,
          }
          dropTemporary()
          dispatch({ type: 'chat/add', chat })
          dispatch({ type: 'view', view: { kind: 'chat', chatId: chat.id } })
          setFocusKey((k) => k + 1)
        }
        const model = modelById(chat.model)
        const reply = newReply(model, model.id)
        const assistant: AssistantMessage = { id: uid('m'), role: 'assistant', model: model.id, versions: [reply], current: 0 }
        dispatch({ type: 'message/add', chatId: chat.id, messages: [{ id: uid('m'), role: 'user', text, attachments, at }, assistant], at })
        dispatch({ type: 'credits', amount: model.cost })
        startRun(chat.id, assistant.id, reply.id, buildScript(contextFor(chat, chat.messages.length, text, attachments, 0)), model)
      },
      stop: () => stopRun(),
      // A voice conversation, kept as messages: in the open chat, or a new one.
      addTranscript(lines) {
        if (!lines.length) return
        const s = stateRef.current
        const at = now()
        let chat = s.view.kind === 'chat' ? chatById(s.view.chatId) : undefined
        if (!chat) {
          const first = lines.find((l) => l.role === 'user')?.text ?? 'Voice chat'
          const projectId = s.view.kind === 'new' || s.view.kind === 'project' ? s.view.projectId : null
          chat = {
            id: uid('c'), title: titleFor(first), projectId, pinned: false, updatedAt: at, model: s.model, messages: [],
            temporary: s.incognito || undefined,
          }
          dispatch({ type: 'chat/add', chat })
          dispatch({ type: 'view', view: { kind: 'chat', chatId: chat.id } })
        }
        const model = chat.model
        dispatch({
          type: 'message/add',
          chatId: chat.id,
          at,
          messages: lines.map((line): Message => line.role === 'user'
            ? { id: uid('m'), role: 'user', text: line.text, attachments: [], at }
            : {
                id: uid('m'), role: 'assistant', model, current: 0,
                versions: [{
                  id: uid('r'), status: 'done', startedAt: at, finishedAt: at, followUps: [],
                  parts: [{ id: uid('p'), type: 'text', text: line.text, streaming: false }],
                }],
              }),
        })
        toast('Voice chat saved', { description: `${plural(lines.length, 'line')} added to the chat.` })
      },
      regenerate(chatId, messageId) {
        const chat = chatById(chatId)
        if (!chat) return
        const index = chat.messages.findIndex((m) => m.id === messageId)
        const message = chat.messages[index]
        const user = chat.messages[index - 1]
        if (message?.role !== 'assistant' || user?.role !== 'user') return
        stopRun(false)
        const model = modelById(chat.model)
        const reviseId = currentReply(message).parts.find((p): p is PartOf<'artifact'> => p.type === 'artifact')?.artifactId
        const reply = newReply(model, message.model)
        dispatch({ type: 'reply/add', chatId, messageId, reply, at: now() })
        dispatch({ type: 'credits', amount: model.cost })
        const ctx = contextFor(chat, index - 1, user.text, user.attachments, message.versions.length, reviseId)
        startRun(chatId, messageId, reply.id, buildScript(ctx), model)
      },
      selectVersion: (chatId, messageId, index) => dispatch({ type: 'reply/select', chatId, messageId, index }),
      feedback: (chatId, messageId, replyId, value) => dispatch({ type: 'reply/patch', chatId, messageId, replyId, patch: { feedback: value } }),
      decide(chatId, messageId, replyId, partId, decision) {
        const chat = chatById(chatId)
        const message = chat?.messages.find((m) => m.id === messageId)
        if (!chat || message?.role !== 'assistant') return
        const reply = message.versions.find((r) => r.id === replyId)
        const part = reply?.parts.find((p): p is PartOf<'approval'> => p.id === partId && p.type === 'approval')
        if (!reply || !part || part.state !== 'pending') return
        stopRun(false)
        const address = { chatId, messageId, replyId }
        dispatch({ type: 'part/patch', ...address, partId, patch: { state: decision } })
        const { request } = part
        if (decision === 'approved' && request.kind === 'reminders') {
          const n = request.invoices.length
          dispatch({ type: 'invoices/remind', ids: request.invoices.map((i) => i.id) })
          toast(`Sent ${plural(n, 'payment reminder')}`, { description: 'Each billing contact got one short email.' })
        } else if (decision === 'approved' && request.kind !== 'reminders') {
          for (const group of request.groups) storeRef.current.updateJobs(group.ids, group.patch)
          const n = new Set(request.changes.map((c) => c.jobId)).size
          toast(`Updated ${plural(n, 'job')}`, {
            description: 'The list, board and issue page show it now.',
            action: { label: 'View board', onClick: () => goTo('board') },
          })
        }
        dispatch({ type: 'reply/patch', ...address, patch: { status: 'running' } })
        const model = modelById(reply.model ?? message.model)
        const plan = reply.parts.find((p): p is PartOf<'plan'> => p.type === 'plan')
        const events = continueAfterApproval(request, decision, {
          model, modes: modesRef.current, project: projectOf(chat), attachments: [],
        })
        startRun(chatId, messageId, replyId, events, model, plan)
      },
      editMessage(chatId, messageId, text) {
        const chat = chatById(chatId)
        if (!chat) return
        const index = chat.messages.findIndex((m) => m.id === messageId)
        const user = chat.messages[index]
        if (user?.role !== 'user') return
        stopRun(false)
        const model = modelById(chat.model)
        const reply = newReply(model, model.id)
        const assistant: AssistantMessage = { id: uid('m'), role: 'assistant', model: model.id, versions: [reply], current: 0 }
        dispatch({ type: 'message/edit', chatId, messageId, text, assistant, at: now() })
        dispatch({ type: 'credits', amount: model.cost })
        startRun(chatId, assistant.id, reply.id, buildScript(contextFor(chat, index, text, user.attachments, 0)), model)
        setNotice(`New branch: ${model.name} is replying. The old branch is kept.`)
      },
      selectBranch(chatId, messageId, index) {
        const chat = chatById(chatId)
        const user = chat?.messages.find((m) => m.id === messageId)
        if (user?.role !== 'user' || !user.branches || index === (user.branch ?? 0)) return
        // The reply being written belongs to the branch on screen; it stops
        // there rather than writing into one that is put away.
        if (runRef.current?.chatId === chatId) stopRun(false)
        dispatch({ type: 'branch/select', chatId, messageId, index })
        setNotice(`Branch ${index + 1} of ${user.branches.length}.`)
      },
      forkChat(chatId, messageId) {
        const source = chatById(chatId)
        const index = source?.messages.findIndex((m) => m.id === messageId) ?? -1
        if (!source || source.temporary || index === -1) return
        const message = source.messages[index]
        const newId = uid('c')
        const at = now()
        dispatch({ type: 'chat/fork', id: chatId, newId, messageId, at })
        api.openChat(newId)
        // From a question, the new chat answers it afresh.
        if (message.role === 'user') {
          const model = modelById(source.model)
          const reply = newReply(model, model.id)
          const assistant: AssistantMessage = { id: uid('m'), role: 'assistant', model: model.id, versions: [reply], current: 0 }
          dispatch({ type: 'message/add', chatId: newId, messages: [assistant], at })
          dispatch({ type: 'credits', amount: model.cost })
          startRun(newId, assistant.id, reply.id, buildScript(contextFor(source, index, message.text, message.attachments, 0)), model)
        }
        setFocusKey((k) => k + 1)
        toast('Branched into a new chat', {
          description: `“${source.title} (branch)”`,
          action: { label: 'Back to the original', onClick: () => api.openChat(chatId) },
        })
      },
      shareChat(chatId, options) {
        const chat = chatById(chatId)
        if (!chat || chat.temporary) return
        const share: ChatShare = { id: uid('sh'), createdAt: now(), ...options, messageCount: chat.messages.length, views: 0 }
        dispatch({ type: 'chat/patch', id: chatId, patch: { share } })
        toast('Link created', { description: 'Demo only: nothing is published.' })
      },
      updateShare(chatId, options) {
        const chat = chatById(chatId)
        if (!chat?.share) return
        // Updating retakes a snapshot, so it holds the messages there are now.
        const share: ChatShare = { ...chat.share, ...options, messageCount: chat.messages.length }
        dispatch({ type: 'chat/patch', id: chatId, patch: { share } })
        toast('Link updated')
      },
      revokeShare(chatId) {
        dispatch({ type: 'chat/patch', id: chatId, patch: { share: undefined } })
        toast('Link revoked', { description: 'It no longer opens the chat.' })
      },
      openArtifact(id, version) {
        const open = stateRef.current.artifact
        if (open?.id === id && open.version === version) {
          closePanel()
          return
        }
        if (!open) openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dispatch({ type: 'artifact/open', id, version })
        wantsPanelFocus.current = true
        setPanelFocus((k) => k + 1)
      },
      closeArtifact: () => closePanel(),
      openChat(id) {
        const s = stateRef.current
        if (s.view.kind === 'chat' && s.view.chatId === id) return
        if (runRef.current && runRef.current.chatId !== id) stopRun()
        closePanel(false)
        endIncognito()
        dispatch({ type: 'view', view: { kind: 'chat', chatId: id } })
      },
      newChat(projectId = null) {
        stopRun()
        closePanel(false)
        dropTemporary()
        dispatch({ type: 'view', view: { kind: 'new', projectId } })
        setFocusKey((k) => k + 1)
      },
      openProject(id, tab) {
        const { view } = stateRef.current
        // Another tab of the open project: nothing else changes.
        if (!(view.kind === 'project' && view.projectId === id)) {
          stopRun()
          closePanel(false)
          endIncognito()
        }
        dispatch({ type: 'view', view: { kind: 'project', projectId: id, tab } })
      },
      openLibrary() {
        stopRun()
        closePanel(false)
        endIncognito()
        dispatch({ type: 'view', view: { kind: 'library' } })
      },
      openKnowledge(baseId, tab) {
        leaveFor('knowledge')
        dispatch({ type: 'view', view: { kind: 'knowledge', baseId, tab } })
      },
      openAgents(agentId, tab) {
        leaveFor('agents')
        dispatch({ type: 'view', view: { kind: 'agents', agentId, tab } })
      },
      openRuns(runId) {
        leaveFor('runs')
        dispatch({ type: 'view', view: { kind: 'runs', runId } })
      },
      setIncognito(on) {
        closePanel(false)
        dropTemporary()
        dispatch({ type: 'incognito', on })
        dispatch({ type: 'view', view: { kind: 'new', projectId: null } })
        setFocusKey((k) => k + 1)
      },
      setGroupByDate: (on) => dispatch({ type: 'groupByDate', on }),
      renameChat: (id, title) => dispatch({ type: 'chat/patch', id, patch: { title } }),
      pinChat(id, pinned) {
        dispatch({ type: 'chat/patch', id, patch: { pinned } })
        toast(pinned ? 'Pinned' : 'Unpinned')
      },
      moveChat(id, projectId) {
        dispatch({ type: 'chat/patch', id, patch: { projectId } })
        const project = stateRef.current.projects.find((p) => p.id === projectId)
        toast(project ? `Moved to ${project.name}` : 'Removed from the project')
      },
      duplicateChat(id) {
        const newId = uid('c')
        dispatch({ type: 'chat/duplicate', id, newId, at: now() })
        toast('Chat duplicated', { action: { label: 'Open', onClick: () => api.openChat(newId) } })
      },
      deleteChat(id) {
        if (runRef.current?.chatId === id) stopRun(false)
        const s = stateRef.current
        if (s.view.kind === 'chat' && s.view.chatId === id) closePanel(false)
        dispatch({ type: 'chat/delete', id })
        toast('Chat deleted')
      },
      exportChat(id) {
        const chat = chatById(id)
        if (!chat) return
        const lines = [`# ${chat.title}`, '']
        for (const m of chat.messages) {
          if (m.role === 'user') lines.push(`**You:** ${m.text}`, '')
          else {
            const reply = currentReply(m)
            lines.push(`**${modelById(reply.model ?? m.model).name}:**`, '', replyText(reply) || '_No text._', '')
          }
        }
        const name = `${slug(chat.title, { fallback: 'untitled' })}.md`
        downloadText(name, lines.join('\n'), 'text/markdown')
        toast(`Exported ${name}`)
      },
      createProject(name) {
        const id = uid('p')
        const colour = PROJECT_COLOURS[stateRef.current.projects.length % PROJECT_COLOURS.length]
        dispatch({ type: 'project/add', project: { id, name, colour, description: '', instructions: '', files: [] } })
        toast(`Created “${name}”`)
        return id
      },
      patchProject: (id, patch) => dispatch({ type: 'project/patch', id, patch }),
      // A patch made from the project as it is when it lands, for changes
      // that finish later (a scheduled task's run).
      patchProjectWith(id, update) {
        const project = stateRef.current.projects.find((p) => p.id === id)
        if (project) dispatch({ type: 'project/patch', id, patch: update(project) })
      },
      duplicateProject(id) {
        const project = stateRef.current.projects.find((p) => p.id === id)
        if (!project) return
        const copy = {
          ...structuredClone(project), id: uid('p'), name: `${project.name} (copy)`, starred: false, archived: false,
          sharing: undefined,
        }
        dispatch({ type: 'project/add', project: copy })
        toast(`Duplicated “${project.name}”`, { action: { label: 'Open', onClick: () => api.openProject(copy.id) } })
      },
      deleteProject(id) {
        dispatch({ type: 'project/delete', id })
        toast('Project deleted', { description: 'Its chats moved to your history.' })
      },
      addProjectFiles(id, files) {
        const project = stateRef.current.projects.find((p) => p.id === id)
        if (!project) return
        dispatch({ type: 'project/patch', id, patch: { files: [...project.files, ...files] } })
        toast(`Added ${plural(files.length, 'file')}`, { description: 'Kept in this browser only. Nothing is uploaded.' })
      },
      removeProjectFile(id, fileId) {
        const project = stateRef.current.projects.find((p) => p.id === id)
        if (project) dispatch({ type: 'project/patch', id, patch: { files: project.files.filter((f) => f.id !== fileId) } })
      },
      setModel(model) {
        const { view } = stateRef.current
        dispatch({ type: 'model', model, chatId: view.kind === 'chat' ? view.chatId : undefined })
      },
      setModes,
      toggleSidebar() {
        const l = layout.current
        if (l.sidebarInline) setSidebarHidden(true)
        else if (l.sidebarCanInline) setSidebarHidden(false)
        else setSheetOpen(true)
      },
      resetDemo() {
        stopRun(false)
        clearSaved()
        dispatch({ type: 'reset', state: initialState() })
        toast('Demo chats restored')
      },
      openSettings(section = null) {
        closePanel(false)
        setSheetOpen(false)
        if (page) navigate(settingsPath(section))
        else {
          setCardAdmin(undefined)
          setCardSettings(section)
        }
      },
      closeSettings() {
        if (page) navigate(pathFor(stateRef.current.view))
        else setCardSettings(undefined)
      },
      openAdmin(section = null) {
        closePanel(false)
        setSheetOpen(false)
        if (page) navigate(adminPath(section))
        else {
          setCardSettings(undefined)
          setCardAdmin(section)
        }
      },
      closeAdmin() {
        if (page) navigate(pathFor(stateRef.current.view))
        else setCardAdmin(undefined)
      },
      setDefaultModel(model) {
        dispatch({ type: 'model', model })
        toast(`New chats will use ${modelById(model).name}`)
      },
    }
    return api
  }, [])

  // Full page, a change of view goes into the address… Only a change of
  // view: leaving Settings by the back button must not put the old view back.
  useEffect(() => {
    if (!page || !isAppPath(readPath()) || isFullPage(parseRoute(readPath()))) return
    const target = pathFor(state.view)
    if (readPath() !== target) navigate(target)
  }, [page, state.view])

  // …and an address typed in, or the back button, opens what it names.
  useEffect(() => {
    // Leaving the app, the address is someone else's.
    if (!page || !isAppPath(path)) return
    const route = parseRoute(path)
    if (isFullPage(route)) return
    const next = validView(route.view, stateRef.current)
    // A deleted chat or an unknown address: show what is open, in place.
    if (!next) window.location.replace(`#${pathFor(stateRef.current.view)}`)
    if (!next || pathFor(next) === pathFor(stateRef.current.view)) return
    if (next.kind === 'chat') actions.openChat(next.chatId)
    else if (next.kind === 'project') actions.openProject(next.projectId, next.tab)
    else if (next.kind === 'library') actions.openLibrary()
    else if (next.kind === 'knowledge') actions.openKnowledge(next.baseId, next.tab)
    else if (next.kind === 'agents') actions.openAgents(next.agentId, next.tab)
    else if (next.kind === 'runs') actions.openRuns(next.runId)
    else actions.newChat(next.projectId)
  }, [page, path, actions])

  const { view } = state
  const chat = view.kind === 'chat' ? state.chats.find((c) => c.id === view.chatId) ?? null : null
  const projectId = view.kind === 'chat' ? chat?.projectId ?? null
    : view.kind === 'project' || view.kind === 'new' ? view.projectId : null
  const project = state.projects.find((p) => p.id === projectId) ?? null
  const last = chat?.messages[chat.messages.length - 1]
  const lastReply = last?.role === 'assistant' ? currentReply(last) : null
  const running = lastReply?.status === 'running'

  const runningChatId = state.chats.find((c) => {
    const m = c.messages[c.messages.length - 1]
    return m?.role === 'assistant' && currentReply(m).status === 'running'
  })?.id ?? null

  // The sidebar only gets new rows when a row would look different, not on
  // every streamed chunk, so it can skip re-rendering while the agent writes.
  // Incognito chats are not in the history.
  const kept = useMemo(() => state.chats.filter((c) => !c.temporary), [state.chats])
  const signature = kept.map((c) => `${c.id}|${c.title}|${c.projectId}|${c.pinned}|${c.updatedAt}`).join('\n')
  const summaries = useMemo((): ChatSummary[] => kept.map((c) => {
    const type = chatType(chatTypeOf(c))
    return {
      id: c.id, title: c.title, projectId: c.projectId, pinned: c.pinned, updatedAt: c.updatedAt,
      type: type.value, icon: type.icon, iconColour: type.colour,
    }
  }), [signature])

  // Everything the "@" menu offers, so a sent mention shows as a pill. Agent
  // and connector names come from their stores, which don't tick while runs
  // and indexing do, so the chat doesn't re-render on every tick.
  const [savedAgents] = useStoredState<Agent[]>(AGENTS_KEY, SAMPLE_AGENTS)
  const { connectors } = useConnectors()
  const mentions = useMemo(() => {
    const names = [
      ...PEOPLE, ...jobsStore.jobs.map((j) => j.id), ...state.projects.map((p) => p.name),
      ...(project?.files.map((f) => f.name) ?? []), ...[...savedAgents, ...SHARED_AGENTS].map((a) => a.name),
      ...SAMPLE_KNOWLEDGE_BASES.map((b) => b.name), ...connectors.filter((c) => c.status === 'connected').map((c) => c.name),
    ]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map(escape)
    return names.length ? new RegExp(`@(?:${names.join('|')})`, 'g') : null
  }, [jobsStore.jobs, state.projects, project, savedAgents, connectors])

  const sidebarToggle = (
    <IconAction
      label={sidebarInline ? 'Hide sidebar' : 'Show sidebar'}
      icon={SidebarLeftIcon}
      onClick={actions.toggleSidebar}
    />
  )

  function openLatestArtifact() {
    if (!chat) return
    if (state.artifact) {
      actions.closeArtifact()
      return
    }
    const latest = lastArtifactIn(chat.messages, state.artifacts)
    if (latest) actions.openArtifact(latest.artifact.id, latest.artifact.versions.length)
  }

  function exportAll() {
    const lines: string[] = []
    const chats = stateRef.current.chats.filter((c) => !c.temporary)
    for (const c of chats) {
      lines.push(`# ${c.title}`, '')
      for (const m of c.messages) {
        if (m.role === 'user') lines.push(`**You:** ${m.text}`, '')
        else {
          const reply = currentReply(m)
          lines.push(`**${modelById(reply.model ?? m.model).name}:**`, '', replyText(reply) || '_No text._', '')
        }
      }
    }
    downloadText('all-chats.md', lines.join('\n'), 'text/markdown')
    toast(`Exported ${chats.length} chats`)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
      e.preventDefault()
      actions.newChat(null)
    }
  }

  function onPanelKeyDown(e: KeyboardEvent<HTMLElement>) {
    // Menus inside the panel are portalled; their Escape is theirs to handle.
    if (e.key !== 'Escape' || !e.currentTarget.contains(e.target as Node)) return
    e.preventDefault()
    actions.closeArtifact()
  }

  const sidebar = (inSheet: boolean) => (
    <Sidebar
      chats={summaries}
      projects={state.projects}
      view={view}
      credits={state.credits}
      runningChatId={runningChatId}
      groupByDate={state.groupByDate}
      newChatRef={newChatRef}
      kitLink={page}
      onNavigate={inSheet ? () => setSheetOpen(false) : undefined}
      onClose={inSheet ? () => setSheetOpen(false) : undefined}
    />
  )

  const panel = shownArtifact.current
  const liveText = running && lastReply?.activity ? lastReply.activity : notice

  return (
    <ActionsContext.Provider value={actions}>
      <KnowledgeProvider>
      <AgentsProvider openRun={actions.openRuns}>
          {/* The shimmer, typing dots and voice waveform keyframes, hoisted into <head> once. */}
          <AiMotion />
          <article
            ref={cardRef}
            aria-label="AI workspace"
            onKeyDown={onKeyDown}
            className={cn(
              'bg-card relative flex min-w-0 overflow-hidden',
              page ? 'h-svh' : 'h-[46rem] rounded-lg border lg:col-span-2',
            )}
          >
            {!fullPage && sidebarInline && (
              <aside aria-label="Chats and projects" className="bg-subtle flex w-64 shrink-0 flex-col border-r">
                {sidebar(false)}
              </aside>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              {admin !== undefined ? (
                <AdminScreen
                  active={admin}
                  onSelect={actions.openAdmin}
                  start={<IconAction label="Back to chats" icon={ArrowLeft01Icon} onClick={actions.closeAdmin} />}
                />
              ) : settings !== undefined ? (
                <SettingsScreen
                  active={settings}
                  onSelect={actions.openSettings}
                  start={<IconAction label="Back to chats" icon={ArrowLeft01Icon} onClick={actions.closeSettings} />}
                  model={state.model}
                  onModelChange={actions.setDefaultModel}
                  chatCount={kept.length}
                  credits={state.credits}
                  onExportAll={exportAll}
                  onResetDemo={actions.resetDemo}
                />
              ) : view.kind === 'project' && project ? (
                <ProjectView
                  project={project}
                  chats={summaries.filter((c) => c.projectId === project.id)}
                  tab={view.tab}
                  start={sidebarToggle}
                  key={project.id}
                />
              ) : view.kind === 'agents' ? (
              <AgentsView agentId={view.agentId} tab={view.tab} start={sidebarToggle} />
            ) : view.kind === 'runs' ? (
              <RunsView runId={view.runId} start={sidebarToggle} />
            ) : view.kind === 'knowledge' ? (
                <KnowledgeView baseId={view.baseId} tab={view.tab} projects={state.projects} start={sidebarToggle} />
              ) : view.kind === 'library' ? (
                <AllChats chats={kept} projects={state.projects} runningChatId={runningChatId} sidebarToggle={sidebarToggle} />
              ) : (
                <Conversation
                  chat={chat}
                  project={project}
                  projects={state.projects}
                  model={chat?.model ?? state.model}
                  modes={modes}
                  running={running}
                  awaiting={lastReply?.status === 'awaiting'}
                  credits={state.credits}
                  incognito={state.incognito}
                  openArtifactId={artifact?.id ?? null}
                  hasArtifacts={!!chat && chatHasArtifacts(chat)}
                  sidebarToggle={sidebarToggle}
                  focusKey={focusKey}
                  mentions={mentions}
                  onOpenArtifacts={openLatestArtifact}
                  onDeleted={() => setFocusKey((k) => k + 1)}
                />
              )}
            </div>

            {artifact && state.artifact && panelInline && (
              <aside
                aria-label="Artifact"
                onKeyDown={onPanelKeyDown}
                className="animate-in fade-in-0 slide-in-from-right-2 flex w-96 shrink-0 flex-col border-l duration-200"
              >
                <ArtifactPanel
                  artifact={artifact}
                  version={state.artifact.version}
                  onVersion={(version) => dispatch({ type: 'artifact/open', id: artifact.id, version })}
                  onClose={actions.closeArtifact}
                  headingRef={panelHeading}
                  key={artifact.id}
                />
              </aside>
            )}

            <div aria-live="polite" className="sr-only">{liveText}</div>
            <ChatChrome
              chats={summaries}
              projects={state.projects}
              scopeRef={page ? undefined : cardRef}
              onboarding={page ? 'auto' : 'manual'}
            />
          </article>

          {!sidebarInline && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent
                side="left"
                showCloseButton={false}
                className="bg-subtle gap-0 p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]"
              >
                <SheetTitle className="sr-only">Chats and projects</SheetTitle>
                <SheetDescription className="sr-only">Start a chat, open a project or find an old chat.</SheetDescription>
                {sidebar(true)}
              </SheetContent>
            </Sheet>
          )}

          {!panelInline && (
            <Sheet open={panelOpen} onOpenChange={(open) => !open && actions.closeArtifact()}>
              <SheetContent
                side="right"
                showCloseButton={false}
                className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
              >
                <SheetTitle className="sr-only">{panel?.artifact.title ?? 'Artifact'}</SheetTitle>
                <SheetDescription className="sr-only">Preview, code, versions and download.</SheetDescription>
                {panel && (
                  <ArtifactPanel
                    artifact={panel.artifact}
                    version={panel.version}
                    onVersion={(version) => dispatch({ type: 'artifact/open', id: panel.artifact.id, version })}
                    onClose={actions.closeArtifact}
                  />
                )}
              </SheetContent>
            </Sheet>
          )}
      </AgentsProvider>
      </KnowledgeProvider>
    </ActionsContext.Provider>
  )
}

export default function AiWorkspaceSection() {
  return (
    <Section
      id="ai-workspace"
      title="AI workspace"
      description="Projects, chat history, an agent that thinks, plans and uses tools, and artifacts"
    >
      <Panel title="Also as a full-page app" note="Same block, same chats" wide>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground max-w-xl text-xs">
            The template puts this workspace in the whole window, with no kit around it, and adds Settings
            (theme, personalisation, default model, data and account). Chats you start here show up there too.
          </p>
          <Button asChild size="sm">
            <a href="#/templates/ai-chat">
              Open AI chat app <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </Panel>
      <AiWorkspace />
    </Section>
  )
}
