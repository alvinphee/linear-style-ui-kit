import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { UnfoldMoreIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// The account menu: the signed-in person at the foot of a sidebar (avatar,
// name, a detail line and an up-down chevron) opening a menu, upwards by
// default. Put the menu's items in `children`: DropdownMenuItems, sub-menus
// (theme, role), separators. The menu starts with a heading when you pass
// one: `email` gives the name and email over a line, `label` a single muted
// line.
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
  name, detail, email, label, size = 'sm', side = 'top', align = 'start', menuClassName, children, className,
}: {
  name: string
  // Under the name, such as the plan or the job title.
  detail?: ReactNode
  // Opens the menu with the name and this email over a line.
  email?: string
  // A one-line muted heading instead, such as the email address alone.
  label?: ReactNode
  size?: keyof typeof SIZE
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  // On the menu, such as a width: w-60. It is w-56 by default.
  menuClassName?: string
  children?: ReactNode
  // On the trigger row.
  className?: string
}) {
  const styles = SIZE[size]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className={cn('w-56', menuClassName)}>
        {email ? (
          <>
            <DropdownMenuLabel className="grid gap-0.5">
              <span className="text-foreground text-xs font-medium">{name}</span>
              <span className="font-normal">{email}</span>
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
