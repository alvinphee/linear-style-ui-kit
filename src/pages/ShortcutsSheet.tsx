import { keyLabel } from '@/components/shortcut'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GO_KEYS, NAV } from './nav'

const label = (id: string) => NAV.find((n) => n.id === id)?.label ?? id

const GROUPS: { title: string; rows: { keys: string[]; label: string; then?: boolean }[] }[] = [
  {
    title: 'General',
    rows: [
      { keys: ['mod', 'K'], label: 'Open the command menu' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['C'], label: 'Create a job' },
      { keys: ['Esc'], label: 'Close a menu or dialog' },
    ],
  },
  {
    title: 'Go to',
    rows: GO_KEYS.map((g) => ({ keys: ['G', g.key], label: label(g.id), then: true })),
  },
]

export default function ShortcutsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>Everything here works from the keyboard, like Linear.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 overflow-y-auto px-4 pb-6">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-muted-foreground mb-2 text-[11px] font-medium">{group.title}</h3>
              <ul className="grid gap-1">
                {group.rows.map((row) => (
                  <li key={row.label} className="flex h-7 items-center justify-between gap-3 text-xs">
                    <span>{row.label}</span>
                    <KbdGroup>
                      {row.keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          {row.then && i > 0 && <span className="text-muted-foreground text-[10px]">then</span>}
                          <Kbd>{keyLabel(k)}</Kbd>
                        </span>
                      ))}
                    </KbdGroup>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
