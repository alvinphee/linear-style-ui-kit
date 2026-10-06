import { HugeiconsIcon } from '@hugeicons/react'
import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { useTheme } from '@/lib/theme'
import { IconAction } from './icon-action'

// The light / dark switch for a header: a sun that turns into a moon, with a
// tooltip saying what a click does. It flips between light and dark only;
// "System" lives in a theme menu (an account menu, Ctrl+K).
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === 'dark'
  return (
    <IconAction
      label={dark ? 'Light mode' : 'Dark mode'}
      size="icon"
      className={cn('text-foreground', className)}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      <HugeiconsIcon icon={Sun03Icon} altIcon={Moon02Icon} showAlt={dark} strokeWidth={2} />
    </IconAction>
  )
}
