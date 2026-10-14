import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon, AiSearch02Icon, Globe02Icon, Image01Icon, Link01Icon, Mic01Icon, Robot01Icon, RefreshIcon,
  SourceCodeIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { SettingsHeader } from '@/blocks/settings-page'
import { ModelFeaturePolicy, type PolicyModel } from '@/blocks/ai/admin/model-feature-policy'
import { Button } from '@/components/ui/button'
import { DEFAULT_MODEL, MODELS } from '../data'
import type { ModelId } from '../types'
import { DEFAULT_ORG_POLICY, ORG, useOrgPolicy, type OrgPolicy } from './org'

// Admin console › Models and features: which models people in the
// organisation can pick, and which features the assistant may use. Written
// to the org policy, which the app reads.

export type OrgFeature = keyof OrgPolicy['features']

export const FEATURE_POLICIES: { id: OrgFeature; label: string; hint: string; icon: IconSvgElement; badge?: string }[] = [
  { id: 'webSearch', label: 'Web search', icon: Globe02Icon, hint: 'Look things up on the web and cite the sources.' },
  { id: 'research', label: 'Deep research', icon: AiSearch02Icon, hint: 'Long, multi-step research that reads many sources and writes a report.' },
  { id: 'voice', label: 'Voice mode', icon: Mic01Icon, hint: 'Talk to the assistant and hear it answer.' },
  { id: 'imageGeneration', label: 'Image generation', icon: Image01Icon, badge: 'Beta', hint: 'Draw pictures and diagrams from a description.' },
  { id: 'codeExecution', label: 'Code execution', icon: SourceCodeIcon, hint: 'Run code to work with numbers and read attached files.' },
  { id: 'memory', label: 'Memory', icon: AiBrain01Icon, hint: 'Remember things about people between chats. Each person can still see and delete theirs.' },
  { id: 'publicLinks', label: 'Public links to chats', icon: Link01Icon, hint: 'Share a chat with anyone who has the link, outside the organisation. Off: links work only for members.' },
  { id: 'agents', label: 'People can create agents', icon: Robot01Icon, hint: 'Members can build and run their own agents. Off: only admins can.' },
]

export const FEATURE_LABEL = Object.fromEntries(FEATURE_POLICIES.map((f) => [f.id, f.label])) as Record<OrgFeature, string>

// The kit's models as the policy block shows them.
export const POLICY_MODELS: PolicyModel[] = MODELS.map((m) => ({
  id: m.id, name: m.name, description: m.description, icon: m.icon, badge: m.badge, cost: `${m.cost}% of credits a reply`,
}))

export function ModelsPolicyTab() {
  const { policy, setPolicy, patch } = useOrgPolicy()
  const changed = JSON.stringify([policy.models, policy.features])
    !== JSON.stringify([DEFAULT_ORG_POLICY.models, DEFAULT_ORG_POLICY.features])

  return (
    <>
      <SettingsHeader
        title="Models and features"
        description={`What everyone in ${ORG.name} may use. People only see what is allowed here.`}
        action={changed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              patch('models', DEFAULT_ORG_POLICY.models)
              patch('features', DEFAULT_ORG_POLICY.features)
              toast('Models and features reset to the defaults')
            }}
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
          </Button>
        )}
      />
      <ModelFeaturePolicy
        models={POLICY_MODELS}
        allowed={policy.models}
        defaultModel={DEFAULT_MODEL}
        onAllowedChange={(ids) => {
          const turnedOff = policy.models.find((m) => !ids.includes(m))
          patch('models', ids as ModelId[])
          if (turnedOff) {
            const name = MODELS.find((m) => m.id === turnedOff)?.name ?? turnedOff
            toast(`${name} turned off for everyone`, { description: 'It is hidden from the model picker.' })
          }
        }}
        features={FEATURE_POLICIES.map((f) => ({ ...f, on: policy.features[f.id] }))}
        onFeatureChange={(id, on) => {
          const key = id as OrgFeature
          setPolicy((p) => ({ ...p, features: { ...p.features, [key]: on } }))
          toast(`${FEATURE_LABEL[key]} turned ${on ? 'on' : 'off'} for everyone`)
        }}
      />
    </>
  )
}
