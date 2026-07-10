import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getValidGoogleToken } from "@/lib/google-auth";
import { decodeMimeHeader } from "@/lib/google-gmail";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generates an AI-written insight/summary about a client from their recent
// emails, using the Anthropic API.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

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

    const { data: clientRow, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (clientError || !clientRow) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    // Gather context: recent emails and meetings, same lookup logic as the Emails/Meetings tabs.
    let emailsSummary = "No emails on record.";
    let meetingsSummary = "No meetings on record.";

    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (accessToken) {
      const searchQuery = clientRow.email || [clientRow.name, clientRow.company].filter(Boolean).join(" ");

      try {
        const gmailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
            clientRow.email ? `from:${clientRow.email} OR to:${clientRow.email}` : searchQuery
          )}&maxResults=8`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const gmailData = await gmailResponse.json();
        const messageIds = (gmailData.messages || []).map((m: any) => m.id);

        if (messageIds.length > 0) {
          const details = await Promise.all(
            messageIds.map((msgId: string) =>
              fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              })
                .then((r) => r.json())
                .catch(() => null)
            )
          );

          const lines = details
            .filter(Boolean)
            .map((msg: any) => {
              const headers = msg.payload?.headers || [];
              const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || "";
              const subject = decodeMimeHeader(getHeader("Subject")) || "(no subject)";
              const date = getHeader("Date") || "";
              return `- "${subject}" (${date}): ${(msg.snippet || "").slice(0, 150)}`;
            });

          if (lines.length > 0) {
            emailsSummary = lines.join("\n");
          }
        }
      } catch (error) {
        console.log("Could not fetch emails for client insight");
      }

      try {
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
        if (events.length > 0) {
          meetingsSummary = events
            .map((e: any) => `- "${e.summary || "Untitled"}" on ${e.start?.dateTime || e.start?.date}`)
            .join("\n");
        }
      } catch (error) {
        console.log("Could not fetch meetings for client insight");
      }
    }

    const prompt = `Client: ${clientRow.name}${clientRow.company ? ` (${clientRow.company})` : ""}
Status: ${clientRow.status}
Notes: ${clientRow.notes || "None"}
Client since: ${new Date(clientRow.created_at).toLocaleDateString()}

Recent emails:
${emailsSummary}

Recent/upcoming meetings:
${meetingsSummary}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      system: `You are a business advisor analyzing a single client relationship for a solopreneur/small business owner. Based on the data given (notes, email activity, meeting activity), write a short, blunt assessment covering:
1. How this relationship is going (e.g. high-effort/low-value, low-effort/high-value, healthy, going cold, at risk) — make a real call, don't hedge with "it depends".
2. One concrete suggested next action.
Plain text, no markdown headers or bullet symbols, 3-4 sentences max. Tone: direct, semi-formal, no emojis. Respond in English.`,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content[0];
    const insight = textBlock && "text" in textBlock ? textBlock.text.trim() : "Could not generate an insight.";

    const generatedAt = new Date().toISOString();

    await supabase
      .from("clients")
      .update({ ai_insight: insight, ai_insight_generated_at: generatedAt })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ insight, generated_at: generatedAt });
  } catch (error) {
    console.error("Error generating client insight:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
