"use client";

import React from "react";
import { Mail, Calendar, FileText } from "lucide-react";

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

interface Note {
  id: string;
  content: string;
  is_done: boolean;
}

interface AtAGlanceProps {
  thisWeekEvents: CalendarEvent[];
  gmailMessages: GmailMessage[];
  quickNotes: Note[];
}

const MetricBlock = ({
  icon,
  number,
  label,
}: {
  icon: React.ReactNode;
  number: number;
  label: string;
}) => (
  <div className="flex items-start gap-4 flex-1">
    <div className="text-[var(--color-accent)] flex-shrink-0">{icon}</div>
    <div className="flex-1">
      <p className="text-[32px] font-bold text-[var(--color-text-primary)] leading-none">{number}</p>
      <p className="text-[12px] text-[var(--color-text-disabled)] mt-1">{label}</p>
    </div>
  </div>
);

export const AtAGlance = ({
  thisWeekEvents,
  gmailMessages,
  quickNotes,
}: AtAGlanceProps) => {
  // Calculate unread emails
  const unreadCount = gmailMessages.filter((e) => e.isUnread).length;

  // Calculate meetings today
  const today = new Date().toDateString();
  const meetingsToday = thisWeekEvents.filter((e) => {
    const dateString = e.start?.dateTime ?? e.start?.date;
    if (!dateString) return false;
    return new Date(dateString).toDateString() === today;
  }).length;

  // Calculate undone notes
  const notesCount = quickNotes.filter((n) => !n.is_done).length;

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col justify-center">
      <h3 className="text-[var(--color-text-primary)] text-xl font-semibold mb-8">At a glance</h3>

      <div className="flex gap-8">
        <MetricBlock icon={<Mail size={20} />} number={unreadCount} label="Unread emails" />
        <MetricBlock
          icon={<Calendar size={20} />}
          number={meetingsToday}
          label="Meetings today"
        />
        <MetricBlock
          icon={<FileText size={20} />}
          number={notesCount}
          label="Notes"
        />
      </div>
    </div>
  );
};
