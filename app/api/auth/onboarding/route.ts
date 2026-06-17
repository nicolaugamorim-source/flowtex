import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const {
      full_name,
      business_name,
      business_type,
      industry,
      clients_description,
      business_brief,
      tools_used,
      onboarding_completed,
    } = await request.json();

    console.log("🔐 [ONBOARDING] Starting onboarding save...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Create SSR client that reads cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
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
    });

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ [ONBOARDING] Auth error:", authError);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    console.log("👤 [ONBOARDING] User ID:", userId);

    // Update profile with onboarding data
    console.log("📝 [ONBOARDING] Updating profile with onboarding data...");

    const profileUpdateData: any = {
      full_name,
      business_name,
      business_type,
      onboarding_completed,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields with correct column names
    if (industry) profileUpdateData.industry = industry;
    if (business_brief) profileUpdateData.business_brief = business_brief;
    if (tools_used) profileUpdateData.main_tools = tools_used;
    if (clients_description) profileUpdateData.target_clients = clients_description;

    console.log("📊 [ONBOARDING] Profile data:", JSON.stringify(profileUpdateData, null, 2));

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("❌ [ONBOARDING] Profile update error:", updateError);
      throw updateError;
    }

    console.log("✅ [ONBOARDING] Profile updated successfully");
    console.log("📊 [ONBOARDING] Updated data:", updateData);

    // Also update AI context with business brief
    if (business_brief) {
      console.log("📝 [ONBOARDING] Updating AI context...");

      const { error: aiError } = await supabase
        .from("ai_context")
        .update({
          business_brief,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (aiError) {
        console.warn("⚠️ [ONBOARDING] Failed to update AI context:", aiError);
        // Don't fail the whole request if AI context update fails
      } else {
        console.log("✅ [ONBOARDING] AI context updated");
      }
    }

    console.log("✅ [ONBOARDING] Onboarding completed successfully");

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
    });
  } catch (error) {
    console.error("❌ [ONBOARDING] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
