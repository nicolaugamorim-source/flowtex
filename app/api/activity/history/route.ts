import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Returns the authenticated user's activity log (used for the streak/activity feed).
export async function GET(request: NextRequest) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const today = new Date();
    const currentYear = today.getFullYear();
    const jan1 = new Date(currentYear, 0, 1).toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_activity")
      .select("date, action_count")
      .eq("user_id", userId)
      .gte("date", jan1)
      .lte("date", todayStr)
      .order("date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch activity history" },
        { status: 500 }
      );
    }

    const activityMap: Record<string, number> = {};
    if (data) {
      data.forEach((record) => {
        activityMap[record.date] = record.action_count;
      });
    }

    return NextResponse.json({
      success: true,
      history: activityMap,
    });
  } catch (error) {
    console.error("Error fetching activity history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
