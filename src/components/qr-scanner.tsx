import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, CameraOff01Icon, QrCodeScanIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

// Reads a QR code with the device's camera, in the page. Uses the browser's
// own barcode reader (BarcodeDetector: Chrome, Edge, Safari 17 and Android
// browsers) and the back camera where there is one. Where the reader or the
// camera is missing, or the camera is refused, a text box takes the code or
// link instead, so the flow still works. Calls onScan once per code read.

// The browser API, which the TypeScript DOM library does not yet declare.
type Detected = { rawValue: string }
type Detector = { detect: (source: HTMLVideoElement) => Promise<Detected[]> }
type DetectorClass = new (options: { formats: string[] }) => Detector
const detectorClass = (): DetectorClass | undefined => (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector

export type ScannerState = 'starting' | 'scanning' | 'unsupported' | 'denied' | 'no-camera'

const REASON: Record<Exclude<ScannerState, 'starting' | 'scanning'>, string> = {
  unsupported: 'This browser cannot read QR codes from the camera.',
  denied: 'Camera access was refused.',
  'no-camera': 'No camera was found.',
}

export function QrScanner({ onScan, active = true, hint = 'Point the camera at a QR code', className }: {
  onScan: (value: string) => void
  // False pauses reading (while the result is being dealt with).
  active?: boolean
  hint?: string
  className?: string
}) {
  const id = useId()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ScannerState>('starting')
  const [typed, setTyped] = useState('')
  const latest = useRef({ onScan, active })
  latest.current = { onScan, active }

  useEffect(() => {
    const Detector = detectorClass()
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    let stream: MediaStream | undefined
    let timer: number | undefined
    let stopped = false
    let lastValue = ''

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        await video.play().catch(() => undefined)
        setState('scanning')
        const detector = new Detector({ formats: ['qr_code'] })
        timer = window.setInterval(async () => {
          if (!latest.current.active || video.readyState < 2) return
          try {
            const found = await detector.detect(video)
            const value = found[0]?.rawValue
            if (value && value !== lastValue) {
              lastValue = value
              latest.current.onScan(value)
              // The same code in view is not reported again for a moment.
              window.setTimeout(() => {
                lastValue = ''
              }, 2500)
            }
          } catch {
            // A frame that could not be read; the next one will be.
          }
        }, 250)
      })
      .catch((err: { name?: string }) => {
        setState(err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError' ? 'no-camera' : 'denied')
      })

    return () => {
      stopped = true
      if (timer) window.clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = typed.trim()
    if (!value) return
    onScan(value)
    setTyped('')
  }

  const live = state === 'starting' || state === 'scanning'

  return (
    <div className={cn('grid min-w-0 gap-3', className)}>
      {live ? (
        <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {/* The viewfinder: a square to line the code up in. */}
          <div aria-hidden="true" className="border-background/90 pointer-events-none absolute inset-[16%] rounded-xl border-2" />
          <p className="bg-background/80 text-foreground absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-center text-xs backdrop-blur">
            {state === 'starting' ? <><Spinner className="size-3.5" /> Starting the camera…</> : <><HugeiconsIcon icon={QrCodeScanIcon} strokeWidth={2} className="size-3.5" /> {hint}</>}
          </p>
        </div>
      ) : (
        <div role="status" className="bg-muted/40 text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-xs">
          <HugeiconsIcon icon={CameraOff01Icon} strokeWidth={2} className="size-4 shrink-0" />
          <span>{REASON[state]} Enter the code or paste its link below.</span>
        </div>
      )}
      <form onSubmit={submit} className="grid gap-1.5">
        <label htmlFor={`${id}-code`} className="text-muted-foreground text-[11px]">
          {live ? 'Or enter the code' : 'Code or link'}
        </label>
        <div className="flex gap-1.5">
          <Input id={`${id}-code`} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="https://… or a code" className="min-w-0 flex-1" inputMode="url" autoComplete="off" />
          <Button type="submit" variant="outline" disabled={!typed.trim()} aria-label="Use this code">
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      </form>
    </div>
  )
}
