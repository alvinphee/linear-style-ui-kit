import { PRIORITIES, PRIORITY_ORDER, PriorityIcon, type Priority } from '@/components/priority-icon'
import { StatusIcon, WORKFLOW_STATUS, type WorkflowStatus } from '@/components/status-icon'
import { Demos, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

const WORKFLOW = Object.keys(WORKFLOW_STATUS) as WorkflowStatus[]

function statusIconCode(v: Values) {
  const label = bool(v, 'label') ? true : undefined
  return [
    imports({ '@/components/status-icon': ['StatusIcon'], '@/components/priority-icon': ['PriorityIcon'] }),
    '',
    jsx('StatusIcon', { status: str(v, 'status'), label }),
    jsx('PriorityIcon', { priority: str(v, 'priority'), label }),
  ].join('\n')
}

export default function StatusIconsDemos() {
  return (
    <Demos>
      <Playground
        title="StatusIcon and PriorityIcon"
        description="a workflow status and a priority as icons. Label makes a lone icon speak."
        controls={[
          { kind: 'select', name: 'status', label: 'Status', options: WORKFLOW, initial: 'progress' },
          { kind: 'select', name: 'priority', label: 'Priority', options: PRIORITY_ORDER, initial: 'high' },
          { kind: 'switch', name: 'label', label: 'Spoken label', initial: false },
        ]}
        render={(v) => {
          const status = str(v, 'status') as WorkflowStatus
          const priority = str(v, 'priority') as Priority
          return (
            <span className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <StatusIcon status={status} label={bool(v, 'label')} />
                {WORKFLOW_STATUS[status].label}
              </span>
              <span className="flex items-center gap-1.5">
                <PriorityIcon priority={priority} label={bool(v, 'label')} />
                {PRIORITIES[priority].label}
              </span>
            </span>
          )
        }}
        code={statusIconCode}
      />

      <Variants
        title="Workflow statuses"
        note="status. Colours come from the --status-* tokens."
        rows={{ name: 'status', values: WORKFLOW }}
        render={(status) => (
          <span className="flex items-center gap-1.5 text-xs"><StatusIcon status={status} /> {WORKFLOW_STATUS[status].label}</span>
        )}
      />

      <Variants
        title="Priorities"
        note="priority, most urgent first (PRIORITY_ORDER)"
        rows={{ name: 'priority', values: PRIORITY_ORDER }}
        render={(priority) => (
          <span className="flex items-center gap-1.5 text-xs"><PriorityIcon priority={priority} /> {PRIORITIES[priority].label}</span>
        )}
      />
    </Demos>
  )
}
