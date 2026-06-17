"use client";

import React, { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { useAppCache } from "@/lib/app-cache";
import { Skeleton } from "@/components/ui/skeleton";
import { activityEventTarget } from "@/lib/activity-tracker";

interface StreakData {
  streak_count: number;
  longest_streak: number;
  last_active_date: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
}

interface Note {
  id: string;
  content: string;
  is_done: boolean;
  created_at?: string;
}

const MILESTONE_MESSAGES: Record<string, string[]> = {
  "1": [
    "First day. The hardest one.",
    "Day one begins. You got this.",
    "Every expert started here."
  ],
  "3": [
    "3 days in. Building a habit.",
    "Three's the magic number.",
    "Momentum is building."
  ],
  "7": [
    "One week straight.",
    "Seven days. You're unstoppable.",
    "A full week of consistency."
  ],
  "14": [
    "Two weeks. You're consistent.",
    "Half a month. Impressive.",
    "Fourteen days of discipline."
  ],
  "30": [
    "30 days. Most people quit before this.",
    "A full month. You're serious.",
    "Thirty days of dedication."
  ],
  "60": [
    "Two months. This is who you are now.",
    "Sixty days. It's a lifestyle.",
    "Two months in. Unstoppable."
  ],
  "90": [
    "90 days. Rare.",
    "Three months of excellence.",
    "Ninety days. Legendary status."
  ]
};

const getMessageOptions = (streak: number): string[] => {
  let options = MILESTONE_MESSAGES[streak.toString()];

  if (!options) {
    options = [
      "Keep it going.",
      "Another day, another win.",
      "Consistency pays off."
    ];
  }

  return options;
};

const getDailyPhrase = (streak: number): string => {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `flowtex_phrase_${today}_${streak}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return cached;
  }

  const options = getMessageOptions(streak);
  const randomPhrase = options[Math.floor(Math.random() * options.length)];

  localStorage.setItem(cacheKey, randomPhrase);

  return randomPhrase;
};

const getDayOfWeekName = (dayIndex: number): string => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames[dayIndex];
};

const getColorForActivityCount = (count: number, isToday: boolean, isFuture: boolean): { bg: string; border: string } => {
  if (isFuture) {
    return { bg: "transparent", border: "border border-[var(--color-border-default)]" };
  }

  if (isToday && count === 0) {
    return { bg: "var(--color-bg-base)", border: "border-[1.5px] border-[var(--color-accent)]" };
  }

  switch (true) {
    case count >= 1 && count <= 2:
      return { bg: "var(--color-accent-light)", border: "border border-[var(--color-border-default)]" };
    case count >= 3 && count <= 5:
      return { bg: "var(--color-accent)", border: "border border-[var(--color-border-default)]" };
    case count >= 6 && count <= 9:
      return { bg: "var(--color-accent-hover)", border: "border border-[var(--color-border-default)]" };
    case count >= 10:
      return { bg: "var(--color-accent-pressed)", border: "border border-[var(--color-border-default)]" };
    default:
      return { bg: "var(--color-bg-base)", border: "border border-[var(--color-border-default)]" };
  }
};

interface DayData {
  date: string;
  actionCount: number;
  isToday: boolean;
  isFuture: boolean;
  dayOfWeek: number;
  dayNum: number;
  month: string;
}

interface WeekData {
  weekStartDate: string;
  days: DayData[];
  monthLabel: string | null;
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const getLast27Weeks = (
  activityHistory: Map<string, number>
): WeekData[] => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayDayOfWeek = today.getDay();
  const daysSinceSunday = todayDayOfWeek;

  const weeks: WeekData[] = [];

  for (let weekOffset = 26; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysSinceSunday - weekOffset * 7);

    const weekDays: DayData[] = [];
    let monthLabel: string | null = null;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0];
      const isFuture = dateStr > todayStr;
      const actionCount = activityHistory.get(dateStr) || 0;
      const dayNum = date.getDate();
      const month = date.toLocaleString("default", { month: "long" });

      if (dayNum === 1 && dayOffset === 0) {
        monthLabel = month;
      }

      if (weekOffset > 0 || dateStr <= todayStr) {
        weekDays.push({
          date: dateStr,
          actionCount,
          isToday: dateStr === todayStr,
          isFuture,
          dayOfWeek: dayOffset,
          dayNum,
          month,
        });
      }
    }

    if (weekDays.length > 0) {
      weeks.push({
        weekStartDate: weekStart.toISOString().split("T")[0],
        days: weekDays,
        monthLabel,
      });
    }
  }

  return weeks;
};


const checkAndResetDailyCounters = () => {
  const today = new Date().toDateString();
  const lastResetDate = localStorage.getItem("flowtex_daily_reset_date");

  if (lastResetDate !== today) {
    localStorage.setItem("flowtex_emails_read_today", "0");
    localStorage.setItem("flowtex_daily_reset_date", today);
  }
};

const getTodaysActivityCount = (thisWeekEvents: CalendarEvent[], quickNotes: Note[]): number => {
  checkAndResetDailyCounters();
  const today = new Date().toDateString();

  let count = 0;

  const emailsReadToday = parseInt(localStorage.getItem("flowtex_emails_read_today") || "0", 10);
  count += emailsReadToday;

  const eventsToday = thisWeekEvents.filter((e) => {
    const eventDate = new Date(e.start?.dateTime ?? e.start?.date).toDateString();
    return eventDate === today;
  }).length;
  count += eventsToday;

  const notesToday = quickNotes.filter((n) => {
    if (!n.created_at) return false;
    const noteDate = new Date(n.created_at).toDateString();
    return noteDate === today;
  }).length;
  count += notesToday;

  return count;
};

const calculateDayStreak = (activityHistory: Map<string, number>): number => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todayActions = activityHistory.get(todayStr) || 0;

  let streak = todayActions > 0 ? 1 : 0;
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 1);
  let foundEmpty = false;

  for (let i = 0; i < 365; i++) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const actionCount = activityHistory.get(dateStr) || 0;

    if (actionCount > 0) {
      if (foundEmpty) {
        return streak;
      }
      streak++;
    } else {
      if (foundEmpty) {
        return streak;
      }
      foundEmpty = true;
    }

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
};

export const DailyStreak = () => {
  const { cache, setCache, isStale } = useAppCache();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [dailyPhrase, setDailyPhrase] = useState<string>("");
  const [todaysActivityCount, setTodaysActivityCount] = useState(0);
  const [thisWeekEvents, setThisWeekEvents] = useState<CalendarEvent[]>([]);
  const [quickNotes, setQuickNotes] = useState<Note[]>([]);
  const [activityHistory, setActivityHistory] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchStreak();
    fetchActivityData();
    fetchActivityHistory();
  }, []);

  useEffect(() => {
    const handleActivityChange = () => {
      fetchStreak();
      fetchActivityHistory();
      fetchActivityData();
    };

    activityEventTarget.addEventListener("activity:tracked", handleActivityChange);
    activityEventTarget.addEventListener("activity:removed", handleActivityChange);

    return () => {
      activityEventTarget.removeEventListener("activity:tracked", handleActivityChange);
      activityEventTarget.removeEventListener("activity:removed", handleActivityChange);
    };
  }, []);

  const fetchStreak = async () => {
    try {
      // Check cache first (60 min max age for streak)
      if (cache.streakData && !isStale("streakData", 60 * 60 * 1000)) {
        setStreak(cache.streakData);
        setDailyPhrase(getDailyPhrase(cache.streakData.streak_count));
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/streak");
      const data = await response.json();
      if (response.ok) {
        setStreak(data);
        setCache("streakData", data);
        setDailyPhrase(getDailyPhrase(data.streak_count));
      }
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivityData = async () => {
    let events: CalendarEvent[] = [];
    let notes: Note[] = [];

    try {
      const calendarResponse = await fetch("/api/calendar/dashboard-events");
      const calendarData = await calendarResponse.json();
      if (!calendarData.error) {
        events = calendarData.thisWeek ?? [];
        setThisWeekEvents(events);
      }
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    }

    try {
      const notesResponse = await fetch("/api/notes");
      const notesData = await notesResponse.json();
      if (notesData.notes) {
        notes = notesData.notes;
        setQuickNotes(notes);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }

    const activityCount = getTodaysActivityCount(events, notes);
    setTodaysActivityCount(activityCount);
  };

  const fetchActivityHistory = async () => {
    try {
      const response = await fetch("/api/activity/history");
      const data = await response.json();
      if (data.success && data.history) {
        const activityMap = new Map(Object.entries(data.history as Record<string, number>));
        setActivityHistory(activityMap);
      }
    } catch (err) {
      console.error("Failed to fetch activity history:", err);
    }
  };

  const handleShare = async () => {
    if (!streak) return;

    const weeks = getLast27Weeks(activityHistory);
    const graphText = weeks
      .map((week) =>
        week.days
          .map((day) => {
            if (day.isFuture) return "□";
            if (day.isToday && day.actionCount === 0) return "◇";
            if (day.actionCount >= 6) return "■";
            if (day.actionCount >= 1) return "▓";
            return "□";
          })
          .join("")
      )
      .join("\n");

    const dayStreak = calculateDayStreak(activityHistory);
    const text = `Day ${dayStreak} on Flowtex.

Today: ${activityCount} actions

${graphText}

${dailyPhrase}

flowtex.xyz #buildinpublic`;

    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-3">
        <div className="flex flex-col items-center gap-3">
          <Skeleton style={{ width: 80, height: 56, borderRadius: 8 }} />
          <Skeleton style={{ width: 160, height: 12, borderRadius: 4 }} />
          <div className="grid grid-cols-10 gap-1 mt-2">
            {Array(30).fill(0).map((_, i) => (
              <Skeleton key={i} style={{ width: 14, height: 14, borderRadius: 3 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weeks = getLast27Weeks(activityHistory);
  const today = new Date().toISOString().split("T")[0];
  const activityCount = activityHistory.get(today) || 0;

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-5 relative">
      {/* Top Section: Streak number + labels on left, phrase in center */}
      <div className="flex items-center justify-center gap-6 w-full">
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-8xl font-bold text-[var(--color-text-primary)] leading-none">{calculateDayStreak(activityHistory)}</p>
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-semibold text-[var(--color-text-primary)] uppercase">Day</p>
            <p className="text-lg font-semibold text-[var(--color-text-primary)] uppercase">Streak</p>
          </div>
        </div>

        <p className="text-lg font-bold text-[var(--color-text-primary)] flex-1 text-center">{dailyPhrase}</p>
      </div>

      {/* Today's Activity */}
      <div>
        <p className="text-sm text-[var(--color-text-disabled)]">Today's activity: {activityCount} actions</p>
      </div>

      {/* GitHub-style Activity Graph - Full Year */}
      <div className="flex flex-col gap-4 items-center">
        {/* Graph Container with Horizontal Scroll */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: "420px" }} className="flex gap-1 pb-4 justify-center">
            {/* Day Labels on the Left */}
            <div className="flex flex-col gap-1 mr-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <p key={day} className="text-xs text-[var(--color-text-disabled)] h-[14px] flex items-center">
                  {day}
                </p>
              ))}
            </div>

            {/* Grid Container */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {/* Week Column */}
                  {week.days.map((day, dayIdx) => {
                    const colors = getColorForActivityCount(day.actionCount, day.isToday, day.isFuture);
                    const dateObj = new Date(day.date);
                    const monthName = dateObj.toLocaleString("default", { month: "long" });
                    const dayNum = dateObj.getDate();
                    const suffix = getOrdinalSuffix(dayNum);
                    const tooltip = day.actionCount === 0
                      ? `No contributions on ${monthName} ${dayNum}${suffix}`
                      : `${day.actionCount} contribution${day.actionCount !== 1 ? "s" : ""} on ${monthName} ${dayNum}${suffix}`;

                    return (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        className={`transition-colors ${colors.border}`}
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "2px",
                          backgroundColor: colors.bg,
                        }}
                        title={tooltip}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 text-xs text-[var(--color-text-disabled)]">
          <span>Less</span>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-bg-base)", border: "1px solid var(--color-border-default)" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-accent-light)", border: "1px solid var(--color-border-default)" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-accent)", border: "1px solid var(--color-border-default)" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-accent-hover)", border: "1px solid var(--color-border-default)" }} />
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "var(--color-accent-pressed)", border: "1px solid var(--color-border-default)" }} />
          <span>More</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-disabled)]">Longest streak: {streak?.longest_streak ?? 0} days</p>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-[var(--color-text-primary)] text-white text-xs px-4 py-2 rounded-lg shadow-lg">
          Copied!
        </div>
      )}
    </div>
  );
};
