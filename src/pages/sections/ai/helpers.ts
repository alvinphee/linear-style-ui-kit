import type { ArtifactDraft } from './engine'
import type { Artifact, AssistantMessage, Chat, Message, Part, Reply, ReplyStatus } from './types'

export function currentReply(message: AssistantMessage): Reply {
  return message.versions[message.current] ?? message.versions[message.versions.length - 1]
}

// Adds a draft to the artifact list: a new version when it revises one that
// exists, otherwise a new artifact with version 1.
export function withArtifact(artifacts: Artifact[], id: string, draft: ArtifactDraft, at: number): Artifact[] {
  const existing = artifacts.find((a) => a.id === id)
  if (existing) {
    return artifacts.map((a) => (a.id === id
      ? { ...a, source: draft.source, versions: [...a.versions, { content: draft.content, at }] }
      : a))
  }
  return [...artifacts, {
    id, title: draft.title, kind: draft.kind, language: draft.language, source: draft.source,
    versions: [{ content: draft.content, at }],
  }]
}

export function artifactRef(artifacts: Artifact[], draft: ArtifactDraft, newId: string) {
  const existing = draft.reviseId ? artifacts.find((a) => a.id === draft.reviseId) : undefined
  return existing
    ? { artifactId: existing.id, version: existing.versions.length + 1 }
    : { artifactId: newId, version: 1 }
}

// The newest artifact produced before `beforeIndex`, with its latest content.
export function lastArtifactIn(messages: Message[], artifacts: Artifact[], beforeIndex = messages.length) {
  for (let i = Math.min(beforeIndex, messages.length) - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'assistant') continue
    const parts = currentReply(message).parts
    for (let j = parts.length - 1; j >= 0; j--) {
      const part = parts[j]
      if (part.type !== 'artifact') continue
      const artifact = artifacts.find((a) => a.id === part.artifactId)
      if (artifact) return { artifact, content: artifact.versions[artifact.versions.length - 1].content }
    }
  }
  return null
}

// Settles a reply. Stopping also freezes anything still running.
export function finishReply(reply: Reply, status: ReplyStatus, at: number): Reply {
  if (status !== 'stopped') {
    return { ...reply, status, activity: undefined, finishedAt: status === 'awaiting' ? undefined : at }
  }
  const parts = reply.parts.map((part): Part => {
    if (part.type === 'thinking' && part.state === 'running') {
      return { ...part, state: 'done', ms: part.startedAt ? at - part.startedAt : part.ms }
    }
    if (part.type === 'tool' && part.state === 'running') {
      return { ...part, state: 'stopped', ms: part.startedAt ? at - part.startedAt : part.ms }
    }
    if (part.type === 'text' && part.streaming) return { ...part, streaming: false }
    if (part.type === 'plan' && part.steps.some((s) => s.state === 'running')) {
      return { ...part, steps: part.steps.map((s) => (s.state === 'running' ? { label: s.label, state: 'pending' } : s)) }
    }
    return part
  })
  return { ...reply, status, parts, activity: undefined, finishedAt: at }
}

export function replyText(reply: Reply) {
  return reply.parts
    .filter((p): p is Extract<Part, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('\n\n')
}

export function chatHasArtifacts(chat: Chat) {
  return chat.messages.some((m) => m.role === 'assistant' && m.versions.some((r) => r.parts.some((p) => p.type === 'artifact')))
}

export function downloadText(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function copyToClipboard(text: string) {
  try {
    return navigator.clipboard?.writeText(text).catch(() => {}) ?? Promise.resolve()
  } catch {
    return Promise.resolve()
  }
}

export function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'
}

export const ARTIFACT_FILE: Record<string, { ext: string; type: string }> = {
  markdown: { ext: 'md', type: 'text/markdown' },
  csv: { ext: 'csv', type: 'text/csv' },
  typescript: { ext: 'ts', type: 'text/plain' },
  sql: { ext: 'sql', type: 'text/plain' },
}

export function artifactFileName(artifact: Artifact) {
  const file = ARTIFACT_FILE[artifact.language] ?? { ext: 'txt', type: 'text/plain' }
  const name = /\.\w+$/.test(artifact.title) ? artifact.title : `${slug(artifact.title)}.${file.ext}`
  return { name, type: file.type }
}
