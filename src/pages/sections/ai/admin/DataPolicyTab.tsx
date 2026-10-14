import { toast } from 'sonner'
import { SettingsHeader } from '@/blocks/settings-page'
import { RetentionPolicy } from '@/blocks/ai/admin/retention-policy'
import { useStoredState } from '../settings/prefs'
import { ORG, useOrgPolicy } from './org'

// Admin console › Data and privacy: the organisation's retention policy,
// training opt-out (locked on for the Team plan), legal hold and the
// export of everything. Retention and training are in the org policy; the
// legal hold is kept in this browser on its own.

export const LEGAL_HOLD_KEY = 'linear-kit:ai-org-legal-hold:v1'

// Whether a legal hold pauses all deletion.
export function useLegalHold() {
  return useStoredState<boolean>(LEGAL_HOLD_KEY, false)
}

// Plans that never train on customer data, so the switch can't be turned off.
const NO_TRAINING_PLANS = ['Team', 'Enterprise']

export function DataPolicyTab() {
  const { policy, patch } = useOrgPolicy()
  const [legalHold, setLegalHold] = useLegalHold()
  const locked = NO_TRAINING_PLANS.includes(ORG.plan)

  return (
    <>
      <SettingsHeader
        title="Data and privacy"
        description={`How long ${ORG.name}'s chats are kept, whether they may train models, and how to take everything with you.`}
      />
      <RetentionPolicy
        retentionDays={policy.retentionDays}
        onRetentionChange={(days) => {
          patch('retentionDays', days)
          toast(days === null ? 'Chats are kept until people delete them' : `Chats are kept for ${days} days`, {
            description: 'Everyone sees it in Settings › Data controls. Demo only: nothing is deleted.',
          })
        }}
        trainingOptOut={policy.trainingOptOut}
        onTrainingOptOutChange={(on) => patch('trainingOptOut', on)}
        trainingLockedNote={locked ? `Always on for the ${ORG.plan} plan: your data is never used to train models.` : undefined}
        legalHold={legalHold}
        onLegalHoldChange={(on) => {
          setLegalHold(on)
          toast(on ? 'Legal hold on' : 'Legal hold lifted', {
            description: on ? 'Nothing is deleted until it is lifted.' : 'The retention policy applies again.',
          })
        }}
        onExport={() => toast('Export started', { description: 'The owners are emailed a download link when it is ready. Demo only.' })}
      />
    </>
  )
}
