import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";
import { deleteEmail } from "@/lib/google-gmail";

// Deletes a Gmail message for the authenticated user.
export async function POST(request: NextRequest) {
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
      console.error("[DELETE EMAIL] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      console.error("[DELETE EMAIL] Missing messageId");
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const accessToken = await getValidGoogleToken(supabase, user.id);

    if (!accessToken) {
      console.error("[DELETE EMAIL] Failed to get valid Google token");
      return NextResponse.json(
        { error: "Gmail not connected or token refresh failed" },
        { status: 400 }
      );
    }

    console.log(`[DELETE EMAIL] Deleting message ${messageId} for user ${user.id}`);

    await deleteEmail(accessToken, messageId);

    console.log(`[DELETE EMAIL] Successfully deleted message: ${messageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE EMAIL] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
