import { useId } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// The voice picker of an AI chat's voice mode, as the big chat apps show it:
// one card per voice with its name, a line on how it sounds and a few tone
// tags. The round button on each card plays a sample; while it plays, the
// button turns into an equaliser. Which voice is chosen and which one is
// playing are the app's to keep (value, playingId), so it decides how a
// sample sounds and when it ends.
//
// One column, two from @md up: it measures its own box (@container).
// `columns={1}` keeps it to one.
// Arrow keys move between voices, as in any radio group.

export type VoiceOption = {
  id: string
  name: string
  // How it sounds, in a few words: "Warm and steady".
  description: string
  // Tone tags: "Calm", "Bright", "Low".
  tags?: string[]
}

export function VoicePicker({ voices, value, onChange, playingId, onPlay, label = 'Voice', columns = 'auto', className }: {
  voices: VoiceOption[]
  value: string
  onChange: (id: string) => void
  // The voice whose sample is playing, if any.
  playingId?: string | null
  // Play a voice's sample, or stop it with null. Left out, the cards have no
  // play button.
  onPlay?: (id: string | null) => void
  // The group's name for screen readers.
  label?: string
  // auto: one column, two from @md up. 1: always one, for a narrow panel.
  columns?: 'auto' | 1
  className?: string
}) {
  const uid = useId()
  return (
    <div className={cn('@container min-w-0', className)}>
      <RadioGroup value={value} onValueChange={onChange} aria-label={label} className={cn('grid grid-cols-1 gap-2', columns === 'auto' && '@md:grid-cols-2')}>
        {voices.map((voice) => {
          const id = `${uid}-${voice.id}`
          const playing = playingId === voice.id
          return (
            <div
              key={voice.id}
              className={cn(
                'relative flex min-w-0 items-start gap-3 rounded-lg border p-2.5 transition-colors',
                'hover:bg-accent/40 has-data-checked:border-primary/50 has-data-checked:bg-accent/40',
              )}
            >
              {onPlay && (
                <button
                  type="button"
                  aria-label={playing ? `Stop the ${voice.name} sample` : `Play a sample of ${voice.name}`}
                  aria-pressed={playing}
                  onClick={() => onPlay(playing ? null : voice.id)}
                  className={cn(
                    'focus-visible:ring-ring/40 relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2',
                    playing ? 'bg-brand/15 text-brand' : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {playing
                    ? <VoiceEqualiser playing />
                    : <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5" />}
                </button>
              )}
              {/* The label covers the whole card, so a click anywhere but the
                  play button chooses the voice. */}
              <label htmlFor={id} className="grid min-w-0 flex-1 cursor-pointer gap-1 after:absolute after:inset-0 after:rounded-lg">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs font-medium">{voice.name}</span>
                  {playing && <span className="text-brand text-[11px]">Playing</span>}
                </span>
                <span className="text-muted-foreground text-[11px] leading-4">{voice.description}</span>
                {!!voice.tags?.length && (
                  <span className="flex flex-wrap gap-1 pt-0.5">
                    {voice.tags.map((tag) => (
                      <span key={tag} className="text-muted-foreground rounded border px-1.5 text-[10px] leading-4">{tag}</span>
                    ))}
                  </span>
                )}
              </label>
              <RadioGroupItem id={id} value={voice.id} className="mt-0.5" />
            </div>
          )
        })}
      </RadioGroup>
      <span aria-live="polite" className="sr-only">
        {playingId ? `Playing a sample of ${voices.find((v) => v.id === playingId)?.name ?? 'a voice'}` : ''}
      </span>
    </div>
  )
}

// Four bars that bounce while a voice speaks, in the current text colour.
// Still (bars of set heights) when not playing, or when the viewer asks for
// less motion.
export function VoiceEqualiser({ playing = false, className }: { playing?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn('flex h-3.5 items-center gap-[2px]', className)}>
      <style href="voice-equaliser" precedence="default">{`
@keyframes voice-eq { 0%, 100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
.voice-eq { animation: voice-eq .8s ease-in-out infinite; transform-origin: center }
@media (prefers-reduced-motion: reduce) { .voice-eq { animation: none } }
`}</style>
      {BARS.map((bar, i) => (
        <span
          key={i}
          className={cn('h-full w-[3px] rounded-full bg-current', playing && 'voice-eq')}
          style={{
            transform: `scaleY(${bar.rest})`,
            animationDuration: `${bar.ms}ms`,
            animationDelay: `${bar.delay}ms`,
          }}
        />
      ))}
    </span>
  )
}

// Each bar's still height and its own pace, so they never move in step.
const BARS = [
  { rest: 0.45, ms: 760, delay: -120 },
  { rest: 0.9, ms: 620, delay: -380 },
  { rest: 0.6, ms: 880, delay: -240 },
  { rest: 0.75, ms: 700, delay: -520 },
]
