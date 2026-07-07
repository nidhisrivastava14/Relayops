'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CommandVolumeItem {
  day: string;
  commands: number;
  mirrors: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  dataKey: string;
  color: string;
}

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const commands = payload.find((p) => p.dataKey === 'commands')?.value ?? 0;
  const mirrors = payload.find((p) => p.dataKey === 'mirrors')?.value ?? 0;
  return (
    <div className="tooltip" style={{ position: 'relative', left: '0', top: '0' }}>
      <div className="tooltip-day">{label}</div>
      <div className="tooltip-row">
        <span>Commands</span>
        <span>{commands}</span>
      </div>
      <div className="tooltip-row">
        <span>Mirrors</span>
        <span>{mirrors}</span>
      </div>
    </div>
  );
}

export function CommandVolumeChart({ data }: { data: CommandVolumeItem[] }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Command volume over time</div>
      <div className="chart-with-tooltip" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volCommands" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b6cff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b6cff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="volMirrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b4fd6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#5b4fd6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              content={<VolumeTooltip />}
              cursor={{ stroke: 'var(--grid-line)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="commands"
              stroke="#8b6cff"
              strokeWidth={2.5}
              fill="url(#volCommands)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card-bg)' }}
            />
            <Area
              type="monotone"
              dataKey="mirrors"
              stroke="#5b4fd6"
              strokeWidth={2}
              fill="url(#volMirrors)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card-bg)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
