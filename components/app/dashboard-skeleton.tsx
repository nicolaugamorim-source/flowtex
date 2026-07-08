"use client";

export const DashboardSkeleton = () => {
  return (
    <div className="p-[var(--space-8)] w-full h-screen overflow-hidden bg-[var(--color-bg-base)] grid grid-rows-2 gap-[var(--space-8)] animate-pulse">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-8)] min-h-0 items-center">
        {/* Left: Good morning + Quote */}
        <div className="flex flex-col items-center justify-center h-full min-h-0 gap-[var(--space-4)]">
          {/* Good morning title skeleton — mirrors the clamp(32px,...,96px) greeting */}
          <div className="w-64 rounded-[var(--radius-sm)] bg-[var(--color-bg-card)]" style={{ height: "clamp(32px,min(6vw,9vh),96px)" }}></div>

          {/* Quote skeleton */}
          <div className="w-full max-w-lg space-y-[var(--space-2)] mt-[var(--space-4)]">
            <div className="h-4 bg-[var(--color-bg-card)] rounded w-full"></div>
            <div className="h-4 bg-[var(--color-bg-card)] rounded w-5/6"></div>
          </div>
        </div>

        {/* Right: Calendar Cards */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col">
          <div className="flex flex-row gap-[var(--space-6)] h-full">
            {/* This Week Column */}
            <div className="flex-1 flex flex-col gap-[var(--space-3)]">
              {/* Title skeleton */}
              <div className="h-6 w-20 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>

              {/* Events skeleton */}
              <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`this-week-${i}`} className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] h-16 flex items-center gap-[var(--space-3)]">
                    <div className="h-3 w-12 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] flex-shrink-0"></div>
                    <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded-[var(--radius-sm)]"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-[var(--color-border-default)]"></div>

            {/* Next Week Column */}
            <div className="flex-1 flex flex-col gap-[var(--space-3)]">
              {/* Title + Refresh skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
                <div className="h-8 w-8 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
              </div>

              {/* Events skeleton */}
              <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={`next-week-${i}`} className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] h-16 flex items-center gap-[var(--space-3)]">
                    <div className="h-3 w-12 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] flex-shrink-0"></div>
                    <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded-[var(--radius-sm)]"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards: Gmail Inbox, Priority Tasks, Daily Streak
          (mirrors GmailInbox / PriorityTasks / DailyStreak real cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-8)] min-h-0">
        {/* Card 1: Gmail Inbox — header + refresh icon, 4 ghost message rows (h-16) */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col gap-[var(--space-3)]">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
            <div className="h-8 w-8 bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)]"></div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={`gmail-${i}`} className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] h-16 flex items-center justify-between gap-[var(--space-3)]">
                <div className="flex-1 flex flex-col gap-[var(--space-1)] min-w-0">
                  <div className="h-3.5 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] w-2/3"></div>
                  <div className="h-3 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] w-1/2"></div>
                </div>
                <div className="h-3 w-8 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Priority Tasks — header, 4 ghost task rows (h-16) with pill */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col">
          <div className="h-5 w-28 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] mb-[var(--space-4)]"></div>
          <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={`task-${i}`} className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] h-16 flex items-center justify-between gap-[var(--space-3)] border-l-4 border-l-[var(--color-border-default)]">
                <div className="h-3.5 bg-[var(--color-border-default)] rounded-[var(--radius-sm)] flex-1"></div>
                <div className="h-5 w-14 bg-[var(--color-border-default)] rounded-full flex-shrink-0"></div>
              </div>
            ))}
          </div>
          <div className="mt-[var(--space-4)] h-3 w-24 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
        </div>

        {/* Card 3: Daily Streak — number + label + phrase row, activity square grid, legend */}
        <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col gap-[var(--space-5)]">
          <div className="flex items-center justify-center gap-[var(--space-6)] w-full">
            <div className="flex items-center gap-[var(--space-2)] flex-shrink-0">
              <div className="h-16 w-16 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
              <div className="flex flex-col gap-[var(--space-1)]">
                <div className="h-3 w-10 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
                <div className="h-3 w-14 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
              </div>
            </div>
            <div className="h-4 flex-1 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
          </div>
          <div className="h-3 w-40 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
          <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-4)] items-center w-full overflow-hidden">
            <div className="grid grid-cols-10 gap-[var(--space-1)] w-full">
              {Array(30).fill(0).map((_, i) => (
                <div key={i} className="aspect-square w-full bg-[var(--color-bg-elevated)] rounded-[2px]"></div>
              ))}
            </div>
          </div>
          <div className="pt-[var(--space-3)] border-t border-[var(--color-border-subtle)]">
            <div className="h-3 w-32 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
