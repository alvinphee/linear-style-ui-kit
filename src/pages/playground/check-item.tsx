import { useMemo, useState } from 'react'
import { CHECK_OPTIONS, CheckItem, YES_NO_OPTIONS, type CheckOption } from '@/components/check-item'
import { Rating } from '@/components/rating'
import { SignaturePad } from '@/components/signature-pad'
import { Textarea } from '@/components/ui/textarea'
import { Demos, Gallery, Playground, bool, imports, jsx, str, unless, type Values } from './Playground'

/* CheckItem */

const OPTION_SETS = ['Pass / Fail / N/A', 'Yes / No'] as const
const RESULTS = ['none', 'pass', 'fail', 'na'] as const
const YES_NO: Record<string, string> = { pass: 'yes', fail: 'no', na: '' }

const optionsFor = (set: string): CheckOption[] => (set === 'Yes / No' ? YES_NO_OPTIONS : CHECK_OPTIONS)
const valueFor = (set: string, result: string) => (result === 'none' ? '' : set === 'Yes / No' ? YES_NO[result] : result)

// Keeps its own answer, so the preview can be clicked; remounted by its key
// when the pane changes the starting value.
function LiveCheck({ initial, options, note, ...rest }: {
  initial: string
  options: CheckOption[]
  note: boolean
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  error?: string
}) {
  const [value, setValue] = useState(initial)
  const [text, setText] = useState('')
  const bad = options.find((o) => o.value === value)?.tone === 'danger'
  return (
    <CheckItem {...rest} options={options} value={value} onChange={setValue} className="w-full max-w-md">
      {note && bad && <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="What is wrong, and what did you do about it?" aria-label="Note" />}
    </CheckItem>
  )
}

function checkItemCode(v: Values) {
  const set = str(v, 'options')
  const value = valueFor(set, str(v, 'result'))
  const bad = optionsFor(set).find((o) => o.value === value)?.tone === 'danger'
  const note = bool(v, 'note')
  const item = jsx('CheckItem', {
    label: str(v, 'label'),
    description: str(v, 'description') || undefined,
    options: set === 'Yes / No' ? '{YES_NO_OPTIONS}' : undefined,
    value: '{result}',
    onChange: '{setResult}',
    required: bool(v, 'required'),
    disabled: bool(v, 'disabled'),
    readOnly: bool(v, 'readOnly'),
    error: bool(v, 'error') ? 'Answer this check.' : undefined,
  }, note ? [`{${bad ? 'failed' : 'result === \'fail\''} && <Textarea rows={2} placeholder="What is wrong?" />}`] : undefined)
  return `${imports({
    '@/components/check-item': ['CheckItem', ...(set === 'Yes / No' ? ['YES_NO_OPTIONS'] : [])],
    ...(note ? { '@/components/ui/textarea': ['Textarea'] } : {}),
  })}

const [result, setResult] = useState(${value ? `'${value}'` : "''"})

${item}`
}

/* Rating */

const RATING_VALUES = ['0', '1', '2', '3', '4', '5'] as const
const RATING_MAX = ['3', '5', '10'] as const
const RATING_SIZES = ['sm', 'md', 'lg'] as const
const WORDS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function LiveRating({ initial, ...rest }: { initial: number; max: number; labels?: string[]; size: 'sm' | 'md' | 'lg'; readOnly?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(initial)
  return <Rating {...rest} value={value} onChange={setValue} label="Overall" />
}

function ratingCode(v: Values) {
  return `${imports({ '@/components/rating': ['Rating'] })}

const [stars, setStars] = useState(${str(v, 'value')})

${jsx('Rating', {
    value: '{stars}',
    onChange: '{setStars}',
    max: str(v, 'max') === '5' ? undefined : Number(str(v, 'max')),
    labels: bool(v, 'labels') && str(v, 'max') === '5' ? `{${JSON.stringify(WORDS).replace(/"/g, "'").replace(/,/g, ', ')}}` : undefined,
    label: 'Overall',
    size: unless(str(v, 'size'), 'md'),
    readOnly: bool(v, 'readOnly'),
    disabled: bool(v, 'disabled'),
  })}`
}

/* SignaturePad */

const PAD_HEIGHTS = ['100', '140', '180'] as const

// A signature to show the read-only state with: a scribble drawn once.
function useSampleSignature() {
  return useMemo(() => {
    if (typeof document === 'undefined') return ''
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground') || '#111'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(60, 130)
    ctx.bezierCurveTo(80, 40, 120, 40, 140, 120)
    ctx.bezierCurveTo(160, 190, 190, 60, 230, 90)
    ctx.bezierCurveTo(270, 120, 300, 70, 340, 100)
    ctx.bezierCurveTo(370, 120, 400, 110, 430, 90)
    ctx.stroke()
    return canvas.toDataURL('image/png')
  }, [])
}

function LiveSignature({ height, placeholder, disabled }: { height: number; placeholder: string; disabled: boolean }) {
  const [value, setValue] = useState('')
  return <SignaturePad value={value} onChange={setValue} height={height} placeholder={placeholder} disabled={disabled} className="w-full max-w-md" />
}

function signatureCode(v: Values) {
  return `${imports({ '@/components/signature-pad': ['SignaturePad'] })}

const [signature, setSignature] = useState('')

${jsx('SignaturePad', {
    value: '{signature}',
    onChange: '{setSignature}',
    height: str(v, 'height') === '140' ? undefined : Number(str(v, 'height')),
    placeholder: unless(str(v, 'placeholder'), 'Sign here'),
    disabled: bool(v, 'disabled'),
    readOnly: bool(v, 'readOnly'),
  })}`
}

export default function CheckItemDemos() {
  const sample = useSampleSignature()
  return (
    <Demos>
      <Playground
        title="CheckItem"
        description="one line of a checklist: a statement and its outcome"
        controls={[
          { kind: 'text', name: 'label', label: 'Statement', initial: 'Horn works' },
          { kind: 'text', name: 'description', label: 'Description', initial: 'Press twice with the engine on' },
          { kind: 'select', name: 'options', label: 'Options', options: OPTION_SETS, initial: 'Pass / Fail / N/A' },
          { kind: 'select', name: 'result', label: 'Outcome', options: RESULTS, initial: 'none' },
          { kind: 'switch', name: 'note', label: 'Note on a fail', initial: true },
          { kind: 'switch', name: 'required', label: 'Required', initial: false },
          { kind: 'switch', name: 'error', label: 'Error', initial: false },
          { kind: 'switch', name: 'readOnly', label: 'Read-only', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => (
          <LiveCheck
            key={`${str(v, 'options')}-${str(v, 'result')}`}
            initial={valueFor(str(v, 'options'), str(v, 'result'))}
            options={optionsFor(str(v, 'options'))}
            label={str(v, 'label')}
            description={str(v, 'description') || undefined}
            note={bool(v, 'note')}
            required={bool(v, 'required')}
            disabled={bool(v, 'disabled')}
            readOnly={bool(v, 'readOnly')}
            error={bool(v, 'error') ? 'Answer this check.' : undefined}
          />
        )}
        code={checkItemCode}
      />

      <Gallery
        title="CheckItem states"
        note="The chosen outcome takes its tone; a fail opens a note"
        items={[
          { label: 'unanswered', node: <CheckItem label="Mirrors clean and set" value="" className="w-72" /> },
          { label: 'pass', node: <CheckItem label="Tyres inflated" value="pass" className="w-72" /> },
          {
            label: 'fail, with a note',
            node: (
              <CheckItem label="Brake lights" value="fail" className="w-72">
                <Textarea rows={2} defaultValue="Left brake light out. Reported to the workshop." aria-label="Note" />
              </CheckItem>
            ),
          },
          { label: 'not applicable', node: <CheckItem label="Tail lift" value="na" className="w-72" /> },
          { label: 'yes / no', node: <CheckItem label="Is the load secured?" options={YES_NO_OPTIONS} value="yes" className="w-72" /> },
          { label: 'required, error', node: <CheckItem label="Horn works" value="" required error="Answer this check." className="w-72" /> },
          { label: 'read-only', node: <CheckItem label="Seat belt" value="pass" readOnly className="w-72" /> },
          { label: 'disabled', node: <CheckItem label="Reverse alarm" value="" disabled className="w-72" /> },
        ]}
      />

      <Playground
        title="Rating"
        description="stars to pick from, with a word per star"
        controls={[
          { kind: 'select', name: 'value', label: 'Stars', options: RATING_VALUES, initial: '4' },
          { kind: 'select', name: 'max', label: 'Out of', options: RATING_MAX, initial: '5' },
          { kind: 'switch', name: 'labels', label: 'Words (out of 5)', initial: true },
          { kind: 'select', name: 'size', label: 'Size', options: RATING_SIZES, initial: 'md' },
          { kind: 'switch', name: 'readOnly', label: 'Read-only', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => (
          <LiveRating
            key={`${str(v, 'value')}-${str(v, 'max')}`}
            initial={Number(str(v, 'value'))}
            max={Number(str(v, 'max'))}
            labels={bool(v, 'labels') && str(v, 'max') === '5' ? WORDS : undefined}
            size={str(v, 'size') as 'sm' | 'md' | 'lg'}
            readOnly={bool(v, 'readOnly')}
            disabled={bool(v, 'disabled')}
          />
        )}
        code={ratingCode}
      />

      <Gallery
        title="Rating states"
        items={[
          { label: 'none yet', node: <Rating value={0} label="Overall" /> },
          { label: 'with words', node: <Rating value={5} labels={WORDS} label="Overall" /> },
          { label: 'read-only', node: <Rating value={3} readOnly label="Overall" /> },
          { label: 'small, out of 10', node: <Rating value={7} max={10} size="sm" readOnly label="Overall" /> },
          { label: 'large', node: <Rating value={4} size="lg" label="Overall" /> },
          { label: 'disabled', node: <Rating value={2} disabled label="Overall" /> },
        ]}
      />

      <Playground
        title="SignaturePad"
        description="sign with a finger, a stylus or the mouse"
        controls={[
          { kind: 'select', name: 'height', label: 'Height', options: PAD_HEIGHTS, initial: '140' },
          { kind: 'text', name: 'placeholder', label: 'Placeholder', initial: 'Sign here' },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => (
          <LiveSignature key={str(v, 'height')} height={Number(str(v, 'height'))} placeholder={str(v, 'placeholder')} disabled={bool(v, 'disabled')} />
        )}
        code={signatureCode}
      />

      <Gallery
        title="SignaturePad states"
        note="Read-only shows a stored signature as a picture"
        items={[
          { label: 'empty', node: <SignaturePad height={96} className="w-64" /> },
          { label: 'read-only, signed', node: <SignaturePad value={sample} readOnly height={96} className="w-64" /> },
          { label: 'read-only, not signed', node: <SignaturePad readOnly height={96} className="w-64" /> },
          { label: 'error', node: <SignaturePad height={96} error className="w-64" /> },
          { label: 'disabled', node: <SignaturePad height={96} disabled className="w-64" /> },
        ]}
      />
    </Demos>
  )
}
