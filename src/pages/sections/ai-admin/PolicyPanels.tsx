import { useState } from 'react'
import { toast } from 'sonner'
import { ConnectorPolicy, type ConnectorRequest } from '@/blocks/ai/admin/connector-policy'
import { ModelFeaturePolicy } from '@/blocks/ai/admin/model-feature-policy'
import { RetentionPolicy } from '@/blocks/ai/admin/retention-policy'
import { Button } from '@/components/ui/button'
import { Panel } from '../shared'
import { DEFAULT_MODEL, now } from '../ai/data'
import { DEFAULT_ORG_POLICY, type OrgPolicy } from '../ai/admin/org'
import { FEATURE_POLICIES, POLICY_MODELS, type OrgFeature } from '../ai/admin/ModelsPolicyTab'
import { POLICY_CONNECTORS, sampleConnectorRequests } from '../ai/admin/ConnectorsPolicyTab'

// The admin console's policy blocks on their own, each live on local state
// (nothing here touches the AI workspace's org policy): the connector
// policy with its requests, model access and features, and the retention
// policy with legal hold.

export function PolicyPanels() {
  return (
    <>
      <ConnectorPolicyPanel />
      <ModelFeaturePanel />
      <RetentionPanel />
    </>
  )
}

function ConnectorPolicyPanel() {
  const [blocked, setBlocked] = useState<string[]>(['crm', 'design-files'])
  const [customServers, setCustomServers] = useState(true)
  const [approvalForWrites, setApprovalForWrites] = useState(true)
  const [requests, setRequests] = useState<ConnectorRequest[]>(() => sampleConnectorRequests(now()))
  const nameOf = (id: string) => POLICY_CONNECTORS.find((c) => c.id === id)?.name ?? id

  const resolve = (id: string, approve: boolean) => {
    const request = requests.find((r) => r.id === id)
    if (!request) return
    if (approve) setBlocked((b) => b.filter((x) => x !== request.connectorId))
    setRequests((all) => all.filter((r) => (approve ? r.connectorId !== request.connectorId : r.id !== id)))
    toast(approve ? `${nameOf(request.connectorId)} allowed` : 'Request declined', { description: 'Demo only.' })
  }

  return (
    <Panel title="Connector policy" note="Allow list, rules and connector requests" wide>
      <div className="grid min-w-0 gap-3">
        <ConnectorPolicy
          connectors={POLICY_CONNECTORS}
          blocked={blocked}
          onBlockedChange={(id, off) => setBlocked((b) => (off ? [...b, id] : b.filter((x) => x !== id)))}
          customServers={customServers}
          onCustomServersChange={setCustomServers}
          approvalForWrites={approvalForWrites}
          onApprovalForWritesChange={setApprovalForWrites}
          requests={requests}
          onApprove={(id) => resolve(id, true)}
          onDecline={(id) => resolve(id, false)}
          now={now()}
        />
        {requests.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => {
              setBlocked(['crm', 'design-files'])
              setRequests(sampleConnectorRequests(now()))
            }}
          >
            Bring the requests back
          </Button>
        )}
      </div>
    </Panel>
  )
}

function ModelFeaturePanel() {
  const [models, setModels] = useState<string[]>(DEFAULT_ORG_POLICY.models)
  const [features, setFeatures] = useState<OrgPolicy['features']>(DEFAULT_ORG_POLICY.features)

  return (
    <Panel title="Model access and features" note="The default model and the last one on stay on">
      <ModelFeaturePolicy
        models={POLICY_MODELS}
        allowed={models}
        onAllowedChange={setModels}
        defaultModel={DEFAULT_MODEL}
        features={FEATURE_POLICIES.map((f) => ({ ...f, on: features[f.id] }))}
        onFeatureChange={(id, on) => setFeatures((all) => ({ ...all, [id as OrgFeature]: on }))}
      />
    </Panel>
  )
}

function RetentionPanel() {
  const [days, setDays] = useState<number | null>(90)
  const [optOut, setOptOut] = useState(true)
  const [legalHold, setLegalHold] = useState(false)
  const [lockedPlan, setLockedPlan] = useState(false)

  return (
    <Panel title="Retention policy" note="Shortening it asks first">
      <div className="grid min-w-0 gap-3">
        <RetentionPolicy
          retentionDays={days}
          onRetentionChange={setDays}
          trainingOptOut={optOut}
          onTrainingOptOutChange={setOptOut}
          trainingLockedNote={lockedPlan ? 'Always on for the Team plan: your data is never used to train models.' : undefined}
          legalHold={legalHold}
          onLegalHoldChange={setLegalHold}
          onExport={() => toast('Export started', { description: 'Demo only.' })}
        />
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setLockedPlan((l) => !l)}>
          {lockedPlan ? 'Unlock the training switch' : 'Lock it, as on the Team plan'}
        </Button>
      </div>
    </Panel>
  )
}
