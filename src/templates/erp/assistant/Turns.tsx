import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, DatabaseIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AssistantMessage, FollowUps, MessageActions, StoppedNote, UserMessage } from '@/blocks/ai/chat-message'
import { PromptBox } from '@/blocks/ai/prompt-box'
import { ThinkingTrail, type TrailStep } from '@/blocks/ai/thinking-trail'
import { Markdown } from '@/blocks/markdown'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import type { Link } from './answers'
import { THINK_MS, textOf, useAssistant, type Chat, type Reply } from './store'

// The pieces of an Ask AI chat that the side panel and the full-page
// Assistant share, made from the kit's AI blocks: the turns of a chat and the
// prompt box.

// The copy buttons show their own tick, so no toast unless the copy fails.
const copy = (text: string) => void copyText(text, { success: false })

// The reply's thinking trail: reading the records it answers from.
function trailOf(reply: Reply): TrailStep[] {
  const thinking = reply.state === 'thinking'
  const status = thinking ? 'running' : 'done'
  const steps: TrailStep[] = [{
    id: 'match', kind: 'thinking', status, ms: THINK_MS / 2, startedAt: reply.startedAt,
    label: reply.source ? `Matched the question to ${reply.source}.` : 'Looked for records that answer the question.',
  }]
  if (reply.source) {
    steps.push({
      id: 'read', kind: 'tool', status, ms: THINK_MS / 2, startedAt: reply.startedAt, icon: DatabaseIcon,
      label: 'Read', activeLabel: 'Reading', detail: reply.source, name: 'read_records',
      input: { question: reply.question }, output: { read: reply.source }, summary: thinking ? undefined : reply.source,
    })
  }
  return steps
}

export function Turns({ chat, onLink, onOpenPage }: {
  chat: Chat
  // A record link in an answer ("#record:invoices:INV-2026-0409").
  onLink: (href: string) => void
  // A page button under an answer.
  onOpenPage: (link: Link) => void
}) {
  const { busy, send, regenerate, setFeedback } = useAssistant()
  return chat.messages.map((m) => (m.role === 'user' ? (
    <UserMessage key={m.id} text={m.text} onCopy={copy} />
  ) : (
    <AssistantMessage
      key={m.id}
      name="Ask AI"
      actions={(m.state === 'done' || m.state === 'stopped') && (
        <MessageActions
          onCopy={() => copy(m.plain)}
          onRegenerate={() => regenerate(chat.id, m.id)}
          regenerateDisabled={busy}
          feedback={m.feedback ?? null}
          onFeedback={(feedback) => {
            setFeedback(chat.id, m.id, feedback ?? null)
            if (feedback) toast('Thanks for the feedback', { description: 'It helps improve Ask AI’s answers.' })
          }}
        />
      )}
    >
      <ThinkingTrail steps={trailOf(m)} live={m.state === 'thinking'} startedAt={m.startedAt} duration={THINK_MS} />
      {m.state !== 'thinking' && <Markdown text={textOf(m)} streaming={m.state === 'streaming'} onLink={onLink} />}
      {m.state === 'stopped' && <StoppedNote>{m.shown ? 'Stopped' : 'Stopped before answering'}</StoppedNote>}
      {m.state === 'done' && ((m.links?.length ?? 0) > 0 || (m.followUps?.length ?? 0) > 0) && (
        <div className="grid gap-2">
          {!!m.links?.length && (
            <div className="flex flex-wrap gap-1.5">
              {m.links.map((l) => (
                <Button key={`${l.module}/${l.page}`} variant="outline" size="sm" onClick={() => onOpenPage(l)}>
                  {l.label}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                </Button>
              ))}
            </div>
          )}
          <FollowUps items={m.followUps ?? []} onPick={(q) => send(q)} />
        </div>
      )}
    </AssistantMessage>
  )))
}

// The prompt box, sending into the active chat (or a new one with newChat).
export function Composer({ placeholder, newChat, autoFocus, followFocus = true, onSent, className }: {
  placeholder: string
  newChat?: boolean
  autoFocus?: boolean
  // Take focus when a view asks for it (New chat, opening a chat). Off for a
  // box that sits under the side panel, such as the launchpad's.
  followFocus?: boolean
  // After a send, such as going to the Assistant from the launchpad.
  onSent?: () => void
  className?: string
}) {
  const { busy, send, stop, focusKey } = useAssistant()
  return (
    <PromptBox
      onSubmit={(text) => {
        if (!send(text, { newChat })) return false
        onSent?.()
      }}
      running={busy}
      onStop={stop}
      maxAttachments={0}
      label="Ask a question"
      placeholder={placeholder}
      footer="AI answers can be wrong. Check important numbers."
      autoFocus={autoFocus}
      focusKey={followFocus ? focusKey : undefined}
      className={className}
    />
  )
}
