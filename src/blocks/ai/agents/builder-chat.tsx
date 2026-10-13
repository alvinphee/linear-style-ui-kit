import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, Idea01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { AssistantMessage, FollowUps, UserMessage } from '@/blocks/ai/chat/chat-message'
import { PromptBox } from '@/blocks/ai/chat/prompt-box'
import { Markdown } from '@/blocks/markdown'
import { TypingDots } from '@/components/ai/thinking-indicator'

// The agent builder's Create tab: describe the agent you want in a chat, and
// the builder fills it in, asking one question at a time. Each builder
// message (Markdown) lists the fields it changed ("Updated: Name ·
// Instructions · Tools"); typing dots show while it works. Before you write
// anything, suggestion chips offer a first description. The composer stays
// at the foot; the list scrolls to the newest message, and each new builder
// message is read out politely to screen readers.
//
// The conversation is yours: keep `messages`, add the person's on onSend and
// the builder's when your engine answers, and set `busy` meanwhile.

export type BuilderMessage = {
  id: string
  role: 'user' | 'builder'
  text: string
  // The fields this message changed: 'Name', 'Instructions', 'Tools'…
  updated?: string[]
}

// Markdown read aloud as plain words.
const plainText = (markdown: string) => markdown
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[*_`#>|]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const BUILDER = 'Agent builder'

export function BuilderChat({
  messages, onSend, busy = false, suggestions = [], placeholder = 'Describe the agent, or answer the builder', className,
}: {
  messages: BuilderMessage[]
  onSend: (text: string) => void
  // The builder is writing: typing dots show, and sending waits.
  busy?: boolean
  // First descriptions to pick from, shown until the person writes one.
  suggestions?: string[]
  placeholder?: string
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState('')
  const lastBuilder = [...messages].reverse().find((m) => m.role === 'builder')
  // Messages already there when the chat opens are not read out.
  const announced = useRef(lastBuilder?.id)
  const started = messages.some((m) => m.role === 'user')

  useEffect(() => {
    if (!lastBuilder || lastBuilder.id === announced.current) return
    announced.current = lastBuilder.id
    const changed = lastBuilder.updated?.length ? ` Updated: ${lastBuilder.updated.join(', ')}.` : ''
    setAnnouncement(`${BUILDER}: ${plainText(lastBuilder.text)}${changed}`)
  }, [lastBuilder])

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
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-2xl gap-5 px-3 py-4 @md:px-5">
          {messages.length === 0 && !busy && (
            <div className="grid justify-items-center gap-2 py-6 text-center">
              <span className="bg-brand/10 text-brand grid size-9 place-items-center rounded-full">
                <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} className="size-4.5" />
              </span>
              <p className="text-[13px] font-medium">What should your agent do?</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Describe it in a sentence. The builder fills in its name, instructions and tools, and asks about the rest.
              </p>
            </div>
          )}

          {messages.map((m) => m.role === 'user' ? (
            <UserMessage key={m.id} text={m.text} />
          ) : (
            <AssistantMessage key={m.id} name={BUILDER} icon={AiMagicIcon}>
              <Markdown text={m.text} />
              {m.updated && m.updated.length > 0 && <UpdatedFields fields={m.updated} />}
            </AssistantMessage>
          ))}

          {busy && (
            <AssistantMessage name={BUILDER} icon={AiMagicIcon} label={`${BUILDER} is writing`}>
              <TypingDots />
            </AssistantMessage>
          )}

          {!started && !busy && suggestions.length > 0 && (
            <FollowUps
              items={suggestions}
              onPick={send}
              label="Try a description"
              icon={Idea01Icon}
              className={cn(messages.length === 0 && 'justify-center')}
            />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pt-1 pb-3 @md:px-5">
        <PromptBox
          onSubmit={send}
          placeholder={placeholder}
          label="Message the agent builder"
          maxAttachments={0}
          hints={false}
        />
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  )
}

// "Updated: Name · Instructions · Tools" under a builder message.
export function UpdatedFields({ fields, className }: { fields: string[]; className?: string }) {
  return (
    <p className={cn('text-muted-foreground flex min-w-0 flex-wrap items-center gap-1 text-[11px]', className)}>
      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done size-3 shrink-0" />
      <span className="mr-0.5">Updated:</span>
      {fields.map((field) => (
        <span key={field} className="bg-muted text-foreground rounded px-1.5 py-px font-medium">{field}</span>
      ))}
    </p>
  )
}
