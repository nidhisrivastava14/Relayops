import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="main space-y-6">
      <div className="h-16 w-1/3 bg-[color:var(--card-bg)] border border-[color:var(--card-border)] rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[color:var(--card-bg)] border border-[color:var(--card-border)] rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 bg-[color:var(--card-bg)] border border-[color:var(--card-border)] rounded-2xl animate-pulse" />
        <div className="lg:col-span-1 h-96 bg-[color:var(--card-bg)] border border-[color:var(--card-border)] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
