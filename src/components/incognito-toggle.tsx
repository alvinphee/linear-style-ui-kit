import { HugeiconsIcon } from '@hugeicons/react'
import { IncognitoIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// The incognito switch for an AI chat (some apps call it a temporary chat):
// on, the chat is kept out of the history and deleted when you leave it.
// Pressed it fills with the foreground colour, so it is clear at a glance
// that this chat is not being kept. Put it at the top right of the chat.
export function IncognitoToggle({ pressed, onPressedChange, label = 'Incognito', className }: {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  // The visible text; the icon alone when empty.
  label?: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          variant="outline"
          pressed={pressed}
          onPressedChange={onPressedChange}
          aria-label="Incognito chat"
          className={cn(
            'text-muted-foreground data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90',
            className,
          )}
        >
          <HugeiconsIcon icon={IncognitoIcon} strokeWidth={2} data-icon={label ? 'inline-start' : undefined} />
          {label}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        {pressed ? 'Turn off incognito' : 'Incognito: not saved to your chats, deleted when you leave'}
      </TooltipContent>
    </Tooltip>
  )
}
