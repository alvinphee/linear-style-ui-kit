import { useMemo, useState } from 'react'
import { UsageAnalytics, type UsagePeriod } from '@/blocks/ai/admin/usage-analytics'
import { SettingsHeader } from '@/blocks/settings-page'
import { now } from '../data'
import { exportUsage, usageFor } from './usage-data'

// The admin console's Usage section: the usage analytics block on the
// made-up usage, with a real CSV of each person's figures to download.

export function UsageTab() {
  const [period, setPeriod] = useState<UsagePeriod>('30d')
  const usage = useMemo(() => usageFor(period), [period])

  return (
    <>
      <SettingsHeader
        title="Usage"
        description="Who uses the assistant, how much, with which models, and the credits it costs. Made-up figures."
      />
      <UsageAnalytics
        {...usage}
        period={period}
        onPeriodChange={setPeriod}
        onExport={() => exportUsage(period)}
        now={now()}
      />
    </>
  )
}
