import { Fragment, memo, useState } from 'react'
import { toast } from 'sonner'
import {
  AssistantMessage, FeedbackDialog, FileChip as FileChipView, FollowUps, MessageActions, UserMessage,
} from '@/blocks/ai/chat-message'
import { useActions } from './context'
import { FILE_ICONS, formatDuration, modelById } from './data'
import { copyToClipboard, currentReply, replyText } from './helpers'
import { Markdown } from './markdown'
import {
  ApprovalCard, ArtifactCard, ErrorCard, ProcessTrail, SourcesRow, StoppedNote, type ProcessPart,
} from './parts'
import type { AssistantMessage as AssistantMessageData, FileRef, Part, PartOf, UserMessage as UserMessageData } from './types'

// The workspace's side of the chat message blocks: it reads the store's
// messages, maps them to the blocks' props and wires their callbacks to the
// workspace's actions.

export { IconAction } from '@/components/icon-action'

export function FileChip({ file, onRemove }: { file: FileRef; onRemove?: () => void }) {
  return <FileChipView name={file.name} size={file.size} icon={FILE_ICONS[file.kind]} onRemove={onRemove} />
}

export const UserMessageView = memo(function UserMessageView({ chatId, message, mentions }: {
  chatId: string
  message: UserMessageData
  mentions: RegExp | null
}) {
  const actions = useActions()
  return (
    <UserMessage
      text={message.text}
      attachments={message.attachments.map((file) => ({ id: file.id, name: file.name, size: file.size, icon: FILE_ICONS[file.kind] }))}
      mentions={mentions}
      onCopy={copyToClipboard}
      onEdit={(text) => actions.editMessage(chatId, message.id, text)}
    />
  )
})

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

export const AssistantMessageView = memo(function AssistantMessageView({ chatId, message, isLast, openArtifactId }: {
  chatId: string
  message: AssistantMessageData
  isLast: boolean
  openArtifactId: string | null
}) {
  const actions = useActions()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
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
        return <Markdown text={part.text} streaming={part.streaming} sources={sources} />
      case 'sources':
        return <SourcesRow sources={part.sources} />
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
              onCopy={() => copyToClipboard(replyText(reply))}
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
    </AssistantMessage>
  )
})
