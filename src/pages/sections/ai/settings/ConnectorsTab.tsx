import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { SettingsHeader } from '@/blocks/settings-page'
import type { Connector, ToolPermission } from '@/blocks/ai/connectors/connector-card'
import { ConnectorCatalogue } from '@/blocks/ai/connectors/connector-catalogue'
import { ConnectorDialog } from '@/blocks/ai/connectors/connector-dialog'
import { CustomConnectorDialog, type ConnectorAuth, type CustomConnectorInput } from '@/blocks/ai/connectors/custom-connector-dialog'
import { Button } from '@/components/ui/button'
import { CONNECTORS, CONNECTORS_KEY, CUSTOM_COLOUR, CUSTOM_ICON, CUSTOM_TOOLS, DEFAULT_ACCOUNT } from './connectors-data'
import { useStoredState } from './prefs'

// Settings › Connectors: the catalogue of apps the assistant can use, with
// the connect and manage dialogs. What is connected, each tool's permission
// and the custom connectors are kept in this browser; the apps themselves
// come from connectors-data.

type Connection = { status: 'connected' | 'error'; account?: string; lastUsed?: string }

// A custom connector as kept: never its API key, only that it has one.
type StoredCustom = {
  id: string
  name: string
  url: string
  description?: string
  auth: ConnectorAuth
  header?: string
  addedAt: string
}

type ConnectorsState = {
  connections: Record<string, Connection>
  // Per connector, per tool: what the user chose. Kept after a disconnect.
  permissions: Record<string, Record<string, ToolPermission>>
  custom: StoredCustom[]
}

const INITIAL: ConnectorsState = {
  connections: Object.fromEntries(
    CONNECTORS
      .filter((c) => c.status === 'connected' || c.status === 'error')
      .map((c) => [c.id, { status: c.status as Connection['status'], account: c.account, lastUsed: c.lastUsed }]),
  ),
  permissions: {},
  custom: [],
}

const AUTH_WORDS: Record<ConnectorAuth, string> = {
  none: 'No sign-in',
  oauth: 'Signed in with OAuth',
  'api-key': 'API key',
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function customConnector(c: StoredCustom): Connector {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? `Remote MCP server at ${hostOf(c.url)}.`,
    category: 'custom',
    custom: true,
    url: c.url,
    icon: CUSTOM_ICON,
    colour: CUSTOM_COLOUR,
    status: 'connected',
    account: c.auth === 'api-key' && c.header ? `${AUTH_WORDS[c.auth]} in ${c.header}` : AUTH_WORDS[c.auth],
    scopes: ['Receive what the assistant sends its tools', 'Answer with text that goes into your chats'],
    tools: CUSTOM_TOOLS,
  }
}

// Every connector as the user has it now (connected or not, their tool
// permissions, their custom ones). Projects read the same, so a connector
// connected here can be switched on in a project at once.
export function useConnectors() {
  const [state, setState] = useStoredState<ConnectorsState>(CONNECTORS_KEY, INITIAL)
  const connectors = useMemo(() => {
    const withPermissions = (c: Connector): Connector => {
      const chosen = state.permissions[c.id]
      return chosen ? { ...c, tools: c.tools.map((t) => ({ ...t, permission: chosen[t.name] ?? t.permission })) } : c
    }
    const builtIn = CONNECTORS.map((c): Connector => {
      if (c.status === 'disabled') return c
      const link = state.connections[c.id]
      return withPermissions({
        ...c,
        status: link?.status ?? 'disconnected',
        account: link?.account,
        lastUsed: link?.lastUsed,
      })
    })
    return [...builtIn, ...state.custom.map((c) => withPermissions(customConnector(c)))]
  }, [state])
  return { connectors, state, setState }
}

export function ConnectorsTab() {
  const { connectors, setState } = useConnectors()
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const open = connectors.find((c) => c.id === openId) ?? null

  const connect = (c: Connector) => {
    const again = c.status === 'error'
    setState((s) => ({
      ...s,
      connections: { ...s.connections, [c.id]: { status: 'connected', account: c.account ?? DEFAULT_ACCOUNT, lastUsed: c.lastUsed } },
    }))
    toast.success(again ? `${c.name} reconnected` : `${c.name} connected`, {
      description: 'The assistant can use it in your chats.',
    })
  }

  const disconnect = (c: Connector) => {
    setOpenId(null)
    if (c.custom) {
      setState((s) => {
        const { [c.id]: _, ...permissions } = s.permissions
        return { ...s, permissions, custom: s.custom.filter((x) => x.id !== c.id) }
      })
      toast(`${c.name} removed`)
      return
    }
    setState((s) => {
      const { [c.id]: _, ...connections } = s.connections
      return { ...s, connections }
    })
    toast(`${c.name} disconnected`, { description: 'Its tool permissions are kept for next time.' })
  }

  const setPermissions = (c: Connector, change: Record<string, ToolPermission>) =>
    setState((s) => ({ ...s, permissions: { ...s.permissions, [c.id]: { ...s.permissions[c.id], ...change } } }))

  const add = (input: CustomConnectorInput) => {
    // input.apiKey is dropped here: the mockup has no server to keep it on.
    const id = `custom-${Date.now().toString(36)}`
    setState((s) => ({
      ...s,
      custom: [
        ...s.custom,
        { id, name: input.name, url: input.url, description: input.description, auth: input.auth, header: input.header, addedAt: new Date().toISOString() },
      ],
    }))
    toast.success(`${input.name} added`, {
      description: 'Its tools ask before they run.',
      action: { label: 'Manage', onClick: () => setOpenId(id) },
    })
  }

  return (
    <>
      <SettingsHeader
        title="Connectors"
        description="Let the assistant use your other apps. It asks before it acts, unless you allow a tool."
        action={(
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
            Custom connector
          </Button>
        )}
      />
      <ConnectorCatalogue connectors={connectors} onOpen={(c) => setOpenId(c.id)} onAddCustom={() => setAdding(true)} />
      <ConnectorDialog
        connector={open}
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        onConnect={connect}
        onDisconnect={disconnect}
        onPermissionChange={(c, tool, permission) => setPermissions(c, { [tool]: permission })}
        onSetAll={(c, permission) => setPermissions(c, Object.fromEntries(c.tools.map((t) => [t.name, permission])))}
      />
      <CustomConnectorDialog
        open={adding}
        onOpenChange={setAdding}
        onAdd={add}
        existingNames={connectors.map((c) => c.name)}
      />
    </>
  )
}
