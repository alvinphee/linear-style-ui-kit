import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Alert02Icon, ArrowRight01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconMark, LetterMark } from '@/components/mark'
import { Button } from '@/components/ui/button'
import { initials } from '@/lib/text'

// One connector: an outside app the assistant can use through its tools
// (read files, search mail, create issues). A mark, the app's name, a line
// on what it does, its category and its status, with the next step as a
// button: Connect, Manage or Reconnect. A connector the admin has turned
// off has no button; the card still opens, to say why.
//
// Two variants: `card` for a grid, `row` for a list (put rows in a
// `divide-y` box). The whole card opens the connector (onOpen); the button
// does the same unless `onAction` is given.

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'disabled'

// The catalogue's filter chips follow these, in this order.
export type ConnectorCategory = 'files' | 'communication' | 'productivity' | 'development' | 'data' | 'sales' | 'custom'

export const CONNECTOR_CATEGORIES: Record<ConnectorCategory, string> = {
  files: 'Files',
  communication: 'Communication',
  productivity: 'Productivity',
  development: 'Development',
  data: 'Data',
  sales: 'Sales',
  custom: 'Custom',
}

// What the assistant may do with a tool: use it without asking, ask each
// time, or never use it.
export type ToolPermission = 'always' | 'ask' | 'off'

export type ConnectorTool = {
  // The tool's name as the server gives it, such as "search_files".
  name: string
  description: string
  permission: ToolPermission
  // read: only looks things up. write: changes or sends something.
  kind?: 'read' | 'write'
}

export type Connector = {
  id: string
  name: string
  description: string
  category: ConnectorCategory
  status: ConnectorStatus
  // The mark: an icon on a tint, or the name's initials on a solid colour.
  icon?: IconSvgElement
  // A CSS colour from the theme, such as var(--chart-2).
  colour?: string
  // Who it is connected as: an email, a workspace.
  account?: string
  // When the assistant last used it (ISO date).
  lastUsed?: string
  // What connecting allows, shown before connecting: "Read your files".
  scopes: string[]
  tools: ConnectorTool[]
  // Added by the user as a remote MCP server.
  custom?: boolean
  // A custom connector's server URL.
  url?: string
  // Who makes it, for the dialog: "Made by Acme".
  publisher?: string
}

export function ConnectorMark({ connector, size = 'md', className }: {
  connector: Pick<Connector, 'name' | 'icon' | 'colour'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const colour = connector.colour ?? 'var(--brand)'
  return connector.icon
    ? <IconMark icon={connector.icon} colour={colour} size={size} className={className} />
    : <LetterMark text={initials(connector.name)} colour={colour} size={size} className={className} />
}

// The status in words: "Connected · alex@example.com", "Needs reconnecting".
export function ConnectorStatusLabel({ connector, className }: {
  connector: Pick<Connector, 'status' | 'account'>
  className?: string
}) {
  const { status, account } = connector
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-[11px]',
        status === 'error' ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      {status === 'connected' && <span aria-hidden className="bg-status-done size-1.5 shrink-0 rounded-full" />}
      {status === 'disconnected' && <span aria-hidden className="border-muted-foreground/60 size-1.5 shrink-0 rounded-full border" />}
      {status === 'error' && <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 shrink-0" />}
      {status === 'disabled' && <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} className="size-3 shrink-0" />}
      <span className="truncate">
        {status === 'connected' && (account ? <>Connected · {account}</> : 'Connected')}
        {status === 'disconnected' && 'Not connected'}
        {status === 'error' && 'Needs reconnecting'}
        {status === 'disabled' && 'Disabled by admin'}
      </span>
    </span>
  )
}

// The button's word for each status.
export const CONNECTOR_ACTION: Record<ConnectorStatus, string | null> = {
  connected: 'Manage',
  disconnected: 'Connect',
  error: 'Reconnect',
  disabled: null,
}

export function ConnectorCard({ connector, variant = 'card', onOpen, onAction, action, className }: {
  connector: Connector
  variant?: 'card' | 'row'
  onOpen?: () => void
  // The button, when it should do something other than open the card.
  onAction?: () => void
  // Replaces the button.
  action?: ReactNode
  className?: string
}) {
  const label = CONNECTOR_ACTION[connector.status]
  const button = action ?? (label && (onAction ?? onOpen) && (
    <Button
      variant={connector.status === 'disconnected' ? 'default' : 'outline'}
      size="sm"
      aria-label={`${label} ${connector.name}`}
      onClick={onAction ?? onOpen}
    >
      {label}
    </Button>
  ))

  // The name is the card's button; its ::after covers the whole card, and
  // the action button sits above it.
  const name = onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'focus-visible:ring-ring/40 min-w-0 truncate rounded text-left outline-none focus-visible:ring-2',
        'after:absolute after:inset-0',
        variant === 'card' ? 'after:rounded-lg' : 'after:rounded-[inherit]',
      )}
    >
      {connector.name}
    </button>
  ) : <span className="truncate">{connector.name}</span>
  const category = CONNECTOR_CATEGORIES[connector.category]

  if (variant === 'row') {
    return (
      <div
        data-status={connector.status}
        className={cn(
          'group/connector relative flex min-w-0 items-center gap-3 px-3 py-2.5',
          onOpen && 'hover:bg-accent/40 transition-colors',
          className,
        )}
      >
        <ConnectorMark connector={connector} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <h4 className="flex min-w-0 text-xs font-medium">{name}</h4>
            <span className="text-muted-foreground hidden shrink-0 text-[11px] @md:inline">{category}</span>
          </div>
          <p className="text-muted-foreground truncate text-[11px]">{connector.description}</p>
          <ConnectorStatusLabel connector={connector} />
        </div>
        <div className="relative z-[1] flex shrink-0 items-center">
          {button || (onOpen && (
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden className="text-muted-foreground size-3.5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      data-status={connector.status}
      className={cn(
        'bg-card relative grid min-w-0 content-start gap-2.5 rounded-lg border p-3',
        onOpen && 'hover:border-foreground/15 transition-colors',
        connector.status === 'error' && 'border-destructive/30',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <ConnectorMark connector={connector} />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h4 className="flex min-w-0 text-xs font-medium">{name}</h4>
          <span className="text-muted-foreground truncate text-[11px]">{category}</span>
        </div>
        {button && <div className="relative z-[1] shrink-0">{button}</div>}
      </div>
      <p className="text-muted-foreground line-clamp-2 min-h-8 text-[11px] leading-4">{connector.description}</p>
      <ConnectorStatusLabel connector={connector} />
    </div>
  )
}
