import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, ArrowLeft01Icon, Files01Icon, Plug01Icon, Search01Icon, Settings01Icon, UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { CreateKnowledgeBaseDialog, type KnowledgeBaseDraft } from '@/blocks/ai/knowledge/create-knowledge-base-dialog'
import { KnowledgeBaseList } from '@/blocks/ai/knowledge/knowledge-base-list'
import { KnowledgeBasePage, type KnowledgeBaseTab } from '@/blocks/ai/knowledge/knowledge-base-page'
import { KnowledgeAccessForm, RetrievalSettingsForm } from '@/blocks/ai/knowledge/knowledge-base-settings'
import { KnowledgeDocuments } from '@/blocks/ai/knowledge/knowledge-documents'
import { AddSourceDialog, KnowledgeSources, type KnowledgeSourceDraft } from '@/blocks/ai/knowledge/knowledge-sources'
import type { KnowledgeBase } from '@/blocks/ai/knowledge/knowledge-types'
import { RetrievalTester } from '@/blocks/ai/knowledge/retrieval-tester'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { useActions } from './context'
import { USER, now } from './data'
import { DEFAULT_RETRIEVAL } from './knowledge/bases-data'
import { useKnowledge } from './knowledge/context'
import { newId } from './knowledge/library'
import { EMBEDDING_MODELS, RETRIEVAL_EXAMPLES, sampleSearch } from './knowledge/retrieval-data'
import { ORGANISATION } from './projects/people'
import { PROJECT_COLOURS, PROJECT_ICONS, projectColour, projectIcon } from './projects/templates'
import { useConnectors } from './settings/ConnectorsTab'
import type { Project } from './types'

// Knowledge in the AI chat app: the library of knowledge bases, and one
// knowledge base at a tab (Documents, Sources, Test retrieval, Settings,
// Access). The projects that search a knowledge base come from the projects
// (their knowledgeBases), so linking from either side shows on both.

export const KNOWLEDGE_TABS = ['documents', 'sources', 'test', 'settings', 'access'] as const

const searchDelay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function KnowledgeView({ baseId, tab, projects, start }: {
  baseId?: string
  tab?: string
  projects: Project[]
  start?: ReactNode
}) {
  const actions = useActions()
  const library = useKnowledge()
  const { connectors } = useConnectors()
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState<{ kind?: KnowledgeSourceDraft['kind'] } | null>(null)

  // Linked projects as the projects say, not as the sample data said.
  const withLinks = (b: KnowledgeBase): KnowledgeBase => ({
    ...b,
    linkedProjects: projects.filter((p) => p.knowledgeBases?.includes(b.id)).map((p) => ({ id: p.id, name: p.name })),
  })
  const bases = library.bases.map(withLinks)
  const base = bases.find((b) => b.id === baseId)

  function create(draft: KnowledgeBaseDraft) {
    const id = newId('kb')
    library.setBases((bs) => [...bs, {
      id, name: draft.name, description: draft.description, icon: projectIcon(draft.icon), colour: projectColour(draft.colour),
      sources: [], documents: [], settings: { ...DEFAULT_RETRIEVAL }, access: draft.access, linkedProjects: [],
      owner: USER.name, updatedAt: now(),
    }])
    setCreating(false)
    actions.openKnowledge(id)
    toast(`Created “${draft.name}”`)
    if (draft.start !== 'empty') setAdding({ kind: draft.start })
  }

  const addSourceDialog = base && (
    <AddSourceDialog
      open={!!adding}
      onOpenChange={(open) => !open && setAdding(null)}
      connectors={connectors}
      kind={adding?.kind}
      now={now()}
      onAdd={(draft) => {
        library.addSource(base.id, draft)
        setAdding(null)
        actions.openKnowledge(base.id, draft.kind === 'upload' || draft.kind === 'text' ? 'documents' : 'sources')
      }}
      key={adding?.kind ?? 'any'}
    />
  )

  const createDialog = (
    <CreateKnowledgeBaseDialog
      open={creating}
      onOpenChange={setCreating}
      icons={PROJECT_ICONS}
      colours={PROJECT_COLOURS}
      organisation={ORGANISATION}
      onCreate={create}
    />
  )

  if (!base) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
          {start}
          <h1 className="min-w-0 flex-1 truncate px-1 text-xs font-medium">Knowledge</h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> New knowledge base
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-5xl min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 py-6">
            <p className="text-muted-foreground max-w-2xl text-xs">
              Libraries the assistant searches when a question needs them: policies, product documents, a support wiki.
              Each is split into passages and indexed, so only the parts that match a question are read. Link one to a
              project from the project's Knowledge tab.
            </p>
            <KnowledgeBaseList
              bases={bases}
              onOpen={(id) => actions.openKnowledge(id)}
              onCreate={() => setCreating(true)}
              now={now}
            />
          </div>
        </div>
        {createDialog}
      </div>
    )
  }

  const patch = (change: Partial<KnowledgeBase>) => library.patchBase(base.id, (b) => ({ ...b, ...change }))

  const tabs: KnowledgeBaseTab[] = [
    {
      id: 'documents',
      label: 'Documents',
      icon: Files01Icon,
      count: base.documents.length,
      content: (
        <KnowledgeDocuments
          documents={base.documents}
          sources={base.sources}
          now={now}
          onUpload={(files) => library.upload(base.id, files)}
          onReindex={(ids) => library.reindex(base.id, ids)}
          onRemove={(ids) => library.removeDocuments(base.id, ids)}
          onOpen={(id) => toast('Demo only', { description: `Would open “${base.documents.find((d) => d.id === id)?.name}”.` })}
        />
      ),
    },
    {
      id: 'sources',
      label: 'Sources',
      icon: Plug01Icon,
      count: base.sources.length,
      content: (
        <KnowledgeSources
          sources={base.sources}
          connectors={connectors}
          now={now}
          onAdd={(draft) => library.addSource(base.id, draft)}
          onSync={(id) => library.sync(id)}
          onRemove={(id) => library.removeSource(base.id, id)}
          onEditSync={(id, recurrence) => library.editSync(base.id, id, recurrence)}
          scheduleOf={library.scheduleOf}
        />
      ),
    },
    {
      id: 'test',
      label: 'Test retrieval',
      icon: Search01Icon,
      content: (
        <RetrievalTester
          settings={base.settings}
          examples={RETRIEVAL_EXAMPLES}
          onSearch={async (query, settings) => {
            await searchDelay(350)
            return sampleSearch(query, settings)
          }}
        />
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings01Icon,
      content: (
        <RetrievalSettingsForm
          value={base.settings}
          embeddingModels={EMBEDDING_MODELS}
          onChange={(settings) => {
            patch({ settings })
            toast('Retrieval settings saved')
          }}
          onReindexNeeded={() => library.reindex(base.id, base.documents.map((d) => d.id))}
        />
      ),
    },
    {
      id: 'access',
      label: 'Access',
      icon: UserGroupIcon,
      content: (
        <KnowledgeAccessForm
          access={base.access}
          onAccessChange={(access) => patch({ access })}
          members={base.members ?? []}
          onManageMembers={() => toast('Demo only', { description: 'The share dialog for knowledge bases comes with the organisation settings.' })}
          linkedProjects={base.linkedProjects}
          onUnlinkProject={(projectId) => {
            const project = projects.find((p) => p.id === projectId)
            if (!project) return
            actions.patchProject(projectId, { knowledgeBases: (project.knowledgeBases ?? []).filter((id) => id !== base.id) })
            toast(`Unlinked from “${project.name}”`)
          }}
          organisation={ORGANISATION}
        />
      ),
    },
  ]

  return (
    <>
      <KnowledgeBasePage
        base={base}
        tabs={tabs}
        tab={tab && (KNOWLEDGE_TABS as readonly string[]).includes(tab) ? tab : 'documents'}
        onTabChange={(next) => actions.openKnowledge(base.id, next)}
        start={(
          <>
            {start}
            <IconAction label="All knowledge bases" icon={ArrowLeft01Icon} onClick={() => actions.openKnowledge()} />
          </>
        )}
        onRename={(name) => patch({ name })}
        onDelete={() => {
          library.setBases((bs) => bs.filter((b) => b.id !== base.id))
          for (const p of projects.filter((p) => p.knowledgeBases?.includes(base.id))) {
            actions.patchProject(p.id, { knowledgeBases: (p.knowledgeBases ?? []).filter((id) => id !== base.id) })
          }
          actions.openKnowledge()
          toast(`Deleted “${base.name}”`)
        }}
        actions={(
          <Button size="sm" onClick={() => setAdding({})}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" /> Add source
          </Button>
        )}
        now={now}
      />
      {addSourceDialog}
      {createDialog}
    </>
  )
}
