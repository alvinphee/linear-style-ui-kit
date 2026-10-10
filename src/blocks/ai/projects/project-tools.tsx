import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowRight01Icon, Settings02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { ConnectorCard, type Connector, type ToolPermission } from '@/blocks/ai/connectors/connector-card'
import { TOOL_PERMISSIONS } from '@/blocks/ai/connectors/connector-dialog'
import { MemoryManager, type Memory } from '@/blocks/ai/memory/memory-manager'
import { SKILL_SOURCES, SkillMark, type Skill, type SkillSource } from '@/blocks/ai/skills/skill-card'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'

// A project's Tools tab: what chats in this project may use. Three parts,
// each a titled card like the settings page's:
//   ProjectConnectors  each connector you have connected, with a switch to
//                      use it here. A row opens on its tools and their
//                      permission, which is set in Settings, not here.
//                      Connectors not connected fold under Not connected,
//                      with a way to Settings; ones the admin turned off
//                      show greyed.
//   ProjectSkills      a switch per skill, by source. Only skills on in your
//                      settings can be used; the rest say so.
//   ProjectMemory      project memory on or off, and what it has learned.
//                      It stays in the project, apart from your own memory.
// Nothing changes here by itself: every switch is a callback.

// The way to Settings: a link (settingsHref) or your own handler.
type SettingsLink = {
  // Where Settings is, such as '#/templates/ai-chat/settings/connectors'.
  settingsHref?: string
  onOpenSettings?: () => void
}

function ToSettings({ settingsHref, onOpenSettings, children, label }: SettingsLink & { children: ReactNode; label?: string }) {
  if (settingsHref) {
    return (
      <Button asChild variant="outline" size="sm" aria-label={label}>
        <a href={settingsHref}>{children}</a>
      </Button>
    )
  }
  if (onOpenSettings) {
    return <Button variant="outline" size="sm" aria-label={label} onClick={onOpenSettings}>{children}</Button>
  }
  return null
}

// A tool's permission, read only: the words, in the tone of the control
// that sets it.
const PERMISSION_TONE: Record<ToolPermission, string> = {
  always: 'text-status-done',
  ask: 'text-foreground',
  off: 'text-muted-foreground',
}

function PermissionLabel({ permission }: { permission: ToolPermission }) {
  const p = TOOL_PERMISSIONS.find((x) => x.value === permission)!
  return (
    <span title={p.hint} className={cn('shrink-0 text-[11px] font-medium', PERMISSION_TONE[permission])}>
      {p.label}
    </span>
  )
}

export type ProjectConnectorsProps = SettingsLink & {
  // Every connector, in any status. Connected ones (and ones that need
  // reconnecting) can be switched on for the project.
  connectors: Connector[]
  // Which are on in this project, by connector id.
  enabled: Record<string, boolean>
  onEnabledChange: (id: string, on: boolean) => void
  // Opens a connector's settings, for Change in Settings and Reconnect.
  onManage?: (id: string) => void
  className?: string
}

export function ProjectConnectors({
  connectors, enabled, onEnabledChange, onManage, settingsHref, onOpenSettings, className,
}: ProjectConnectorsProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [restOpen, setRestOpen] = useState(false)
  const usable = connectors.filter((c) => c.status === 'connected' || c.status === 'error')
  const rest = connectors.filter((c) => c.status === 'disconnected' || c.status === 'disabled')
  const on = usable.filter((c) => enabled[c.id]).length
  const link = { settingsHref, onOpenSettings }

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      <SettingsGroup
        title="Connectors"
        description={usable.length
          ? `Apps chats in this project may use. ${on} of ${usable.length} on.`
          : 'Apps chats in this project may use.'}
        className="@container"
      >
        {usable.map((c) => {
          const open = openId === c.id
          return (
            <Collapsible key={c.id} open={open} onOpenChange={(o) => setOpenId(o ? c.id : null)}>
              <ConnectorCard
                connector={c}
                variant="row"
                action={(
                  <div className="flex items-center gap-1.5">
                    {c.status === 'error' && onManage && (
                      <Button variant="outline" size="sm" aria-label={`Reconnect ${c.name}`} onClick={() => onManage(c.id)}>
                        Reconnect
                      </Button>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon-xs" aria-label={`${open ? 'Hide' : 'Show'} ${c.name} tools`} className="text-muted-foreground">
                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className={cn('transition-transform', !open && '-rotate-90')} />
                      </Button>
                    </CollapsibleTrigger>
                    <Switch
                      checked={!!enabled[c.id]}
                      onCheckedChange={(v) => onEnabledChange(c.id, v)}
                      aria-label={`Use ${c.name} in this project`}
                      className="mx-1"
                    />
                  </div>
                )}
              />
              <CollapsibleContent>
                <div className="bg-muted/40 grid gap-2 border-t px-3 py-2.5 @sm:pl-13">
                  {c.tools.length ? (
                    <ul aria-label={`${c.name} tools`} className="grid gap-1.5">
                      {c.tools.map((t) => (
                        <li key={t.name} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <span className="grid min-w-0 flex-1 basis-40">
                            <code className="truncate font-mono text-[11px]">{t.name}</code>
                            <span className="text-muted-foreground truncate text-[11px]">{t.description}</span>
                          </span>
                          <PermissionLabel permission={t.permission} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-[11px]">This connector has no tools.</p>
                  )}
                  <div className="text-muted-foreground flex min-w-0 flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span>Each tool keeps the permission set in Settings.</span>
                    {onManage ? (
                      <Button variant="ghost" size="sm" className="-my-1" onClick={() => onManage(c.id)}>
                        <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} data-icon="inline-start" />
                        Change in Settings
                      </Button>
                    ) : (
                      <ToSettings {...link} label={`Change ${c.name} in Settings`}>Change in Settings</ToSettings>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
        {!usable.length && (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-3 py-3">
            <p className="text-muted-foreground text-xs">No connectors connected yet. Connect one in Settings to use it here.</p>
            <ToSettings {...link}>Connect in Settings</ToSettings>
          </div>
        )}
      </SettingsGroup>

      {rest.length > 0 && (
        <Collapsible open={restOpen} onOpenChange={setRestOpen} className="grid min-w-0 gap-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex w-fit items-center gap-1 rounded text-xs font-medium outline-none focus-visible:ring-2"
            >
              <HugeiconsIcon icon={restOpen ? ArrowDown01Icon : ArrowRight01Icon} strokeWidth={2} className="size-3" />
              Not connected
              <span className="tabular-nums opacity-70">{rest.length}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SettingsGroup
              description="Connect these in Settings first, then switch them on here."
              className="@container"
            >
              {rest.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  variant="row"
                  className={cn(c.status === 'disabled' && 'opacity-60')}
                  action={c.status === 'disabled' ? (
                    <Switch checked={false} disabled aria-label={`Use ${c.name} in this project (disabled by admin)`} className="mx-1" />
                  ) : (
                    <ToSettings {...link} label={`Connect ${c.name} in Settings`}>Connect in Settings</ToSettings>
                  )}
                />
              ))}
            </SettingsGroup>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

const SOURCE_ORDER: SkillSource[] = ['builtin', 'yours', 'organisation']

export type ProjectSkillsProps = SettingsLink & {
  // Every skill, with `enabled` as set in your settings. Only those can be
  // switched on here.
  skills: Skill[]
  // Which are on in this project, by skill id.
  enabled: Record<string, boolean>
  onEnabledChange: (id: string, on: boolean) => void
  className?: string
}

export function ProjectSkills({ skills, enabled, onEnabledChange, settingsHref, onOpenSettings, className }: ProjectSkillsProps) {
  const id = useId()
  const groups = SOURCE_ORDER
    .map((source) => ({ source, skills: skills.filter((s) => s.source === source) }))
    .filter((g) => g.skills.length > 0)
  const hasOff = skills.some((s) => !s.enabled)

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      {groups.map(({ source, skills: list }) => {
        const available = list.filter((s) => s.enabled)
        const on = available.filter((s) => enabled[s.id]).length
        return (
          <SettingsGroup
            key={source}
            title={`${SKILL_SOURCES[source].label} skills`}
            description={available.length ? `${on} of ${available.length} on in this project` : 'All off in your settings'}
          >
            {list.map((s) => {
              const usable = s.enabled
              const switchId = `${id}-${s.id}`
              return (
                <SettingsRow
                  key={s.id}
                  htmlFor={switchId}
                  label={(
                    <span className="flex min-w-0 items-center gap-2">
                      <SkillMark skill={s} size="sm" />
                      <span className={cn('truncate', !usable && 'text-muted-foreground')}>{s.name}</span>
                    </span>
                  )}
                  hint={<span className="line-clamp-2">{s.description}</span>}
                >
                  <div className="flex shrink-0 items-center gap-2">
                    {!usable && <span className="text-muted-foreground text-[11px]">Off in your settings</span>}
                    <Switch
                      id={switchId}
                      checked={usable && !!enabled[s.id]}
                      disabled={!usable}
                      onCheckedChange={(v) => onEnabledChange(s.id, v)}
                      aria-label={`Use ${s.name} in this project`}
                    />
                  </div>
                </SettingsRow>
              )
            })}
          </SettingsGroup>
        )
      })}
      {!skills.length && (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-xs">No skills yet.</p>
      )}
      {hasOff && (settingsHref || onOpenSettings) && (
        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center justify-between gap-2 text-[11px]">
          <span>Turn a skill on in your settings to use it in a project.</span>
          <ToSettings settingsHref={settingsHref} onOpenSettings={onOpenSettings}>Skills in Settings</ToSettings>
        </div>
      )}
    </div>
  )
}

export type ProjectMemoryProps = {
  // Project memory on or off.
  enabled: boolean
  onEnabledChange: (on: boolean) => void
  // What the assistant has learned in this project.
  memories: Memory[]
  onEdit?: (id: string, text: string) => void
  onDelete?: (id: string) => void
  onClearAll?: () => void
  // Opens the chat a memory came from.
  onOpenSource?: (memory: Memory) => void
  // The time "Today" and "Yesterday" count from. Defaults to now.
  now?: number
  className?: string
}

export function ProjectMemory({
  enabled, onEnabledChange, memories, onEdit, onDelete, onClearAll, onOpenSource, now, className,
}: ProjectMemoryProps) {
  const id = useId()
  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      <SettingsGroup>
        <SettingsRow
          htmlFor={id}
          label="Project memory"
          hint="Memories learned in this project stay in this project, kept apart from your personal memory."
        >
          <Switch id={id} checked={enabled} onCheckedChange={onEnabledChange} />
        </SettingsRow>
      </SettingsGroup>
      <MemoryManager
        memories={memories}
        enabled={enabled}
        onEdit={onEdit}
        onDelete={onDelete}
        onClearAll={onClearAll}
        onOpenSource={onOpenSource}
        now={now}
        offNote="Project memory is off. The assistant does not save new memories in this project or use these. They stay here until you delete them."
      />
    </div>
  )
}
