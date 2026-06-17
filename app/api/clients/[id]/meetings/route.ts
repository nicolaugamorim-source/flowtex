import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
      .select("name, company")
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

    // Search Calendar for events containing client name or company
    const searchQuery = client.company ? `${client.name} ${client.company}` : client.name;
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(searchQuery)}&singleEvents=true&orderBy=startTime&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const calendarData = await calendarResponse.json();
    const events = calendarData.items || [];

    const meetings = events.map((event: any) => ({
      id: event.id,
      title: event.summary || "Untitled",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      attendees: event.attendees?.length || 0,
    }));

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching client meetings:", error);
    return NextResponse.json({ meetings: [], error: "Failed to fetch meetings" }, { status: 200 });
  }
}
