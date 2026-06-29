"use client";

import React from "react";
import { RefreshCw, MoreVertical } from "lucide-react";

/**
 * This mirrors the real dashboard's markup (components/app/app-dashboard.tsx,
 * gmail-inbox.tsx, priority-tasks.tsx, daily-streak.tsx) almost verbatim —
 * same classes, same proportions — rendered at full size and scaled down via
 * CSS transform, so it reads as a faithful miniature screenshot rather than
 * a redesigned mockup with its own ad-hoc spacing.
 */

const MOCK_EVENTS_THIS_WEEK = [
  { time: "09:00 AM", title: "Team Standup" },
  { time: "02:30 PM", title: "Code Review" },
  { time: "04:00 PM", title: "Client Call — Acme Co" },
];

const MOCK_EVENTS_NEXT_WEEK = [
  { time: "10:00 AM", title: "Design Review" },
  { time: "11:30 AM", title: "Client Meeting" },
];

const MOCK_EMAILS = [
  { sender: "Sarah Chen", subject: "Re: Website Redesign — final assets", date: "9:14 AM", unread: true },
  { sender: "Stripe", subject: "Your invoice is ready", date: "8:02 AM", unread: true },
  { sender: "John Smith", subject: "Kickoff call notes", date: "Yesterday", unread: false },
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

const DESIGN_WIDTH = 1400;
const DESIGN_HEIGHT = 760;
const SCALE = 0.62;

export const AppDashboardMockup = () => {
  return (
    <div
      className="overflow-hidden bg-[var(--color-bg-base)]"
      style={{ width: DESIGN_WIDTH * SCALE, height: DESIGN_HEIGHT * SCALE }}
    >
      <div
        className="bg-[var(--color-bg-base)] p-8 flex flex-col gap-8"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
        }}
      >
        {/* Top Section - 2 Columns */}
        <div className="grid grid-cols-2 gap-8 h-1/2 items-center">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-[var(--color-text-primary)] text-6xl font-bold leading-tight text-center">
              Good morning
            </p>
            <p className="text-[var(--color-text-muted)] text-base italic font-light max-w-lg text-center">
              "Make something people want." — Paul Graham
            </p>
          </div>

          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col">
            <div className="flex flex-row gap-6 h-full">
              <div className="flex-1 flex flex-col gap-3">
                <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">This week</h3>
                <div className="flex flex-col gap-3">
                  {MOCK_EVENTS_THIS_WEEK.map((event) => (
                    <div
                      key={event.title}
                      className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3"
                    >
                      <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                      <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1">{event.title}</p>
                      <MoreVertical size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-px bg-[var(--color-border-default)]" />

              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">Next week</h3>
                  <RefreshCw size={14} style={{ color: "var(--color-text-disabled)" }} />
                </div>
                <div className="flex flex-col gap-3">
                  {MOCK_EVENTS_NEXT_WEEK.map((event) => (
                    <div
                      key={event.title}
                      className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3"
                    >
                      <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                      <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1">{event.title}</p>
                      <MoreVertical size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - 3 Cards */}
        <div className="grid grid-cols-3 gap-8 h-1/2">
          {/* New messages (Gmail) */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">New messages</h3>
              <RefreshCw size={20} className="text-[var(--color-text-muted)]" />
            </div>
            <div className="flex flex-col gap-3 overflow-hidden">
              {MOCK_EMAILS.map((email) => (
                <div
                  key={email.subject}
                  className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <p className={`truncate ${email.unread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {email.sender}
                    </p>
                    <p className={`text-xs truncate ${email.unread ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                      {email.subject}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{email.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority tasks */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col">
            <h3 className="text-[var(--color-text-primary)] text-xl font-semibold mb-4">Priority tasks</h3>
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              {MOCK_TASKS.map((task) => (
                <div
                  key={task.title}
                  className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3 border-l-4"
                  style={{ borderLeftColor: priorityColor[task.priority] }}
                >
                  <p className="font-medium text-[var(--color-text-primary)] truncate flex-1 min-w-0">{task.title}</p>
                  <div
                    className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 text-white"
                    style={{ backgroundColor: columnColor[task.column] }}
                  >
                    {task.column}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily streak */}
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-5">
            <div className="flex items-center justify-center gap-6 w-full">
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-8xl font-bold text-[var(--color-text-primary)] leading-none">12</p>
                <div className="flex flex-col gap-0.5">
                  <p className="text-lg font-semibold text-[var(--color-text-primary)] uppercase">Day</p>
                  <p className="text-lg font-semibold text-[var(--color-text-primary)] uppercase">Streak</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-disabled)]">Today's activity: 5 actions</p>
            <div className="flex flex-col gap-3 items-center flex-1 min-h-0 min-w-0 overflow-hidden">
              <div className="flex gap-[3px] justify-center flex-1 min-h-0 min-w-0">
                {ACTIVITY_GRAPH.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((level, dayIdx) => (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]"
                        style={{ backgroundColor: activityColor(level) }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs text-[var(--color-text-disabled)]">
                <span>Less</span>
                <div className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-bg-base)" }} />
                <div className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-accent-light)" }} />
                <div className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-accent)" }} />
                <div className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-accent-hover)" }} />
                <div className="w-2 h-2 rounded-sm border border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-accent-pressed)" }} />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
