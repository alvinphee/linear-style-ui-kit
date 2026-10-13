import { useState, type RefObject } from 'react'
import { toast } from 'sonner'
import { OnboardingDialog, type OnboardingAnswers, type OnboardingStyle } from '@/blocks/ai/onboarding/onboarding-dialog'
import { UsageLimitBanner, UsageLimitNotice, type UsageLimitState } from '@/blocks/ai/chat/usage-limit'
import { KeyboardShortcutsDialog, type ShortcutGroup } from '@/blocks/keyboard-shortcuts-dialog'
import { OfflineBanner } from '@/blocks/offline-banner'
import { formatShortDate } from '@/lib/format'
import { useOnline } from '@/lib/use-online'
import { AppCommandMenu, useAppShortcuts, type CommandMenuChat } from './AppCommandMenu'
import { useActions } from './context'
import { modelById, now, STARTERS, USER } from './data'
import { DEFAULT_ACCOUNT } from './settings/connectors-data'
import { STYLES } from './settings/PersonalisationTab'
import { ROLES } from './settings/ProfileTab'
import { useConnectors } from './settings/ConnectorsTab'
import { useAiPrefs, useStoredState, type ResponseStyle } from './settings/prefs'
import type { ModelId, Project } from './types'

// The AI chat app's chrome around the chat: what shows at the edges and on a
// first visit, mounted once in the workspace.
// - ChatChrome: the onboarding (the first time, kept in this browser), the
//   keyboard shortcuts dialog, the command menu (Ctrl/⌘ K) and the offline
//   banner floating at the top.
// - ComposerNotices: the usage limit banner, for above the prompt box.
// - ChatUsageNotice: the usage limit for an empty chat, at the limit only.
// The usage limit is worked out from the workspace's credits (percent of
// the plan used, 0 to 100): near from 85, reached at 100.

export const ONBOARDED_KEY = 'linear-kit:ai-onboarded:v1'

// The model that still works at the usage limit.
const FALLBACK_MODEL: ModelId = 'swift'

export function usageLimitState(credits: number): UsageLimitState | null {
  if (credits >= 100) return 'reached'
  if (credits >= 85) return 'near'
  return null
}

// Messages left on a model, from the credits used and the model's cost per message.
export function messagesLeft(credits: number, model: ModelId) {
  return Math.max(0, Math.floor((100 - credits) / modelById(model).cost))
}

// When the usage limit resets: the first of next month, when the monthly
// credits in the sidebar's meter start again.
export function usageResetAt(at = now()) {
  const d = new Date(at)
  return formatShortDate(new Date(d.getFullYear(), d.getMonth() + 1, 1))
}

// The role chips and reply styles of Settings › Profile and Personalisation,
// so a choice here shows there.
export const ONBOARDING_ROLES = ROLES
export const ONBOARDING_STYLES: (OnboardingStyle & { id: ResponseStyle })[] = STYLES.map(({ line, ...style }) => ({
  ...style, description: line,
}))

const MAX_CONNECTORS = 5

export function shortcutGroups(enterToSend: boolean): ShortcutGroup[] {
  return [
    {
      title: 'General',
      items: [
        { keys: ['mod', 'K'], label: 'Open the command menu' },
        { keys: ['?'], label: 'Show keyboard shortcuts' },
        { keys: ['mod', '/'], label: 'Show keyboard shortcuts' },
        { keys: ['esc'], label: 'Close a menu, dialog or panel' },
      ],
    },
    {
      title: 'Chats',
      items: [
        { keys: ['mod', 'shift', 'O'], label: 'New chat' },
        enterToSend
          ? { keys: ['enter'], label: 'Send the message' }
          : { keys: ['mod', 'enter'], label: 'Send the message' },
        { keys: ['shift', 'enter'], label: 'New line' },
      ],
    },
    {
      title: 'In the prompt box',
      items: [
        { keys: ['/'], label: 'Slash commands, at the start' },
        { keys: ['@'], label: 'Mention a project, file or agent' },
        { keys: ['↑', '↓'], label: 'Move through suggestions' },
        { keys: ['Tab'], label: 'Pick a suggestion' },
      ],
    },
    {
      title: 'Editing a message',
      items: [
        { keys: ['enter'], label: 'Save and get a new reply' },
        { keys: ['esc'], label: 'Cancel the edit' },
      ],
    },
  ]
}

export function ChatChrome({ chats, projects, scopeRef, onboarding = 'auto', pendingCount = 0 }: {
  // Kept chats for the command menu: the sidebar's summaries fit.
  chats: CommandMenuChat[]
  projects: Project[]
  // The workspace's element when it sits inside the kit page, so its keys do
  // not reach the kit's own shortcuts; leave out for the full-page app.
  scopeRef?: RefObject<HTMLElement | null>
  // auto: the welcome opens on the first visit. manual: only from the
  // command menu ("Show the welcome again").
  onboarding?: 'auto' | 'manual'
  // Messages waiting to send while offline, for the offline banner.
  pendingCount?: number
}) {
  const actions = useActions()
  const { prefs, set } = useAiPrefs()
  const { connectors, setState: setConnectors } = useConnectors()
  const online = useOnline()

  const [onboarded, setOnboarded] = useStoredState<boolean>(ONBOARDED_KEY, false)
  const [welcomeAgain, setWelcomeAgain] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const welcomeOpen = welcomeAgain || (onboarding === 'auto' && !onboarded)

  useAppShortcuts({
    scopeRef,
    // Not while the welcome is up: it is modal, and it comes first.
    enabled: !welcomeOpen,
    onCommand: () => {
      setShortcutsOpen(false)
      setCommandOpen((o) => !o)
    },
    onShortcuts: () => {
      setCommandOpen(false)
      setShortcutsOpen(true)
    },
  })

  // Apps to offer: ones not connected yet first, admin-disabled and custom ones left out.
  const offered = connectors.filter((c) => !c.custom && c.status !== 'disabled')
  const onboardingConnectors = [
    ...offered.filter((c) => c.status !== 'connected'),
    ...offered.filter((c) => c.status === 'connected'),
  ].slice(0, MAX_CONNECTORS).map((c) => ({
    id: c.id, name: c.name, description: c.description, icon: c.icon, colour: c.colour, connected: c.status === 'connected',
  }))

  function closeWelcome() {
    setOnboarded(true)
    setWelcomeAgain(false)
  }

  function finish(answers: OnboardingAnswers) {
    if (answers.name) set('nickname', answers.name)
    set('role', answers.role)
    set('style', answers.style as ResponseStyle)

    const picked = connectors.filter((c) => answers.connectors.includes(c.id))
    if (picked.length) {
      setConnectors((s) => ({
        ...s,
        connections: {
          ...s.connections,
          ...Object.fromEntries(picked.map((c) => [c.id, { status: 'connected' as const, account: c.account ?? DEFAULT_ACCOUNT, lastUsed: c.lastUsed }])),
        },
      }))
    }

    closeWelcome()
    toast.success(answers.name ? `Welcome, ${answers.name}` : 'You’re all set', {
      description: picked.length
        ? `Connected ${picked.map((c) => c.name).join(', ')}. Change anything in Settings.`
        : 'Change any of this in Settings.',
    })
    if (answers.starter) actions.send(answers.starter, [], null)
  }

  return (
    <>
      <OnboardingDialog
        open={welcomeOpen}
        onFinish={finish}
        onSkip={closeWelcome}
        roles={ONBOARDING_ROLES}
        styles={ONBOARDING_STYLES}
        connectors={onboardingConnectors}
        starters={STARTERS.slice(0, 4)}
        initial={{ name: prefs.nickname, role: prefs.role, style: prefs.style }}
      />

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} groups={shortcutGroups(prefs.enterToSend)} />

      <AppCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        chats={chats}
        projects={projects}
        onShortcuts={() => setShortcutsOpen(true)}
        onWelcome={() => setWelcomeAgain(true)}
      />

      {/* Over the top of the workspace, under its header row. */}
      <div className="pointer-events-none absolute inset-x-0 top-12 z-30 flex justify-center px-3">
        <OfflineBanner
          online={online}
          pendingCount={pendingCount}
          onRetry={() => {
            if (navigator.onLine) toast('Back online')
            else toast('Still offline', { description: 'Check your connection. Nothing is lost.' })
          }}
          className="pointer-events-auto w-full max-w-md min-w-0"
        />
      </div>
    </>
  )
}

// The usage limit banner for above the prompt box: near the limit (can be
// dismissed until the state changes) or at it. Nothing below 85% used.
export function ComposerNotices({ credits, model, className }: {
  credits: number
  // The open chat's model: "Use Swift" is not offered when it is Swift already.
  model: ModelId
  className?: string
}) {
  const actions = useActions()
  const state = usageLimitState(credits)
  const [dismissed, setDismissed] = useState<UsageLimitState | null>(null)
  if (!state || dismissed === state) return null

  const fallback = model === FALLBACK_MODEL ? undefined : modelById(FALLBACK_MODEL).name
  return (
    <UsageLimitBanner
      state={state}
      remaining={state === 'near' ? messagesLeft(credits, model) : undefined}
      resetsAt={usageResetAt()}
      fallbackModel={fallback}
      onSwitchModel={() => {
        actions.setModel(FALLBACK_MODEL)
        toast(`Switched to ${modelById(FALLBACK_MODEL).name}`, { description: 'It still works at the usage limit.' })
      }}
      onUpgrade={() => actions.openSettings('billing')}
      onDismiss={state === 'near' ? () => setDismissed('near') : undefined}
      className={className}
    />
  )
}

// For an empty chat at the usage limit, in the welcome screen's place; null
// otherwise.
export function ChatUsageNotice({ credits, model, className }: { credits: number; model: ModelId; className?: string }) {
  const actions = useActions()
  if (usageLimitState(credits) !== 'reached') return null
  return (
    <UsageLimitNotice
      resetsAt={usageResetAt()}
      plan={USER.plan.replace(/ plan$/, '')}
      fallbackModel={model === FALLBACK_MODEL ? undefined : modelById(FALLBACK_MODEL).name}
      onSwitchModel={() => actions.setModel(FALLBACK_MODEL)}
      onUpgrade={() => actions.openSettings('billing')}
      className={className}
    />
  )
}
