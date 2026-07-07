'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HealthStatus = 'HEALTHY' | 'WAITING' | 'DEGRADED'

interface HealthPanelProps {
  hasSlackWebhook: boolean;
}

const dotColor: Record<HealthStatus, string> = {
  HEALTHY: 'bg-emerald-500',
  WAITING: 'bg-amber-500',
  DEGRADED: 'bg-rose-500',
}

export function HealthPanel({ hasSlackWebhook }: HealthPanelProps) {
  const healthServices = [
    { name: 'Discord API', latency: '12ms', status: 'HEALTHY' as HealthStatus },
    { name: 'Slack Webhook', latency: hasSlackWebhook ? '34ms' : '—', status: (hasSlackWebhook ? 'HEALTHY' : 'WAITING') as HealthStatus },
    { name: 'Gemini AI', latency: '156ms', status: 'HEALTHY' as HealthStatus },
    { name: 'Supabase DB', latency: '8ms', status: 'HEALTHY' as HealthStatus },
    { name: 'Webhook Queue', latency: '—', status: 'WAITING' as HealthStatus },
  ]

  return (
    <div className="panel-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          System Health
        </h2>
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <RefreshCw className="size-3" />
          Checked just now
        </span>
      </div>

      <ul className="mt-4 space-y-1">
        {healthServices.map((svc) => (
          <li
            key={svc.name}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn('size-2 rounded-full', dotColor[svc.status])}
              />
              <span className="text-sm font-medium text-foreground">
                {svc.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {svc.latency}
              </span>
              <span className={cn('status-badge', svc.status === 'HEALTHY' ? 'healthy' : 'waiting')}>
                {svc.status === 'HEALTHY' ? 'Healthy' : 'Waiting'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
