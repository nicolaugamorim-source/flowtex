import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Dev-only endpoint to manually set a user's streak count for testing.
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

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

    const { streak } = await request.json();

    console.log(`[STREAK DEBUG] Setting streak to ${streak} for user ${user.id}`);

    // Update streak directly in database
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("profiles")
      .update({
        streak_count: streak,
        last_active_date: today,
        longest_streak: streak,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Debug update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[STREAK DEBUG] Streak set to ${streak}`);

    return NextResponse.json({ success: true, streak });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Debug update failed" }, { status: 500 });
  }
}
