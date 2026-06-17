"use client";

export const DashboardSkeleton = () => {
  return (
    <div className="p-8 flex-1 overflow-y-auto bg-[var(--color-bg-base)] flex flex-col gap-8 animate-pulse">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-2 gap-8 h-1/2 items-center">
        {/* Left: Good morning + Quote */}
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {/* Good morning title skeleton */}
          <div className="w-64 h-10 bg-[var(--color-bg-card)] rounded"></div>

          {/* Quote skeleton */}
          <div className="w-full max-w-lg space-y-2 mt-4">
            <div className="h-4 bg-[var(--color-bg-card)] rounded w-full"></div>
            <div className="h-4 bg-[var(--color-bg-card)] rounded w-5/6"></div>
          </div>
        </div>

        {/* Right: Calendar Cards */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col">
          <div className="flex flex-row gap-6 h-full">
            {/* This Week Column */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Title skeleton */}
              <div className="h-6 w-20 bg-[var(--color-bg-elevated)] rounded"></div>

              {/* Events skeleton */}
              <div style={{ height: "320px" }} className="flex flex-col gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`this-week-${i}`} className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] h-16 flex items-center gap-3">
                    <div className="h-3 w-12 bg-[var(--color-border-default)] rounded flex-shrink-0"></div>
                    <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-[var(--color-border-default)]"></div>

            {/* Next Week Column */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Title + Refresh skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-[var(--color-bg-elevated)] rounded"></div>
                <div className="h-8 w-8 bg-[var(--color-bg-elevated)] rounded"></div>
              </div>

              {/* Events skeleton */}
              <div style={{ height: "320px" }} className="flex flex-col gap-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`next-week-${i}`} className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] h-16 flex items-center gap-3">
                    <div className="h-3 w-12 bg-[var(--color-border-default)] rounded flex-shrink-0"></div>
                    <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-8 h-1/2">
        {/* Card 1: Gmail Inbox */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-default)] p-6 flex flex-col gap-4 h-full">
          {/* Header skeleton */}
          <div className="h-6 w-24 bg-[var(--color-bg-card)] rounded"></div>

          {/* Content skeleton */}
          <div className="space-y-3 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={`gmail-${i}`} className="flex flex-col gap-2 pb-3 border-b border-[var(--color-border-subtle)] last:border-b-0">
                <div className="h-4 w-full bg-[var(--color-bg-card)] rounded"></div>
                <div className="h-3 w-5/6 bg-[var(--color-bg-card)] rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Daily Streak */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-default)] p-6 flex flex-col gap-4 h-full">
          {/* Header skeleton */}
          <div className="h-6 w-20 bg-[var(--color-bg-card)] rounded"></div>

          {/* Large number skeleton */}
          <div className="flex-1 flex items-center justify-center">
            <div className="h-16 w-32 bg-[var(--color-bg-card)] rounded"></div>
          </div>

          {/* Bottom skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-24 bg-[var(--color-bg-card)] rounded"></div>
            <div className="h-10 bg-[var(--color-bg-card)] rounded"></div>
          </div>
        </div>

        {/* Card 3: Quick Notes */}
        <div className="bg-white rounded-2xl border border-[var(--color-border-default)] p-6 flex flex-col gap-4 h-full">
          {/* Header skeleton */}
          <div className="h-6 w-24 bg-[var(--color-bg-card)] rounded"></div>

          {/* Input skeleton */}
          <div className="h-10 bg-[var(--color-bg-secondary)] rounded-lg"></div>

          {/* Notes skeleton */}
          <div className="space-y-2 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={`note-${i}`} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-[var(--color-bg-card)] rounded"></div>
                <div className="h-3 flex-1 bg-[var(--color-bg-card)] rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
