import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { captureServerEvent } from "@/lib/posthog-server";

// Saves the data collected during the onboarding flow to the user's profile
// and marks onboarding as complete.
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

    console.log("[ONBOARDING] Starting onboarding save...");

    // The client already requires these before letting the user reach step 2,
    // but that's just UX — nothing stops a direct POST here from marking an
    // account "onboarded" with blank required fields, so enforce it again.
    if (onboarding_completed) {
      const missing = ["full_name", "business_name", "business_type"].filter(
        (key) => typeof ({ full_name, business_name, business_type } as Record<string, unknown>)[key] !== "string" ||
          !({ full_name, business_name, business_type } as Record<string, string>)[key].trim()
      );
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required field(s): ${missing.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (typeof business_name === "string" && business_name.length > 100) {
      return NextResponse.json(
        { error: "Business name must be 100 characters or fewer" },
        { status: 400 }
      );
    }

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
      console.error("[ONBOARDING] Auth error:", authError);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    console.log("[ONBOARDING] User ID:", userId);

    // Update profile with onboarding data
    console.log("[ONBOARDING] Updating profile with onboarding data...");

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

    console.log("[ONBOARDING] Profile data:", JSON.stringify(profileUpdateData, null, 2));

    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("[ONBOARDING] Profile update error:", updateError);
      throw updateError;
    }

    console.log("[ONBOARDING] Profile updated successfully");
    console.log("[ONBOARDING] Updated data:", updateData);

    // Also update AI context with business brief
    if (business_brief) {
      console.log("[ONBOARDING] Updating AI context...");

      const { error: aiError } = await supabase
        .from("ai_context")
        .update({
          business_brief,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (aiError) {
        console.warn("[ONBOARDING] Failed to update AI context:", aiError);
        // Don't fail the whole request if AI context update fails
      } else {
        console.log("[ONBOARDING] AI context updated");
      }
    }

    console.log("[ONBOARDING] Onboarding completed successfully");

    if (onboarding_completed) {
      await captureServerEvent(userId, "onboarding_completed", { business_type });
    }

    const updatedProfile = updateData?.[0];

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
      subscription_status: updatedProfile?.subscription_status ?? null,
      trial_ends_at: updatedProfile?.trial_ends_at ?? null,
    });
  } catch (error) {
    console.error("[ONBOARDING] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
