import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// An icon-only ghost button with its label as a tooltip (and as the
// accessible name): copy, regenerate, thumbs up, close. With `pressed` it is a
// toggle and shows as held down.
// Pass `icon`, or `children` for anything else (a spinner, an avatar).

export function IconAction({ label, icon, children, onClick, pressed, disabled, className }: {
  label: string
  icon?: IconSvgElement
  children?: ReactNode
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
          className={cn('text-muted-foreground', pressed && 'bg-muted text-foreground', className)}
        >
          {icon ? <HugeiconsIcon icon={icon} strokeWidth={2} /> : children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
