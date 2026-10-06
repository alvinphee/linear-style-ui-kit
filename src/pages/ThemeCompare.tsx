import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon, ArrowUpRight01Icon, ComputerIcon, LayoutLeftIcon, LayoutRightIcon, LayoutTwoColumnIcon,
  MouseScroll01Icon, Tick02Icon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { IconAction } from '@/components/icon-action'
import { ThemeToggle } from '@/components/theme-toggle'
import { ViewSwitch, type ViewOption } from '@/components/view-switch'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navigate, usePath } from '@/lib/router'
import { NAV_GROUPS, TEMPLATES } from './nav'

// Theme comparison: one kit page shown twice, side by side. The left frame
// has the kit's theme (styles.css); the right one swaps parts of it for
// shadcn's default theme (shadcn-default.css). Both frames run the same
// components, blocks and data, so only the design tokens differ.
// "#/compare/board" compares the Board page.

type Side = 'kit' | 'shadcn'
type View = 'both' | Side

// The parts of the kit's look the right frame can give back to shadcn,
// named as in shadcn-default.css, with what each side uses.
const PARTS = [
  { id: 'colours', label: 'Colours', kit: 'indigo accent, faintly tinted greys', shadcn: 'black and white buttons, pure greys, no indigo' },
  { id: 'text', label: 'Text size', kit: '13px body text', shadcn: '16px body text' },
  { id: 'radius', label: 'Corners', kit: '8px corners', shadcn: '10px corners' },
  { id: 'details', label: 'Details', kit: "Inter's alternate letters, thin scrollbars, tinted text selection", shadcn: "Inter's standard letters, normal scrollbars, the browser's selection colour" },
]

const VIEWS: ViewOption<View>[] = [
  { value: 'both', label: 'Side by side', icon: LayoutTwoColumnIcon },
  { value: 'kit', label: 'Kit theme only', icon: LayoutLeftIcon },
  { value: 'shadcn', label: 'shadcn default only', icon: LayoutRightIcon },
]

const PAGE_GROUPS = [
  ...NAV_GROUPS.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => i.id !== 'compare').map((i) => ({ path: `/${i.id}`, label: i.label })),
  })),
  { title: 'Templates', items: TEMPLATES.map((t) => ({ path: t.path, label: t.label })) },
]
const PAGES = PAGE_GROUPS.flatMap((g) => g.items)

// Narrower frames draw the page at this width and scale it down, so the kit
// keeps its desktop layout (sidebar and all) instead of the phone one.
const DESKTOP_WIDTH = 1280

const BASE = import.meta.env.BASE_URL

function frameAddress(side: Side, page: string, parts: string[]) {
  return side === 'kit' ? `${BASE}#${page}` : `${BASE}?shadcn-default=${parts.join(',')}#${page}`
}

// A frame's route, read the way the kit's router reads it.
function framePath(win: Window) {
  return '/' + win.location.hash.replace(/^#\/?/, '')
}

// Where an element sits in its page, as child positions from <html>, so the
// same element can be found in the other frame (both draw the same page).
function elementPath(el: Element) {
  const path: number[] = []
  for (let node = el; node.parentElement; node = node.parentElement) {
    path.unshift(Array.prototype.indexOf.call(node.parentElement.children, node))
  }
  return path
}

function findByPath(doc: Document, path: number[]) {
  let node: Element | undefined = doc.documentElement
  for (const i of path) node = node?.children[i]
  return node
}

// "colours and corners", "colours, text size and corners"
function names(parts: typeof PARTS) {
  const words = parts.map((p) => p.label.toLowerCase())
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words.join('')
}

function scrollRatio(el: Element) {
  const max = el.scrollHeight - el.clientHeight
  return max > 0 ? el.scrollTop / max : 0
}

export default function ThemeCompare() {
  // A link to this page clicked inside one of its own frames would nest the
  // comparison; the frame is sent back to its page instead (see connect).
  if (window.self !== window.top) return null
  return <Comparison />
}

function Comparison() {
  const path = usePath()
  const page = path.replace(/^\/compare/, '') || '/overview'
  const [view, setView] = useState<View>('both')
  const [parts, setParts] = useState(() => PARTS.map((p) => p.id))
  const [desktop, setDesktop] = useState(true)
  const [scrollTogether, setScrollTogether] = useState(true)
  // The frames' addresses are fixed when the page opens; later changes are
  // passed to the loaded frames directly, so they never reload.
  const [src] = useState(() => ({ kit: frameAddress('kit', page, parts), shadcn: frameAddress('shadcn', page, parts) }))
  const frames = useRef<Record<Side, HTMLIFrameElement | null>>({ kit: null, shadcn: null })
  const loaded = useRef<Record<Side, boolean>>({ kit: false, shadcn: false })
  const latest = useRef({ page, parts, scrollTogether })
  const scrollLock = useRef<{ side?: Side; until: number }>({ until: 0 })

  useEffect(() => {
    latest.current = { page, parts, scrollTogether }
  })

  // The page picker (or the other frame) changed the page: follow it.
  useEffect(() => {
    for (const side of ['kit', 'shadcn'] as const) {
      const win = frames.current[side]?.contentWindow
      if (loaded.current[side] && win && framePath(win) !== page) win.location.hash = page
    }
  }, [page])

  useEffect(() => {
    frames.current.shadcn?.contentDocument?.documentElement.setAttribute('data-shadcn-default', parts.join(' '))
  }, [parts])

  // Wires a frame up once it has loaded: its page, the swapped parts, and
  // following its navigation and scrolling.
  function connect(side: Side) {
    const win = frames.current[side]?.contentWindow
    const doc = frames.current[side]?.contentDocument
    if (!win || !doc) return
    loaded.current[side] = true
    if (side === 'shadcn') doc.documentElement.setAttribute('data-shadcn-default', latest.current.parts.join(' '))
    if (framePath(win) !== latest.current.page) win.location.hash = latest.current.page

    win.addEventListener('hashchange', () => {
      const next = framePath(win)
      if (next.startsWith('/compare')) win.location.hash = latest.current.page
      else navigate('/compare' + next)
    })
    doc.addEventListener('scroll', (event) => mirrorScroll(side, event), { capture: true, passive: true })
  }

  // Scrolls the other frame to the same place: the same element, the same
  // share of its height (the pages can differ in length, e.g. at 16px text).
  function mirrorScroll(side: Side, event: Event) {
    if (!latest.current.scrollTogether) return
    const lock = scrollLock.current
    if (lock.side === side && performance.now() < lock.until) return
    const other: Side = side === 'kit' ? 'shadcn' : 'kit'
    const otherDoc = frames.current[other]?.contentDocument
    const node = event.target as Node
    // Frames have their own Element class, so test the node type, not instanceof.
    const source = node.nodeType === Node.DOCUMENT_NODE ? (node as Document).scrollingElement : (node as Element)
    const target = source && otherDoc ? findByPath(otherDoc, elementPath(source)) : undefined
    if (!source || !target) return
    scrollLock.current = { side: other, until: performance.now() + 120 }
    target.scrollTo({ top: scrollRatio(source) * (target.scrollHeight - target.clientHeight), behavior: 'instant' })
  }

  const current = PAGES.find((p) => page === p.path || page.startsWith(p.path + '/'))
  const swapped = PARTS.filter((p) => parts.includes(p.id))

  return (
    <div className="flex h-svh flex-col">
      <header className="flex min-h-11 flex-wrap items-center gap-2 border-b px-3 py-1.5">
        <Button variant="ghost" size="sm" onClick={() => navigate(page)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
          Kit
        </Button>
        <h1 className="text-xs font-medium">Theme comparison</h1>
        <Select value={current?.path ?? ''} onValueChange={(value) => navigate('/compare' + value)}>
          <SelectTrigger aria-label="Page" className="w-48">
            <SelectValue placeholder={page} />
          </SelectTrigger>
          <SelectContent>
            {PAGE_GROUPS.map((group) => (
              <SelectGroup key={group.title}>
                <SelectLabel>{group.title}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.path} value={item.path}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <IconAction
            label={desktop ? 'Desktop width, scaled to fit' : 'Frame width (narrow frames get the phone layout)'}
            icon={ComputerIcon}
            pressed={desktop}
            size="icon"
            onClick={() => setDesktop((d) => !d)}
          />
          <IconAction
            label="Scroll both frames together"
            icon={MouseScroll01Icon}
            pressed={scrollTogether}
            size="icon"
            onClick={() => setScrollTogether((s) => !s)}
          />
          <ViewSwitch views={VIEWS} value={view} onChange={setView} label="Layout" className="mx-1" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Pane
          title="Kit theme"
          detail="src/styles.css, as mixed on the Theme page"
          hidden={view === 'shadcn'}
          desktop={desktop}
          src={src.kit}
          openHref={frameAddress('kit', page, parts)}
          frameRef={(el) => { frames.current.kit = el }}
          onLoad={() => connect('kit')}
        />
        <Pane
          title="shadcn default"
          detail={
            swapped.length === PARTS.length ? 'Everything as shadcn ships it'
            : swapped.length ? `shadcn's ${names(swapped)}, the kit's ${names(PARTS.filter((p) => !swapped.includes(p)))}`
            : 'Nothing ticked: same as the left'
          }
          // A ticked part uses shadcn's value; an unticked one goes back to the kit's.
          controls={
            <div className="flex items-center gap-2">
              <span id="use-shadcn-label" className="text-muted-foreground text-xs">Use shadcn's:</span>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                spacing={0}
                value={parts}
                onValueChange={setParts}
                aria-labelledby="use-shadcn-label"
              >
                {PARTS.map((part) => {
                  const on = parts.includes(part.id)
                  return (
                    <Tooltip key={part.id}>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem
                          value={part.id}
                          className="data-[state=on]:text-foreground text-muted-foreground text-xs"
                        >
                          {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} data-icon="inline-start" />}
                          {part.label}
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        {on
                          ? `Now shadcn's: ${part.shadcn}. Click for the kit's ${part.kit}.`
                          : `Now the kit's: ${part.kit}. Click for shadcn's ${part.shadcn}.`}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </ToggleGroup>
            </div>
          }
          hidden={view === 'kit'}
          desktop={desktop}
          src={src.shadcn}
          openHref={frameAddress('shadcn', page, parts)}
          frameRef={(el) => { frames.current.shadcn = el }}
          onLoad={() => connect('shadcn')}
          className="border-l"
        />
      </div>
    </div>
  )
}

// One side of the comparison: its name, its controls, and the app in a frame.
function Pane({ title, detail, controls, hidden, desktop, src, openHref, frameRef, onLoad, className }: {
  title: string
  detail: string
  controls?: ReactNode
  hidden: boolean
  desktop: boolean
  src: string
  openHref: string
  frameRef: (el: HTMLIFrameElement | null) => void
  onLoad: () => void
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = desktop && box.width > 0 && box.width < DESKTOP_WIDTH ? box.width / DESKTOP_WIDTH : 1

  return (
    <section aria-label={title} className={cn('flex min-w-0 flex-1 flex-col', hidden && 'hidden', className)}>
      <div className="bg-subtle flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <h2 className="shrink-0 text-xs font-medium">{title}</h2>
          <p className="text-muted-foreground truncate text-xs">
            {detail}
            {scale < 1 && ` · ${Math.round(scale * 100)}%`}
          </p>
        </div>
        {controls}
        <IconAction label="Open in a new tab" icon={ArrowUpRight01Icon} onClick={() => window.open(openHref, '_blank', 'noopener')} />
      </div>
      <div ref={boxRef} className="relative min-h-0 flex-1 overflow-hidden">
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          onLoad={onLoad}
          className="absolute top-0 left-0 origin-top-left border-0"
          style={scale < 1
            ? { width: DESKTOP_WIDTH, height: box.height / scale, transform: `scale(${scale})` }
            : { width: '100%', height: '100%' }}
        />
      </div>
    </section>
  )
}
