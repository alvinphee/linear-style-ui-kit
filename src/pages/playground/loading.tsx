import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const SPINNER_SIZES = ['size-3', 'size-4', 'size-5', 'size-6'] as const

const SPINNER_COLOURS = ['muted', 'foreground', 'brand'] as const

type SpinnerColour = (typeof SPINNER_COLOURS)[number]

// --- Spinner -------------------------------------------------------------

const SPINNER_COLOUR: Record<SpinnerColour, string> = {
  muted: 'text-muted-foreground',
  foreground: 'text-foreground',
  brand: 'text-brand',
}

// size-4 is the Spinner's own size, so the snippet leaves it out.
const spinnerClass = (size: string, colour: SpinnerColour) => cn(size === 'size-4' ? '' : size, SPINNER_COLOUR[colour])

const SKELETON_SHAPES = ['line', 'circle', 'card'] as const

type SkeletonShape = (typeof SKELETON_SHAPES)[number]

// --- Skeleton ------------------------------------------------------------

function SkeletonShapeDemo({ shape, pulse }: { shape: SkeletonShape; pulse: boolean }) {
  const still = pulse ? undefined : 'animate-none'
  if (shape === 'line') return <Skeleton className={cn('h-3 w-48', still)} />
  if (shape === 'circle') return <Skeleton className={cn('size-10 rounded-full', still)} />
  return (
    <div className="grid w-56 gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className={cn('size-8 rounded-full', still)} />
        <div className="grid flex-1 gap-1.5">
          <Skeleton className={cn('h-3 w-24', still)} />
          <Skeleton className={cn('h-2.5 w-16', still)} />
        </div>
      </div>
      <Skeleton className={cn('h-20', still)} />
    </div>
  )
}

function skeletonCode(v: Values) {
  const still = bool(v, 'pulse') ? '' : ' animate-none'
  const sk = (className: string) => jsx('Skeleton', { className: className + still })
  const shape = str(v, 'shape')
  const body = shape === 'line'
    ? sk('h-3 w-48')
    : shape === 'circle'
      ? sk('size-10 rounded-full')
      : jsx('div', { className: 'grid w-56 gap-3 rounded-lg border p-3' }, [
        jsx('div', { className: 'flex items-center gap-2.5' }, [
          sk('size-8 rounded-full'),
          jsx('div', { className: 'grid flex-1 gap-1.5' }, [sk('h-3 w-24'), sk('h-2.5 w-16')]),
        ]),
        sk('h-20'),
      ])
  return `${imports({ '@/components/ui/skeleton': ['Skeleton'] })}\n\n${body}`
}

export default function LoadingDemos() {
  return (
    <Demos>
      <Playground
        title="Spinner"
        description="size and colour come from className"
        controls={[
          { kind: 'select', name: 'size', label: 'Size', options: SPINNER_SIZES, initial: 'size-4' },
          { kind: 'select', name: 'colour', label: 'Colour', options: SPINNER_COLOURS, initial: 'muted' },
          { kind: 'switch', name: 'text', label: 'With text', initial: false },
        ]}
        render={(v) => {
          const spinner = <Spinner className={spinnerClass(str(v, 'size'), str(v, 'colour') as SpinnerColour)} />
          if (!bool(v, 'text')) return spinner
          return <span className="text-muted-foreground flex items-center gap-1.5 text-xs">{spinner} Syncing issues…</span>
        }}
        code={(v) => {
          const spinner = jsx('Spinner', { className: spinnerClass(str(v, 'size'), str(v, 'colour') as SpinnerColour) })
          const body = bool(v, 'text')
            ? jsx('span', { className: 'text-muted-foreground flex items-center gap-1.5 text-xs' }, [spinner, 'Syncing issues…'])
            : spinner
          return `${imports({ '@/components/ui/spinner': ['Spinner'] })}\n\n${body}`
        }}
      />

      <Variants
        title="Spinner sizes"
        note="size × colour, size-4 is the default"
        rows={{ name: 'size', values: SPINNER_SIZES }}
        cols={{ name: 'colour', values: SPINNER_COLOURS }}
        render={(size, colour = 'muted') => <Spinner className={cn(size, SPINNER_COLOUR[colour])} />}
      />

      <Gallery
        title="Spinner in context"
        items={[
          { label: 'inline text', node: <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><Spinner className="size-3.5" /> Uploading 3 files…</span> },
          { label: 'button', node: <Button disabled><Spinner data-icon="inline-start" /> Saving</Button> },
          { label: 'outline button', node: <Button variant="outline" size="sm" disabled><Spinner className="size-3" data-icon="inline-start" /> Loading</Button> },
          { label: 'badge', node: <Badge variant="secondary"><Spinner data-icon="inline-start" /> Syncing</Badge> },
        ]}
      />

      <Playground
        title="Skeleton"
        description="shape comes from size and rounding classes"
        controls={[
          { kind: 'select', name: 'shape', label: 'Shape', options: SKELETON_SHAPES, initial: 'card' },
          { kind: 'switch', name: 'pulse', label: 'Pulse', initial: true },
        ]}
        render={(v) => <SkeletonShapeDemo shape={str(v, 'shape') as SkeletonShape} pulse={bool(v, 'pulse')} />}
        code={skeletonCode}
      />

      <Gallery
        title="Loading layouts"
        note="Skeletons shaped like the content they stand in for"
        items={[
          {
            label: 'list row',
            node: (
              <div className="flex w-56 items-center gap-2.5">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            ),
          },
          {
            label: 'paragraph',
            node: (
              <div className="grid w-48 gap-1.5">
                <Skeleton className="h-3" />
                <Skeleton className="h-3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ),
          },
          {
            label: 'stat',
            node: (
              <div className="grid w-32 gap-2 rounded-lg border p-3">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ),
          },
          {
            label: 'form',
            node: (
              <div className="flex w-56 gap-2">
                <Skeleton className="h-7 flex-1" />
                <Skeleton className="h-7 w-16" />
              </div>
            ),
          },
        ]}
      />
    </Demos>
  )
}
