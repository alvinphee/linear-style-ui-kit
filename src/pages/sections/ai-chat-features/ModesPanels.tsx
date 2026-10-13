import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiVoiceIcon, ArrowRight01Icon, Globe02Icon } from '@hugeicons/core-free-icons'
import { VoiceOrb, type VoiceLine, type VoiceState } from '@/blocks/ai/voice/voice-mode'
import { Button } from '@/components/ui/button'
import { Panel, Row } from '../shared'
import { VoiceSession } from '../ai/VoiceSession'

// The AI chat app's two long-running modes: voice mode (the orb in each
// state, and the full-screen session with its scripted conversation) and
// deep research (how to try it in the app).

const STATES: { state: VoiceState; label: string }[] = [
  { state: 'connecting', label: 'Connecting' },
  { state: 'listening', label: 'Listening' },
  { state: 'thinking', label: 'Thinking' },
  { state: 'speaking', label: 'Speaking' },
  { state: 'paused', label: 'Paused' },
]

// A made-up voice level, so the speaking orb has something to swell with.
function useWave() {
  const [level, setLevel] = useState(0.5)
  useEffect(() => {
    let t = 0
    const timer = window.setInterval(() => {
      t += 1
      setLevel(0.45 + 0.3 * Math.sin(t * 0.9) * Math.sin(t * 0.37) + 0.2 * Math.abs(Math.sin(t * 1.7)))
    }, 90)
    return () => window.clearInterval(timer)
  }, [])
  return level
}

export function ModesPanels() {
  const level = useWave()
  const [open, setOpen] = useState(false)
  const [transcript, setTranscript] = useState<VoiceLine[] | null>(null)

  return (
    <>
      <Panel title="Voice orb" note="VoiceOrb, every state">
        <div className="grid grid-cols-2 gap-4 py-1 sm:grid-cols-3">
          {STATES.map(({ state, label }) => (
            <figure key={state} className="flex min-w-0 flex-col items-center gap-3">
              <VoiceOrb state={state} level={state === 'speaking' ? level : 0} size={64} label={false} />
              <figcaption className="text-muted-foreground text-xs">{label}</figcaption>
            </figure>
          ))}
        </div>
      </Panel>

      <Panel title="Voice mode" note="VoiceMode, scripted">
        <div className="grid gap-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Three spoken turns: it listens, hears a question, thinks and answers, aloud when the browser can speak.
            Settings › Voice picks the voice and speed. Tap the orb to interrupt, Mute to stop it hearing you,
            Escape or End to finish.
          </p>
          <Row>
            <Button size="sm" onClick={() => setOpen(true)}>
              <HugeiconsIcon icon={AiVoiceIcon} strokeWidth={2} data-icon="inline-start" />
              Start voice mode
            </Button>
          </Row>
          {transcript && (
            <div className="bg-subtle grid gap-1.5 rounded-md border p-3" aria-label="Last transcript">
              <p className="text-muted-foreground text-[11px] font-medium">
                Transcript handed to the chat {transcript.length ? `(${transcript.length} lines)` : '(nothing was said)'}
              </p>
              {transcript.map((line, i) => (
                <p key={i} className="min-w-0 text-xs break-words">
                  <span className="text-muted-foreground">{line.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
        <VoiceSession open={open} onClose={() => setOpen(false)} onTranscript={setTranscript} />
      </Panel>

      <Panel title="Deep research" note="Try it in the AI chat app." wide>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ol className="grid list-decimal gap-1.5 pl-4 text-xs leading-relaxed">
            <li>Open the AI chat app.</li>
            <li>Turn on <span className="font-medium">Research</span> in the prompt box.</li>
            <li>Ask any question. <span className="text-muted-foreground">“What are the cold chain rules for pharma?”, “Rules for wooden export pallets” and “Delivery photo best practice” are fully scripted; anything else gets a made-up report on its own words.</span></li>
          </ol>
          <div className="grid gap-2 text-xs leading-relaxed">
            <p className="text-muted-foreground">
              It plans the research in six steps, runs 9 to 14 web searches and reads 8 to 12 pages over 25 to 40 seconds, then writes a report
              with a summary, cited findings, what it means for the jobs and open questions. Faster models read fewer sources.
              Stop it part way and the reply says how far it got.
            </p>
            <Row>
              <Button size="sm" variant="outline" asChild>
                <a href="#/templates/ai-chat">
                  <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} data-icon="inline-start" />
                  Open the AI chat app
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />
                </a>
              </Button>
            </Row>
          </div>
        </div>
      </Panel>
    </>
  )
}
