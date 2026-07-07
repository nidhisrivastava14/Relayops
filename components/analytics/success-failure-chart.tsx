'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SuccessFailureItem {
  day: string;
  success: number;
  failure: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  dataKey: string;
  color: string;
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const success = payload.find((p) => p.dataKey === 'success')?.value ?? 0;
  const failure = payload.find((p) => p.dataKey === 'failure')?.value ?? 0;
  return (
    <div className="tooltip" style={{ position: 'relative', left: '0', top: '0' }}>
      <div className="tooltip-day">{label}</div>
      <div className="tooltip-row">
        <span>Success</span>
        <span>{success}</span>
      </div>
      <div className="tooltip-row">
        <span>Failure</span>
        <span>{failure}</span>
      </div>
    </div>
  );
}

export function SuccessFailureChart({ data }: { data: SuccessFailureItem[] }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Success vs failure rate</div>
      
      <div className="chart-with-tooltip" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            barGap={0}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--grid-line)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10.5 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10.5 }}
              width={35}
            />
            <Tooltip
              content={<BarTooltip />}
              cursor={{ fill: 'var(--hover-bg)', opacity: 0.5 }}
            />
            <Bar
              dataKey="success"
              stackId="a"
              fill="var(--success)"
              radius={[0, 0, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="failure"
              stackId="a"
              fill="var(--failure)"
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--success)' }} />
          Success
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: 'var(--failure)' }} />
          Failure
        </div>
      </div>
    </div>
  );
}
