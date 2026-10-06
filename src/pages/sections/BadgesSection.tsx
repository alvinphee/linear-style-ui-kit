import { HugeiconsIcon } from '@hugeicons/react'
import { Camera01Icon, Tag01Icon } from '@hugeicons/core-free-icons'
import { StatusBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Panel, Row, Section } from './shared'

export default function BadgesSection() {
  return (
    <Section id="badges" title="Badges and labels" description="Badges, status badges, change badges, and coloured labels">
      <Panel title="Badges" note="variant=">
        <div className="grid gap-3">
          <Row>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="ghost">Ghost</Badge>
          </Row>
          <Row>
            <StatusBadge tone="progress" variant="outline" className="rounded-full">In transit</StatusBadge>
            <StatusBadge tone="success" variant="outline" className="rounded-full">Delivered</StatusBadge>
            <Badge variant="outline">
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} /> 3 photos
            </Badge>
            <Badge variant="outline">
              <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} /> Export
            </Badge>
          </Row>
        </div>
      </Panel>
    </Section>
  )
}
