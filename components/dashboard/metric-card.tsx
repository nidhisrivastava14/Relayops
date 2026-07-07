'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Sparkline } from './sparkline';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export type Metric = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  spark: number[];
  accent: string;
};

const trendStyles = {
  up: 'text-[#059669] dark:text-[#34d399] bg-success/10',
  down: 'text-[#dc2626] dark:text-[#f87171] bg-destructive/10',
  neutral: 'text-muted-foreground bg-muted',
};

const TrendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus };

export function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const Icon = metric.icon;
  const Trend = TrendIcon[metric.trend];

  // Map metric ID to icon color class
  let iconColorClass = 'purple';
  if (metric.id === 'open-incidents') {
    iconColorClass = 'red';
  } else if (metric.id === 'mirror-health') {
    iconColorClass = 'green';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
    >
      <div className="metric-card group relative overflow-hidden transition-all duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={cn('metric-icon', iconColorClass)}>
              <Icon className="size-4" />
            </span>
            <span className="text-xs font-semibold text-[color:var(--text-tertiary)]">{metric.label}</span>
          </div>
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', trendStyles[metric.trend])}>
            <Trend className="size-3" />
            {metric.delta}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[color:var(--text-primary)] to-[color:var(--accent-1)] bg-clip-text text-transparent tabular-nums">{metric.value}</p>
          </div>
          <div className="h-10 w-24">
            <Sparkline data={metric.spark} color={metric.accent} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
