import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Removes/undoes a previously tracked activity entry for the authenticated user.
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
    const { date } = await request.json();
    const today = date || new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_activity")
      .select("action_count")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "No activity found for today" },
        { status: 404 }
      );
    }

    const newCount = Math.max(0, existing.action_count - 1);

    const { data, error } = await supabase
      .from("daily_activity")
      .update({
        action_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("date", today)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to remove action" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: newCount,
    });
  } catch (error) {
    console.error("Error removing action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
