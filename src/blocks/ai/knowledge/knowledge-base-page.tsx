import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Delete02Icon, Edit02Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatNumber, formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { formatTokens } from '@/lib/token-estimate'
import { KNOWLEDGE_ACCESS, KnowledgeBaseMark } from './knowledge-base-list'
import { indexHealth, indexProgress } from './knowledge-documents'
import type { KnowledgeBase } from './knowledge-types'

// One knowledge base's page: a header with the way back (`start`), its mark,
// name and who can see it, and the app's main action (Add source) in
// `actions`; a summary row (documents, tokens, chunks, sources, last sync);
// an overall indexing bar while anything is queued or processing; then a
// tab strip with the app's tabs (Documents, Sources, Test retrieval,
// Settings…). The tabs scroll sideways within their row on a narrow width,
// as on the project page. The menu renames (in place) and deletes.

export type KnowledgeBaseTab = {
  id: string
  label: string
  icon?: IconSvgElement
  // Shown after the label.
  count?: number
  content: ReactNode
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-muted-foreground truncate text-[11px]">{label}</dt>
      <dd className="truncate text-[13px] font-medium tabular-nums">{children}</dd>
    </div>
  )
}

export function KnowledgeBasePage({
  base, tabs, tab, onTabChange, start, onRename, onDelete, actions, now, className,
}: {
  base: KnowledgeBase
  tabs: KnowledgeBaseTab[]
  // The open tab, and each switch. Left out: the page keeps its own, first tab first.
  tab?: string
  onTabChange?: (id: string) => void
  // Shown at the start of the header, such as a back button to the library.
  start?: ReactNode
  // Left out: no Rename.
  onRename?: (name: string) => void
  // Called once the person has confirmed. Left out: no Delete.
  onDelete?: () => void
  // At the end of the header, such as the Add source button.
  actions?: ReactNode
  // The clock the last sync is relative to (a demo clock). Now when left out.
  now?: number | (() => number)
  className?: string
}) {
  const [ownTab, setOwnTab] = useState(tabs[0]?.id ?? '')
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(base.name)
  const [confirm, setConfirm] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)
  const startRename = useRef(false)
  const time = typeof now === 'function' ? now() : now ?? Date.now()

  const openTab = tab ?? (tabs.some((t) => t.id === ownTab) ? ownTab : tabs[0]?.id ?? '')
  const changeTab = (id: string) => {
    setOwnTab(id)
    onTabChange?.(id)
  }

  const health = indexHealth(base.documents)
  const progress = indexProgress(base.documents)
  const access = KNOWLEDGE_ACCESS[base.access]
  const synced = base.sources.filter((s) => s.sync)
  const syncing = synced.some((s) => s.sync?.status === 'syncing')
  const lastSync = synced.reduce<number | undefined>((last, s) => {
    const t = s.sync?.lastSyncedAt
    return t !== undefined && (last === undefined || t > last) ? t : last
  }, undefined)

  const commit = () => {
    const name = draft.trim()
    setRenaming(false)
    if (name && name !== base.name) onRename?.(name)
    setTimeout(() => menuRef.current?.focus())
  }

  return (
    <div className={cn('@container flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <header className="flex h-11 shrink-0 items-center gap-1.5 border-b px-2">
        {start}
        <KnowledgeBaseMark base={base} size="sm" className="ml-1" />
        {renaming ? (
          <input
            aria-label="Knowledge base name"
            autoFocus
            value={draft}
            maxLength={80}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                e.stopPropagation()
                setDraft(base.name)
                setRenaming(false)
                setTimeout(() => menuRef.current?.focus())
              }
            }}
            className="focus-visible:ring-ring/50 h-7 min-w-0 flex-1 rounded-md border bg-transparent px-1.5 text-xs font-medium outline-none focus-visible:ring-2"
          />
        ) : (
          <h2 className="min-w-0 flex-1 truncate px-0.5 text-xs font-medium">{base.name}</h2>
        )}
        <StatusBadge dot={false} className="hidden gap-1 @md:inline-flex">
          <HugeiconsIcon icon={access.icon} strokeWidth={2} aria-hidden="true" className="size-3" />
          {access.label}
        </StatusBadge>
        {actions}
        {(onRename || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={menuRef} variant="ghost" size="icon-sm" aria-label="Knowledge base options" className="text-muted-foreground">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              onCloseAutoFocus={(e) => {
                if (!startRename.current) return
                startRename.current = false
                e.preventDefault()
                setDraft(base.name)
                setRenaming(true)
              }}
            >
              {onRename && (
                <DropdownMenuItem onSelect={() => { startRename.current = true }}>
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} /> Rename
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  {onRename && <DropdownMenuSeparator />}
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete knowledge base
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div className="grid shrink-0 gap-3 border-b px-4 py-3">
        {base.description && <p className="text-muted-foreground line-clamp-2 text-xs">{base.description}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 @md:grid-cols-3 @2xl:grid-cols-5">
          <Stat label="Documents">{formatNumber(health.total)}</Stat>
          <Stat label="Tokens">{formatTokens(health.tokens)}</Stat>
          <Stat label="Chunks">{formatNumber(health.chunks)}</Stat>
          <Stat label="Sources">{base.sources.length}</Stat>
          <Stat label="Last sync">
            {syncing
              ? <span className="text-status-progress">Syncing…</span>
              : lastSync !== undefined
                ? formatRelativeDate(lastSync, { now: time, time: true })
                : <span className="text-muted-foreground font-normal">{synced.length ? 'Not yet' : 'No synced sources'}</span>}
          </Stat>
        </dl>
        {progress !== undefined && (
          <div className="grid gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px]">
              <span className="text-status-progress inline-flex min-w-0 items-center gap-1.5">
                <Spinner className="size-3" aria-hidden="true" />
                Indexing {plural(health.processing, 'document')}
              </span>
              <span className="text-muted-foreground tabular-nums">{progress}%</span>
            </div>
            <Progress
              value={progress}
              aria-label="Indexing progress"
              className="[&>[data-slot=progress-indicator]]:bg-status-progress"
            />
          </div>
        )}
      </div>

      <Tabs value={openTab} onValueChange={changeTab} className="min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none]">
          <TabsList variant="line" aria-label={base.name} className="w-max justify-start gap-0.5 p-0 px-2 group-data-horizontal/tabs:h-10">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="h-full flex-none px-2 group-data-horizontal/tabs:after:bottom-0">
                {t.icon && <HugeiconsIcon icon={t.icon} strokeWidth={2} />}
                {t.label}
                {t.count !== undefined && (
                  <span className="text-muted-foreground text-[11px] font-normal tabular-nums">{t.count}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className="min-h-0 overflow-y-auto text-[13px]">
            <div className="mx-auto w-full max-w-5xl min-w-0 px-4 py-5">{t.content}</div>
          </TabsContent>
        ))}
      </Tabs>

      {onDelete && (
        <DeleteConfirm
          open={confirm}
          onOpenChange={setConfirm}
          icon={null}
          title={`Delete “${base.name}”?`}
          description={
            `Its ${plural(health.total, 'document')} and their index are deleted. ` +
            (base.linkedProjects.length
              ? `${plural(base.linkedProjects.length, 'project')} that search it lose it.`
              : 'No project searches it.')
          }
          returnFocusRef={menuRef}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}
