'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CategoryItem {
  label: string;
  value: number;
  color: string;
}

export function CommandsByCategory({ data }: { data: CategoryItem[] }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Commands by category</div>
      
      {data.length === 0 ? (
        <div className="empty-state">No reports triaged yet.</div>
      ) : (
        <div className="space-y-5 mt-4">
          {data.map((item, i) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {item.value}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
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
          ))}
        </div>
      )}
    </div>
  );
}
