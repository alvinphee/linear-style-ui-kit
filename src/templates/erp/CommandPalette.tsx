import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ClipboardCheckIcon, ComputerIcon, Logout01Icon, Moon02Icon, SparklesIcon, Sun03Icon, UserSwitchIcon, Building06Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { IconMark } from '@/components/mark'
import { useTheme } from '@/lib/theme'
import { DEMO_USERS, ROLE_LABEL } from './data'
import { ERP_FORMS } from './forms/definitions'
import { useAssistant } from './assistant/store'
import { edition } from './edition'
import { pageFor, pagesOf, specFor } from './modules'
import { go, goScreen } from './route'
import { allowedModules } from './Shell'
import { useErp } from './store'
import type { EntityId, ErpModule } from './types'
import { StatusBadge } from './ui'

// Records the palette can find by number or name, in the order they're listed.
const SEARCHABLE: { entity: EntityId; fields: string[] }[] = [
  { entity: 'invoices', fields: ['customer'] }, { entity: 'salesOrders', fields: ['customer'] }, { entity: 'purchaseOrders', fields: ['vendor'] },
  { entity: 'quotations', fields: ['customer'] }, { entity: 'opportunities', fields: ['name', 'account'] }, { entity: 'accounts', fields: ['name'] },
  { entity: 'contacts', fields: ['name', 'account'] }, { entity: 'leads', fields: ['name', 'company'] }, { entity: 'items', fields: ['name'] },
  { entity: 'vendors', fields: ['name'] }, { entity: 'employees', fields: ['name', 'jobTitle'] }, { entity: 'bills', fields: ['vendor'] },
]

// The create actions, in the order they appear, and the module each belongs to.
const CREATE: { entity: EntityId; label: string }[] = [
  { entity: 'invoices', label: 'New customer invoice' }, { entity: 'salesOrders', label: 'New sales order' },
  { entity: 'quotations', label: 'New quotation' }, { entity: 'purchaseOrders', label: 'New purchase order' },
  { entity: 'leads', label: 'New lead' }, { entity: 'opportunities', label: 'New opportunity' }, { entity: 'items', label: 'New item' },
  { entity: 'bills', label: 'New vendor bill' }, { entity: 'journals', label: 'New journal entry' }, { entity: 'leave', label: 'New leave request' },
  { entity: 'users', label: 'Invite user' },
]

// Ctrl+K / ⌘K. Jump to any module or page, find a record by number or name,
// create something, change a setting, or ask AI what you typed, without
// leaving the keyboard.
export function CommandPalette({ module }: { module: ErpModule }) {
  const { paletteOpen, setPaletteOpen, session, data, openPeek, startCreate, setRole, signOut, setCopilotOpen } = useErp()
  const { setTheme } = useTheme()
  const { send } = useAssistant()
  const [query, setQuery] = useState('')
  const modules = allowedModules(session?.role)
  const allowed = new Set(modules.map((m) => m.id))

  const records = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const found: { entity: EntityId; id: string; label: string; status: string; where: string }[] = []
    for (const { entity, fields } of SEARCHABLE) {
      const home = pageFor(entity)
      if (!home || !allowed.has(home.module.id)) continue
      for (const r of data[entity]) {
        if (r.id.toLowerCase().includes(q) || fields.some((f) => String(r[f] ?? '').toLowerCase().includes(q))) {
          found.push({ entity, id: r.id, label: String(r[fields[0]] ?? ''), status: String(r.status ?? r.stage ?? ''), where: home.page.label })
        }
        if (found.length >= 8) return found
      }
    }
    return found
  }, [query, data, allowed])

  function run(action: () => void) {
    setPaletteOpen(false)
    setQuery('')
    action()
  }

  // What you typed, as a question: in the Assistant (ERP + AI) or the side panel.
  function ask(question: string) {
    if (!send(question, { newChat: true })) {
      toast('Ask AI is still answering', { description: 'Try again when the reply has finished, or stop it.' })
      return
    }
    if (edition().assistant) go('home', 'assistant')
    else setCopilotOpen(true)
  }

  // Forms, by name or category: open one to fill it in.
  const q = query.trim().toLowerCase()
  const forms = q.length >= 2 && allowed.has('forms')
    ? ERP_FORMS.filter((f) => f.name.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q)).slice(0, 5)
    : []

  const creates = CREATE.filter((c) => {
    const home = pageFor(c.entity)
    return home && allowed.has(home.module.id) && specFor(c.entity)?.create
  })

  return (
    <CommandDialog open={paletteOpen} onOpenChange={(open) => {
      setPaletteOpen(open)
      if (!open) setQuery('')
    }}>
      <Command>
        <CommandInput placeholder="Search records, pages and actions…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>Nothing found. Try a document number such as INV-2026-0412.</CommandEmpty>

          {records.length > 0 && (
            <CommandGroup heading="Records">
              {records.map((r) => (
                <CommandItem key={r.id} value={`${r.id} ${r.label}`} onSelect={() => run(() => {
                  const home = pageFor(r.entity)!
                  go(home.module.id, home.page.id)
                  openPeek(r.entity, r.id)
                })}>
                  <span className="text-muted-foreground w-28 shrink-0 truncate font-mono text-[11px]">{r.id}</span>
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                  {r.status && <StatusBadge status={r.status} />}
                  <span className="text-muted-foreground hidden text-[11px] sm:inline">{r.where}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {forms.length > 0 && (
            <CommandGroup heading="Forms">
              {forms.map((f) => (
                <CommandItem key={f.id} value={`form ${f.name} ${f.category ?? ''}`} onSelect={() => run(() => go('forms', 'catalogue', f.id))}>
                  <HugeiconsIcon icon={f.icon ?? ClipboardCheckIcon} strokeWidth={2} />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-muted-foreground hidden text-[11px] sm:inline">Fill in</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {module.id !== 'home' && (
            <CommandGroup heading={`${module.name} pages`}>
              {pagesOf(module).map((p) => (
                <CommandItem key={p.id} value={`${module.name} ${p.label}`} onSelect={() => run(() => go(module.id, p.id))}>
                  <HugeiconsIcon icon={p.icon} strokeWidth={2} /> {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Go to module">
            {modules.map((m) => (
              <CommandItem key={m.id} value={`module ${m.name}`} onSelect={() => run(() => go(m.id, m.pages[0].id))}>
                <IconMark icon={m.icon} colour={m.colour} size="sm" /> {m.name}
                <CommandShortcut>G {m.key}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Every page in every module, found by typing ("bills", "payroll"…). */}
          {query.trim() && (
            <CommandGroup heading="All pages">
              {modules.flatMap((m) => pagesOf(m).map((p) => (
                <CommandItem key={`${m.id}/${p.id}`} value={`page ${m.name} ${p.label}`} onSelect={() => run(() => go(m.id, p.id))}>
                  <HugeiconsIcon icon={p.icon} strokeWidth={2} />
                  <span className="text-muted-foreground">{m.name}</span>
                  <span className="text-muted-foreground/60">›</span> {p.label}
                </CommandItem>
              )))}
            </CommandGroup>
          )}

          {/* Anything typed can be asked as a question. Its value holds the
              query, so it always matches. */}
          {query.trim().length >= 3 && (
            <CommandGroup heading="Ask AI">
              <CommandItem value={`ask ai ${query}`} onSelect={() => {
                const question = query.trim()
                run(() => ask(question))
              }}>
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="text-brand" />
                <span className="shrink-0">Ask AI:</span>
                <span className="text-muted-foreground min-w-0 truncate">“{query.trim()}”</span>
              </CommandItem>
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Create">
            {creates.map((c) => (
              <CommandItem key={c.entity} value={c.label} onSelect={() => run(() => startCreate(c.entity))}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> {c.label}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Account and settings">
            <CommandItem value="Ask AI copilot" onSelect={() => run(() => setCopilotOpen(true))}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Ask AI
            </CommandItem>
            {DEMO_USERS.filter((u) => u.role !== session?.role).map((u) => (
              <CommandItem key={u.role} value={`Switch role ${ROLE_LABEL[u.role]}`} onSelect={() => run(() => {
                setRole(u.role, u.title)
                toast(`Viewing as ${ROLE_LABEL[u.role]}`)
                go('home', 'launchpad')
              })}>
                <HugeiconsIcon icon={UserSwitchIcon} strokeWidth={2} /> Switch role to {ROLE_LABEL[u.role]}
                <CommandShortcut>Demo</CommandShortcut>
              </CommandItem>
            ))}
            <CommandItem value="Switch company" onSelect={() => run(() => goScreen('companies'))}>
              <HugeiconsIcon icon={Building06Icon} strokeWidth={2} /> Switch company
            </CommandItem>
            <CommandItem value="Theme light" onSelect={() => run(() => setTheme('light'))}>
              <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} /> Light theme
            </CommandItem>
            <CommandItem value="Theme dark" onSelect={() => run(() => setTheme('dark'))}>
              <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} /> Dark theme
            </CommandItem>
            <CommandItem value="Theme system" onSelect={() => run(() => setTheme('system'))}>
              <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} /> System theme
            </CommandItem>
            <CommandItem value="Sign out log out" onSelect={() => run(() => {
              signOut()
              goScreen('login')
            })}>
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
