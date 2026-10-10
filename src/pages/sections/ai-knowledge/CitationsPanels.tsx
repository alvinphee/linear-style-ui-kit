import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { SourcesRow } from '@/blocks/ai/chat/chat-message'
import { SourcePanel, SourceSheet, toCitation } from '@/blocks/ai/citations/source-panel'
import { ThinkingTrail, type TrailStep } from '@/blocks/ai/reasoning/thinking-trail'
import { Markdown, type Citation } from '@/blocks/markdown'
import { FILE_KIND_ICONS } from '@/components/file-chip'
import { Panel } from '../shared'

// Citations from knowledge: a reply that cites a web page and a project's
// files, the source cards under it, the source panel, and the knowledge
// search in the thinking trail. Made-up sources; nothing opens for real.

const SUPPORT = { kind: 'project', name: 'Customer support files' } as const

const SOURCES: Citation[] = [
  {
    title: 'Handling damaged freight claims', domain: 'freight.example.com', url: 'https://freight.example.com/claims/damage',
    snippet: 'Claims with photos sent within two days are settled in about a week; without photos, most take a month.',
  },
  toCitation({
    documentName: 'Refund policy.pdf', documentKind: 'pdf', page: 3, from: SUPPORT,
    passage: 'Damaged goods: ask the customer for photos within 48 hours of delivery. If the damage happened in transit, offer a full refund or a free re-delivery, whichever the customer prefers.',
  }),
  toCitation({
    documentName: 'Refund policy.pdf', documentKind: 'pdf', page: 2, from: SUPPORT,
    passage: 'Refunds over $500 need a team lead’s approval before they are issued. Below that amount, any support agent can approve a refund on the spot.',
  }),
  toCitation({
    documentName: 'Tone of voice.md', documentKind: 'text', from: SUPPORT,
    passage: 'Start with the answer, then the reason. Apologise once, plainly (“Sorry, your pallet arrived damaged.”) and never blame the driver or the customer.',
  }),
]

const REPLY = [
  'For a damaged pallet, **apologise once and plainly** [4], then ask for photos within 48 hours of delivery [2].',
  '',
  '- Offer a **full refund or a free re-delivery**, whichever the customer prefers [2].',
  '- A refund over **$500** needs a team lead’s approval first [3].',
  '- Early photos also speed up the carrier’s claim: about a week instead of a month [1].',
].join('\n')

const DOCUMENTS = SOURCES.filter((s) => s.kind === 'document')

const openDocument = (sources: Citation[]) => (index: number) =>
  toast(sources[index].title, { description: 'Demo only. There is no document viewer here.' })

const SEARCH: TrailStep = {
  id: 'search', kind: 'tool', icon: BookOpen01Icon, status: 'done', ms: 860,
  label: 'Searched Customer support files', activeLabel: 'Searching Customer support files', detail: '“damaged pallet complaint”',
  summary: '4 passages from 2 documents', name: 'search_knowledge',
  input: { in: 'Customer support files', query: 'damaged pallet complaint', top_k: 5 },
  results: [
    { id: 'r1', title: 'Refund policy.pdf', meta: 'p. 2, 3 · 2 passages', icon: FILE_KIND_ICONS.pdf, score: 0.94 },
    { id: 'r2', title: 'Tone of voice.md', meta: '2 passages', icon: FILE_KIND_ICONS.text, score: 0.88 },
  ],
}

const THINKING: TrailStep = {
  id: 'think', kind: 'thinking', status: 'done', ms: 2400,
  label: 'The Customer support project has a refund policy and a tone guide. I will answer from them and cite each passage.',
}

export function CitationsPanels() {
  const [sheet, setSheet] = useState<{ open: boolean; at: number }>({ open: false, at: 0 })
  const [active, setActive] = useState<number | undefined>(1)
  const [panelOpen, setPanelOpen] = useState(true)
  const [startedAt] = useState(() => Date.now())
  const show = (at: number) => setSheet({ open: true, at })

  return (
    <>
      <Panel title="Reply with citations" note="Hover a number, click a document">
        <div className="@container grid min-w-0 gap-3">
          <Markdown text={REPLY} sources={SOURCES} onCite={show} />
          <SourcesRow sources={SOURCES} onOpen={show} />
        </div>
        <SourceSheet
          open={sheet.open}
          onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
          sources={SOURCES}
          active={sheet.at}
          onActiveChange={(at) => setSheet((s) => ({ ...s, at }))}
          onOpenDocument={openDocument(SOURCES)}
        />
      </Panel>

      <Panel title="Source cards" note="Documents from a project">
        <div className="grid min-w-0 gap-4">
          <SourcesRow sources={DOCUMENTS} onOpen={(i) => toast(`Source ${i + 1}: ${DOCUMENTS[i].title}`, { description: 'Opens the source panel in a reply.' })} />
          <div className="grid min-w-0 gap-1.5">
            <p className="text-muted-foreground text-[11px]">Without onOpen the cards are not clickable</p>
            <SourcesRow sources={DOCUMENTS} />
          </div>
        </div>
      </Panel>

      <Panel title="Source panel" note="Arrow keys move between sources">
        {panelOpen ? (
          <div className="h-96 min-w-0 overflow-hidden rounded-lg border">
            <SourcePanel
              sources={SOURCES}
              active={active}
              onActiveChange={setActive}
              onClose={() => setPanelOpen(false)}
              onOpenDocument={openDocument(SOURCES)}
            />
          </div>
        ) : (
          <div className="grid h-96 place-items-center rounded-lg border border-dashed">
            <Button variant="outline" onClick={() => setPanelOpen(true)}>Show the sources</Button>
          </div>
        )}
      </Panel>

      <Panel title="Knowledge search in the trail" note="Open it to see the documents">
        <div className="@container grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-1.5">
            <p className="text-muted-foreground text-[11px]">Searching</p>
            <ThinkingTrail
              steps={[{ ...SEARCH, status: 'running', startedAt, results: undefined, summary: undefined }]}
              live
              activity="Searching Customer support files…"
              startedAt={startedAt}
              autoOpen={false}
            />
          </div>
          <div className="grid min-w-0 gap-1.5">
            <p className="text-muted-foreground text-[11px]">Done: the step opens to the matched documents and their scores</p>
            <ThinkingTrail steps={[THINKING, SEARCH]} live={false} />
          </div>
        </div>
      </Panel>
    </>
  )
}
