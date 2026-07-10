import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

// Fetches and buckets the user's selected-calendar events into "this week" /
// "next week" for the dashboard's at-a-glance view.
export async function GET(request: NextRequest) {
  try {
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
    }

    console.log("[CALENDAR EVENTS] Fetching events for user:", user.id);

    // Get valid Google access token (refreshes if needed)
    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (!accessToken) {
      console.log("[CALENDAR EVENTS] Google not connected or token refresh failed");
      return NextResponse.json(
        { error: "Google not connected", thisWeek: [], nextWeek: [] },
        { status: 400 }
      );
    }

    console.log("[CALENDAR EVENTS] Got valid access token");

    // Get selected calendars from integrations table
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("selected_calendar_ids")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    if (integrationError) {
      console.log("[CALENDAR EVENTS] Failed to fetch integration");
      return NextResponse.json(
        { error: "Google not connected", thisWeek: [], nextWeek: [] },
        { status: 400 }
      );
    }

    // Get selected calendar IDs
    const selectedCalendarIds = integration.selected_calendar_ids ?? [];
    if (selectedCalendarIds.length === 0) {
      console.log("[CALENDAR EVENTS] No calendars selected");
      return NextResponse.json(
        { error: "No calendars selected", thisWeek: [], nextWeek: [] },
        { status: 400 }
      );
    }

    console.log("[CALENDAR EVENTS] Selected calendars:", selectedCalendarIds);

    // Calculate this week and next week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 13);
    nextSunday.setHours(23, 59, 59, 999);

    console.log("[CALENDAR EVENTS] Week boundaries:", {
      monday: monday.toISOString(),
      nextSunday: nextSunday.toISOString(),
    });

    // Fetch from Google Calendar API for all selected calendars
    const params = new URLSearchParams({
      timeMin: monday.toISOString(),
      timeMax: nextSunday.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "20",
    });

    console.log("[CALENDAR EVENTS] Fetching from Google Calendar API for all selected calendars");

    let allEvents: any[] = [];

    for (const calendarId of selectedCalendarIds) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.warn(`[CALENDAR EVENTS] Failed to fetch calendar ${calendarId}:`, response.status);
          continue;
        }

        const data = await response.json();
        const events = data.items ?? [];
        console.log(`[CALENDAR EVENTS] Fetched ${events.length} events from calendar ${calendarId}`);
        allEvents = allEvents.concat(events);
      } catch (err) {
        console.warn(`[CALENDAR EVENTS] Error fetching calendar ${calendarId}:`, err);
        continue;
      }
    }

    // Sort all events by start time
    const events = allEvents.sort((a: any, b: any) => {
      const aStart = new Date(a.start?.dateTime ?? a.start?.date).getTime();
      const bStart = new Date(b.start?.dateTime ?? b.start?.date).getTime();
      return aStart - bStart;
    });

    console.log("[CALENDAR EVENTS] Total events fetched:", events.length);

    // Split into this week and next week
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);

    const thisWeek = events.filter((e: any) => {
      const start = new Date(e.start?.dateTime ?? e.start?.date);
      return start >= monday && start < nextMonday;
    });

    const nextWeek = events.filter((e: any) => {
      const start = new Date(e.start?.dateTime ?? e.start?.date);
      return start >= nextMonday && start <= nextSunday;
    });

    console.log("[CALENDAR EVENTS] This week:", thisWeek.length, "events");
    console.log("[CALENDAR EVENTS] Next week:", nextWeek.length, "events");

    return NextResponse.json({ thisWeek, nextWeek });
  } catch (error) {
    console.error("[CALENDAR EVENTS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events", thisWeek: [], nextWeek: [] },
      { status: 500 }
    );
  }
}
