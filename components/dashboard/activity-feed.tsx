import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, TerminalSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type Status = 'DELIVERED' | 'RETRYING' | 'ABANDONED' | 'SKIPPED'

interface Command {
  id: string
  command: string
  description: string
  time: string
  user: string
  priority: Priority
  category: string
  status: Status
}

const priorityVariant: Record<Priority, 'error' | 'warning' | 'info'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
}

const priorityBar: Record<Priority, string> = {
  HIGH: 'bg-destructive',
  MEDIUM: 'bg-warning',
  LOW: 'bg-info',
}

const statusVariant: Record<Status, 'success' | 'warning' | 'error' | 'outline'> = {
  DELIVERED: 'success',
  RETRYING: 'warning',
  ABANDONED: 'error',
  SKIPPED: 'outline',
}

export function ActivityFeed({ commands }: { commands: Command[] }) {
  return (
    <div className="panel-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Live Command Timeline
          </h2>
          <Badge variant="primary" className="normal-case tracking-normal">
            {commands.length} recent
          </Badge>
        </div>
        <Link
          href="/dashboard/activity"
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {commands.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No command events have been logged yet.
          </div>
        ) : (
          commands.map((cmd, i) => (
            <motion.div
              key={cmd.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
              className="group relative flex items-start gap-3 p-4 transition-colors hover:bg-accent/40 md:gap-4 md:p-5"
            >
              <span
                className={cn(
                  'absolute left-0 top-4 h-[calc(100%-2rem)] w-0.5 rounded-r-full opacity-0 transition-opacity group-hover:opacity-100',
                  priorityBar[cmd.priority] || 'bg-slate-700',
                )}
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-primary">
                <TerminalSquare className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <code className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-primary">
                    {cmd.command}
                  </code>
                  <span className="truncate text-sm font-medium text-foreground">
                    {cmd.description || <span className="italic text-muted-foreground">No description payload</span>}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">{cmd.time}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    from{' '}
                    <span className="font-medium text-foreground/80">
                      {cmd.user}
                    </span>
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 sm:flex">
                {cmd.priority && (
                  <Badge variant={priorityVariant[cmd.priority]}>
                    {cmd.priority}
                  </Badge>
                )}
                {cmd.category && <Badge variant="outline">{cmd.category}</Badge>}
                <Badge variant={statusVariant[cmd.status]}>{cmd.status}</Badge>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
