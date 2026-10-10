import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { VoicePicker, type VoiceOption } from '@/blocks/ai/voice/voice-picker'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useAiPrefs, useStoredState } from './prefs'

// Voice: the voice the assistant speaks with in voice mode, how fast, and
// when what you said is sent. Samples are spoken by the browser when it can
// (speechSynthesis), with a pitch per voice so they differ; otherwise the
// card just shows the equaliser for a moment. There is no real voice behind
// any of them.

type Voice = VoiceOption & { pitch: number }

export const VOICES: Voice[] = [
  { id: 'aria', name: 'Aria', description: 'Warm and steady. Easy to listen to for long answers.', tags: ['Warm', 'Calm'], pitch: 1.1 },
  { id: 'sol', name: 'Sol', description: 'Bright and upbeat, with a quick pace.', tags: ['Bright', 'Lively'], pitch: 1.3 },
  { id: 'juniper', name: 'Juniper', description: 'Clear and even. Good for numbers and steps.', tags: ['Clear', 'Neutral'], pitch: 1 },
  { id: 'ember', name: 'Ember', description: 'Low and relaxed, like a late-night radio host.', tags: ['Low', 'Relaxed'], pitch: 0.7 },
  { id: 'cove', name: 'Cove', description: 'Soft and gentle. Speaks a little slower.', tags: ['Soft', 'Gentle'], pitch: 0.9 },
  { id: 'maple', name: 'Maple', description: 'Friendly and confident, with plenty of energy.', tags: ['Friendly', 'Confident'], pitch: 1.2 },
]

const LANGUAGES = [
  { value: 'auto', label: 'Detect automatically' },
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'zh', label: '中文 (普通话)' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
]

const SPEED_MIN = 0.75
const SPEED_MAX = 1.5
const formatSpeed = (speed: number) => `${Number(speed.toFixed(2))}×`

// Plays a voice's sample: spoken by the browser if it can, for ~2.5s if not.
// Returns the voice playing and a toggle (null stops). Stops on unmount.
export function useVoiceSample(speed: number) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stop = useCallback(() => {
    clearTimeout(timer.current)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setPlayingId(null)
  }, [])

  useEffect(() => stop, [stop])

  const play = useCallback((id: string | null) => {
    stop()
    const voice = VOICES.find((v) => v.id === id)
    if (!voice) return
    setPlayingId(voice.id)
    let own: ReturnType<typeof setTimeout> | undefined
    // Only ends its own sample: a cancelled one still fires onend later.
    const done = () => {
      clearTimeout(own)
      setPlayingId((current) => (current === voice.id ? null : current))
    }
    let fallback = 2500 / speed
    if ('speechSynthesis' in window) {
      const sample = new SpeechSynthesisUtterance(`Hi, I'm ${voice.name}. This is how I'll sound when we talk.`)
      sample.rate = speed
      sample.pitch = voice.pitch
      sample.onend = done
      sample.onerror = done
      window.speechSynthesis.speak(sample)
      // In case the browser has no voices and never says it finished.
      fallback = 8000
    }
    own = setTimeout(done, fallback)
    timer.current = own
  }, [speed, stop])

  return [playingId, play] as const
}

export function VoiceTab() {
  const id = useId()
  const { prefs, set } = useAiPrefs()
  const [language, setLanguage] = useStoredState('linear-kit:ai-voice-language:v1', 'auto')
  const [playingId, play] = useVoiceSample(prefs.voiceSpeed)
  const speedRef = useRef<HTMLSpanElement>(null)

  // The slider's thumb is the control screen readers land on, and the kit's
  // Slider doesn't pass a name to it, so name it here.
  useEffect(() => {
    const thumb = speedRef.current?.querySelector('[role=slider]')
    thumb?.setAttribute('aria-label', 'Speaking speed')
    thumb?.setAttribute('aria-valuetext', formatSpeed(prefs.voiceSpeed))
  }, [prefs.voiceSpeed])

  return (
    <>
      <SettingsHeader title="Voice" description="How the assistant sounds in voice mode, and how a spoken turn is sent." />

      <SettingsGroup title="Voice" description="Play a sample to hear each one. Your choice applies to new voice chats.">
        <div className="p-3">
          <VoicePicker
            voices={VOICES}
            value={prefs.voice}
            onChange={(v) => set('voice', v)}
            playingId={playingId}
            onPlay={play}
            label="Assistant voice"
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Voice mode">
        <SettingsRow label="Speaking speed" hint="How fast the assistant talks. Samples play at this speed." stacked>
          <div className="grid gap-1.5">
            <div className="flex items-center gap-3">
              <Slider
                ref={speedRef}
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={0.05}
                value={[prefs.voiceSpeed]}
                onValueChange={([v]) => set('voiceSpeed', v)}
                className="min-w-0 flex-1"
              />
              <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">{formatSpeed(prefs.voiceSpeed)}</span>
            </div>
            {/* 1× sits a third of the way along, not in the middle. */}
            <div aria-hidden className="text-muted-foreground relative mr-13 h-3 text-[10px] tabular-nums">
              <span className="absolute left-0">{formatSpeed(SPEED_MIN)}</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${((1 - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100}%` }}>1×</span>
              <span className="absolute right-0">{formatSpeed(SPEED_MAX)}</span>
            </div>
          </div>
        </SettingsRow>
        <SettingsRow
          label="Send automatically after a pause"
          hint="When you stop talking for a moment, your turn is sent. Off: tap Send yourself."
          htmlFor={`${id}-auto`}
        >
          <Switch id={`${id}-auto`} checked={prefs.autoSend} onCheckedChange={(on) => set('autoSend', on)} />
        </SettingsRow>
        <SettingsRow label="Voice mode language" hint="The language you speak in. Detect works for most people." htmlFor={`${id}-lang`}>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id={`${id}-lang`} size="sm" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="end">
              {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
