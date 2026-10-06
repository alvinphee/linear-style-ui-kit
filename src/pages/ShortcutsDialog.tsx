import { Shortcut } from '@/components/shortcut'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

// The "?" keyboard shortcuts list, as a modal: the groups side by side when
// there is room.
export default function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85svh,40rem)] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Everything here works from the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 grid-cols-1 gap-5 overflow-y-auto p-4 sm:grid-cols-2 sm:gap-x-8">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-muted-foreground mb-2 text-[11px] font-medium">{group.title}</h3>
              <ul className="grid gap-1">
                {group.rows.map((row) => (
                  <li key={row.label} className="flex h-7 items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate">{row.label}</span>
                    <Shortcut keys={row.keys} then={row.then} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
