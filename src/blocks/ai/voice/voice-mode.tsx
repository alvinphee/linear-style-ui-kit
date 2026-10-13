import type { CSSProperties } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { CallEnd01Icon, CaptionsIcon, CaptionsOffIcon, Mic01Icon, MicOff01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { AiMotion } from '@/components/ai/thinking-indicator'

// Voice mode, as the big chat apps have it: a full-screen spoken
// conversation with an animated orb, the state in words, live captions of
// the last lines, and a bar of Mute, Captions and End. The app runs the
// conversation (microphone, speech, the model) and passes in its state, the
// voice level and the transcript; the block only draws it.
//
// The orb breathes while listening, swirls while thinking and swells with
// `level` while speaking. With reduced motion it stays still and says its
// state in words. While the assistant speaks, the orb is a button that
// interrupts it (barge-in), when `onInterrupt` is given.
//
// It is a modal dialog: rendered in a portal, focus kept inside, Escape or
// End calls onClose.

export type VoiceState = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'paused'

export type VoiceLine = { role: 'user' | 'assistant'; text: string }

const STATE_LABEL: Record<VoiceState, string> = {
  connecting: 'Connecting…',
  listening: 'Listening',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  paused: 'Paused',
}

const ORB_CSS = `
@keyframes vo-breathe { 0%, 100% { transform: scale(.95) } 50% { transform: scale(1.03) } }
@keyframes vo-spin { to { transform: rotate(360deg) } }
@keyframes vo-drift { 0%, 100% { transform: translate(-7%, -5%) scale(1) } 50% { transform: translate(7%, 6%) scale(1.12) } }
@keyframes vo-wait { 0%, 100% { opacity: .45 } 50% { opacity: .85 } }
@keyframes vo-ring { from { transform: scale(.92); opacity: .55 } to { transform: scale(1.4); opacity: 0 } }
.vo-orb { --vo-blur: calc(var(--vo-size) * .09); width: var(--vo-size); height: var(--vo-size) }
.vo-halo { filter: blur(var(--vo-blur)) }
.vo-swirl { filter: blur(calc(var(--vo-blur) * 1.4)) }
.vo-body { transition: transform .12s ease-out, filter .4s, opacity .4s }
.vo-orb[data-state=listening] .vo-pulse { animation: vo-breathe 3.6s ease-in-out infinite }
.vo-orb[data-state=connecting] .vo-pulse { animation: vo-wait 1.6s ease-in-out infinite }
.vo-orb .vo-swirl { animation: vo-spin 14s linear infinite }
.vo-orb[data-state=thinking] .vo-swirl { animation-duration: 2.2s }
.vo-orb[data-state=speaking] .vo-swirl { animation-duration: 7s }
.vo-orb .vo-blob { animation: vo-drift 6s ease-in-out infinite }
.vo-orb[data-state=thinking] .vo-blob { animation-duration: 1.8s }
.vo-orb[data-state=speaking] .vo-body { transform: scale(calc(1 + var(--vo-level) * .14)) }
.vo-orb[data-state=speaking] .vo-ring { animation: vo-ring 1.8s ease-out infinite }
.vo-orb[data-state=paused] .vo-swirl, .vo-orb[data-state=paused] .vo-blob { animation-play-state: paused }
.vo-still-label { display: none }
@media (prefers-reduced-motion: reduce) {
  .vo-orb .vo-pulse, .vo-orb .vo-swirl, .vo-orb .vo-blob, .vo-orb .vo-ring { animation: none !important }
  .vo-orb[data-state=speaking] .vo-body { transform: none }
  .vo-still-label { display: block }
}
`

// Colours come from the brand token: lighter and darker steps of it, and a
// touch of the second chart colour for depth.
const BRAND_LIGHT = 'oklch(from var(--brand) calc(l + .22) calc(c * .7) h)'
const BRAND_DEEP = 'oklch(from var(--brand) calc(l - .12) c h)'

// The orb on its own: for voice mode, and small beside a voice chat's state.
// `size` is any CSS length (a number is pixels). With reduced motion, a
// label under it says the state, unless `label` is false (voice mode says
// it already).
export function VoiceOrb({ state, level = 0, size = 160, label = true, className }: {
  state: VoiceState
  // 0–1: how loud the voice is now. Swells the orb while speaking.
  level?: number
  size?: number | string
  label?: boolean
  className?: string
}) {
  const level01 = Math.min(1, Math.max(0, level))
  const style = {
    '--vo-size': typeof size === 'number' ? `${size}px` : size,
    '--vo-level': level01,
  } as CSSProperties
  return (
    <span className={cn('inline-flex flex-col items-center gap-2', className)}>
      <style href="voice-orb" precedence="default">{ORB_CSS}</style>
      <span aria-hidden data-state={state} className="vo-orb relative block shrink-0" style={style}>
        {/* The glow round it: brighter while listening or speaking loudly. */}
        <span
          className="vo-halo vo-pulse absolute -inset-[14%] rounded-full transition-opacity duration-300"
          style={{
            background: 'radial-gradient(closest-side, color-mix(in oklch, var(--brand) 55%, transparent), transparent)',
            opacity: state === 'speaking' ? 0.45 + level01 * 0.55 : state === 'paused' ? 0.2 : state === 'connecting' ? 0.35 : 0.7,
          }}
        />
        {state === 'speaking' && (
          <>
            <span className="vo-ring absolute inset-0 rounded-full border-2" style={{ borderColor: 'color-mix(in oklch, var(--brand) 45%, transparent)' }} />
            <span className="vo-ring absolute inset-0 rounded-full border" style={{ borderColor: 'color-mix(in oklch, var(--brand) 35%, transparent)', animationDelay: '-.9s' }} />
          </>
        )}
        <span
          className={cn('vo-body vo-pulse absolute inset-0 overflow-hidden rounded-full', state === 'paused' && 'opacity-70 saturate-50')}
          style={{
            background: `radial-gradient(circle at 50% 115%, ${BRAND_LIGHT}, var(--brand) 45%, ${BRAND_DEEP} 100%)`,
            boxShadow: `inset 0 0 calc(var(--vo-size) * .12) ${BRAND_DEEP}`,
          }}
        >
          <span
            className="vo-swirl absolute -inset-1/4"
            style={{
              background: `conic-gradient(from 0deg, var(--brand), ${BRAND_LIGHT}, color-mix(in oklch, var(--chart-2) 70%, var(--brand)), var(--brand), ${BRAND_DEEP}, var(--brand))`,
              opacity: 0.85,
            }}
          />
          <span
            className="vo-blob absolute top-[12%] left-[18%] size-[55%] rounded-full"
            style={{ background: `radial-gradient(closest-side, ${BRAND_LIGHT}, transparent)`, filter: 'blur(calc(var(--vo-blur) * .6))' }}
          />
          {/* A soft highlight, so it reads as a sphere. */}
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 34% 28%, oklch(from var(--brand) calc(l + .35) calc(c * .4) h / .55), transparent 42%)' }}
          />
        </span>
      </span>
      {label && <span className="vo-still-label text-muted-foreground text-xs">{STATE_LABEL[state]}</span>}
    </span>
  )
}

function hintFor(state: VoiceState, muted: boolean, canInterrupt: boolean) {
  if (muted && (state === 'listening' || state === 'paused')) return 'You are muted. Unmute to talk.'
  if (state === 'connecting') return 'Setting up the microphone'
  if (state === 'listening') return 'Go ahead, I’m listening'
  if (state === 'thinking') return 'Working on an answer'
  if (state === 'speaking') return canInterrupt ? 'Tap the orb to interrupt' : ''
  return 'Voice is paused'
}

// A round button with its name under it. A toggle keeps one name for screen
// readers (aria-pressed says whether it is on); `caption` may change.
function BarButton({ label, caption = label, icon, pressed, onClick, tone = 'default', disabled }: {
  label: string
  caption?: string
  icon: typeof Mic01Icon
  pressed?: boolean
  onClick?: () => void
  tone?: 'default' | 'end'
  disabled?: boolean
}) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'focus-visible:ring-ring/50 flex size-12 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50',
          tone === 'end'
            ? 'bg-destructive text-white hover:bg-destructive/90'
            : pressed ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-muted text-foreground hover:bg-accent',
        )}
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
      </button>
      <span aria-hidden className="text-muted-foreground text-[11px]">{caption}</span>
    </span>
  )
}

export function VoiceMode({
  open, onClose, state, level = 0, transcript, captions = true, onToggleCaptions, muted = false, onToggleMute, onInterrupt,
  voiceName, title = 'Voice mode', className,
}: {
  open: boolean
  // Escape, End, or the dialog closing for any other reason.
  onClose: () => void
  state: VoiceState
  // 0–1: the microphone's level while listening, the voice's while speaking.
  level?: number
  transcript: VoiceLine[]
  // Live captions of the last lines.
  captions?: boolean
  onToggleCaptions?: () => void
  muted?: boolean
  onToggleMute: () => void
  // Barge-in: stop the assistant mid-sentence and listen.
  onInterrupt?: () => void
  // The voice speaking, shown beside the title: "Aria".
  voiceName?: string
  title?: string
  className?: string
}) {
  const canInterrupt = state === 'speaking' && !!onInterrupt
  const hint = hintFor(state, muted, canInterrupt)
  const shown = transcript.slice(-2)
  const orb = <VoiceOrb state={muted && state === 'listening' ? 'paused' : state} level={level} size="min(58vw, 15rem, 34dvh)" label={false} />

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-background fixed inset-0 z-50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            'bg-background text-foreground fixed inset-0 z-50 flex flex-col outline-none duration-200',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
            className,
          )}
        >
          <AiMotion />
          <header className="flex min-w-0 items-center justify-center gap-2 px-4 pt-4 pb-2">
            <DialogPrimitive.Title className="text-sm font-medium">{title}</DialogPrimitive.Title>
            {voiceName && <span className="text-muted-foreground truncate text-xs">· {voiceName}</span>}
          </header>
          <DialogPrimitive.Description className="sr-only">
            A spoken conversation with the assistant. Use Mute to stop it hearing you, Captions to show what is said, and End or Escape to finish.
          </DialogPrimitive.Description>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4">
            {/* With onInterrupt the orb stays a button in every state, so focus
                is not lost when speaking ends; it only acts while speaking. */}
            {onInterrupt ? (
              <button
                type="button"
                onClick={canInterrupt ? onInterrupt : undefined}
                aria-disabled={!canInterrupt}
                aria-label="Interrupt the assistant"
                className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background aria-disabled:cursor-default"
              >
                {orb}
              </button>
            ) : orb}
            <div className="grid min-w-0 justify-items-center gap-1 text-center">
              <p role="status" className="text-base font-medium">{muted && state === 'listening' ? 'Muted' : STATE_LABEL[state]}</p>
              <p className="text-muted-foreground min-h-4 text-xs">{hint}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl min-w-0 px-4" aria-live="polite" role="log" aria-label="Captions">
            {captions && shown.length > 0 && (
              <div className="grid min-h-20 content-end gap-2 pb-4 text-center">
                {shown.map((line, i) => (
                  <p
                    key={`${transcript.length - shown.length + i}`}
                    className={cn(
                      'ai-in text-pretty break-words',
                      line.role === 'user' ? 'text-muted-foreground text-xs' : 'text-sm leading-relaxed',
                    )}
                  >
                    <span className="sr-only">{line.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                    {line.text}
                  </p>
                ))}
              </div>
            )}
            {captions && !shown.length && <p className="text-muted-foreground min-h-20 pb-4 text-center text-xs">Captions will show here.</p>}
          </div>

          <footer className="flex flex-wrap items-start justify-center gap-6 px-4 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <BarButton label="Mute" caption={muted ? 'Muted' : 'Mute'} icon={muted ? MicOff01Icon : Mic01Icon} pressed={muted} onClick={onToggleMute} />
            {onToggleCaptions && (
              <BarButton label="Captions" icon={captions ? CaptionsIcon : CaptionsOffIcon} pressed={captions} onClick={onToggleCaptions} />
            )}
            <BarButton label="End" icon={CallEnd01Icon} tone="end" onClick={onClose} />
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
