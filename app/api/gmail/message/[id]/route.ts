import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";

const decodeBase64 = (str: string): string => {
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
};

const extractEmailBody = (payload: any): string => {
  if (!payload) return "";

  // If there's a direct body in the part
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }

  // If there are parts (multipart)
  if (payload.parts) {
    for (const part of payload.parts) {
      const mimeType = part.mimeType || "";

      // Prefer HTML, fallback to plain text
      if (mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      if (mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }

      // Recursively check nested parts
      if (part.parts) {
        const nestedBody = extractEmailBody(part);
        if (nestedBody) return nestedBody;
      }
    }
  }

  return "";
};

const getHeader = (headers: any[], name: string): string => {
  return headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
};

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

    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (!accessToken) {
      return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
    }

    console.log("📧 [GMAIL MESSAGE] Fetching message:", id);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("❌ [GMAIL MESSAGE] Gmail API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch message" },
        { status: 500 }
      );
    }

    const messageData = await response.json();
    const headers = messageData.payload?.headers ?? [];

    const subject = getHeader(headers, "Subject") || "(No subject)";
    const from = getHeader(headers, "From");
    const to = getHeader(headers, "To");
    const date = getHeader(headers, "Date");
    const body = extractEmailBody(messageData.payload);
    const isUnread = (messageData.labelIds ?? []).includes("UNREAD");

    console.log("✅ [GMAIL MESSAGE] Message fetched:", { subject, isUnread });

    return NextResponse.json({
      id: messageData.id,
      subject,
      from,
      to,
      date,
      body,
      isUnread,
      mimeType: messageData.payload?.mimeType,
    });
  } catch (error) {
    console.error("❌ [GMAIL MESSAGE] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}
