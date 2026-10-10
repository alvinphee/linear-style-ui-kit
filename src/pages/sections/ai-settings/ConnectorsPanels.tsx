import { useState } from 'react'
import { toast } from 'sonner'
import type { Connector, ConnectorStatus, ToolPermission } from '@/blocks/ai/connectors/connector-card'
import { ConnectorCard } from '@/blocks/ai/connectors/connector-card'
import { ConnectorCatalogue } from '@/blocks/ai/connectors/connector-catalogue'
import { ConnectorDialog } from '@/blocks/ai/connectors/connector-dialog'
import { CustomConnectorDialog } from '@/blocks/ai/connectors/custom-connector-dialog'
import { Button } from '@/components/ui/button'
import { CONNECTORS, DEFAULT_ACCOUNT } from '../ai/settings/connectors-data'
import { Panel, Row } from '../shared'

// The connector blocks on the kit page: the card in every status and both
// variants, the catalogue live, and the dialogs. Changes stay in each panel
// and reset on reload; the AI chat app's Settings keeps its own.

const byId = (id: string) => CONNECTORS.find((c) => c.id === id)!

// One of each status.
const EXAMPLES: Connector[] = [byId('cloud-drive'), byId('team-chat'), byId('calendar'), byId('crm')]

// Connectors in local state, with the manage dialog wired to them.
function useDemoConnectors(initial: Connector[]) {
  const [connectors, setConnectors] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = connectors.find((c) => c.id === openId) ?? null

  const patch = (id: string, change: (c: Connector) => Connector) =>
    setConnectors((list) => list.map((c) => (c.id === id ? change(c) : c)))
  const setStatus = (c: Connector, status: ConnectorStatus) =>
    patch(c.id, (x) => ({ ...x, status, account: status === 'connected' ? x.account ?? DEFAULT_ACCOUNT : undefined }))
  const setPermission = (c: Connector, tools: string[], permission: ToolPermission) =>
    patch(c.id, (x) => ({ ...x, tools: x.tools.map((t) => (tools.includes(t.name) ? { ...t, permission } : t)) }))

  const dialog = (
    <ConnectorDialog
      connector={open}
      open={!!open}
      onOpenChange={(o) => !o && setOpenId(null)}
      onConnect={(c) => {
        setStatus(c, 'connected')
        toast.success(`${c.name} connected`, { description: 'Demo only: nothing was signed in.' })
      }}
      onDisconnect={(c) => {
        setOpenId(null)
        setStatus(c, 'disconnected')
        toast(`${c.name} disconnected`, { description: 'Demo only.' })
      }}
      onPermissionChange={(c, tool, p) => setPermission(c, [tool], p)}
      onSetAll={(c, p) => setPermission(c, c.tools.map((t) => t.name), p)}
    />
  )
  return { connectors, open: setOpenId, dialog }
}

function CardsPanel() {
  const { connectors, open, dialog } = useDemoConnectors(EXAMPLES)
  return (
    <Panel title="Connector card" note="Connected, not connected, needs reconnecting, disabled by admin">
      <ul className="@container grid grid-cols-1 gap-2 @md:grid-cols-2">
        {connectors.map((c) => (
          <li key={c.id} className="grid min-w-0">
            <ConnectorCard connector={c} onOpen={() => open(c.id)} />
          </li>
        ))}
      </ul>
      {dialog}
    </Panel>
  )
}

function RowsPanel() {
  const { connectors, open, dialog } = useDemoConnectors(EXAMPLES)
  return (
    <Panel title="Connector card, row variant" note="For a list; put the rows in a divide-y box">
      <ul className="@container bg-card divide-y rounded-lg border">
        {connectors.map((c) => (
          <li key={c.id} className="min-w-0 first:rounded-t-lg last:rounded-b-lg">
            <ConnectorCard variant="row" connector={c} onOpen={() => open(c.id)} className="rounded-[inherit]" />
          </li>
        ))}
      </ul>
      {dialog}
    </Panel>
  )
}

function CatalogueAndDialogs() {
  const { connectors, open, dialog } = useDemoConnectors(CONNECTORS)
  const [adding, setAdding] = useState(false)
  const first = (status: ConnectorStatus) => connectors.find((c) => c.status === status)

  return (
    <>
      <Panel wide title="Connector catalogue" note="Search, filter chips, grid or list, and the custom connector tile">
        <ConnectorCatalogue connectors={connectors} onOpen={(c) => open(c.id)} onAddCustom={() => setAdding(true)} />
      </Panel>

      <Panel title="Connector dialog" note="Consent step, tools and their permissions, disconnect">
        <p className="text-muted-foreground mb-3 text-[11px] leading-4">
          Opens on the catalogue above, so a change shows there too.
        </p>
        <Row>
          {(
            [
              ['connected', 'Manage a connected app'],
              ['disconnected', 'Connect an app'],
              ['error', 'Needs reconnecting'],
              ['disabled', 'Disabled by admin'],
            ] as const
          ).map(([status, label]) => {
            const c = first(status)
            return (
              <Button key={status} variant="outline" size="sm" disabled={!c} onClick={() => c && open(c.id)}>
                {label}
              </Button>
            )
          })}
        </Row>
      </Panel>

      <Panel title="Custom connector dialog" note="A remote MCP server: name, URL, authentication">
        <Row>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>Add custom connector</Button>
        </Row>
        <p className="text-muted-foreground mt-3 text-[11px] leading-4">
          Try an http:// address to see the error. The API key is a password field and is never shown again.
        </p>
      </Panel>

      {dialog}
      <CustomConnectorDialog
        open={adding}
        onOpenChange={setAdding}
        existingNames={connectors.map((c) => c.name)}
        onAdd={(input) => toast.success(`${input.name} added`, { description: `Demo only: ${input.url}` })}
      />
    </>
  )
}

export function ConnectorsPanels() {
  return (
    <>
      <CardsPanel />
      <RowsPanel />
      <CatalogueAndDialogs />
    </>
  )
}
