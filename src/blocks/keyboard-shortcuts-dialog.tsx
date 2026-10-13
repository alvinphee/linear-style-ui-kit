import { useState } from 'react'
import { keyLabel, Shortcut } from '@/components/shortcut'
import { SearchField } from '@/components/search-field'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// The keyboard shortcuts list, as a modal: what "?" opens in most apps.
// Groups of rows, each a label and its keys (<Shortcut>: "mod" reads ⌘ on a
// Mac and Ctrl elsewhere; `then` for keys pressed one after another). A
// search box filters rows by label or key, and the groups sit side by side
// when there is room. The search clears each time it opens.

export type ShortcutItem = { keys: string[]; label: string; then?: boolean }
export type ShortcutGroup = { title: string; items: ShortcutItem[] }

export function KeyboardShortcutsDialog({
  open, onOpenChange, groups, title = 'Keyboard shortcuts', description = 'Work faster without the mouse.',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: ShortcutGroup[]
  title?: string
  description?: string
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const matches = (item: ShortcutItem) =>
    !q || item.label.toLowerCase().includes(q) || item.keys.some((k) => keyLabel(k).toLowerCase() === q || k.toLowerCase() === q)

  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length > 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="flex max-h-[min(85svh,40rem)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="gap-3 border-b p-4 pr-12">
          <div className="grid gap-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="Search shortcuts" className="h-8" />
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto p-4">
          {shown.length === 0 ? (
            <p role="status" className="text-muted-foreground py-8 text-center text-xs">
              No shortcuts match “{query.trim()}”.
            </p>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 sm:gap-x-8">
              {shown.map((group) => (
                <section key={group.title} aria-label={group.title} className="min-w-0">
                  <h3 className="text-muted-foreground mb-2 text-[11px] font-medium">{group.title}</h3>
                  <ul className="grid gap-1">
                    {group.items.map((item) => (
                      <li key={`${item.label}-${item.keys.join('+')}`} className="flex min-h-7 items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate">{item.label}</span>
                        <Shortcut keys={item.keys} then={item.then} className="shrink-0" />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
