import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VoiceMode, type VoiceLine, type VoiceState } from '@/blocks/ai/voice/voice-mode'
import { useJobs } from '../../jobs-store'
import type { Job } from '../../data'
import { byUrgency, isHot, isOpen } from './scenario-helpers'
import { useAiPrefs } from './settings/prefs'
import { VOICES } from './settings/VoiceTab'

// A scripted voice conversation for the voice mode block. Nothing listens to
// the microphone: it connects, "hears" a scripted question after a few
// seconds of listening, thinks, then speaks the answer (with the browser's
// speechSynthesis when it has it, at the chosen voice's pitch and the
// speaking speed from Settings › Voice), and listens again. Three turns
// about the workspace's jobs, then it keeps listening. Mute stops it hearing;
// tapping the orb interrupts it (barge-in). On close, onTranscript gets what
// was said, so the app can add it to the chat.

const TICK = 90
// How long a turn listens before the scripted question is "heard": quiet
// first, then the person talking.
const QUIET_MS = 1200
const HEARD_MS = 3000
const THINK_MS = 1000
const CONNECT_MS = 1000
// Captions show the spoken words at about this pace (at 1×).
const WORD_MS = 320

type Turn = { ask: string; answer: string }

function turnsFor(jobs: Job[]): Turn[] {
  const open = jobs.filter(isOpen)
  const hot = open.filter(isHot).sort(byUrgency)
  const first = hot[0]
  const urgent = first
    ? `You have ${hot.length} urgent or high-priority ${hot.length === 1 ? 'job' : 'jobs'} open. The first is ${first.id}, ${first.title.toLowerCase()}${first.customer ? ` for ${first.customer}` : ''}, due ${first.due ? first.due.toLowerCase() : 'soon'}${first.driver ? `, with ${first.driver}` : ', and nobody is assigned yet'}.`
    : 'Nothing urgent is open right now. The list is clear.'

  const load = new Map<string, number>()
  for (const job of open) if (job.driver) load.set(job.driver, (load.get(job.driver) ?? 0) + 1)
  const ranked = [...load].sort((a, b) => b[1] - a[1])
  const busiest = ranked[0]
    ? `${ranked[0][0]} has the most, with ${ranked[0][1]} open ${ranked[0][1] === 1 ? 'job' : 'jobs'}.${ranked[1] ? ` ${ranked[1][0]} is next with ${ranked[1][1]}.` : ''}`
    : 'Nobody has open jobs assigned at the moment.'

  const cold = open.filter((j) => j.labels.includes('cold')).sort(byUrgency)[0]
  const chilled = cold
    ? `${cold.id}${cold.customer ? ` for ${cold.customer}` : ''} needs chilling. Pre-cool the truck, keep it between 2 and 8 degrees, and print the temperature log before wrapping.`
    : 'None of the open jobs needs chilling, so there is nothing to prepare.'

  return [
    { ask: 'What’s urgent today?', answer: urgent },
    { ask: 'Who has the most jobs this week?', answer: busiest },
    { ask: 'Anything I should know about the cold chain jobs?', answer: chilled },
  ]
}

const words = (text: string) => text.split(/\s+/).filter(Boolean)

// The first `n` words of a line, marked as cut off when that is not all of it.
function saidSoFar(text: string, n: number) {
  const all = words(text)
  const said = all.slice(0, Math.max(1, n)).join(' ')
  return n >= all.length ? text : `${said}…`
}

export function VoiceSession({ open, onClose, onTranscript }: {
  open: boolean
  onClose: () => void
  // Everything said, in order, when the session ends (may be empty).
  onTranscript: (lines: VoiceLine[]) => void
}) {
  const { jobs } = useJobs()
  const { prefs } = useAiPrefs()
  const voice = VOICES.find((v) => v.id === prefs.voice) ?? VOICES[0]
  const speed = prefs.voiceSpeed || 1

  const [state, setState] = useState<VoiceState>('connecting')
  const [level, setLevel] = useState(0)
  const [lines, setLines] = useState<VoiceLine[]>([])
  // Words of the last assistant line spoken so far, for the captions.
  const [spoken, setSpoken] = useState<number | null>(null)
  const [muted, setMuted] = useState(false)
  const [captions, setCaptions] = useState(true)

  const turns = useMemo(() => turnsFor(jobs), [jobs])
  const live = useRef({ state: 'connecting' as VoiceState, muted: false, turn: 0, heardMs: 0, speakId: 0, tick: 0 })
  const timers = useRef<number[]>([])
  const linesRef = useRef<VoiceLine[]>([])
  const spokenRef = useRef<number | null>(null)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  const go = useCallback((next: VoiceState) => {
    live.current.state = next
    setState(next)
  }, [])

  const push = useCallback((line: VoiceLine) => {
    linesRef.current = [...linesRef.current, line]
    setLines(linesRef.current)
  }, [])

  const showWords = useCallback((n: number | null) => {
    spokenRef.current = n
    setSpoken(n)
  }, [])

  const stopSpeech = useCallback(() => {
    live.current.speakId += 1
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  const listen = useCallback(() => {
    live.current.heardMs = 0
    showWords(null)
    go('listening')
  }, [go, showWords])

  const speak = useCallback((text: string) => {
    const id = ++live.current.speakId
    push({ role: 'assistant', text })
    showWords(0)
    go('speaking')
    const total = words(text).length
    const wordMs = WORD_MS / speed
    for (let i = 1; i <= total; i++) later(() => { if (live.current.speakId === id) showWords(i) }, i * wordMs)
    const done = () => {
      if (live.current.speakId !== id) return
      live.current.speakId += 1
      live.current.turn += 1
      listen()
    }
    // Without speech, the captions' pace decides; with it, the speech ends
    // the turn (or this, if the browser never says it finished).
    let fallback = Math.max(4000, total * wordMs + 400)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speed
      utterance.pitch = voice.pitch
      const match = window.speechSynthesis.getVoices().find((v) => v.name.toLowerCase().includes(voice.name.toLowerCase()))
      if (match) utterance.voice = match
      utterance.onend = done
      utterance.onerror = done
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      fallback = total * wordMs * 2 + 4000
    }
    later(done, fallback)
  }, [go, later, listen, push, showWords, speed, voice])

  const heard = useCallback(() => {
    const turn = turns[live.current.turn]
    if (!turn) return
    push({ role: 'user', text: turn.ask })
    go('thinking')
    later(() => speak(turn.answer), THINK_MS)
  }, [go, later, push, speak, turns])

  // Starts on open; everything stops on close.
  useEffect(() => {
    if (!open) return
    live.current = { state: 'connecting', muted: false, turn: 0, heardMs: 0, speakId: 0, tick: 0 }
    linesRef.current = []
    setLines([])
    setMuted(false)
    showWords(null)
    go('connecting')
    later(listen, CONNECT_MS)
    return () => {
      clearTimers()
      stopSpeech()
    }
  }, [open, clearTimers, go, later, listen, showWords, stopSpeech])

  // One clock for the level and for "hearing": listening only counts while
  // not muted, so Mute holds the turn where it is.
  useEffect(() => {
    if (!open) return
    const timer = window.setInterval(() => {
      const s = live.current
      s.tick += 1
      const t = s.tick
      if (s.state === 'speaking') {
        setLevel(0.45 + 0.3 * Math.sin(t * 0.9) * Math.sin(t * 0.37) + 0.2 * Math.abs(Math.sin(t * 1.7)))
        return
      }
      if (s.state !== 'listening' || s.muted) {
        setLevel(0)
        return
      }
      const waiting = s.turn >= turns.length
      if (!waiting) s.heardMs += TICK
      const talking = !waiting && s.heardMs > QUIET_MS
      setLevel(talking ? 0.35 + 0.35 * Math.abs(Math.sin(t * 0.8)) * Math.abs(Math.cos(t * 0.31)) : 0.06 + 0.05 * Math.abs(Math.sin(t * 0.5)))
      if (!waiting && s.heardMs >= HEARD_MS) {
        s.heardMs = 0
        heard()
      }
    }, TICK)
    return () => window.clearInterval(timer)
  }, [open, heard, turns.length])

  const interrupt = useCallback(() => {
    if (live.current.state !== 'speaking') return
    stopSpeech()
    clearTimers()
    // Keep what was said before the interruption.
    const all = linesRef.current
    const last = all[all.length - 1]
    if (last?.role === 'assistant') {
      linesRef.current = [...all.slice(0, -1), { role: 'assistant', text: saidSoFar(last.text, spokenRef.current ?? 0) }]
      setLines(linesRef.current)
    }
    live.current.turn += 1
    listen()
  }, [clearTimers, listen, stopSpeech])

  const close = useCallback(() => {
    clearTimers()
    stopSpeech()
    // A reply cut off by closing keeps only what was said.
    const all = linesRef.current
    const last = all[all.length - 1]
    const cut = live.current.state === 'speaking' && last?.role === 'assistant' && spokenRef.current !== null
    onTranscript(cut
      ? [...all.slice(0, -1), { role: 'assistant', text: saidSoFar(last.text, spokenRef.current ?? 0) }]
      : all)
    onClose()
  }, [clearTimers, onClose, onTranscript, stopSpeech])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      live.current.muted = !m
      return !m
    })
  }, [])

  // While speaking, the captions show the words said so far.
  const shown = useMemo(() => {
    if (spoken === null || !lines.length) return lines
    const last = lines[lines.length - 1]
    if (last.role !== 'assistant') return lines
    return [...lines.slice(0, -1), { ...last, text: words(last.text).slice(0, Math.max(1, spoken)).join(' ') }]
  }, [lines, spoken])

  return (
    <VoiceMode
      open={open}
      onClose={close}
      state={state}
      level={level}
      transcript={shown}
      captions={captions}
      onToggleCaptions={() => setCaptions((c) => !c)}
      muted={muted}
      onToggleMute={toggleMute}
      onInterrupt={interrupt}
      voiceName={voice.name}
    />
  )
}
