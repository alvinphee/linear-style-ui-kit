import { Fragment } from 'react'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Demos, Playground, imports, str, type Values } from './Playground'

const SCROLL_DIRECTIONS = ['vertical', 'horizontal'] as const

const SCROLL_HEIGHTS = ['h-32', 'h-48', 'h-64'] as const

const RELEASES = Array.from({ length: 24 }, (_, i) => `v2.${24 - i}.0`)

const TAGS = ['Fragile', 'Export', 'Cold chain', 'Oversize', 'Key account', 'Hazardous', 'Same day', 'Bulk', 'Returns', 'Customs']

// A box that scrolls on its own with a thin kit scrollbar, instead of the
// browser's: a long list in a fixed height, or a row of tags sideways.
function ScrollAreaDemo({ direction, height }: { direction: (typeof SCROLL_DIRECTIONS)[number]; height: string }) {
  if (direction === 'horizontal') {
    return (
      <ScrollArea className="w-72 max-w-full rounded-md border whitespace-nowrap">
        <div className="flex w-max gap-1.5 p-2.5">
          {TAGS.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )
  }
  return (
    <ScrollArea className={cn('w-56 rounded-md border', height)}>
      <div className="p-2.5">
        <p className="mb-2 text-xs font-medium">Releases</p>
        {RELEASES.map((r, i) => (
          <Fragment key={r}>
            {i > 0 && <Separator className="my-1.5" />}
            <p className="text-muted-foreground text-xs tabular-nums">{r}</p>
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  )
}

function scrollAreaCode(v: Values) {
  if (str(v, 'direction') === 'horizontal') {
    return [
      imports({ '@/components/ui/scroll-area': ['ScrollArea', 'ScrollBar'] }),
      '',
      '<ScrollArea className="w-72 rounded-md border whitespace-nowrap">',
      '  <div className="flex w-max gap-1.5 p-2.5">',
      '    {tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}',
      '  </div>',
      '  <ScrollBar orientation="horizontal" />',
      '</ScrollArea>',
    ].join('\n')
  }
  return [
    imports({ '@/components/ui/scroll-area': ['ScrollArea'] }),
    '',
    `<ScrollArea className="w-56 rounded-md border ${str(v, 'height')}">`,
    '  <div className="p-2.5">{releases}</div>',
    '</ScrollArea>',
  ].join('\n')
}

export default function ScrollAreaDemos() {
  return (
    <Demos>
      <Playground
        title="ScrollArea"
        description="a box that scrolls on its own, with the kit's thin scrollbar"
        controls={[
          { kind: 'select', name: 'direction', label: 'Direction', options: SCROLL_DIRECTIONS, initial: 'vertical' },
          { kind: 'select', name: 'height', label: 'Height (className)', options: SCROLL_HEIGHTS, initial: 'h-48' },
        ]}
        render={(v) => <ScrollAreaDemo direction={str(v, 'direction') as (typeof SCROLL_DIRECTIONS)[number]} height={str(v, 'height')} />}
        code={scrollAreaCode}
      />
    </Demos>
  )
}
