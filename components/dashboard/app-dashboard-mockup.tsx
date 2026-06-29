"use client";

import React from "react";
import { RefreshCw, MoreVertical } from "lucide-react";

/**
 * A static, non-interactive miniature of the real dashboard
 * (components/app/app-dashboard.tsx + gmail-inbox/priority-tasks/daily-streak),
 * built with the same two-row layout but sized directly for the hero slot
 * instead of scaling a full-size clone — avoids overflow/clipping on
 * narrower viewports while keeping text legible.
 */

const MOCK_EVENTS_THIS_WEEK = [
  { time: "09:00 AM", title: "Team Standup" },
  { time: "02:30 PM", title: "Code Review" },
];

const MOCK_EVENTS_NEXT_WEEK = [
  { time: "10:00 AM", title: "Design Review" },
  { time: "11:30 AM", title: "Client Meeting" },
];

const MOCK_EMAILS = [
  { sender: "Sarah Chen", subject: "Re: Website Redesign — final assets", date: "9:14 AM", unread: true },
  { sender: "Stripe", subject: "Your invoice is ready", date: "8:02 AM", unread: true },
];

const MOCK_TASKS = [
  { title: "Finalize Q3 client proposal", priority: "high", column: "In Progress" },
  { title: "Review API integration PR", priority: "high", column: "Review" },
  { title: "Update onboarding docs", priority: "medium", column: "To Do" },
];

const priorityColor: Record<string, string> = {
  high: "var(--color-priority-high-border)",
  medium: "var(--color-priority-medium-border)",
  low: "var(--color-priority-low-border)",
};

const columnColor: Record<string, string> = {
  "To Do": "var(--color-column-backlog)",
  "In Progress": "var(--color-column-progress)",
  Review: "var(--color-column-review)",
};

const ACTIVITY_SEED = [
  0, 1, 0, 2, 0, 0, 1, 0, 0, 3, 1, 0, 0, 2, 0, 1, 0, 0, 4, 1, 0, 2, 0, 0, 1, 0, 0,
  1, 0, 3, 0, 1, 0, 0, 2, 0, 0, 1, 0, 4, 0, 1, 0, 0, 2, 1, 0, 0, 3, 0, 1, 0, 0, 2, 0,
  0, 2, 0, 1, 0, 0, 3, 1, 0, 0, 1, 0, 0, 4, 0, 2, 0, 1, 0, 0, 3, 0, 1, 0, 0, 2, 0, 1,
  0, 0, 1, 0, 2, 0, 0, 3, 1, 0, 0, 1, 0, 4, 0, 2, 0, 0, 1, 0, 0, 2, 1, 0, 0, 3, 0, 0,
  1, 0, 0, 2, 0, 1, 0, 0, 3, 0, 1, 0, 0, 2, 0, 0, 1, 0, 4, 0, 1, 0, 0, 2, 0, 1, 0, 0,
  3, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 3, 1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 1, 0,
];

const ACTIVITY_GRAPH = Array.from({ length: 27 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ACTIVITY_SEED[(week * 7 + day) % ACTIVITY_SEED.length])
);

const activityColor = (level: number) => {
  switch (level) {
    case 0:
      return "var(--color-bg-base)";
    case 1:
      return "var(--color-accent-light)";
    case 2:
      return "var(--color-accent)";
    case 3:
      return "var(--color-accent-hover)";
    default:
      return "var(--color-accent-pressed)";
  }
};

export const AppDashboardMockup = () => {
  return (
    <div className="w-full h-[440px] overflow-hidden bg-[var(--color-bg-base)] p-4 flex flex-col gap-4">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-2 gap-4 h-1/2 items-center min-h-0">
        <div className="flex flex-col items-center justify-center h-full gap-2 min-w-0">
          <p className="text-[var(--color-text-primary)] text-3xl font-bold leading-tight text-center">
            Good morning
          </p>
          <p className="text-[var(--color-text-muted)] text-sm italic font-light text-center max-w-[260px]">
            "Make something people want." — Paul Graham
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-default)] p-3 h-full flex flex-col min-w-0 min-h-0">
          <div className="flex flex-row gap-3 h-full min-h-0">
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <h3 className="text-[var(--color-text-primary)] text-sm font-semibold">This week</h3>
              {MOCK_EVENTS_THIS_WEEK.map((event) => (
                <div
                  key={event.title}
                  className="bg-[var(--color-bg-elevated)] px-2 rounded-md border border-[var(--color-border-default)] h-9 flex items-center justify-between gap-2"
                >
                  <p className="text-[10px] text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{event.title}</p>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
              ))}
            </div>

            <div className="w-px bg-[var(--color-border-default)]" />

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--color-text-primary)] text-sm font-semibold">Next week</h3>
                <RefreshCw size={12} style={{ color: "var(--color-text-disabled)" }} />
              </div>
              {MOCK_EVENTS_NEXT_WEEK.map((event) => (
                <div
                  key={event.title}
                  className="bg-[var(--color-bg-elevated)] px-2 rounded-md border border-[var(--color-border-default)] h-9 flex items-center justify-between gap-2"
                >
                  <p className="text-[10px] text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{event.title}</p>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-4 h-1/2 min-h-0">
        {/* New messages (Gmail) */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-default)] p-3 h-full flex flex-col gap-2 min-w-0 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[var(--color-text-primary)] text-sm font-semibold">New messages</h3>
            <RefreshCw size={13} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="flex flex-col gap-2 overflow-hidden">
            {MOCK_EMAILS.map((email) => (
              <div
                key={email.subject}
                className="bg-[var(--color-bg-elevated)] px-2 rounded-md border border-[var(--color-border-default)] h-9 flex items-center justify-between gap-2"
              >
                <div className="flex-1 flex flex-col min-w-0">
                  <p className={`text-xs truncate ${email.unread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {email.sender}
                  </p>
                  <p className={`text-[10px] truncate ${email.unread ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {email.subject}
                  </p>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{email.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Priority tasks */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-default)] p-3 h-full flex flex-col gap-2 min-w-0 min-h-0">
          <h3 className="text-[var(--color-text-primary)] text-sm font-semibold">Priority tasks</h3>
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {MOCK_TASKS.map((task) => (
              <div
                key={task.title}
                className="bg-[var(--color-bg-elevated)] px-2 rounded-md border border-[var(--color-border-default)] h-9 flex items-center justify-between gap-2 border-l-2"
                style={{ borderLeftColor: priorityColor[task.priority] }}
              >
                <p className="text-xs font-medium text-[var(--color-text-primary)] truncate flex-1 min-w-0">{task.title}</p>
                <div
                  className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-white"
                  style={{ backgroundColor: columnColor[task.column] }}
                >
                  {task.column}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily streak */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-default)] p-3 h-full flex flex-col gap-2 min-w-0 min-h-0">
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">12</p>
            <div className="flex flex-col gap-0 leading-tight">
              <p className="text-[10px] font-semibold text-[var(--color-text-primary)] uppercase">Day</p>
              <p className="text-[10px] font-semibold text-[var(--color-text-primary)] uppercase">Streak</p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-text-disabled)] text-center">Today's activity: 5 actions</p>
          <div className="flex flex-col items-center justify-center gap-1.5 flex-1 min-h-0 min-w-0 overflow-hidden">
            <div className="flex gap-px justify-center min-w-0">
              {ACTIVITY_GRAPH.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-px">
                  {week.map((level, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className="w-1 h-1 rounded-[1px]"
                      style={{ backgroundColor: activityColor(level) }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1 text-[9px] text-[var(--color-text-disabled)]">
              <span>Less</span>
              <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)" }} />
              <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--color-accent-light)" }} />
              <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--color-accent)" }} />
              <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--color-accent-hover)" }} />
              <div className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--color-accent-pressed)" }} />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
