import { useState } from 'react'
import { AiLabel } from '@/components/ai/ai-label'
import { IncognitoToggle } from '@/components/ai/incognito-toggle'
import {
  ActivityLine, Elapsed, PulseDot, ShimmerText, StreamCaret, Thinking, TypingDots, type ThinkingIndicator,
} from '@/components/ai/thinking-indicator'
import { CodeBlock, Demos, Gallery, Playground, bool, component, imports, jsx, str, unless } from './Playground'

// The small AI components: the AI label, the thinking indicator and its
// working signs, and the incognito toggle. The blocks they make up are on
// the AI in the product page. All content is made up.

/* ---------- Preview helpers ---------- */

// The time a preview mounted, for timers that count from "now".
const useSince = () => useState(Date.now)[0]

/* ---------- AI label ---------- */

function AiLabelDemos() {
  return (
    <Gallery
      title="AI label"
      note="Put it on anything a model wrote or proposed"
      items={[
        { label: 'default', node: <AiLabel /> },
        { label: 'AI suggests', node: <AiLabel>AI suggests</AiLabel> },
        { label: 'Understood as', node: <AiLabel>Understood as</AiLabel> },
        {
          label: 'beside a heading',
          node: <span className="flex items-center gap-1.5 text-xs font-medium">Summary <AiLabel /></span>,
        },
        {
          label: 'on a suggestion',
          node: (
            <span className="bg-card flex h-7 items-center gap-2 rounded-md border px-2 text-xs">
              <AiLabel>AI suggests</AiLabel>
              <span className="text-muted-foreground">Priority</span>
              <span className="font-medium">High</span>
            </span>
          ),
        },
      ]}
    />
  )
}

/* ---------- Thinking indicator ---------- */

const INDICATORS = ['sparkle', 'dot', 'spinner', 'dots', 'none'] as const satisfies readonly ThinkingIndicator[]

function ThinkingPreview({ indicator, label, elapsed }: { indicator: ThinkingIndicator; label?: string; elapsed: boolean }) {
  const since = useSince()
  return <Thinking indicator={indicator} label={label} since={elapsed ? since : undefined} />
}

function ActivityPreview() {
  const since = useSince()
  return <ActivityLine text="Reading INV-2026-0409" since={since} className="max-w-60" />
}

function ElapsedPreview() {
  const since = useSince()
  return <span className="text-muted-foreground text-xs"><Elapsed since={since} /></span>
}

function ThinkingDemos() {
  return (
    <>
      <Playground
        title="Thinking indicator"
        description="One status line while the AI works"
        controls={[
          { kind: 'select', name: 'indicator', label: 'Indicator', options: INDICATORS, initial: 'sparkle' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Searching invoices…' },
          { kind: 'switch', name: 'elapsed', label: 'Show elapsed', initial: true },
        ]}
        render={(v) => (
          <ThinkingPreview
            // A fresh timer each time Show elapsed is turned on.
            key={String(bool(v, 'elapsed'))}
            indicator={str(v, 'indicator') as ThinkingIndicator}
            label={str(v, 'label') || undefined}
            elapsed={bool(v, 'elapsed')}
          />
        )}
        code={(v) => {
          const elapsed = bool(v, 'elapsed')
          const label = str(v, 'label')
          const head = imports({
            react: elapsed ? ['useState'] : [],
            '@/components/ai/thinking-indicator': ['Thinking'],
          })
          const body = jsx('Thinking', {
            indicator: unless(str(v, 'indicator'), 'sparkle'),
            label: label === 'Thinking…' ? undefined : label,
            since: elapsed ? '{startedAt}' : undefined,
          })
          return `${head}\n\n${component('WorkingStatus', elapsed ? ['const [startedAt] = useState(Date.now)'] : [], body)}`
        }}
      />

      <Gallery
        title="Working signs"
        note="The pieces Thinking is made of, from @/components/ai/thinking-indicator"
        items={[
          { label: 'ShimmerText', node: <ShimmerText className="text-xs font-medium">Searching customer invoices…</ShimmerText> },
          { label: 'PulseDot', node: <span className="flex h-5 items-center"><PulseDot /></span> },
          { label: 'TypingDots', node: <TypingDots /> },
          { label: 'StreamCaret line', node: <p className="text-[13px]">The overdue total is<StreamCaret /></p> },
          { label: 'StreamCaret block', node: <p className="text-xs">Suggested reply<StreamCaret variant="block" /></p> },
          { label: 'ActivityLine', node: <ActivityPreview /> },
          { label: 'Elapsed', node: <ElapsedPreview /> },
        ]}
      />
    </>
  )
}

/* ---------- Incognito toggle ---------- */

function IncognitoPreview({ initial, label }: { initial: boolean; label?: string }) {
  const [on, setOn] = useState(initial)
  return <IncognitoToggle pressed={on} onPressedChange={setOn} label={label} />
}

function IncognitoDemos() {
  return (
    <Gallery
      title="Incognito toggle"
      note="IncognitoToggle: a chat that is not kept in the history (a temporary chat). Top right of the chat"
      items={[
        { label: 'off', node: <IncognitoPreview initial={false} /> },
        { label: 'on', node: <IncognitoPreview initial /> },
        { label: 'icon only (label="")', node: <IncognitoPreview initial={false} label="" /> },
        {
          label: 'code',
          node: (
            <CodeBlock
              code={"import { IncognitoToggle } from '@/components/ai/incognito-toggle'\n\n<IncognitoToggle pressed={incognito} onPressedChange={setIncognito} />"}
              className="w-[min(30rem,80vw)]"
            />
          ),
        },
      ]}
    />
  )
}

export default function AiComponentsDemos() {
  return (
    <Demos>
      <AiLabelDemos />

      <ThinkingDemos />

      <IncognitoDemos />
    </Demos>
  )
}
