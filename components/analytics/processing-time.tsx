'use client';

import React from 'react';

export function ProcessingTime() {
  return (
    <div className="panel-card">
      <div className="latency-panel">
        <div className="latency-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />
            <path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z" />
          </svg>
        </div>
        <div className="latency-title">No latency data available</div>
        <div className="latency-desc">
          System response latency tracking and execution distributions are not enabled for this workspace tier.
        </div>
      </div>
    </div>
  );
}
