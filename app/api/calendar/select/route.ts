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

    const body = await request.json();
    const { calendarIds } = body;

    console.log("📝 [CALENDAR SELECT] Calendar IDs to save:", calendarIds);
    console.log("📝 [CALENDAR SELECT] User ID:", user.id);

    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid calendar IDs" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("integrations")
      .update({
        selected_calendar_ids: calendarIds,
        calendars_configured: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("provider", "google")
      .select();

    console.log("📊 [CALENDAR SELECT] Update result:", data);
    console.log("❌ [CALENDAR SELECT] Update error:", error);

    if (error) {
      console.error("❌ [CALENDAR SELECT] Supabase error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [CALENDAR SELECT] Calendars saved successfully");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ [CALENDAR SELECT] Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
