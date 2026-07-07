import { AnalyticsHeader } from './analytics-header'
import { AnalyticsStats } from './analytics-stats'
import { CommandVolumeChart } from './command-volume-chart'
import { CommandsByCategory } from './commands-by-category'
import { HourlyActivity } from './hourly-activity'
import { SuccessFailureChart } from './success-failure-chart'
import { TopCommands } from './top-commands'
import { ProcessingTime } from './processing-time'

interface AnalyticsStatItem {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

interface CommandVolumeItem {
  day: string
  commands: number
  mirrors: number
}

interface CategoryItem {
  label: string
  value: number
  color: string
}

interface SuccessFailureItem {
  day: string
  success: number
  failure: number
}

interface CommandItem {
  rank: number
  command: string
  description: string
  count: number
  successRate: string
}

export function Analytics({
  stats,
  commandVol,
  categories,
  successFail,
  hourly,
  topCmds,
}: {
  stats: AnalyticsStatItem[]
  commandVol: CommandVolumeItem[]
  categories: CategoryItem[]
  successFail: SuccessFailureItem[]
  hourly: number[][]
  topCmds: CommandItem[]
}) {
  return (
    <>
      <AnalyticsHeader />
      <AnalyticsStats stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CommandVolumeChart data={commandVol} />
        </div>
        <div className="lg:col-span-1">
          <CommandsByCategory data={categories} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <HourlyActivity data={hourly} />
        <SuccessFailureChart data={successFail} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopCommands data={topCmds} />
        </div>
        <div className="lg:col-span-1">
          <ProcessingTime />
        </div>
      </div>
    </>
  )
}
