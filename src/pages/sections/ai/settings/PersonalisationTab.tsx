import { useId, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { BookOpen01Icon, Briefcase01Icon, FlashIcon, PlusSignIcon, SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { cn } from 'cn'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/lib/format'
import { useAiPrefs, type ResponseStyle } from './prefs'

// How replies sound: a response style, and custom instructions (what the
// assistant should know about you, and how it should respond). The preview
// is scripted per style; there is no model behind it.

const MAX = 1500

const STYLES: { id: ResponseStyle; label: string; icon: IconSvgElement; line: string; example: string }[] = [
  { id: 'default', label: 'Default', icon: SparklesIcon, line: 'Balanced length, plain words.', example: 'Three things help most: plan routes the night before…' },
  { id: 'concise', label: 'Concise', icon: FlashIcon, line: 'Short and direct. Just the answer.', example: 'Plan routes the night before.' },
  { id: 'explanatory', label: 'Explanatory', icon: BookOpen01Icon, line: 'Walks through the why, step by step.', example: 'Late deliveries usually start the day before. Here’s why…' },
  { id: 'formal', label: 'Formal', icon: Briefcase01Icon, line: 'Polished, for sharing with others.', example: 'I recommend the following three measures…' },
]

const SUGGESTIONS = [
  'Use British spelling.',
  'Use tables for numbers.',
  'Keep answers short.',
  'Ask before making assumptions.',
  'Say when you are not sure.',
  'No emojis.',
]

const PROMPT = 'How can we cut late deliveries?'

// The sample reply in each style.
const PREVIEW: Record<ResponseStyle, ReactNode> = {
  default: (
    <>
      <p>Three things usually help most:</p>
      <ul className="list-disc space-y-0.5 pl-5">
        <li>Plan routes the night before, not in the morning.</li>
        <li>Add a 15-minute buffer to stops with a loading dock.</li>
        <li>Text customers an arrival time, so a missed drop gets rebooked.</li>
      </ul>
      <p>Want me to look at last month’s late drops by driver?</p>
    </>
  ),
  concise: <p>Plan routes the night before, add a 15-minute buffer at dock stops, and text customers an arrival time.</p>,
  explanatory: (
    <>
      <p>Late deliveries usually start the day before. When routes are planned in the morning, drivers leave late and every stop slips a little.</p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li><strong className="font-medium">Plan the night before.</strong> Drivers leave on time, so the first stops are on time.</li>
        <li><strong className="font-medium">Buffer the slow stops.</strong> Loading docks take longest; 15 minutes there keeps the rest of the route on track.</li>
        <li><strong className="font-medium">Tell customers when.</strong> An arrival text means someone is there to sign, so fewer drops fail.</li>
      </ol>
      <p>Together these tackle the cause (late starts) as well as the knock-on delays.</p>
    </>
  ),
  formal: (
    <>
      <p>To reduce late deliveries, I recommend the following three measures:</p>
      <ol className="list-decimal space-y-0.5 pl-5">
        <li>Finalise delivery routes on the preceding evening.</li>
        <li>Allow a 15-minute buffer at stops with loading docks.</li>
        <li>Notify customers of their estimated arrival time.</li>
      </ol>
      <p>I would be glad to prepare an analysis of last month’s late deliveries for review.</p>
    </>
  ),
}

export function PersonalisationTab() {
  const id = useId()
  const { prefs, set } = useAiPrefs()
  const style = STYLES.find((s) => s.id === prefs.style) ?? STYLES[0]

  function insert(text: string) {
    const current = prefs.instructions.trimEnd()
    const next = current ? `${current}\n${text}` : text
    if (next.length > MAX) {
      toast.error('No room for that', { description: `Custom instructions can be up to ${formatNumber(MAX)} characters.` })
      return
    }
    set('instructions', next)
  }

  return (
    <>
      <SettingsHeader title="Personalisation" description="Shape how the assistant replies to you, in every chat." />

      <SettingsGroup title="Response style" description="You can still ask for something different in any chat." className="p-3">
        <RadioGroup
          value={prefs.style}
          onValueChange={(v) => set('style', v as ResponseStyle)}
          aria-label="Response style"
          className="grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {STYLES.map((s) => (
            <FieldLabel key={s.id} htmlFor={`${id}-style-${s.id}`} className="min-w-0">
              <Field orientation="horizontal" className="items-start">
                <HugeiconsIcon icon={s.icon} strokeWidth={2} className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <FieldContent className="min-w-0">
                  <FieldTitle>{s.label}</FieldTitle>
                  <FieldDescription className="text-[11px] leading-4">{s.line}</FieldDescription>
                  <span className="bg-muted text-muted-foreground mt-1 block truncate rounded px-1.5 py-1 text-[11px] italic">
                    “{s.example}”
                  </span>
                </FieldContent>
                <RadioGroupItem value={s.id} id={`${id}-style-${s.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </SettingsGroup>

      <SettingsGroup title="Custom instructions" description="Added to every new chat. Keep them short; the assistant reads them each time.">
        <SettingsRow label="What should the assistant know about you?" htmlFor={`${id}-about`} stacked>
          <Textarea
            id={`${id}-about`}
            rows={3}
            maxLength={MAX}
            value={prefs.aboutYou}
            onChange={(e) => set('aboutYou', e.target.value)}
            placeholder="I run dispatch for a team of 12 drivers in Singapore. Most questions are about routes, jobs and invoices."
            aria-describedby={`${id}-about-count`}
          />
          <Count id={`${id}-about-count`} length={prefs.aboutYou.length} />
        </SettingsRow>
        <SettingsRow label="How should it respond?" htmlFor={`${id}-ins`} stacked>
          <Textarea
            id={`${id}-ins`}
            rows={4}
            maxLength={MAX}
            value={prefs.instructions}
            onChange={(e) => set('instructions', e.target.value)}
            placeholder="Lead with the answer. Use tables for numbers. British spelling."
            aria-describedby={`${id}-ins-count`}
          />
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div role="group" aria-label="Add a suggestion" className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {SUGGESTIONS.map((text) => {
                const added = prefs.instructions.toLowerCase().includes(text.toLowerCase().replace(/\.$/, ''))
                return (
                  <Button
                    key={text}
                    variant="outline"
                    size="xs"
                    className="rounded-full"
                    disabled={added}
                    onClick={() => insert(text)}
                  >
                    <HugeiconsIcon icon={added ? Tick02Icon : PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
                    {text.replace(/\.$/, '')}
                    {added && <span className="sr-only"> (added)</span>}
                  </Button>
                )
              })}
            </div>
            <Count id={`${id}-ins-count`} length={prefs.instructions.length} />
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Preview"
        description={`A sample reply in the ${style.label} style.`}
        action={prefs.instructions.trim() || prefs.aboutYou.trim()
          ? <span className="text-muted-foreground text-[11px]">Your instructions apply in real chats</span>
          : undefined}
      >
        <div className="grid gap-3 p-3 text-[13px] leading-relaxed" aria-live="polite">
          <p className="bg-muted ml-auto max-w-[85%] rounded-lg px-3 py-2">{PROMPT}</p>
          <div className="grid min-w-0 gap-2">{PREVIEW[style.id]}</div>
        </div>
      </SettingsGroup>
    </>
  )
}

function Count({ id, length }: { id: string; length: number }) {
  return (
    <span id={id} className={cn('text-muted-foreground shrink-0 justify-self-end text-[11px] tabular-nums', MAX - length < 100 && 'text-destructive')}>
      {formatNumber(length)} / {formatNumber(MAX)}
    </span>
  )
}
