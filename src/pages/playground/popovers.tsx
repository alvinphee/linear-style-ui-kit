import { useState, type MouseEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon, Calendar03Icon, InformationCircleIcon, Link01Icon, Share08Icon, TextBoldIcon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Mention } from '@/components/mention'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
} from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str } from './Playground'

/* Tooltip */

function TooltipPreview({ side, align, label, shortcut, open }: {
  side: Side
  align: Align
  label: string
  shortcut: boolean
  open: boolean
}) {
  // Always controlled, so the Open switch can pin it without a controlled/uncontrolled flip.
  const [hovered, setHovered] = useState(false)
  return (
    <Tooltip open={open || hovered} onOpenChange={setHovered}>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label={label}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {label}
        {shortcut && <Kbd>C</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

function TooltipDemos() {
  return (
    <>
      <Playground
        title="Tooltip"
        description="Needs a TooltipProvider near the app root"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'top' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'Create issue' },
          { kind: 'switch', name: 'shortcut', label: 'Shortcut', initial: true },
          { kind: 'switch', name: 'open', label: 'Open', initial: true },
        ]}
        render={(v) => (
          <TooltipPreview
            side={str(v, 'side') as Side}
            align={str(v, 'align') as Align}
            label={str(v, 'label') || 'Create issue'}
            shortcut={bool(v, 'shortcut')}
            open={bool(v, 'open')}
          />
        )}
        code={(v) => {
          const shortcut = bool(v, 'shortcut')
          const label = str(v, 'label') || 'Create issue'
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Add01Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/kbd': shortcut ? ['Kbd'] : [],
            '@/components/ui/tooltip': ['Tooltip', 'TooltipContent', 'TooltipTrigger'],
          })
          const body = jsx('Tooltip', { open: bool(v, 'open') }, [
            jsx('TooltipTrigger', { asChild: true }, jsx('Button', { variant: 'outline', size: 'icon', 'aria-label': label }, ICON('Add01Icon'))),
            jsx('TooltipContent', {
              side: unless(str(v, 'side'), 'top'),
              align: unless(str(v, 'align'), 'center'),
            }, shortcut ? [label, '<Kbd>C</Kbd>'] : label),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Tooltip placement"
        note="side × align · hover or focus a button"
        rows={{ name: 'side', values: SIDES }}
        cols={{ name: 'align', values: ALIGNS }}
        render={(side, align) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">Hover</Button>
            </TooltipTrigger>
            <TooltipContent side={side} align={align}>{side} · {align}</TooltipContent>
          </Tooltip>
        )}
      />

      <Gallery
        title="Tooltip content"
        note="Hover or focus each trigger"
        items={[
          {
            label: 'text',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" />
                    Copy link
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copies a link to this issue</TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'KbdGroup',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="Bold">
                    <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Bold
                  <KbdGroup>
                    <Kbd>Ctrl</Kbd>
                    <Kbd>B</Kbd>
                  </KbdGroup>
                </TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'long text',
            node: (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="About estimates" className="text-muted-foreground">
                    <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Estimates are points, not hours. Each team picks its own scale in settings.</TooltipContent>
              </Tooltip>
            ),
          },
          {
            label: 'disabled trigger',
            node: (
              <Tooltip>
                {/* A disabled button gets no pointer events, so a focusable span takes the hover. */}
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="focus-visible:ring-ring/30 inline-flex rounded-md outline-none focus-visible:ring-2">
                    <Button size="sm" disabled>Merge</Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Waiting for one more review</TooltipContent>
              </Tooltip>
            ),
          },
        ]}
      />
    </>
  )
}

/* Popover */

function PopoverDemos() {
  return (
    <>
      <Playground
        title="Popover"
        description="Click the trigger, then change side and align"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'bottom' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'switch', name: 'header', label: 'Header', initial: true },
        ]}
        render={(v) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={Share08Icon} strokeWidth={2} data-icon="inline-start" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent side={str(v, 'side') as Side} align={str(v, 'align') as Align}>
              {bool(v, 'header') && (
                <PopoverHeader>
                  <PopoverTitle>Share project</PopoverTitle>
                  <PopoverDescription>Anyone in the workspace with the link can view it.</PopoverDescription>
                </PopoverHeader>
              )}
              <div className="flex gap-2">
                <Input aria-label="Project link" value="https://example.com/p/website" readOnly className="min-w-0 flex-1" />
                <Button onClick={() => toast('Link copied', { description: 'Demo only.' })}>Copy</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
        code={(v) => {
          const header = bool(v, 'header')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Share08Icon'],
            '@/components/ui/button': ['Button'],
            '@/components/ui/input': ['Input'],
            '@/components/ui/popover': pick(
              'Popover', 'PopoverContent', header && 'PopoverDescription', header && 'PopoverHeader',
              header && 'PopoverTitle', 'PopoverTrigger',
            ),
          })
          const body = jsx('Popover', {}, [
            jsx('PopoverTrigger', { asChild: true }, jsx('Button', { variant: 'outline' }, [ICON('Share08Icon', 'inline-start'), 'Share'])),
            jsx('PopoverContent', {
              side: unless(str(v, 'side'), 'bottom'),
              align: unless(str(v, 'align'), 'center'),
            }, [
              header ? jsx('PopoverHeader', {}, [
                '<PopoverTitle>Share project</PopoverTitle>',
                '<PopoverDescription>Anyone in the workspace with the link can view it.</PopoverDescription>',
              ]) : '',
              jsx('div', { className: 'flex gap-2' }, [
                '<Input aria-label="Project link" value="https://example.com/p/website" readOnly className="min-w-0 flex-1" />',
                '<Button>Copy</Button>',
              ]),
            ]),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Popover placement"
        note="side × align · click a button"
        rows={{ name: 'side', values: SIDES }}
        cols={{ name: 'align', values: ALIGNS }}
        render={(side, align) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Open</Button>
            </PopoverTrigger>
            <PopoverContent side={side} align={align} className="w-44">
              <PopoverHeader>
                <PopoverTitle>{side} · {align}</PopoverTitle>
                <PopoverDescription>Flips when it runs out of room.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        )}
      />
    </>
  )
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const

const ALIGNS = ['start', 'center', 'end'] as const

const OPEN_DELAYS = ['0', '150', '300', '700'] as const

type Side = (typeof SIDES)[number]

type Align = (typeof ALIGNS)[number]

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

const pick = (...names: (string | false)[]) => names.filter((n): n is string => Boolean(n))

const ICON = (name: string, inline?: 'inline-start' | 'inline-end') =>
  `<HugeiconsIcon icon={${name}} strokeWidth={2}${inline ? ` data-icon="${inline}"` : ''} />`

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

/* Hover card */

function Profile() {
  return (
    <div className="flex gap-3">
      <Avatar>
        <AvatarFallback className="text-xs font-medium">AM</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 gap-0.5">
        <p className="text-[13px] font-medium">Alex Morgan</p>
        <p className="text-muted-foreground">Product designer · Design team</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]">
          <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
          Joined March 2024
        </p>
      </div>
    </div>
  )
}

function HoverCardDemos() {
  return (
    <>
      <Playground
        title="Hover card"
        description="Hover or tab to the mention"
        controls={[
          { kind: 'select', name: 'side', label: 'Side', options: SIDES, initial: 'bottom' },
          { kind: 'select', name: 'align', label: 'Align', options: ALIGNS, initial: 'center' },
          { kind: 'select', name: 'openDelay', label: 'Open delay (ms)', options: OPEN_DELAYS, initial: '700' },
        ]}
        render={(v) => (
          <p className="text-xs/relaxed">
            Assigned to{' '}
            <HoverCard openDelay={Number(str(v, 'openDelay'))}>
              <HoverCardTrigger asChild>
                <Mention href="#" onClick={stay}>@alex</Mention>
              </HoverCardTrigger>
              <HoverCardContent side={str(v, 'side') as Side} align={str(v, 'align') as Align}>
                <Profile />
              </HoverCardContent>
            </HoverCard>{' '}
            two days ago
          </p>
        )}
        code={(v) => {
          const delay = unless(str(v, 'openDelay'), '700')
          const head = imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['Calendar03Icon'],
            '@/components/mention': ['Mention'],
            '@/components/ui/avatar': ['Avatar', 'AvatarFallback'],
            '@/components/ui/hover-card': ['HoverCard', 'HoverCardContent', 'HoverCardTrigger'],
          })
          const body = jsx('HoverCard', { openDelay: delay === undefined ? undefined : Number(delay) }, [
            jsx('HoverCardTrigger', { asChild: true }, '<Mention href="/people/alex">@alex</Mention>'),
            jsx('HoverCardContent', {
              side: unless(str(v, 'side'), 'bottom'),
              align: unless(str(v, 'align'), 'center'),
            }, jsx('div', { className: 'flex gap-3' }, [
              jsx('Avatar', {}, '<AvatarFallback>AM</AvatarFallback>'),
              jsx('div', { className: 'grid min-w-0 gap-0.5' }, [
                '<p className="text-[13px] font-medium">Alex Morgan</p>',
                '<p className="text-muted-foreground">Product designer · Design team</p>',
                jsx('p', { className: 'text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]' }, [
                  '<HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />',
                  'Joined March 2024',
                ]),
              ]),
            ])),
          ])
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Hover card sides"
        note="side · hover a mention"
        rows={{ name: 'side', values: SIDES }}
        render={(side) => (
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <Mention href="#" onClick={stay}>@alex</Mention>
            </HoverCardTrigger>
            <HoverCardContent side={side} className="w-64">
              <Profile />
            </HoverCardContent>
          </HoverCard>
        )}
      />
    </>
  )
}

export default function PopoversDemos() {
  return (
    <Demos>
      <TooltipDemos />

      <PopoverDemos />

      <HoverCardDemos />
    </Demos>
  )
}
