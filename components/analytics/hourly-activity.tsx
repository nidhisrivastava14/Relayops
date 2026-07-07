'use client';

import React from 'react';

const getCellBg = (level: number) => {
  if (level === 0) return undefined;
  const opacity = [0, 0.3, 0.55, 0.75, 1.0][level];
  return `rgba(139, 108, 255, ${opacity})`;
};

export function HourlyActivity({ data }: { data: number[][] }) {
  const activityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="calendar-card">
      <div className="calendar-title">Hourly activity calendar</div>

      <div className="space-y-[4px]">
        {activityDays.map((day, d) => (
          <div key={day} className="calendar-row">
            <div className="calendar-day-label">{day}</div>
            
            {/* 24 Hourly Activity Cells */}
            <div className="flex gap-[4px]">
              {(data?.[d] || Array(24).fill(0)).map((level, h) => (
                <div
                  key={h}
                  className={`calendar-cell ${level > 0 ? 'active' : ''}`}
                  style={{
                    backgroundColor: getCellBg(level),
                  }}
                  title={`${day} ${h}:00 — activity level ${level}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
