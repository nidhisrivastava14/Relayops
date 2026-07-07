'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function AnalyticsHeader() {
  const [isDark, setIsDark] = useState(true);

  // Set default theme attribute on mount
  useEffect(() => {
    const activeTheme = document.body.getAttribute('data-theme') || 'dark';
    setIsDark(activeTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.body.setAttribute('data-theme', nextTheme);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="page-header"
    >
      <div>
        <div className="page-title">Analytics & reporting</div>
        <div className="page-subtitle">Analyze command usage, routing efficiency, and AI accuracy.</div>
      </div>
      
      <div className="header-actions">
        {/* Theme Toggle Button */}
        <button 
          type="button"
          onClick={toggleTheme}
          className="theme-toggle" 
          title="Toggle theme"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>

        {/* Date Filter Button */}
        <button type="button" className="btn btn-ghost">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Last 7 days
        </button>

        {/* Export Button */}
        <button type="button" className="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Export
        </button>
      </div>
    </motion.div>
  );
}
