import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// The account menu: the signed-in person, opening their menu. Two triggers:
//   row     at the foot of a sidebar: avatar, name, a detail line and an
//           up-down chevron, the menu opening upwards
//   avatar  in a header (top right): the avatar alone, the menu opening
//           downwards. The name is not on screen, so the menu starts with it
//           (and the detail) unless you pass `email` or `label`.
// Put the menu's items in `children`: DropdownMenuItems, sub-menus (theme,
// role), separators. The menu starts with a heading when you pass one:
// `email` gives the name and email over a line, `label` a single muted line.
// Row sizes:
//   sm: a 36px row with a small avatar, for a chat history's foot
//   md: a 40px row with a larger avatar, for an app sidebar
// The row fills its parent's width, so put it in a column with a definite
// width. In an app sidebar, pass the sidebar's hover colour in className:
// hover:bg-sidebar-accent aria-expanded:bg-sidebar-accent.

const SIZE = {
  sm: { row: 'h-9', avatar: '', text: 'leading-4' },
  md: { row: 'h-10', avatar: 'size-7', text: 'leading-tight' },
} as const

export function AccountMenu({
  name, detail, email, label, variant = 'row', size = 'sm', side, align, menuClassName, children, className,
}: {
  name: string
  // Under the name, such as the plan or the job title.
  detail?: ReactNode
  // Opens the menu with the name and this email over a line.
  email?: string
  // A one-line muted heading instead, such as the email address alone.
  label?: ReactNode
  variant?: 'row' | 'avatar'
  // The row's height (row only).
  size?: keyof typeof SIZE
  // Defaults: the row opens upwards from its start, the avatar downwards from its end.
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  // On the menu, such as a width: w-60. It is w-56 by default.
  menuClassName?: string
  children?: ReactNode
  // On the trigger.
  className?: string
}) {
  const styles = SIZE[size]
  const avatar = variant === 'avatar'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {avatar ? (
          <button
            type="button"
            aria-label={`Account: ${name}`}
            className={cn(
              'hover:bg-accent focus-visible:ring-ring/30 aria-expanded:bg-accent flex size-8 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2',
              className,
            )}
          >
            <UserAvatar name={name} />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              'hover:bg-accent/60 focus-visible:ring-ring/30 aria-expanded:bg-accent flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 text-left outline-none focus-visible:ring-2',
              styles.row,
              className,
            )}
          >
            <UserAvatar name={name} className={styles.avatar} />
            <span className={cn('grid min-w-0 flex-1', styles.text)}>
              <span className="truncate text-xs font-medium">{name}</span>
              {detail && <span className="text-muted-foreground truncate text-[11px]">{detail}</span>}
            </span>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side ?? (avatar ? 'bottom' : 'top')}
        align={align ?? (avatar ? 'end' : 'start')}
        className={cn('w-56', menuClassName)}
      >
        {email || (avatar && !label) ? (
          <>
            <DropdownMenuLabel className="grid gap-0.5">
              <span className="text-foreground text-xs font-medium">{name}</span>
              {(email ?? detail) && <span className="font-normal">{email ?? detail}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : (
          label && <DropdownMenuLabel>{label}</DropdownMenuLabel>
        )}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
