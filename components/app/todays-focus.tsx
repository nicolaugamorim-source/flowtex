"use client";

import React from "react";
import { Calendar, Mail } from "lucide-react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
}

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  isUnread: boolean;
}

interface FocusItem {
  id: string;
  type: "event" | "email";
  time: string;
  title: string;
  icon: React.ReactNode;
  badge: string;
  rawTime?: Date;
}

interface TodaysFocusProps {
  thisWeekEvents: CalendarEvent[];
  gmailMessages: GmailMessage[];
  isLoading: boolean;
}

const formatEventTime = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center gap-3">
        <div className="h-4 w-4 bg-[var(--color-border-default)] rounded flex-shrink-0" />
        <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded" />
        <div className="h-3 w-12 bg-[var(--color-border-default)] rounded flex-shrink-0" />
      </div>
    ))}
  </div>
);

const FocusItemCard = ({ item }: { item: FocusItem }) => (
  <div className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="text-[var(--color-text-muted)] flex-shrink-0">{item.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--color-text-primary)] truncate">{item.title}</p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">{item.badge}</p>
      </div>
    </div>
    <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{item.time}</p>
  </div>
);

export const TodaysFocus = ({ thisWeekEvents, gmailMessages, isLoading }: TodaysFocusProps) => {
  const today = new Date().toDateString();

  // Get today's events
  const todayEvents = thisWeekEvents
    .filter((e) => new Date(e.start?.dateTime ?? e.start?.date).toDateString() === today)
    .map((event) => ({
      id: event.id,
      type: "event" as const,
      time: formatEventTime(event.start?.dateTime),
      title: event.summary,
      icon: <Calendar size={18} />,
      badge: "Meeting",
      rawTime: new Date(event.start?.dateTime ?? event.start?.date),
    }));

  // Get 2 most recent unread emails
  const unreadEmails = gmailMessages
    .filter((m) => m.isUnread)
    .slice(0, 2)
    .map((message) => ({
      id: message.id,
      type: "email" as const,
      time: message.date,
      title: message.subject,
      icon: <Mail size={18} />,
      badge: "Email",
    }));

  // Combine and sort by time (events first, then emails)
  const focusItems: FocusItem[] = [
    ...todayEvents,
    ...unreadEmails,
  ]
    .sort((a, b) => {
      if (a.type === "event" && b.type !== "event") return -1;
      if (a.type !== "event" && b.type === "event") return 1;
      if (a.rawTime && b.rawTime) {
        return a.rawTime.getTime() - b.rawTime.getTime();
      }
      return 0;
    })
    .slice(0, 4);

  const moreCount = Math.max(0, todayEvents.length + unreadEmails.length - 4);

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-3">
      <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">Today's focus</h3>

      <div style={{ height: "320px" }} className="flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="overflow-y-auto flex-1">
            <SkeletonLoader />
          </div>
        ) : focusItems.length > 0 ? (
          <div className="overflow-y-auto flex-1">
            <div className="flex flex-col gap-3">
              {focusItems.map((item) => (
                <FocusItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
            {moreCount > 0 && (
              <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
                +{moreCount} more for today
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-muted)] text-sm">Nothing urgent today</p>
          </div>
        )}
      </div>
    </div>
  );
};
