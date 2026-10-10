import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon, Copy01Icon, FileSearchIcon, Search01Icon, SearchRemoveIcon, Tick02Icon, ViewIcon, ViewOffIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { FILE_KIND_ICONS, fileIcon } from '@/components/file-chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { copyText, useCopied } from '@/lib/clipboard'
import { formatNumber } from '@/lib/format'
import { plural } from '@/lib/text'
import type { RetrievalSettings, RetrievedChunk } from './knowledge-types'

// The retrieval tester of a knowledge base, as the RAG tools put one beside
// the settings: type a question and see exactly which chunks the assistant
// would fetch for it, ranked, each with its document, page and similarity
// score, and the words that matched marked in the passage. The chunks that
// go to the model come first (the top-K above the cut-off); chunks past the
// top-K and chunks below the cut-off follow, faded, so a missed passage can
// be found and the settings tuned. "What the model would see" shows the
// fetched passages joined as they are added to the prompt.
//
// The caller does the search (`onSearch`); the tester splits what comes back
// by the settings, so a search may return every scored chunk or only the
// fetched ones. Top-K and hybrid search can be changed for the test alone:
// the saved settings stay as they are.

export type RetrievalTesterProps = {
  // Runs the search with the settings in force for this test.
  onSearch: (query: string, settings: RetrievalSettings) => Promise<RetrievedChunk[]> | RetrievedChunk[]
  // The knowledge base's saved settings.
  settings: RetrievalSettings
  // Questions to try, shown as chips under the box.
  examples?: string[]
  className?: string
}

// A score at or above this is a strong match, whatever the cut-off.
const STRONG = 0.7
// Passages longer than this fold to three lines.
const LONG = 240
// Chunks below the cut-off shown before "Show N more".
const BELOW_SHOWN = 3
const TOP_K_CHOICES = [1, 3, 5, 8, 10, 15, 20]

type Overrides = { topK?: number; hybrid?: boolean }

type Run =
  | { status: 'idle' }
  | { status: 'running'; query: string }
  | { status: 'done'; query: string; chunks: RetrievedChunk[]; ms: number }
  | { status: 'error'; query: string; message: string }

export type ScoreTone = 'strong' | 'fair' | 'weak'

// How good a similarity score is: strong from 0.7, fair down to the cut-off,
// weak below it.
export function scoreTone(score: number, minScore: number): ScoreTone {
  if (score >= STRONG && score >= minScore) return 'strong'
  return score >= minScore ? 'fair' : 'weak'
}

const TONE = {
  strong: { bar: 'bg-status-done', label: 'strong match' },
  fair: { bar: 'bg-status-progress', label: 'fair match' },
  weak: { bar: 'bg-status-todo', label: 'below the cut-off' },
} as const

// About four characters to a token, for an estimate shown to people.
const estimateTokens = (text: string) => Math.ceil(text.length / 4)

const sourceLine = (c: RetrievedChunk) => (c.page ? `${c.documentName}, page ${c.page}` : c.documentName)

// The fetched passages as one block, numbered, each under its source.
function modelContext(chunks: RetrievedChunk[]) {
  return chunks.map((c, i) => `[${i + 1}] ${sourceLine(c)}\n${c.text.trim()}`).join('\n\n')
}

export function RetrievalTester({ onSearch, settings, examples = [], className }: RetrievalTesterProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [overrides, setOverrides] = useState<Overrides>({})
  const [run, setRun] = useState<Run>({ status: 'idle' })
  const [showAllBelow, setShowAllBelow] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [copied, flagCopied] = useCopied()
  // Only the latest search may land: an older one finishing late is dropped.
  const seq = useRef(0)
  const lastQuery = useRef('')
  const input = useRef<HTMLInputElement>(null)

  const effective: RetrievalSettings = { ...settings, ...overrides }
  const overridden = (overrides.topK !== undefined && overrides.topK !== settings.topK)
    || (overrides.hybrid !== undefined && overrides.hybrid !== settings.hybrid)

  const search = async (text: string, used: RetrievalSettings) => {
    const q = text.trim()
    if (!q) return input.current?.focus()
    const mine = ++seq.current
    lastQuery.current = q
    setShowAllBelow(false)
    setRun({ status: 'running', query: q })
    const started = performance.now()
    try {
      const found = await onSearch(q, used)
      if (mine !== seq.current) return
      setRun({
        status: 'done',
        query: q,
        chunks: [...found].sort((a, b) => b.score - a.score),
        ms: Math.max(1, Math.round(performance.now() - started)),
      })
    } catch (error) {
      if (mine !== seq.current) return
      setRun({ status: 'error', query: q, message: error instanceof Error ? error.message : 'The search did not finish.' })
    }
  }

  // The saved settings changed (in the settings form beside it): search again
  // with them, so the results always match what is shown.
  const settingsKey = JSON.stringify(settings)
  const firstSettings = useRef(settingsKey)
  useEffect(() => {
    if (settingsKey === firstSettings.current) return
    firstSettings.current = settingsKey
    if (lastQuery.current) void search(lastQuery.current, { ...settings, ...overrides })
    // Only a change of the saved settings starts this; `search` reads the rest.
  }, [settingsKey])

  const override = (next: Overrides) => {
    setOverrides(next)
    if (lastQuery.current) void search(lastQuery.current, { ...settings, ...next })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void search(query, effective)
  }

  const tryExample = (text: string) => {
    setQuery(text)
    void search(text, effective)
  }

  // Split what came back by the settings in force.
  const chunks = run.status === 'done' ? run.chunks : []
  const above = chunks.filter((c) => c.score >= effective.minScore)
  const sent = above.slice(0, effective.topK)
  const pastK = above.slice(effective.topK)
  const below = chunks.filter((c) => c.score < effective.minScore)
  const belowShown = showAllBelow ? below : below.slice(0, BELOW_SHOWN)
  const documents = new Set(sent.map((c) => c.documentId)).size
  const context = modelContext(sent)
  const cutOff = effective.minScore.toFixed(2)

  const announcement = run.status === 'running'
    ? 'Searching'
    : run.status === 'done'
      ? sent.length
        ? `${plural(sent.length, 'chunk')} from ${plural(documents, 'document')}`
        : `No chunk scored above ${cutOff}`
      : run.status === 'error' ? 'The search failed' : ''

  return (
    <div className={cn('@container grid min-w-0 gap-3', className)}>
      <form onSubmit={submit} role="search" aria-label="Test retrieval" className="flex min-w-0 gap-2">
        <div className="relative min-w-0 flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2"
          />
          <Input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question the way someone would in a chat"
            aria-label="Question to test"
            enterKeyHint="search"
            className="pl-7"
          />
        </div>
        <Button type="submit" disabled={run.status === 'running'}>Test</Button>
      </form>

      {examples.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-[11px]" id={`${id}-examples`}>Try</span>
          <ul aria-labelledby={`${id}-examples`} className="contents">
            {examples.map((text) => (
              <li key={text} className="min-w-0 max-w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground max-w-full rounded-full font-normal"
                  onClick={() => tryExample(text)}
                >
                  <span className="min-w-0 truncate">{text}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-muted/40 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2 text-xs">
        <span className="text-muted-foreground">For this test only</span>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-topk`} className="font-normal">Top-K</Label>
          <Select value={String(effective.topK)} onValueChange={(v) => override({ ...overrides, topK: Number(v) })}>
            <SelectTrigger id={`${id}-topk`} size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([...TOP_K_CHOICES, settings.topK])].sort((a, b) => a - b).map((k) => (
                <SelectItem key={k} value={String(k)}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-hybrid`}
            size="sm"
            checked={effective.hybrid}
            onCheckedChange={(hybrid) => override({ ...overrides, hybrid })}
          />
          <Label htmlFor={`${id}-hybrid`} className="font-normal">Hybrid search</Label>
        </div>
        <span className="text-muted-foreground tabular-nums">
          Cut-off {cutOff}{effective.rerank ? ' · Reranking on' : ''}
        </span>
        {overridden && (
          <Button type="button" variant="link" size="xs" className="ml-auto h-auto px-0" onClick={() => override({})}>
            Use saved settings
          </Button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">{announcement}</p>

      <div aria-busy={run.status === 'running'} className="min-w-0">
        {run.status === 'idle' && (
          <div className="text-muted-foreground grid justify-items-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center">
            <HugeiconsIcon icon={FileSearchIcon} strokeWidth={2} className="size-5" />
            <p className="text-foreground text-xs font-medium">Test a question</p>
            <p className="max-w-sm text-[11px] leading-4">
              See which chunks the assistant would fetch for it and how well each one matched, before anyone asks it
              in a chat.
            </p>
          </div>
        )}

        {run.status === 'running' && (
          <ul aria-label="Searching" className="divide-y rounded-lg border">
            {[0, 1, 2].map((i) => (
              <li key={i} className="grid gap-2 px-3 py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3.5" />
                  <Skeleton className="h-3 w-40 max-w-[50%]" />
                  <Skeleton className="ml-auto h-3 w-16" />
                </div>
                <Skeleton className="ml-5.5 h-3 w-[90%]" />
                <Skeleton className="ml-5.5 h-3 w-[70%]" />
              </li>
            ))}
          </ul>
        )}

        {run.status === 'error' && (
          <div role="alert" className="grid justify-items-center gap-2 rounded-lg border px-4 py-6 text-center">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="text-destructive size-5" />
            <p className="text-xs font-medium">The search did not finish</p>
            <p className="text-muted-foreground max-w-sm text-[11px]">{run.message}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void search(run.query, effective)}>
              Try again
            </Button>
          </div>
        )}

        {run.status === 'done' && (
          <div className="grid min-w-0 gap-2">
            {sent.length > 0 ? (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-muted-foreground text-xs tabular-nums">
                  <span className="text-foreground font-medium">{plural(sent.length, 'chunk')}</span>
                  {' from '}{plural(documents, 'document')} · {formatNumber(run.ms)} ms
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={showContext}
                  aria-controls={`${id}-context`}
                  onClick={() => setShowContext((s) => !s)}
                >
                  <HugeiconsIcon icon={showContext ? ViewOffIcon : ViewIcon} strokeWidth={2} data-icon="inline-start" />
                  What the model would see
                </Button>
              </div>
            ) : (
              <div className="grid justify-items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
                <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2} className="text-muted-foreground size-5" />
                <p className="text-xs font-medium tabular-nums">No chunk scored above {cutOff}</p>
                <p className="text-muted-foreground max-w-sm text-[11px] leading-4">
                  {below.length
                    ? 'The closest matches are below. Lower the cut-off in the retrieval settings, or add documents that cover this question.'
                    : 'Nothing in the knowledge base matched. Add documents that cover this question, or ask it another way.'}
                </p>
              </div>
            )}

            {showContext && sent.length > 0 && (
              <section id={`${id}-context`} aria-label="What the model would see" className="bg-muted/40 grid min-w-0 gap-2 rounded-lg border p-3">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <p className="text-muted-foreground text-[11px]">
                    The top {sent.length} passages, as they are added to the prompt · about{' '}
                    {formatNumber(estimateTokens(context))} tokens
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (await copyText(context, { success: false })) flagCopied()
                    }}
                  >
                    <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} data-icon="inline-start" />
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-card max-h-72 min-w-0 overflow-auto rounded-md border p-2.5 font-mono text-[11px] leading-5 break-words whitespace-pre-wrap">
                  {context}
                </pre>
              </section>
            )}

            {sent.length > 0 && (
              <ChunkList
                label="Chunks sent to the model"
                chunks={sent}
                firstRank={1}
                minScore={effective.minScore}
              />
            )}

            {pastK.length > 0 && (
              <>
                <Divider>Past the top-K ({effective.topK}): not sent</Divider>
                <ChunkList
                  label="Chunks past the top-K"
                  chunks={pastK}
                  firstRank={sent.length + 1}
                  minScore={effective.minScore}
                  faded
                />
              </>
            )}

            {below.length > 0 && (
              <>
                <Divider>Below the cut-off ({cutOff})</Divider>
                <ChunkList
                  label="Chunks below the cut-off"
                  chunks={belowShown}
                  firstRank={above.length + 1}
                  minScore={effective.minScore}
                  faded
                />
                {below.length > BELOW_SHOWN && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground justify-self-start"
                    onClick={() => setShowAllBelow((s) => !s)}
                  >
                    {showAllBelow ? 'Show fewer' : `Show ${below.length - BELOW_SHOWN} more`}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground flex min-w-0 items-center gap-2 pt-1 text-[11px] tabular-nums">
      <span className="bg-border h-px flex-1" />
      <span className="min-w-0 shrink text-center">{children}</span>
      <span className="bg-border h-px flex-1" />
    </div>
  )
}

function ChunkList({ label, chunks, firstRank, minScore, faded = false }: {
  label: string
  chunks: RetrievedChunk[]
  firstRank: number
  minScore: number
  faded?: boolean
}) {
  return (
    <ol aria-label={label} className="bg-card divide-y rounded-lg border">
      {chunks.map((chunk, i) => (
        <ChunkRow key={chunk.id} chunk={chunk} rank={firstRank + i} minScore={minScore} faded={faded} />
      ))}
    </ol>
  )
}

function ChunkRow({ chunk, rank, minScore, faded }: {
  chunk: RetrievedChunk
  rank: number
  minScore: number
  faded: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const long = chunk.text.length > LONG
  const icon = chunk.documentKind ? FILE_KIND_ICONS[chunk.documentKind] : fileIcon(chunk.documentName)

  return (
    <li className={cn('grid min-w-0 gap-1.5 px-3 py-2.5', faded && 'opacity-60')}>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-muted-foreground w-4 shrink-0 text-right text-[11px] tabular-nums">
          <span className="sr-only">Rank </span>{rank}
        </span>
        <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
        <span className="min-w-0 truncate text-xs font-medium" title={chunk.documentName}>{chunk.documentName}</span>
        {chunk.page !== undefined && (
          <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">p. {chunk.page}</span>
        )}
        <SimilarityScore score={chunk.score} minScore={minScore} className="ml-auto" />
      </div>
      <p
        id={`${id}-text`}
        className={cn('text-muted-foreground min-w-0 pl-[2.875rem] text-xs leading-5 break-words', long && !open && 'line-clamp-3')}
      >
        <Highlighted text={chunk.text} ranges={chunk.highlights} />
      </p>
      {long && (
        <Button
          type="button"
          variant="link"
          size="xs"
          aria-expanded={open}
          aria-controls={`${id}-text`}
          className="ml-[2.875rem] h-auto justify-self-start px-0"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Show less' : 'Show more'}
        </Button>
      )}
    </li>
  )
}

// The score as a short bar and a number, coloured by how good it is.
export function SimilarityScore({ score, minScore, className }: { score: number; minScore: number; className?: string }) {
  const tone = TONE[scoreTone(score, minScore)]
  const value = Math.min(1, Math.max(0, score))
  return (
    <span className={cn('flex shrink-0 items-center gap-1.5', className)} title={`Similarity score ${value.toFixed(2)}, ${tone.label}`}>
      <span aria-hidden className="bg-muted h-1 w-10 overflow-hidden rounded-full">
        <span className={cn('block h-full rounded-full', tone.bar)} style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="text-[11px] font-medium tabular-nums">
        <span className="sr-only">Similarity score </span>{value.toFixed(2)}
        <span className="sr-only">, {tone.label}</span>
      </span>
    </span>
  )
}

// The passage with the matched words marked. Ranges are [start, end) in the
// text; overlapping or out-of-range ones are trimmed.
function Highlighted({ text, ranges = [] }: { text: string; ranges?: [number, number][] }) {
  const sorted = ranges.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0])
  const parts: { text: string; mark: boolean }[] = []
  let at = 0
  for (const [s0, e0] of sorted) {
    const s = Math.max(s0, at)
    const e = Math.min(e0, text.length)
    if (e <= s) continue
    if (s > at) parts.push({ text: text.slice(at, s), mark: false })
    parts.push({ text: text.slice(s, e), mark: true })
    at = e
  }
  if (at < text.length) parts.push({ text: text.slice(at), mark: false })
  return parts.map((p, i) => (p.mark
    ? <mark key={i} className="bg-brand/20 text-foreground rounded-[3px] px-px">{p.text}</mark>
    : <span key={i}>{p.text}</span>))
}
