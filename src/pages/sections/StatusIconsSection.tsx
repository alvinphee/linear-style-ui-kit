import { PriorityIcon } from '@/components/priority-icon'
import { StatusIcon } from '@/components/status-icon'
import { PRIORITY, STATUS, type Priority, type Status } from '../data'
import { Panel, Section } from './shared'

export default function StatusIconsSection() {
  return (
    <Section id="status-icons" title="Status and priority" description="Where an item is in its workflow, and how urgent it is">
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
    </Section>
  )
}
