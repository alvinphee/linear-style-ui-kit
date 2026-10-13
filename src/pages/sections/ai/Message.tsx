import { Fragment, memo, useState } from 'react'
import { toast } from 'sonner'
import {
  AssistantMessage, FeedbackDialog, FollowUps, MessageActions, SourcesRow, StoppedNote, UserMessage, useReadAloud,
} from '@/blocks/ai/chat/chat-message'
import { SourceSheet } from '@/blocks/ai/citations/source-panel'
import { Markdown } from '@/blocks/markdown'
import { copyText } from '@/lib/clipboard'
import { formatDuration } from '@/lib/format'
import { goTo } from '../../nav'
import { useActions } from './context'
import { modelById } from './data'
import { currentReply, replyText } from './helpers'
import { useAiPrefs } from './settings/prefs'
import { VOICES } from './settings/VoiceTab'
import { ApprovalCard, ArtifactCard, ErrorCard, ProcessTrail, type ProcessPart } from './parts'
import type { AssistantMessage as AssistantMessageData, Part, PartOf, UserMessage as UserMessageData } from './types'

// The workspace's side of the chat message blocks: it reads the store's
// messages, maps them to the blocks' props and wires their callbacks to the
// workspace's actions.

// The Copy buttons show their own tick, so no toast.
const copy = (text: string) => copyText(text, { success: false, error: false })

// Links to "#board" in a reply open that kit page, as in ./markdown.tsx.
const openKitPage = (href: string) => goTo(href.slice(1))

// `canFork`: Branch in new chat is offered (not in an incognito chat).
export const UserMessageView = memo(function UserMessageView({ chatId, message, mentions, canFork }: {
  chatId: string
  message: UserMessageData
  mentions: RegExp | null
  canFork: boolean
}) {
  const actions = useActions()
  const total = message.branches?.length ?? 1
  return (
    <UserMessage
      text={message.text}
      attachments={message.attachments.map(({ id, name, size }) => ({ id, name, size }))}
      mentions={mentions}
      onCopy={copy}
      onEdit={(text) => actions.editMessage(chatId, message.id, text)}
      editNote="Sending starts a new branch. The old one is kept."
      branches={total > 1
        ? {
          current: Math.min(message.branch ?? 0, total - 1),
          total,
          onChange: (index) => actions.selectBranch(chatId, message.id, index),
        }
        : undefined}
      onBranch={canFork ? () => actions.forkChat(chatId, message.id) : undefined}
    />
  )
})

// The reply's text spoken in the voice and speed from Settings › Voice.
function useReplyReader() {
  const { prefs } = useAiPrefs()
  const voice = VOICES.find((v) => v.id === prefs.voice)
  return useReadAloud({ voice: voice?.name, rate: prefs.voiceSpeed, pitch: voice?.pitch })
}

const REASONS = ['Not accurate', 'Wrong jobs or data', 'Ignored instructions', 'Too long', 'Too slow', 'Other']

// Thinking, plan steps and tool calls that run back to back become one
// thinking trail; everything else (approval, text, sources…) stands alone.
type Group = { process: ProcessPart[]; key: string } | { part: Part; key: string }

const isProcess = (part: Part): part is ProcessPart =>
  part.type === 'thinking' || part.type === 'plan' || part.type === 'tool'

function groupParts(parts: Part[]): Group[] {
  const groups: Group[] = []
  for (const part of parts) {
    const last = groups[groups.length - 1]
    if (isProcess(part) && last && 'process' in last) last.process.push(part)
    else if (isProcess(part)) groups.push({ process: [part], key: part.id })
    else groups.push({ part, key: part.id })
  }
  return groups
}

export const AssistantMessageView = memo(function AssistantMessageView({ chatId, message, isLast, openArtifactId, canFork }: {
  chatId: string
  message: AssistantMessageData
  isLast: boolean
  openArtifactId: string | null
  canFork: boolean
}) {
  const actions = useActions()
  const reader = useReplyReader()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  // The source sheet, and the source it shows (by its index; kept while it closes).
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [sourceAt, setSourceAt] = useState(0)
  const showSource = (index: number) => {
    setSourceAt(index)
    setSourcesOpen(true)
  }
  const reply = currentReply(message)
  const model = modelById(reply.model ?? message.model)
  const running = reply.status === 'running'
  const settled = !running && reply.status !== 'awaiting'
  const sources = reply.parts.find((p): p is PartOf<'sources'> => p.type === 'sources')?.sources
  const lastPart = reply.parts[reply.parts.length - 1]
  const streaming = lastPart?.type === 'text' && lastPart.streaming
  const address = [chatId, message.id, reply.id] as const
  const groups = groupParts(reply.parts)
  const lastGroup = groups[groups.length - 1]

  function renderPart(part: Part) {
    switch (part.type) {
      case 'thinking':
      case 'plan':
      case 'tool':
        return null
      case 'approval':
        return <ApprovalCard part={part} onDecide={(decision) => actions.decide(...address, part.id, decision)} />
      case 'text':
        return <Markdown text={part.text} streaming={part.streaming} sources={sources} onLink={openKitPage} onCite={showSource} />
      case 'sources':
        return <SourcesRow sources={part.sources} onOpen={showSource} />
      case 'artifact':
        return (
          <ArtifactCard
            part={part}
            active={openArtifactId === part.artifactId}
            onOpen={() => actions.openArtifact(part.artifactId, part.version)}
          />
        )
      case 'error':
        return <ErrorCard part={part} onRetry={isLast ? () => actions.regenerate(chatId, message.id) : undefined} />
    }
  }

  return (
    <AssistantMessage
      name={model.name}
      meta={reply.finishedAt !== undefined && settled ? formatDuration(reply.finishedAt - reply.startedAt) : undefined}
      actions={(
        <>
          {settled && (
            <MessageActions
              className="-mt-1 -ml-1"
              onCopy={() => copy(replyText(reply))}
              onRegenerate={() => actions.regenerate(chatId, message.id)}
              feedback={reply.feedback}
              onFeedback={(next) => {
                // A thumbs down asks why first; the dialog records it.
                if (next === 'down') {
                  setFeedbackOpen(true)
                  return
                }
                actions.feedback(...address, next)
                if (next) toast('Thanks for the feedback')
              }}
              readAloud={reader.supported ? { reading: reader.reading, onToggle: () => reader.toggle(replyText(reply)) } : undefined}
              onBranch={canFork ? () => actions.forkChat(chatId, message.id) : undefined}
              versions={{
                current: message.current,
                total: message.versions.length,
                onChange: (index) => actions.selectVersion(chatId, message.id, index),
              }}
            />
          )}
          {isLast && settled && <FollowUps items={reply.followUps} onPick={(text) => actions.send(text, [])} />}
          <FeedbackDialog
            open={feedbackOpen}
            onOpenChange={setFeedbackOpen}
            reasons={REASONS}
            description="Pick what fits. This demo sends nothing anywhere."
            onSubmit={(reasons) => {
              actions.feedback(...address, 'down')
              toast('Thanks for the feedback', { description: reasons.length ? reasons.join(', ') : 'Demo only. Nothing was sent.' })
            }}
          />
        </>
      )}
    >
      {groups.map((group, i) => (
        <Fragment key={group.key}>
          {'process' in group ? (
            <ProcessTrail
              parts={group.process}
              // Only the trail the agent is still adding to shimmers; earlier ones fold away.
              live={running && i === groups.length - 1 && !streaming}
              activity={reply.activity}
              since={reply.startedAt}
            />
          ) : renderPart(group.part)}
        </Fragment>
      ))}
      {/* Waiting before the first part, or between steps (e.g. right after an approval). */}
      {running && !streaming && !(lastGroup && 'process' in lastGroup) && (
        <ProcessTrail parts={[]} live activity={reply.activity} since={reply.startedAt} />
      )}
      {reply.status === 'stopped' && <StoppedNote />}
      {sources && (
        <SourceSheet
          open={sourcesOpen}
          onOpenChange={setSourcesOpen}
          sources={sources}
          active={sourceAt}
          onActiveChange={setSourceAt}
          onOpenDocument={(index) => toast(sources[index].title, { description: 'This demo has no document viewer.' })}
        />
      )}
    </AssistantMessage>
  )
})
