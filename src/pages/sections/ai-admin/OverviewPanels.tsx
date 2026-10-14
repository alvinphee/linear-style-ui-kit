import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { UsageAnalytics, type UsagePeriod } from '@/blocks/ai/admin/usage-analytics'
import { now } from '../ai/data'
import { OverviewTab } from '../ai/admin/OverviewTab'
import { exportUsage, usageFor } from '../ai/admin/usage-data'
import { Panel } from '../shared'

// The admin console's Overview and Usage on the kit page: the usage
// analytics block live on the made-up usage, and the Overview section in a
// card, as it sits in the console.

function UsagePanel() {
  const [period, setPeriod] = useState<UsagePeriod>('30d')
  const usage = useMemo(() => usageFor(period), [period])
  return (
    <Panel title="Usage analytics" note="UsageAnalytics: period, KPIs, by model, team, agent and user" wide>
      <UsageAnalytics
        {...usage}
        period={period}
        onPeriodChange={setPeriod}
        onExport={() => exportUsage(period)}
        now={now()}
      />
    </Panel>
  )
}

export function OverviewPanels() {
  return (
    <>
      <UsagePanel />
      <Panel title="Admin overview" note="The console's first section: org, seats, this month, needs attention" wide>
        <div className="bg-background mx-auto grid w-full max-w-2xl gap-6 rounded-lg border p-4">
          <OverviewTab onNavigate={(section) => toast(`Opens ${section}`, { description: 'In the console this opens that section.' })} />
        </div>
      </Panel>
    </>
  )
}
