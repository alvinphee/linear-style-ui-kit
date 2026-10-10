import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleIcon, ArrowDown01Icon, ArrowUp02Icon, Cancel01Icon, Mail01Icon, MagicWand01Icon,
  RefreshIcon, Scissor01Icon, SmileIcon, SparklesIcon, Tick02Icon, TranslateIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { AiLabel } from '@/components/ai/ai-label'
import { Shortcut, ariaKeyShortcuts } from '@/components/shortcut'
import { Thinking } from '@/components/ai/thinking-indicator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useTimers } from '@/lib/use-timers'
import { Panel } from '../shared'
import {
  ACTION_LABELS, LANGS, SAMPLE, actionFromPrompt, prepareRange, rewrite, type Lang, type RewriteAction,
  type RewriteRequest,
} from './rewrite'
import { DiffText, diffWords } from './shared'

// Ctrl+J (⌘J on a Mac) asks AI about the selection.
const ASK_KEYS = ['mod', 'J']

type Phase =
  | { kind: 'idle' }
  | { kind: 'thinking'; req: RewriteRequest }
  | { kind: 'suggestion'; req: RewriteRequest; text: string }
  | { kind: 'error'; req: RewriteRequest; message: string }

type Range = { start: number; end: number }

// The textarea, its hidden mirror and the read-only diff view share one box
// model, so the mirror can tell us where the selection sits on screen.
const TEXT_BOX = 'px-3 py-2.5 text-[13px] leading-6 whitespace-pre-wrap break-words'

export function InlineRewritePanel() {
  const [value, setValue] = useState(SAMPLE)
  const [selection, setSelection] = useState<Range | null>(null)
  const [dragging, setDragging] = useState(false)
  const [areaFocused, setAreaFocused] = useState(false)
  const [asking, setAsking] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const markRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const menuOpen = useRef(false)
  const pickedLanguage = useRef(false)
  const caretAfter = useRef<number | null>(null)
  const { later, clearAll } = useTimers()

  const busy = phase.kind !== 'idle'
  const showBar = !!selection && !dragging && !busy

  function readSelection() {
    const el = areaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    if (end > start && el.value.slice(start, end).trim()) {
      setSelection({ start, end })
    } else {
      setSelection(null)
      setAsking(false)
    }
  }

  function hideBar() {
    setSelection(null)
    setAsking(false)
  }

  // Only show the toolbar once a mouse selection is finished.
  useEffect(() => {
    if (!dragging) return
    const up = () => {
      setDragging(false)
      readSelection()
    }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [dragging])

  // A click anywhere else hides the toolbar. The Translate menu is portalled,
  // so clicks inside it are ignored while it is open.
  useEffect(() => {
    if (!selection) return
    const down = (e: PointerEvent) => {
      if (menuOpen.current || wrapRef.current?.contains(e.target as Node)) return
      hideBar()
    }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [selection])

  // Grow the textarea where field-sizing is not supported.
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el || CSS.supports('field-sizing', 'content')) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value, busy])

  useLayoutEffect(() => {
    if (!showBar) {
      setPosition(null)
      return
    }
    function place() {
      const mark = markRef.current
      const bar = barRef.current
      const wrap = wrapRef.current
      if (!mark || !bar || !wrap) return
      const maxLeft = Math.max(0, wrap.clientWidth - bar.offsetWidth)
      const left = Math.min(Math.max(0, mark.offsetLeft - 6), maxLeft)
      setPosition({ top: mark.offsetTop - bar.offsetHeight - 6, left })
    }
    place()
    const observer = new ResizeObserver(place)
    if (wrapRef.current) observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [showBar, selection, value, asking])

  useEffect(() => {
    if (phase.kind === 'thinking') viewRef.current?.focus({ preventScroll: true })
    if (phase.kind === 'suggestion' || phase.kind === 'error') primaryRef.current?.focus({ preventScroll: true })
  }, [phase])

  // Back in edit mode: put the caret where the change ended.
  useLayoutEffect(() => {
    if (busy || caretAfter.current == null) return
    const el = areaRef.current
    const at = caretAfter.current
    caretAfter.current = null
    el?.focus({ preventScroll: true })
    el?.setSelectionRange(at, at)
  }, [busy])

  function start(req: RewriteRequest) {
    clearAll()
    hideBar()
    setPhase({ kind: 'thinking', req })
    const words = value.slice(req.start, req.end).split(/\s+/).length
    later(() => {
      const result = rewrite(value, req)
      setPhase(
        result.ok
          ? { kind: 'suggestion', req, text: result.text }
          : { kind: 'error', req, message: result.message },
      )
    }, Math.min(1500, 650 + words * 16))
  }

  function run(action: RewriteAction, options: { lang?: Lang; label?: string } = {}) {
    if (!selection) return
    const range = prepareRange(value, selection.start, selection.end, action)
    const label = options.label
      ?? (action === 'translate' ? `Translate to ${LANGS.find((l) => l.id === options.lang)?.name}` : ACTION_LABELS[action])
    start({ ...range, action, lang: options.lang, attempt: 0, label })
  }

  function ask() {
    const text = prompt.trim()
    if (!text) return
    const { action, lang } = actionFromPrompt(text)
    run(action, { lang, label: `“${text}”` })
    setPrompt('')
  }

  function accept() {
    if (phase.kind !== 'suggestion') return
    const { req, text } = phase
    const previous = value
    setValue(value.slice(0, req.start) + text + value.slice(req.end))
    caretAfter.current = req.start + text.length
    setPhase({ kind: 'idle' })
    toast('Replaced with the AI suggestion', {
      action: {
        label: 'Undo',
        onClick: () => {
          clearAll()
          hideBar()
          setPhase({ kind: 'idle' })
          setValue(previous)
        },
      },
    })
  }

  function reject() {
    if (phase.kind === 'idle') return
    clearAll()
    caretAfter.current = phase.req.end
    setPhase({ kind: 'idle' })
  }

  function retry() {
    if (phase.kind === 'idle') return
    start({ ...phase.req, attempt: phase.req.attempt + 1 })
  }

  function reset() {
    clearAll()
    hideBar()
    setPhase({ kind: 'idle' })
    setValue(SAMPLE)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Keys from the portalled Translate menu bubble here too; the menu handles its own Esc.
    if (e.key !== 'Escape' || !e.currentTarget.contains(e.target as Node)) return
    if (busy) {
      e.preventDefault()
      e.stopPropagation()
      reject()
    } else if (asking) {
      e.preventDefault()
      setAsking(false)
      areaRef.current?.focus()
    } else if (selection) {
      e.preventDefault()
      areaRef.current?.focus()
      areaRef.current?.setSelectionRange(selection.end, selection.end)
      hideBar()
    }
  }

  const req = phase.kind === 'idle' ? null : phase.req
  const original = req ? value.slice(req.start, req.end) : ''
  const unchanged = phase.kind === 'suggestion' && phase.text.trim() === original.trim()
  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <Panel title="Inline AI on selected text" note="Select any words in the draft" wide>
      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          <span className="truncate font-medium">Jurong delivery update</span>
          <span className="text-muted-foreground hidden truncate sm:inline">to Operations · draft</span>
          <span className="text-muted-foreground ml-auto shrink-0 tabular-nums">{words} words</span>
        </div>

        <div
          ref={wrapRef}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null
            if (next && !e.currentTarget.contains(next) && !menuOpen.current) hideBar()
          }}
          className="bg-input/20 dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/30 relative min-w-0 rounded-lg border transition-colors focus-within:ring-2"
        >
          {showBar && selection && (
            <div aria-hidden className={cn(TEXT_BOX, 'pointer-events-none absolute inset-0 text-transparent select-none')}>
              {value.slice(0, selection.start)}
              <span ref={markRef} className={cn('rounded-[2px]', !areaFocused && 'bg-brand/20')}>
                {value.slice(selection.start, selection.end)}
              </span>
              {value.slice(selection.end)}
            </div>
          )}

          <textarea
            ref={areaRef}
            aria-label="Message draft"
            aria-describedby="ai-inline-hint"
            aria-keyshortcuts={ariaKeyShortcuts(ASK_KEYS)}
            value={value}
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onSelect={readSelection}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => {
              setDragging(false)
              readSelection()
            }}
            onFocus={() => setAreaFocused(true)}
            onBlur={() => setAreaFocused(false)}
            onKeyDown={(e) => {
              if (e.key.toLowerCase() === 'j' && (e.ctrlKey || e.metaKey) && selection) {
                e.preventDefault()
                setAsking(true)
              }
            }}
            className={cn(
              TEXT_BOX,
              'relative z-10 block field-sizing-content min-h-28 w-full resize-none overflow-hidden bg-transparent outline-none',
              busy && 'hidden',
            )}
          />

          {busy && req && (
            <div ref={viewRef} tabIndex={-1} className={cn(TEXT_BOX, 'min-h-28 outline-none')}>
              {value.slice(0, req.start)}
              {phase.kind === 'thinking' && (
                <span className="bg-brand/10 rounded-[3px]">
                  <span className="shimmer">{original}</span>
                </span>
              )}
              {phase.kind === 'suggestion' && (
                unchanged
                  ? <span className="bg-brand/10 rounded-[3px]">{original}</span>
                  : <DiffText parts={diffWords(original, phase.text)} />
              )}
              {phase.kind === 'error' && <span className="bg-destructive/10 rounded-[3px]">{original}</span>}
              {value.slice(req.end)}
            </div>
          )}

          {showBar && (
            <div
              ref={barRef}
              role="toolbar"
              aria-label="AI actions for the selected text"
              // Keep the textarea focused (and its selection alive) while clicking buttons.
              onMouseDown={(e) => {
                if (!(e.target as HTMLElement).closest('input')) e.preventDefault()
              }}
              style={{ top: position?.top ?? 0, left: position?.left ?? 0 }}
              className={cn(
                'bg-popover text-popover-foreground ring-foreground/10 animate-in fade-in-0 zoom-in-95 absolute z-20 flex h-8 items-center gap-0.5 rounded-lg p-1 shadow-md ring-1 duration-100',
                !position && 'invisible',
              )}
            >
              {asking ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault()
                    ask()
                  }}
                >
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand ml-1 size-3.5 shrink-0" />
                  <input
                    autoFocus
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    aria-label="Tell AI what to do with the selection"
                    placeholder="e.g. make it shorter"
                    className="placeholder:text-muted-foreground h-6 w-40 min-w-0 bg-transparent px-1 text-xs outline-none sm:w-56"
                  />
                  <Button type="submit" size="icon-sm" disabled={!prompt.trim()} aria-label="Send instruction">
                    <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
                  </Button>
                </form>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-brand hover:text-brand" onClick={() => setAsking(true)}>
                    <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} data-icon="inline-start" />
                    Ask AI
                  </Button>
                  <Separator orientation="vertical" className="mx-0.5 h-4 self-center" />
                  <ToolButton icon={MagicWand01Icon} label="Improve" onClick={() => run('improve')} />
                  <ToolButton icon={Scissor01Icon} label="Shorten" onClick={() => run('shorten')} />
                  <ToolButton icon={SmileIcon} label="Make friendlier" onClick={() => run('friendlier')} />
                  <DropdownMenu onOpenChange={(open) => (menuOpen.current = open)}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Translate" className="max-sm:px-1.5">
                        <HugeiconsIcon icon={TranslateIcon} strokeWidth={2} data-icon="inline-start" />
                        <span className="hidden sm:inline">Translate</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40"
                      // After a pick the toolbar is gone, so there is no trigger to return focus to.
                      onCloseAutoFocus={(e) => {
                        if (pickedLanguage.current) e.preventDefault()
                        pickedLanguage.current = false
                      }}
                    >
                      <DropdownMenuLabel>Translate to</DropdownMenuLabel>
                      {LANGS.map((lang) => (
                        <DropdownMenuItem
                          key={lang.id}
                          onSelect={() => {
                            pickedLanguage.current = true
                            run('translate', { lang: lang.id })
                          }}
                        >
                          {lang.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          )}
        </div>

        <Footer>
          {phase.kind === 'idle' && (
            <>
              <p id="ai-inline-hint" className="text-muted-foreground mr-auto text-[11px]">
                Select text for AI actions.
                <span className="hidden sm:inline">
                  {' '}Tab reaches the toolbar, <Shortcut keys={ASK_KEYS} /> asks, <Shortcut keys={['esc']} /> closes.
                </span>
              </p>
              {value !== SAMPLE && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={reset}>
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                  Reset text
                </Button>
              )}
            </>
          )}

          {phase.kind === 'thinking' && (
            <>
              <Thinking label={`${phase.req.label}…`} className="mr-auto min-w-0" />
              <Button variant="ghost" size="sm" onClick={reject}>
                Stop <Shortcut keys={['esc']} className="ml-1 hidden sm:inline-flex" />
              </Button>
            </>
          )}

          {phase.kind === 'suggestion' && (
            <>
              <span className="mr-auto flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <AiLabel />
                <span className="truncate font-medium">{phase.req.label}</span>
                {unchanged && <span className="text-muted-foreground">No changes needed. It already reads well.</span>}
                {!unchanged && phase.req.expanded && (
                  <span className="text-muted-foreground text-[11px]">Widened to whole sentences</span>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {unchanged ? (
                  <Button ref={primaryRef} variant="outline" size="sm" onClick={reject}>Dismiss</Button>
                ) : (
                  <>
                    <Button ref={primaryRef} size="sm" onClick={accept}>
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />
                      Accept
                      <Shortcut
                        keys={['enter']}
                        className="*:bg-primary-foreground/15 *:text-primary-foreground ml-1 hidden sm:inline-flex"
                      />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reject}>
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" />
                      Reject
                      <Shortcut keys={['esc']} className="ml-1 hidden sm:inline-flex" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={retry}>
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                  Try again
                </Button>
              </div>
            </>
          )}

          {phase.kind === 'error' && (
            <>
              <span className="text-destructive mr-auto flex min-w-0 items-start gap-1.5 text-xs">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0" />
                <span>{phase.message}</span>
              </span>
              <div className="flex flex-wrap items-center gap-1">
                <Button ref={primaryRef} variant="outline" size="sm" onClick={reset}>Reset text</Button>
                <Button variant="ghost" size="sm" onClick={reject}>Dismiss</Button>
              </div>
            </>
          )}
        </Footer>
      </div>
    </Panel>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="flex min-h-7 min-w-0 flex-wrap items-center justify-end gap-2">{children}</div>
}

function ToolButton({ icon, label, onClick }: { icon: IconSvgElement; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" aria-label={label} onClick={onClick} className="max-sm:px-1.5">
      <HugeiconsIcon icon={icon} strokeWidth={2} data-icon="inline-start" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
