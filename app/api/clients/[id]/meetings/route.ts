import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Returns calendar meetings associated with a specific client.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("name, company, email")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get access token
    const accessToken = request.headers.get("x-google-access-token");
    if (!accessToken) {
      return NextResponse.json({ meetings: [], error: "No Google Calendar access token" }, { status: 200 });
    }

    // Prefer the client's email — events.list's free-text search matches attendee
    // emails too, and the chat assistant links clients as attendees when creating
    // events, so this is a much more reliable match than searching the title text.
    const searchQuery = client.email || (client.company ? `${client.name} ${client.company}` : client.name);

    // The event may live in any calendar (e.g. "Trabalho"), not just primary, so
    // search across all of the user's calendars and merge the results.
    const calendarListResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calendarListData = await calendarListResponse.json();
    const calendarIds: string[] = (calendarListData.items || []).map((cal: any) => cal.id);

    const eventsPerCalendar = await Promise.all(
      calendarIds.map((calendarId) =>
        fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?q=${encodeURIComponent(searchQuery)}&singleEvents=true&orderBy=startTime&maxResults=10`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
          .then((r) => r.json())
          .then((data) => data.items || [])
          .catch(() => [])
      )
    );

    const events = eventsPerCalendar.flat();

    const meetings = events
      .map((event: any) => ({
        id: event.id,
        title: event.summary || "Untitled",
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        attendees: event.attendees?.length || 0,
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10);

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching client meetings:", error);
    return NextResponse.json({ meetings: [], error: "Failed to fetch meetings" }, { status: 200 });
  }
}
