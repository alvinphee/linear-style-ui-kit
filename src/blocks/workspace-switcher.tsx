import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { LetterMark } from '@/components/mark'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// The workspace switcher at the top of a sidebar: the current workspace (or
// company, in a multi-company app) as a letter mark and its name, opening a
// menu of them all with a tick on the current one. Extra items, such as
// "Create workspace" or "All companies", go in `children`, under a line.
// `onSelect` runs when a different one is picked.
//   default: mark, name and an up-down chevron; with `detail`, a larger mark
//            and a second line under the name (the plan, your role)
//   compact: the name, `detail` as a small badge and a chevron, for a top bar
//   icon:    the mark alone, with the name in a tooltip, for a rail or a
//            sidebar folded to icons
// The default trigger fills its parent's width.

export type WorkspaceOption = {
  id: string
  name: string
  // The mark's letters, such as "AT". The name's first letter if left out.
  short?: string
  // The mark's colour: a CSS colour or token, such as var(--primary).
  colour: string
}

const PRIMARY = 'var(--primary)'

// The mark's letters and colour; on the primary colour the letters use its
// foreground, so they stay readable with black and white buttons.
function Mark({ workspace, size = 'sm', className }: {
  workspace: WorkspaceOption
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  return (
    <LetterMark
      text={workspace.short ?? workspace.name.slice(0, 1).toUpperCase()}
      colour={workspace.colour}
      size={size}
      className={cn(workspace.colour === PRIMARY && 'text-primary-foreground', className)}
    />
  )
}

const ROW = 'hover:bg-sidebar-accent focus-visible:ring-ring/40 aria-expanded:bg-sidebar-accent outline-none focus-visible:ring-2'

export function WorkspaceSwitcher({
  workspaces, currentId, onSelect, detail, label = 'Workspaces', variant = 'default', side = 'bottom',
  badgeClassName, menuClassName, children, className,
}: {
  workspaces: readonly WorkspaceOption[]
  currentId: string
  onSelect: (id: string) => void
  // Under the name (default) or as a badge beside it (compact): the plan, or
  // your role and the company's country.
  detail?: ReactNode
  // The menu's heading, and the icon trigger's name: "Companies".
  label?: string
  variant?: 'default' | 'compact' | 'icon'
  side?: 'top' | 'right' | 'bottom' | 'left'
  // On the compact trigger's badge, such as `hidden @md:inline` to show it
  // only when there is room.
  badgeClassName?: string
  // On the menu, such as a width: w-64. It is w-56 by default.
  menuClassName?: string
  // Extra menu items, shown under a line after the list.
  children?: ReactNode
  // On the trigger.
  className?: string
}) {
  const current = workspaces.find((w) => w.id === currentId)
  if (!current) return null

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        aria-label={`${label}: ${current.name}`}
        className={cn(ROW, 'grid size-8 shrink-0 place-items-center rounded-md', className)}
      >
        <Mark workspace={current} size="xs" className="size-6 text-[10px]" />
      </button>
    ) : variant === 'compact' ? (
      <button
        type="button"
        className={cn(
          'hover:bg-accent focus-visible:ring-ring/40 aria-expanded:bg-accent flex h-7 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs font-medium outline-none focus-visible:ring-2',
          className,
        )}
      >
        <span className="truncate">{current.name}</span>
        {detail && (
          <span className={cn('text-muted-foreground rounded border px-1 text-[10px] font-normal', badgeClassName)}>{detail}</span>
        )}
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3 shrink-0" />
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          ROW,
          'flex w-full min-w-0 items-center gap-2 rounded-md text-left',
          detail ? 'p-1.5' : 'h-8 px-1.5',
          className,
        )}
      >
        <Mark workspace={current} size={detail ? 'md' : 'sm'} />
        {detail ? (
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="text-foreground truncate text-[13px] font-medium">{current.name}</span>
            <span className="text-muted-foreground truncate text-[11px]">{detail}</span>
          </span>
        ) : (
          <span className="text-foreground truncate text-[13px] font-medium">{current.name}</span>
        )}
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground ml-auto size-3.5 shrink-0" />
      </button>
    )

  return (
    <DropdownMenu>
      {variant === 'icon' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{current.name}</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side={side} align="start" className={cn('w-56', menuClassName)}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} onSelect={() => w.id !== current.id && onSelect(w.id)}>
            <Mark workspace={w} />
            <span className="flex-1 truncate">{w.name}</span>
            {w.id === current.id && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />}
          </DropdownMenuItem>
        ))}
        {children && (
          <>
            <DropdownMenuSeparator />
            {children}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
