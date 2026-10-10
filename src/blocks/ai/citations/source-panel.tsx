import { useEffect, useId, useRef, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, Cancel01Icon, FileViewIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { IconAction } from '@/components/icon-action'
import { SourceMark, citationMeta, isDocumentCitation, type Citation } from '@/blocks/markdown'
import type { KnowledgeCitation } from '@/blocks/ai/knowledge/knowledge-types'

// The source panel: every source a reply cites, numbered like its citations.
// Clicking "[2]" in a reply, or its source card, opens the panel at that
// source and shows the passage the reply used: the exact text of a project
// file or a knowledge base's document (with its page), or a web page's
// snippet. "Open document" or "Open link" goes to the whole thing.
//
// The list is one tab stop: the arrow keys (and Home, End) move between
// sources, and the one in focus is the one shown. SourcePanel fills whatever
// it is put in (a column beside the chat); SourceSheet puts it in a sheet from
// the right, for narrow screens or when there is no room for a column.

// A knowledge citation (knowledge-types.ts) as a citation the Markdown block,
// SourcesRow and this panel understand.
export function toCitation(citation: KnowledgeCitation): Citation {
  return {
    kind: 'document',
    title: citation.documentName,
    url: '',
    domain: citation.from.name,
    from: citation.from.name,
    page: citation.page,
    passage: citation.passage,
    documentKind: citation.documentKind,
  }
}

export function SourcePanel({ sources, active, onActiveChange, onClose, onOpenDocument, title = 'Sources', className }: {
  sources: Citation[]
  // The source shown, by its index ("[2]" is 1). None is open when left out.
  active?: number
  onActiveChange: (index: number) => void
  onClose: () => void
  // "Open document" for a document source; it shows only when given.
  onOpenDocument?: (index: number) => void
  title?: string
  className?: string
}) {
  const id = useId()
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const focusable = active !== undefined && active < sources.length ? active : 0

  useEffect(() => {
    if (active !== undefined) items.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = sources.length - 1
    const next = e.key === 'ArrowDown' ? Math.min(last, index + 1)
      : e.key === 'ArrowUp' ? Math.max(0, index - 1)
        : e.key === 'Home' ? 0
          : e.key === 'End' ? last : null
    if (next === null) return
    e.preventDefault()
    onActiveChange(next)
    items.current[next]?.focus()
  }

  return (
    <section aria-labelledby={`${id}-title`} className={cn('bg-card flex h-full min-h-0 min-w-0 flex-col', className)}>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b pr-1.5 pl-3.5">
        <h2 id={`${id}-title`} className="min-w-0 truncate text-xs font-medium">
          {title} <span className="text-muted-foreground font-normal tabular-nums">· {sources.length}</span>
        </h2>
        <IconAction label="Close sources" icon={Cancel01Icon} className="ml-auto" onClick={onClose} />
      </header>
      {sources.length === 0 ? (
        <p className="text-muted-foreground p-3.5 text-xs">This reply cites no sources.</p>
      ) : (
        <ol className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto p-1.5">
          {sources.map((source, i) => {
            const open = active === i
            const document = isDocumentCitation(source)
            const passage = source.passage ?? source.snippet
            return (
              <li key={`${i}-${source.url || source.title}`} className={cn('min-w-0 rounded-lg', open && 'bg-muted/50')}>
                <button
                  ref={(node) => { items.current[i] = node }}
                  type="button"
                  aria-expanded={open}
                  aria-controls={open ? `${id}-${i}` : undefined}
                  tabIndex={i === focusable ? 0 : -1}
                  onClick={() => onActiveChange(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className="hover:bg-accent/60 focus-visible:ring-ring/30 flex w-full min-w-0 items-start gap-2.5 rounded-lg p-2 text-left outline-none focus-visible:ring-2"
                >
                  <span className={cn(
                    'mt-px inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 text-[10px] leading-none font-medium tabular-nums',
                    open ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {i + 1}
                  </span>
                  <SourceMark source={source} className="mt-px" />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className={cn('text-xs font-medium', open ? 'break-words' : 'truncate')}>{source.title}</span>
                    <span className="text-muted-foreground truncate text-[11px]">{citationMeta(source)}</span>
                  </span>
                </button>
                {open && (
                  <div id={`${id}-${i}`} className="grid min-w-0 gap-2.5 px-2 pb-2.5 pl-8">
                    {passage ? (
                      <figure className="grid min-w-0 gap-1.5">
                        <figcaption className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                          {document ? (source.page !== undefined ? `Passage · page ${source.page}` : 'Passage') : 'Snippet'}
                        </figcaption>
                        <blockquote className="bg-subtle border-l-brand/60 min-w-0 rounded-md border border-l-2 px-3 py-2.5 text-xs/relaxed break-words">
                          {passage}
                        </blockquote>
                      </figure>
                    ) : (
                      <p className="text-muted-foreground text-xs">No passage was kept for this source.</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {document ? (
                        onOpenDocument && (
                          <Button variant="outline" size="sm" onClick={() => onOpenDocument(i)}>
                            <HugeiconsIcon icon={FileViewIcon} strokeWidth={2} data-icon="inline-start" />
                            Open document
                          </Button>
                        )
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <a href={source.url} target="_blank" rel="noreferrer noopener">
                            Open link
                            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

// The source panel in a sheet from the right: nearly full width on a phone, a
// column from sm up. It opens with the focus on the source shown.
export function SourceSheet({
  open, onOpenChange, sources, active, onActiveChange, onOpenDocument, title = 'Sources',
  description = 'The passages and pages this reply cites.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sources: Citation[]
  active?: number
  onActiveChange: (index: number) => void
  onOpenDocument?: (index: number) => void
  title?: string
  description?: string
}) {
  const content = useRef<HTMLDivElement>(null)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={content}
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-[calc(100%-2.5rem)] data-[side=right]:sm:max-w-sm"
        onOpenAutoFocus={(e) => {
          const item = content.current?.querySelector<HTMLElement>('[aria-expanded="true"]')
          if (!item) return
          e.preventDefault()
          item.focus()
        }}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">{description}</SheetDescription>
        <SourcePanel
          sources={sources}
          active={active}
          onActiveChange={onActiveChange}
          onClose={() => onOpenChange(false)}
          onOpenDocument={onOpenDocument}
          title={title}
          className="bg-popover"
        />
      </SheetContent>
    </Sheet>
  )
}
