import { useEffect, useRef, useState, type ReactNode, type UIEventHandler } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Add01Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { UserAvatar } from '@/components/person'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { plural } from '@/lib/text'

// The phone app's frame (the layout an installed web app, a PWA, uses on a
// phone) and the parts its screens are made of. Not the desktop frame folded
// up: a tab bar at the bottom in place of the sidebar; one screen at a time,
// a pushed screen showing a back arrow named after where it came from; a top
// bar with one job; the main action within thumb reach (a floating button or
// the middle of the tab bar); pickers and filters in bottom sheets; list rows
// as cards; settings as grouped rows. In place of the tab bar, a menu screen:
// "Menu" in the top bar opens every destination full screen under it, in
// big type on a blurred page (MobileMenu, as shadcn's own site does on a
// phone). The tab bar comes classic (a strip along the bottom) or floating
// (MobileFloatingTabBar, working as iOS 26's does: a capsule over the
// content, search as a round button beside it, shrinking to the current
// tab while you scroll down; drawn in the kit's own card style). The safe-area padding
// (env(safe-area-inset-*)) keeps the page clear of the notch and the home
// indicator once installed; in a browser tab it is zero.
//
//   <MobileShell
//     header={<MobileTopBar title="Invoices" back={{ label: 'Accounting', onClick: up }} />}
//     tabBar={<MobileTabBar tabs={tabs} current="home" onSelect={setTab} />}
//     fab={<MobileFab label="New invoice" onClick={create} />}
//   >
//     …the screen…
//   </MobileShell>

export type MobileTab = { id: string; label: string; icon: IconSvgElement; badge?: number }

export function MobileShell({
  header, banner, children, foot, tabBar, floatingBar, fab, menu, screenKey, pushed, bodyId, bodyClassName, onBodyScroll,
  className,
}: {
  // The top bar (MobileTopBar).
  header?: ReactNode
  // A strip under the top bar, such as "Offline".
  banner?: ReactNode
  children: ReactNode
  // The screen's own bottom action (Submit, Mark as done). A screen with one
  // hides the tab bar, as phone apps do.
  foot?: ReactNode
  tabBar?: ReactNode
  // A tab bar that floats over the screen (MobileFloatingTabBar), in place
  // of `tabBar`. It is told when to shrink: while the screen scrolls down.
  floatingBar?: (state: { minimized: boolean; expand: () => void }) => ReactNode
  // Floats over the bottom right of the screen (MobileFab).
  fab?: ReactNode
  // The open menu screen (MobileMenu): it covers everything under the top
  // bar, which stays, and what it covers cannot be reached until it closes.
  menu?: ReactNode
  // Changes when another screen shows, so its scroll starts at the top; with
  // `pushed`, the new screen slides in from the right.
  screenKey?: string
  pushed?: boolean
  bodyId?: string
  bodyClassName?: string
  onBodyScroll?: UIEventHandler<HTMLDivElement>
  className?: string
}) {
  const covered = !!menu || undefined
  const floating = !foot && floatingBar
  // Scrolling down shrinks the floating bar; scrolling up, or a new screen, brings it back.
  const [minimized, setMinimized] = useState(false)
  const lastTop = useRef(0)
  useEffect(() => {
    setMinimized(false)
    lastTop.current = 0
  }, [screenKey])
  const onScroll: UIEventHandler<HTMLDivElement> = (e) => {
    const top = e.currentTarget.scrollTop
    const moved = top - lastTop.current
    if (Math.abs(moved) > 8) {
      setMinimized(moved > 0 && top > 48)
      lastTop.current = top
    }
    onBodyScroll?.(e)
  }

  return (
    <div className={cn('bg-background text-foreground relative flex flex-col overflow-hidden', className)}>
      {header}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col" inert={covered} aria-hidden={covered}>
          {banner}
          <div className="relative min-h-0 flex-1">
            <div
              key={screenKey}
              id={bodyId}
              onScroll={floating ? onScroll : onBodyScroll}
              className={cn(
                'absolute inset-0 overflow-y-auto overscroll-contain',
                pushed && 'animate-in slide-in-from-right-6 fade-in-0 duration-200',
                fab && 'pb-20',
                // Room to scroll the last of the page out from under the floating bar.
                floating && 'pb-28',
                bodyClassName,
              )}
            >
              {children}
            </div>
            {/* Over the floating bar, when there is one. */}
            <div className={cn('pointer-events-none absolute inset-0', floating && 'bottom-20')}>{fab}</div>
            {floating && floating({ minimized, expand: () => setMinimized(false) })}
          </div>
          {foot ? <div className="bg-background shrink-0 border-t px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.625rem)]">{foot}</div> : tabBar}
        </div>
        {menu}
      </div>
    </div>
  )
}

// "Menu" for the top bar, opening and closing the menu screen. Its two bars
// turn into a cross while the menu is open.
// Three looks:
//   label     ≡ Menu, as shadcn's site has it (the default)
//   icon      the bars alone, a 36px target; put the page's title beside it
//   switcher  the current module (or workspace, team) as its mark and name
//             with a chevron: the menu it opens leads with the modules
//             (MobileMenuTiles), so the button is the module switcher too
export type MobileMenuButtonVariant = 'label' | 'icon' | 'switcher'

export function MobileMenuButton({ open, onClick, controls, label = 'Menu', variant = 'label', mark, className }: {
  open: boolean
  onClick: () => void
  // The menu's id.
  controls: string
  // "Menu", or with `switcher` the current module's name.
  label?: string
  variant?: MobileMenuButtonVariant
  // With `switcher`: the current module's mark.
  mark?: ReactNode
  className?: string
}) {
  const bar = 'bg-foreground absolute left-0 block h-0.5 w-4 rounded-full transition-all duration-100'
  const bars = (
    <span aria-hidden className="relative size-4 shrink-0">
      <span className={cn(bar, open ? 'top-[7px] -rotate-45' : 'top-1')} />
      <span className={cn(bar, open ? 'top-[7px] rotate-45' : 'top-2.5')} />
    </span>
  )
  const base = 'focus-visible:ring-ring/50 flex h-9 min-w-0 touch-manipulation items-center rounded-md outline-none focus-visible:ring-2'
  const shared = { type: 'button' as const, 'aria-expanded': open, 'aria-controls': controls, onClick }

  if (variant === 'icon') {
    return (
      <button {...shared} aria-label={label} className={cn(base, 'hover:bg-accent size-9 justify-center', className)}>
        {bars}
      </button>
    )
  }
  if (variant === 'switcher') {
    return (
      <button {...shared} className={cn(base, 'hover:bg-accent max-w-full gap-2 px-1.5 text-[15px] font-semibold', className)}>
        {mark}
        <span className="min-w-0 truncate">{label}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={2}
          className={cn('text-muted-foreground size-4 shrink-0 transition-transform duration-150', open && 'rotate-180')}
        />
        <span className="sr-only">, switch module and menu</span>
      </button>
    )
  }
  return (
    <button {...shared} className={cn(base, 'gap-2.5 px-1.5 text-[15px] font-medium', className)}>
      {bars}
      {label}
    </button>
  )
}

// The modules (workspaces, teams) as tiles, two to a row, at the top of the
// menu screen when its button is the switcher. The current one is marked.
export function MobileMenuTiles({ items }: {
  items: { id: string; label: string; mark: ReactNode; detail?: string; current?: boolean; onClick: () => void }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-current={item.current ? 'page' : undefined}
          className="bg-card hover:bg-accent focus-visible:ring-ring/50 aria-[current=page]:border-brand/60 aria-[current=page]:bg-brand/5 flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3 text-left outline-none focus-visible:ring-2"
        >
          {item.mark}
          <span className="grid w-full min-w-0 gap-0.5">
            <span className="truncate text-[13px] font-medium">{item.label}</span>
            {item.detail && <span className="text-muted-foreground truncate text-[11px] tabular-nums">{item.detail}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

// The module switcher, in five designs. Each takes the same items:
//   tiles     two cards to a row, mark above name and detail (MobileMenuTiles)
//   launcher  a home screen's grid: four marks to a row, name under each
//             (MobileMenuLauncher)
//   list      one row per module: mark, name, detail, a tick on the current
//             one (MobileMenuModuleList)
//   sheet     a bottom sheet of those rows, opened from the top bar's module
//             name, so the menu stays for pages (MobileModuleSheet)
//   strip     chips in a row that scrolls sideways under the top bar, always
//             in view, one tap to switch (MobileModuleStrip)
// The first three lead the menu screen; the last two live outside it.
export type MobileSwitcherStyle = 'tiles' | 'launcher' | 'list' | 'sheet' | 'strip'
export type MobileSwitcherItem = { id: string; label: string; mark: ReactNode; detail?: string; current?: boolean; onClick: () => void }

export function MobileMenuLauncher({ items }: { items: MobileSwitcherItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-current={item.current ? 'page' : undefined}
          className="focus-visible:ring-ring/50 group flex min-w-0 flex-col items-center gap-1.5 rounded-lg p-1 text-center outline-none focus-visible:ring-2"
        >
          <span className="group-aria-[current=page]:ring-brand ring-offset-background rounded-xl ring-2 ring-transparent ring-offset-2 transition-shadow [&>*]:size-12 [&>*]:rounded-xl">
            {item.mark}
          </span>
          <span className="group-aria-[current=page]:text-brand line-clamp-2 w-full text-[11px] leading-tight font-medium break-words">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export function MobileMenuModuleList({ items }: { items: MobileSwitcherItem[] }) {
  return (
    <div className="bg-card divide-y rounded-xl border">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          aria-current={item.current ? 'page' : undefined}
          className="hover:bg-accent focus-visible:bg-accent flex min-h-12 w-full min-w-0 items-center gap-3 px-3 py-2 text-left outline-none first:rounded-t-xl last:rounded-b-xl"
        >
          <span className="shrink-0">{item.mark}</span>
          <span className="grid min-w-0 flex-1">
            <span className={cn('truncate text-[15px] font-medium', item.current && 'text-brand')}>{item.label}</span>
            {item.detail && <span className="text-muted-foreground truncate text-xs tabular-nums">{item.detail}</span>}
          </span>
          {item.current && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-brand size-4 shrink-0" />}
        </button>
      ))}
    </div>
  )
}

// The module switcher as a bottom sheet; choosing a module closes it.
export function MobileModuleSheet({ open, onOpenChange, title = 'Switch module', items, container }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  items: MobileSwitcherItem[]
  container?: HTMLElement | null
}) {
  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title} description="Choose where to work." container={container}>
      <div className="px-4 pt-1">
        <MobileMenuModuleList items={items.map((i) => ({ ...i, onClick: () => { onOpenChange(false); i.onClick() } }))} />
      </div>
    </MobileSheet>
  )
}

// The module switcher as a strip of chips under the top bar. Scrolls
// sideways; the current chip is filled and scrolled into view.
export function MobileModuleStrip({ items, label = 'Modules', className }: { items: MobileSwitcherItem[]; label?: string; className?: string }) {
  const current = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    current.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])
  return (
    <nav aria-label={label} className={cn('border-b', className)}>
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none]">
        {items.map((item) => (
          <button
            key={item.id}
            ref={item.current ? current : undefined}
            type="button"
            onClick={item.onClick}
            aria-current={item.current ? 'page' : undefined}
            className="hover:bg-accent focus-visible:ring-ring/50 aria-[current=page]:bg-foreground aria-[current=page]:text-background aria-[current=page]:border-foreground flex h-8 shrink-0 touch-manipulation items-center gap-1.5 rounded-full border pr-3 pl-1 text-xs font-medium outline-none focus-visible:ring-2 [&>span:first-child>*]:size-5 [&>span:first-child>*]:rounded-full"
          >
            <span className="shrink-0">{item.mark}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

// The menu screen: every destination, under small headings, in big type on
// a blurred page that fills the screen under the top bar (MobileShell's
// `menu`). Focus moves into it; Escape closes it and returns to its button.
//
// How it opens (`effect`):
//   fade     the page blurs and the menu fades in (the default)
//   curtain  drops down from under the top bar, solid
//   rise     rises from the foot of the screen, solid
//   cascade  fades in, then each group rises in after the one before
//   drawer   a panel from the left edge over a dimmed page; a tap on the
//            page closes it
export type MobileMenuEffect = 'fade' | 'curtain' | 'rise' | 'cascade' | 'drawer'

const MENU_EFFECT: Record<Exclude<MobileMenuEffect, 'drawer'>, string> = {
  fade: 'bg-background/90 animate-in fade-in-0 backdrop-blur duration-100',
  curtain: 'bg-background animate-in fade-in-0 slide-in-from-top-8 duration-200 ease-out',
  rise: 'bg-background animate-in fade-in-0 slide-in-from-bottom-8 duration-200 ease-out',
  cascade: 'menu-cascade bg-background/90 animate-in fade-in-0 backdrop-blur duration-100',
}

export function MobileMenu({ id, label = 'Menu', onClose, effect = 'fade', children, className }: {
  id: string
  label?: string
  onClose: () => void
  effect?: MobileMenuEffect
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('a[href], button:not([disabled]):not([tabindex="-1"])')?.focus()
  }, [])
  // Escape from anywhere, the menu's button included. It is marked handled,
  // so nothing else listening for Escape acts on it too.
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      close.current()
      document.querySelector<HTMLElement>(`[aria-controls="${id}"]`)?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [id])
  if (effect === 'drawer') {
    return (
      <nav ref={ref} id={id} aria-label={label} className="absolute inset-0 z-30">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={onClose}
          className="bg-foreground/30 animate-in fade-in-0 absolute inset-0 backdrop-blur-[2px] duration-150"
        />
        <div
          className={cn(
            'bg-background animate-in slide-in-from-left absolute inset-y-0 left-0 w-[85%] max-w-80 overflow-y-auto overscroll-contain border-r shadow-xl duration-200 ease-out [scrollbar-width:none]',
            className,
          )}
        >
          <div className="flex flex-col gap-8 px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">{children}</div>
        </div>
      </nav>
    )
  }
  return (
    <nav
      ref={ref}
      id={id}
      aria-label={label}
      className={cn(
        'absolute inset-0 z-30 overflow-y-auto overscroll-contain [scrollbar-width:none]',
        MENU_EFFECT[effect],
        className,
      )}
    >
      <div className="flex flex-col gap-10 px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">{children}</div>
    </nav>
  )
}

// One group of the menu screen, under a small heading.
export function MobileMenuSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-muted-foreground text-sm font-medium">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

// One destination on the menu screen, in big type. `current` marks the
// screen you are on; `count`, how many wait there (unread, to approve).
export function MobileMenuLink({ onClick, current, count, children }: {
  onClick: () => void
  current?: boolean
  count?: number
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className="focus-visible:decoration-ring flex min-w-0 items-baseline gap-2 text-left text-2xl font-medium tracking-tight outline-none focus-visible:underline focus-visible:underline-offset-4 aria-[current=page]:text-brand"
    >
      <span className="min-w-0 truncate">{children}</span>
      {!!count && <span className="text-muted-foreground text-sm font-normal tabular-nums">{count}</span>}
    </button>
  )
}

// The top bar. A tab's first screen shows its title on the left (`large`
// for a big one) or anything in its place (a company switcher); a pushed
// screen shows a back arrow named after the screen under it, and the title
// in the middle. `titleHidden` hides that middle title while the page's own
// big heading is still in view (the large-title pattern).
export function MobileTopBar({ title, back, actions, large, titleHidden, className }: {
  title: ReactNode
  back?: { label: string; onClick: () => void }
  actions?: ReactNode
  large?: boolean
  titleHidden?: boolean
  className?: string
}) {
  return (
    <header className={cn('bg-background flex h-12 shrink-0 items-center gap-1 px-2 pt-[env(safe-area-inset-top)] box-content', className)}>
      {back ? (
        <>
          <div className="flex w-[34%] min-w-0">
            <Button variant="ghost" className="text-brand h-9 max-w-full justify-start gap-0.5 px-1" onClick={back.onClick}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-5" />
              <span className="truncate text-[13px]">{back.label}</span>
            </Button>
          </div>
          <h1
            aria-hidden={titleHidden || undefined}
            className={cn('min-w-0 flex-1 truncate text-center text-[13px] font-semibold transition-opacity', titleHidden && 'opacity-0')}
          >
            {title}
          </h1>
          <div className="flex w-[34%] min-w-0 items-center justify-end">{actions}</div>
        </>
      ) : (
        <>
          <div className={cn('min-w-0 flex-1 px-2', large ? 'truncate text-xl font-semibold tracking-tight' : 'text-[13px] font-semibold')}>
            {typeof title === 'string' ? <h1 className="truncate">{title}</h1> : title}
          </div>
          <div className="flex shrink-0 items-center justify-end">{actions}</div>
        </>
      )}
    </header>
  )
}

// An icon button sized for a thumb, for the top bar.
export function MobileTopAction({ label, icon, onClick, dot, pressed }: {
  label: string
  icon: IconSvgElement
  onClick: () => void
  // A small dot on the icon: something is set (a filter) or new.
  dot?: boolean
  pressed?: boolean
}) {
  return (
    <Button variant="ghost" size="icon" className="relative size-9" aria-label={label} aria-pressed={pressed} onClick={onClick}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4.5" />
      {dot && <span aria-hidden className="bg-brand absolute top-1.5 right-1.5 size-1.5 rounded-full" />}
    </Button>
  )
}

// The signed-in person's avatar for the top bar's right end: it opens their
// account (profile, settings, theme, sign out). `pressed` while that is open.
export function MobileAccountButton({ name, onClick, pressed, label = 'Account' }: {
  name: string
  onClick: () => void
  pressed?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${name}`}
      aria-pressed={pressed}
      onClick={onClick}
      className="focus-visible:ring-ring/50 grid size-9 shrink-0 touch-manipulation place-items-center rounded-full outline-none focus-visible:ring-2"
    >
      <UserAvatar name={name} className={cn('size-7 transition-shadow', pressed && 'ring-brand ring-offset-background ring-2 ring-offset-2')} />
    </button>
  )
}

// The tab bar: three to five tabs, each a 20px icon over a short label. With
// `centre`, a round button for the main action sits in the middle.
export function MobileTabBar({ tabs, current, onSelect, centre, className }: {
  tabs: MobileTab[]
  current: string | null
  onSelect: (id: string) => void
  centre?: { label: string; icon?: IconSvgElement; onClick: () => void }
  className?: string
}) {
  const middle = Math.ceil(tabs.length / 2)
  const tab = (t: MobileTab) => <TabButton key={t.id} tab={t} current={current === t.id} onClick={() => onSelect(t.id)} />
  return (
    <nav aria-label="Tabs" className={cn('bg-background flex shrink-0 items-stretch border-t pb-[env(safe-area-inset-bottom)]', className)}>
      {centre ? (
        <>
          {tabs.slice(0, middle).map(tab)}
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <Button aria-label={centre.label} onClick={centre.onClick} className="size-10 rounded-full">
              <HugeiconsIcon icon={centre.icon ?? Add01Icon} strokeWidth={2} className="size-5" />
            </Button>
          </div>
          {tabs.slice(middle).map(tab)}
        </>
      ) : tabs.map(tab)}
    </nav>
  )
}

// A tab's icon with its count, filled in while it is the current tab.
function TabIcon({ tab, current }: { tab: MobileTab; current: boolean }) {
  const badge = tab.badge ?? 0
  return (
    <span className="relative">
      <HugeiconsIcon icon={tab.icon} strokeWidth={current ? 2 : 1.5} className="size-5" />
      {badge > 0 && (
        <span aria-hidden className="bg-brand text-primary-foreground absolute -top-1 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] tabular-nums">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </span>
  )
}

// The floating tab bar, working as iOS 26's does: a capsule over the
// content with the current tab marked, and search (or another action) as a
// round button beside it. While the screen scrolls down it shrinks to the
// current tab alone, which brings the rest back when tapped (MobileShell's
// `floatingBar` says when). Solid, in the kit's card style: the behaviour
// is iOS 26's, not its translucent look.
const SURFACE = 'bg-card border shadow-lg'

export function MobileFloatingTabBar({ tabs, current, onSelect, search, minimized, onExpand }: {
  tabs: MobileTab[]
  current: string | null
  onSelect: (id: string) => void
  // The round button beside the capsule.
  search?: { label: string; icon: IconSvgElement; onClick: () => void }
  minimized?: boolean
  onExpand?: () => void
}) {
  const shown = tabs.find((t) => t.id === current) ?? tabs[0]
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end gap-2 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <nav
        aria-label="Tabs"
        className={cn(SURFACE, 'pointer-events-auto flex min-w-0 items-stretch rounded-full p-1', minimized ? 'animate-in zoom-in-95 flex-none' : 'flex-1')}
      >
        {minimized ? (
          <button
            type="button"
            aria-label={`${shown.label}. Show all tabs`}
            onClick={onExpand}
            className="focus-visible:ring-ring/50 text-brand bg-foreground/10 grid size-12 place-items-center rounded-full outline-none focus-visible:ring-2"
          >
            <TabIcon tab={shown} current />
          </button>
        ) : tabs.map((t) => {
          const isCurrent = current === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-current={isCurrent ? 'page' : undefined}
              onClick={() => onSelect(t.id)}
              className={cn(
                'focus-visible:ring-ring/50 flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[10px] font-medium outline-none transition-colors focus-visible:ring-2',
                isCurrent ? 'bg-foreground/10 text-brand' : 'text-foreground/80',
              )}
            >
              <TabIcon tab={t} current={isCurrent} />
              <span className="max-w-full truncate">{t.label}</span>
              {!!t.badge && <span className="sr-only">, {plural(t.badge, 'new item')}</span>}
            </button>
          )
        })}
      </nav>
      {search && (
        <button
          type="button"
          aria-label={search.label}
          onClick={search.onClick}
          className={cn(SURFACE, 'focus-visible:ring-ring/50 pointer-events-auto ml-auto grid size-14 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2')}
        >
          <HugeiconsIcon icon={search.icon} strokeWidth={2} className="size-5" />
        </button>
      )}
    </div>
  )
}

function TabButton({ tab, current, onClick }: { tab: MobileTab; current: boolean; onClick: () => void }) {
  const badge = tab.badge ?? 0
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'focus-visible:bg-accent flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-[10px] font-medium outline-none',
        current ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <TabIcon tab={tab} current={current} />
      <span className="max-w-full truncate">{tab.label}</span>
      {badge > 0 && <span className="sr-only">, {plural(badge, 'new item')}</span>}
    </button>
  )
}

// The floating action button: the screen's main action, bottom right.
export function MobileFab({ label, icon = Add01Icon, onClick, className }: {
  label: string
  icon?: IconSvgElement
  onClick: () => void
  className?: string
}) {
  return (
    <Button aria-label={label} onClick={onClick} className={cn('pointer-events-auto absolute right-4 bottom-4 z-10 size-12 rounded-full shadow-lg', className)}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
    </Button>
  )
}

// A bottom sheet: rises from the foot of the screen, with a grab handle.
// `container` keeps it inside a framed screen (a phone preview).
export function MobileSheet({ open, onOpenChange, title, description, showDescription, container, children, className }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  // Read out by screen readers; shown too with `showDescription`.
  description: string
  showDescription?: boolean
  container?: HTMLElement | null
  children: ReactNode
  className?: string
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        container={container}
        showCloseButton={false}
        className={cn('max-h-[85%] gap-0 rounded-t-2xl pb-[max(env(safe-area-inset-bottom),1.25rem)]', className)}
      >
        <span aria-hidden className="bg-muted-foreground/30 mx-auto mt-2 mb-1 h-1 w-9 shrink-0 rounded-full" />
        <div className="grid gap-1 px-4 py-2">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className={cn(!showDescription && 'sr-only')}>{description}</SheetDescription>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

// One choice in a bottom sheet's list: a visual, its name, a tick when chosen.
export function MobileOption({ visual, label, selected, onClick }: {
  visual?: ReactNode
  label: string
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="hover:bg-accent focus-visible:bg-accent mx-2 flex h-11 w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-2 text-left text-[13px] outline-none"
    >
      {visual && <span className="flex size-4 shrink-0 items-center justify-center">{visual}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="text-brand size-4" />}
    </button>
  )
}

// Views or filters as chips in a row that scrolls sideways, where tabs would
// not fit. Extra chips (an active filter) go in `children`.
export function MobileChips({ label, items, value, onChange, children, className }: {
  label: string
  items: { id: string; label: string; count?: number }[]
  value: string
  onChange: (id: string) => void
  children?: ReactNode
  className?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]', className)}>
      {items.map((item) => (
        <MobileChip key={item.id} pressed={value === item.id} onClick={() => onChange(item.id)}>
          {item.label}
          {item.count !== undefined && <span className="tabular-nums opacity-60">{item.count}</span>}
        </MobileChip>
      ))}
      {children}
    </div>
  )
}

export function MobileChip({ pressed, onClick, children, label, className }: {
  pressed?: boolean
  onClick: () => void
  children: ReactNode
  // When the chip's text does not say what it does ("Assigned to me ×").
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'focus-visible:ring-ring/50 flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap outline-none focus-visible:ring-2',
        pressed ? 'bg-foreground text-background border-transparent' : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

// A list row as a card, where a table's columns do not fit: a small line
// over the title (a number, a status icon), something on its right (a status
// badge), the title, and a line of details with something at its end (an
// amount).
export function MobileCard({ overline, aside, title, meta, metaEnd, onClick, active, className }: {
  overline?: ReactNode
  aside?: ReactNode
  title: ReactNode
  meta?: ReactNode
  metaEnd?: ReactNode
  onClick: () => void
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        'bg-card hover:bg-accent focus-visible:ring-ring/50 aria-[current]:border-brand/50 grid w-full min-w-0 gap-1.5 rounded-xl border p-3 text-left outline-none focus-visible:ring-2',
        className,
      )}
    >
      {(overline || aside) && (
        <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">{overline}</span>
          {aside && <span className="shrink-0">{aside}</span>}
        </span>
      )}
      <span className="line-clamp-2 text-[13px] font-medium">{title}</span>
      {(meta || metaEnd) && (
        <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-[11px]">
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{meta}</span>
          {metaEnd && <span className="text-foreground shrink-0 tabular-nums">{metaEnd}</span>}
        </span>
      )}
    </button>
  )
}

// Settings and menus as grouped rows on a card, under a small heading.
export function MobileGroup({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('grid gap-1.5', className)}>
      {title && <h2 className="text-muted-foreground px-1 text-[11px] font-medium">{title}</h2>}
      <div className="bg-card divide-y rounded-xl border">{children}</div>
    </section>
  )
}

// One row of a group: an icon, a label, a detail on the right, and a chevron
// when it opens another screen. A button with `onClick`, plain text without.
export function MobileRow({ icon, visual, label, detail, chevron, onClick, children, className }: {
  icon?: IconSvgElement
  // In place of the icon: a mark, an avatar.
  visual?: ReactNode
  label: ReactNode
  detail?: ReactNode
  chevron?: boolean
  onClick?: () => void
  // Under the row's line, such as a toggle group.
  children?: ReactNode
  className?: string
}) {
  const line = (
    <>
      {visual ?? (icon && <HugeiconsIcon icon={icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />)}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {detail && <span className="text-muted-foreground max-w-[50%] shrink-0 truncate text-xs">{detail}</span>}
      {chevron && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="text-muted-foreground size-4 shrink-0" />}
    </>
  )
  const rowClass = 'flex min-h-11 w-full min-w-0 items-center gap-3 px-3 py-1.5 text-left text-[13px] first:rounded-t-xl last:rounded-b-xl'
  if (children) {
    return (
      <div className={cn('grid gap-2 py-1', className)}>
        <div className={cn(rowClass, 'min-h-9 py-0')}>{line}</div>
        <div className="px-3 pb-2">{children}</div>
      </div>
    )
  }
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(rowClass, 'hover:bg-accent focus-visible:bg-accent outline-none', className)}>{line}</button>
  ) : (
    <div className={cn(rowClass, className)}>{line}</div>
  )
}
