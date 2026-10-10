import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SettingsScreen } from './ai/settings/SettingsScreen'
import type { ModelId } from './ai/types'
import { AccountPanels } from './ai-settings/AccountPanels'
import { ModelsPanels } from './ai-settings/ModelsPanels'
import { Panel, Section } from './shared'

// The AI chat app's settings page in a card, then the blocks it is made of
// that are not on a page of their own (connectors, skills and memory are).
export default function AiSettingsSection() {
  const [section, setSection] = useState<string | null>(null)
  const [model, setModel] = useState<ModelId>('balanced')

  return (
    <Section
      id="ai-settings"
      title="Settings page"
      description="Full-page settings for an AI chat app: profile, appearance, personalisation, models, memory, connectors, skills, voice, data and billing"
    >
      <Panel title="The AI chat app's settings" note="Settings page block, narrow below 48rem" wide>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground max-w-xl text-xs">
              The settings page block measures its own box: sections down the left, or a list that opens one
              section at a time when narrow. The same screen is at its own address in the full-page app.
            </p>
            <Button asChild size="sm" variant="outline">
              <a href="#/templates/ai-chat/settings">
                Open in the app <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <div className="bg-background h-[44rem] overflow-hidden rounded-lg border">
            <SettingsScreen
              active={section}
              onSelect={setSection}
              model={model}
              onModelChange={(id) => {
                setModel(id)
                toast('Default model changed', { description: 'Demo only. The app keeps its own.' })
              }}
              chatCount={12}
              credits={68}
              onExportAll={() => toast('Export', { description: 'Demo only. The app downloads your chats.' })}
              onResetDemo={() => toast('Reset demo chats', { description: 'Demo only.' })}
            />
          </div>
        </div>
      </Panel>
      <AccountPanels />
      <ModelsPanels />
    </Section>
  )
}
