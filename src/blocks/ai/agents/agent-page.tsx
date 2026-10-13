import { useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Building06Icon, BubbleChatIcon, Copy01Icon, Delete02Icon, Link01Icon, LockIcon, MoreHorizontalIcon, PencilEdit02Icon,
  PlayIcon, UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgentMark, AgentStatusLine, type AgentStatus } from './agent-card'
import type { Agent, AgentAccess } from './agent-types'

// One agent's page, the way a project opens: a header with its mark, name,
// who owns it and who can use it, then Chat (the main action), Run now and
// Edit, and a menu (Duplicate, Share, Delete). Under it, a tab strip with
// the app's tabs (Overview, Runs, Configure…); the strip scrolls sideways
// when it does not fit. The app keeps the agent; the page reports each
// action.
//
// An agent shared with you is read only: no Edit or Delete, and Duplicate
// to edit in their place, which makes a copy of your own.

export type AgentPageTab = {
  id: string
  label: string
  icon?: IconSvgElement
  count?: number
  content: ReactNode
}

export const ACCESS_LABELS: Record<AgentAccess, { label: string; icon: IconSvgElement }> = {
  private: { label: 'Only you', icon: LockIcon },
  people: { label: 'Shared with people', icon: UserMultipleIcon },
  organisation: { label: 'Everyone in your organisation', icon: Building06Icon },
  link: { label: 'Anyone with the link', icon: Link01Icon },
}

export type AgentPageProps = {
  agent: Agent
  tabs: AgentPageTab[]
  // The open tab, and each switch.
  tab: string
  onTabChange: (id: string) => void
  // Shown at the start of the header, such as a sidebar toggle or Back.
  start?: ReactNode
  // Shown under the name in place of who can use it. Idle shows the access.
  status?: AgentStatus
  onChat: () => void
  // Left out: no Run now.
  onRun?: () => void
  onEdit: () => void
  // Read only, this is the Duplicate to edit button; else a menu item.
  onDuplicate?: () => void
  onShare?: () => void
  // Called once the person has confirmed. Left out: no Delete.
  onDelete?: () => void
  // Who made it: "Sam Lee". The agent's owner when left out.
  owner?: string
  // Replaces the access line, such as a ShareSummary of who can use it.
  access?: ReactNode
  // An agent shared with you: no Edit or Delete.
  readOnly?: boolean
  className?: string
}

export function AgentPage({
  agent, tabs, tab, onTabChange, start, status = 'idle', onChat, onRun, onEdit, onDuplicate, onShare, onDelete, owner,
  access, readOnly = false, className,
}: AgentPageProps) {
  const [confirm, setConfirm] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const who = owner ?? agent.owner
  const shared = ACCESS_LABELS[agent.access]
  const canDelete = !readOnly && !!onDelete
  const hasMenu = (!readOnly && !!onDuplicate) || !!onShare || canDelete

  return (
    <div className={cn('@container flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <header className="flex min-h-12 shrink-0 items-center gap-1 border-b px-2 py-1.5">
        {start}
        <AgentMark agent={agent} size="sm" className="ml-1" />
        <div className="grid min-w-0 flex-1 px-1.5">
          <h2 className="truncate text-xs font-medium">{agent.name}</h2>
          {status !== 'idle' ? (
            <AgentStatusLine status={status} />
          ) : (
            <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]">
              <span className="shrink-0 truncate">{readOnly ? `by ${who}` : who}</span>
              <span aria-hidden>·</span>
              {access ?? (
                <span className="flex min-w-0 items-center gap-1">
                  <HugeiconsIcon icon={shared.icon} strokeWidth={2} className="size-3 shrink-0" />
                  <span className="truncate">{shared.label}</span>
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onRun && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRun}
              disabled={status === 'running'}
              className="text-muted-foreground"
            >
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} data-icon="inline-start" />
              <span className="sr-only @lg:not-sr-only">Run now</span>
            </Button>
          )}
          {readOnly ? (
            onDuplicate && (
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                <span className="sr-only @lg:not-sr-only">Duplicate to edit</span>
              </Button>
            )
          ) : (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="sr-only @md:not-sr-only">Edit</span>
            </Button>
          )}
          <Button size="sm" onClick={onChat}>
            <HugeiconsIcon icon={BubbleChatIcon} strokeWidth={2} data-icon="inline-start" />
            Chat
          </Button>
          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button ref={menuButton} variant="ghost" size="icon-sm" aria-label="Agent options" className="text-muted-foreground">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {!readOnly && onDuplicate && (
                  <DropdownMenuItem onSelect={onDuplicate}>
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} /> Duplicate
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onSelect={onShare}>
                    <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} /> Share
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {((!readOnly && onDuplicate) || onShare) && <DropdownMenuSeparator />}
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Delete agent
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <Tabs value={tab} onValueChange={onTabChange} className="min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none]">
          <TabsList variant="line" aria-label="Agent" className="w-max justify-start gap-0.5 p-0 px-2 group-data-horizontal/tabs:h-10">
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
            <div className="mx-auto w-full max-w-4xl min-w-0 px-4 py-6">{t.content}</div>
          </TabsContent>
        ))}
      </Tabs>

      {canDelete && (
        <DeleteConfirm
          open={confirm}
          onOpenChange={setConfirm}
          icon={null}
          returnFocusRef={menuButton}
          title={`Delete “${agent.name}”?`}
          description="Its instructions, files and triggers are removed, and it stops running. Chats you had with it stay in your history."
          confirmLabel="Delete agent"
          onConfirm={() => onDelete?.()}
        />
      )}
    </div>
  )
}
