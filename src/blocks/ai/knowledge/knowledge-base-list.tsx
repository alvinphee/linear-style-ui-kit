import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, Alert02Icon, Book02Icon, Building06Icon, CheckmarkCircle02Icon, Folder01Icon, GridViewIcon,
  LeftToRightListBulletIcon, SquareLock02Icon, UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark } from '@/components/mark'
import { SearchField } from '@/components/search-field'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { formatTokens } from '@/lib/token-estimate'
import { indexHealth } from './knowledge-documents'
import { sourceIcon } from './knowledge-sources'
import type { KnowledgeAccess, KnowledgeBase } from './knowledge-types'

// The library of knowledge bases: the large, shared collections the
// assistant searches (RAG), such as HR policies or a product's docs. A
// search, then a card per knowledge base with its icon in its colour, name,
// description, size in documents and tokens, how indexing stands (all
// indexed, N processing, N failed), where its documents come from, how many
// projects search it, who can see it and when it last changed. A compact
// list view packs one per row. Cards fall to one column on a narrow width.

export type KnowledgeBaseListView = 'grid' | 'list'

const VIEWS: ViewOption<KnowledgeBaseListView>[] = [
  { value: 'grid', label: 'Grid', icon: GridViewIcon },
  { value: 'list', label: 'List', icon: LeftToRightListBulletIcon },
]

export const KNOWLEDGE_ACCESS: Record<KnowledgeAccess, { label: string; description: string; icon: IconSvgElement }> = {
  private: { label: 'Only you', description: 'Only you can see and search it.', icon: SquareLock02Icon },
  people: { label: 'Shared', description: 'The people it is shared with can search it.', icon: UserMultipleIcon },
  organisation: { label: 'Organisation', description: 'Everyone in the organisation can search it.', icon: Building06Icon },
}

// The knowledge base's mark: its icon on a tint of its colour.
export function KnowledgeBaseMark({ base, size = 'md', className }: {
  base: Pick<KnowledgeBase, 'icon' | 'colour'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return <IconMark icon={base.icon ?? Book02Icon} colour={base.colour ?? 'var(--brand)'} size={size} className={className} />
}

// How indexing stands, in a few words with a tone: "All indexed",
// "3 processing", "1 failed". Failures win over processing.
export function IndexHealthLine({ documents, className }: {
  documents: KnowledgeBase['documents']
  className?: string
}) {
  const h = indexHealth(documents)
  if (!h.total) return <span className={cn('text-muted-foreground text-[11px]', className)}>No documents yet</span>
  return (
    <span className={cn('flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px]', className)}>
      {h.failed > 0 && (
        <span className="text-destructive inline-flex items-center gap-1">
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 shrink-0" />
          {h.failed} failed
        </span>
      )}
      {h.processing > 0 && (
        <span className="text-status-progress inline-flex items-center gap-1">
          <Spinner className="size-3" aria-hidden="true" />
          {h.processing} processing
        </span>
      )}
      {!h.failed && !h.processing && (
        <span className="text-status-done inline-flex items-center gap-1">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-3 shrink-0" />
          All indexed
        </span>
      )}
    </span>
  )
}

// "48 documents · 1.2M tokens".
export const knowledgeBaseSize = (base: Pick<KnowledgeBase, 'documents'>) => {
  const h = indexHealth(base.documents)
  return `${plural(h.total, 'document')} · ${formatTokens(h.tokens)} tokens`
}

// The icons of a knowledge base's sources, one per kind, for a card's foot.
function SourceIcons({ base }: { base: KnowledgeBase }) {
  const seen = new Set<IconSvgElement>()
  const icons = base.sources.map(sourceIcon).filter((icon) => !seen.has(icon) && !!seen.add(icon))
  if (!icons.length) return null
  const kinds = base.sources.map((s) => s.name).join(', ')
  return (
    <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1" title={kinds}>
      <span className="sr-only">Sources: {kinds}</span>
      {icons.slice(0, 4).map((icon, i) => (
        <HugeiconsIcon key={i} icon={icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
      ))}
    </span>
  )
}

function AccessIcon({ access, className }: { access: KnowledgeAccess; className?: string }) {
  const meta = KNOWLEDGE_ACCESS[access]
  return (
    <span className={cn('text-muted-foreground inline-flex shrink-0', className)} title={meta.label}>
      <HugeiconsIcon icon={meta.icon} strokeWidth={2} aria-hidden="true" className="size-3.5" />
      <span className="sr-only">{meta.label}</span>
    </span>
  )
}

export function KnowledgeBaseList({
  bases, onOpen, onCreate, view, onViewChange, now, title = 'Knowledge bases', className,
}: {
  bases: KnowledgeBase[]
  onOpen: (id: string) => void
  // Left out: no Create button.
  onCreate?: () => void
  // Grid of cards or a compact list, and each switch. Left out: the list keeps its own, grid first.
  view?: KnowledgeBaseListView
  onViewChange?: (view: KnowledgeBaseListView) => void
  // The clock the update times are relative to (a demo clock). Now when left out.
  now?: number | (() => number)
  title?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [ownView, setOwnView] = useState<KnowledgeBaseListView>('grid')
  const shownView = view ?? ownView
  const time = typeof now === 'function' ? now() : now ?? Date.now()
  const changeView = (v: KnowledgeBaseListView) => {
    setOwnView(v)
    onViewChange?.(v)
  }

  const q = query.trim().toLowerCase()
  const sorted = [...bases].sort((a, b) => b.updatedAt - a.updatedAt)
  const shown = q
    ? sorted.filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
    : sorted

  const createButton = (label: string, variant: 'default' | 'outline' = 'default') => onCreate && (
    <Button size="sm" variant={variant} onClick={onCreate}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
      {label}
    </Button>
  )

  if (!bases.length) {
    return (
      <Empty className={cn('gap-2 rounded-lg border px-4 py-10', className)}>
        <EmptyMedia variant="icon"><HugeiconsIcon icon={Book02Icon} strokeWidth={2} /></EmptyMedia>
        <EmptyTitle>No knowledge bases yet</EmptyTitle>
        <EmptyDescription>
          A knowledge base is a library the assistant searches: policies, product docs, a support wiki. Add files,
          a website or a folder from a connected app, and any project can use it.
        </EmptyDescription>
        {onCreate && <EmptyContent>{createButton('Create a knowledge base')}</EmptyContent>}
      </Empty>
    )
  }

  return (
    <section aria-label={title} className={cn('@container grid min-w-0 gap-3', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search knowledge bases"
          className="h-7 min-w-0 flex-1 basis-44 @2xl:max-w-80"
        />
        <ViewSwitch views={VIEWS} value={shownView} onChange={changeView} label="Layout" />
        {onCreate && <span className="ml-auto">{createButton('New knowledge base')}</span>}
      </div>

      {!shown.length ? (
        <Empty className="gap-2 rounded-lg border px-3 py-8">
          <EmptyDescription>No knowledge bases match “{query.trim()}”.</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => setQuery('')}>Clear search</Button>
          </EmptyContent>
        </Empty>
      ) : shownView === 'grid' ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2 @xl:grid-cols-2 @4xl:grid-cols-3">
          {shown.map((base) => (
            <li key={base.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onOpen(base.id)}
                className="bg-card hover:bg-accent/40 focus-visible:ring-ring/50 grid h-full w-full min-w-0 content-start gap-2.5 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <KnowledgeBaseMark base={base} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-[13px] font-medium">{base.name}</span>
                    <span className="text-muted-foreground truncate text-[11px] tabular-nums">{knowledgeBaseSize(base)}</span>
                  </span>
                  <AccessIcon access={base.access} />
                </span>
                <span className="text-muted-foreground line-clamp-2 min-h-8 text-xs leading-snug">{base.description}</span>
                <IndexHealthLine documents={base.documents} />
                <span className="text-muted-foreground flex min-w-0 items-center gap-3 border-t pt-2 text-[11px]">
                  <SourceIcons base={base} />
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate tabular-nums">{plural(base.linkedProjects.length, 'project')}</span>
                  </span>
                  <span className="ml-auto shrink-0">{formatRelativeDate(base.updatedAt, { now: time })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y rounded-lg border">
          {shown.map((base) => (
            <li key={base.id}>
              <button
                type="button"
                onClick={() => onOpen(base.id)}
                className="hover:bg-accent/40 focus-visible:bg-accent flex w-full min-w-0 items-center gap-3 px-3 py-2 text-left outline-none first:rounded-t-lg last:rounded-b-lg"
              >
                <KnowledgeBaseMark base={base} size="sm" />
                <span className="grid min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-medium">{base.name}</span>
                    <AccessIcon access={base.access} />
                  </span>
                  <span className="text-muted-foreground truncate text-[11px] @2xl:hidden">{knowledgeBaseSize(base)}</span>
                  <span className="text-muted-foreground hidden truncate text-[11px] @2xl:block">{base.description}</span>
                </span>
                <span className="text-muted-foreground hidden w-40 shrink-0 text-[11px] tabular-nums @2xl:block">{knowledgeBaseSize(base)}</span>
                <IndexHealthLine documents={base.documents} className="hidden w-28 shrink-0 @lg:flex" />
                <span className="text-muted-foreground w-14 shrink-0 text-right text-[11px]">{formatRelativeDate(base.updatedAt, { now: time })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
