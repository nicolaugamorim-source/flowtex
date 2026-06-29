"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

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
  high: "var(--color-error)",
  medium: "var(--color-warning)",
  low: "var(--color-info)",
};

const columnColor: Record<string, string> = {
  "To Do": "var(--color-text-muted)",
  "In Progress": "var(--color-info)",
  Review: "var(--color-warning)",
};

const ACTIVITY_GRAPH = Array.from({ length: 17 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => {
    const seed = (week * 7 + day) % 11;
    if (seed < 4) return 0;
    if (seed < 7) return 1;
    if (seed < 9) return 2;
    return 3;
  })
);

const activityColor = (level: number) => {
  switch (level) {
    case 0:
      return "var(--color-bg-base)";
    case 1:
      return "var(--color-accent-light)";
    case 2:
      return "var(--color-accent)";
    default:
      return "var(--color-accent-hover)";
  }
};

export const AppDashboardMockup = () => {
  return (
    <div className="p-3 h-[380px] overflow-hidden bg-[var(--color-bg-base)] flex flex-col gap-3 text-[10px]">
      {/* Top Section - Greeting + Calendar */}
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-[var(--color-text-primary)] text-lg font-bold leading-tight">
            Good morning,<br />Nicolau
          </p>
          <p className="text-[var(--color-text-muted)] text-[9px] italic font-light max-w-[180px] mt-1">
            "Make something people want." — Paul Graham
          </p>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-2">
          <div className="flex flex-row gap-2">
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <h3 className="text-[var(--color-text-primary)] text-[10px] font-semibold">This week</h3>
              {MOCK_EVENTS_THIS_WEEK.map((event) => (
                <div
                  key={event.title}
                  className="bg-[var(--color-bg-elevated)] px-2 py-1.5 rounded-sm border border-[var(--color-border-default)] flex items-center justify-between gap-2"
                >
                  <p className="text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                  <p className="font-semibold text-[var(--color-text-primary)] truncate text-right">{event.title}</p>
                </div>
              ))}
            </div>

            <div className="w-px bg-[var(--color-border-default)]" />

            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-[var(--color-text-primary)] text-[10px] font-semibold">Next week</h3>
                <RefreshCw size={9} className="text-[var(--color-text-disabled)]" />
              </div>
              {MOCK_EVENTS_NEXT_WEEK.map((event) => (
                <div
                  key={event.title}
                  className="bg-[var(--color-bg-elevated)] px-2 py-1.5 rounded-sm border border-[var(--color-border-default)] flex items-center justify-between gap-2"
                >
                  <p className="text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{event.time}</p>
                  <p className="font-semibold text-[var(--color-text-primary)] truncate text-right">{event.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards, mirrors the real dashboard's Gmail / Tasks / Streak */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        {/* New messages */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-2 flex flex-col gap-1.5 min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[var(--color-text-primary)] font-semibold">New messages</h3>
            <RefreshCw size={9} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {MOCK_EMAILS.map((email) => (
              <div
                key={email.subject}
                className="bg-[var(--color-bg-elevated)] p-1.5 rounded-sm border border-[var(--color-border-default)] flex items-center justify-between gap-1.5"
              >
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <p className={`truncate ${email.unread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {email.sender}
                  </p>
                  <p className={`truncate ${email.unread ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
                    {email.subject}
                  </p>
                </div>
                <p className="text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{email.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Priority tasks */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-2 flex flex-col gap-1.5 min-h-0">
          <h3 className="text-[var(--color-text-primary)] font-semibold">Priority tasks</h3>
          <div className="flex flex-col gap-1.5 overflow-hidden">
            {MOCK_TASKS.map((task) => (
              <div
                key={task.title}
                className="bg-[var(--color-bg-elevated)] p-1.5 rounded-sm border border-[var(--color-border-default)] border-l-2 flex items-center justify-between gap-1.5"
                style={{ borderLeftColor: priorityColor[task.priority] }}
              >
                <p className="font-medium text-[var(--color-text-primary)] truncate flex-1 min-w-0">{task.title}</p>
                <span
                  className="font-medium px-1 py-0.5 rounded-full flex-shrink-0 text-white text-[8px]"
                  style={{ backgroundColor: columnColor[task.column] }}
                >
                  {task.column}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily streak */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-2 flex flex-col gap-1.5 min-h-0">
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">12</p>
            <div className="flex flex-col gap-0 leading-none">
              <p className="text-[8px] font-semibold text-[var(--color-text-primary)] uppercase">Day</p>
              <p className="text-[8px] font-semibold text-[var(--color-text-primary)] uppercase">Streak</p>
            </div>
          </div>
          <p className="text-[var(--color-text-disabled)] text-center">Today's activity: 5 actions</p>
          <div className="flex gap-[2px] justify-center overflow-hidden">
            {ACTIVITY_GRAPH.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[2px]">
                {week.map((level, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    style={{ width: "5px", height: "5px", borderRadius: "1px", backgroundColor: activityColor(level) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
