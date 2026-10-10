import type { IconSvgElement } from '@hugeicons/react'
import type { FileKind } from '@/components/file-chip'

// The shapes the knowledge blocks share: a knowledge base, its sources and
// documents, how it is searched, and what a search finds. A knowledge base
// is a library the assistant searches (retrieval-augmented generation, RAG):
// its documents are split into chunks and indexed, and only the chunks that
// match a question go to the model. Project knowledge is the small case:
// while it fits, every file is read in full (long context).

// Where a document is in indexing: waiting, being chunked and embedded,
// searchable, or failed (with a reason).
export type IndexStatus = 'queued' | 'processing' | 'indexed' | 'failed'

// Where documents come from: uploaded files, a crawled website, a folder in a
// connected app (synced), or text pasted in.
export type KnowledgeSourceKind = 'upload' | 'website' | 'connector' | 'text'

export type KnowledgeSource = {
  id: string
  kind: KnowledgeSourceKind
  name: string
  // The address, folder path or file count, in a few words.
  detail?: string
  // For a connector source, the connector's id (Settings › Connectors).
  connectorId?: string
  icon?: IconSvgElement
  // How it stays current, in words ("Every day at 02:00"), and how the last
  // sync went. Uploads and text have none.
  sync?: { label: string; lastSyncedAt?: number; status: 'idle' | 'syncing' | 'error'; error?: string }
  documentCount: number
}

export type KnowledgeDocument = {
  id: string
  name: string
  kind: FileKind
  sourceId: string
  // Bytes, and the estimated tokens of its text.
  size: number
  tokens: number
  // Pieces it was split into for search, once indexed.
  chunks?: number
  pages?: number
  status: IndexStatus
  // 0 to 100 while processing.
  progress?: number
  error?: string
  // When it last changed or was synced, in ms.
  updatedAt: number
}

// How the knowledge base is split and searched. Most people never change it.
export type RetrievalSettings = {
  // Tokens per chunk, and how many tokens neighbouring chunks share.
  chunkSize: number
  chunkOverlap: number
  embeddingModel: string
  // Keyword search alongside meaning (semantic) search.
  hybrid: boolean
  // A second, slower model reorders the best matches.
  rerank: boolean
  // How many chunks go to the model per question.
  topK: number
  // Matches scoring below this (0 to 1) are left out.
  minScore: number
}

export type KnowledgeAccess = 'private' | 'people' | 'organisation'

export type KnowledgeBase = {
  id: string
  name: string
  description: string
  icon?: IconSvgElement
  // A CSS colour from theme tokens, such as var(--chart-2).
  colour?: string
  sources: KnowledgeSource[]
  documents: KnowledgeDocument[]
  settings: RetrievalSettings
  access: KnowledgeAccess
  // People it is shared with, when access is 'people'.
  members?: { id: string; name: string; email: string }[]
  // Projects that search it.
  linkedProjects: { id: string; name: string }[]
  owner: string
  updatedAt: number
}

// A knowledge base in a short form, for lists that link to one.
export type KnowledgeBaseSummary = Pick<KnowledgeBase, 'id' | 'name' | 'icon' | 'colour'> & {
  documentCount: number
  tokens: number
}

// One chunk a search found: which document, where in it, the passage, and how
// well it matched (0 to 1). `highlights` are [start, end) ranges in `text`.
export type RetrievedChunk = {
  id: string
  documentId: string
  documentName: string
  documentKind?: FileKind
  page?: number
  text: string
  score: number
  highlights?: [number, number][]
}

// A source a reply cites from knowledge: a project file or a knowledge base's
// document, with the passage it used.
export type KnowledgeCitation = {
  documentName: string
  documentKind?: FileKind
  page?: number
  passage: string
  score?: number
  // Where it lives: the project's files, or a knowledge base (by name).
  from: { kind: 'project' | 'knowledge-base'; name: string }
}
