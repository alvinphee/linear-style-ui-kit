import { toast } from 'sonner'
import { SettingsHeader } from '@/blocks/settings-page'
import { ConnectorPolicy, type ConnectorRequest, type PolicyConnector } from '@/blocks/ai/admin/connector-policy'
import { DAY, MINUTE, now } from '../data'
import { CONNECTORS } from '../settings/connectors-data'
import { useStoredState } from '../settings/prefs'
import { ORG, useOrgPolicy } from './org'

// Admin console › Connectors: the organisation's allow list, its rules for
// custom servers and tools that change things, and connector requests from
// members. Written to the org policy; the requests are kept in this browser.

export const CONNECTOR_REQUESTS_KEY = 'linear-kit:ai-org-connector-requests:v1'

// How many members have each connector connected (made up).
const USERS: Record<string, number> = {
  'cloud-drive': 21, mail: 18, calendar: 17, 'team-chat': 14, 'code-repository': 9, 'issue-tracker': 11, wiki: 8,
  crm: 0, 'data-warehouse': 4, spreadsheets: 12, 'design-files': 0, 'support-desk': 6, 'web-browser': 3, 'meeting-notes': 7,
}

export const POLICY_CONNECTORS: PolicyConnector[] = CONNECTORS.map((c) => ({
  id: c.id, name: c.name, category: c.category, icon: c.icon, colour: c.colour, users: USERS[c.id] ?? 0,
}))

export function sampleConnectorRequests(time = now()): ConnectorRequest[] {
  return [
    {
      id: 'req-crm', connectorId: 'crm', requester: 'Priya Nair',
      reason: 'To look up accounts before calls', at: new Date(time - 3 * 60 * MINUTE).toISOString(),
    },
    {
      id: 'req-design', connectorId: 'design-files', requester: 'Sam Lee',
      reason: 'To pull frames into specs and release notes', at: new Date(time - DAY - 20 * MINUTE).toISOString(),
    },
  ]
}

export function ConnectorsPolicyTab() {
  const { policy, setPolicy } = useOrgPolicy()
  const [requests, setRequests] = useStoredState<ConnectorRequest[]>(CONNECTOR_REQUESTS_KEY, sampleConnectorRequests())
  const { connectors } = policy
  const nameOf = (id: string) => CONNECTORS.find((c) => c.id === id)?.name ?? id

  const setConnectors = (change: Partial<typeof connectors>) =>
    setPolicy((p) => ({ ...p, connectors: { ...p.connectors, ...change } }))

  const setBlocked = (id: string, blocked: boolean) => {
    setPolicy((p) => ({
      ...p,
      connectors: {
        ...p.connectors,
        blocked: blocked ? [...new Set([...p.connectors.blocked, id])] : p.connectors.blocked.filter((b) => b !== id),
      },
    }))
    // Allowing a connector answers anyone who asked for it.
    if (!blocked) setRequests((all) => all.filter((r) => r.connectorId !== id))
    toast(blocked ? `${nameOf(id)} blocked` : `${nameOf(id)} allowed`, {
      description: blocked ? 'It shows as Disabled by admin for everyone.' : 'Anyone in the organisation can connect it.',
    })
  }

  const approve = (id: string) => {
    const request = requests.find((r) => r.id === id)
    if (!request) return
    setPolicy((p) => ({ ...p, connectors: { ...p.connectors, blocked: p.connectors.blocked.filter((b) => b !== request.connectorId) } }))
    setRequests((all) => all.filter((r) => r.connectorId !== request.connectorId))
    const name = nameOf(request.connectorId)
    if (connectors.blocked.includes(request.connectorId)) {
      toast.success(`${name} allowed`, { description: `${request.requester} can connect it now.` })
    } else {
      toast(`${request.requester} is told ${name} is allowed`, { description: 'Demo only.' })
    }
  }

  const decline = (id: string) => {
    const request = requests.find((r) => r.id === id)
    if (!request) return
    setRequests((all) => all.filter((r) => r.id !== id))
    toast(`Request declined`, { description: `${request.requester} is told ${nameOf(request.connectorId)} stays blocked. Demo only.` })
  }

  return (
    <>
      <SettingsHeader
        title="Connectors"
        description={`Which apps people in ${ORG.name} may connect the assistant to, and how far its tools may go.`}
      />
      <ConnectorPolicy
        connectors={POLICY_CONNECTORS}
        blocked={connectors.blocked}
        onBlockedChange={setBlocked}
        customServers={connectors.customServers}
        onCustomServersChange={(on) => {
          setConnectors({ customServers: on })
          toast(on ? 'Custom MCP servers allowed' : 'Custom MCP servers turned off', {
            description: on ? 'People can add their own remote servers.' : 'Custom connectors stop working for everyone.',
          })
        }}
        approvalForWrites={connectors.approvalForWrites}
        onApprovalForWritesChange={(on) => setConnectors({ approvalForWrites: on })}
        requests={requests}
        onApprove={approve}
        onDecline={decline}
        now={now()}
      />
    </>
  )
}
