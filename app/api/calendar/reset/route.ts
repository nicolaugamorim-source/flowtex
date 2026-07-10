import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

// Clears the user's selected-calendars configuration (e.g. to redo calendar setup).
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset calendars_configured to false
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        calendars_configured: false,
        selected_calendar_ids: [],
      })
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (updateError) {
      console.error("[CALENDAR RESET] Update error:", updateError);
      throw updateError;
    }

    console.log("[CALENDAR RESET] Calendar configuration reset");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CALENDAR RESET] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset calendar configuration" },
      { status: 500 }
    );
  }
}
