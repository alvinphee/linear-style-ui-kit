import { useState, type ReactNode } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Shortcut } from './shortcut'

// A box for leaving a comment on a record: it grows as you type, and the
// button (or ⌘ / Ctrl + Enter) sends the text and empties the box. The send
// button stays disabled while it is blank. `actions` sit before the button,
// such as an Attach a file IconAction. Give it a `key` per record so each
// record starts with an empty box.
export function CommentBox({ onComment, placeholder = 'Leave a comment…', label = 'Comment', actions, className }: {
  // Called with the trimmed text.
  onComment: (text: string) => void
  placeholder?: string
  // The box's accessible name and the button's text.
  label?: string
  actions?: ReactNode
  className?: string
}) {
  const [text, setText] = useState('')
  const empty = !text.trim()

  function submit() {
    if (empty) return
    onComment(text.trim())
    setText('')
  }

  return (
    <div
      className={cn(
        'bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 rounded-lg border transition-colors focus-within:ring-2',
        className,
      )}
    >
      <Textarea
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            submit()
          }
        }}
        className="min-h-14 border-0 bg-transparent px-3 py-2.5 focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="flex items-center justify-end gap-1 px-2 pb-2">
        <span className="text-muted-foreground mr-auto hidden items-center gap-1.5 pl-1 text-[11px] sm:flex">
          <Shortcut keys={['mod', 'enter']} /> to send
        </span>
        {actions}
        <Button variant={empty ? 'secondary' : 'default'} disabled={empty} onClick={submit}>
          {label}
        </Button>
      </div>
    </div>
  )
}
