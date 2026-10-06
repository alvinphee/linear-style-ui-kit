import { type ReactNode } from 'react'
import { cn } from 'cn'
import { GANTT_LABEL, GanttBar } from '@/components/gantt-bar'
import { MilestoneMarker } from '@/components/milestone-marker'
import { TimeMarker, type TimeMarkerTone } from '@/components/time-marker'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, unless, type Values } from './Playground'

/* ---------- Gantt chart parts ---------- */

// Fixed like label colours, so an item reads the same in every theme.
const ITEM_COLOURS = {
  violet: 'oklch(0.6 0.17 300)',
  blue: 'oklch(0.62 0.15 250)',
  teal: 'oklch(0.7 0.12 215)',
  green: 'oklch(0.68 0.14 155)',
  amber: 'oklch(0.74 0.15 70)',
  red: 'oklch(0.65 0.18 10)',
} as const

type ItemColour = keyof typeof ITEM_COLOURS

const ITEM_COLOUR_NAMES = Object.keys(ITEM_COLOURS) as ItemColour[]

const itemColourOf = (v: Values) => ITEM_COLOURS[str(v, 'colour') as ItemColour]

const GANTT_PROGRESS = ['0', '18', '62', '100'] as const

const GANTT_WIDTHS = ['120', '200', '320'] as const

const MARKER_SIZES = ['default', 'sm'] as const

const MARKER_TONES = ['brand', 'destructive'] as const

function GanttBarDemos() {
  return (
    <>
      <Playground
        title="GanttBar"
        description="One item on a Gantt chart. The chart places it; here it takes the width you give it."
        controls={[
          { kind: 'text', name: 'label', label: 'Label', initial: 'Usage-based billing' },
          { kind: 'select', name: 'colour', label: 'Colour', options: ITEM_COLOUR_NAMES, initial: 'violet' },
          { kind: 'select', name: 'progress', label: 'Progress (%)', options: GANTT_PROGRESS, initial: '62' },
          { kind: 'select', name: 'width', label: 'Width (px)', options: GANTT_WIDTHS, initial: '320' },
          { kind: 'switch', name: 'showProgress', label: 'Show progress', initial: true },
        ]}
        render={(v) => (
          <GanttBar
            colour={itemColourOf(v)}
            progress={Number(str(v, 'progress'))}
            label={str(v, 'label') || undefined}
            showProgress={bool(v, 'showProgress')}
            aria-label={`${str(v, 'label') || 'Item'}: ${str(v, 'progress')}% complete`}
            style={{ width: Number(str(v, 'width')) }}
          />
        )}
        code={(v) => {
          const body = jsx('GanttBar', {
            colour: itemColourOf(v),
            progress: str(v, 'progress') === '0' ? undefined : Number(str(v, 'progress')),
            label: str(v, 'label') || undefined,
            showProgress: bool(v, 'showProgress'),
            'aria-label': `${str(v, 'label') || 'Item'}: ${str(v, 'progress')}% complete`,
            style: `{{ width: ${str(v, 'width')} }}`,
          })
          return `${imports({ '@/components/gantt-bar': ['GanttBar'] })}\n\n${body}`
        }}
      />

      <Variants
        title="GanttBar progress"
        note="progress × colour"
        rows={{ name: 'progress', values: GANTT_PROGRESS }}
        cols={{ name: 'colour', values: ['violet', 'teal', 'amber'] as const }}
        render={(progress, colour = 'violet') => (
          <GanttBar colour={ITEM_COLOURS[colour]} progress={Number(progress)} label="Mobile app" showProgress className="w-44" />
        )}
      />

      <Gallery
        title="GanttBar in use"
        note="inset keeps the text clear of a milestone"
        items={[
          {
            label: 'a milestone on its last day (inset end)',
            node: (
              <div className="relative">
                <GanttBar colour={ITEM_COLOURS.blue} progress={100} label="New onboarding" showProgress inset={{ end: 20 }} className="w-56" />
                <MilestoneMarker colour={ITEM_COLOURS.blue} className="absolute top-1/2 left-[213px] -translate-x-1/2 -translate-y-1/2" />
              </div>
            ),
          },
          {
            label: 'too short: the name beside it',
            node: (
              <div className="flex items-center gap-1.5">
                <GanttBar colour={ITEM_COLOURS.red} progress={40} aria-label="Audit log: 40% complete" className="w-14" />
                <span className={cn(GANTT_LABEL, 'text-muted-foreground')}>Audit log</span>
              </div>
            ),
          },
          {
            label: 'no room at all: cut short',
            node: <GanttBar colour={ITEM_COLOURS.green} progress={18} label="Design system 2.0" className="w-24" />,
          },
        ]}
      />
    </>
  )
}

function MilestoneDemos() {
  return (
    <>
      <Playground
        title="MilestoneMarker"
        description="A key date, as a diamond. Decorative: put it in a labelled button to make it interactive."
        controls={[
          { kind: 'select', name: 'colour', label: 'Colour', options: ['muted', ...ITEM_COLOUR_NAMES], initial: 'violet' },
          { kind: 'select', name: 'size', label: 'Size', options: MARKER_SIZES, initial: 'default' },
        ]}
        render={(v) => (
          <MilestoneMarker
            colour={str(v, 'colour') === 'muted' ? undefined : itemColourOf(v)}
            size={str(v, 'size') as (typeof MARKER_SIZES)[number]}
          />
        )}
        code={(v) => {
          const body = jsx('MilestoneMarker', {
            colour: str(v, 'colour') === 'muted' ? undefined : itemColourOf(v),
            size: unless(str(v, 'size'), 'default'),
          })
          return `${imports({ '@/components/milestone-marker': ['MilestoneMarker'] })}\n\n${body}`
        }}
      />

      <Gallery
        title="MilestoneMarker in use"
        items={[
          {
            label: 'on a bar, with a tooltip',
            node: (
              <div className="relative">
                <GanttBar colour={ITEM_COLOURS.teal} progress={34} label="Mobile app" aria-label="Mobile app: 34% complete" className="w-56" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Milestone: Internal beta, 16 Oct"
                      className="focus-visible:ring-ring/50 absolute top-1/2 left-36 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-sm outline-none focus-visible:ring-2"
                    >
                      <MilestoneMarker colour={ITEM_COLOURS.teal} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Internal beta · 16 Oct</TooltipContent>
                </Tooltip>
              </div>
            ),
          },
          {
            label: 'in a legend (sm)',
            node: (
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <MilestoneMarker size="sm" />
                Milestone
              </span>
            ),
          },
        ]}
      />
    </>
  )
}

// A small timeline for the marker to stand on: a few days and two bars.
function MiniTimeline({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card relative h-28 w-72 overflow-hidden rounded-lg border">
      {[48, 96, 144, 192, 240].map((x) => (
        <div key={x} aria-hidden className="absolute top-0 bottom-0 border-l border-dashed" style={{ left: x }} />
      ))}
      <GanttBar colour={ITEM_COLOURS.violet} progress={62} aria-label="Usage-based billing: 62% complete" className="absolute top-8 left-4 w-48" />
      <GanttBar colour={ITEM_COLOURS.amber} aria-label="Search API: 0% complete" className="absolute top-16 left-28 w-40" />
      {children}
    </div>
  )
}

function TimeMarkerDemos() {
  return (
    <>
      <Playground
        title="TimeMarker"
        description="Today or now on a timeline: a line with its label at the top. Place it with style; it centres on that point."
        controls={[
          { kind: 'text', name: 'label', label: 'Label', initial: 'Today' },
          { kind: 'select', name: 'tone', label: 'Tone', options: MARKER_TONES, initial: 'brand' },
          { kind: 'switch', name: 'description', label: 'Spoken description', initial: true },
        ]}
        render={(v) => (
          <MiniTimeline>
            <TimeMarker
              label={str(v, 'label') || undefined}
              tone={str(v, 'tone') as TimeMarkerTone}
              description={bool(v, 'description') ? `${str(v, 'label') || 'Today'}, 30 Sep` : undefined}
              className="top-1.5 bottom-0"
              style={{ left: 120 }}
            />
          </MiniTimeline>
        )}
        code={(v) => {
          const body = jsx('TimeMarker', {
            label: str(v, 'label') || undefined,
            tone: unless(str(v, 'tone'), 'brand'),
            description: bool(v, 'description') ? `${str(v, 'label') || 'Today'}, 30 Sep` : undefined,
            className: 'top-1.5 bottom-0',
            style: '{{ left: 120 }}',
          })
          return `${imports({ '@/components/time-marker': ['TimeMarker'] })}\n\n${body}`
        }}
      />

      <Gallery
        title="TimeMarker in use"
        note="the parent is position: relative"
        items={[
          {
            label: 'today on a roadmap',
            node: <MiniTimeline><TimeMarker label="Today" className="top-1.5 bottom-0" style={{ left: 120 }} /></MiniTimeline>,
          },
          {
            label: 'now on a schedule (destructive)',
            node: <MiniTimeline><TimeMarker label="14:05" tone="destructive" className="top-1.5 bottom-0" style={{ left: 168 }} /></MiniTimeline>,
          },
          {
            label: 'the line alone',
            node: <MiniTimeline><TimeMarker className="inset-y-0" style={{ left: 120 }} /></MiniTimeline>,
          },
        ]}
      />
    </>
  )
}

export default function GanttDemos() {
  return (
    <Demos>
      <GanttBarDemos />

      <MilestoneDemos />

      <TimeMarkerDemos />
    </Demos>
  )
}
