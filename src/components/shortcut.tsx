import { Kbd, KbdGroup } from '@/components/ui/kbd'

// A keyboard shortcut shown as keys: <Shortcut keys={['mod', 'K']} /> reads
// ⌘ K on a Mac and Ctrl K elsewhere. Names: mod, shift, alt, enter, esc;
// anything else is shown as written.

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

export function Shortcut({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <KbdGroup className={className}>
      {keys.map((k, i) => <Kbd key={`${k}-${i}`}>{keyLabel(k)}</Kbd>)}
    </KbdGroup>
  )
}
