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
      window.dispatchEvent(new CustomEvent("flowtex:dashboard-guide-calendars-saved"));
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
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-8)] h-full flex flex-col animate-pulse">
        <div className="mb-[var(--space-6)]">
          <div className="h-6 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-56 mb-[var(--space-2)]"></div>
          <div className="h-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-72"></div>
        </div>

        {/* Ghost calendar rows — mirror the real checkbox rows exactly */}
        <div className="flex-1 overflow-y-auto mb-[var(--space-6)] space-y-[var(--space-3)]">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full flex items-center gap-[var(--space-3)] p-[var(--space-4)] rounded-[var(--radius-md)] border-2 border-[var(--color-border-default)]"
              style={{ backgroundColor: "var(--color-surface-2)" }}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-bg-elevated)]"></div>
              <div className="flex-1 min-w-0 flex items-center gap-[var(--space-2)]">
                <div className="w-3 h-3 rounded-full bg-[var(--color-bg-elevated)] flex-shrink-0"></div>
                <div className="h-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ width: `${50 - i * 5}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full h-10 bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)]"></div>
      </div>
    );
  }

  if (error && calendars.length === 0) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-12)] h-full flex flex-col items-center justify-center text-center gap-[var(--space-4)]">
        <p className="font-medium" style={{ color: "var(--color-error)" }}>{error}</p>
        <p className="text-[var(--color-text-muted)] text-[length:var(--text-sm)]">
          Please try connecting Google Calendar again from integrations
        </p>
      </div>
    );
  }

  return (
    <div data-onboarding="calendar-selection-card" className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-8)] h-full flex flex-col">
      <div className="mb-[var(--space-6)]">
        <h2 className="text-[var(--color-text-primary)] text-[length:var(--text-2xl)] font-bold mb-[var(--space-2)]">Choose your calendars</h2>
        <p className="text-[var(--color-text-muted)] text-[length:var(--text-sm)]">
          Flowtex will only show events from calendars you select.
        </p>
      </div>

      {error && (
        <div className="mb-[var(--space-4)] p-[var(--space-3)] rounded-[var(--radius-md)]" style={{ backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)" }}>
          <p className="text-[length:var(--text-sm)]" style={{ color: "var(--color-error)" }}>{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-[var(--space-6)] space-y-[var(--space-3)]">
        {calendars.map((calendar) => (
          <button
            key={calendar.id}
            onClick={() => toggleCalendar(calendar.id)}
            className="w-full flex items-center gap-[var(--space-3)] p-[var(--space-4)] rounded-[var(--radius-md)] border-2 border-[var(--color-border-default)] transition-colors text-left" style={{ backgroundColor: "var(--color-surface-2)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-default)")}
          >
            <div className="flex-shrink-0">
              {selectedIds.includes(calendar.id) ? (
                <CheckCircle2 size={24} className="text-[var(--color-accent)]" />
              ) : (
                <Circle size={24} className="text-[var(--color-border-default)]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[var(--space-2)]">
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
                  <span className="text-[length:var(--text-xs)] bg-[var(--color-accent)] text-[var(--color-text-primary)] font-semibold px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)] flex-shrink-0">
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
