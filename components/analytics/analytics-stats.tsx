'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnalyticsStatItem {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
}

export function AnalyticsStats({ stats }: { stats: AnalyticsStatItem[] }) {
  return (
    <div className="metrics-grid">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
          whileHover={{ y: -3 }}
          className="metric-card"
        >
          <div className="metric-label">{stat.label}</div>
          <div className={`metric-value ${stat.id === 'success-rate' || stat.id === 'active-configs' ? 'accent' : ''}`}>
            {stat.value}
          </div>
          <div className="metric-note">{stat.delta}</div>
        </motion.div>
      ))}
    </div>
  );
}
