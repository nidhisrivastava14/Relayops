'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CommandItem {
  rank: number;
  command: string;
  description: string;
  count: number;
  successRate: string;
}

export function TopCommands({ data }: { data: CommandItem[] }) {
  return (
    <div className="panel-card">
      <div className="panel-title">Top commands</div>
      
      <div className="space-y-2.5">
        {data.length === 0 ? (
          <div className="empty-state" style={{ height: '140px' }}>
            No commands logged yet.
          </div>
        ) : (
          data.map((cmd, i) => (
            <motion.div
              key={cmd.command}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
            >
              <span className="w-6 shrink-0 text-sm font-semibold text-[#8a87a0] tabular-nums">
                #{cmd.rank}
              </span>
              <span className="shrink-0 font-mono text-xs px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/5 text-[#8b6cff]">
                {cmd.command}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                {cmd.description}
              </span>
              <span className="shrink-0 text-base font-semibold tabular-nums text-white">
                {cmd.count}
              </span>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                {cmd.successRate}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
