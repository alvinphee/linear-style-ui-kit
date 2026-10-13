import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon, BotIcon, BubbleChatIcon, DashboardSquare01Icon, Database01Icon, IncognitoIcon, KeyboardIcon,
  Settings01Icon, SidebarLeftIcon, SparklesIcon, Task01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { CreateKnowledgeBaseDialog, type KnowledgeBaseDraft } from '@/blocks/ai/knowledge/create-knowledge-base-dialog'
import { keyLabel } from '@/components/shortcut'
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { isTyping } from '@/lib/keyboard'
import { useAgents } from './agents/context'
import { useActions } from './context'
import { USER, now } from './data'
import { DEFAULT_RETRIEVAL } from './knowledge/bases-data'
import { useKnowledge } from './knowledge/context'
import { newId } from './knowledge/library'
import { ORGANISATION } from './projects/people'
import { PROJECT_COLOURS, PROJECT_ICONS, projectColour, projectIcon } from './projects/templates'
import { SETTINGS_NAV } from './settings/SettingsScreen'
import type { Chat, Project } from './types'

// The AI chat app's command menu (Ctrl/⌘ K): one search over what the app
// can do and everything in it. Actions first, then chats (the six newest,
// or the six best title matches), projects, agents, knowledge bases and the
// Settings sections. Each runs the workspace's own action, so the menu
// never changes state by itself. New knowledge base opens the same create
// dialog as the Knowledge page.

// A chat as the menu needs it; the sidebar's ChatSummary fits, icon and all.
export type CommandMenuChat = Pick<Chat, 'id' | 'title' | 'updatedAt'> & { icon?: IconSvgElement; iconColour?: string }

const CHATS_SHOWN = 6

const keys = (...k: string[]) => k.map(keyLabel).join(' ')

export function AppCommandMenu({ open, onOpenChange, chats, projects, onShortcuts, onWelcome }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Kept chats (not incognito ones), any order.
  chats: CommandMenuChat[]
  projects: Project[]
  // Opens the keyboard shortcuts dialog; the item is left out without it.
  onShortcuts?: () => void
  // Shows the onboarding again; the item is left out without it.
  onWelcome?: () => void
}) {
  const actions = useActions()
  const agents = useAgents()
  const library = useKnowledge()
  const [search, setSearch] = useState('')
  const [creatingBase, setCreatingBase] = useState(false)

  const setOpen = (next: boolean) => {
    if (!next) setSearch('')
    onOpenChange(next)
  }

  // Close first, so focus goes back where it was before the action moves it.
  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  const q = search.trim().toLowerCase()
  const shownChats = [...chats]
    .filter((c) => !q || c.title.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, CHATS_SHOWN)
  const shownProjects = projects.filter((p) => !p.archived)
  const allAgents = [...agents.agents, ...agents.shared]

  function createBase(draft: KnowledgeBaseDraft) {
    const id = newId('kb')
    library.setBases((bs) => [...bs, {
      id, name: draft.name, description: draft.description, icon: projectIcon(draft.icon), colour: projectColour(draft.colour),
      sources: [], documents: [], settings: { ...DEFAULT_RETRIEVAL }, access: draft.access, linkedProjects: [],
      owner: USER.name, updatedAt: now(),
    }])
    setCreatingBase(false)
    if (draft.start === 'empty') {
      actions.openKnowledge(id)
      toast(`Created “${draft.name}”`)
    } else {
      actions.openKnowledge(id, 'sources')
      toast(`Created “${draft.name}”`, { description: 'Add its first source here.' })
    }
  }

  // Ctrl/⌘ K again closes the menu. Stopped here so a page around the app
  // (the kit's own command menu) does not open its menu as well.
  function onKeyDown(e: ReactKeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command menu"
        description="Search chats, projects, agents, knowledge bases and settings, or run an action."
        className="sm:max-w-lg"
      >
        <Command onKeyDown={onKeyDown}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search or run a command…" />
          <CommandList className="max-h-[min(24rem,60svh)]">
            <CommandEmpty>Nothing matches “{search.trim()}”.</CommandEmpty>

            <CommandGroup heading="Actions">
              <CommandItem value="New chat" onSelect={() => run(() => actions.newChat(null))}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> New chat
                <CommandShortcut>{keys('mod', 'shift', 'O')}</CommandShortcut>
              </CommandItem>
              <CommandItem value="New incognito chat" keywords={['temporary', 'private']} onSelect={() => run(() => actions.setIncognito(true))}>
                <HugeiconsIcon icon={IncognitoIcon} strokeWidth={2} /> New incognito chat
              </CommandItem>
              <CommandItem value="Create agent" keywords={['new agent', 'builder']} onSelect={() => run(() => actions.openAgents('new'))}>
                <HugeiconsIcon icon={BotIcon} strokeWidth={2} /> Create agent
              </CommandItem>
              <CommandItem value="New knowledge base" keywords={['rag', 'documents']} onSelect={() => run(() => setCreatingBase(true))}>
                <HugeiconsIcon icon={Database01Icon} strokeWidth={2} /> New knowledge base
              </CommandItem>
              <CommandItem value="All chats" keywords={['library', 'history']} onSelect={() => run(actions.openLibrary)}>
                <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} /> All chats
              </CommandItem>
              <CommandItem value="Runs" keywords={['agent runs', 'approvals', 'inbox']} onSelect={() => run(() => actions.openRuns())}>
                <HugeiconsIcon icon={Task01Icon} strokeWidth={2} /> Runs
              </CommandItem>
              <CommandItem value="Toggle sidebar" keywords={['hide', 'show']} onSelect={() => run(actions.toggleSidebar)}>
                <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} /> Toggle sidebar
              </CommandItem>
              <CommandItem value="Settings" keywords={['preferences']} onSelect={() => run(() => actions.openSettings())}>
                <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} /> Settings
              </CommandItem>
              {onShortcuts && (
                <CommandItem value="Keyboard shortcuts" keywords={['keys', 'hotkeys']} onSelect={() => run(onShortcuts)}>
                  <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} /> Keyboard shortcuts
                  <CommandShortcut>?</CommandShortcut>
                </CommandItem>
              )}
              {onWelcome && (
                <CommandItem value="Show the welcome again" keywords={['onboarding', 'tour', 'get started']} onSelect={() => run(onWelcome)}>
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Show the welcome again
                </CommandItem>
              )}
            </CommandGroup>

            {shownChats.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={q ? 'Chats' : 'Recent chats'}>
                  {shownChats.map((c) => (
                    <CommandItem key={c.id} value={`chat ${c.title} ${c.id}`} keywords={[c.title]} onSelect={() => run(() => actions.openChat(c.id))}>
                      <HugeiconsIcon icon={c.icon ?? BubbleChatIcon} strokeWidth={2} style={c.iconColour ? { color: c.iconColour } : undefined} />
                      <span className="min-w-0 truncate">{c.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {shownProjects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Projects">
                  {shownProjects.map((p) => (
                    <CommandItem key={p.id} value={`project ${p.name} ${p.id}`} keywords={[p.name]} onSelect={() => run(() => actions.openProject(p.id))}>
                      <HugeiconsIcon icon={projectIcon(p.icon)} strokeWidth={2} style={{ color: p.colour }} />
                      <span className="min-w-0 truncate">{p.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {allAgents.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Agents">
                  {allAgents.map((a) => (
                    <CommandItem key={a.id} value={`agent ${a.name} ${a.id}`} keywords={[a.name, a.description]} onSelect={() => run(() => actions.openAgents(a.id))}>
                      <HugeiconsIcon icon={a.icon ?? BotIcon} strokeWidth={2} style={a.colour ? { color: a.colour } : undefined} />
                      <span className="min-w-0 truncate">{a.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {library.bases.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Knowledge bases">
                  {library.bases.map((b) => (
                    <CommandItem key={b.id} value={`knowledge ${b.name} ${b.id}`} keywords={[b.name]} onSelect={() => run(() => actions.openKnowledge(b.id))}>
                      <HugeiconsIcon icon={b.icon ?? Database01Icon} strokeWidth={2} style={b.colour ? { color: b.colour } : undefined} />
                      <span className="min-w-0 truncate">{b.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup heading="Settings">
              {SETTINGS_NAV.flatMap((g) => g.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`settings ${item.label}`}
                  keywords={g.label ? [g.label, 'settings'] : ['settings']}
                  onSelect={() => run(() => actions.openSettings(item.id))}
                >
                  {item.icon && <HugeiconsIcon icon={item.icon} strokeWidth={2} />}
                  {/* The label grows: the item's own check icon also sits at the end. */}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="text-muted-foreground shrink-0 text-[11px]">Settings</span>
                </CommandItem>
              )))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <CreateKnowledgeBaseDialog
        open={creatingBase}
        onOpenChange={setCreatingBase}
        icons={PROJECT_ICONS}
        colours={PROJECT_COLOURS}
        organisation={ORGANISATION}
        onCreate={createBase}
      />
    </>
  )
}

// The app's keyboard shortcuts: Ctrl/⌘ K for the command menu, and "?" (when
// not typing) or Ctrl/⌘ / for the shortcuts list. Ctrl/⌘ Shift O (new chat)
// is the workspace's own and is not handled here.
// With `scopeRef`, only keys pressed inside that element count, and they
// stop there: for the app sitting inside a page with shortcuts of its own
// (the kit). Without it, the whole window listens (the full-page app).
export function useAppShortcuts({ onCommand, onShortcuts, scopeRef, enabled = true }: {
  onCommand: () => void
  onShortcuts: () => void
  scopeRef?: RefObject<HTMLElement | null>
  enabled?: boolean
}) {
  const handlers = useRef({ onCommand, onShortcuts })
  useEffect(() => {
    handlers.current = { onCommand, onShortcuts }
  })

  useEffect(() => {
    if (!enabled) return
    const target: HTMLElement | Window | null = scopeRef ? scopeRef.current : window
    if (!target) return

    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        e.stopPropagation()
        handlers.current.onCommand()
        return
      }
      if ((mod && e.key === '/') || (!mod && !e.altKey && e.key === '?' && !isTyping(e.target))) {
        e.preventDefault()
        e.stopPropagation()
        handlers.current.onShortcuts()
      }
    }

    const listener = onKey as EventListener
    target.addEventListener('keydown', listener)
    return () => target.removeEventListener('keydown', listener)
  }, [enabled, scopeRef])
}
