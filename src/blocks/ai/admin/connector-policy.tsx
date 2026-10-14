import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, SquareLock02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { CONNECTOR_CATEGORIES, ConnectorMark, type Connector } from '@/blocks/ai/connectors/connector-card'
import { DeleteConfirm } from '@/components/delete-confirm'
import { UserAvatar } from '@/components/person'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { formatAgo } from '@/lib/format'
import { plural } from '@/lib/text'

// The organisation's connector policy, as an admin sets it: the allow list
// (each connector Allowed or Blocked for everyone, with how many people use
// it), whether people may add their own remote MCP servers, whether tools
// that send or change things always ask first, and connector requests:
// people asking to allow a blocked connector, to approve or decline.
//
// Blocking a connector people already use asks first, since it stops
// working in their chats at once.

export type PolicyConnector = Pick<Connector, 'id' | 'name' | 'category' | 'icon' | 'colour'> & {
  // People in the organisation who have it connected.
  users?: number
}

export type ConnectorRequest = {
  id: string
  connectorId: string
  // The person asking, by name.
  requester: string
  // Why they need it, in their words.
  reason: string
  // When they asked: an ISO date or ms.
  at: string | number
}

export function ConnectorPolicy({
  connectors, blocked, onBlockedChange, customServers, onCustomServersChange, approvalForWrites,
  onApprovalForWritesChange, requests, onApprove, onDecline, now, className,
}: {
  connectors: PolicyConnector[]
  // Ids of the connectors blocked for everyone.
  blocked: string[]
  onBlockedChange: (id: string, blocked: boolean) => void
  customServers: boolean
  onCustomServersChange: (on: boolean) => void
  approvalForWrites: boolean
  onApprovalForWritesChange: (on: boolean) => void
  requests: ConnectorRequest[]
  // Also answers a request for a connector allowed since (Mark done).
  onApprove: (id: string) => void
  onDecline: (id: string) => void
  // The clock request times are relative to (a demo clock). Now when left out.
  now?: number
  className?: string
}) {
  const id = useId()
  const [confirming, setConfirming] = useState<PolicyConnector | null>(null)
  const isBlocked = (c: PolicyConnector) => blocked.includes(c.id)
  const allowedCount = connectors.filter((c) => !isBlocked(c)).length

  const toggle = (c: PolicyConnector, allow: boolean) => {
    if (!allow && (c.users ?? 0) > 0) setConfirming(c)
    else onBlockedChange(c.id, !allow)
  }

  return (
    <div className={cn('grid min-w-0 gap-6', className)}>
      <SettingsGroup
        title="Connector requests"
        description="People asking to use a connector that is blocked. Approving one allows it for everyone."
        action={requests.length > 0 && <Badge variant="secondary" className="tabular-nums">{requests.length} pending</Badge>}
      >
        {requests.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-[11px]">No requests waiting.</p>
        ) : (
          <ul className="divide-y" aria-label="Connector requests">
            {requests.map((r) => {
              const connector = connectors.find((c) => c.id === r.connectorId)
              const name = connector?.name ?? r.connectorId
              return (
                <li key={r.id} className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5">
                  <UserAvatar name={r.requester} className="mt-0.5 size-6" />
                  <div className="grid min-w-0 flex-1 basis-48 gap-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                      <span className="font-medium">{r.requester}</span>
                      <span className="text-muted-foreground">asks to allow</span>
                      <span className="inline-flex min-w-0 items-center gap-1.5 font-medium">
                        {connector && <ConnectorMark connector={connector} size="sm" />}
                        {name}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-4">“{r.reason}”</p>
                    <p className="text-muted-foreground text-[11px]">{formatAgo(new Date(r.at).getTime(), now)}</p>
                  </div>
                  {/* Allowed since they asked: nothing left to decide, only to answer. */}
                  {blocked.includes(r.connectorId) ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => onDecline(r.id)} aria-label={`Decline ${r.requester}'s request for ${name}`}>
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} data-icon="inline-start" /> Decline
                      </Button>
                      <Button size="sm" onClick={() => onApprove(r.id)} aria-label={`Approve ${r.requester}'s request for ${name}`}>
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" /> Approve
                      </Button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px]">Already allowed</span>
                      <Button variant="outline" size="sm" onClick={() => onApprove(r.id)} aria-label={`Mark ${r.requester}'s request for ${name} done`}>
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" /> Mark done
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </SettingsGroup>

      <SettingsGroup
        title="Allow list"
        description="Connectors people may connect. A blocked one shows as Disabled by admin and its tools stop working in every chat."
        action={<span className="text-muted-foreground text-[11px] tabular-nums">{allowedCount} of {connectors.length} allowed</span>}
        className="@container"
      >
        <ul className="divide-y" aria-label="Connectors">
          {connectors.map((c) => {
            const off = isBlocked(c)
            const switchId = `${id}-${c.id}`
            return (
              <li key={c.id} className="flex min-w-0 items-center gap-3 px-3 py-2">
                <ConnectorMark connector={c} />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-xs font-medium">{c.name}</span>
                    <span className="text-muted-foreground hidden shrink-0 text-[11px] @sm:inline">{CONNECTOR_CATEGORIES[c.category]}</span>
                  </span>
                  <span className="text-muted-foreground truncate text-[11px] tabular-nums">
                    {c.users ? `Used by ${plural(c.users, 'person', 'people')}` : 'Not used yet'}
                  </span>
                </div>
                <label
                  htmlFor={switchId}
                  className={cn(
                    'inline-flex shrink-0 cursor-pointer items-center gap-1 text-[11px]',
                    off ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {off && <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} aria-hidden="true" className="size-3" />}
                  {off ? 'Blocked' : 'Allowed'}
                </label>
                <Switch
                  id={switchId}
                  checked={!off}
                  onCheckedChange={(allow) => toggle(c, allow)}
                  aria-label={`Allow ${c.name}`}
                />
              </li>
            )
          })}
        </ul>
      </SettingsGroup>

      <SettingsGroup title="Rules">
        <SettingsRow
          label="Allow custom MCP servers"
          hint="People may add their own remote MCP servers as connectors. Off: only the connectors above."
          htmlFor={`${id}-custom`}
        >
          <Switch id={`${id}-custom`} checked={customServers} onCheckedChange={onCustomServersChange} />
        </SettingsRow>
        <SettingsRow
          label="Tools that send or change things always ask first"
          hint="Overrides each person's Always allow: the assistant asks before it sends a message, books a meeting or changes a record. Tools that only look things up are not affected."
          htmlFor={`${id}-writes`}
        >
          <Switch id={`${id}-writes`} checked={approvalForWrites} onCheckedChange={onApprovalForWritesChange} />
        </SettingsRow>
      </SettingsGroup>

      <DeleteConfirm
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        icon={SquareLock02Icon}
        title={`Block ${confirming?.name ?? 'this connector'}?`}
        description={confirming && `${plural(confirming.users ?? 0, 'person', 'people')} use it. It stops working in their chats at once, and they can ask you to allow it again.`}
        confirmLabel="Block"
        onConfirm={() => confirming && onBlockedChange(confirming.id, true)}
      />
    </div>
  )
}
