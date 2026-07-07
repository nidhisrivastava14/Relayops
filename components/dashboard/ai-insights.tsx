'use client'

import { motion } from 'framer-motion'
import { Sparkles, AlertTriangle } from 'lucide-react'

interface AiInsightItem {
  label: string
  value: number
  color: string
}

interface AiInsightsProps {
  priorityDistribution: AiInsightItem[]
  openIncidents: number
  highCount: number
}

export function AiInsights({ priorityDistribution, openIncidents, highCount }: AiInsightsProps) {
  const hasAlerts = openIncidents > 0

  return (
    <div className="space-y-4">
      <div className="panel-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border pb-5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              AI Insights
            </h2>
          </div>
          <span className="panel-tag accent">Powered by Gemini</span>
        </div>

        <div className="space-y-4 pt-5">
          {hasAlerts ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Triage analysis has flagged <span className="font-semibold text-foreground">{openIncidents} active incident(s)</span>. 
              {highCount > 0 ? (
                <span> Out of these, <span className="font-semibold text-rose-400">{highCount} are high priority</span> and require immediate attention.</span>
              ) : (
                <span> All active incidents are currently categorized under low-to-medium priority.</span>
              )}
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No active incidents are currently reported on your connected servers. All automation checks are operating within normal operational limits.
            </p>
          )}

          {hasAlerts && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
                <AlertTriangle className="size-3.5" />
                Recommended Action
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Inspect open reports and use the &quot;Resolve&quot; button inside the Discord notification message to mark them resolved.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="panel-card">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Priority Distribution
        </h2>
        <div className="mt-4 space-y-3.5">
          {priorityDistribution.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No priority data reported yet.</div>
          ) : (
            priorityDistribution.map((item, i) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label} Priority</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {item.value}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{
                      duration: 0.7,
                      delay: 0.2 + i * 0.1,
                      ease: 'easeOut',
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
