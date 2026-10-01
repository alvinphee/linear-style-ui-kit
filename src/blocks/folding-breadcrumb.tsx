import { Fragment, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// A breadcrumb that folds to fit the room it has, so a long trail never runs
// into what sits beside it (a search box, actions). In steps: every crumb;
// the first and last parents around "…"; "…" then the last parent; only "…"
// and the current page, which then cuts off with an ellipsis. Folded crumbs
// stay one click away in the "…" menu.
//
// Put it straight inside a flex row: the room is the row's width less its
// other children, so give those a fixed size and the row a definite width.

export type Crumb = {
  id: string
  label: string
  // Shown before the label: a team mark, a module icon…
  icon?: ReactNode
  onSelect?: () => void
}

type Fold = 'none' | 'middle' | 'last' | 'all'
const FOLDS: Fold[] = ['none', 'middle', 'last']

const Sep = () => <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground/60 size-3 shrink-0" />

function useFold(nav: RefObject<HTMLElement | null>, copies: RefObject<Partial<Record<Fold, HTMLElement | null>>>) {
  const [fold, setFold] = useState<Fold>('none')
  useLayoutEffect(() => {
    const el = nav.current
    const row = el?.parentElement
    if (!el || !row) return
    function check() {
      const style = getComputedStyle(row!)
      const gap = parseFloat(style.columnGap) || 0
      const others = [...row!.children].filter((c) => c !== el)
      const used = others.reduce((sum, c) => {
        const width = c.getBoundingClientRect().width
        return sum + width + (width ? gap : 0)
      }, 0)
      const room = row!.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - used
      const next = FOLDS.find((f) => {
        const copy = copies.current[f]
        return !!copy && copy.getBoundingClientRect().width <= room
      }) ?? 'all'
      setFold((f) => (f === next ? f : next))
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(row)
    return () => observer.disconnect()
  })
  return fold
}

function CrumbMenu({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground shrink-0" aria-label="Show the full path">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {crumbs.map((c) => (
          <DropdownMenuItem key={c.id} onSelect={() => c.onSelect?.()}>
            {c.icon ?? <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />}
            <span className="truncate">{c.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CrumbLink({ crumb }: { crumb: Crumb }) {
  return (
    <button
      type="button"
      title={crumb.label}
      onClick={() => crumb.onSelect?.()}
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex max-w-36 min-w-0 items-center gap-1.5 rounded outline-none focus-visible:ring-2"
    >
      {crumb.icon}
      <span className="truncate">{crumb.label}</span>
    </button>
  )
}

// The trail for one fold. The real trail and its measuring copies both come
// from here, so their widths match.
function parts(trail: Crumb[], fold: Fold, menu: (crumbs: Crumb[]) => ReactNode, crumb: (c: Crumb) => ReactNode) {
  if (!trail.length) return []
  if (fold === 'all') return [<Fragment key="m">{menu(trail)}</Fragment>, <Sep key="s" />]
  if (fold === 'last') {
    const last = trail[trail.length - 1]
    return [<Fragment key="m">{menu(trail.slice(0, -1))}</Fragment>, <Sep key="sm" />, <Fragment key={last.id}>{crumb(last)}</Fragment>, <Sep key="s" />]
  }
  const shown = fold === 'middle' ? [trail[0], trail[trail.length - 1]] : trail
  return shown.flatMap((c, i) => [
    ...(fold === 'middle' && i === 1 ? [<Fragment key="m">{menu(trail.slice(1, -1))}</Fragment>, <Sep key="sm" />] : []),
    <Fragment key={c.id}>{crumb(c)}</Fragment>,
    <Sep key={`s${i}`} />,
  ])
}

export function FoldingBreadcrumb({ trail, current, className }: {
  // The parents of the current page, outermost first.
  trail: Crumb[]
  current: string
  className?: string
}) {
  const navRef = useRef<HTMLElement>(null)
  const copies = useRef<Partial<Record<Fold, HTMLElement | null>>>({})
  const fold = useFold(navRef, copies)
  // Steps that differ from the full trail: "middle" needs three parents, "last" two.
  const steps = FOLDS.filter((f) => f === 'none' || (f === 'middle' ? trail.length > 2 : trail.length > 1))
  const ghostMenu = () => <span className="size-5 shrink-0" />
  const ghostCrumb = (c: Crumb) => (
    <span className="flex max-w-36 items-center gap-1.5">
      {c.icon}
      <span className="truncate">{c.label}</span>
    </span>
  )

  return (
    <nav ref={navRef} aria-label="Breadcrumb" className={cn('relative flex min-w-0 items-center gap-1.5 text-xs', className)}>
      {parts(trail, fold, (crumbs) => <CrumbMenu crumbs={crumbs} />, (c) => <CrumbLink crumb={c} />)}
      <span className="min-w-8 truncate font-medium" aria-current="page" title={current}>{current}</span>
      {/* Zero-size and clipped, so the measuring copies never widen the page. */}
      <div aria-hidden className="pointer-events-none invisible absolute top-0 left-0 size-0 overflow-hidden">
        {FOLDS.map((step) => (
          <div
            key={step}
            ref={(el) => { copies.current[step] = steps.includes(step) ? el : null }}
            className="absolute flex w-max items-center gap-1.5 whitespace-nowrap"
          >
            {steps.includes(step) && parts(trail, step, ghostMenu, ghostCrumb)}
            <span className="font-medium">{current}</span>
          </div>
        ))}
      </div>
    </nav>
  )
}
