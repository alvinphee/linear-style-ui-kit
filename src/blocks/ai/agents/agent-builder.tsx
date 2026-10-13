import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, EyeIcon, Settings02Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AgentDraft } from './agent-types'

// The agent builder: the page where an agent is made or changed, laid out as
// ChatGPT's GPT builder is. A header (your `start` slot, such as a back
// button; the agent's mark and name; an "Unsaved changes" note; Cancel and
// Save), then two ways to fill it in: Create, a chat with a builder that asks
// and fills the agent in for you, and Configure, the same thing as a form.
// Beside them, a live Preview to try the agent before saving it.
//
// On a wide box (64rem and up) Create | Configure sit on the left and the
// Preview on the right; narrower, the three are tabs. The slots are yours:
// pass BuilderChat, a configuration form and AgentPreview. Ctrl/⌘ S saves
// while focus is inside. Leaving with unsaved changes is the app's to guard
// (onCancel); useUnsavedPrompt adds the browser's own warning on reload.

export type AgentBuilderTab = 'create' | 'configure' | 'preview'

// The width, in pixels, at which the Preview moves beside the tabs (64rem).
const WIDE = 1024

// Warns before the page is reloaded or closed while `dirty`.
export function useUnsavedPrompt(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Older browsers show the prompt only when returnValue is set.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}

// True while the element is at least `min` pixels wide.
function useWiderThan(min: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWide(el.getBoundingClientRect().width >= min)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [min])
  return [ref, wide] as const
}

export function AgentBuilder({
  draft, mode, create, configure, preview, tab: tabProp, onTabChange, start, onSave, onCancel,
  saving = false, dirty = false, canSave = true, saveLabel, className,
}: {
  draft: AgentDraft
  // create: a new agent ("New agent", Create). edit: an existing one (Save).
  mode: 'create' | 'edit'
  // The Create tab: a BuilderChat.
  create: ReactNode
  // The Configure tab: the agent as a form.
  configure: ReactNode
  // The Preview: an AgentPreview.
  preview: ReactNode
  // The open tab is yours when you pass it. Create for a new agent and
  // Configure for an existing one when left out.
  tab?: AgentBuilderTab
  onTabChange?: (tab: AgentBuilderTab) => void
  // Before the mark in the header: a back button, a sidebar toggle.
  start?: ReactNode
  onSave: () => void
  onCancel: () => void
  saving?: boolean
  // Shows "Unsaved changes".
  dirty?: boolean
  // False keeps Save off, such as while the agent has no name.
  canSave?: boolean
  // Defaults to Create for a new agent and Save for an existing one.
  saveLabel?: string
  className?: string
}) {
  const [ownTab, setOwnTab] = useState<AgentBuilderTab>(mode === 'create' ? 'create' : 'configure')
  const tab = tabProp ?? ownTab
  // The tab on the left, kept for when the box widens while Preview is open.
  const [left, setLeft] = useState<'create' | 'configure'>(tab === 'configure' ? 'configure' : 'create')
  const [boxRef, wide] = useWiderThan(WIDE)

  useEffect(() => {
    if (tab !== 'preview') setLeft(tab)
  }, [tab])

  const shown = wide && tab === 'preview' ? left : tab

  function change(next: string) {
    const value = next as AgentBuilderTab
    if (tabProp === undefined) setOwnTab(value)
    onTabChange?.(value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key.toLowerCase() !== 's' || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
    e.preventDefault()
    if (canSave && !saving) onSave()
  }

  const name = draft.name.trim()
  const label = saveLabel ?? (mode === 'create' ? 'Create' : 'Save')

  return (
    <div ref={boxRef} onKeyDown={onKeyDown} className={cn('bg-background flex h-full min-h-0 min-w-0 flex-col', className)}>
      <header className="flex min-h-12 shrink-0 items-center gap-2 border-b px-3 py-2">
        {start}
        <IconMark icon={draft.icon ?? SparklesIcon} colour={draft.colour ?? 'var(--brand)'} size="sm" />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h2 className={cn('min-w-0 truncate text-[13px] font-medium', !name && 'text-muted-foreground')}>
            {name || 'New agent'}
          </h2>
          {dirty ? (
            <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-[11px]" role="status">
              <span className="bg-status-progress size-1.5 rounded-full" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Unsaved changes</span>
            </span>
          ) : (
            <span className="text-muted-foreground hidden shrink-0 text-[11px] sm:inline">
              {mode === 'create' ? 'Draft' : 'All changes saved'}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button size="sm" onClick={onSave} disabled={!canSave || saving} aria-keyshortcuts="Control+S Meta+S">
          {saving && <Spinner data-icon="inline-start" aria-hidden="true" />}
          {saving ? (mode === 'create' ? 'Creating…' : 'Saving…') : label}
        </Button>
      </header>

      <Tabs value={shown} onValueChange={change} className="min-h-0 flex-1 gap-0">
        <div className={cn('grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)]', wide ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]')}>
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="flex shrink-0 justify-center border-b px-3 py-2">
              <TabsList aria-label="Agent builder" className="w-full max-w-sm">
                <TabsTrigger value="create">
                  <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2} data-icon="inline-start" />
                  Create
                </TabsTrigger>
                <TabsTrigger value="configure">
                  <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} data-icon="inline-start" />
                  Configure
                </TabsTrigger>
                {!wide && (
                  <TabsTrigger value="preview">
                    <HugeiconsIcon icon={EyeIcon} strokeWidth={2} data-icon="inline-start" />
                    Preview
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            {/* Kept mounted while hidden, so a half-written message or a scroll position survives a tab switch. */}
            <TabsContent value="create" forceMount className="flex min-h-0 flex-col text-[13px] data-[state=inactive]:hidden">
              {create}
            </TabsContent>
            <TabsContent value="configure" forceMount className="min-h-0 overflow-y-auto text-[13px] data-[state=inactive]:hidden">
              {configure}
            </TabsContent>
            {!wide && (
              <TabsContent value="preview" forceMount className="flex min-h-0 flex-col text-[13px] data-[state=inactive]:hidden">
                {preview}
              </TabsContent>
            )}
          </div>
          {wide && (
            <section aria-label="Preview" className="bg-subtle/40 flex min-h-0 min-w-0 flex-col border-l text-[13px]">
              {preview}
            </section>
          )}
        </div>
      </Tabs>
    </div>
  )
}
