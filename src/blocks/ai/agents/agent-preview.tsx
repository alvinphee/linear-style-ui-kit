import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon, BubbleChatIcon, InformationCircleIcon, Plug01Icon, RefreshIcon, SparklesIcon, Wrench01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { AssistantMessage, FollowUps, UserMessage } from '@/blocks/ai/chat/chat-message'
import { PromptBox } from '@/blocks/ai/chat/prompt-box'
import { Markdown } from '@/blocks/markdown'
import { TypingDots } from '@/components/ai/thinking-indicator'
import { IconMark } from '@/components/mark'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/text'
import type { AgentDraft } from './agent-types'

// The agent builder's Preview: try the agent as it is now, before saving it.
// A header with Reset; while the chat is empty, the agent's welcome (its
// mark, name, description and conversation starters, which send when
// clicked); then the conversation, each reply in Markdown with the tools it
// would have used ("Would use: Mail · Spreadsheets"); and a composer. A
// preview never runs tools for real, and says so.
//
// The conversation is yours: add the person's message on onSend and the
// agent's reply when it comes, with `busy` meanwhile. Clear both on onReset,
// and after changing the agent, so the preview follows the new version.

export type PreviewMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  // The tools the reply would have used, by name: 'Mail', 'Spreadsheets'.
  tools?: string[]
}

// What the agent can draw on, for the line under the header.
export type AgentUses = { knowledge: number; connectors: string[]; skills: string[] }

export function AgentPreview({
  draft, mark, messages, onSend, busy = false, onReset, uses, className,
}: {
  draft: AgentDraft
  // Stands in for the agent's icon mark in the welcome.
  mark?: ReactNode
  messages: PreviewMessage[]
  onSend: (text: string) => void
  busy?: boolean
  onReset: () => void
  // Knowledge sources (files and knowledge bases), connector and skill names.
  uses?: AgentUses
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const name = draft.name.trim() || 'New agent'
  const icon = draft.icon ?? SparklesIcon
  const colour = draft.colour ?? 'var(--brand)'
  const empty = messages.length === 0 && !busy
  const [announcement, setAnnouncement] = useState('')
  const lastReply = [...messages].reverse().find((m) => m.role === 'agent')
  const announced = useRef(lastReply?.id)

  useEffect(() => {
    if (!lastReply || lastReply.id === announced.current) return
    announced.current = lastReply.id
    const words = lastReply.text.replace(/[*_`#>|]/g, '').replace(/\s+/g, ' ').trim()
    setAnnouncement(`${name}: ${words}`)
  }, [lastReply, name])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: still ? 'auto' : 'smooth' })
  }, [messages.length, busy])

  function send(text: string) {
    if (busy || !text.trim()) return false
    onSend(text.trim())
  }

  return (
    <div className={cn('@container flex h-full min-h-0 min-w-0 flex-col', className)}>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b px-3">
        <h3 className="text-xs font-medium">Preview</h3>
        {uses && <UsesLine uses={uses} className="hidden flex-nowrap overflow-hidden @sm:flex" />}
        <Button variant="ghost" size="xs" className="ml-auto" onClick={onReset} disabled={messages.length === 0 && !busy}>
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
          Reset
        </Button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-2xl gap-5 px-3 py-4 @md:px-5">
          {empty ? (
            <div className="grid justify-items-center gap-2 py-8 text-center">
              {mark ?? <IconMark icon={icon} colour={colour} size="lg" className="size-12 rounded-xl [&_svg]:size-6" />}
              <p className={cn('text-sm font-semibold tracking-tight', !draft.name.trim() && 'text-muted-foreground')}>{name}</p>
              <p className="text-muted-foreground max-w-sm text-xs">
                {draft.description.trim() || 'Describe the agent in Create, or fill it in under Configure, then try it here.'}
              </p>
              {uses && <UsesLine uses={uses} className="mt-1 justify-center @sm:hidden" />}
              {draft.starters.length > 0 && (
                <FollowUps
                  items={draft.starters.filter((s) => s.trim())}
                  onPick={send}
                  label="Conversation starters"
                  icon={BubbleChatIcon}
                  className="mt-3 max-w-md justify-center"
                />
              )}
            </div>
          ) : (
            messages.map((m) => m.role === 'user' ? (
              <UserMessage key={m.id} text={m.text} />
            ) : (
              <AssistantMessage key={m.id} name={name} icon={icon}>
                <Markdown text={m.text} />
                {m.tools && m.tools.length > 0 && (
                  <p className="text-muted-foreground flex min-w-0 items-start gap-1.5 text-[11px]">
                    <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} className="mt-px size-3 shrink-0" />
                    <span className="min-w-0">Would use: {m.tools.join(' · ')}</span>
                  </p>
                )}
              </AssistantMessage>
            ))
          )}
          {busy && (
            <AssistantMessage name={name} icon={icon} label={`${name} is writing`}>
              <TypingDots />
            </AssistantMessage>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pt-1 pb-3 @md:px-5">
        <PromptBox
          onSubmit={send}
          placeholder={`Message ${name}`}
          label={`Message ${name} (preview)`}
          maxAttachments={0}
          hints={false}
          footer={(
            <span className="flex min-w-0 items-center gap-1">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-3 shrink-0" />
              Preview only: tools are not run for real, and nothing is saved.
            </span>
          )}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  )
}

// "2 knowledge sources · Mail, Spreadsheets · Invoice checks", with icons.
function UsesLine({ uses, className }: { uses: AgentUses; className?: string }) {
  const parts = [
    uses.knowledge > 0 && { icon: BookOpen01Icon, label: 'Knowledge', text: plural(uses.knowledge, 'knowledge source') },
    uses.connectors.length > 0 && { icon: Plug01Icon, label: 'Connectors', text: uses.connectors.join(', ') },
    uses.skills.length > 0 && { icon: SparklesIcon, label: 'Skills', text: uses.skills.join(', ') },
  ].filter((p) => !!p)
  if (!parts.length) return null
  return (
    <ul aria-label="What it can use" className={cn('text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', className)}>
      {parts.map((p) => (
        <li key={p.label} className="flex min-w-0 items-center gap-1">
          <HugeiconsIcon icon={p.icon} strokeWidth={2} className="size-3 shrink-0" aria-label={p.label} />
          <span className="min-w-0 truncate">{p.text}</span>
        </li>
      ))}
    </ul>
  )
}
