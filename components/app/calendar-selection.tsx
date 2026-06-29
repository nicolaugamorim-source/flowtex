"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Calendar {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
}

interface CalendarSelectionProps {
  onComplete?: () => void;
}

export const CalendarSelection = ({ onComplete }: CalendarSelectionProps) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await fetch("/api/calendar/list");
        const data = await response.json();

        if (response.ok && data.calendars) {
          // Sort calendars: primary first, then alphabetically by summary
          const sortedCalendars = [...data.calendars].sort((a: Calendar, b: Calendar) => {
            if (a.primary) return -1;
            if (b.primary) return 1;
            return (a.summary || "").localeCompare(b.summary || "");
          });

          setCalendars(sortedCalendars);

          // Pre-select primary calendar only
          const primaryCalendar = sortedCalendars.find((cal: Calendar) => cal.primary);
          if (primaryCalendar) {
            setSelectedIds([primaryCalendar.id]);
            console.log("[CALENDAR SELECTION] Primary calendar pre-selected:", primaryCalendar.summary);
          }
        } else {
          setError(data.error || "Failed to load calendars");
        }
      } catch (err) {
        console.error("Failed to fetch calendars:", err);
        setError("Failed to load calendars");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendars();
  }, []);

  const toggleCalendar = (calendarId: string) => {
    setSelectedIds((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Please select at least one calendar");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/calendar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarIds: selectedIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save calendars");
      }

      console.log("Calendars saved successfully");
      onComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save calendars";
      console.error("Failed to save calendars:", err);
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-12 h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-border-default)] border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading your calendars...</p>
        </div>
      </div>
    );
  }

  if (error && calendars.length === 0) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-12 h-full flex flex-col items-center justify-center text-center gap-4">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-[var(--color-text-muted)] text-sm">
          Please try connecting Google Calendar again from integrations
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-8 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-[var(--color-text-primary)] text-2xl font-bold mb-2">Choose your calendars</h2>
        <p className="text-[var(--color-text-muted)] text-sm">
          Flowtex will only show events from calendars you select.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-6 space-y-3">
        {calendars.map((calendar) => (
          <button
            key={calendar.id}
            onClick={() => toggleCalendar(calendar.id)}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border-2 border-[var(--color-border-default)] hover:border-indigo-400 transition-colors text-left"
          >
            <div className="flex-shrink-0">
              {selectedIds.includes(calendar.id) ? (
                <CheckCircle2 size={24} className="text-[var(--color-accent)]" />
              ) : (
                <Circle size={24} className="text-[var(--color-border-default)]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {calendar.backgroundColor && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.backgroundColor }}
                  />
                )}
                <p className="font-semibold text-[var(--color-text-primary)] truncate">
                  {calendar.summary}
                </p>
                {calendar.primary && (
                  <span className="text-xs bg-[var(--color-accent)] text-[var(--color-text-primary)] font-semibold px-2 py-1 rounded flex-shrink-0">
                    (Primary)
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={selectedIds.length === 0 || isSaving}
        className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-text-primary)] font-semibold h-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save and continue"}
      </Button>
    </div>
  );
};
