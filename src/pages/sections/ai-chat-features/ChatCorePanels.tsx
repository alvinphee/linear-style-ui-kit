import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Share08Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { AssistantMessage, MessageActions, UserMessage, useReadAloud, type Feedback } from '@/blocks/ai/chat/chat-message'
import { ShareChatDialog, type ShareChatLink, type ShareChatOptions } from '@/blocks/ai/chat/share-chat-dialog'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { Panel } from '../shared'
import { now } from '../ai/data'

// The chat core's parts on their own: an edited message that keeps its
// branches, the actions under a reply (read aloud, branch in new chat), and
// the share chat dialog before and after its link exists.

const copy = (text: string) => copyText(text, { success: false, error: false })

const demoUrl = (id: string) => `${window.location.origin}/#/templates/ai-chat/shared/${id}`

type Branch = { text: string; reply: string }

const FIRST_BRANCHES: Branch[] = [
  {
    text: 'Which jobs are late today?',
    reply: 'Three jobs are late: JOB-1042 to Harbour Road, JOB-1047 to the north depot and JOB-1051, waiting on a driver.',
  },
  {
    text: 'Which jobs are late today, and who is driving them?',
    reply: 'Three jobs are late. Sam Lee drives JOB-1042 and Priya Shah JOB-1047. JOB-1051 has no driver yet.',
  },
]

function BranchesPanel() {
  const [branches, setBranches] = useState(FIRST_BRANCHES)
  const [current, setCurrent] = useState(FIRST_BRANCHES.length - 1)
  const shown = branches[current]
  return (
    <Panel title="Edited message, kept as branches" note="Edit it, then switch with ‹ 2 / 2 ›">
      <div className="@container grid min-w-0 gap-4">
        <UserMessage
          text={shown.text}
          onCopy={copy}
          onEdit={(text) => {
            setBranches((list) => [...list, { text, reply: `A fresh reply to “${text}”. The earlier branches are still there.` }])
            setCurrent(branches.length)
          }}
          editNote="Sending starts a new branch. The old one is kept."
          branches={{ current, total: branches.length, onChange: setCurrent }}
          onBranch={() => toast('Branched into a new chat', { description: 'Demo only.' })}
        />
        <AssistantMessage name="Balanced">
          <p className="text-[13px] leading-relaxed">{shown.reply}</p>
        </AssistantMessage>
      </div>
    </Panel>
  )
}

const REPLY = 'Two invoices are overdue by more than 30 days. Harbour Foods owes 4,200 dollars and Bluebird Print 1,150. Shall I draft a reminder to each?'

function ActionsPanel() {
  const reader = useReadAloud()
  const [feedback, setFeedback] = useState<Feedback | undefined>()
  return (
    <Panel title="Reply actions" note="Read aloud and Branch in new chat">
      <div className="@container grid min-w-0 gap-2">
        <AssistantMessage
          name="Balanced"
          meta="4s"
          actions={(
            <MessageActions
              className="-ml-1"
              onCopy={() => copy(REPLY)}
              onRegenerate={() => toast('Regenerating', { description: 'Demo only.' })}
              feedback={feedback}
              onFeedback={setFeedback}
              readAloud={reader.supported ? { reading: reader.reading, onToggle: () => reader.toggle(REPLY) } : undefined}
              onBranch={() => toast('Branched into a new chat', { description: 'Demo only.' })}
              versions={{ current: 1, total: 2, onChange: () => toast('Demo only') }}
            />
          )}
        >
          <p className="text-[13px] leading-relaxed">{REPLY}</p>
        </AssistantMessage>
        <p className="text-muted-foreground text-[11px]">
          {reader.supported
            ? 'Read aloud uses your browser’s own voice. Starting another reply stops this one.'
            : 'This browser cannot speak, so Read aloud is hidden.'}
        </p>
      </div>
    </Panel>
  )
}

const CHAT = { title: 'Overdue invoices: reminder plan', messageCount: 8, hasArtifacts: true }

function SharePanel({ title, note, initial }: { title: string; note: string; initial: ShareChatLink | null }) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState<ShareChatLink | null>(initial)
  const save = (options: ShareChatOptions, id: string, views = 0) => setLink({
    url: demoUrl(id), createdAt: now(), ...options, messageCount: CHAT.messageCount, views,
  })
  return (
    <Panel title={title} note={note}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
          {link ? 'Shared' : 'Share'}
        </Button>
        <span className="text-muted-foreground min-w-0 truncate text-xs">
          {link ? `${link.mode === 'snapshot' ? 'Snapshot' : 'Live'} link` : 'No link yet'}
        </span>
      </div>
      <ShareChatDialog
        open={open}
        onOpenChange={setOpen}
        chat={CHAT}
        link={link}
        sharedBy="Alex Morgan"
        organisation="Acme"
        now={now()}
        onCreate={(options) => save(options, 'sh-demo')}
        onUpdate={(options) => link && save(options, 'sh-demo', link.views)}
        onRevoke={() => setLink(null)}
      />
    </Panel>
  )
}

export function ChatCorePanels() {
  const base = now()
  return (
    <>
      <BranchesPanel />
      <ActionsPanel />
      <SharePanel title="Share chat" note="No link yet: create one" initial={null} />
      <SharePanel
        title="Share chat, with a link"
        note="A snapshot two days old"
        initial={{
          url: demoUrl('sh-7f3k'), createdAt: base - 2 * 24 * 3_600_000, mode: 'snapshot', access: 'link',
          includeArtifacts: true, messageCount: 6, views: 14,
        }}
      />
    </>
  )
}
