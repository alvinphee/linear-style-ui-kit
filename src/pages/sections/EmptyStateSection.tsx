import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, FileImportIcon, FolderAddIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Panel, Section } from './shared'

function EmptyPanel() {
  return (
    <Panel title="Empty state" note="Empty, EmptyMedia">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>
            Projects group related issues around one goal. Create your first one, or import from a CSV file.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => toast.success('Project created', { description: 'Demo only. Nothing was saved.' })}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
              Create project
            </Button>
            <Button variant="outline" onClick={() => toast('Import started', { description: 'Demo only.' })}>
              <HugeiconsIcon icon={FileImportIcon} strokeWidth={2} data-icon="inline-start" />
              Import
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </Panel>
  )
}

export default function EmptyStateSection() {
  return (
    <Section id="empty-state" title="Empty state" description="What a page shows when it has nothing to list">
      <EmptyPanel />
    </Section>
  )
}
