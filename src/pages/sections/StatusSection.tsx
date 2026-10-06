import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Camera01Icon, Tag01Icon } from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { UserAvatar } from '@/components/person'
import { PriorityIcon } from '@/components/priority-icon'
import { StatusBadge } from '@/components/status-badge'
import { StatusIcon } from '@/components/status-icon'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PRIORITY, STATUS, type Priority, type Status } from '../data'
import { Panel, Row, Section } from './shared'

export default function StatusSection() {
  const [progress, setProgress] = useState(20)

  useEffect(() => {
    const timer = setInterval(() => setProgress((p) => (p >= 100 ? 10 : p + 15)), 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <Section id="status" title="Status" description="Badges, status icons, people and progress">
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

      <Panel title="Job status and priority" note="all Hugeicons">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {(Object.keys(STATUS) as Status[]).map((s) => (
            <span key={s} className="flex items-center gap-2 text-xs">
              <StatusIcon status={s} /> {STATUS[s].label}
            </span>
          ))}
          {(Object.keys(PRIORITY) as Priority[]).map((p) => (
            <span key={p} className="flex items-center gap-2 text-xs">
              <PriorityIcon priority={p} /> {PRIORITY[p].label}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="People" note="Avatar, AvatarGroup">
        <div className="grid gap-3">
          <Row className="gap-3">
            <Avatar size="sm"><AvatarFallback>RA</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>ML</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>DA</AvatarFallback></Avatar>
          </Row>
          <Row className="gap-3">
            <AvatarGroup>
              {['Ravi', 'Mei Ling', 'Daniel', 'Siti'].map((n) => (
                <UserAvatar key={n} name={n} />
              ))}
              <AvatarGroupCount className="size-6 text-[10px]">+3</AvatarGroupCount>
            </AvatarGroup>
            <span className="text-muted-foreground text-xs">7 drivers on shift</span>
          </Row>
        </div>
      </Panel>

      <Panel title="Progress and loading" note="Progress, Skeleton">
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <div className="flex justify-between text-xs">
              <span>Uploading proof photos</span>
              <span className="text-muted-foreground tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
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
        </div>
      </Panel>
    </Section>
  )
}
