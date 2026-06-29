import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Lists the user's Google calendars (for the calendar-selection onboarding step).
export async function GET() {
  try {
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

    console.log("[CALENDAR LIST] Fetching calendars for user:", user.id);

    // Get Google access token from integrations table
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    if (integrationError || !integration?.access_token) {
      console.log("[CALENDAR LIST] Google not connected");
      return NextResponse.json(
        { error: "Google not connected", calendars: [] },
        { status: 400 }
      );
    }

    console.log("[CALENDAR LIST] Google integration found");

    // Fetch from Google Calendar API
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("[CALENDAR LIST] Google API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch calendars", calendars: [] },
        { status: 500 }
      );
    }

    const data = await response.json();
    const calendars = data.items ?? [];

    console.log("[CALENDAR LIST] Calendars found:", calendars.length);

    // Map calendars to required fields
    const mappedCalendars = calendars.map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      backgroundColor: cal.backgroundColor,
      primary: cal.primary ?? false,
      accessRole: cal.accessRole,
    }));

    return NextResponse.json({ calendars: mappedCalendars });
  } catch (error) {
    console.error("[CALENDAR LIST] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendars", calendars: [] },
      { status: 500 }
    );
  }
}
