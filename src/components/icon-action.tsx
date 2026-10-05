import type { ComponentProps, ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Shortcut, ariaKeyShortcuts } from './shortcut'

// An icon-only ghost button with its label as a tooltip (and as the
// accessible name): copy, regenerate, thumbs up, close. With `pressed` it is a
// toggle and shows as held down. `shortcut` adds the keys to the tooltip
// (<IconAction shortcut={['mod', 'B']} … />).
// Pass `icon`, or `children` for anything else (a spinner, an avatar).
// Other Button props (variant, size, aria-*) and the ref go onto the button,
// so it can sit inside a menu or popover trigger:
//   <DropdownMenuTrigger asChild><IconAction label="More actions" icon={…} /></DropdownMenuTrigger>

export function IconAction({ label, icon, children, pressed, shortcut, variant = 'ghost', size = 'icon-sm', className, ...props }: Omit<ComponentProps<typeof Button>, 'children'> & {
  label: string
  icon?: IconSvgElement
  children?: ReactNode
  pressed?: boolean
  // Keys shown in the tooltip, as for Shortcut.
  shortcut?: string[]
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          aria-label={label}
          aria-pressed={pressed}
          aria-keyshortcuts={shortcut?.length ? ariaKeyShortcuts(shortcut) : undefined}
          // The pressed fill also wins over the outline variant's dark-mode fill.
          className={cn('text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground dark:aria-pressed:bg-muted', className)}
          {...props}
        >
          {icon ? <HugeiconsIcon icon={icon} strokeWidth={2} /> : children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && shortcut.length > 0 && <Shortcut keys={shortcut} />}
      </TooltipContent>
    </Tooltip>
  )
}
