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

    const { feedback, type } = await request.json();

    if (!feedback || !feedback.trim()) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    const userEmail = user.email || "";

    // Save feedback to database
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        email: userEmail,
        content: feedback.trim(),
        type: type || "general",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving feedback:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Feedback saved:", {
      id: data.id,
      user_id: data.user_id,
      email: data.email,
      type: data.type,
      content: data.content.substring(0, 50) + "...",
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback!",
      feedbackId: data.id,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
