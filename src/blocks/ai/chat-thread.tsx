import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDown02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'

// The middle of a chat screen: the scrolling thread of messages, and the
// welcome screen a new chat opens on (greeting, prompt box, starter cards).
// Nothing here knows about messages or a model: the messages, the prompt box
// and the starters come in as children and props.

// The thread scrolls to the end on a new chat (`resetKey`) or a new message
// (`count`), and follows streamed text (`follow`) only while the reader is at
// the end. Scrolled up, a "Jump to latest" button brings them back.
export function ChatThread({
  resetKey, count, follow, label, busy, jumpLabel = 'Jump to latest', children, className, columnClassName,
}: {
  // Changes when another chat opens.
  resetKey?: string | number
  // The number of messages.
  count: number
  // Anything that changes while a reply streams, such as the messages array.
  follow?: unknown
  // With a label the thread is a live region (role="log") screen readers follow.
  label?: string
  busy?: boolean
  jumpLabel?: string
  children: ReactNode
  className?: string
  // The centred column the messages sit in.
  columnClassName?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stick = useRef(true)
  const [atBottom, setAtBottom] = useState(true)

  const toBottom = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // A new chat, or a new message: go to the end.
  useLayoutEffect(() => {
    stick.current = true
    setAtBottom(true)
    toBottom()
  }, [resetKey, count])

  // Streaming: follow the text only while the reader is at the end.
  useLayoutEffect(() => {
    if (stick.current) toBottom()
  }, [follow])

  // The column grows as markdown, trails and tables open.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (stick.current) toBottom()
    })
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    stick.current = near
    setAtBottom(near)
  }

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role={label ? 'log' : undefined}
        aria-label={label}
        aria-busy={label ? busy : undefined}
        className="h-full overflow-y-auto [overflow-anchor:none]"
      >
        <div className={cn('mx-auto grid max-w-3xl min-w-0 gap-6 px-4 pt-5 pb-8', columnClassName)}>{children}</div>
      </div>
      {!atBottom && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            stick.current = true
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
          }}
          className="bg-card hover:bg-accent animate-in fade-in-0 slide-in-from-bottom-1 absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
        >
          <HugeiconsIcon icon={ArrowDown02Icon} strokeWidth={2} data-icon="inline-start" />
          {jumpLabel}
        </Button>
      )}
    </div>
  )
}

// A new chat: a greeting in the middle, the prompt box under it (children),
// then starter cards. It scrolls by itself when the screen is short.
export function ChatWelcome({
  title, description, icon = SparklesIcon, headingAs: Heading = 'h2', starters, children, className,
}: {
  title: ReactNode
  description?: ReactNode
  icon?: IconSvgElement
  headingAs?: ElementType
  // Usually <PromptStarters />.
  starters?: ReactNode
  // Usually the prompt box.
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', className)}>
      <div className="m-auto grid w-full max-w-2xl min-w-0 gap-5 px-4 py-8">
        <div className="grid justify-items-center gap-2 text-center">
          <span className="bg-brand/10 text-brand grid size-10 place-items-center rounded-xl">
            <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
          </span>
          <Heading className="text-xl font-semibold tracking-tight">{title}</Heading>
          {description && <p className="text-muted-foreground max-w-md text-[13px]">{description}</p>}
        </div>
        {children}
        {starters}
      </div>
    </div>
  )
}

export type PromptStarter = {
  id?: string
  icon: IconSvgElement
  // Tints the icon, such as a module's colour.
  colour?: string
  title: ReactNode
  hint?: ReactNode
  onSelect: () => void
}

// Cards that start a chat with one click: an icon, what it asks and a hint.
// One column, two from @xl up (put them in an @container).
export function PromptStarters({ items, label = 'Suggested prompts', className }: {
  items: PromptStarter[]
  label?: string
  className?: string
}) {
  return (
    <ul aria-label={label} className={cn('grid grid-cols-1 gap-2 @xl:grid-cols-2', className)}>
      {items.map((item, i) => (
        <li key={item.id ?? i} className="min-w-0">
          <button
            type="button"
            onClick={item.onSelect}
            className="hover:bg-accent/60 focus-visible:ring-ring/30 flex h-full w-full min-w-0 items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2"
          >
            <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-md">
              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" style={item.colour ? { color: item.colour } : undefined} />
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="text-xs font-medium">{item.title}</span>
              {item.hint && <span className="text-muted-foreground text-[11px]">{item.hint}</span>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
