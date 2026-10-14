import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { AiBrain01Icon, Globe02Icon, Image01Icon, Note01Icon, SourceCodeIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useOrgPolicy, type OrgPolicy } from '../admin/org'
import { MODELS } from '../data'
import type { ModelId } from '../types'
import { useAiPrefs, type Prefs } from './prefs'

// Models: the model new chats start with, as radio cards that say how fast
// and how thorough each one is and what a reply costs; then the features
// (tools) the assistant may use. The model lives in the workspace store, so
// it comes in as a prop; the features are prefs.

type FeatureKey = keyof Pick<Prefs, 'extendedThinking' | 'webSearch' | 'artifacts' | 'codeExecution' | 'imageGeneration'>

// The organisation's switch for each feature, where it has one.
const ORG_FEATURE: Partial<Record<FeatureKey, keyof OrgPolicy['features']>> = {
  webSearch: 'webSearch', codeExecution: 'codeExecution', imageGeneration: 'imageGeneration',
}

const FEATURES: { key: FeatureKey; label: string; hint: string; icon: IconSvgElement; badge?: string }[] = [
  {
    key: 'extendedThinking', label: 'Extended thinking by default', icon: AiBrain01Icon,
    hint: 'New chats start with Deep think on: slower replies that reason step by step.',
  },
  { key: 'webSearch', label: 'Web search', icon: Globe02Icon, hint: 'Look things up on the web and cite the sources.' },
  { key: 'artifacts', label: 'Artifacts', icon: Note01Icon, hint: 'Put documents, tables and code in a panel beside the chat.' },
  {
    key: 'codeExecution', label: 'Code execution and file analysis', icon: SourceCodeIcon,
    hint: 'Run code to work with numbers and read the files you attach.',
  },
  { key: 'imageGeneration', label: 'Image generation', icon: Image01Icon, badge: 'Beta', hint: 'Draw pictures and diagrams from a description.' },
]

export function ModelsTab({ model, onModelChange }: { model: ModelId; onModelChange: (id: ModelId) => void }) {
  const org = useOrgPolicy().policy
  const id = useId()
  const { prefs, set } = useAiPrefs()

  return (
    <>
      <SettingsHeader title="Models and features" description="Which model new chats start with, and what the assistant is allowed to do." />

      <SettingsGroup title="Default model" description="New chats start with this one. You can switch in any chat.">
        <div className="p-3">
          <RadioGroup value={model} onValueChange={(v) => onModelChange(v as ModelId)} aria-label="Default model" className="gap-2">
            {MODELS.filter((m) => org.models.includes(m.id)).map((m) => {
              const itemId = `${id}-${m.id}`
              return (
                <div
                  key={m.id}
                  className={cn(
                    'relative flex min-w-0 items-start gap-3 rounded-lg border p-2.5 transition-colors',
                    'hover:bg-accent/40 has-data-checked:border-primary/50 has-data-checked:bg-accent/40',
                  )}
                >
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
                    <HugeiconsIcon icon={m.icon} strokeWidth={2} className="size-4" />
                  </span>
                  {/* The label covers the card, so a click anywhere picks the model. */}
                  <label htmlFor={itemId} className="grid min-w-0 flex-1 cursor-pointer gap-1.5 after:absolute after:inset-0 after:rounded-lg">
                    <span className="grid gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-xs font-medium">{m.name}</span>
                        {m.badge && <Badge variant="secondary">{m.badge}</Badge>}
                      </span>
                      <span id={`${itemId}-about`} className="text-muted-foreground text-[11px] leading-4">{m.description}</span>
                    </span>
                    <span id={`${itemId}-meters`} className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <DotMeter label="Speed" value={m.speed} />
                      <DotMeter label="Quality" value={m.quality} />
                      <span className="tabular-nums">{m.cost}% of credits a reply</span>
                    </span>
                  </label>
                  <RadioGroupItem
                    id={itemId}
                    value={m.id}
                    aria-label={m.badge ? `${m.name}, ${m.badge}` : m.name}
                    aria-describedby={`${itemId}-about ${itemId}-meters`}
                    className="mt-0.5"
                  />
                </div>
              )
            })}
          </RadioGroup>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Features" description="Tools the assistant may use. Each can still be switched off in a chat.">
        {FEATURES.map((f) => {
          // Off for everyone when the organisation turned it off (Admin › Models and features).
          const blocked = ORG_FEATURE[f.key] && !org.features[ORG_FEATURE[f.key]!]
          return (
            <SettingsRow
              key={f.key}
              htmlFor={`${id}-${f.key}`}
              hint={blocked ? 'Turned off for everyone by your organisation.' : f.hint}
              label={
                <FeatureLabel icon={f.icon}>
                  {f.label}
                  {f.badge && <Badge variant="outline">{f.badge}</Badge>}
                </FeatureLabel>
              }
            >
              <Switch
                id={`${id}-${f.key}`}
                checked={!blocked && prefs[f.key]}
                disabled={blocked}
                onCheckedChange={(on) => set(f.key, on)}
              />
            </SettingsRow>
          )
        })}
      </SettingsGroup>
    </>
  )
}

function FeatureLabel({ icon, children }: { icon: IconSvgElement; children: ReactNode }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-3.5 shrink-0" />
      {children}
    </span>
  )
}

// Three dots, filled up to `value`: a small meter for speed or quality.
function DotMeter({ label, value, max = 3 }: { label: string; value: number; max?: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden>{label}</span>
      <span role="img" aria-label={`${label} ${value} of ${max}`} className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={cn('size-1.5 rounded-full', i < value ? 'bg-foreground/70' : 'bg-muted-foreground/25')} />
        ))}
      </span>
    </span>
  )
}
