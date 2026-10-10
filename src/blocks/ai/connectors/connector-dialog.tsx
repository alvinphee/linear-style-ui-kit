import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, ArrowDown01Icon, SquareLock02Icon, Tick02Icon, Unlink01Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatRelativeDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { useTimers } from '@/lib/use-timers'
import {
  CONNECTOR_CATEGORIES, ConnectorMark, ConnectorStatusLabel, type Connector, type ConnectorTool, type ToolPermission,
} from './connector-card'

// Connect or manage one connector, in a dialog.
//   Not connected: the consent step. What the app will be able to do (its
//     scopes), then Connect, which shows a short spinner while the app signs
//     in, then the connected view.
//   Connected: who it is connected as, when the assistant last used it, and
//     its tools, each with a tool permission (Always allow, Ask first, Off)
//     and "Set all" for every tool at once. Disconnect asks first.
//   Needs reconnecting: the connected view under a warning with Reconnect.
//   Disabled by admin: why it cannot be connected, and what it would do.
// The dialog changes nothing itself: every step is a callback, and the
// parent passes the connector back with its new status.

export const TOOL_PERMISSIONS: { value: ToolPermission; label: string; short: string; hint: string }[] = [
  { value: 'always', label: 'Always allow', short: 'Allow', hint: 'Uses it without asking' },
  { value: 'ask', label: 'Ask first', short: 'Ask', hint: 'Asks you each time' },
  { value: 'off', label: 'Off', short: 'Off', hint: 'Never uses it' },
]

const ON_TONE: Record<ToolPermission, string> = {
  always: 'data-[state=on]:text-status-done',
  ask: 'data-[state=on]:text-foreground',
  off: 'data-[state=on]:text-muted-foreground',
}

// A tool's permission as a compact segmented control. `label` names the tool
// for screen readers.
export function ToolPermissionControl({ value, onChange, label, disabled, className }: {
  value: ToolPermission
  onChange: (value: ToolPermission) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      // Clicking the chosen option would clear it; a tool always has one.
      onValueChange={(v) => v && onChange(v as ToolPermission)}
      aria-label={`Permission for ${label}`}
      disabled={disabled}
      className={cn('shrink-0', className)}
    >
      {TOOL_PERMISSIONS.map((p) => (
        <ToggleGroupItem
          key={p.value}
          value={p.value}
          aria-label={p.label}
          title={`${p.label}: ${p.hint.toLowerCase()}`}
          className={cn('px-2 text-[11px]', ON_TONE[p.value])}
        >
          {p.short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// "Set all" for every tool at once: shows the shared permission when they
// agree.
export function ToolPermissionSetAll({ tools, onSetAll, disabled }: {
  tools: ConnectorTool[]
  onSetAll: (permission: ToolPermission) => void
  disabled?: boolean
}) {
  const same = tools.length > 0 && tools.every((t) => t.permission === tools[0].permission) ? tools[0].permission : ''
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled || tools.length === 0} className="text-muted-foreground">
          Set all
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Every tool</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={same} onValueChange={(v) => onSetAll(v as ToolPermission)}>
          {TOOL_PERMISSIONS.map((p) => (
            <DropdownMenuRadioItem key={p.value} value={p.value}>
              <span className="grid">
                <span>{p.label}</span>
                <span className="text-muted-foreground text-[11px]">{p.hint}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ConnectorDialog({
  connector, open, onOpenChange, onConnect, onDisconnect, onPermissionChange, onSetAll, connectDelay = 900, className,
}: {
  connector: Connector | null
  open: boolean
  onOpenChange: (open: boolean) => void
  // Called once the short "signing in" wait is over (also for Reconnect).
  onConnect: (connector: Connector) => void
  // A custom connector is removed rather than disconnected; the words follow.
  onDisconnect: (connector: Connector) => void
  onPermissionChange: (connector: Connector, tool: string, permission: ToolPermission) => void
  // Every tool at once. Without it, onPermissionChange runs per tool.
  onSetAll?: (connector: Connector, permission: ToolPermission) => void
  // How long the spinner shows, in ms.
  connectDelay?: number
  className?: string
}) {
  // Keep showing the last connector while the dialog closes.
  const last = useRef(connector)
  if (connector) last.current = connector
  const c = connector ?? last.current

  const [connecting, setConnecting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { later, clearAll } = useTimers()

  useEffect(() => {
    if (open) return
    clearAll()
    setConnecting(false)
  }, [open, clearAll])

  if (!c) return null

  const connect = () => {
    setConnecting(true)
    later(() => {
      setConnecting(false)
      onConnect(c)
    }, connectDelay)
  }
  const setAll = (permission: ToolPermission) => {
    if (onSetAll) onSetAll(c, permission)
    else c.tools.forEach((t) => onPermissionChange(c, t.name, permission))
  }

  const linked = c.status === 'connected' || c.status === 'error'
  const removeWord = c.custom ? 'Remove' : 'Disconnect'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('flex max-h-[min(40rem,90vh)] flex-col gap-0 p-0 sm:max-w-lg', className)}>
        <DialogHeader className="flex-row items-start gap-3 border-b p-4 pr-10">
          <ConnectorMark connector={c} size="lg" />
          <div className="grid min-w-0 flex-1 gap-1">
            <DialogTitle className="truncate">{c.name}</DialogTitle>
            <DialogDescription className="text-[11px] leading-4">{c.description}</DialogDescription>
            <ConnectorStatusLabel connector={c} />
          </div>
        </DialogHeader>

        <div className="@container min-h-0 flex-1 overflow-y-auto">
          {c.status === 'disconnected' && <ConsentStep connector={c} />}
          {c.status === 'disabled' && <DisabledStep connector={c} />}
          {linked && (
            <div className="grid gap-4 p-4">
              {c.status === 'error' && (
                <div role="alert" className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3">
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-4 shrink-0" />
                  <p className="min-w-0 flex-1 basis-48 text-[11px] leading-4">
                    <span className="text-destructive font-medium">The sign-in has expired.</span>{' '}
                    <span className="text-muted-foreground">The assistant cannot use {c.name} until you reconnect it.</span>
                  </p>
                  <Button size="sm" variant="outline" onClick={connect} disabled={connecting}>
                    {connecting && <Spinner data-icon="inline-start" className="size-3" />}
                    {connecting ? 'Reconnecting…' : 'Reconnect'}
                  </Button>
                </div>
              )}
              <Details connector={c} />
              <ToolList connector={c} onChange={(tool, p) => onPermissionChange(c, tool, p)} onSetAll={setAll} />
            </div>
          )}
        </div>

        <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 border-t p-3 sm:justify-end">
          {c.status === 'disconnected' && (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={connecting}>Cancel</Button>
              <Button onClick={connect} disabled={connecting}>
                {connecting && <Spinner data-icon="inline-start" className="size-3.5" />}
                {connecting ? 'Connecting…' : `Connect ${c.name}`}
              </Button>
            </>
          )}
          {c.status === 'disabled' && <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>}
          {linked && (
            <>
              <Button variant="ghost" className="text-destructive hover:text-destructive mr-auto" onClick={() => setConfirming(true)}>
                <HugeiconsIcon icon={Unlink01Icon} strokeWidth={2} data-icon="inline-start" />
                {removeWord}
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <DeleteConfirm
        open={confirming}
        onOpenChange={setConfirming}
        size="sm"
        icon={Unlink01Icon}
        title={`${removeWord} ${c.name}?`}
        description={c.custom
          ? `The assistant stops using this server, and it leaves your list. You can add it again by its URL.`
          : `The assistant stops using ${c.name} in your chats. Your tool permissions are kept for when you connect it again.`}
        confirmLabel={removeWord}
        onConfirm={() => onDisconnect(c)}
      />
    </Dialog>
  )
}

function ConsentStep({ connector: c }: { connector: Connector }) {
  return (
    <div className="grid gap-4 p-4">
      <section className="grid gap-2">
        <h3 className="text-xs font-medium">{c.name} will be able to:</h3>
        <ul className="grid gap-1.5">
          {c.scopes.map((scope) => (
            <li key={scope} className="flex items-start gap-2 text-xs">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-status-done mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0">{scope}</span>
            </li>
          ))}
        </ul>
      </section>
      {c.tools.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-xs font-medium">Its tools</h3>
          <ul className="flex flex-wrap gap-1">
            {c.tools.map((t) => (
              <li key={t.name} title={t.description} className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                {t.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-muted-foreground bg-subtle rounded-lg border p-3 text-[11px] leading-4">
        You sign in to {c.name} in a new window. The assistant asks before it uses a tool, unless you allow it; you can
        change that for each tool after connecting, or disconnect at any time.
      </p>
    </div>
  )
}

function DisabledStep({ connector: c }: { connector: Connector }) {
  return (
    <div className="grid gap-4 p-4">
      <div className="bg-subtle flex items-start gap-3 rounded-lg border p-3">
        <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <p className="text-[11px] leading-4">
          <span className="font-medium">Your workspace admin has turned this connector off.</span>{' '}
          <span className="text-muted-foreground">Ask them to allow it if you need {c.name} in your chats.</span>
        </p>
      </div>
      <section className="grid gap-2">
        <h3 className="text-muted-foreground text-xs font-medium">If allowed, it could:</h3>
        <ul className="text-muted-foreground grid gap-1.5">
          {c.scopes.map((scope) => (
            <li key={scope} className="flex items-start gap-2 text-xs">
              <span aria-hidden className="bg-muted-foreground/50 mt-1.5 size-1 shrink-0 rounded-full" />
              <span className="min-w-0">{scope}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Details({ connector: c }: { connector: Connector }) {
  const rows = [
    c.account && { label: 'Account', value: c.account },
    c.url && { label: 'Server', value: <span className="font-mono text-[11px] break-all">{c.url}</span> },
    { label: 'Last used', value: c.lastUsed ? formatRelativeDate(new Date(c.lastUsed), { time: true }) : 'Not used yet' },
    { label: 'Category', value: CONNECTOR_CATEGORIES[c.custom ? 'custom' : c.category] },
    c.publisher && { label: 'Made by', value: c.publisher },
  ].filter(Boolean) as { label: string; value: ReactNode }[]
  return (
    <dl className="bg-card grid grid-cols-1 divide-y rounded-lg border">
      {rows.map((r) => (
        <div key={r.label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3 py-2">
          <dt className="text-muted-foreground text-[11px]">{r.label}</dt>
          <dd className="min-w-0 text-right text-xs">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ToolList({ connector: c, onChange, onSetAll }: {
  connector: Connector
  onChange: (tool: string, permission: ToolPermission) => void
  onSetAll: (permission: ToolPermission) => void
}) {
  const grouped = c.tools.some((t) => t.kind)
  const groups = grouped
    ? [
        { title: 'Read-only tools', tools: c.tools.filter((t) => t.kind !== 'write') },
        { title: 'Tools that make changes', tools: c.tools.filter((t) => t.kind === 'write') },
      ].filter((g) => g.tools.length > 0)
    : [{ title: null, tools: c.tools }]
  const allowed = c.tools.filter((t) => t.permission === 'always').length
  const off = c.tools.filter((t) => t.permission === 'off').length

  return (
    <section aria-labelledby={`${c.id}-tools`} className="grid gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          <h3 id={`${c.id}-tools`} className="text-xs font-medium">Tools</h3>
          <p className="text-muted-foreground text-[11px] leading-4">
            {c.tools.length === 0
              ? 'This server lists no tools yet.'
              : [plural(c.tools.length, 'tool'), allowed ? `${allowed} always allowed` : null, off ? `${off} off` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <ToolPermissionSetAll tools={c.tools} onSetAll={onSetAll} />
      </div>
      {groups.map((g) => g.tools.length > 0 && (
        <div key={g.title ?? 'all'} className="grid gap-1">
          {g.title && <h4 className="text-muted-foreground px-0.5 text-[11px]">{g.title}</h4>}
          <ul className="bg-card divide-y rounded-lg border">
            {g.tools.map((t) => (
              <li key={t.name} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
                <div className={cn('grid min-w-0 flex-1 basis-40 gap-0.5', t.permission === 'off' && 'opacity-60')}>
                  <code className="truncate font-mono text-[11px]">{t.name}</code>
                  <p className="text-muted-foreground text-[11px] leading-4">{t.description}</p>
                </div>
                <ToolPermissionControl value={t.permission} label={t.name} onChange={(p) => onChange(t.name, p)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
