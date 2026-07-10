import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

// Marks a Gmail message as read for the authenticated user.
export async function POST(request: NextRequest) {
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
      console.error("[MARK READ] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      console.error("[MARK READ] Missing messageId");
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    console.log(`[MARK READ] Marking message ${messageId} as read for user ${user.id}`);

    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (!accessToken) {
      console.error("[MARK READ] Failed to get valid Google token");
      return NextResponse.json(
        { error: "Gmail not connected or token refresh failed" },
        { status: 400 }
      );
    }

    console.log(`[MARK READ] Got valid access token`);

    const modifyBody = {
      removeLabelIds: ["UNREAD"],
    };

    console.log(`[MARK READ] Calling Gmail API to modify message ${messageId}`);

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modifyBody),
      }
    );

    console.log(`[MARK READ] Gmail API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[MARK READ] Gmail API error: ${response.status}`,
        errorText
      );
      return NextResponse.json(
        { error: `Gmail API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[MARK READ] Successfully marked message as read: ${messageId}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[MARK READ] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
