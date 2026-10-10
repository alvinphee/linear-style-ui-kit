import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, BookOpen01Icon, CustomerSupportIcon, SourceCodeIcon, Target02Icon } from '@hugeicons/core-free-icons'
import { ContextMeter, ContextModeBadge } from '@/components/ai/context-meter'
import { fileKind } from '@/components/file-chip'
import { Button } from '@/components/ui/button'
import {
  ProjectKnowledge, knowledgeMode, type ProjectKnowledgeFile, type ProjectKnowledgeLink, type ProjectKnowledgeText,
} from '@/blocks/ai/knowledge/project-knowledge'
import type { KnowledgeBaseSummary } from '@/blocks/ai/knowledge/knowledge-types'
import { estimateFileTokens } from '@/lib/token-estimate'
import { useTimers } from '@/lib/use-timers'
import { Panel, Row } from '../shared'

// The project knowledge demos: the context meter at a few fills, both mode
// badges, the block live on made-up files, and its empty state.
// The AI components page should show the meter's and the badge's demos too.

// The project's context in the demos, in tokens.
const LIMIT = 200_000

const BASES: KnowledgeBaseSummary[] = [
  { id: 'kb-handbook', name: 'Product handbook', icon: BookOpen01Icon, colour: 'var(--chart-1)', documentCount: 48, tokens: 412_000 },
  { id: 'kb-support', name: 'Support macros', icon: CustomerSupportIcon, colour: 'var(--chart-2)', documentCount: 210, tokens: 168_000 },
  { id: 'kb-eng', name: 'Engineering wiki', icon: SourceCodeIcon, colour: 'var(--chart-3)', documentCount: 1240, tokens: 3_900_000 },
  { id: 'kb-sales', name: 'Sales playbooks', icon: Target02Icon, colour: 'var(--chart-4)', documentCount: 36, tokens: 96_000 },
]

const file = (id: string, name: string, size: number, included = true): ProjectKnowledgeFile => {
  const kind = fileKind(name)
  return { id, name, size, kind, tokens: estimateFileTokens(size, kind), included }
}

const FILES: ProjectKnowledgeFile[] = [
  file('f1', 'Q3 launch plan.pdf', 312_000),
  file('f2', 'Pricing tiers 2026.xlsx', 84_000),
  file('f3', 'Brand voice guide.md', 22_400),
  file('f4', 'Customer interviews.docx', 268_000, false),
  file('f5', 'Onboarding flow.png', 940_000),
]

const TEXTS: ProjectKnowledgeText[] = [
  {
    id: 't1',
    title: 'Release notes style',
    text: 'Lead with what changed for the customer, not how we built it. One line per change, present tense, no jargon. '.repeat(18),
  },
]

const LINKS: ProjectKnowledgeLink[] = [
  { id: 'l1', url: 'https://docs.example.com/api/changelog', title: 'API changelog', status: 'indexed', tokens: 6_400 },
]

let next = 0
const newId = (prefix: string) => `${prefix}-${++next}`

// The block's state for a demo: everything kept in memory, a web page read in
// about a second and a half.
function useDemoKnowledge(start: { files?: ProjectKnowledgeFile[]; texts?: ProjectKnowledgeText[]; links?: ProjectKnowledgeLink[]; bases?: string[] }) {
  const [files, setFiles] = useState(start.files ?? [])
  const [texts, setTexts] = useState(start.texts ?? [])
  const [links, setLinks] = useState(start.links ?? [])
  const [baseIds, setBaseIds] = useState(start.bases ?? [])
  const { later } = useTimers()

  const setLink = (id: string, patch: Partial<ProjectKnowledgeLink>) =>
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  return {
    files,
    texts,
    links,
    bases: BASES.filter((b) => baseIds.includes(b.id)),
    availableBases: BASES,
    addFile: (f: ProjectKnowledgeFile) => setFiles((fs) => [...fs, f]),
    props: {
      onAddFiles: (picked: File[]) =>
        setFiles((fs) => [...fs, ...picked.map((p) => file(newId('f'), p.name, p.size))]),
      onRemoveFile: (id: string) => setFiles((fs) => fs.filter((f) => f.id !== id)),
      onToggleFile: (id: string, included: boolean) =>
        setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, included } : f))),
      onAddText: (t: { title: string; text: string }) => setTexts((ts) => [...ts, { id: newId('t'), ...t }]),
      onRemoveText: (id: string) => setTexts((ts) => ts.filter((t) => t.id !== id)),
      onAddLink: (url: string) => {
        const id = newId('l')
        setLinks((ls) => [...ls, { id, url, status: 'queued' }])
        later(() => setLink(id, { status: 'processing' }), 500)
        // A made-up failure, so the failed row can be seen: any address with "fail" in it.
        later(() => setLink(id, url.includes('fail')
          ? { status: 'failed', error: 'The page did not load (404)' }
          : { status: 'indexed', tokens: 2_000 + (url.length * 137) % 9_000 }), 1500)
      },
      onRemoveLink: (id: string) => setLinks((ls) => ls.filter((l) => l.id !== id)),
      onLinkBase: (ids: string[]) => setBaseIds((b) => [...b, ...ids.filter((id) => !b.includes(id))]),
      onUnlinkBase: (id: string) => setBaseIds((b) => b.filter((x) => x !== id)),
    },
  }
}

export function ProjectKnowledgePanels() {
  const live = useDemoKnowledge({ files: FILES, texts: TEXTS, links: LINKS, bases: ['kb-handbook'] })
  const empty = useDemoKnowledge({})
  const hasLarge = live.files.some((f) => f.id.startsWith('large'))

  return (
    <>
      <Panel title="Context meter" note="How much of the project's context the knowledge takes. The tick is where search mode starts (80%).">
        <div className="grid min-w-0 gap-5">
          {[
            { used: 0, note: 'Empty' },
            { used: 76_000, note: '38%: full context' },
            { used: 148_000, note: 'Near the threshold' },
            { used: 262_000, note: 'Search mode' },
          ].map(({ used, note }) => (
            <div key={note} className="grid min-w-0 gap-2">
              <Row className="justify-between">
                <span className="text-muted-foreground text-[11px]">{note}</span>
                <ContextModeBadge mode={knowledgeMode(used, LIMIT)} />
              </Row>
              <ContextMeter used={used} limit={LIMIT} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Context meter, small, and mode badges" note="The small meter has no note line, for a tab or a card. Focus or hover a badge for what it means.">
        <div className="grid min-w-0 gap-5">
          <ContextMeter used={52_000} limit={LIMIT} size="sm" />
          <ContextMeter used={171_000} limit={LIMIT} size="sm" />
          <ContextMeter used={480_000} limit={LIMIT} size="sm" />
          <Row>
            <ContextModeBadge mode="full" />
            <ContextModeBadge mode="search" />
          </Row>
        </div>
      </Panel>

      <Panel
        wide
        title="Project knowledge"
        note="Live, kept in memory. Turn a file off and it stops counting. Add a large file to pass the threshold: the project switches to search mode by itself. A web page address with “fail” in it shows a failed read."
      >
        <div className="grid min-w-0 gap-3">
          <Row>
            <Button
              variant="outline"
              size="sm"
              disabled={hasLarge}
              onClick={() => live.addFile({ ...file('large', 'Supplier contracts 2025.pdf', 2_150_000), id: 'large' })}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Add a large file
            </Button>
            {hasLarge && <span className="text-muted-foreground text-[11px]">Remove it, or turn it off, to go back to full context.</span>}
          </Row>
          <ProjectKnowledge
            files={live.files}
            texts={live.texts}
            links={live.links}
            bases={live.bases}
            availableBases={live.availableBases}
            limit={LIMIT}
            {...live.props}
          />
        </div>
      </Panel>

      <Panel title="Empty state" note="No knowledge yet: what it is, and the ways to add it.">
        <ProjectKnowledge
          files={empty.files}
          texts={empty.texts}
          links={empty.links}
          bases={empty.bases}
          availableBases={empty.availableBases}
          limit={LIMIT}
          {...empty.props}
        />
      </Panel>
    </>
  )
}
