import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Eraser01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'

// A box to sign in with a finger, a stylus or the mouse. The strokes are
// drawn on a canvas in the text colour and handed back as a PNG data URL on
// every stroke, so a form can store the signature and restore it (a draft
// kept in the browser, a submission shown later). Clear starts again.
// Read-only, it shows a stored signature as a picture.

// The canvas is drawn at the device's pixel ratio, so a signature stays
// sharp on a phone.
function fit(canvas: HTMLCanvasElement, image?: string) {
  const box = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.round(box.width * ratio)
  canvas.height = Math.round(box.height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = getComputedStyle(canvas).color
  if (!image) return
  const img = new Image()
  img.onload = () => ctx.drawImage(img, 0, 0, box.width, box.height)
  img.src = image
}

export function SignaturePad({ value = '', onChange, height = 140, label = 'Signature', placeholder = 'Sign here', id, disabled, readOnly, error, className }: {
  // The signature so far, as a PNG data URL, or '' for none.
  value?: string
  onChange?: (dataUrl: string) => void
  // The box's height in pixels. It fills the width it is given.
  height?: number
  // The accessible name of the canvas.
  label?: string
  placeholder?: string
  id?: string
  disabled?: boolean
  readOnly?: boolean
  error?: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef(value)
  const [empty, setEmpty] = useState(!value)
  last.current = value

  // Size the canvas to its box, and again when the box changes width; the
  // stored strokes are drawn back on each time.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || readOnly) return
    fit(canvas, last.current)
    const observer = new ResizeObserver(() => fit(canvas, last.current))
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [readOnly])

  // A value set from outside (a draft restored, a Clear elsewhere).
  useEffect(() => {
    setEmpty(!value)
    const canvas = canvasRef.current
    if (canvas && !readOnly && !drawing.current) fit(canvas, value)
  }, [value, readOnly])

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return [e.clientX - box.left, e.clientY - box.top] as const
  }

  function start(e: PointerEvent<HTMLCanvasElement>) {
    if (disabled || readOnly) return
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some pointers cannot be captured; the stroke still draws while over the box.
    }
    drawing.current = true
    const [x, y] = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    // A dot for a tap.
    ctx.lineTo(x + 0.1, y)
    ctx.stroke()
    setEmpty(false)
  }

  function move(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')
    if (!ctx) return
    const [x, y] = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function end(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = false
    onChange?.(e.currentTarget.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    if (canvas) fit(canvas)
    setEmpty(true)
    onChange?.('')
  }

  if (readOnly) {
    return (
      <div
        role="img"
        aria-label={value ? label : `${label}: none`}
        style={{ height }}
        className={cn('bg-card text-foreground relative grid w-full place-items-center overflow-hidden rounded-lg border', className)}
      >
        {value
          ? <img src={value} alt="" className="h-full w-full object-contain" />
          : <span className="text-muted-foreground text-xs">Not signed</span>}
      </div>
    )
  }

  return (
    <div className={cn('relative min-w-0', className)}>
      <canvas
        ref={canvasRef}
        id={id}
        role="img"
        aria-label={empty ? `${label}: empty. Draw to sign.` : label}
        aria-invalid={error || undefined}
        style={{ height }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className={cn(
          'bg-card text-foreground block w-full touch-none rounded-lg border',
          error ? 'border-destructive' : 'border-input',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair',
        )}
      />
      {empty && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-7 border-b border-dashed">
          <span className="text-muted-foreground/70 absolute inset-x-0 -top-6 text-center text-xs">{placeholder}</span>
        </div>
      )}
      {!empty && !disabled && (
        <Button type="button" variant="ghost" size="xs" onClick={clear} className="text-muted-foreground absolute top-1.5 right-1.5">
          <HugeiconsIcon icon={Eraser01Icon} strokeWidth={2} data-icon="inline-start" /> Clear
        </Button>
      )}
    </div>
  )
}
