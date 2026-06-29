import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";
import { decodeMimeHeader } from "@/lib/google-gmail";

// Returns a page of the authenticated user's Gmail inbox.
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (!accessToken) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Encoding": "gzip",
    };

    // Parallel requests for dashboard card: 4 unread + total count
    const [unreadRes, labelRes] = await Promise.all([
      // Request 1: Get first 4 unread messages
      fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?" +
          "maxResults=4&labelIds=UNREAD&labelIds=INBOX&fields=messages(id,snippet)&q=is:unread",
        { headers }
      ),
      // Request 2: Get total unread count
      fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX?fields=messagesUnread",
        { headers }
      ),
    ]);

    const safeJson = async (res: Response) => {
      if (res.status === 204) return {};
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    };

    const [unreadData, labelData] = await Promise.all([
      safeJson(unreadRes),
      safeJson(labelRes),
    ]);

    const messageIds = (unreadData.messages ?? []).map((m: any) => m.id);
    const totalUnread = labelData.messagesUnread ?? 0;

    if (messageIds.length === 0) {
      return NextResponse.json({ messages: [], totalUnread });
    }

    // Fetch only the 4 messages in parallel
    // Use fields to reduce payload from 40KB to 2KB per message
    const messageDetails = await Promise.all(
      messageIds.map((id: string) =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?` +
            "format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&" +
            "fields=id,labelIds,snippet,payload/headers",
          { headers }
        ).then((r) => r.json())
      )
    );

    const getHeader = (headers: any[], name: string): string => {
      return (
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
      );
    };

    const messages = messageDetails.map((message: any) => {
      const msgHeaders = message.payload?.headers ?? [];
      const from = decodeMimeHeader(getHeader(msgHeaders, "From"));
      const senderName = from.includes("<")
        ? from.split("<")[0].trim().replace(/"/g, "")
        : from.split("@")[0];

      const date = getHeader(msgHeaders, "Date");
      const parsedDate = new Date(date);
      const now = new Date();
      const isToday = parsedDate.toDateString() === now.toDateString();
      const formattedDate = isToday
        ? parsedDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        id: message.id,
        sender: senderName || "Unknown",
        subject: decodeMimeHeader(getHeader(msgHeaders, "Subject")) || "(No subject)",
        date: formattedDate,
        isUnread: (message.labelIds ?? []).includes("UNREAD"),
      };
    });

    return NextResponse.json({
      messages,
      totalUnread,
    });
  } catch (error) {
    console.error("[GMAIL INBOX] Error:", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}
