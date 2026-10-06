import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Panel, Row, Section } from './shared'

function SpinnerPanel() {
  return (
    <Panel title="Spinner" note="Spinner, three sizes">
      <div className="grid gap-3">
        <Row className="gap-4">
          {[
            { label: 'sm', className: 'size-3' },
            { label: 'md', className: 'size-4' },
            { label: 'lg', className: 'size-6' },
          ].map((s) => (
            <span key={s.label} className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <Spinner className={cn('text-foreground', s.className)} /> {s.label}
            </span>
          ))}
        </Row>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Spinner className="size-3.5" /> Syncing 24 issues from the server…
        </p>
        <Row>
          <Button disabled>
            <Spinner className="size-3.5" data-icon="inline-start" /> Saving…
          </Button>
          <Button variant="outline" disabled>
            <Spinner className="size-3.5" data-icon="inline-start" /> Loading
          </Button>
        </Row>
      </div>
    </Panel>
  )
}

export default function LoadingSection() {
  return (
    <Section id="loading" title="Loading" description="Spinners and skeletons while content loads">
      <SpinnerPanel />

      <Panel title="Loading rows" note="Skeleton">
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="size-5 rounded-full" />
            </div>
          ))}
        </div>
      </Panel>
    </Section>
  )
}
