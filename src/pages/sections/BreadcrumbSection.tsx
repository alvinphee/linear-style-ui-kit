import { type MouseEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Home01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { LetterMark } from '@/components/mark'
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Panel, Section } from './shared'

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

function BreadcrumbPanel() {
  return (
    <Panel title="Breadcrumb" note="Ellipsis opens the hidden levels">
      <div className="grid gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay} className="flex items-center gap-1">
                <HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-3.5" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Show hidden levels"
                  className="hover:text-foreground focus-visible:ring-ring/30 flex items-center rounded-sm outline-none focus-visible:ring-2"
                >
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {['Workspace', 'Teams', 'Engineering'].map((level) => (
                    <DropdownMenuItem key={level} onSelect={() => toast(`Go to ${level}`, { description: 'Demo link' })}>
                      {level}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay}>Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mobile app redesign</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Breadcrumb>
          <BreadcrumbList className="gap-1">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay} className="flex items-center gap-1.5">
                <LetterMark text="EN" colour="var(--brand)" size="xs" />
                Engineering
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={stay}>Issues</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="tabular-nums">ENG-142</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </Panel>
  )
}

export default function BreadcrumbSection() {
  return (
    <Section id="breadcrumb" title="Breadcrumb" description="Where a page sits, as a path of links">
      <BreadcrumbPanel />
    </Section>
  )
}
