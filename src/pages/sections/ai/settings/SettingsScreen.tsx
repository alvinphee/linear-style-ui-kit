import type { ReactNode } from 'react'
import {
  AiBrain01Icon, Brain02Icon, CreditCardIcon, Database01Icon, Mic01Icon, Notification01Icon, PaintBoardIcon,
  Plug01Icon, PuzzleIcon, SecurityLockIcon, UserCircleIcon, UserEdit01Icon,
} from '@hugeicons/core-free-icons'
import { SettingsPage, type SettingsNavGroup } from '@/blocks/settings-page'
import type { ModelId } from '../types'
import { AppearanceTab } from './AppearanceTab'
import { BillingTab } from './BillingTab'
import { ConnectorsTab } from './ConnectorsTab'
import { DataTab } from './DataTab'
import { MemoryTab } from './MemoryTab'
import { ModelsTab } from './ModelsTab'
import { NotificationsTab } from './NotificationsTab'
import { PersonalisationTab } from './PersonalisationTab'
import { ProfileTab } from './ProfileTab'
import { SecurityTab } from './SecurityTab'
import { SkillsTab } from './SkillsTab'
import { VoiceTab } from './VoiceTab'

// The AI chat app's settings, one page per section, as Claude and ChatGPT
// lay theirs out: you, then what the assistant can do, then data and money.
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: UserCircleIcon },
      { id: 'appearance', label: 'Appearance', icon: PaintBoardIcon },
      { id: 'personalisation', label: 'Personalisation', icon: UserEdit01Icon },
      { id: 'notifications', label: 'Notifications', icon: Notification01Icon },
      { id: 'security', label: 'Security', icon: SecurityLockIcon },
    ],
  },
  {
    label: 'Assistant',
    items: [
      { id: 'models', label: 'Models and features', icon: AiBrain01Icon },
      { id: 'memory', label: 'Memory', icon: Brain02Icon },
      { id: 'connectors', label: 'Connectors', icon: Plug01Icon },
      { id: 'skills', label: 'Skills', icon: PuzzleIcon },
      { id: 'voice', label: 'Voice', icon: Mic01Icon },
    ],
  },
  {
    label: 'Data and billing',
    items: [
      { id: 'data', label: 'Data controls', icon: Database01Icon },
      { id: 'billing', label: 'Billing and usage', icon: CreditCardIcon },
    ],
  },
]

export const SETTINGS_IDS = SETTINGS_NAV.flatMap((g) => g.items.map((i) => i.id))

export function SettingsScreen({
  active, onSelect, start, model, onModelChange, chatCount, credits, onExportAll, onResetDemo,
}: {
  active: string | null
  onSelect: (id: string | null) => void
  start?: ReactNode
  model: ModelId
  onModelChange: (id: ModelId) => void
  chatCount: number
  credits: number
  onExportAll: () => void
  onResetDemo: () => void
}) {
  function renderSection(id: string) {
    switch (id) {
      case 'profile': return <ProfileTab />
      case 'appearance': return <AppearanceTab />
      case 'personalisation': return <PersonalisationTab />
      case 'notifications': return <NotificationsTab />
      case 'security': return <SecurityTab />
      case 'models': return <ModelsTab model={model} onModelChange={onModelChange} />
      case 'memory': return <MemoryTab />
      case 'connectors': return <ConnectorsTab />
      case 'skills': return <SkillsTab />
      case 'voice': return <VoiceTab />
      case 'data': return <DataTab chatCount={chatCount} onExportAll={onExportAll} onResetDemo={onResetDemo} />
      case 'billing': return <BillingTab credits={credits} />
      default: return null
    }
  }

  return <SettingsPage nav={SETTINGS_NAV} active={active} onSelect={onSelect} renderSection={renderSection} start={start} />
}
