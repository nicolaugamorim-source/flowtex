import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { decodeMimeHeader } from "@/lib/google-gmail";

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

    // Get client email
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("email")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client?.email) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get access token from localStorage/session
    const accessToken = request.headers.get("x-google-access-token");
    if (!accessToken) {
      return NextResponse.json({ emails: [], error: "No Gmail access token" }, { status: 200 });
    }

    // Search Gmail
    const gmailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=from:${encodeURIComponent(client.email)}+OR+to:${encodeURIComponent(client.email)}&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const gmailData = await gmailResponse.json();
    const messages = gmailData.messages || [];

    // Get full message details
    const emailPromises = messages.map((msg: any) =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json())
    );

    const emailDetails = await Promise.all(emailPromises);

    const emails = emailDetails.map((msg: any) => {
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value;

      return {
        id: msg.id,
        from: decodeMimeHeader(getHeader("From") || "Unknown"),
        subject: decodeMimeHeader(getHeader("Subject") || "(No subject)"),
        date: getHeader("Date") || "",
        snippet: msg.snippet || "",
        isUnread: msg.labelIds?.includes("UNREAD") || false,
      };
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching client emails:", error);
    return NextResponse.json({ emails: [], error: "Failed to fetch emails" }, { status: 200 });
  }
}
