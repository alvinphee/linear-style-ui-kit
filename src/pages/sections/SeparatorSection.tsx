import { HugeiconsIcon } from '@hugeicons/react'
import { Attachment01Icon, Clock01Icon, Message01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Panel, Section } from './shared'

function SeparatorPanel() {
  return (
    <Panel title="Separator" note="Horizontal with a label, vertical inline">
      <div className="grid gap-4">
        <div className="grid gap-3">
          <Button variant="outline" className="w-full">
            <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} data-icon="inline-start" />
            Continue with SSO
          </Button>
          <div className="relative flex items-center justify-center">
            <Separator className="absolute inset-x-0 top-1/2" />
            <span className="bg-card text-muted-foreground relative px-2 text-[11px]">or</span>
          </div>
          <Input aria-label="Work email" placeholder="name@company.com" />
        </div>
        <div className="flex h-4 items-center gap-3 text-xs">
          <span>Issues</span>
          <Separator orientation="vertical" />
          <span>Projects</span>
          <Separator orientation="vertical" />
          <span>Views</span>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" /> Updated 2h ago
          </span>
          <Separator orientation="vertical" />
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="size-3" /> 12 comments
          </span>
          <Separator orientation="vertical" />
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} className="size-3" /> 3 files
          </span>
        </div>
      </div>
    </Panel>
  )
}

export default function SeparatorSection() {
  return (
    <Section id="separator" title="Separator" description="A thin line between groups of content">
      <SeparatorPanel />
    </Section>
  )
}
