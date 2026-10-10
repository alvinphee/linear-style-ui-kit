import { useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import {
  CreateKnowledgeBaseDialog, type KnowledgeBaseDraft, type KnowledgeStart,
} from '@/blocks/ai/knowledge/create-knowledge-base-dialog'
import {
  KnowledgeAccessForm, RetrievalSettingsForm, knowledgeAccessOptions, type KnowledgeMember,
} from '@/blocks/ai/knowledge/knowledge-base-settings'
import type { KnowledgeAccess, RetrievalSettings, RetrievedChunk } from '@/blocks/ai/knowledge/knowledge-types'
import { RetrievalTester } from '@/blocks/ai/knowledge/retrieval-tester'
import { IconColourSwatch } from '@/components/icon-colour-picker'
import { Button } from '@/components/ui/button'
import { Panel, Row } from '../shared'
import { EMBEDDING_MODELS, RETRIEVAL_EXAMPLES, SAMPLE_RETRIEVAL_SETTINGS, sampleSearch } from '../ai/knowledge/retrieval-data'
import { ORGANISATION, PEOPLE } from '../ai/projects/people'
import { PROJECT_COLOURS, PROJECT_ICONS } from '../ai/projects/templates'

// The demos that make a knowledge base's retrieval trustworthy and tunable,
// on local state: the retrieval tester on a made-up retriever (with a short
// delay, as a real search has), the retrieval settings it searches with (a
// save there searches again), who can use the knowledge base, and the
// dialog that creates one. Nothing here touches the AI chat app.

// The made-up knowledge base has 128 documents; re-indexing takes about 6 minutes.
const DOCUMENTS = 128
const REINDEX_MINUTES = 6

const MEMBERS: KnowledgeMember[] = PEOPLE.slice(0, 4).map(({ id, name, email }) => ({ id, name, email }))

const PROJECTS = [
  { id: 'p-onboarding', name: 'New starter onboarding' },
  { id: 'p-helpdesk', name: 'HR helpdesk' },
  { id: 'p-travel', name: 'Travel desk' },
]

const START_NEXT: Record<KnowledgeStart, string> = {
  upload: 'the Upload files dialog',
  website: 'the Add a website dialog',
  connector: 'the connected app picker',
  empty: 'the empty knowledge base',
}

// The made-up search, after a short wait.
const search = (query: string, settings: RetrievalSettings) =>
  new Promise<RetrievedChunk[]>((resolve) => {
    setTimeout(() => resolve(sampleSearch(query, settings)), 280 + (query.length % 7) * 40)
  })

export function RetrievalPanels() {
  const [settings, setSettings] = useState<RetrievalSettings>(SAMPLE_RETRIEVAL_SETTINGS)
  const [access, setAccess] = useState<KnowledgeAccess>('people')
  const [projects, setProjects] = useState(PROJECTS)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<KnowledgeBaseDraft | null>(null)
  const accessTitle = (a: KnowledgeAccess) => knowledgeAccessOptions(ORGANISATION).find((o) => o.value === a)?.title ?? a

  return (
    <>
      <Panel title="Retrieval tester" note="HR policies, product docs, customs rules" wide>
        <RetrievalTester onSearch={search} settings={settings} examples={RETRIEVAL_EXAMPLES} />
      </Panel>

      <Panel title="Retrieval settings" note="Saving searches the tester again">
        <RetrievalSettingsForm
          value={settings}
          embeddingModels={EMBEDDING_MODELS}
          reindexMinutes={REINDEX_MINUTES}
          onChange={(next) => {
            setSettings(next)
            toast.success('Retrieval settings saved')
          }}
          onReindexNeeded={() => toast(`Re-indexing ${DOCUMENTS} documents`, {
            description: `About ${REINDEX_MINUTES} minutes. Demo only: nothing is indexed.`,
          })}
        />
      </Panel>

      <Panel title="Access" note="Who can use it, projects that search it">
        <KnowledgeAccessForm
          access={access}
          onAccessChange={(next) => {
            setAccess(next)
            toast.success(`Who can use it: ${accessTitle(next)}`)
          }}
          members={MEMBERS}
          onManageMembers={() => toast('Opens the share dialog', { description: 'Demo only.' })}
          linkedProjects={projects}
          onUnlinkProject={(id) => {
            const before = projects
            setProjects(before.filter((p) => p.id !== id))
            toast.success(`Unlinked ${before.find((p) => p.id === id)?.name ?? 'the project'}`, {
              action: { label: 'Undo', onClick: () => setProjects(before) },
            })
          }}
          organisation={ORGANISATION}
        />
      </Panel>

      <Panel title="Create knowledge base" note="Name, what is in it, access, start with">
        <div className="grid min-w-0 gap-3">
          <p className="text-muted-foreground text-xs">
            The description tells the assistant when to search it. Start with picks the Add source dialog that opens
            next; Empty adds sources later.
          </p>
          <Row>
            <Button onClick={() => setCreating(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              New knowledge base
            </Button>
          </Row>
          {created && (
            <div className="flex min-w-0 items-start gap-2.5 rounded-lg border p-2.5">
              <IconColourSwatch icons={PROJECT_ICONS} colours={PROJECT_COLOURS} icon={created.icon} colour={created.colour} />
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate text-xs font-medium">{created.name}</span>
                {created.description && (
                  <span className="text-muted-foreground line-clamp-2 text-[11px]">{created.description}</span>
                )}
                <span className="text-muted-foreground text-[11px]">
                  {accessTitle(created.access)} · next: {START_NEXT[created.start]}
                </span>
              </div>
            </div>
          )}
        </div>
        <CreateKnowledgeBaseDialog
          open={creating}
          onOpenChange={setCreating}
          icons={PROJECT_ICONS}
          colours={PROJECT_COLOURS}
          organisation={ORGANISATION}
          onCreate={(draft) => {
            setCreated(draft)
            setCreating(false)
            toast.success(`Created ${draft.name}`, { description: `Demo only. Next: ${START_NEXT[draft.start]}.` })
          }}
        />
      </Panel>
    </>
  )
}
