"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useAppCache } from "@/lib/app-cache";
import { useFitCount } from "@/lib/use-fit-count";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarSelection } from "./calendar-selection";
import { GmailInbox } from "./gmail-inbox";
import { DailyStreak } from "./daily-streak";
import { PriorityTasks } from "./priority-tasks";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { setCalendarsConfiguredFlag } from "@/lib/dashboard-guide";

const FALLBACK_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Move fast and learn things.", author: "Paul Graham" },
  { text: "Escape competition through authenticity.", author: "Naval Ravikant" },
  { text: "Do things that don't scale.", author: "Paul Graham" },
  { text: "Make something people want.", author: "Paul Graham" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  const midnight = [
    "Still up?",
    "Burning the midnight oil.",
    "The quiet hours.",
    "Late night mode.",
    "Everyone else is asleep.",
  ];

  const earlyMorning = [
    "Early bird.",
    "You're up early.",
    "Most people aren't awake yet.",
    "The best hours of the day.",
    "Head start activated.",
  ];

  const morning = isWeekend
    ? [
        "Weekend morning.",
        "Even on weekends.",
        "No days off, huh.",
        "Saturday grind.",
        "Sunday founder mode.",
      ]
    : [
        "Good morning,",
        "Back to work,",
        "Morning,",
        "Let's get into it,",
        "Ready to build,",
        "Another day,",
      ];

  const midday = [
    "Good afternoon,",
    "Halfway there,",
    "Midday check-in,",
    "Keep going,",
    "Lunchtime? Maybe later,",
  ];

  const afternoon = [
    "Afternoon,",
    "Still at it,",
    "Deep work hours,",
    "Focused mode,",
    "Good afternoon,",
  ];

  const evening = [
    "Evening,",
    "Good evening,",
    "Winding down?",
    "End of day push,",
    "Almost done,",
  ];

  const night = [
    "Working late,",
    "Night mode,",
    "Late session,",
    "Night owl,",
    "One more thing,",
  ];

  if (hour >= 0 && hour < 4) return pickDaily(midnight, hour);
  if (hour >= 4 && hour < 8) return pickDaily(earlyMorning, hour);
  if (hour >= 8 && hour < 12) return pickDaily(morning, hour);
  if (hour >= 12 && hour < 14) return pickDaily(midday, hour);
  if (hour >= 14 && hour < 18) return pickDaily(afternoon, hour);
  if (hour >= 18 && hour < 21) return pickDaily(evening, hour);
  return pickDaily(night, hour);
};

const pickDaily = (phrases: string[], hour: number): string => {
  const block = Math.floor(hour / 4);
  const today = new Date().toDateString();
  const key = `flowtex_greeting_${today}_${block}`;

  const cached = localStorage.getItem(key);
  if (cached) return cached;

  const picked = phrases[Math.floor(Math.random() * phrases.length)];
  localStorage.setItem(key, picked);

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith("flowtex_greeting_") && !k.includes(today)) {
      localStorage.removeItem(k);
    }
  }

  return picked;
};

const useQuoteOfDay = () => {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const cached = localStorage.getItem("quote_of_day");
    const cachedDate = localStorage.getItem("quote_of_day_date");

    if (cached && cachedDate === today) {
      setQuote(JSON.parse(cached));
      return;
    }

    fetch("https://zenquotes.io/api/random")
      .then((res) => res.json())
      .then((data) => {
        if (data[0]) {
          const q = { text: data[0].q, author: data[0].a.replace(/,$/g, "") };
          setQuote(q);
          localStorage.setItem("quote_of_day", JSON.stringify(q));
          localStorage.setItem("quote_of_day_date", today);
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch(() => {
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(fallback);
        localStorage.setItem("quote_of_day", JSON.stringify(fallback));
        localStorage.setItem("quote_of_day_date", today);
      });
  }, []);

  return quote;
};

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

const EventCard = ({ event }: { event: CalendarEvent }) => {
  const startTime = event.start?.dateTime
    ? new Date(event.start.dateTime).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "All day";

  const title = event.summary ?? "Untitled event";

  return (
    <div className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[length:var(--text-sm)] h-16 flex items-center justify-between gap-[var(--space-3)]">
      <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{startTime}</p>
      <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1">{title}</p>
      <MoreVertical size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-[var(--space-2)]">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-[var(--space-3)] mb-[var(--space-2)]">
        <Skeleton style={{ width: 48, height: 12, borderRadius: "var(--radius-sm)" }} />
        <Skeleton style={{ flex: 1, height: 12, borderRadius: "var(--radius-sm)" }} />
      </div>
    ))}
  </div>
);

const getUpcomingEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return events.filter((event) => {
    const dateString = event.start.dateTime ?? event.start.date;
    if (!dateString) return false;
    const startTime = new Date(dateString);
    // Include events from today onwards
    return startTime >= today;
  });
};

const NoEventsPlaceholder = ({ googleConnected, height = "h-full" }: { googleConnected: boolean; height?: string }) => {
  if (!googleConnected) {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-[var(--space-4)] ${height}`}>
        <p className="text-[var(--color-text-muted)] text-[length:var(--text-sm)] mb-[var(--space-3)]">Google Calendar not connected</p>
        <Link href="/app/integrations" className="text-[var(--color-accent)] text-[length:var(--text-xs)] font-medium hover:underline">
          Connect Calendar
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${height}`}>
      <p className="text-[var(--color-text-muted)] text-[length:var(--text-sm)]">No upcoming events this week</p>
    </div>
  );
};

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  isUnread: boolean;
}

export const AppDashboard = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { cache, setCache, isStale } = useAppCache();
  const quote = useQuoteOfDay();
  const [thisWeekEvents, setThisWeekEvents] = useState<CalendarEvent[]>([]);
  const [nextWeekEvents, setNextWeekEvents] = useState<CalendarEvent[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const { ref: thisWeekRef, count: thisWeekFitCount } = useFitCount<HTMLDivElement>(4, [isLoading, isReloading]);
  const { ref: nextWeekRef, count: nextWeekFitCount } = useFitCount<HTMLDivElement>(4, [isLoading, isReloading]);
  const [minLoadDone, setMinLoadDone] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [calendarsConfigured, setCalendarsConfigured] = useState<boolean | null>(null);
  const [greeting, setGreeting] = useState<string>("");
  const [userName, setUserName] = useState<string>("there");

  // Let the onboarding guide know as soon as we know, instead of it having to poll the DOM.
  useEffect(() => {
    setCalendarsConfiguredFlag(calendarsConfigured);
  }, [calendarsConfigured]);

  // Minimum 300ms loading state to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadDone(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Load user name and set initial greeting
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try user metadata first (from Google OAuth)
          const fullName = user.user_metadata?.full_name ?? "";
          const firstName = fullName.split(" ")[0] || "there";
          setUserName(firstName);

          // Also try loading from profiles table as fallback
          if (!firstName || firstName === "there") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .single();

            if (profile?.full_name) {
              setUserName(profile.full_name.split(" ")[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user name:", error);
      }
    };

    loadUserName();
    setGreeting(getGreeting());
  }, []);

  // Update greeting every 4 hours
  useEffect(() => {
    const now = new Date();
    const minutesUntilNextBlock = (4 - (now.getHours() % 4)) * 60 - now.getMinutes();
    const msUntilNextBlock = minutesUntilNextBlock * 60 * 1000;

    const timeout = setTimeout(() => {
      setGreeting(getGreeting());
    }, msUntilNextBlock);

    return () => clearTimeout(timeout);
  }, [greeting]);

  const fetchEmailsBackground = useCallback(async () => {
    try {
      const gmailResponse = await fetch("/api/gmail/inbox");
      const gmailData = await gmailResponse.json();

      if (gmailData.messages) {
        setCache("inboxEmails", gmailData.messages);
      }
    } catch (err) {
      console.error("Failed to fetch emails in background:", err);
    }
  }, [setCache]);

  useEffect(() => {
    const fetchIntegrationAndEvents = async () => {
      try {
        // First check if calendars are configured
        const integrationResponse = await fetch("/api/user/integrations");
        const integrationData = await integrationResponse.json();

        if (integrationData.integrations && integrationData.integrations.length > 0) {
          const googleIntegration = integrationData.integrations.find(
            (i: any) => i.provider === "google"
          );

          if (googleIntegration) {
            setCalendarsConfigured(googleIntegration.calendars_configured ?? false);
            setGoogleConnected(true);

            // Only fetch events if calendars are configured
            if (googleIntegration.calendars_configured) {
              fetchEvents();
            }
          } else {
            setGoogleConnected(false);
            setCalendarsConfigured(null);
          }
        } else {
          setGoogleConnected(false);
          setCalendarsConfigured(null);
        }
      } catch (err) {
        console.error("Failed to fetch integration:", err);
        setGoogleConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        // Check cache first
        if (cache.calendarEvents && !isStale("calendarEvents")) {
          setThisWeekEvents(cache.calendarEvents.thisWeek);
          setNextWeekEvents(cache.calendarEvents.nextWeek);
          setGoogleConnected(true);
          return;
        }

        // Fetch calendar events
        const calendarResponse = await fetch("/api/calendar/dashboard-events");
        const calendarData = await calendarResponse.json();

        if (calendarData.error === "Google not connected") {
          setGoogleConnected(false);
        } else {
          const eventData = {
            thisWeek: calendarData.thisWeek ?? [],
            nextWeek: calendarData.nextWeek ?? [],
          };
          setThisWeekEvents(eventData.thisWeek);
          setNextWeekEvents(eventData.nextWeek);
          setCache("calendarEvents", eventData);
          setGoogleConnected(true);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setGoogleConnected(false);
      }
    };

    fetchIntegrationAndEvents();
    // Always fetch emails in background (no cache for freshness)
    fetchEmailsBackground();
  }, [cache, setCache, isStale, fetchEmailsBackground]);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const calendarResponse = await fetch("/api/calendar/dashboard-events");
      const calendarData = await calendarResponse.json();

      if (calendarData.error === "Google not connected") {
        setGoogleConnected(false);
      } else {
        const eventData = {
          thisWeek: calendarData.thisWeek ?? [],
          nextWeek: calendarData.nextWeek ?? [],
        };
        setThisWeekEvents(eventData.thisWeek);
        setNextWeekEvents(eventData.nextWeek);
        setCache("calendarEvents", eventData);
        setGoogleConnected(true);
      }
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
      setGoogleConnected(false);
    }
  }, [setCache]);

  const handleRefresh = useCallback(async () => {
    setIsReloading(true);
    await fetchCalendarEvents();
    setIsReloading(false);
  }, [fetchCalendarEvents]);

  const handleCalendarSelectionComplete = () => {
    setCalendarsConfigured(true);
    fetchCalendarEvents();
  };

  const handleReloadEvents = async () => {
    setIsReloading(true);
    try {
      // Fetch calendar events
      const calendarResponse = await fetch("/api/calendar/dashboard-events");
      const calendarData = await calendarResponse.json();

      if (calendarData.error === "Google not connected") {
        setGoogleConnected(false);
      } else {
        setThisWeekEvents(calendarData.thisWeek ?? []);
        setNextWeekEvents(calendarData.nextWeek ?? []);
        setGoogleConnected(true);
      }

      // Fetch Gmail messages
      try {
        const gmailResponse = await fetch("/api/gmail/inbox");
        const gmailData = await gmailResponse.json();

        if (gmailData.messages) {
          setGmailMessages(gmailData.messages);
        }
      } catch (err) {
        console.error("Failed to fetch Gmail messages:", err);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setGoogleConnected(false);
    } finally {
      setIsReloading(false);
    }
  };

  const showSkeleton = !minLoadDone || isLoading;

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <>
    <div className="p-[var(--space-8)] w-full h-screen overflow-hidden bg-[var(--color-bg-base)] grid grid-rows-2 gap-[var(--space-8)]">
      {/* Top Section - 2 Columns. Grid rows (not flex + h-1/2) so the two sections always
          get exactly half the available height each, however tall the viewport is —
          no percentage-of-an-ancestor's-auto-height math that can silently break. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-8)] min-h-0">
        {/* Dynamic Greeting - 1/2 width */}
        <div className="flex flex-col items-center justify-center h-full min-h-0 overflow-hidden gap-[var(--space-4)]">
          <p className="text-[var(--color-text-primary)] text-[clamp(32px,min(6vw,9vh),96px)] font-bold leading-tight text-center">
            {greeting.endsWith(",") ? (
              <>
                {greeting} <br />
                {userName}
              </>
            ) : (
              greeting
            )}
          </p>
          {quote && (
            <p className="text-[var(--color-text-muted)] text-[length:var(--text-base)] italic font-light max-w-lg text-center">
              "{quote.text}" — {quote.author}
            </p>
          )}
        </div>

        {/* Card 4: Calendar selection or events */}
        {calendarsConfigured === false ? (
          <CalendarSelection onComplete={handleCalendarSelectionComplete} />
        ) : (
          <div data-onboarding="appointments-card" className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col">
            <div className="flex flex-row gap-[var(--space-6)] h-full min-h-0">
              {/* This Week Column */}
              <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)]">
                <h3 className="text-[var(--color-text-primary)] text-[length:var(--text-lg)] font-semibold">This week</h3>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {isLoading || isReloading ? (
                    <div className="overflow-y-auto flex-1">
                      <SkeletonLoader />
                    </div>
                  ) : (() => {
                    const allThisWeek = getUpcomingEvents(thisWeekEvents);
                    const displayThisWeek = allThisWeek.slice(0, thisWeekFitCount);
                    const moreThisWeek = allThisWeek.length - displayThisWeek.length;

                    return displayThisWeek.length > 0 ? (
                      <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden" ref={thisWeekRef}>
                        {displayThisWeek.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                        {moreThisWeek > 0 && (
                          <p className="text-[length:var(--text-xs)] text-center text-[var(--color-text-muted)] mt-[var(--space-3)]">
                            +{moreThisWeek} more events this week
                          </p>
                        )}
                      </div>
                    ) : (
                      <NoEventsPlaceholder googleConnected={googleConnected} height="h-full" />
                    );
                  })()}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-[var(--color-border-default)]"></div>

              {/* Next Week Column */}
              <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[var(--color-text-primary)] text-[length:var(--text-lg)] font-semibold">Next week</h3>
                  <button
                    onClick={handleRefresh}
                    disabled={isReloading}
                    className="p-[var(--space-1)] hover:text-[var(--color-text-muted)] transition-colors duration-150 disabled:opacity-50"
                    style={{ color: "var(--color-text-disabled)" }}
                  >
                    <RefreshCw
                      size={16}
                      className={isReloading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {isLoading || isReloading ? (
                    <div className="overflow-y-auto flex-1">
                      <SkeletonLoader />
                    </div>
                  ) : (() => {
                    const allNextWeek = getUpcomingEvents(nextWeekEvents);
                    const displayNextWeek = allNextWeek.slice(0, nextWeekFitCount);
                    const moreNextWeek = allNextWeek.length - displayNextWeek.length;

                    return displayNextWeek.length > 0 ? (
                      <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden" ref={nextWeekRef}>
                        {displayNextWeek.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                        {moreNextWeek > 0 && (
                          <p className="text-[length:var(--text-xs)] text-center text-[var(--color-text-muted)] mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--color-bg-elevated)]">
                            +{moreNextWeek} more events next week
                          </p>
                        )}
                      </div>
                    ) : (
                      <NoEventsPlaceholder googleConnected={googleConnected} height="h-full" />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-8)] min-h-0">
        {/* Card 1: Gmail Inbox */}
        <GmailInbox />

        {/* Card 2: Priority Tasks */}
        <PriorityTasks />

        {/* Card 3: Daily Streak */}
        <DailyStreak />
      </div>
    </div>
    </>
  );
};
