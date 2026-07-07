'use client';

import React from 'react';

interface HeroProps {
  userEmail: string;
  commandsToday: number;
  successRate: string;
  openIncidents: number;
}

export function Hero({ userEmail, commandsToday, successRate, openIncidents }: HeroProps) {
  const userName = userEmail.split('@')[0];

  return (
    <div className="hero">
      <div>
        <div className="hero-badge">
          <span className="pulse-dot" />
          Live · {commandsToday} events today
        </div>
        
        <div className="hero-title">Welcome back, {userName}.</div>
        
        <div className="hero-sub">
          Your automation infrastructure is operating at peak performance.
        </div>
        
        <div className="hero-pills">
          <div className="hero-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19V10M12 19V5M20 19v-7" />
            </svg>
            {commandsToday} commands today
          </div>
          <div className="hero-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {successRate} success rate
          </div>
          <div className="hero-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            {openIncidents} open reports
          </div>
        </div>
      </div>

      <div className="orb-wrap hidden md:block">
        <div className="orb">
          <div className="orb-inner">
            <span className="size-2 rounded-full bg-[#3B82F6] shadow-[0_0_12px_#3B82F6]" />
            <span className="text-[11px] font-extrabold tracking-widest text-white">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
