import { useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, SparklesIcon } from '@hugeicons/core-free-icons'
import { AiSummaryCard } from '@/blocks/ai/ai-summary-card'
import { FollowUps } from '@/blocks/ai/chat-message'
import { Markdown } from '@/blocks/markdown'
import { Button } from '@/components/ui/button'
import { copyText } from '@/lib/clipboard'
import { formatTime } from '@/lib/format'
import { go } from '../route'
import { useErp } from '../store'
import type { EntityId } from '../types'
import { starterPrompts } from './answers'
import { parseRecordHref, useAssistant, useCurrentBriefing } from './store'
import { Composer } from './Turns'

// The launchpad's AI parts (ERP + AI edition): a prompt box that starts a
// chat in the Assistant, and the AI briefing, a summary of what needs you
// today written from the live records.

const goToAssistant = () => go('home', 'assistant')

export function LaunchpadAsk() {
  const { company, session } = useErp()
  const { send } = useAssistant()
  const prompts = starterPrompts(session?.role ?? 'admin').slice(1, 4)
  return (
    <div className="grid max-w-2xl min-w-0 gap-2">
      <Composer placeholder={`Ask anything about ${company?.name ?? 'your company'}…`} newChat followFocus={false} onSent={goToAssistant} />
      <FollowUps
        items={prompts}
        label="Suggested questions"
        icon={SparklesIcon}
        onPick={(q) => {
          if (send(q, { newChat: true })) goToAssistant()
        }}
      />
    </div>
  )
}

export function Briefing() {
  const { openPeek } = useErp()
  const { briefing, writeBriefing, stopBriefing, setBriefingFeedback, continueBriefing } = useAssistant()
  const current = useCurrentBriefing()

  // Written on the first visit; after that it stays until you regenerate it.
  useEffect(() => {
    if (!briefing) writeBriefing()
    // Only on mount: the briefing then lives in the assistant store.
  }, [])

  const stale = !!briefing && briefing.phase === 'done' && !briefing.stopped && briefing.plain !== current
  return (
    <AiSummaryCard
      title="Today's briefing"
      label="AI briefing"
      phase={briefing?.phase ?? 'thinking'}
      thinkingLabel="Reading your modules…"
      lines={4}
      stale={stale && (
        <>
          <span className="font-medium">Records changed</span>
          <span className="text-muted-foreground">since this briefing was written.</span>
        </>
      )}
      note={briefing && (briefing.stopped ? 'Stopped early' : `Written at ${formatTime(briefing.writtenAt)} from the live records`)}
      footerAction={(
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            continueBriefing()
            goToAssistant()
          }}
        >
          Ask a follow-up
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
        </Button>
      )}
      feedback={briefing?.feedback ?? null}
      onFeedback={setBriefingFeedback}
      feedbackLabels={['Good briefing', 'Bad briefing']}
      onStop={stopBriefing}
      onRegenerate={writeBriefing}
      onCopy={() => briefing && copyText(briefing.plain, { success: false })}
    >
      {briefing && (
        <Markdown
          text={briefing.pieces.slice(0, briefing.shown).join('')}
          streaming={briefing.phase === 'streaming'}
          onLink={(href) => {
            const target = parseRecordHref(href)
            if (target) openPeek(target.entity as EntityId, target.id)
          }}
          className="max-w-3xl"
        />
      )}
    </AiSummaryCard>
  )
}
