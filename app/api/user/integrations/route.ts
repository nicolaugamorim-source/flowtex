import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Returns the authenticated user's connected integrations (Google, Notion, etc.).
export async function GET() {
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

    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching integrations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integrations: integrations ?? [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}
