import { AuditLog } from '@/blocks/audit-log'
import { SettingsHeader } from '@/blocks/settings-page'
import { ORG } from './org'
import { AI_AUDIT_ACTIONS, AI_AUDIT_EVENTS, AUDIT_ACTORS, AUDIT_NOW, AUDIT_PRESETS } from './audit-data'

// The admin console's Audit log section: the kit's audit log block fed with
// the AI app's made-up events (audit-data.ts).

export function AuditLogTab() {
  return (
    <>
      <SettingsHeader
        title="Audit log"
        description={`Every sign-in and admin change at ${ORG.name} in the last 30 days: who, what, when and from where. Kept for a year.`}
      />
      <AuditLog
        events={AI_AUDIT_EVENTS}
        actions={AI_AUDIT_ACTIONS}
        actors={AUDIT_ACTORS}
        now={AUDIT_NOW}
        presets={AUDIT_PRESETS}
        csvFilename={`${ORG.id}-audit-log`}
        listClassName="max-h-[36rem]"
      />
    </>
  )
}
