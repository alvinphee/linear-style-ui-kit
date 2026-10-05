import { Kbd, KbdGroup } from '@/components/ui/kbd'

// A keyboard shortcut shown as keys: <Shortcut keys={['mod', 'K']} /> reads
// ⌘ K on a Mac and Ctrl K elsewhere. Names: mod, shift, alt, enter, esc;
// anything else is shown as written. With `then`, the keys are pressed one
// after another rather than together: <Shortcut keys={['G', 'B']} then />
// reads G then B.

export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const MOD = IS_MAC ? '⌘' : 'Ctrl'

const NAMES: Record<string, string> = {
  mod: MOD,
  shift: IS_MAC ? '⇧' : 'Shift',
  alt: IS_MAC ? '⌥' : 'Alt',
  enter: '↵',
  esc: 'Esc',
}

export const keyLabel = (key: string) => NAMES[key.toLowerCase()] ?? key

const ARIA_NAMES: Record<string, string> = {
  mod: IS_MAC ? 'Meta' : 'Control',
  shift: 'Shift',
  alt: 'Alt',
  enter: 'Enter',
  esc: 'Escape',
}

// Keys pressed together, as the aria-keyshortcuts attribute spells them:
// ['mod', 'K'] gives "Control+K" ("Meta+K" on a Mac).
export const ariaKeyShortcuts = (keys: string[]) => keys.map((k) => ARIA_NAMES[k.toLowerCase()] ?? k).join('+')

export function Shortcut({ keys, then, className }: { keys: string[]; then?: boolean; className?: string }) {
  if (!then) {
    return (
      <KbdGroup className={className}>
        {keys.map((k, i) => <Kbd key={`${k}-${i}`}>{keyLabel(k)}</Kbd>)}
      </KbdGroup>
    )
  }
  return (
    <KbdGroup className={className}>
      {keys.map((k, i) => (
        <span key={`${k}-${i}`} className="flex items-center gap-1">
          {i > 0 && (
            <span className="text-muted-foreground in-data-[slot=tooltip-content]:text-background/70 text-[10px]">then</span>
          )}
          <Kbd>{keyLabel(k)}</Kbd>
        </span>
      ))}
    </KbdGroup>
  )
}
