import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowLeft01Icon, Files01Icon, Plug01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { KnowledgeBaseList, type KnowledgeBaseListView } from '@/blocks/ai/knowledge/knowledge-base-list'
import { KnowledgeBasePage, type KnowledgeBaseTab } from '@/blocks/ai/knowledge/knowledge-base-page'
import { KnowledgeDocuments } from '@/blocks/ai/knowledge/knowledge-documents'
import {
  AddSourceDialog, KnowledgeSources, type KnowledgeSourceDraft,
} from '@/blocks/ai/knowledge/knowledge-sources'
import type { KnowledgeBase } from '@/blocks/ai/knowledge/knowledge-types'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import { Panel, Row } from '../shared'
import { now } from '../ai/data'
import { CONNECTORS } from '../ai/settings/connectors-data'
import { SAMPLE_KNOWLEDGE_BASES } from '../ai/knowledge/bases-data'
import { useKnowledgeLibrary } from '../ai/knowledge/library'

// The knowledge base demos, on local state (nothing here is saved): the
// library live, one knowledge base's page with its Documents and Sources
// tabs, the add source dialog on its own, and the empty states. Indexing is
// the made-up indexer the AI chat app uses too (ai/knowledge/library.ts).

const demo = (what: string) => toast('Demo only', { description: what })

export function BasesPanels() {
  const library = useKnowledgeLibrary(SAMPLE_KNOWLEDGE_BASES)
  const { bases } = library
  const [openId, setOpenId] = useState('kb-support')
  const [tab, setTab] = useState('documents')
  const [view, setView] = useState<KnowledgeBaseListView>('grid')
  const [adding, setAdding] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; kind?: KnowledgeSourceDraft['kind'] }>({ open: false })
  const [lastDraft, setLastDraft] = useState<string>()

  const base = bases.find((b) => b.id === openId) ?? bases[0]
  const patchBase = (change: (b: KnowledgeBase) => KnowledgeBase) => library.patchBase(base.id, change)
  const upload = (files: File[]) => library.upload(base.id, files)
  const addSource = (draft: KnowledgeSourceDraft) => library.addSource(base.id, draft)

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
          onUpload={upload}
          onReindex={(ids) => library.reindex(base.id, ids)}
          onRemove={(ids) => library.removeDocuments(base.id, ids)}
          onOpen={(id) => demo(`Would open “${base.documents.find((d) => d.id === id)?.name}”.`)}
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
          connectors={CONNECTORS}
          now={now}
          onAdd={addSource}
          onSync={(id) => library.sync(id)}
          onRemove={(id) => library.removeSource(base.id, id)}
          onEditSync={(id, recurrence) => library.editSync(base.id, id, recurrence)}
          scheduleOf={library.scheduleOf}
        />
      ),
    },
  ]

  return (
    <>
      <Panel title="Knowledge base library" note="Search, grid or list; opens in the page below" wide>
        <KnowledgeBaseList
          bases={bases}
          view={view}
          onViewChange={setView}
          now={now}
          onOpen={(id) => {
            setOpenId(id)
            setTab('documents')
            toast(`Opened “${bases.find((b) => b.id === id)?.name}” below`)
          }}
          onCreate={() => demo('Another panel shows the create knowledge base dialog.')}
        />
      </Panel>

      <Panel title="Knowledge base page" note="Upload to watch indexing; Sync now on Sources" wide>
        <div className="bg-background flex h-[40rem] min-w-0 flex-col overflow-hidden rounded-lg border">
          <KnowledgeBasePage
            key={base.id}
            base={base}
            tabs={tabs}
            tab={tab}
            onTabChange={setTab}
            now={now}
            start={<IconAction label="Back to knowledge bases" icon={ArrowLeft01Icon} onClick={() => demo('Would go back to the library.')} />}
            onRename={(name) => patchBase((b) => ({ ...b, name }))}
            onDelete={() => demo(`“${base.name}” would be deleted.`)}
            actions={(
              <Button size="sm" onClick={() => setAdding(true)}>
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
                <span className="sr-only @md:not-sr-only">Add source</span>
              </Button>
            )}
          />
          <AddSourceDialog
            open={adding}
            onOpenChange={setAdding}
            connectors={CONNECTORS}
            now={now()}
            onAdd={(draft) => {
              addSource(draft)
              setAdding(false)
              setTab(draft.kind === 'upload' || draft.kind === 'text' ? 'documents' : 'sources')
            }}
          />
        </div>
      </Panel>

      <Panel title="Add source dialog" note="Pick a kind, or open straight on one">
        <div className="grid min-w-0 gap-3">
          <Row>
            <Button size="sm" variant="outline" onClick={() => setDialog({ open: true })}>Pick a kind</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, kind: 'website' })}>Website</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, kind: 'connector' })}>Connected app</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, kind: 'text' })}>Paste text</Button>
          </Row>
          <p className="text-muted-foreground text-xs">
            Only connected apps can be picked; the rest say to connect them in Settings. A website needs an https:// address.
          </p>
          {lastDraft && (
            <pre className="bg-muted/50 max-h-56 overflow-auto rounded-lg border p-2.5 font-mono text-[11px] leading-relaxed">{lastDraft}</pre>
          )}
          <AddSourceDialog
            open={dialog.open}
            onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
            kind={dialog.kind}
            connectors={CONNECTORS}
            now={now()}
            onAdd={(draft) => {
              setDialog((d) => ({ ...d, open: false }))
              setLastDraft(JSON.stringify(
                draft.kind === 'upload' ? { ...draft, files: draft.files.map((f) => `${f.name} (${f.size} bytes)`) } : draft,
                null,
                2,
              ))
            }}
          />
        </div>
      </Panel>

      <Panel title="Compact list" note="The list view on its own">
        <KnowledgeBaseList bases={bases} view="list" now={now} onOpen={(id) => setOpenId(id)} />
      </Panel>

      <Panel title="Empty library" note="No knowledge bases yet">
        <KnowledgeBaseList bases={[]} onOpen={() => {}} onCreate={() => demo('Would open the create knowledge base dialog.')} />
      </Panel>

      <Panel title="Empty knowledge base" note="No documents, no sources">
        <div className="grid min-w-0 gap-5">
          <KnowledgeDocuments
            documents={[]}
            sources={[]}
            onUpload={(files) => demo(`${files.length === 1 ? '1 file' : `${files.length} files`} would be uploaded.`)}
            onReindex={() => {}}
            onRemove={() => {}}
          />
          <KnowledgeSources
            sources={[]}
            connectors={CONNECTORS}
            onAdd={(draft) => demo(`A ${draft.kind} source would be added.`)}
            onSync={() => {}}
            onRemove={() => {}}
            onEditSync={() => {}}
          />
        </div>
      </Panel>
    </>
  )
}
