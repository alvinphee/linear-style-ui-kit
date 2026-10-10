import { useState } from 'react'
import { VoiceEqualiser, VoicePicker } from '@/blocks/ai/voice/voice-picker'
import { Panel } from '../shared'
import { VOICES, useVoiceSample } from '../ai/settings/VoiceTab'

// The voice picker block on its own: live (play a sample, pick a voice), a
// card caught mid-sample, and the equaliser by itself.

export function ModelsPanels() {
  const [voice, setVoice] = useState('aria')
  const [playingId, play] = useVoiceSample(1)

  const [still, setStill] = useState('juniper')
  const [stillPlaying, setStillPlaying] = useState<string | null>('juniper')
  const [quiet, setQuiet] = useState('cove')

  return (
    <>
      <Panel title="Voice picker" note="Play a sample, then pick" wide>
        <VoicePicker voices={VOICES} value={voice} onChange={setVoice} playingId={playingId} onPlay={play} />
      </Panel>
      <Panel title="Playing a sample" note="Stays playing until stopped">
        <VoicePicker
          voices={VOICES.slice(0, 3)}
          value={still}
          onChange={setStill}
          playingId={stillPlaying}
          onPlay={setStillPlaying}
          label="Voice, sample playing"
          columns={1}
        />
      </Panel>
      <Panel title="Equaliser" note="Still, and playing">
        <div className="text-muted-foreground flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2 text-xs"><VoiceEqualiser /> Still</span>
          <span className="text-brand flex items-center gap-2 text-xs"><VoiceEqualiser playing /> Playing</span>
          <span className="bg-brand/15 text-brand flex size-9 items-center justify-center rounded-full">
            <VoiceEqualiser playing />
          </span>
        </div>
      </Panel>
      <Panel title="Without samples" note="No onPlay: no play button">
        <VoicePicker voices={VOICES.slice(3)} value={quiet} onChange={setQuiet} label="Voice, no samples" columns={1} />
      </Panel>
    </>
  )
}
