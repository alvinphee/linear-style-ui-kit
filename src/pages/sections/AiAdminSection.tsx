import { MembersPanels } from './ai-admin/MembersPanels'
import { OverviewPanels } from './ai-admin/OverviewPanels'
import { PolicyPanels } from './ai-admin/PolicyPanels'
import { SecurityPanels } from './ai-admin/SecurityPanels'
import { Section } from './shared'

// The admin console's parts: usage analytics and the overview, members,
// invites and roles, SSO, domains and the audit log, and the AI policies
// (models and features, the connector allow list, retention).
export default function AiAdminSection() {
  return (
    <Section
      id="ai-admin"
      title="Admin console"
      description="Usage analytics, members and roles, SSO and domains, audit log, and the organisation's AI policies"
    >
      <OverviewPanels />
      <MembersPanels />
      <SecurityPanels />
      <PolicyPanels />
    </Section>
  )
}
