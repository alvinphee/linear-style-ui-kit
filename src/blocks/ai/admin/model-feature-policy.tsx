import { useId } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from 'cn'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

// Model access and feature policy for an organisation: which models people
// can pick in the model picker, and which features (tools) the assistant may
// use for anyone. A model or feature turned off here is hidden from everyone.
//
// The default model can't be turned off (new chats start with it), and at
// least one model always stays on: the last one's switch is disabled.

export type PolicyModel = {
  id: string
  name: string
  description: string
  // What a reply costs, in a few words: "0.4% of credits a reply".
  cost?: string
  icon?: IconSvgElement
  // A short tag, such as "New".
  badge?: string
}

export type PolicyFeature = {
  id: string
  label: string
  hint: string
  on: boolean
  icon?: IconSvgElement
  badge?: string
}

export function ModelFeaturePolicy({
  models, allowed, onAllowedChange, defaultModel, features, onFeatureChange, className,
}: {
  models: PolicyModel[]
  // Ids of the models people may pick.
  allowed: string[]
  onAllowedChange: (allowed: string[]) => void
  // New chats start with it, so it stays on.
  defaultModel?: string
  features: PolicyFeature[]
  onFeatureChange: (id: string, on: boolean) => void
  className?: string
}) {
  const id = useId()
  const onCount = models.filter((m) => allowed.includes(m.id)).length

  const toggle = (modelId: string, on: boolean) => {
    // Keep the models' own order, whatever order they were switched on in.
    const next = on ? [...allowed, modelId] : allowed.filter((a) => a !== modelId)
    onAllowedChange(models.map((m) => m.id).filter((m) => next.includes(m)))
  }

  return (
    <div className={cn('grid min-w-0 gap-6', className)}>
      <SettingsGroup
        title="Model access"
        description="The models people can pick. A model turned off is hidden from the model picker, and chats that used it carry on with the default."
        action={<span className="text-muted-foreground text-[11px] tabular-nums">{onCount} of {models.length} on</span>}
      >
        <ul className="divide-y" aria-label="Models">
          {models.map((m) => {
            const on = allowed.includes(m.id)
            const isDefault = m.id === defaultModel
            const last = on && onCount === 1
            const locked = (isDefault && on) || last
            const switchId = `${id}-${m.id}`
            const why = isDefault && on
              ? 'The default model: new chats start with it, so it stays on.'
              : last ? 'At least one model must stay on.' : undefined
            return (
              <li key={m.id} className="flex min-w-0 items-start gap-3 px-3 py-2.5">
                {m.icon && (
                  <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
                    <HugeiconsIcon icon={m.icon} strokeWidth={2} className="size-4" />
                  </span>
                )}
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <label htmlFor={switchId} className="truncate text-xs font-medium">{m.name}</label>
                    {isDefault && <Badge variant="outline">Default</Badge>}
                    {m.badge && <Badge variant="secondary">{m.badge}</Badge>}
                  </span>
                  <span id={`${switchId}-about`} className="text-muted-foreground text-[11px] leading-4">
                    {m.description}
                    {m.cost && <span className="tabular-nums"> · {m.cost}</span>}
                  </span>
                  {why && <span id={`${switchId}-why`} className="text-muted-foreground text-[11px] leading-4 italic">{why}</span>}
                </div>
                <Switch
                  id={switchId}
                  checked={on}
                  disabled={locked}
                  onCheckedChange={(next) => toggle(m.id, next)}
                  aria-describedby={why ? `${switchId}-about ${switchId}-why` : `${switchId}-about`}
                  className="mt-0.5"
                />
              </li>
            )
          })}
        </ul>
      </SettingsGroup>

      <SettingsGroup
        title="Features"
        description="What the assistant may do for anyone in the organisation. A feature turned off disappears from the app for everyone."
      >
        {features.map((f) => (
          <SettingsRow
            key={f.id}
            htmlFor={`${id}-f-${f.id}`}
            label={(
              <span className="inline-flex min-w-0 items-center gap-2">
                {f.icon && <HugeiconsIcon icon={f.icon} strokeWidth={2} aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />}
                {f.label}
                {f.badge && <Badge variant="secondary">{f.badge}</Badge>}
              </span>
            )}
            hint={f.hint}
          >
            <Switch id={`${id}-f-${f.id}`} checked={f.on} onCheckedChange={(on) => onFeatureChange(f.id, on)} />
          </SettingsRow>
        ))}
      </SettingsGroup>
    </div>
  )
}
