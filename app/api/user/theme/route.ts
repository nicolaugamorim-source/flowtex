import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Persists the authenticated user's theme preference (light/dark) to their profile.
export async function PATCH(request: NextRequest) {
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

    const { theme } = await request.json();

    if (!theme || !["light", "dark"].includes(theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ theme })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating theme:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }
}
