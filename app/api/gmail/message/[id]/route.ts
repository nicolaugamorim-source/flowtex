import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";
import { decodeMimeHeader } from "@/lib/google-gmail";

const decodeBase64 = (str: string): string => {
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
};

const extractEmailBody = (payload: any): { body: string; mimeType: string } => {
  if (!payload) return { body: "", mimeType: "text/plain" };

  // If there's a direct body in the part
  if (payload.body && payload.body.data) {
    return { body: decodeBase64(payload.body.data), mimeType: payload.mimeType || "text/plain" };
  }

  // If there are parts (multipart) - prefer HTML, fallback to plain text
  if (payload.parts) {
    let plainTextResult: { body: string; mimeType: string } | null = null;

    for (const part of payload.parts) {
      const mimeType = part.mimeType || "";

      if (mimeType === "text/html" && part.body?.data) {
        return { body: decodeBase64(part.body.data), mimeType: "text/html" };
      }
      if (mimeType === "text/plain" && part.body?.data && !plainTextResult) {
        plainTextResult = { body: decodeBase64(part.body.data), mimeType: "text/plain" };
      }

      // Recursively check nested parts (multipart/alternative, multipart/related, etc)
      if (part.parts) {
        const nestedResult = extractEmailBody(part);
        if (nestedResult.mimeType === "text/html" && nestedResult.body) {
          return nestedResult;
        }
        if (nestedResult.body && !plainTextResult) {
          plainTextResult = nestedResult;
        }
      }
    }

    if (plainTextResult) return plainTextResult;
  }

  return { body: "", mimeType: "text/plain" };
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

    const subject = decodeMimeHeader(getHeader(headers, "Subject")) || "(No subject)";
    const from = decodeMimeHeader(getHeader(headers, "From"));
    const to = getHeader(headers, "To");
    const date = getHeader(headers, "Date");
    const { body, mimeType } = extractEmailBody(messageData.payload);
    const isUnread = (messageData.labelIds ?? []).includes("UNREAD");

    console.log("✅ [GMAIL MESSAGE] Message fetched:", { subject, isUnread, mimeType });

    return NextResponse.json({
      id: messageData.id,
      subject,
      from,
      to,
      date,
      body,
      isUnread,
      mimeType,
    });
  } catch (error) {
    console.error("❌ [GMAIL MESSAGE] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}
