import {
  useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode,
} from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useMediaQuery } from '@/lib/use-media-query'

// The docked panel (a push panel): a side panel that sits beside the page
// and narrows it instead of covering it, so what it talks about stays in
// view. For an assistant, an inspector, comments. It slides open and shut.
// Its inner edge resizes it: drag it, or focus it and use the arrow keys
// (Shift for bigger steps, Home and End for the limits); double-click puts
// the default width back. It never takes more than 60% of its row. Below
// `dockAt` there is no room beside the page, so it opens as a sheet over it.
// Escape inside it closes it.
//
// Put it in a row with the page (last for the right side, first for the
// left); it fills the row's height:
//   <div className="flex min-h-0 flex-1">
//     <main className="min-w-0 flex-1">…</main>
//     <DockedPanel open={open} onOpenChange={setOpen} title="Ask AI">…</DockedPanel>
//   </div>
// Give its content a header and a body that scrolls.

const STEP = 16
const SLIDE_MS = 200

export function DockedPanel({
  open, onOpenChange, title, description, side = 'right', width, defaultWidth = 400, minWidth = 320,
  maxWidth = 720, onWidthChange, dockAt = 1024, showCloseButton = true, onOpenFocus, onCloseAutoFocus,
  className, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Names the panel for screen readers; show it in your own header too.
  title: string
  description?: string
  side?: 'left' | 'right'
  // The width to open at, in pixels, such as one saved from onWidthChange.
  width?: number
  // Used when `width` is left out, and by double-clicking the edge.
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  // After each resize, with the new width, to save it.
  onWidthChange?: (width: number) => void
  // The narrowest window, in pixels, that docks it; narrower, it is a sheet.
  dockAt?: number
  // A close button in the top corner. Leave it off when your header has one.
  showCloseButton?: boolean
  // Called as it opens, to put focus somewhere, such as its prompt box.
  onOpenFocus?: () => void
  // Called as it closes; prevent the event to keep focus where it went.
  onCloseAutoFocus?: (event: Event) => void
  // The panel's surface: its background, a padding.
  className?: string
  children?: ReactNode
}) {
  const docked = useMediaQuery(`(min-width: ${dockAt}px)`)
  const [live, setLive] = useState(width ?? defaultWidth)
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(open)
  const [resizing, setResizing] = useState(false)
  const [room, setRoom] = useState(Number.POSITIVE_INFINITY)
  const asideRef = useRef<HTMLElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(open)
  const liveRef = useRef(live)
  liveRef.current = live

  useEffect(() => {
    if (width !== undefined) setLive(width)
  }, [width])

  // 60% of the row, so the page keeps room; the row is watched as the window changes.
  const max = Math.max(minWidth, Math.min(maxWidth, Math.floor(room * 0.6)))
  const clamp = (w: number) => Math.round(Math.min(max, Math.max(minWidth, w)))
  const panelWidth = clamp(live)

  useLayoutEffect(() => {
    const row = asideRef.current?.parentElement
    if (!row || !mounted) return
    setRoom(row.clientWidth)
    const observer = new ResizeObserver(() => setRoom(row.clientWidth))
    observer.observe(row)
    return () => observer.disconnect()
  }, [mounted, docked])

  // Opening mounts it closed, then widens it; closing narrows it, then unmounts it.
  useEffect(() => {
    if (!docked) return
    if (open) {
      setMounted(true)
      return
    }
    setShown(false)
    const timer = window.setTimeout(() => setMounted(false), SLIDE_MS + 20)
    return () => window.clearTimeout(timer)
  }, [open, docked])

  useLayoutEffect(() => {
    if (!docked || !open || !mounted || shown || !asideRef.current) return
    // Lay out the closed width first, so the change to the open one animates.
    void asideRef.current.offsetWidth
    setShown(true)
  }, [docked, open, mounted, shown])

  // Focus in, and back out to where it was, unless the caller says otherwise.
  useEffect(() => {
    if (!docked || open === wasOpen.current) return
    wasOpen.current = open
    if (open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpenFocus?.()
      return
    }
    const event = new Event('closeautofocus', { cancelable: true })
    onCloseAutoFocus?.(event)
    const active = document.activeElement
    const lost = !active || active === document.body || !!asideRef.current?.contains(active)
    if (!event.defaultPrevented && lost && returnTo.current?.isConnected) returnTo.current.focus()
    // Only on opening and closing.
  }, [open, docked])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const start = panelWidth
    setResizing(true)
    const move = (ev: globalThis.PointerEvent) => {
      const delta = side === 'right' ? startX - ev.clientX : ev.clientX - startX
      setLive(clamp(start + delta))
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', up)
      setResizing(false)
      onWidthChange?.(liveRef.current)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', up)
  }

  function resizeTo(next: number) {
    const w = clamp(next)
    setLive(w)
    onWidthChange?.(w)
  }

  function onHandleKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? STEP * 4 : STEP
    const wider = side === 'right' ? 'ArrowLeft' : 'ArrowRight'
    const narrower = side === 'right' ? 'ArrowRight' : 'ArrowLeft'
    const next = e.key === wider ? panelWidth + step
      : e.key === narrower ? panelWidth - step
        : e.key === 'Home' ? minWidth
          : e.key === 'End' ? max
            : null
    if (next === null) return
    e.preventDefault()
    resizeTo(next)
  }

  if (!docked) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          showCloseButton={showCloseButton}
          className={cn('gap-0 p-0 data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-md data-[side=right]:sm:max-w-md', className)}
          onOpenAutoFocus={(e) => {
            if (!onOpenFocus) return
            e.preventDefault()
            onOpenFocus()
          }}
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">{description ?? title}</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  if (!mounted) return null

  return (
    <aside
      ref={asideRef}
      aria-label={title}
      inert={!open}
      data-resizing={resizing || undefined}
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || e.defaultPrevented) return
        e.preventDefault()
        onOpenChange(false)
      }}
      style={{ width: shown ? panelWidth : 0 }}
      className="group/panel relative h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none data-resizing:transition-none"
    >
      {/* Full width from the start, pinned to the outer edge, so it slides in rather than squeezing. */}
      <div
        style={{ width: panelWidth }}
        className={cn('bg-background absolute inset-y-0 flex flex-col', side === 'right' ? 'right-0' : 'left-0', className)}
      >
        {children}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${title}`}
        aria-valuenow={panelWidth}
        aria-valuemin={minWidth}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onHandleKey}
        onDoubleClick={() => resizeTo(defaultWidth)}
        className={cn(
          'group/handle absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none outline-none',
          side === 'right' ? 'left-0' : 'right-0',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'bg-border group-hover/handle:bg-brand/60 group-focus-visible/handle:bg-brand group-data-resizing/panel:bg-brand absolute inset-y-0 w-px transition-[background-color,width] group-hover/handle:w-0.5 group-focus-visible/handle:w-0.5 group-data-resizing/panel:w-0.5',
            side === 'right' ? 'left-0' : 'right-0',
          )}
        />
      </div>

      {showCloseButton && (
        <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2 z-10" onClick={() => onOpenChange(false)}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close</span>
        </Button>
      )}
    </aside>
  )
}
