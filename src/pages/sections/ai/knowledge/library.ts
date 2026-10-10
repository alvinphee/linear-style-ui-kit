import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { KnowledgeSourceDraft } from '@/blocks/ai/knowledge/knowledge-sources'
import type { KnowledgeBase, KnowledgeDocument, KnowledgeSource } from '@/blocks/ai/knowledge/knowledge-types'
import { fileKind } from '@/components/file-chip'
import { describeRecurrence, type Recurrence } from '@/components/recurrence-picker'
import { estimateFileTokens, estimateTokens } from '@/lib/token-estimate'
import { now } from '../data'
import { CONNECTORS } from '../settings/connectors-data'
import { DEFAULT_RETRIEVAL, SAMPLE_SOURCE_SCHEDULES } from './bases-data'

// The knowledge bases with a made-up indexer, for the kit's demos and the AI
// chat app. A new or re-indexed document waits (Queued), then Processing
// ticks up to Indexed over a few seconds, two at a time per knowledge base.
// Images, files with "scan" in the name and files over 20 MB fail, as a
// scanned PDF would. A sync takes two seconds and may find new documents.
// With a storage key the bases are kept in this browser.

const MAX_BYTES = 20 * 1024 * 1024
const CHUNK_STEP = DEFAULT_RETRIEVAL.chunkSize - DEFAULT_RETRIEVAL.chunkOverlap
// How many documents of one knowledge base index at once.
const PARALLEL = 2

let counter = 0
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(++counter).toString(36)}`

// Why a document would fail, or nothing when it indexes.
function failureOf(d: Pick<KnowledgeDocument, 'name' | 'kind' | 'size'>) {
  if (d.size > MAX_BYTES) return 'Too large: files can be up to 20 MB. Split it, or upload a compressed copy.'
  if (d.kind === 'image' || /scan/i.test(d.name)) {
    return 'No text found: the file is scanned pages. Upload a text version, or turn on text recognition (OCR) in Settings.'
  }
  return undefined
}

// One step of indexing: processing documents move on (by an amount that
// differs per document, so they don't finish together), finished ones turn
// Indexed or Failed, and queued ones start while there is room.
function tick(base: KnowledgeBase): KnowledgeBase {
  if (!base.documents.some((d) => d.status === 'queued' || d.status === 'processing')) return base
  let documents = base.documents.map((d): KnowledgeDocument => {
    if (d.status !== 'processing') return d
    const step = 9 + (d.id.charCodeAt(d.id.length - 1) % 9) * 2
    const progress = Math.min(100, (d.progress ?? 0) + step)
    if (progress < 100) return { ...d, progress }
    const error = failureOf(d)
    return error
      ? { ...d, status: 'failed', progress: undefined, error, chunks: undefined }
      : { ...d, status: 'indexed', progress: undefined, error: undefined, chunks: Math.max(1, Math.ceil(d.tokens / CHUNK_STEP)), updatedAt: now() }
  })
  let room = PARALLEL - documents.filter((d) => d.status === 'processing').length
  documents = documents.map((d) => (d.status === 'queued' && room-- > 0 ? { ...d, status: 'processing', progress: 0 } : d))
  return { ...base, documents, updatedAt: now() }
}

export function queuedDocument(name: string, size: number, sourceId: string, tokens?: number): KnowledgeDocument {
  const kind = fileKind(name)
  return { id: newId('doc'), name, kind, sourceId, size, tokens: tokens ?? estimateFileTokens(size, kind), status: 'queued', updatedAt: now() }
}

// Each source's document count, from the documents.
const recount = (base: KnowledgeBase): KnowledgeBase => ({
  ...base,
  sources: base.sources.map((s) => ({ ...s, documentCount: base.documents.filter((d) => d.sourceId === s.id).length })),
})

const clone = (bases: KnowledgeBase[]): KnowledgeBase[] =>
  bases.map((b) => ({ ...b, sources: b.sources.map((s) => ({ ...s, sync: s.sync && { ...s.sync } })), documents: b.documents.map((d) => ({ ...d })) }))

type Saved = { bases: KnowledgeBase[]; schedules: Record<string, Recurrence> }

function load(key: string | undefined, initial: KnowledgeBase[]): Saved {
  const fresh = { bases: clone(initial), schedules: { ...SAMPLE_SOURCE_SCHEDULES } }
  if (!key) return fresh
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Saved | null
    return saved && Array.isArray(saved.bases) ? { bases: saved.bases, schedules: saved.schedules ?? {} } : fresh
  } catch {
    return fresh
  }
}

export function useKnowledgeLibrary(initial: KnowledgeBase[], storageKey?: string) {
  const [state, setState] = useState(() => load(storageKey, initial))
  const timers = useRef<number[]>([])
  const { bases, schedules } = state
  const setBases = (update: (bases: KnowledgeBase[]) => KnowledgeBase[]) => setState((s) => ({ ...s, bases: update(s.bases) }))

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  useEffect(() => {
    if (!storageKey) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch {
        // Private windows can refuse storage; the bases still work for this visit.
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [storageKey, state])

  const busy = bases.some((b) => b.documents.some((d) => d.status === 'queued' || d.status === 'processing'))
  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => setBases((bs) => bs.map(tick)), 600)
    return () => clearInterval(timer)
  }, [busy])

  const patchBase = (baseId: string, change: (b: KnowledgeBase) => KnowledgeBase) =>
    setBases((bs) => bs.map((b) => (b.id === baseId ? recount({ ...change(b), updatedAt: now() }) : b)))
  const patchSource = (baseId: string, id: string, change: (s: KnowledgeSource) => KnowledgeSource) =>
    patchBase(baseId, (b) => ({ ...b, sources: b.sources.map((s) => (s.id === id ? change(s) : s)) }))

  // Files go to the knowledge base's upload source, made the first time.
  const upload = (baseId: string, files: File[]) => patchBase(baseId, (b) => {
    const existing = b.sources.find((s) => s.kind === 'upload')
    const source: KnowledgeSource = existing ?? { id: newId('src'), kind: 'upload', name: 'Uploaded files', documentCount: 0 }
    return {
      ...b,
      sources: existing ? b.sources : [...b.sources, source],
      documents: [...files.map((f) => queuedDocument(f.name, f.size, source.id)), ...b.documents],
    }
  })

  // A sync finds `found` new documents, or re-checks the newest one.
  const sync = (sourceId: string, found: string[] = []) => {
    setBases((bs) => bs.map((b) => (b.sources.some((s) => s.id === sourceId)
      ? { ...b, sources: b.sources.map((s) => (s.id === sourceId && s.sync ? { ...s, sync: { ...s.sync, status: 'syncing', error: undefined } } : s)) }
      : b)))
    timers.current.push(window.setTimeout(() => {
      setBases((bs) => bs.map((b) => {
        if (!b.sources.some((s) => s.id === sourceId)) return b
        const docs = found.map((name) => queuedDocument(name, 6_000 + name.length * 1_400, sourceId))
        const recheck = found.length ? undefined : b.documents.find((d) => d.sourceId === sourceId && d.status === 'indexed')
        return recount({
          ...b,
          updatedAt: now(),
          sources: b.sources.map((s) => (s.id === sourceId && s.sync ? { ...s, sync: { ...s.sync, status: 'idle', lastSyncedAt: now() } } : s)),
          documents: [...docs, ...b.documents.map((d) => (d === recheck ? { ...d, status: 'queued' as const, chunks: undefined } : d))],
        })
      }))
    }, 2_000))
  }

  const addSource = (baseId: string, draft: KnowledgeSourceDraft) => {
    if (draft.kind === 'upload') return upload(baseId, draft.files)
    if (draft.kind === 'text') {
      const sourceId = newId('src')
      patchBase(baseId, (b) => ({
        ...b,
        sources: [...b.sources, { id: sourceId, kind: 'text', name: draft.title, detail: 'Pasted text', documentCount: 1 }],
        documents: [queuedDocument(`${draft.title}.md`, new Blob([draft.text]).size, sourceId, estimateTokens(draft.text)), ...b.documents],
      }))
      return
    }
    const id = newId('src')
    const label = describeRecurrence(draft.schedule)
    setState((s) => ({ ...s, schedules: { ...s.schedules, [id]: draft.schedule } }))
    if (draft.kind === 'website') {
      const host = new URL(draft.url).hostname
      patchBase(baseId, (b) => ({
        ...b,
        sources: [...b.sources, {
          id, kind: 'website', name: host, detail: `${draft.url} · ${draft.depth} ${draft.depth === 1 ? 'link' : 'links'} deep`,
          sync: { label, status: 'idle' }, documentCount: 0,
        }],
      }))
      sync(id, ['Home', 'Getting started', 'Pricing', 'Questions and answers'].map((p) => `${host} › ${p}.txt`))
    } else {
      const connector = CONNECTORS.find((c) => c.id === draft.connectorId)
      patchBase(baseId, (b) => ({
        ...b,
        sources: [...b.sources, {
          id, kind: 'connector', connectorId: draft.connectorId, icon: connector?.icon,
          name: `${connector?.name ?? 'App'} › ${draft.folder === '/' ? 'Everything' : draft.folder.split('/').filter(Boolean).pop()}`,
          detail: draft.folder, sync: { label, status: 'idle' }, documentCount: 0,
        }],
      }))
      sync(id, ['Team handbook.docx', 'Meeting notes.md', 'Quarterly review.pdf'])
    }
  }

  const reindex = (baseId: string, ids: string[]) => {
    patchBase(baseId, (b) => ({
      ...b,
      documents: b.documents.map((d) => (ids.includes(d.id)
        ? { ...d, status: 'queued', progress: undefined, error: undefined, chunks: undefined }
        : d)),
    }))
    toast(`Re-indexing ${ids.length === 1 ? '1 document' : `${ids.length} documents`}`)
  }

  return {
    bases,
    setBases,
    patchBase,
    upload,
    sync,
    addSource,
    reindex,
    removeDocuments: (baseId: string, ids: string[]) =>
      patchBase(baseId, (b) => ({ ...b, documents: b.documents.filter((d) => !ids.includes(d.id)) })),
    removeSource: (baseId: string, id: string) => patchBase(baseId, (b) => ({
      ...b,
      sources: b.sources.filter((s) => s.id !== id),
      documents: b.documents.filter((d) => d.sourceId !== id),
    })),
    editSync: (baseId: string, id: string, recurrence: Recurrence) => {
      setState((s) => ({ ...s, schedules: { ...s.schedules, [id]: recurrence } }))
      patchSource(baseId, id, (s) => ({ ...s, sync: s.sync && { ...s.sync, label: describeRecurrence(recurrence) } }))
      toast('Sync schedule saved', { description: describeRecurrence(recurrence) })
    },
    scheduleOf: (id: string) => schedules[id],
    reset: () => setState({ bases: clone(initial), schedules: { ...SAMPLE_SOURCE_SCHEDULES } }),
  }
}
