import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AgentBuilder, type AgentBuilderTab } from '@/blocks/ai/agents/agent-builder'
import { AgentPreview, type AgentUses, type PreviewMessage } from '@/blocks/ai/agents/agent-preview'
import type { AgentDraft, AgentTrigger } from '@/blocks/ai/agents/agent-types'
import { BuilderChat, type BuilderMessage } from '@/blocks/ai/agents/builder-chat'
import { IconAction } from '@/components/icon-action'
import { describeRecurrence } from '@/components/recurrence-picker'
import { useTimers } from '@/lib/use-timers'
import { BUILDER_GREETING, BUILDER_SUGGESTIONS, EMPTY_DRAFT, builderTurn, previewReply } from '../ai/agents/builder-script'
import { SAMPLE_KNOWLEDGE_BASES } from '../ai/knowledge/bases-data'
import { CONNECTORS } from '../ai/settings/connectors-data'
import { SAMPLE_SKILLS } from '../ai/settings/skills-data'
import { Panel } from '../shared'

// The agent builder on local state, run by the scripted builder (nothing
// here touches the AI chat app's saved agents): the whole builder in a card,
// with Create, a read-only Configure (the form is its own page's) and the
// Preview; then the Create chat and the Preview on their own.

const BUILDER_DELAY = 900
const PREVIEW_DELAY = 800

let seq = 0
const nextId = (prefix: string) => `${prefix}-${(++seq).toString(36)}`

const greeting = (): BuilderMessage => ({ id: nextId('b'), role: 'builder', text: BUILDER_GREETING })

const connectorName = (id: string) => CONNECTORS.find((c) => c.id === id)?.name ?? id
const skillName = (id: string) => SAMPLE_SKILLS.find((s) => s.id === id)?.name ?? id
const baseName = (id: string) => SAMPLE_KNOWLEDGE_BASES.find((b) => b.id === id)?.name ?? id

const usesOf = (draft: AgentDraft): AgentUses => ({
  knowledge: draft.files.length + draft.knowledgeBases.length,
  connectors: Object.keys(draft.connectors).map(connectorName),
  skills: draft.skills.map(skillName),
})

// Everything but the icon, which is compared as itself.
const snapshot = ({ icon: _icon, ...rest }: AgentDraft) => JSON.stringify(rest)
const changed = (a: AgentDraft, b: AgentDraft) => a.icon !== b.icon || snapshot(a) !== snapshot(b)

// A builder conversation and its draft, answered by the script after a pause.
function useBuilder(start: AgentDraft, opening: BuilderMessage[]) {
  const [draft, setDraft] = useState(start)
  const [messages, setMessages] = useState(opening)
  const [busy, setBusy] = useState(false)
  const { later, clearAll } = useTimers()
  const latest = useRef({ draft, messages })
  latest.current = { draft, messages }

  function send(text: string) {
    const history = latest.current.messages
    setMessages((list) => [...list, { id: nextId('u'), role: 'user', text }])
    setBusy(true)
    later(() => {
      const turn = builderTurn(latest.current.draft, history, text)
      setDraft((d) => ({ ...d, ...turn.patch }))
      setMessages((list) => [...list, { id: nextId('b'), role: 'builder', text: turn.reply, updated: turn.updated }])
      setBusy(false)
    }, BUILDER_DELAY)
  }

  function reset(to: AgentDraft, conversation: BuilderMessage[]) {
    clearAll()
    setBusy(false)
    setDraft(to)
    setMessages(conversation)
  }

  return { draft, setDraft, messages, busy, send, reset }
}

// A preview conversation with a draft, answered in the agent's voice.
function usePreview() {
  const [messages, setMessages] = useState<PreviewMessage[]>([])
  const [busy, setBusy] = useState(false)
  const { later, clearAll } = useTimers()

  function send(draft: AgentDraft, text: string) {
    setMessages((list) => [...list, { id: nextId('pu'), role: 'user', text }])
    setBusy(true)
    later(() => {
      const reply = previewReply(draft, text)
      setMessages((list) => [...list, { id: nextId('pa'), role: 'agent', text: reply.text, tools: reply.tools }])
      setBusy(false)
    }, PREVIEW_DELAY)
  }

  function reset() {
    clearAll()
    setBusy(false)
    setMessages([])
  }

  return { messages, busy, send, reset }
}

export function BuilderPanels() {
  return (
    <>
      <Panel title="Agent builder" note="Describe it in Create, then try it in the Preview" wide>
        <BuilderDemo />
      </Panel>
      <Panel title="Create: the builder chat" note="One question at a time; Updated chips show what changed">
        <ChatDemo />
      </Panel>
      <Panel title="Preview" note="Conversation starters send; tools are not run">
        <PreviewDemo />
      </Panel>
    </>
  )
}

function BuilderDemo() {
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [saved, setSaved] = useState(EMPTY_DRAFT)
  const [tab, setTab] = useState<AgentBuilderTab>('create')
  const [saving, setSaving] = useState(false)
  const builder = useBuilder(EMPTY_DRAFT, [greeting()])
  const preview = usePreview()
  const { later } = useTimers()
  const draft = builder.draft
  const dirty = useMemo(() => changed(draft, saved), [draft, saved])

  function save() {
    setSaving(true)
    later(() => {
      setSaving(false)
      setSaved(draft)
      setMode('edit')
      toast(mode === 'create' ? `${draft.name} created` : `${draft.name} saved`, { description: 'Demo only: it is kept on this page until you reload.' })
    }, 700)
  }

  function cancel() {
    builder.reset(saved, mode === 'create' ? [greeting()] : builder.messages)
    preview.reset()
    toast(dirty ? 'Changes discarded' : 'Nothing to discard', { description: 'Demo only: in the app, Cancel goes back to your agents.' })
  }

  return (
    <div className="h-[44rem] max-h-[85vh] min-h-[30rem] overflow-hidden rounded-md border">
      <AgentBuilder
        draft={draft}
        mode={mode}
        tab={tab}
        onTabChange={setTab}
        start={<IconAction label="Back to agents" icon={ArrowLeft01Icon} onClick={() => toast('Demo only', { description: 'Goes back to your agents.' })} />}
        dirty={dirty}
        saving={saving}
        canSave={!!draft.name.trim() && !builder.busy}
        onSave={save}
        onCancel={cancel}
        create={(
          <BuilderChat
            messages={builder.messages}
            onSend={builder.send}
            busy={builder.busy}
            suggestions={BUILDER_SUGGESTIONS}
          />
        )}
        configure={<DraftSummary draft={draft} />}
        preview={(
          <AgentPreview
            draft={draft}
            messages={preview.messages}
            onSend={(text) => preview.send(draft, text)}
            busy={preview.busy}
            onReset={preview.reset}
            uses={usesOf(draft)}
          />
        )}
      />
    </div>
  )
}

// Half-way through: the description given and its first question answered.
function sampleConversation() {
  const said = ['Reads supplier emails and files the invoices', 'Accounts › Invoices']
  let draft = EMPTY_DRAFT
  const messages: BuilderMessage[] = [greeting()]
  for (const text of said) {
    const turn = builderTurn(draft, messages, text)
    draft = { ...draft, ...turn.patch }
    messages.push({ id: nextId('u'), role: 'user', text }, { id: nextId('b'), role: 'builder', text: turn.reply, updated: turn.updated })
  }
  return { draft, messages }
}

function ChatDemo() {
  const [sample] = useState(sampleConversation)
  const builder = useBuilder(sample.draft, sample.messages)
  return (
    <div className="flex h-[32rem] max-h-[80vh] flex-col overflow-hidden rounded-md border">
      <BuilderChat messages={builder.messages} onSend={builder.send} busy={builder.busy} suggestions={BUILDER_SUGGESTIONS} />
    </div>
  )
}

function PreviewDemo() {
  const [draft] = useState(() => ({ ...EMPTY_DRAFT, ...builderTurn(EMPTY_DRAFT, [], 'Writes a weekly report from our jobs').patch }))
  const preview = usePreview()
  return (
    <div className="flex h-[32rem] max-h-[80vh] flex-col overflow-hidden rounded-md border">
      <AgentPreview
        draft={draft}
        messages={preview.messages}
        onSend={(text) => preview.send(draft, text)}
        busy={preview.busy}
        onReset={preview.reset}
        uses={usesOf(draft)}
      />
    </div>
  )
}

const PERMISSION_LABEL = { always: 'Always allow', ask: 'Ask first', off: 'Off' } as const

function triggerLabel(t: AgentTrigger) {
  if (t.kind === 'schedule') return describeRecurrence(t.recurrence)
  if (t.kind === 'event') return `${t.eventLabel} in ${connectorName(t.connectorId)}${t.filter ? ` · ${t.filter}` : ''}`
  return 'When someone asks'
}

// Stands in for the configuration form: what the builder has filled in, read only.
function DraftSummary({ draft }: { draft: AgentDraft }) {
  const none = <span className="text-muted-foreground">None yet</span>
  return (
    <div className="grid gap-3 p-3 @container">
      <p className="text-muted-foreground bg-muted/50 rounded-md px-2.5 py-2 text-xs">
        The configuration form goes here. This read-only view shows what the builder has filled in so far.
      </p>
      <dl className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-3 text-xs @md:grid-cols-[8rem_minmax(0,1fr)]">
        <Field label="Name">{draft.name || none}</Field>
        <Field label="Description">{draft.description || none}</Field>
        <Field label="Instructions">
          {draft.instructions
            ? <pre className="bg-muted/50 max-h-56 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{draft.instructions}</pre>
            : none}
        </Field>
        <Field label="Conversation starters">
          {draft.starters.length ? <ul className="grid gap-0.5">{draft.starters.map((s) => <li key={s}>{s}</li>)}</ul> : none}
        </Field>
        <Field label="Knowledge">
          {draft.knowledgeBases.length || draft.files.length
            ? [...draft.knowledgeBases.map(baseName), ...draft.files.map((f) => f.name)].join(', ')
            : none}
        </Field>
        <Field label="Connectors">
          {Object.keys(draft.connectors).length ? (
            <ul className="grid gap-1.5">
              {Object.entries(draft.connectors).map(([id, tools]) => (
                <li key={id} className="min-w-0">
                  <span className="font-medium">{connectorName(id)}</span>
                  <span className="text-muted-foreground block font-mono text-[11px] break-words">
                    {Object.entries(tools).map(([tool, p]) => `${tool}: ${PERMISSION_LABEL[p]}`).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          ) : none}
        </Field>
        <Field label="Skills">{draft.skills.length ? draft.skills.map(skillName).join(', ') : none}</Field>
        <Field label="Triggers">
          {draft.triggers.length ? <ul className="grid gap-0.5">{draft.triggers.map((t) => <li key={t.id}>{triggerLabel(t)}</li>)}</ul> : 'When someone asks'}
        </Field>
      </dl>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className="-mt-2 min-w-0 break-words @md:mt-0">{children}</dd>
    </>
  )
}
