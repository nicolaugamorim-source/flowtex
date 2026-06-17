import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
    const { action_type, count = 1, date } = await request.json();

    if (!action_type) {
      return NextResponse.json(
        { error: "action_type is required" },
        { status: 400 }
      );
    }

    const today = date || new Date().toISOString().split("T")[0];

    // Use RPC function to increment activity atomically
    const { data, error } = await supabase.rpc('increment_activity', {
      p_user_id: userId,
      p_date: today,
      p_count: count,
    });

    if (error) {
      console.error("❌ Activity tracking error:", error);
      return NextResponse.json(
        { error: "Failed to track activity" },
        { status: 500 }
      );
    }

    console.log(`✅ Activity tracked: ${action_type} (+${count} for user ${userId})`);

    return NextResponse.json({
      success: true,
      action_type,
      date: today,
      count,
    });
  } catch (error) {
    console.error("❌ Error tracking activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
