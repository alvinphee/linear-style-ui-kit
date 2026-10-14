import type { ReactNode } from 'react'
import {
  AiBrain01Icon, Analytics01Icon, Archive02Icon, Database01Icon, DashboardSquare01Icon, Key01Icon, LogsIcon, Plug01Icon,
  SecurityLockIcon, UserGroupIcon, UserShield01Icon,
} from '@hugeicons/core-free-icons'
import { SettingsPage, type SettingsNavGroup } from '@/blocks/settings-page'
import { AuditLogTab } from './AuditLogTab'
import { ConnectorsPolicyTab } from './ConnectorsPolicyTab'
import { DataPolicyTab } from './DataPolicyTab'
import { MembersTab } from './MembersTab'
import { ModelsPolicyTab } from './ModelsPolicyTab'
import { ORG } from './org'
import { OrgKnowledgeTab } from './OrgKnowledgeTab'
import { OverviewTab } from './OverviewTab'
import { RolesTab } from './RolesTab'
import { SecurityPolicyTab } from './SecurityPolicyTab'
import { SsoTab } from './SsoTab'
import { UsageTab } from './UsageTab'

// The admin console: what owners and admins run for the whole organisation,
// as ChatGPT Enterprise and Claude for Work lay theirs out. The people, then
// sign-in and security, then what the assistant may do, then the record.
// The same settings page block as Settings, so it drills in on a phone.

export const ADMIN_NAV: SettingsNavGroup[] = [
  {
    label: 'Organisation',
    items: [
      { id: 'overview', label: 'Overview', icon: DashboardSquare01Icon },
      { id: 'members', label: 'Members', icon: UserGroupIcon },
      { id: 'roles', label: 'Roles and permissions', icon: UserShield01Icon },
      { id: 'usage', label: 'Usage', icon: Analytics01Icon },
    ],
  },
  {
    label: 'Sign-in and security',
    items: [
      { id: 'sso', label: 'SSO and provisioning', icon: Key01Icon },
      { id: 'security', label: 'Security policies', icon: SecurityLockIcon },
    ],
  },
  {
    label: 'Assistant',
    items: [
      { id: 'models', label: 'Models and features', icon: AiBrain01Icon },
      { id: 'connectors', label: 'Connectors', icon: Plug01Icon },
      { id: 'knowledge', label: 'Knowledge', icon: Database01Icon },
      { id: 'data', label: 'Data and privacy', icon: Archive02Icon },
    ],
  },
  {
    label: 'Compliance',
    items: [{ id: 'audit', label: 'Audit log', icon: LogsIcon }],
  },
]

export function AdminScreen({ active, onSelect, start }: {
  active: string | null
  onSelect: (id: string | null) => void
  start?: ReactNode
}) {
  function renderSection(id: string) {
    switch (id) {
      case 'overview': return <OverviewTab onNavigate={onSelect} />
      case 'members': return <MembersTab />
      case 'roles': return <RolesTab />
      case 'usage': return <UsageTab />
      case 'sso': return <SsoTab />
      case 'security': return <SecurityPolicyTab />
      case 'models': return <ModelsPolicyTab />
      case 'connectors': return <ConnectorsPolicyTab />
      case 'knowledge': return <OrgKnowledgeTab />
      case 'data': return <DataPolicyTab />
      case 'audit': return <AuditLogTab />
      default: return null
    }
  }

  return (
    <SettingsPage
      title={`${ORG.name} admin`}
      nav={ADMIN_NAV}
      active={active}
      onSelect={onSelect}
      renderSection={renderSection}
      start={start}
      backLabel="All sections"
    />
  )
}
